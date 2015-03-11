import Em from 'ember';

export default Em.Route.extend({
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
            return this.disconnectOutlet({
                outlet: 'modal',
                parentView: 'application'
            });
        }
    }
});
