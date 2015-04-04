import Em from 'ember';
/* global Big */

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

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
            h = this.get('folder.display_h'),
            path = this.get('folder.path');

        if (Em.isNone(this.$())){
            return;
        }

        var photos = this.get('album')._arrangedContent(path),
            vpw = w/Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
            count = 4,
            pos = '0 0, ' + (w/2) + 'px 0px, 0px ' + (h/2) + 'px, ' + (w/2) +'px ' + (h/2) +'px',
            size = (w/2) + 'px ' + (h/2) + 'px',
            sizes = size + ',' + size + ',' + size + ',' + size,
            urls = [];

        for (var i =0; i < count; i++){
            var idx = getRandomInt(0,photos.get('length')),
                photo = photos.objectAt(idx),
                url = photo.get_image(Math.max(h,w));
            urls.pushObject(url);
        }

        console.log(pos)
        console.log(size)
        console.log(urls)

        this.$().css({
            height: h + 'px',
            width:  w + 'px',
            'background-position':pos,
            'background-size':sizes,
            'background-repeat': 'no-repeat, no-repeat, no-repeat, no-repeat',
            'background-image':'url(' + urls[0] + '), url(' + urls[1] + '), url(' + urls[2] + '), url(' + urls[3] +')'
        });

        this.$('.folder-icon').css({
            'font-size': (vpw*60)+'vw',
            'margin-top': '-' + (h/20) + 'px',
            'padding-left': (w/7) + 'px',
            'padding-right': (w/7) + 'px',
            'text-shadow': '0 0 ' + (w/10) +'px #000'
        });

    }.observes('folder','folder.display_h').on('didInsertElement'),
    click: function() {
        this.sendAction('path',this.get('folder.path'));
    },
    dragOver: function(evt){
        if (this.get('canDrop')){
            this.set('highlight',true);
            evt.preventDefault();
        }
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
