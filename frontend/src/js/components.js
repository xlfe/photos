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
    show: function () {
        this.$('.modal').modal().on('hidden.bs.modal', function () {
            this.sendAction('close');
        }.bind(this));
    }.on('didInsertElement')
});

Dropzone.autoDiscover = false;

App.UploadModalView = Ember.View.extend({
//    upload: function() {
//      myDropzone.processQueue()
//    },
    title: function() {
        return 'Upload to ' + this.get('context.model.name');
    }.property('context.model.name'),
    files:[],
    files_observer: function(){
        Em.run.debounce(this,this.files_runner,500);
    }.observes('files.[]'),
    files_runner: function() {
        var needs_upload = this.get('files').filter(function(f){
            return f.status == 'added' && f.accepted == true;
        }).map(function(f){
            f.status = 'blob_queue';
            return f;
        });

        if (needs_upload.length > 0){
            this.upload_helper(needs_upload);
        }
    },
    upload_helper: function(files){
//            file.postData = {test:true};
//            file.postUrl = '/upload/' + file.name;
//            dz.enqueueFile(file);

        var dz = this.get('dz'),
            album = this.get('context.model.id');

        console.log(files,album);

        $.ajax({
            url: '/prepare-upload',
            data: {album: album},
            type: 'POST',
            success: function (response) {
                console.log('success',response);
            },
            error: function(response) {
                console.log('error',response);
            }
        });
    },
    setupFileupload: function() {
        var um = this;
        var dz = new Dropzone('#upload-box',{
            url: '/upload',
            acceptedFiles: 'image/*',
            uploadMultiple: false,
            parallelUploads: 3,
            thumbnailWidth:250,
            thumbnailHeight:150,
            autoProcessQueue: true,
            autoQueue: false,
            accept: function (file,done) {
                console.log(this.files);

                if (this.files.length) {
                   var _i, _len;
                   for (_i = 0, _len = this.files.length; _i < _len; _i++) {
                      if(this.files[_i].name === file.name && this.files[_i].size === file.size){
                        done('Duplicate file');
                      } else {
                          done();
                          um.get('files').pushObject(file);
                      }
                    }
                }
            },
            processing: function(file){
//                console.log('processing',file);
                this.options.url = file.postUrl;
            },
            sending: function(file, xhr, formData) {
//                console.log('sending',file,xhr);
                $.each(file.postData, function(k, v){
                    formData.append(k, v);
                });
            }
        });

        this.set('dz',dz);
    }.on('didInsertElement')
});


