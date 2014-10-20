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

        var dz = this.get('dz'),
            album = this.get('context.model.id');

        $.ajax({
            url: '/api/prepare-upload',
            data: {count: files.length},
            type: 'GET',
            success: function (response) {

                for (var i = 0; i < response.length; i++){
                    files[i].postUrl = response[i];
                    files[i].status = 'added';
                    files[i].postData = {
                        album: album
                    };
//                    console.log(response[i])
                    dz.enqueueFile(files[i]);
                }
            },
            error: function(response) {
                console.log('error',response);
            }
        });
    },
    setupFileupload: function() {
        var _this = this,
            dz = new Dropzone('#upload-box',{
            url: '/upload',
            acceptedFiles: 'image/*',
            uploadMultiple: false,
            parallelUploads: 3,
            thumbnailWidth:250,
            thumbnailHeight:150,
            autoProcessQueue: true,
            autoQueue: false,
            accept: function (file,done) {

                var files = _this.get('files');

                for (var i =0; i < files.length; i++) {
                    if (files[i].name === file.name && files[i].size === file.size){
                        added_already = true;
                        done('Duplicate file');
                        return;
                    }
                }

                done();
                _this.get('files').pushObject(file);
            },
            processing: function(file){
                this.options.url = file.postUrl;
//                console.log(this.options.url);
            },
            sending: function(file, xhr, formData) {
                $.each(file.postData, function(k, v){
                    formData.append(k, v);
                });
            },
            success: function(file,success){
                console.log(success);
                var store = _this.get('context.model.photos.store');

                var photo = store.push('photo',success);
                console.log(photo);
                _this.get('context.model.photos').pushObject(photo);

            }
        });

        this.set('dz',dz);
        this.set('files',[]);
    }.on('didInsertElement')
});


