import Em from 'ember';
import UnauthenticatedRouteMixin from 'ember-simple-auth/mixins/unauthenticated-route-mixin';

export default Em.Route.extend(UnauthenticatedRouteMixin, {
    setupController: function(controller) {
        return controller;
    }
});

