import Em from 'ember';

export default Em.Component.extend({
    actions: {
        save: function () {
            this.sendAction('save');
        },
        close: function () {
            this.sendAction('close');
        },
        toggleVal: function() {
            this.sendAction('toggleVal');
        }
    },
    show: function () {
        this.$('.modal').modal().on('hidden.bs.modal', function () {

            //Disconnect view once modal is removed...
            this.sendAction('closeModal');

        }.bind(this));
    }.on('didInsertElement')
});

