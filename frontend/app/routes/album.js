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
    setupController: function (controller, model) {
        controller.set('model', model);
        this.get('store').find('photo', {'album[]': model.get('id')}).then(function (photos) {

            var p = PhotosController.create({
                content: photos,
                current_path: controller.get('path'),
                album: model
            });
            p.update_sort();
            model.set('photos', p);

            if (photos.get('content.length') === 0) {
                controller.send('openModalModel', 'upload-modal', model);
            }

        });
        return controller;
    },
    model: function (params) {
        return this.get('store').find('album', params.album_id);
    }
});
