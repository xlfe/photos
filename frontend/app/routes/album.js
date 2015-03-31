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
                'limit':100,
                'order_by': 'path,pos',
                'q': "album=KEY('" + params.album_id + "')"
            };

        var get_more = function(album,photos) {

            var more_results = photos.get('meta.next_results_url');

            if (Em.isPresent(more_results)) {
                album.set('more_results',true);

                query_params['cursor'] = more_results;
                //query_params['limit'] = query_params['limit'] * 2;

                store.find('photo',query_params).then(function(more){
                    //album.get('photos.content').pushObjects(more.get('content'));
                    get_more(album,more);
                });
            } else {
                album.set('more_results',false);
            }

        };

        return new Em.RSVP.Promise(function(resolve,reject){

            store.find('album', params.album_id).then(function (album) {

                album.set('photos', store.filter('photo',function(p){
                    if(p.get('album') === params.album_id) {
                        if (p.get('currentState.isLoading') === true || p.get('currentState.isDeleted') === true) {
                            return false;
                        }
                        return true;
                    }
                    return false;
                }));

                //Only reload photos if we need to...
                if (Em.isEmpty(album.get('photos'))) {
                    store.find('photo', query_params).then(function (photos) {
                        if (Em.isEmpty(photos)){
                            album.set('more_results',false);
                        }
                        get_more(album,photos);
                    });
                } else {
                    album.set('more_results',false);
                }

                resolve(album);
            },
                function(error){
                    reject(error);
                });
        });
    },
    actions: {
        error: function(error,transition) {

            alert('Sorry you do not have permission to view that album');

            transition.abort();
            this.transitionTo('login')
            return false;

        }
    }
});
