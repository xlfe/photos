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

Dropzone.autoDiscover = false;

App.UploadModalView = Ember.View.extend({
    upload: function() {
//      myDropzone.processQueue()
    },
    files:[],
    files_observer: function() {
        var dz = this.get('dz');
        console.log(this.get('files'));
        this.get('files').forEach(function(file){
            console.log(file.status,file.accepted);
            if (file.status !== 'ADDED' || file.accepted != true){
                return;
            }
            dz.enqueueFile(file);
        });
        dz.processQueue();
    }.observes('files.[]'),
    setupFileupload: function() {
        var um = this;


        new Dropzone('#upload-box',{
            url: '/upload',
            acceptedFiles: 'image/*',
            uploadMultiple: false,
            parallelUploads: 3,
            thumbnailWidth:250,
            thumbnailHeight:150,
            autoProcessQueue: true,
            autoQueue: false,
            init: function() {
                um.set('dz',this);
            },
            accept: function (file,done) {
                console.log('accept',file);
                done();
                um.get('files').pushObject(file);

//                $.ajax({
//                    url: '/prepare-upload',
//                    data: {filename: file.name},
//                    type: 'POST',
//                    success: function (response) {
//                        console.log('success',response);
//                        file.postData = {test:'ready'};
//                        done();
//                    },
//                    error: function(response) {
//                        setTimeout(function(){
//                        console.log('error',response);
//
//                        if (response.responseText) {
//                            response = parseJsonMsg(response.responseText);
//                        }
//                        if (response.message) {
//
//                            done(response.message);
//                        } else {
//                            done('error preparing the file');
//                        }
//                        },2000);
//                    }
//                });
            },

//            addedfile: function(file){
//                console.log('added',file);
//            },
            sending: function(file, xhr, formData) {
                console.log('sending',file);
                $.each(file.postData, function(k, v){
                    formData.append(k, v);
                });
            }
        });
    }.on('didInsertElement')
});


