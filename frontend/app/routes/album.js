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
        var store = this.get('store');

        return new Em.RSVP.Promise(function(resolve,reject){

            store.find('album', params.album_id).then(function (album) {

                store.find('photo', {'album[]': album.get('id')}).then(function (photos) {
                    album.set('photos', photos);
                    resolve(album);
                });
            });
        });
    }
});
