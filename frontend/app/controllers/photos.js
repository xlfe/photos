import Em from 'ember';

var Folder = Em.Object.extend({
    height: 200,
    width: 200,
    display_sz: [200,200],
    is_folder: true
});

export default Em.ArrayController.extend({
    sortProperties: ['uploaded'],
    sortAscending: false,
    update_sort: function () {

        if (Em.none(this.get('album'))) {
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
    current_path: null,
    filtered_arrangedContent: function () {
        var cp = this.get('current_path') || '';

        return this.get('arrangedContent').filter(function (_) {
            var path = _.get('path') || '',
                m = path.match('^'+cp+'$') != null;

            //console.log('# ',path,' - ',cp,m);
            return m;
        });

    }.property('arrangedContent', 'current_path'),
    folders: function () {
        var folder_list = {},
            content = this.get('content'),
            cp = this.get('current_path') || '',
            re = '^' + cp + '[/]?[^/]+$';

        //folder
        //folder/1 great
        //folder/1 great/another


        this.get('content').forEach(function (_) {
            if (_.get('path') !== null) {

                console.log('F ',_.get('path').match(re) !=null, _.get('path'),' ',re);

                if (_.get('path').match(re) != null){
                    //console.log('folders',re,cp)
                    folder_list[_.get('path')] = null;
                }

            }
        });

        return folder_list.map(function(k){
             return Folder.create({
                 name: k,
                 images: content.filter(function (_) {
                     return _.get('path').match(k) != null;
                 })
             });
        });
    }.property('current_path'),
    breadcrumbs: function() {
        var cp = this.get('current_path'),
            paths = [];

        if (Em.none(cp)){
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

