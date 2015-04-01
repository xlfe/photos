import Em from 'ember';
/* global Big */

export default Em.Component.extend({
    tagName: 'div',
    attributeBindings: ['draggable'],
    draggable: true,
    classNameBindings: [
        ':folder',
        'highlight:'
    ],
    setup: function() {
        var w = this.get('folder.display_w'),
            h = this.get('folder.display_h');

        if (Em.isNone(this.$())){
            return;
        }

        this.$().css({
            height: h + 'px',
            width:  w + 'px'
        });

    }.observes('folder','folder.display_h').on('didInsertElement'),
    click: function() {
        this.sendAction('path',this.get('folder.path'));
    },
    dragOver: function(evt){
        this.set('highlight',true);
        evt.preventDefault();
    },
    dragLeave: function(){
        this.set('highlight', false);
    },
    drop: function(){

        var
            //Album controller
            album = this.get('album'),

            //The item we're draggin
            photo = album.get('drag.photo'),

            //Before or after?
            pos = album.get('drag.position'),

            //multiple photos?
            multi = !Em.isEmpty(this.get('album.selected')),

            //Where we've dropped the photo
            folder = this.get('folder');

        this.set('highlight', false);

        if (multi){

            var photos = this.get('album.selected'),
                dest = this.get('album')._arrangedContent(folder.get('path')),
                interval = new Big(0.1),
                max = new Big(0);

            dest.forEach(function(_){
                var p = new Big(_.get('pos'));
                if (p.gt(max)){
                    max=p;
                }
            });

            //console.log('moving',photos.length, 'photos to dest folder with',dest.length,'photos and max pos of',max.toString());

            Em.run(function(){
                photos.forEach(function(p){
                    max = max.add(interval);
                    p.set('path',folder.get('path'));
                    p.set('pos',max.toString());
                });
            });

        } else {
            photo.set('path',folder.get('path'));
            //console.log('one photo moved to',folder.get('path'));
        }

    }
});
