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
        'photo.saving:saving',
        'highlight-right:',
        'highlight-left:',
        'photo.selected:selected',
        'photo.hasFocus:hasFocus'
    ],
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
        var sz = this.get('photo.display_sz');

        if (Em.isNone(sz)){
            return;
        }

        var
            w = sz[0],
            h = sz[1],
            img = this.$(),
            url = this.get('photo').get_image(Math.max(w,h),function(full){
                img.css({
                    'background-image': 'url(' + full + ')'
                });
            });

        this.$().css({
            height: h + 'px',
            width: w + 'px',
            'background-image': 'url(' + url + ')'
        });

    }.observes('photo.display_sz').on('didInsertElement'),
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
            album = this.get('album'),

            //The item we're draggin
            photo = album.get('drag.photo'),

            //Before or after?
            pos = album.get('drag.position'),

            //Where we've dropped the photo
            target = this.get('photo');

        if(Em.isNone(target)){

            target = this.get('folder');

            console.log('whoa there nellie, that be a folder!');
            return;
        } else {
            album = this.get('album.arrangedContent');
            console.log("not a folder?")
        }


        var
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
        focus_me: function() {
            this.set('photo.hasFocus',true);
        },
        selection: function() {
            this.toggleProperty('photo.selected');
        }
    }
});


