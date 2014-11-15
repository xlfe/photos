//Album

App.Album = DS.Model.extend({
    name: DS.attr('string'),
    sortProperties: DS.attr('string'),
    sortAscending: DS.attr('boolean'),
    manualSort: DS.attr('list'),
    sortOptions:[
        { name: 'Uploaded date/time', val: 'uploaded'},
        { name: 'Photo title', val: 'title'},
        { name: 'Digitized', val: 'original_metadata.DateTime'},
        { name: 'Manual', val:'position'}
    ],
    photos_count: function() {
        return
    }
});

App.AlbumController = Em.Controller.extend({
});

App.AlbumMenuView = Em.View.extend({
    tagName: 'ul',
    classNames: ['nav','navbar-nav','navbar-left']
});

function calc_width(_photo) {
    var _aspect = _photo.get('width') / _photo.get('height'), // 600w / 400h = 1.5
        min_height = 320, //Minimum height of each row in pixels
        _width = min_height * _aspect; // 200 * 1.5 = 300

    return _width;
};


App.AlbumShowView = Em.View.extend({
//    needs: ['album'],
    templateName:'albums/show',
    willDestroyElement: function(){
        $(document).off('keyup', this.keyUp);
        this.$('#lightbox-overlay').off('click',this.overlay_click);
    },
    didInsertElement: function () {
        $(document).on('keyup', {_this: this}, this.keyUp);
        this.$('#lightbox-overlay').on('click',{_this:this},this.overlay_click);
    },
    overlay_click: function(event) {
        event.data._this.get('controller').transitionToRoute('album');
    },
    displayUrl: function() {

        var photo        = this.get('controller.model'),
            long_edge = Math.min(1600,Math.max(photo.get('width'),photo.get('height'))),
            serving_url = photo.get('serving_url') + '=s' + long_edge;

        return serving_url;

    }.property('controller.model.serving_url'),
    photo: function() {
        return this.get('controller.model');
    }.property('controller.model'),
    setPhoto: function() {

        if (this.$() === undefined) return;

        var screenWidth	 = $( window ).width() * 0.99,
            screenHeight = ($( window ).height() -25 )* 0.99,
            photo        = this.get('controller.model'),
            image        = this.$('img'),
            tmpImage 	 = new Image();

        image.hide();

        tmpImage.src	= this.get('displayUrl');
        tmpImage.onload = function()
        {
            image.show();
            imageWidth	 = photo.get('width');
            imageHeight	 = photo.get('height');

            if( imageWidth > screenWidth || imageHeight > screenHeight )
            {
                var ratio	 = imageWidth / imageHeight > screenWidth / screenHeight ? imageWidth / screenWidth : imageHeight / screenHeight;
                imageWidth	/= ratio;
                imageHeight	/= ratio;
            }

            image.css({
                'width':  imageWidth + 'px',
                'height': imageHeight + 'px',
                'top':    ( $( window ).height() - imageHeight -25 ) / 2 + 'px',
                'left':   ( $( window ).width() - imageWidth ) / 2 + 'px'
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
        tap: function(event){
            if (event.tapCount == 2){
                this.get('controller').transitionToRoute('album');
                event.preventDefault();
            }
        }
    },
    click: function() {

        console.log('controllerFor',this.get('controller.controllers.album').get('model.photos.arrangedContent'))
    },
    keyUp: function(evt) {

        var _this = evt.data._this,
            controller = _this.get('controller'),
            photo = controller.get('model');

        if(evt.which == 27){
            //Escape - close
            controller.transitionToRoute('album')
            return;
        } else if (evt.which == 39) {
            //Right
            controller.go_photo(1);
            return ;
        } else if (evt.which == 37) {
            //Left
            controller.go_photo(-1);
            return;
        }

        console.log(evt.which);
    }
});

App.AlbumShowController = Em.ObjectController.extend({
    needs: ['album'],
    go_photo: function(idx) {
        var photo = this.get('model'),
            album = this.get('controllers.album').get('model.photos.arrangedContent'),
            current_idx = album.indexOf(photo),
            new_idx = current_idx + idx;

        if (new_idx >= album.length) {
            new_idx = 0;
        } else if (new_idx < 0) {
            new_idx = album.length -1;
        }

        this.transitionToRoute('album.show',album.objectAt(new_idx));
    }
})

//App.AlbumShowRoute = Em.Route.extend({
//    setupController: function(controller,model){
//        controller.set('model',model);
//        return controller;
//    }
//});

App.AlbumView = Em.View.extend({

    images: 'photos.arrangedContent',


    templateName: 'albums/album',
    didInsertElement: function() {
        var _this = this;

        $(window).resize(function () {
            Em.run.debounce(_this, _this.size_photos, 100);
        });

        this.size_photos();
    },
    size_photos: function() {

        if (this.$('edge-to-edge') === undefined || this.get('controller.model.photos') === undefined){
            return;
        }

        var w = this.$('.edge-to-edge').width(),
            cw = 0,
            cr = [],
            p = this.get('controller.model.photos.arrangedContent');

        //Sizing algorithm is choose a minimum row height, add images until
        // adding an additional image would be wider than the width of the element
        // then scale the images so they take up the full width


        var scale_row = function(row) {

            var row_width = 0;

            row.forEach(function(__) {
                row_width += calc_width(__);
            });

            var scale = (w - row.length * 2)/row_width;

            row.forEach(function(__){
                var _width = calc_width(__) * scale,
                    _height = __.get('height') / __.get('width') * _width;

                __.set('display_sz',[_width,_height]);
            })
        };

        p.forEach(function(_) {
            var _width = calc_width(_);

            if (_width + cw <= w) {
                //adding this image would not overflow the row, so add it
                cr.pushObject(_);
                cw += _width;
            } else {
                scale_row(cr);
                cr = [_];
                cw = _width;
            }

        });

        if (cr.length > 0) {
            scale_row(cr);
        }
    }.observes('controller.model.photos.[]','controller.model.sortProperties'),
    actions: {
        do_size: function() {
            console.log('doing size')
            this.size_photos();
        }
    }
});

App.PhotosController = Em.ArrayController.extend({
//    setupController: function(controller,model){
//        console.log(controller,model,'photos setup');
//        controller.set('model',model);
//        return controller;
//    },
    sortProperties: ['uploaded'],
    sortAscending: false,
    update_sort: function() {

        if (Em.none(this.get('album'))) {
            return;
        }
        if (this.get('album.sortProperties') == 'position') {
            var album_sort = this.get('album.manualSort');

            console.log("manual sort enabled",album_sort);

            if (album_sort.length == 0) {
                console.log('resort')
                this.get('arrangedContent').forEach(function(s){
                    var modified = false;

                    while (album_sort.indexOf(s.get('album_pos_id')) != -1) {
                        s.set('album_pos_id', s.get('album_pos_id') + 1);
                        modified = true;
                    }
                    album_sort.pushObject(s.get('album_pos_id'));
                    if (modified){
                        s.save();
                    }
                })
//                this.get('album').save()
            }

            this.get('content').forEach(function(s) {
                s.set('position',album_sort.indexOf(s.get('album_pos_id')));
//                console.log(s.position,s.get('album_pos_id'));
            });

        } else {
            this.set('album.manualSort',[]);
//            this.get('album').save()
        }


        this.set('sortProperties', [this.get('album.sortProperties')]);
        this.set('sortAscending', this.get('album.sortAscending'));
        console.log('sort update');


//        this.send('do_size');
//    }.observes('album','album._sortProperties','album._sortAscending')
    }
})

App.AlbumRoute = Em.Route.extend({
    renderTemplate: function () {
        var c = this.get('controller');

        this.render('album-menu', {
            into: 'application',
            outlet: 'menu',
            controller: c
        });

        this.render();
    },
    setupController: function (controller, model) {
        controller.set('model', model);
        this.get('store').find('photo', {'album[]': model.get('id')}).then(function (photos) {
                var p = App.PhotosController.create({
                content:photos,
                album: model
            });
            p.update_sort();
            model.set('photos', p);
        });
        return controller;
    },
    model: function (params) {
        return this.get('store').find('album', params.album_id);
    }
});
//Albums

App.AlbumsIndexView = Em.View.extend({
    templateName: 'albums/index'
});

App.AlbumsIndexRoute = Em.Route.extend({
    model: function () {
        return this.get('store').find('album');
    },
    actions: {
        new_album: function () {
            var name = prompt('New album name?'),
                _this = this;

            if ($.trim(name).length==0){
                return;
            }

            this.get('store').createRecord('album', {
                name: name,
                sortProperties: 'uploaded',
                sortAscending: true
            }).save().then(function (_) {
                _this.transitionTo('album', _);
            });
        }
    }
});


App.AlbumCoverComponent = Em.Component.extend({
});


