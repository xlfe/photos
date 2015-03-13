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


export default Em.Controller.extend({
    queryParams: ['path'],

    sort_by: function (by, direction) {

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

    arrangedContent: function () {

        var path = this.get('path'),
            photos = this.get('model.photos').filter(function(_){
                var photo_path = _.get('path') || '';

                return photo_path.match('^' + path + '$') !== null;

            });

        return photos;

    }.property('model.photos.length','path'),
    folders: function () {
        // Show all folders that have this path or below

        var photos = this.get('model.photos');

        if (Em.isEmpty(photos)) {
            return [];
        }

        var folder_list = {},
            cp = this.get('path') || '',
            l = cp.length > 0 ? cp.length + 1 : 0;

        //   folder
        //   folder/1 great
        //   folder/1 great/another

        photos.forEach(function (_) {
            var p = _.get('path');

            if (Em.isPresent(p)) {
                if (below_folder(p, cp) && (p.length > cp.length)) {
                    folder_list[p.slice(l).split('/')[0]] = null;
                }
            }
        });

        return Object.keys(folder_list).map(function (k) {
            return Folder.create({
                name: k,
                path: cp.length > 0 ? cp + '/' + k : k,
                images: photos.filter(function (_) {
                    return below_folder(_.get('path'), k);
                })
            });
        });
    }.property('path', 'model.photos.length'),
    breadcrumbs: function () {
        var cp = this.get('path'),
            paths = [];

        if (Em.isNone(cp)) {
            return [];
        }
        return cp.split('/').map(function (_) {
            paths.pushObject(_);
            return Em.Object.create({
                name: _,
                path: paths.join('/')
            });
        });
    }.property('path'),
    size_photos: function () {

        if (Em.$('.edge-to-edge').width() === null || Em.isEmpty(this.get('model.photos'))) {
            return;
        }

        var w = Em.$('.edge-to-edge').width(),
            cw = 0,
            cr = [],
            min_height = +this.get('model.minHeight') || 320, //Minimum height of each row in pixels
            p = this.get('folders').concat(this.get('arrangedContent'));

        //Sizing algorithm is choose a minimum row height, add images until
        // adding an additional image would be wider than the width of the element
        // then scale the images so they take up the full width

        var calc_width = function(_photo) {
            return min_height * (_photo.get('width') / _photo.get('height'));
        }

        var scale_row = function (row) {

            var row_width = 0;

            row.forEach(function (__) {
                row_width += calc_width(__);
            });

            var scale = (w - row.length * 2) / row_width;

            row.forEach(function (__) {
                var _width = calc_width(__) * scale,
                    _height = __.get('height') / __.get('width') * _width,
                    existing = __.get('display_sz');

                //Only update the size if it has changed
                if (Em.isPresent(existing)){
                    if (existing[0] === _width && existing[1] === _height){
                        return;
                    }
                }

                __.set('display_sz', [_width, _height]);
            });
        };

        p.forEach(function (_) {
            var _width = calc_width(_);

            if (_width + cw <= w) {
                //adding this image would not overflow the row, so add it
                cr.pushObject(_);
                cw += _width;
            } else {
                scale_row(cr);
                cr = [_];
                cw = _width;
            }
        });

        if (cr.length > 0) {
            scale_row(cr);
        }
    }.observes('model.photos.length', 'model.minHeight', 'path')
});

