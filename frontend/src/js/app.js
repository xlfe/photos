DS.RESTAdapter.reopen({namespace: 'api'});

App = Ember.Application.create({
});

App.Router.map(function () {
    this.resource('photos'),
    this.resource('upload'),
    this.resource('user', {path: ':user_id'})
});


App.LoadingView = Ember.View.extend({
  templateName: 'global-loading',
  elementId: 'global-loading'
});


App.ApplicationRoute = Em.Route.extend({
    setupController: function(controller) {
        this.transitionTo('photos');
        return controller;
    },
    actions: {
        loading: function (transition, originRoute) {
            var view = this.container.lookup('view:loading').append();
            this.router.one('didTransition', view, 'destroy');
        }
    }
});

