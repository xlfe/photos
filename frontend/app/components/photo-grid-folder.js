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
    setup: function () {
        var w = this.get('folder.display_w'),
            h = this.get('folder.display_h'),
            background = this.get('folder.background'),
            path = this.get('folder.path');

        if (Em.isNone(this.$())) {
            return;
        }
        var
                vpw = w / Math.max(document.documentElement.clientWidth, window.innerWidth || 0);

        if (Em.isEmpty(background) === true) {

            var photos = this.get('album').apply_path(path, true),
                available = photos.get('length'),
                count = available >= 4 ? 4 : 1;

            if (available === 0) {
                //should never happen...
                return;
            }

            while (background.get('length') < count) {
                var idx = getRandomInt(0, available),
                    photo = photos.objectAt(idx);
                if (background.contains(photo) === false) {
                    background.pushObject(photo);
                }
            }
        }

        var pos, size, sizes, urls,repeats;

        urls = 'url(' + background.map(function(_){ return _.get_image(Math.max(h / 2, w / 2))}).join('), url(') +')';

        if (background.get('length') ===4 ) {
            pos = '0 0, ' + (w / 2) + 'px 0px, 0px ' + (h / 2) + 'px, ' + (w / 2) + 'px ' + (h / 2) + 'px';
            size = (w / 2) + 'px ' + (h / 2) + 'px';
            sizes = size + ',' + size + ',' + size + ',' + size;
            repeats = 'no-repeat, no-repeat, no-repeat, no-repeat';
        } else {
            sizes = w +'px ' + h + 'px';
            pos = '0 0';
            repeats = 'no-repeat';
        }

        this.$().css({
            height: h + 'px',
            width: w + 'px',
            'background-position': pos,
            'background-size': sizes,
            'background-repeat': repeats,
            'background-image': urls
        });

        this.$('.folder-icon').css({
            'font-size': (vpw * 60) + 'vw',
            'margin-top': '-' + (h / 20) + 'px',
            'padding-left': (w / 7) + 'px',
            'padding-right': (w / 7) + 'px',
            'text-shadow': '0 0 ' + (w / 10) + 'px #000'
        });

    }.observes('folder', 'folder.display_h').on('didInsertElement'),
    click: function () {
        this.sendAction('path', this.get('folder.path'));
    },
    dragOver: function (evt) {
        if (this.get('canDrop')) {
            this.set('highlight', true);
            evt.preventDefault();
        }
    },
    dragLeave: function () {
        this.set('highlight', false);
    },
    drop: function () {

        var
        //Album controller
            album = this.get('album'),

        //The item we're draggin
            photo = album.get('drag.photo'),

        //Before or after?
            pos = album.get('drag.position'),

        //multiple photos?
            multi = !Em.isEmpty(this.get('selected')),

        //Where we've dropped the photo
            folder = this.get('folder');

        this.set('highlight', false);

        if (multi) {

            var photos = this.get('selected'),
                dest = this.get('album').apply_path(folder.get('path')),
                interval = new Big(0.1),
                max = new Big(0);

            dest.forEach(function (_) {
                var p = new Big(_.get('pos'));
                if (p.gt(max)) {
                    max = p;
                }
            });

            //console.log('moving',photos.length, 'photos to dest folder with',dest.length,'photos and max pos of',max.toString());

            Em.run(function () {
                photos.forEach(function (p) {
                    max = max.add(interval);
                    p.set('path', folder.get('path'));
                    p.set('pos', max.toString());
                });
            });

        } else {
            photo.set('path', folder.get('path'));
            //console.log('one photo moved to',folder.get('path'));
        }

    }
});
