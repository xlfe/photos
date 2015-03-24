import Em from 'ember';

export default Em.View.extend({
    needs: ['album'],
    templateName: 'albums/show',
    willDestroyElement: function () {
        Em.$(document).off('keyup', this.keyUp);
        this.$('#lightbox-overlay').off('click', this.overlay_click);
    },
    didInsertElement: function () {
        Em.$(document).on('keyup', {_this: this}, this.keyUp);
        this.$('#lightbox-overlay').on('click', {_this: this}, this.overlay_click);
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

