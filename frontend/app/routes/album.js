import Em from 'ember';
import PhotosController from '../controllers/photos';

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
    //setupController: function (controller, model) {
    //    controller.set('model', model);
    //
    //    return controller;
    //},
    model: function (params) {
        var store = this.get('store');


        return new Em.RSVP.Promise(function(resolve,reject){

            store.find('album', params.album_id).then(function (album) {

                store.find('photo', {'album[]': album.get('id')}).then(function (photos) {

                    var p = PhotosController.create({
                        content: photos || [],
                        current_path: params.path,
                        album: album
                    });
                    p.update_sort();
                    album.set('photos', p);
                    resolve(album);
                });
            });
        });
    }
});
