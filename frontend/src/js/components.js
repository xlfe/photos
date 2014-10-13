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

App.UploadModalView = Ember.View.extend({
    setupFileupload: function() {

        $('#fileupload').fileupload({
            url: '/',
            dataType: 'json',
            done: function (e, data) {
                $.each(data.result.files, function (index, file) {
                    $('<p/>').text(file.name).appendTo('#files');
                });
            },
            progressall: function (e, data) {
                var progress = parseInt(data.loaded / data.total * 100, 10);
                $('#progress .progress-bar').css(
                    'width',
                        progress + '%'
                );
            }
        }).prop('disabled', !$.support.fileInput)
            .parent().addClass($.support.fileInput ? undefined : 'disabled');

    }.on('didInsertElement'),
    willDestroyElement: function() {
        $('#fileupload').fileupload('destroy');
    }
})
