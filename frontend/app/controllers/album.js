import Em from 'ember';
/* global Big */

var Folder = Em.Object.extend({
    height: 200,
    width: 300,
    display_h: 200,
    display_w: 300,
    is_folder: true
});

RegExp.quote = function(str) {
    //return (str+'').replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
    return (str+'').replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
};

var search_paths = [
    {
        name: 'Title',
        path: 'title'
    },
    {
        name: 'Filename',
        path: '_filename'
    }
];

function search_photo(_paths,term,_){
    var words = term.split(' ').filter(function(w){return Em.$.trim(w).length >0}).map(function(w){
            return new RegExp(RegExp.quote(w), "gi");
        }),
        match = 0,
        search = null,
        matched = 0;

    _paths.forEach(function(sp) {
        match = 0;
        search = _.get(sp);

        if (Em.$.trim(search).length === 0){
            return;
        }

        words.forEach(function (w) {
            if (search.match(w)) {
                match += 1;
            }
        });

        if (match === words.length){
           matched +=1;
        }
    });

        return matched > 0;
}

function below_folder(path, folder) {
    if (folder.length === 0){
        return true;
    }
    if (Em.isNone(path)){
        return false;
    }
    return path.match('^' + RegExp.quote(folder)+ '(/.*)?$') !== null;
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
    _arrangedContent: function () {

        var path = this.get('path') || '';

        var photos = this.get('model.photos').filter(function (_) {
            var photo_path = _.get('path') || '';
            if (path.length === 0 && photo_path.length===0){ return true;}
            return photo_path.match('^' + RegExp.quote(path) + '$') !== null;

        }).sort(sort_pos);

        return photos;

    },
    arrangedContent: function() {
        var path = this.get('path') || '',
            _search = this.get('_search'),
            search = this.get('search');

        if (_search === true){
            if (Em.isNone(search) || Em.$.trim(search).length === 0) {
                return [];
            }

            var sp = this.get('search_paths').map(function(s){return s.path;});

            return Ember.ArrayProxy.createWithMixins(Ember.SortableMixin, {
                sortProperties: ['path','pos'],
                content: this.get('store').filter('photo',function(_){
                    return search_photo(sp,search,_);
                })
            });

        } else {
            return Ember.ArrayProxy.createWithMixins(Ember.SortableMixin, {
                sortProperties: ['pos'],
                content: this.get('store').filter('photo',function(_){
                    var photo_path = _.get('path') || '';
                    if (path.length === 0 && photo_path.length===0){ return true;}
                    return photo_path.match('^' + RegExp.quote(path) + '$') !== null;
                })
            });
        }
    }.property('path','_search','search','search_paths.length'),
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

        if (this.get('_search') === true){
            return [];
        }

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

        return Object.keys(folder_list).sort().map(function (k) {
            return Folder.create({
                name: k,
                path: cp.length > 0 ? cp + '/' + k : k,
                images: photos.filter(function (_) {
                    return below_folder(_.get('path'), cp.length>0? cp + '/' +k:k);
                })
            });
        });
    }.property('path', 'model.photos.@each.path','_search'),
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
            i=0,
            cr = [],
            min_height = +this.get('minHeight'), //Minimum height of each row in pixels
            f = this.get('folders'),
            p = this.get('arrangedContent');

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
                    existing_h = __.get('display_w'),
                    existing_w = __.get('display_w');

                //Only update the size if it has changed
                if (existing_w === _width && existing_h === _height){
                    return;
                }

                __.set('display_w', _width);
                __.set('display_h', _height);

            });
        };

        var scale = function (_) {
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
        };
        f.forEach(scale);
        p.forEach(scale);

        if (cr.length > 0) {
            scale_row(cr);
        }
    }.observes('arrangedContent.@each', 'minHeight', 'path','folders.@each'),
    permissions: function(){
        var anon = this.get('session.isAuthenticated') === false,
            my_id = this.get('session.id'),
            perms = this.get('model.resolved_permissions').filter(function(_){

                if (anon === true){
                    return Em.isNone(_.get('user'));
                } else {
                    return _.get('user') === my_id;
                }
            });


        return perms[0];

    }.property('model.permissions.@each','session.isAuthenticated'),
    _search: false,
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
            this.set('minHeight',Math.min(this.get('minHeight')+150,800));
        },
        smaller: function(){
            this.set('minHeight',Math.max(this.get('minHeight')-150,150));
        },
        cancel_selection: function() {
            this.get('selected').forEach(function(_){
                _.set('selected',false);
            });
        },
        select_all: function(){
            if (Em.isEmpty(this.get('selected')) || this.get('selected.length') < this.get('arrangedContent.length')){
                this.get('arrangedContent').forEach(function(_){
                    _.set('selected',true);
                })
            } else {
                this.send('cancel_selection');
            }
        },
        search: function(){
            this.set('search','');
            this.set('search_paths',search_paths);
            this.toggleProperty('_search');
        },
        remove_search_path: function(sp){
            if (this.get('search_paths.length') === 1){
                return;
            }
            this.get('search_paths').removeObject(sp);
        },
        move_selection: function() {

            var selected=this.get('selected'),
                i=0,
                new_path = prompt('Please enter the new path for ' + selected.length + ' photos');

            if (Em.isNone(new_path)){
                return;
            }

            selected.forEach(function (p) {
                Em.run.later({p:p},function () {
                    this.p.set('path', new_path);
                },i*50);
                i+=1;
            });

        },
        delete_selection: function() {
            var _this = this,
                i = 0;
            if (Em.isPresent(this.get('confirm_delete'))) {
                _this.get('selected').map(function (_) {
                        _.deleteRecord();
                    Em.run.later(function () {
                        _.save();
                    }, i * 20);
                    i += 1;
                });
            } else {
                this.set('confirm_delete', true);
            }
        }
    }
});

