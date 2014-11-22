App.ModalBaseComponent = Ember.Component.extend({
    actions: {
        save: function () {
            this.sendAction('save');
        },
        close: function () {
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


var select = function (f, i) {
    return f.filter(function (_) {
        return _.get('_status') == i;
    });
};

var cancel_file = function(c,file){
    if (c.get('cancel')==true){
        file.set('_status',-1);
        file.set('status','Cancelled');
        return true;
    }
    return false;
}

App.UploadModalController = Ember.Controller.extend({
    files: [],
    concurrent_uploads: 3,
    prepare_upload: function (file) {
        var self = this,
            album = this.get('model.id');

        if (cancel_file(this,file)){return;}

        file.set('status', 'Preparing...');
        file.set('_status', 2);

        $.ajax({
            url: '/api/prepare-upload',
            type: 'POST',
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify({
                filename: file.name,
                size: file.bytes,
                type: file.type,
                album: album
            }),
            dataType: 'json',
            success: function (response) {

                if (cancel_file(self,file)){return;}

                if ('location' in response) {
                    file.set('postUrl', response['location']);
                    file.set('chunk_size', response['chunk_size']);
                    file.set('status', 'Ready...');
                    file.set('album', album);
                    file.set('_status', 3);
                }
            },
            error: function (response) {
                if (cancel_file(self,file)){return;}
                console.log('error', response);
            }
        });
    },
    start_upload: function (file) {

        if (cancel_file(this,file)){return;}

        file.set('_status', 4);
        file.set('progress', 'width: 1%');
        file.set('status', 'Uploading...');
        file.set('backoff',0);
        this.send_chunk(file, 0);
    },
    add_file: function(file,_id) {
        var _this = this;
        this.store.find('photo',_id).then(function(photo){
            _this.get('model.photos.content').pushObject(photo);
            file.set('status','Complete');
            file.set('_status',6);
        })
    },
    send_chunk: function (file, start) {

        if (cancel_file(this,file)){return;}

        var prod = location.hostname != 'localhost',
            form = new FormData,
            _this = this,
            method = prod == true ? 'PUT' : 'POST',
            size = file.get('chunk_size'),
            end = start + size;

        if (end > file.get('bytes')) {
            end = file.get('bytes');
        }

        var data = file.get('file').slice(start, end, file.get('type'));

        if (prod == false) {
            var form = new FormData;
            form.append('album', file.get('album'));
            form.append('file', data, file.get('name'));
            data = form;
        }

        var xhr = $.ajax({
            method: method,
            url: file.get('postUrl'),
            processData: false,
            contentType: false,
            data: data,
            dataType: 'json',
            xhr: function () {

                var xhr = new window.XMLHttpRequest();
                if (xhr.upload) {
                    xhr.upload.onprogress = function (e) {
                        var done = start + e.position || e.loaded, total = file.get('bytes'),
                            progress = 'width: ' + (Math.floor(done / total * 1000) / 10) + '%';
                        file.set('progress',progress);
                    };
                }
                return xhr;
            },
            beforeSend: function (xhr) {

                xhr.setRequestHeader("Cache-Control", "no-cache");
                xhr.setRequestHeader("Accept", "application/json");
//                xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

                if (prod == true) {
                    xhr.setRequestHeader("Content-Type", file.get('type'));
                    xhr.setRequestHeader("Content-Range", "bytes " + start + "-" + (end - 1) + "/" + file.get('bytes'));
                }
            },
            success: function (response) {
                file.set('progress', 'width: 100%');
                file.set('status', 'Processing...');
                file.set('_status', 5);
//                console.log('success', response);

                if (prod) {

                    $.ajax({
                        url: '/api/finalize-upload',
                        method: 'POST',
                        contentType: "application/json; charset=utf-8",
                        data: JSON.stringify({
                            id: response['bucket'] + '/' + response['name'],
                            album: file.get('album'),
                            name: file.get('name')
                        }),
                        dataType: 'json',
                        success: function(response){
                            _this.add_file(file,response);
                        },
                        error: function(error){
                            console.log('finalize-error',error);
                        }
                    });

                } else {
                    _this.add_file(file,response);
                }
            },
            error: function (err) {

                if (cancel_file(_this,file)){return;}

//                console.log('error', err)
                //next chunk
                if (err.status == 308) {

                    var range = err.getResponseHeader('range'),
                        end = range.split('-')[1];
                    var progress = 'width: ' + (Math.floor(+end / file.get('bytes') * 1000) / 10) + '%';
                    file.set('progress', progress);
                    _this.send_chunk(file, +end);

                } else if (err.status == 503){

                    var b = file.get('backoff');
                    file.set('backoff',b+1);

                    setTimeout(function(){
                        console.log('Waiting... ',b);
                        _this.send_chunk(file,start);
                    },Math.pow(2,b)*1000);
                }
            }
        });

        file.set('xhr',xhr);
    },
    cancel_queue: function() {

        var _f = this.get('files'),
            self = this,
            queued = select(_f, 1),
            preparing = select(_f, 2),
            ready = select(_f, 3),
            uploading = select(_f, 4);

        if (queued.length + preparing.length + ready.length + uploading.length == 0) {
            self.set('close_caption','Cancelled')
            return true;
        }

        uploading.forEach(function(_){
            _.get('xhr').abort();
        });

        setTimeout(function(){
            self.cancel_queue();
        },500);
    },
    process_queue: function () {

        var _f = this.get('files'),
            self = this,
            queued = select(_f, 1),
            preparing = select(_f, 2),
            ready = select(_f, 3),
            uploading = select(_f, 4),
            finalising = select(_f, 5),
            done = select(_f, 6),
            conc = this.get('concurrent_uploads');

        if (uploading.length < conc) {
            ready.slice(0, conc - uploading.length).forEach(function (f) {
//                console.log('starting', f);
                self.start_upload(f);
            });
        }

        if (preparing.length + ready.length < conc) {
            queued.slice(0, conc - preparing.length - ready.length).forEach(function (f) {
//                console.log('preparing', f);
                self.prepare_upload(f);
            });
        }

        if (queued.length + preparing.length + ready.length +
            uploading.length + finalising.length == 0 && done.length > 0) {
            //Nothing in the queue and have completed some
            this.set('done',true);
            this.set('save_caption','Done');
            this.set('save_disabled',false);
            return true;
        }

        setTimeout(function () {
            self.process_queue();
        }, 500);

        return false;

    },
    actions: {
        save: function () {
            var _this = this;

            this.get('files').filter(function(_) {
                return _.get('_status') == 0;
            }).forEach(function (file) {
                file.set('_status', 1);
                file.set('status', 'Queued');
                _this.set('save_caption','Uploading...');
                _this.set('save_disabled',true);
            });

            if (this.process_queue() == true){
                this.reset();
            }
        },
        close: function () {
            this.set('cancel',true);
            this.set('close_caption','Cancelling...');
            if (this.cancel_queue() == true){
                this.reset();
            }
        }
    },
    reset: function() {
        this.get('modal').modal('hide');
        this.set('files',[]);
        this.set('done',false);
        this.set('save_disabled',true);
        this.set('save_caption','Upload');
        this.set('close_caption','Cancel');
        this.set('cancel',false);
    },
    save_disabled: true,
    save_caption: 'Upload',
    close_caption: 'Cancel',
    cancel: false
});

function fileSizeSI(a, b, c, d, e) {
    return (b = Math, c = b.log, d = 1e3, e = c(a) / c(d) | 0, a / b.pow(d, e)).toFixed(2)
        + ' ' + (e ? 'kMGTPEZY'[--e] + 'B' : 'Bytes')
}

App.UploadModalView = Ember.View.extend({
    accept_files: true, //false - only for chrome - accept a folder
    didInsertElement: function(){
        this.set('controller.modal',this.$('.modal'));
    },
    change: function (e) {

        e.stopPropagation();
        e.preventDefault();

        var files = e.target.files || e.dataTransfer.files;

        for (var i = 0; i < files.length; i++) {

            if (files[i].type.match('image/*')) {

                var file = Em.Object.create({
                    file: files[i],
                    name: files[i].name,
                    bytes: files[i].size,
                    type: files[i].type,
                    hSize: fileSizeSI(files[i].size),
                    status: 'Added',
                    _status: 0
                });
                this.get('controller.files').pushObject(file);
                this.set('controller.save_disabled',false);
            }
        }
    },
    title: function () {
        var files = this.get('controller.files'),
            count = '';
        if (files.length > 0) {
            count = files.length + ' ';
        }

        return 'Upload ' + count + 'photos to album "' + this.get('context.model.name') + '"';
    }.property('context.model.name', 'files.[]')
});


