import Em from 'ember';

var drag = {
    photo: null,
    position: null
};

function diff(lower,higher){
    if (lower.eq(higher)){
        return lower;
    }
    return higher.minus(lower).div(2).add(lower);
}

export default Em.Component.extend({
    tagName: 'div',
    attributeBindings: ['draggable','photo_id:data-photo'],
    draggable: function() {

        if (this.get('photo.selected') === true || this.get('selection_mode') === 0){
            return true;
        }

        return false;

    }.property('photo.selected','selection_mode'),
    photo_id: function() {
        return this.get('photo.id');
    }.property('photo.id'),
    classNameBindings: [':photo', 'context.photo.saving:', 'highlight-right:', 'highlight-left:','photo.selected:selected'],
    get_img_url: function (long_edge_width) {
        return this.get('photo.serving_url') + '=s' + (+long_edge_width).toFixed(0);
    },
    click: function(e){
        var selection = this.get('selection_mode') > 0;
        if (Em.$(e.target).hasClass('photo') === true) {

            if (selection === true) {
                this.toggleProperty('photo.selected');
            } else {
                this.sendAction('transition',this.get('photo'));
            }

        }
        return false;

    },
    background_img: function (width, height) {

        var long_edge = Math.min(1600, Math.max(width, height)),
            img_src = this.get_img_url(long_edge);

            this.$().css({'background-image': 'url(' + img_src + ')'});
        return img_src;
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

        this.set('photo._loaded',this.background_img(w, h));

    }.observes('photo.display_sz').on('didInsertElement'),
    dragStart: function () {
        drag['photo'] = this.get('photo');
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

        var album = this.get('album.arrangedContent'),
            photo = drag.photo,
            new_pos = null,
            prev = null,
            target = this.get('photo'),
            pos = drag.position;

        this.set('highlight-left', false);
        this.set('highlight-right', false);

        if (photo == target){
            return;
        }

        if (pos === 'before'){
            album.forEach(function(_){
                if (target === _){
                    if (prev === null){
                        //Must have dropped at the start of the photos
                        new_pos = diff(Big(0), target.get('pos')) ;
                    } else {
                        if (prev !== photo){
                            new_pos = diff(prev.get('pos'),target.get('pos'));
                        } else {
                            new_pos = prev.get('pos');
                        }
                    }
                }
                prev = _;
            });

        } else if (pos === 'after'){
            album.forEach(function(_){
                if (prev === true){
                    if (_ !== photo){
                        new_pos = diff(target.get('pos'),_.get('pos'));
                    } else {
                        new_pos = _.get('pos');
                    }
                    prev = false;
                }
                if (_===target){
                    prev = true;
                }
            });
            if (new_pos === null){
                new_pos = target.get('pos').add(Big("0.001"));
            }
        }
        console.log(photo.get('pos').toString(),new_pos.toString());
        photo.set('pos',new_pos);

    },
    actions: {
        selection: function() {
            this.toggleProperty('photo.selected');
        }
    }
});


