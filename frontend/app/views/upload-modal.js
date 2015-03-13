import Em from 'ember';

function fileSizeSI(a,b,c,d,e){
    b=Math;
    c=b.log;
    d=1e3;
    e=c(a)/c(d)|0;
    return a/b.pow(d,e).toFixed(2) + ' '+(e?'kMGTPEZY'[--e]+'B':'Bytes');
}

export default Em.View.extend({
    accept_folders: window.chrome !== undefined,//true, //false - only for chrome - accept a folder
    didInsertElement: function(){
        this.set('controller.modal',this.$('.modal'));
    },
    change: function (e) {

        e.stopPropagation();
        e.preventDefault();

        var files = e.target.files || e.dataTransfer.files,
            folders = !this.get('accept_files');

        for (var i = 0; i < files.length; i++) {

            if (files[i].type.match('image/*')) {

                var file = Em.Object.create({
                    file: files[i],
                    name: files[i].name,
                    path: '/',
                    bytes: files[i].size,
                    type: files[i].type,
                    hSize: fileSizeSI(files[i].size),
                    status: 'Added',
                    _status: 0
                });

                if (folders){
                    var wrp = files[i].webkitRelativePath;
                    file.set('path',wrp.substr(0,wrp.length - files[i].name.length - 1));
                }

                this.get('controller.files').pushObject(file);
                this.set('controller.save_disabled',false);
            }
        }
    },
    title: function () {
        var files = this.get('controller.files'),
            count = '';
        if (Em.isEmpty(files) === false) {
            count = files.length + ' ';
        }

        return 'Upload ' + count + 'photos to album "' + this.get('context.model.name') + '"';
    }.property('context.model.name', 'controller.files.[]')
});


