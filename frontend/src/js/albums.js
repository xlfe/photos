//Album

App.Album = DS.Model.extend({
    name: DS.attr('string'),
    sortProperties: DS.attr('string'),
    sortAscending: DS.attr('boolean')
});

App.AlbumController = Em.Controller.extend({
});

App.AlbumMenuView = Em.View.extend({
    tagName: 'ul',
    classNames: ['nav','navbar-nav','navbar-left']
})

App.AlbumView = Em.View.extend({
    templateName: 'albums/album',
    didInsertElement: function() {
        var _this = this;
        window.onresize = function(){
            Em.run.debounce(_this,_this.size_photos,100);
        }
    },
    size_photos: function() {

        if (this.$('edge-to-edge') === undefined || this.get('controller.model.photos') === undefined){
            return;
        }

        var w = this.$('.edge-to-edge').width(),
            cw = 0,
            cr = [],
            p = this.get('controller.model.photos.arrangedContent'),
            min_height = 220; //Minimum height of each row in pixels

        //Sizing algorithm is choose a minimum row height, add images until
        // adding an additional image would be wider than the width of the element
        // then scale the images so they take up the full width

        var calc_width = function(_photo) {
            var _aspect = _photo.get('width') / _photo.get('height'), // 600w / 400h = 1.5
                _width = min_height * _aspect; // 200 * 1.5 = 300

//            console.log(_photo.get('height'),_photo.get('width'),min_height,_width);
            return _width;
        }

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

        }

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
//        console.log(w,'sized',this.get('controller.model'))

    }.on('didInsertElement').observes('controller.model.photos.[]','controller.model.sortProperties'),
    actions: {
        do_size: function() {
            console.log('doing size')
            this.size_photos();
        }
    }
});

App.PhotosController = Em.ArrayController.extend({
    sortProperties: ['title'],
    sortAscending: true,
    sp_observer: function() {

        if (Em.none(this.get('album'))){
            return;
        }

        this.set('sortProperties', [this.get('album.sortProperties')]);
        this.set('sortAscending', [this.get('album.sortAscending')]);
        console.log('sp_observer')
        this.send('do_size');
    }.observes('album','album.sortProperties','album.sortAscending')
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
//    willDestroyElement: function () {
//        return this.disconnectOutlet({
//            outlet: 'modal',
//            parentView: 'application'
//        });
//    }

    setupController: function (controller, model) {
        controller.set('model', model);
//        console.log(model);
        this.get('store').find('photo', {'album[]': model.get('id')}).then(function (photos) {
                var p = App.PhotosController.create({
                content:photos,
                album: model
            });
            p.sp_observer();
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


