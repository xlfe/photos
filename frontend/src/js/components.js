App.PhotoGridPhotoComponent = Em.Component.extend({
    saveDelay: 3000,
    tagName: 'div',
    classNameBindings: [':photo', 'context.photo.saving:'],
})

App.ModalBaseComponent = Ember.Component.extend({
    actions: {
        ok: function () {
            this.$('.modal').modal('hide');
            this.sendAction('ok');
        }
    },
    title: function() {
        return 'Upload to ' + this.get('model.name');
    }.property('model.name'),
    show: function () {
        this.$('.modal').modal().on('hidden.bs.modal', function () {
            this.sendAction('close');
        }.bind(this));

        console.log(this.get('model'))

    }.on('didInsertElement')
});
