App.ModalBaseComponent = Ember.Component.extend({
    actions: {
        save: function () {
            this.sendAction('save');
        },
        close: function () {
            console.log('modal-close');
            this.sendAction('close');
        }
    },
    show: function () {
        this.$('.modal').modal().on('hidden.bs.modal', function () {

            //Disconnect view once modal is removed...
            this.sendAction('closeModal');

        }.bind(this));
    }.on('didInsertElement')
});

App.SortModalController = Ember.Controller.extend({
    actions: {
        save: function () {
//            console.log('sort-save');
            var c = this.get('model.photos');
            c.update_sort();
            this.get('model').save();
            this.$('.modal').modal('hide');
        },
        close: function () {
//            console.log('sort-close');
        }
    }
});


App.UploadModalController = Ember.Controller.extend({
    files: [],
    prepare_uploads: function (files) {
        var self = this,
            album = this.get('model.id');

        $.ajax({
            url: '/api/prepare-upload',
            data: {count: files.length},
            type: 'GET',
            success: function (response) {

                for (var i = 0; i < response.length; i++) {
                    files[i].set('postUrl', response[i]);
                    files[i].set('status','Starting...');
                    files[i].set('album',album);
                    self.start_upload(files[i]);
                }
            },
            error: function (response) {
                console.log('error', response);
            }
        });
    },
    concurrent_uploads: 3,
    start_upload: function (file) {

        var xhr = new XMLHttpRequest(),
            formData = new FormData(),
            _this = this;

//        xhr.addEventListener('progress', function (e) {
//            var done = e.position || e.loaded, total = e.totalSize || e.total;
//            console.log('xhr progress: ' + (Math.floor(done / total * 1000) / 10) + '%');
//        }, false);

        if (xhr.upload) {
            xhr.upload.onprogress = function (e) {
                var done = e.position || e.loaded, total = e.totalSize || e.total,
                    progress = 'width: ' + (Math.floor(done / total * 1000) / 10) + '%';

                if (done == total) {
                    file.set('progress','width: 100%');
                    file.set('status','Processing...');
                } else {
                    file.set('progress',progress);
                }

            };
        }
        xhr.onreadystatechange = function (e) {
            if (4 == this.readyState) {
                file.set('status','Complete');

                var store = _this.get('store');
                var photo = store.find('photo', e.target.response).then(function (_o) {
                    _this.get('model.photos.content').pushObject(_o);
                });

            }
        };
        xhr.open("POST", file.postUrl, true);
        xhr.setRequestHeader("Accept", "application/json");
        xhr.setRequestHeader("Cache-Control", "no-cache");
        xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

        formData.append("album", file.get('album'));
        formData.append("file", file.get('file'));
        file.set('status','Uploading...');
        file.set('progress',0);

        xhr.send(formData);

    },
    actions: {

        save: function () {
            this.prepare_uploads(this.get('files'));

//            this.$('.modal').modal('hide');
        },
        close: function () {
            console.log('closing?')
        }
    }
})

function fileSizeSI(a, b, c, d, e) {
    return (b = Math, c = b.log, d = 1e3, e = c(a) / c(d) | 0, a / b.pow(d, e)).toFixed(2)
        + ' ' + (e ? 'kMGTPEZY'[--e] + 'B' : 'Bytes')
}

App.UploadModalView = Ember.View.extend({
    accept_files: true, //false - only for chrome - accept a folder
    nofiles: function () {
        console.log(this.get('controller'))
        return this.get('controller.files').length == 0;
    }.property('controller.files.[]'),
    didInsertElement: function () {
//        this.get('controller').set('files',[]);
    },
    change: function (e) {

        e.stopPropagation();
        e.preventDefault();
        console.log(e);

        var files = e.target.files || e.dataTransfer.files;

        for (var i = 0; i < files.length; i++) {

            if (files[i].type.match('image/*')) {

                var file = Em.Object.create({
                    file: files[i],
                    name: files[i].name,
                    hSize: fileSizeSI(files[i].size),
                    status: 'Waiting...'
                });

                this.get('controller.files').pushObject(file);
            }
        }


//        console.log(files);

    },


    title: function () {

        var files = this.get('controller.files'),
            count = '';
        if (files.length > 0) {
            count = files.length + ' ';
        }

        return 'Upload ' + count + 'photos to album "' + this.get('context.model.name') + '"';
    }.property('context.model.name', 'files.[]'),

//    setupFileupload: function () {
//        var _this = this,
//            dz = new Dropzone('#upload-box', {
//                url: '/upload',
//                acceptedFiles: 'image/*',
//                uploadMultiple: false,
//                parallelUploads: 3,
//                thumbnailWidth: 250,
//                thumbnailHeight: 150,
//                autoProcessQueue: true,
//                autoQueue: false,
//                accept: function (file, done) {
//
//                    var files = _this.get('files');
//
//                    for (var i = 0; i < files.length; i++) {
//                        if (files[i].name === file.name && files[i].size === file.size) {
//                            added_already = true;
//                            done('Duplicate file');
//                            return;
//                        }
//                    }
//
//                    done();
//                    _this.get('files').pushObject(file);
//                },
//                processing: function (file) {
//                    this.options.url = file.postUrl;
//                },
//                sending: function (file, xhr, formData) {
//                    $.each(file.postData, function (k, v) {
//                        formData.append(k, v);
//                    });
//
//                    if (file.previewElement) {
//                        file.previewElement.classList.add("dz-transferring");
//                        $(file.previewElement).append('<div class="dz-progress dz-uploading"><i class="fa fa-lg fa-refresh"></i></div>');
//                    }
//                },
//                success: function (file, success) {

//                    var store = _this.get('context.model.store');
//                    var photo = store.find('photo', success).then(function (_o) {
//                        _this.get('context.model.photos.content').pushObject(_o);
//                    });
//
//                    if (file.previewElement) {
//                        file.previewElement.classList.add("dz-success");
//                        file.previewElement.classList.remove("dz-transferring");
//                    }
//                },
//                totaluploadprogress: function (progress, total, sent) {
//                    _this.set('progress', progress.toFixed(0));
//                },
//                queuecomplete: function () {
//                    console.log('done');
//                }
//            });
//
//        this.set('dz', dz);
//        this.set('progress', 0.0);
//        this.set('files', []);
//    },
//    progress_obs: function () {
//        this.$('.progress-bar').css({
//            width: this.get('progress') + '%'
//        });
//    }
//        .
//        observes('progress')
});


