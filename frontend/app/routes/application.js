import Em from 'ember';
import ApplicationRouteMixin from 'ember-simple-auth/mixins/application-route-mixin';
/* global ga */

export default Em.Route.extend(ApplicationRouteMixin, {
    actions: {
        openModalModel: function (modalName, model) {
            this.controllerFor(modalName).set('model', model);
            return this.render(modalName, {
                into: 'application',
                outlet: 'modal'
            });
        },
        closeModal: function () {
            try{
                Em.$('.modal').modal('hide');
            }
            catch(error) {}
            return this.disconnectOutlet({
                outlet: 'modal',
                parentView: 'application'
            });
        },
        error: function(error,transition){

            if (error.status === 401) {
                ga('send', 'exception', { 'exDescription': 'Authentication failed to ' + transition.targetName, 'exFatal': true});
                transition.abort();
                return this.transitionTo('login');
            } else {
                ga('send', 'exception', { 'exDescription': 'Unknown exception ' + error.status + ' on ' + transition.targetName,
                    'exFatal': true});
                transition.abort();
                alert("Sorry - something went wrong!");
            }
            console.log(error);
            return false;
        }
    }
});
