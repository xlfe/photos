import Em from 'ember';

export default Em.ObjectController.extend({
    needs: ['album'],
    preload: function(photo) {
        photo.get_image(1600);
    },
    go_photo: function(idx){
        var new_photo = this.get_photo(idx);
        this.replaceRoute('album.show', new_photo);

        for (var i=1; i<=2; i++) {
            this.preload(this.get_photo(idx+i));
            this.preload(this.get_photo(idx-i));
        }
    },
    get_photo: function (idx) {
        var photo = this.get('model'),
            album = this.get('controllers.album.arrangedContent'),
            current_idx = album.indexOf(photo),
            new_idx = current_idx + idx;

        if (new_idx >= album.length) {
            new_idx = 0;
        } else if (new_idx < 0) {
            new_idx = album.length - 1;
        }

        return album.objectAt(new_idx);
    }
});

