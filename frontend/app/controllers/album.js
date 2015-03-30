import Em from 'ember';
/* global Big */

var Folder = Em.Object.extend({
    height: 200,
    width: 300,
    display_sz: [200,300],
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

function sort_pos(a,b){
    var aa = a.get('pos') || 0,
        bb = b.get('pos') || 0;

    return aa  > bb ? 1 : -1;
}

export default Em.Controller.extend({
    queryParams: ['path'],
    drag: {},
    minHeight: 200,
    set_minHeight: function() {
        var h = Em.$(window).height(),
            d = 200;

        if (h > 1600){
            d = 400;
        } else if (h>1000) {
            d = 300;
        } else if (h >640) {
            d=200;
        } else {
            d=150;
        }

        this.set('minHeight',d);

    }.on('init'),
    needs: ['application'],
    _arrangedContent: function (path) {

        path = path || '';

        var photos = this.get('model.photos').filter(function (_) {
            var photo_path = _.get('path') || '';
            return photo_path.match('^' + path + '$') !== null;

        }).sort(sort_pos);

        return photos;

    },
    arrangedContent: function(){
        return this._arrangedContent(this.get('path'));
    }.property('model.photos.@each.path','path','model.photos.@each.pos'),
    selected: function() {
        return this.get('arrangedContent').filter(function(_){
            return _.get('selected') === true;
        });
    }.property('arrangedContent.@each.selected'),
    album_class: function() {
        var base_class='your-photos';

        if (this.get('selected').length > 0 && this.get('permissions.move') === true){
            return base_class + ' selection';
        }

        return base_class;
    }.property('selected.length','permissions.move'),

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
            min_height = +this.get('minHeight'), //Minimum height of each row in pixels
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
    }.observes('arrangedContent.@each', 'minHeight', 'path','folders.@each'),
    permissions: function(){
        "use strict";

        return {
            view: true,
            edit: false,
            no_edit: true,
            move: false,
            upload: false,
            delete: false,
            owner: false
        }

    }.property('allow_anon','session.isAuthenticated'),
    actions: {
        new_sort: function(){
            this.sort_by();
        },
        transition: function(photo){
            this.transitionToRoute('album.show',photo);
        },
        path: function(path){
            this.set('path',path);
        },
        larger: function() {
            this.set('minHeight',Math.min(this.get('minHeight')+50,800));
        },
        smaller: function(){
            this.set('minHeight',Math.max(this.get('minHeight')-50,150));
        },
        cancel_selection: function() {
            this.get('selected').forEach(function(_){
                _.set('selected',false);
            });
        },
        move_selection: function() {

            var selected=this.get('selected'),
                new_path = prompt('Please enter the new path for ' + selected.length + ' photos');

            if (Em.isNone(new_path)){
                return;
            }
            if (Em.$.trim(new_path).length ===0){
                return;
            }

            Em.run(function(){
                selected.forEach(function(p){
                    "use strict";
                    p.set('path',new_path);
                });
            });

        },
        delete_selection: function() {
            var _this=this;
            if (Em.isPresent(this.get('confirm_delete'))) {

                _this.set('progress_delete',true);
                Em.RSVP.all(_this.get('selected').map(function (_) {
                    _.deleteRecord();
                    return new Em.RSVP.Promise(function(resolve,reject){
                        _.save().then(function(){
                            resolve();
                        });
                    });
                })).then(function () {
                    _this.set('progress_delete', false);
                    _this.set('confirm_delete',undefined);
                });
            } else {

                this.set('confirm_delete',true);

            }
        }
    }
});

