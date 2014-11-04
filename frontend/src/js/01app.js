DS.RESTAdapter.reopen({namespace: 'api'});

App = Ember.Application.create();

App.Router.map(function () {
    this.resource('albums',function() {
        this.resource('album', {path:':album_id'},function(){
            this.route('show', {path: ':photo_id'})
        })
    }),
    this.resource('user', {path: ':user_id'})
});


App.LoadingView = Ember.View.extend({
  templateName: 'global-loading'
});

App.IndexRoute = Em.Route.extend({
    setupController: function(controller) {
        this.transitionTo('albums');
        return controller;
    }
});

App.ApplicationRoute = Em.Route.extend({
//    setupController: function(controller) {
//        this.get('store').find('album').then(function(albums){
//            controller.set('model',albums);
//        })
//        this.transitionTo('albums');
//        return controller;
//    },
    actions: {
        loading: function (transition, originRoute) {
            var view = this.container.lookup('view:loading').append();
            this.router.one('didTransition', view, 'destroy');
        },
        openModalModel: function (modalName,controller) {
            return this.render(modalName, {
                into: 'application',
                outlet: 'modal',
                model: controller
            });
        },
        closeModal: function () {
            console.log('closeModal')
            return this.disconnectOutlet({
                outlet: 'modal',
                parentView: 'application'
            });
        }
    }
});
