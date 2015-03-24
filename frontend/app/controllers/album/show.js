import Em from 'ember';

export default Em.Controller.extend({
    needs: ['album'],
    go_photo: function(idx){
        var new_photo = this.get_photo(idx);
        this.replaceRoute('album.show', new_photo);
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

