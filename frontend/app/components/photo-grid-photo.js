import Em from 'ember';
/* global Big */

function diff(lower,higher){
    if (lower.eq(higher)){
        return lower;
    }
    return higher.minus(lower).div(2).add(lower);
}

export default Em.Component.extend({
    tagName: 'div',
    classNameBindings: [
        ':photo',
        'photo._saving:saving',
        'highlight-right:',
        'highlight-left:',
        'photo.selected:selected',
        'photo.hasFocus:hasFocus'
    ],
    attributeBindings: ['draggable','photo_id:data-photo'],
    idx: function(){
        "use strict";
        return +this.get('_idx')+1;
    }.property('_idx'),
    draggable: function() {

        if (this.get('album.permissions.sort') !== true){
            return false;
        }

        if (this.get('photo.selected') === true || this.get('selection_mode') === 0){
            return true;
        }

        return false;

    }.property('photo.selected','selection_mode','album.permissions.sort'),
    photo_id: function() {
        return this.get('photo.id');
    }.property('photo.id'),
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
    setup: function () {

        var w = this.get('photo.display_w'),
            h = this.get('photo.display_h');

        if (Em.isNone(w) || Em.isNone(h)){
            return;
        }

        var
            img = this.$(),
            url = this.get('photo').get_image(Math.max(w,h),img);

        this.$().css({
            height: h + 'px',
            width: w + 'px',
            'background-image': 'url(' + url + ')'
        });

    }.observes('photo.display_h','photo.display_w').on('didInsertElement'),
    dragStart: function () {
        this.get('album').set('drag.photo',this.get('photo'));
    },
    dragOver: function (evt) {
        var left = evt.target.offsetLeft,
            width = evt.target.offsetWidth,
            mouseX = evt.originalEvent.clientX,
            album = this.get('album');

        if (mouseX > left + width / 2) {
            this.set('highlight-left', false);
            this.set('highlight-right', true);
            album.set('drag.position','after');
        } else {
            this.set('highlight-left', true);
            this.set('highlight-right', false);
            album.set('drag.position','before');
        }
        evt.preventDefault();
    },
    dragLeave: function () {
        this.set('highlight-left', false);
        this.set('highlight-right', false);
    },
    drop: function () {

        var
            //album controller
            album = this.get('album.arrangedContent'),

            //The item we're draggin
            photo = this.get('album.drag.photo'),

            //Before or after?
            pos = this.get('album.drag.position'),

            //Where we've dropped the photo
            target = this.get('photo');

        if(Em.isNone(target)){
            //whoa there nellie, that be a folder! - lets handle that over in photo-grid-folder?
            return;
        }


        var idx_p = album.indexOf(photo),
            idx_t = album.indexOf(target),

            lower = null,
            upper = null,

            multi = !Em.isEmpty(this.get('album.selected'));

        this.set('highlight-left', false);
        this.set('highlight-right', false);

        if (photo === target && multi === false){
            return;
        }

        if (pos === 'before') {

            if (album.objectAt(idx_t -1) === photo && multi === false){
                //clog("NO MOVE");
                return;
            }

            upper = new Big(target.get('pos'));
            if (idx_t === 0) {
                //at the start
                lower = new Big(0);
            } else {
                lower = new Big(album.objectAt(idx_t - 1).get('pos'));
            }

        } else {


            if (album.objectAt(idx_t +1) === photo && multi === false){
                //clog("NO MOVE");
                return;
            }

            lower = new Big(target.get('pos'));
            if (idx_t === album.length -1) {
                //at the end
                upper = lower.add(new Big("1"));
            } else {
                upper = new Big(album.objectAt(idx_t +1).get('pos'));
            }
        }

        if (multi){

            var photos = this.get('album.selected'),
                interval = upper.minus(lower).div(2).div(photos.length),

                //Have we selected a continuous block of photos?
                first = new Big(photos.get('firstObject.pos')),
                last = new Big(photos.get('lastObject.pos')),
                first_idx = album.indexOf(photos.get('firstObject')),
                last_idx = album.indexOf(photos.get('lastObject')),
                continuous = last_idx-first_idx === photos.length-1,
                nomove = false;


            if (continuous) {

                if (pos === 'before' && upper.eq(first)) {

                        nomove = true;

                } else if (pos === 'after' && lower.eq(last)) {

                        nomove = true;
                } else if (upper.gte(first) && lower.lte(last)) {
                    nomove = true;
                }

                if (nomove === true){
                    //console.log('dropped a continuous selection inside itself')
                    return;
                }
            }


            Em.run(function(){

                photos.forEach(function(p){
                    p.set('pos',lower.add(interval).toString());
                    lower = lower.add(interval);
                });
            });


        } else {
            if (upper.eq(lower)) {
                //clog("no move");
                return;
            }

            var new_pos = diff(lower, upper);
            //clog("moved one photo to",new_pos.toString());
            photo.set('pos',new_pos.toString());
        }

    },
    actions: {
        focus_me: function() {
            this.set('photo.hasFocus',true);
        },
        selection: function() {
            this.toggleProperty('photo.selected');
        },
        add_tag: function(){

            //var selected=this.get('selected'),
            //    len = selected.length || 1,
            var new_tag = prompt("Enter the (comma/space seperated) tags you'd like to add to this photo");

            if (Em.$.trim(new_tag).length > 0){

                var nt = Em.$.trim(new_tag).toLowerCase().split(/[,\ ]+/);

                if (this.get('photo.tags').contains(nt) === false){
                    this.get('photo.tags').pushObjects(nt);
                }
            }
        },
        remove_tag: function(tag){
            this.get('photo.tags').removeObject(tag);
        }
    }
});


