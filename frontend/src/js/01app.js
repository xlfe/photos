DS.RESTAdapter.reopen({namespace: 'api'});

App = Ember.Application.create({
});

App.Router.map(function () {
    this.resource('photos'),
    this.resource('upload'),
    this.resource('albums',function() {
        this.resource('album', {path:':album_id'},function(){
            this.route('upload',{path:'/upload'})
        })
    }),
    this.resource('user', {path: ':user_id'})
});


App.LoadingView = Ember.View.extend({
  templateName: 'global-loading',
//  elementId: 'global-loading'
});


App.ApplicationRoute = Em.Route.extend({
//    setupController: function(controller) {
//        this.transitionTo('albums');
//        return controller;
//    },
    actions: {
        loading: function (transition, originRoute) {
            var view = this.container.lookup('view:loading').append();
            this.router.one('didTransition', view, 'destroy');
        },
        openModal: function (modalName) {
            return this.render(modalName, {
                into: 'application',
                outlet: 'modal'
            });
        },
        closeModal: function () {
            return this.disconnectOutlet({
                outlet: 'modal',
                parentView: 'application'
            });
        }
    }
});

