import Em from 'ember';

export default Em.Route.extend({
    renderTemplate: function () {
        var c = this.get('controller');

        this.render('album-menu', {
            into: 'application',
            outlet: 'menu',
            controller: c
        });

        this.render();
    },
    model: function (params) {
        var store = this.get('store'),
            query_params = {
                'limit':50,
                'order_by': '-pos',
                'q': "album=KEY('" + params.album_id + "')"
            };

        var get_more = function(album,photos) {

            var more_results = photos.get('meta.next_results_url');

            if (Em.isPresent(more_results)) {
                album.set('more_results',true);

                query_params['cursor'] = more_results;
                query_params['limit'] = query_params['limit'] * 2;

                store.find('photo',query_params).then(function(more){
                    album.get('photos.content').pushObjects(more.get('content'));
                    get_more(album,more);
                });
            } else {
                album.set('more_results',false);
            }

        };

        return new Em.RSVP.Promise(function(resolve,reject){

            store.find('album', params.album_id).then(function (album) {

                //Only reload photos if we need to...
                if (Em.isEmpty(album.get('photos'))) {
                    store.find('photo', query_params).then(function (photos) {
                        album.set('photos', photos);
                        get_more(album,photos);
                        resolve(album);
                    });
                } else {
                    resolve(album);
                }
            });
        });
    }
});
