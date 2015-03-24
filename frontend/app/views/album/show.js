import Em from 'ember';

var scrollPosition = [0,0];

export default Em.View.extend({
    needs: ['album'],
    templateName: 'albums/show',
    willDestroyElement: function () {
        Em.$(document).off('keyup', this.keyUp);
        this.$('#lightbox-overlay').off('click', this.overlay_click);
        window.onscroll = undefined;
    },
    didInsertElement: function () {
        Em.$(document).on('keyup', {_this: this}, this.keyUp);
        this.$('#lightbox-overlay').on('click', {_this: this}, this.overlay_click);

        scrollPosition = [
            self.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft,
            self.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop
        ];

        // lock scroll position, but retain settings for later
        window.onscroll = function() {
            window.scrollTo(scrollPosition[0], scrollPosition[1]);
        }
    },
    overlay_click: function (event) {
        event.data._this.get('controller').transitionToRoute('album');
    },
    setPhoto: function () {

        var screenWidth = Em.$(window).width() * 0.99,
            screenHeight = (Em.$(window).height() - 25 ) * 0.99,
            photo = this.get('controller.model'),
            image = this.$('#lightbox');

        if (Em.isNone(image)){
            return;
        }
        var
            url = photo.get_image(1600,function(full){
                image.css({'background-image': 'url(' + full + ')'});
            });

        var imageWidth = photo.get('width'),
            imageHeight = photo.get('height');

        if (imageWidth > screenWidth || imageHeight > screenHeight) {
            var ratio = imageWidth / imageHeight > screenWidth / screenHeight ? imageWidth / screenWidth : imageHeight / screenHeight;
            imageWidth /= ratio;
            imageHeight /= ratio;
        }

        image.css({
            'width': imageWidth + 'px',
            'height': imageHeight + 'px',
            'top': ( Em.$(window).height() - imageHeight - 25 ) / 2 + 'px',
            'left': ( Em.$(window).width() - imageWidth ) / 2 + 'px',
            'background-image': 'url(' + url + ')',
            'background-size': imageWidth + 'px, ' + imageHeight + 'px'
        });

        //preload photos in either direction
        var preload = 2;
        for (var i=1; i<=preload; i++) {
            this.get('controller').get_photo(i).get_image(1600);
            this.get('controller').get_photo(-i).get_image(1600);
        }

    }.observes('controller.model').on('didInsertElement'),
    gestures: {
        swipeLeft: function () {
            this.get('controller').go_photo(-1);
        },
        swipeRight: function () {
            this.get('controller').go_photo(1);
        },
        tap: function (event) {
            if (event.tapCount === 2) {
                this.get('controller').transitionToRoute('album');
                event.preventDefault();
            }
        }
    },
    keyUp: function (evt) {

        var _this = evt.data._this,
            controller = _this.get('controller');

        if (evt.which === 27) {
            //Escape - close
            controller.transitionToRoute('album');
        } else if (evt.which === 39 || evt.which === 32 || evt.which === 75) {
            //Right or space or K
            controller.go_photo(1);
        } else if (evt.which === 37 || evt.which === 74) {
            //Left or J
            controller.go_photo(-1);
        } else {
            console.log(evt.which);
        }


        evt.stopPropagation();
        evt.preventDefault();
        return false;
    }
});

