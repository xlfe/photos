import Em from 'ember';

export default Em.View.extend({
//    needs: ['album'],
    templateName: 'albums/show',
    willDestroyElement: function () {
        $(document).off('keyup', this.keyUp);
        this.$('#lightbox-overlay').off('click', this.overlay_click);
    },
    didInsertElement: function () {
        $(document).on('keyup', {_this: this}, this.keyUp);
        this.$('#lightbox-overlay').on('click', {_this: this}, this.overlay_click);
    },
    overlay_click: function (event) {
        event.data._this.get('controller').transitionToRoute('album');
    },
    displayUrl: function () {

        var photo = this.get('controller.model'),
            long_edge = Math.min(1600, Math.max(photo.get('width'), photo.get('height'))),
            serving_url = photo.get('serving_url') + '=s' + long_edge;

        return serving_url;

    }.property('controller.model.serving_url'),
    photo: function () {
        return this.get('controller.model');
    }.property('controller.model'),
    setPhoto: function () {

        if (this.$() === undefined) return;

        var screenWidth = $(window).width() * 0.99,
            screenHeight = ($(window).height() - 25 ) * 0.99,
            photo = this.get('controller.model'),
            image = this.$('img'),
            tmpImage = new Image();

        image.hide();

        tmpImage.src = this.get('displayUrl');
        tmpImage.onload = function () {
            image.show();
            imageWidth = photo.get('width');
            imageHeight = photo.get('height');

            if (imageWidth > screenWidth || imageHeight > screenHeight) {
                var ratio = imageWidth / imageHeight > screenWidth / screenHeight ? imageWidth / screenWidth : imageHeight / screenHeight;
                imageWidth /= ratio;
                imageHeight /= ratio;
            }

            image.css({
                'width': imageWidth + 'px',
                'height': imageHeight + 'px',
                'top': ( $(window).height() - imageHeight - 25 ) / 2 + 'px',
                'left': ( $(window).width() - imageWidth ) / 2 + 'px'
            });
        };

//        console.log('controllerFor',this.get('controller.controllers.album').get('model'))
    }.observes('controller.model').on('didInsertElement'),

    gestures: {
        swipeLeft: function (event) {
            this.get('controller').go_photo(-1);
        },
        swipeRight: function (event) {
            this.get('controller').go_photo(1);
        },
        tap: function (event) {
            if (event.tapCount == 2) {
                this.get('controller').transitionToRoute('album');
                event.preventDefault();
            }
        }
    },
    //click: function() {
    //
    //    console.log('controllerFor',this.get('controller.controllers.album').get('model.photos.arrangedContent'))
    //},
    keyUp: function (evt) {

        var _this = evt.data._this,
            controller = _this.get('controller'),
            photo = controller.get('model');

        if (evt.which == 27) {
            //Escape - close
            controller.transitionToRoute('album')
            return;
        } else if (evt.which == 39) {
            //Right
            controller.go_photo(1);
            return;
        } else if (evt.which == 37) {
            //Left
            controller.go_photo(-1);
            return;
        }

        console.log(evt.which);
    }
});

