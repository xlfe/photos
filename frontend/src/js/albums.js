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
            p = this.get('controller.model.photos.content'),
            this_row = [],
            aspect = 16/ 9,
            _basis = Math.floor(w/320),HTML
            basis = (w - 2*_basis)/_basis,
            height = basis/aspect;

//        console.log(w,aspect,_basis,basis,height)

        //Try and get each photo as close to 320px wide and 180px high

        var row_portraits = function(row){
            var rp = 0;
            row.forEach(function(__){
                if (__.height > __.width){
                    rp += 1;
                }
            })
            return rp;
        }

        p.forEach(function(_) {

            if (this_row.length == _basis){

            }



            _.set('display_sz',[basis,height]);
        });



//        console.log(this.$().width(), p.length);
    }.on('didInsertElement').observes('controller.model.photos.[]')
});

App.PhotosController = Em.ArrayController.extend({
    sortProperties: ['title'],
    sortAscending: true,
    sp_observer: function() {

        if (Em.none(this.get('album'))){
//            console.log('No album')
//            this.set('sortProperties', ['title']);
//            this.set('sortProperties', true);
            return;
        }

//        console.log(this.get('album.sortProperties'));

        this.set('sortProperties', [this.get('album.sortProperties')]);
        this.set('sortAscending', [this.get('album.sortAscending')]);
        console.log('sp_observer')
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
        console.log(model);
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


