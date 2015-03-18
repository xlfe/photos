import Em from 'ember';

var drag = {
    dragging: null,
    position: null
};

export default Em.Component.extend({
    tagName: 'div',
    attributeBindings: ['draggable'],
    draggable: "true",
    classNameBindings: [':photo', 'context.photo.saving:', 'highlight-right:', 'highlight-left:'],
    get_img_url: function (long_edge_width) {
        return this.get('photo.serving_url') + '=s' + (+long_edge_width).toFixed(0);
    },
    background_img: function (width, height) {

        var long_edge = Math.min(1600, Math.max(width, height)),
            img_src = this.get_img_url(long_edge);

            this.$().css({'background-image': 'url(' + img_src + ')'});
    },
    setup: function () {
        var sz = this.get('photo.display_sz');

        if (Em.isNone(sz)){
            return;
        }

        var
            w = sz[0],
            h = sz[1];

        this.$().css({
            height: h + 'px',
            width: w + 'px'
        });

        this.background_img(w, h);

    }.observes('photo.display_sz').on('didInsertElement'),
    dragStart: function () {
        drag['dragging'] = this.get('photo.pos');
    },
    dragOver: function (evt) {
        var left = evt.target.offsetLeft,
            width = evt.target.offsetWidth,
            mouseX = evt.originalEvent.clientX;

        if (mouseX > left + width / 2) {
            this.set('highlight-left', false);
            this.set('highlight-right', true);
            drag['position'] = 'after';
        } else {
            this.set('highlight-left', true);
            this.set('highlight-right', false);
            drag['position'] = 'before';
        }
        evt.preventDefault();
    },
    dragLeave: function () {
        this.set('highlight-left', false);
        this.set('highlight-right', false);
    },
    drop: function () {

        var ms = this.get('album.manualSort');

        if (Em.isEmpty(ms)){
            console.log("Its empty");
            this.sendAction('new_sort');
        }

        if (this.get('photo.pos') !== drag['dragging']){

            //Remove the item we just dragged
            ms.removeObject(drag['dragging']);

            //New offset
            var offset = ms.indexOf(this.get('photo.pos'));

            if (drag['position'] === 'after') {
                offset += 1;
            }

            ms.insertAt(offset, drag['dragging']);
            this.get('album').save();
        }

        this.set('highlight-left', false);
        this.set('highlight-right', false);
    }
});


