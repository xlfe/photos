
App.AlbumMenuView = Em.View.extend({
    tagName: 'ul',
    classNames: ['nav', 'navbar-nav', 'navbar-left']
});

function calc_width(_photo) {
    var _aspect = _photo.get('width') / _photo.get('height'), // 600w / 400h = 1.5
        min_height = 320, //Minimum height of each row in pixels
        _width = min_height * _aspect; // 200 * 1.5 = 300

    return _width;
};


//App.AlbumShowRoute = Em.Route.extend({
//    setupController: function(controller,model){
//        controller.set('model',model);
//        return controller;
//    }
//});

App.Folder = Em.Object.extend({
    height: 200,
    width: 200,
    display_sz: [200,200],
    is_folder: true
});

//Albums

App.AlbumsIndexView = Em.View.extend({
    templateName: 'albums/index'
});


App.AlbumCoverComponent = Em.Component.extend({});


