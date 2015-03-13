import Em from 'ember';
import PhotosController from '../../controllers/photos';

export default Em.Route.extend({
    model: function () {
        return this.get('store').find('album');
    },
    actions: {
        new_album: function () {
            var name = prompt('New album name?'),
                _this = this;

            if (Em.$.trim(name).length === 0) {
                return;
            }

            this.get('store').createRecord('album', {
                name: name,
                minHeight: 320,
                sortProperties: 'uploaded',
                sortAscending: true
            }).save().then(function (_) {

                var p = PhotosController.create({
                    content: [],
                    current_path: null,
                    album: _
                });
                p.update_sort();
                _.set('photos', p);
                _this.transitionTo('album', _);
            });
        }
    }
});

