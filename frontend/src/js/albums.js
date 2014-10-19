
//Album

App.Album = DS.Model.extend({
    name: DS.attr('string')
});

App.AlbumView = Em.View.extend({
    templateName: 'albums/album'
});

App.AlbumRoute = Em.Route.extend({
    setupController: function(controller,model){
        controller.set('model',model);
//        console.log(model);
        this.get('store').find('photo',{album:model.get('id')}).then(function(photos){
            model.set('photos',photos);
        });
        return controller;

    },
    model: function(params){
        return this.get('store').find('album',params.album_id);
    }
});
//Albums

App.AlbumsIndexView = Em.View.extend({
    templateName: 'albums/index'
});

App.AlbumsIndexRoute = Em.Route.extend({
    model: function() {
        return this.get('store').find('album');
    },
    actions: {
        new_album: function() {
            var name = prompt('New album name?'),
                _this = this;

            this.get('store').createRecord('album',{name:name}).save().then(function(_){
                _this.transitionTo('album',_);
            });
        }
    }
});


App.AlbumCoverComponent = Em.Component.extend({
});


