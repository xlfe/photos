import Em from 'ember';
/* global Big */

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

            //The item we're draggin
            photo = drag.photo,

            //Where we've dropped the photo
            target = this.get('photo'),

            //Before or after?
            pos = drag.position,

            idx_p = album.indexOf(photo),
            idx_t = album.indexOf(target),

            lower = null,
            upper = null,

            multi = !Em.isEmpty(this.get('album.selected'));

        this.set('highlight-left', false);
        this.set('highlight-right', false);

        if (photo === target){
            return;
        }

        //clog(pos,'photo',idx_p,'target',idx_t,'length',album.length);

        if (pos === 'before') {

            if (album.objectAt(idx_t -1) === photo){
                //clog("NO MOVE");
                return;
            }

            upper = target.get('pos');
            if (idx_t === 0) {
                //at the start
                lower = new Big(0);
            } else {
                lower = album.objectAt(idx_t - 1).get('pos');
            }

        } else {


            if (album.objectAt(idx_t +1) === photo){
                //clog("NO MOVE");
                return;
            }

            lower = target.get('pos');
            if (idx_t === album.length -1) {
                //at the end
                upper = lower.add(new Big("1"));
            } else {
                upper = album.objectAt(idx_t +1).get('pos');
            }
        }

        if (upper.eq(lower)){
            //clog("no move");
            return;
        }

        if (multi){
            var photos = this.get('album.selected'),
                interval = upper.minus(lower).div(2).div(photos.length);

            photos.forEach(function(p){
                p.set('pos',lower.add(interval));
                lower = lower.add(interval);
            });

            //clog('moved ',photos.length,'photos');

        } else {
            var new_pos = diff(lower, upper);
            //clog("moved one photo to",new_pos.toString());
            photo.set('pos',new_pos);
        }

    },
    actions: {
        selection: function() {
            this.toggleProperty('photo.selected');
        }
    }
});


