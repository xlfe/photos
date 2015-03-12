import PGPC from 'photo-grid-photo';

export default PGPC.extend({
    classNameBindings: [':folder'],
    setup: function() {
        var sz = this.get('folder.display_sz'),
            w = sz[0],
            h = sz[1];

        this.$().css({
            height: h + 'px',
            width:  w + 'px'
        });


    }.observes('photo.display_sz').on('didInsertElement'),
    actions: {
        click: function(){
            var album = this.get('album'),
                photos = album.get('photos'),
                //cp = photos.get('current_path') || '',
                fn = this.get('folder.name');
            photos.set('current_path',fn );
        }
    }
});
