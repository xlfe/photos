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
        'photo.hasFocus:hasFocus',
        'photo.show_comments:show_comments'
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
    display_details: function() {
        var display = this.get('photo.show_comments'),
            _this = this,
            photo = this.get('photo');


        if (display === true){
            _this.get('album.arrangedContent').forEach(function(_){
                if (_ !== photo){
                    _.set('show_comments',false);
                }
            });
            Em.run.later(this,function(){
                _this.me().animate({
                    'margin-bottom': this.$('.expanded-details').outerHeight(true) + 'px'
                },50);
                _this.me().$('.expanded-details').animate({
                    opacity: 1
                },50)
            })
        } else {
            _this.me().animate({
                'margin-bottom': '0px'
            },500)
        }

    }.observes('photo.show_comments'),
    setup_comment_ownership: function() {
        "use strict";
        var comments  = this.get('photo.comments'),
            owner = +this.get('album.model.owner.id'),
            comment = this.get('album.permissions.comment'),
            sid = this.get('session.secure.id');
        if (comment === false){
            return;
        }
        comments.forEach(function(c){
            if (+c.get('user.id') === +sid || owner === +sid) {
                c.set('owner',true);
            }
        });

    }.observes('photo.comments.@each.user'),
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
    me: function() {
        var selector = ".photo[data-photo="+this.get('photo.id')+"]";
        return Em.$(selector);
    },
    setup: function () {

        var w = this.get('photo.display_w'),
            h = this.get('photo.display_h');

        if (Em.isNone(w) || Em.isNone(h)){
            return;
        }

        this.me().css({
            height: h + 'px',
            width: w + 'px'
        });

        if (this.get('photo.visible') === false){
            return;
        }

        var
            img = this.me(),
            url = this.get('photo').get_image(Math.max(w,h),img);

        img.css({
            'background-image': 'url(' + url + ')'
        })

    }.observes('photo.display_h','photo.display_w','photo.visible').on('didInsertElement'),
    dragStart: function (event) {
        console.log("dragStart");
        this.get('album').set('drag.photo',this.get('photo'));
        event.dataTransfer.setData(null,null);
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
            _this = this,
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


            Em.run.schedule('render',function(){
                photos.forEach(function(p){
                    p.set('pos',lower.add(interval).toString());
                    lower = lower.add(interval);
                });
                _this.sendAction('size_immediate');
            });


        } else {
            if (upper.eq(lower)) {
                //clog("no move");
                return;
            }

            var new_pos = diff(lower, upper);
            photo.set('pos',new_pos.toString());
            this.sendAction('size_immediate');
        }

    },
    actions: {
        focus_me: function() {
            this.set('photo.hasFocus',true);
        },
        selection: function() {
            this.toggleProperty('photo.selected');
        },
        show_comments: function() {
            if (this.get('photo.comments.length') === 0 && this.get('album.permissions.comment') === false){
               this.set('photo.show_comments',false);
            } else {
                this.toggleProperty('photo.show_comments');
            }
        },
        add_tag: function(){
            var new_tag = prompt("Enter the (comma/space seperated) tags you'd like to add to this photo"),
                _this = this;

            if (Em.$.trim(new_tag).length > 0){

                var nt = Em.$.trim(new_tag).toLowerCase().split(/[,\ ]+/);

                nt.forEach(function(t){

                    if (_this.get('photo.tags').contains(t) === false){
                        _this.get('photo.tags').pushObject(t);
                    }
                })
            }
        },
        remove_tag: function(tag){
            this.get('photo.tags').removeObject(tag);
        },
        add_comment: function(comment){
            this.sendAction('add_comment',comment);
        },
        resize_details: function(){
            this.display_details();
        },
        remove_comment: function(comment){
            comment.destroyRecord();
            this.display_details();
        }
    }
});


