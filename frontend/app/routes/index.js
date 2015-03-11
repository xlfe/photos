import Em from 'ember';

export default Em.Route.extend({
    setupController: function(controller) {
        this.transitionTo('albums');
        return controller;
    }
});

