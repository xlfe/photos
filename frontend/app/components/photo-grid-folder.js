import PGPC from '../components/photo-grid-photo';

export default PGPC.extend({
    classNameBindings: [':folder'],
    //get_img_url: function (long_edge_width) {
    //    return this.get('photo.serving_url') + '=s' + (+long_edge_width).toFixed(0);
    //},

    background_img: function (width, height) {
        console.log('folder')

        var long_edge = Math.min(1600, Math.max(width, height)),
            img_src = this.get_img_url(long_edge);

        //this.$().css({'background-image': 'url(' + img_src + ')'});
    },
    setup: function() {
        var sz = this.get('folder.display_sz'),
            w = sz[0],
            h = sz[1];

        this.$().css({
            height: h + 'px',
            width:  w + 'px'
        });
    }.observes('folder.display_sz').on('didInsertElement')
});
