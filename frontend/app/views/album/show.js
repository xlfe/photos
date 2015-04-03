import Em from 'ember';

var scrollPosition = [0,0];

function max_size_for_window(photo) {
    var screenWidth = Em.$(window).width() * 0.99,
        screenHeight = (Em.$(window).height() - 25 ) * 0.99,
        imageWidth = photo.get('width'),
        imageHeight = photo.get('height');

    if (imageWidth > screenWidth || imageHeight > screenHeight) {
        var ratio = imageWidth / imageHeight > screenWidth / screenHeight ? imageWidth / screenWidth : imageHeight / screenHeight;
        imageWidth /= ratio;
        imageHeight /= ratio;
    }

    return [imageWidth, imageHeight];
}

export default Em.View.extend({
    needs: ['album'],
    //templateName: 'albums/show',
    willDestroyElement: function () {
        Em.$(document).off('keyup', this.keyUp);
        this.$('#lightbox-overlay').off('click', this.overlay_click);
        window.onscroll = undefined;
    },
    didInsertElement: function () {
        Em.$(document).on('keyup', {_this: this}, this.keyUp);
        this.$('#lightbox-overlay').on('click', {_this: this}, this.overlay_click);

        scrollPosition = [
            document.documentElement.scrollLeft || document.body.scrollLeft,
            document.documentElement.scrollTop || document.body.scrollTop
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

        var photo = this.get('controller.model'),
            c = this.get('controller'),
            image = this.$('#lightbox');

        if (Em.isNone(image)||Em.isNone(photo)){
            return;
        }
        var
            max_w = max_size_for_window(photo),
            url = photo.get_image(max_w[0],image);

        image.css({
            'width': max_w[0] + 'px',
            'height': max_w[1] + 'px',
            'left': ( Em.$(window).width() - max_w[0] ) / 2 + 'px',
            'top': ( Em.$(window).height() - max_w[1] - 25 ) / 2 + 'px',
            'background-image': 'url(' + url + ')',
            'background-size': max_w[0] + 'px, ' + max_w[1] + 'px'
        });

        //preload photos in either direction
        [-2,-1,1,2].forEach(function(i){
            var p = c.get_photo(i);

            if (Em.isNone(p)){
                return;
            }
            var max_w = max_size_for_window(p);
            p.get_image(Math.max(max_w[0],max_w[1]));
        });

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

        if (evt.which === 27 || evt.which == 81) {
            //Escape - close or q for quit
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

