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
    if (Em.isNone(path)){
        return false;
    }
    return path.match('^' + folder + '(/.*)?$') !== null;
}

if (typeof String.prototype.startsWith !== 'function') {
  String.prototype.startsWith = function (str){
    return this.slice(0, str.length) === str;
  };
}

function default_sort(manualSort) {
    return function (_a, _b) {
        _a = _a.get('pos');
        _b = _b.get('pos');

        var __a = manualSort.indexOf(_a),
            __b = manualSort.indexOf(_b);

        if (__a === -1) {
            manualSort.pushObject(_a);
            __a = manualSort.indexOf(_a);
        }
        if (__b === -1) {
            manualSort.pushObject(_b);
            __b = manualSort.indexOf(_b);
        }

        if (__a  < __b) {
            return -1;
        }
        return 1;
    };
}


export default Em.Controller.extend({
    queryParams: ['path'],

    sort_by: function (by, direction) {

        var manualSort = this.get('model.manualSort'),
            ds = default_sort(manualSort),
            photos = this.get('model.photos.content');

        if (Em.isNone(by)){

            photos.sort(ds).forEach(function(_){
                manualSort.pushObject(_.get('pos'));
            });

            return;

        }
    },
    arrangedContent: function () {

        var path = this.get('path') || '',
            manualSort = this.get('model.manualSort'),
            ds = default_sort(manualSort),
            photos = this.get('model.photos').filter(function(_){
                if (_.get('currentState.isLoading') === true){
                    return false;
                }
                var photo_path = _.get('path') || '';
                return photo_path.match('^' + path + '$') !== null;

            }).sort(ds);

        return photos;

    }.property('model.photos.@each.path','path','model.manualSort.@each'),
    selected: function() {
        return this.get('arrangedContent').filter(function(_){
            return _.get('selected') === true;
        });
    }.property('arrangedContent.@each.selected'),
    album_class: function() {
        var base_class='your-photos';

        if (this.get('selected').length > 0){
            return base_class + ' selection';
        }
        return base_class;
    }.property('selected.length'),
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
    }.property('path', 'model.photos.@each.path'),
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

        if (Em.$('.edge-to-edge').width() === null || Em.isEmpty(this.get('arrangedContent'))) {
            return;
        }

        var w = Em.$('.your-photos').width(),
            cw = 0,
            cr = [],
            min_height = +this.get('model.minHeight') || 320, //Minimum height of each row in pixels
            p = this.get('folders').concat(this.get('arrangedContent'));

        //Sizing algorithm is choose a minimum row height, add images until
        // adding an additional image would be wider than the width of the element
        // then scale the images so they take up the full width

        var calc_width = function(_photo) {
            return min_height * (_photo.get('width') / _photo.get('height'));
        };

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
    }.observes('arrangedContent.@each', 'model.minHeight', 'path'),
    actions: {
        new_sort: function(){
            this.sort_by();
        },
        transition: function(photo){
            this.transitionToRoute('album.show',photo);
        },
        cancel_selection: function() {
            this.get('selected').forEach(function(_){
                _.set('selected',false);
            });
        }
    }
});

