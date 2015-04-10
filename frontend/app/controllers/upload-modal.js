import Em from 'ember';
import config from '../config/environment';

var select = function (f, i) {
    return f.filter(function (_) {
        return _.get('_status') === i;
    });
};

var cancel_file = function(c,file){
    if (c.get('cancel') === true){
        file.set('_status',-1);
        file.set('status','Cancelled');
        return true;
    }
    return false;
};

export default Em.Controller.extend({
    files: [],
    concurrent_uploads: 3,
    prepare_upload: function (file) {
        var self = this,
            album = +this.get('model.id');

        if (cancel_file(this,file)){return;}

        file.set('status', 'Preparing...');
        file.set('_status', 2);

        Em.$.ajax({
            url: [config.api_host, config.api_endpoint, 'prepare-upload'].join('/'),
            type: 'POST',
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify({
                filename: file.get('name'),
                size: file.get('bytes'),
                type: file.get('type'),
                md5: file.get('md5'),
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
            file.set('status','Complete');
            file.set('_status',6);
            _this.set('model.photo_count',_this.get('model.photos.length'));
        });
    },
    send_chunk: function (file, start) {

        if (cancel_file(this,file)){return;}

        var prod = config.environment !== 'development',
            _this = this,
            method = prod === true ? 'PUT' : 'POST',
            size = file.get('chunk_size'),
            end = start + size;

        if (end > file.get('bytes')) {
            end = file.get('bytes');
        }

        var data = file.get('file').slice(start, end, file.get('type'));

        if (prod === false) {
            var form = new FormData();
            form.append('album', file.get('album'));
            form.append('path', file.get('path'));
            form.append('lastModifiedDate', file.get('file').lastModifiedDate);
            form.append('file', data, file.get('name'));
            form.append('bytes', file.get('bytes'));
            form.append('md5', file.get('md5'));
            form.append('user', +this.get('session.id'));
            data = form;
        }

        var xhr = Em.$.ajax({
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
                        var done = start + e.loaded, total = file.get('bytes'),
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

                if (prod === true) {
                    xhr.setRequestHeader("Content-Type", file.get('type'));
                    xhr.setRequestHeader("Content-Range", "bytes " + start + "-" + (end - 1) + "/" + file.get('bytes'));
                }
            },
            success: function (response) {
                file.set('progress', 'width: 100%');
                file.set('status', 'Processing...');
                file.set('_status', 5);

                if (prod) {

                    Em.$.ajax({
                        url: [config.api_host, config.api_endpoint, 'finalize-upload'].join('/'),
                        method: 'POST',
                        contentType: "application/json; charset=utf-8",
                        data: JSON.stringify({
                            id: response['bucket'] + '/' + response['name'],
                            path: file.get('path'),
                            lastModifiedDate: file.get('file').lastModifiedDate,
                            md5: file.get('md5'),
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
                if (err.status === 308) {

                    var range = err.getResponseHeader('range'),
                        end = range.split('-')[1];
                    var progress = 'width: ' + (Math.floor(+end / file.get('bytes') * 1000) / 10) + '%';
                    file.set('progress', progress);
                    _this.send_chunk(file, +end);

                } else if (err.status === 503){

                    var b = file.get('backoff');
                    file.set('backoff',b+1);
                    file.set('status','Waiting to retry...');

                    setTimeout(function(){
                        console.log('Waiting... ',b);
                        _this.send_chunk(file,start);
                    },Math.pow(2,b)*1000);
                } else if (err.status === 400){
                    //bad upload

                    file.set('status','Failed');
                    file.set('_status',-1);

                } else {
                    console.log('error',err);
                }
            }
        });

        file.set('xhr',xhr);
    },
    cancel_queue: function() {

        this.set('cancelling',true);

        var _f = this.get('files'),
            self = this,
            queued = select(_f, 1),
            preparing = select(_f, 2),
            ready = select(_f, 3),
            uploading = select(_f, 4);

        if (queued.length + preparing.length + ready.length + uploading.length === 0) {
            self.set('close_caption','Cancelled');
            self.set('save_caption','Cancelled');
            self.set('save_disabled',false);
            return true;
        }

        queued.forEach(function(_){
            _.set('_status',-1);
            _.set('status','Cancelled');
        });

        uploading.forEach(function(_){
            _.set('status',-1);
            _.get('xhr').abort();
        });

        setTimeout(function(){
            self.cancel_queue();
        },50);
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
                //console.log('preparing', f);
                self.prepare_upload(f);
            });
        }

        if (queued.length + preparing.length + ready.length +
            uploading.length + finalising.length === 0 && done.length > 0) {
            //Nothing in the queue and have completed some
            this.set('done',true);
            this.set('save_caption','Done');
            this.set('save_disabled',false);
            return true;
        }

        setTimeout(function () {
            self.process_queue();
        }, 50);

        return false;

    },
    actions: {
        save: function () {
            var ready = this.get('files').filter(function(_) { return _.get('_status') === 0; });

            if (!Em.isEmpty(ready)) {

                this.setProperties({
                    save_caption: 'Uploading...',
                    save_disabled: true,
                    uploading: true
                });

                ready.forEach(function (file) {
                    file.setProperties({
                        _status: 1,
                        status: 'Queued'
                    });
                });
            }

            if (this.process_queue() === true){
                this.reset();
            }
        },
        close: function () {
            this.set('cancel',true);
            this.set('close_caption','Cancelling...');
            if (this.cancel_queue() === true){
                this.reset();
            }
        },
        toggleVal: function() {
            this.toggleProperty('toggleValue');
        }
    },
    reset: function() {
        this.send('closeModal');
        this.setProperties({
            cancelling: false,
            files: [],
            done: false,
            save_disabled: true,
            save_caption: 'Upload',
            close_caption: 'Cancel',
            uploading: false,
            cancel: false
        });
    },
    uploading: false,
    save_disabled: true,
    _save_disabled: function() {

        if (Em.isEmpty(this.get('files'))){
            this.set('save_disabled',true);
            return;
        }

        if (this.get('files').filter(function(_){
                return _.get('_status') === 0;
            }).length > 0){
            this.set('save_disabled',false);
            return;
        }

    }.observes('files.@each._status','files.length'),
    save_caption: 'Upload',
    close_caption: 'Cancel',
    cancel: false,
    can_accept_folders: window.chrome !== undefined,//true, //false - only for chrome - accept a folder
    accept_folders: false,
    total_size: function(){
        var r = 0;
        this.get('files').forEach(function(f){
            r += +f.get('bytes');
        });
        return r;
    }.property('files.@each.bytes'),
    toggleValue: false,
    toggle: function() {

        var af = this.get('can_accept_folders'),
            tv = this.get('toggleValue');

        if (af === true) {
            if (tv === false) {
                this.set('accept_folders',false);
                return new Em.Handlebars.SafeString('<i class="fa fa-folder-open-o"></i>');
            }
            if (tv === true) {
                this.set('accept_folders',true);
                return new Em.Handlebars.SafeString('<i class="fa fa-file-o"></i>');
            }
        }
        return undefined;

    }.property('can_accept_folders','toggleValue')
});

