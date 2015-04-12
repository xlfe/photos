import Em from 'ember';
/* global SparkMD5 */

function fileSizeSI(a,b,c,d,e){
    b=Math;
    c=b.log;
    d=1e3;
    e=c(a)/c(d)|0;
    return (a/b.pow(d,e)).toFixed(2) + ' '+(e?'kMGTPEZY'[--e]+'B':'Bytes');
}


function add_file(file, folders, files,album) {

    var new_file = Em.Object.create({
            file: file,
            name: file.name,
            path: '/',
            bytes: file.size,
            type: file.type,
            hSize: fileSizeSI(file.size),
            dupe: false,
            status: 'Added',
            _status: 0
        }),
        fileReader = new FileReader();

    if (folders) {
        var wrp = file.webkitRelativePath;
        new_file.set('path', wrp.substr(0, wrp.length - file.name.length - 1));
    }

    fileReader.onload = function (e) {
        if (file.size === e.target.result.byteLength) {

            var md5 = SparkMD5.ArrayBuffer.hash(e.target.result);

            new_file.set('md5', md5);

            //if (!Em.isEmpty(album.get('photos'))){

                if (Em.isPresent(album.get('photos').findBy('md5',md5))){
                    new_file.setProperties({
                        dupe: true,
                        status: 'Duplicate',
                        _status: 6
                    });
                //}
            }

            files.pushObject(new_file);
        } else {
            console.log('Unable to read file',e.target.result.bytelength);
        }
    };

    fileReader.onerror = function (e) {
        console.log("Couldn't read file");
    };

    Em.run.later(function(){
        fileReader.readAsArrayBuffer(file);
    })
}


export default Em.View.extend({

    didInsertElement: function(){
        this.set('controller.modal',this.$('.modal'));

        Em.$('.upload input[type=file]').off('hover');

    },
    change: function (e) {

        e.stopPropagation();
        e.preventDefault();

        var files = e.target.files || e.dataTransfer.files,
            _this = this,
            folders = !this.get('accept_files');

        for (var i = 0; i < files.length; i++) {
            if (files[i].type.match('image/*')) {

                if (files[i].size === 0){
                    var empty_file = Em.Object.create({
                            name: files[i].name,
                            bytes: 0,
                            hSize: '0 bytes',
                            dupe: false,
                            status: 'Empty file',
                            _status: 6
                        });
                    this.get('controller.files').pushObject(empty_file);
                } else {
                    add_file(files[i], folders, this.get('controller.files'), this.get('controller.model'));
                }
            }
        }

        //Reset the input element
        Em.$('.upload input[type=file]').wrap('<form>').closest('form').get(0).reset();
        Em.$('.upload input[type=file]').unwrap();
    },
    title: function () {
        var files = this.get('controller.files').filter(function(f){
                var s = f.get('status');
                return s !== 6 && s !== -1 && s !== 0;
            }),
            uploading = this.get('controller.uploading'),
            total_size = 0,
            count = '';
        if (Em.isEmpty(files) === false) {
            count = files.length + ' ';
            files.forEach(function(f){
                total_size += f.get('bytes');
            });
        }

        if (uploading){
            return 'Uploading - ' + count + ' photos ('+fileSizeSI(total_size)+') remaining.';
        } else {
            return 'Upload ' + count + 'photos (' + fileSizeSI(total_size) + ') to album "' + this.get('context.model.name') + '"';
        }

    }.property('context.model.name', 'controller.files.@each.status')
});


