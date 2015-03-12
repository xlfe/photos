import Em from 'ember';

export default Em.Route.extend({
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
        }
    }
});
