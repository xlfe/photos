import Em from 'ember';
import ApplicationRouteMixin from 'simple-auth/mixins/application-route-mixin';

export default Em.Route.extend(ApplicationRouteMixin, {
    actions: {
        openModalModel: function (modalName,controller) {
            return this.render(modalName, {
                into: 'application',
                outlet: 'modal',
                model: controller
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
                transition.abort()
                return this.transitionTo('login');
            } else {
                transition.abort();
                alert("Sorry - something went wrong!");
            }
            console.log(error);
            return false;
        }
    }
});
