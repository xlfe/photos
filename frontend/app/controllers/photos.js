import Em from 'ember';

var Folder = Em.Object.extend({
    height: 200,
    width: 200,
    display_sz: [200,200],
    is_folder: true
});


function below_folder(path, folder) {
    if (folder.length === 0){
        return true;
    }
    return path.match('^' + folder + '(/.*)?$') !== null;
}

if (typeof String.prototype.startsWith !== 'function') {
  String.prototype.startsWith = function (str){
    return this.slice(0, str.length) === str;
  };
}

export default Em.ArrayController.extend({
    sortProperties: ['uploaded'],
    sortAscending: false,
    update_sort: function () {

        if (Em.isNone(this.get('album'))) {
            return;
        }
        if (this.get('album.sortProperties') === 'position') {
            var album_sort = this.get('album.manualSort');

            //console.log("manual sort enabled", album_sort);

            if (album_sort.length === 0) {
                //console.log('resort')
                this.get('arrangedContent').forEach(function (s) {
                    var modified = false;

                    while (album_sort.indexOf(s.get('album_pos_id')) !== -1) {
                        s.set('album_pos_id', s.get('album_pos_id') + 1);
                        modified = true;
                    }
                    album_sort.pushObject(s.get('album_pos_id'));
                    if (modified) {
                        s.save();
                    }
                });
//                this.get('album').save()
            }

            this.get('content').forEach(function (s) {
                s.set('position', album_sort.indexOf(s.get('album_pos_id')));
//                console.log(s.position,s.get('album_pos_id'));
            });

        } else {
            this.set('album.manualSort', []);
//            this.get('album').save()
        }

        this.set('sortProperties', [this.get('album.sortProperties')]);
        this.set('sortAscending', this.get('album.sortAscending'));
    },
    filtered_arrangedContent: function () {
        var cp = this.get('current_path') || '',
            content = this.get('arrangedContent').filter(function (_) {
            var path = _.get('path') || '',
                m = path.match('^'+cp+'$') != null;

            //console.log('# ',path,' - ',cp,m);
            return m;
        });

        //console.log('filtered_arrangedContent',content);
        return content;

    }.property('arrangedContent.[]', 'current_path'),

    folders: function () {
        // Show all folders that have this path or below

        var folder_list = {},
            content = this.get('content'),
            cp = this.get('current_path') || '',
            l = cp.length > 0 ? cp.length + 1 : 0;

        //   folder
        //   folder/1 great
        //   folder/1 great/another

        this.get('content').forEach(function (_) {
            var p = _.get('path');

            if (Em.isPresent(p)){
                if (below_folder(p,cp) && (p.length > cp.length)) {
                    folder_list[p.slice(l).split('/')[0]] = null;
                }
            }
        });

        return Object.keys(folder_list).map(function(k){
             return Folder.create({
                 name: k,
                 path: cp.length > 0 ? cp + '/' + k : k,
                 images: content.filter(function (_) {
                     return below_folder(_.get('path'),k);
                 })
             });
        });
    }.property('current_path','content.[]'),
    breadcrumbs: function() {
        var cp = this.get('current_path'),
            paths = [];

        if (Em.isNone(cp)){
            return [];
        }
        return cp.split('/').map(function(_){
            paths.pushObject(_);
            return Em.Object.create({
                name: _,
                path: paths.join('/')
            });
        });
    }.property('current_path')
});

