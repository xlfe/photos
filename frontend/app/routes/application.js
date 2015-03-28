import Em from 'ember';
import ApplicationRouteMixin from 'simple-auth/mixins/application-route-mixin';

export default Ember.Route.extend(ApplicationRouteMixin, {
    actions: {
        openModalModel: function (modalName,controller) {
            return this.render(modalName, {
                into: 'application',
                outlet: 'modal',
                model: controller
            });
        },
        closeModal: function () {
            return this.disconnectOutlet({
                outlet: 'modal',
                parentView: 'application'
            });
        },
        error: function(error,transition){

            if (error.status === 401) {
                transition.abort()
                return this.transitionTo('login');
            }
            console.log(error);
            return false;
        }
    }
});
