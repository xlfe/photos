import Em from 'ember';

export default Em.ObjectController.extend({
    needs: ['album'],
    go_photo: function (idx) {
        var photo = this.get('model'),
            album = this.get('controllers.album').get('model.photos.arrangedContent'),
            current_idx = album.indexOf(photo),
            new_idx = current_idx + idx;

        if (new_idx >= album.length) {
            new_idx = 0;
        } else if (new_idx < 0) {
            new_idx = album.length - 1;
        }

        this.transitionToRoute('album.show', album.objectAt(new_idx));
    }
});

