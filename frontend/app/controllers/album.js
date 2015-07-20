import Em from 'ember';
/* global Big */

var Folder = Em.Object.extend({
    height: 200,
    width: 300,
    display_h: 200,
    display_w: 300,
    is_folder: true
});

var Folders = {};

RegExp.quote = function(str) {
    //return (str+'').replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
    return (str+'').replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
};

var search_paths = [
    {
        name: 'Title',
        path: 'title',
        disabled: false
    },
    {
        name: 'Filename',
        path: '_filename',
        disabled: false
    },
    {
        name: 'Tags',
        path: 'tags',
        disabled: false
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
        //match = 0;
        search = _.get(sp);

        if (Em.isArray(search)){
            if (search.get('length')===0){
                return;
            }

            search = search.join(' ');

        } else {

            if (Em.$.trim(search).length === 0){
                return;
            }

        }

        words.forEach(function (w) {
            if (search.match(w)) {
                match += 1;
            }
        });

    });
    //if (match === words.length) {
    //        matched += 1;
    //    }

    return match > 0;
    return matched > 0;
}

export function below_folder(path, folder) {
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

export function sort_pos(a,b){
    var aa = a.get('pos') || 0,
        bb = b.get('pos') || 0;

    return aa  > bb ? 1 : -1;
}

function isElementInViewport (el) {

    //special bonus for those using jQuery
    if (typeof Em.$ === "function" && el instanceof Em.$) {
        el = el[0];
    }

    var rect = el.getBoundingClientRect(),
        height = (window.innerHeight || document.documentElement.clientHeight)*4;

    return (
        rect.top >= (-height/1.5) && rect.bottom <= height
    );
}


export default Em.Controller.extend({
    queryParams: ['path'],
    drag: {},
    minHeight: 200,
    set_minHeight: function() {
        var h = Em.$(window).height() - 130,
            d = h/3.5;

        console.log('Min height set at :' + d);
        this.set('minHeight',Math.max(100,d));
    }.on('init'),
    needs: ['application'],
    arrangedContent: function() {
        var path = this.get('path') || '',
            album = +this.get('model.id'),
            search_mode = this.get('search_mode'),
            search = this.get('_search');

        if (search_mode === true){
            if (Em.isNone(search) || Em.$.trim(search).length <2 ) {
                return [];
            }

            var sp = this.get('search_paths').filter(function(s){return s.disabled === false;}).map(function(s){return s.path;});

            return Em.ArrayProxy.createWithMixins(Em.SortableMixin, {
                sortProperties: ['path','pos'],
                content: this.get('store').filter('photo',function(_){

                    if (_.get('currentState.isLoading') === true || _.get('currentState.isDeleted') === true) {
                        return false;
                    }
                    if (_.get('album')!== album){ return false;}

                    var photo_path = _.get('path') || '';
                    return search_photo(sp,search,_);
                })
            });

        } else {
            return Em.ArrayProxy.createWithMixins(Em.SortableMixin, {
                sortProperties: ['pos'],
                content: this.get('store').filter('photo',function(_){

                    //if (_.get('currentState.isLoading') === true || _.get('currentState.isDeleted') === true) {
                    //    return false;
                    //}
                    if (_.get('album')!== album){
                        return false;
                    }
                    var photo_path = _.get('path') || '';
                    if (path.length === 0 && photo_path.length===0){
                        return true;
                    }
                    //return photo_path.match('^' + RegExp.quote(path) + '$') !== null;
                    return path === photo_path;

                })
            });
        }
    }.property('path','search_mode','_search','search_paths.@each.disabled','model.id'),
    selected: function() {
        return this.get('arrangedContent').filter(function(_){
            return _.get('selected') === true;
        });
    }.property('arrangedContent.@each.selected'),
    album_class: function() {
        var base_class='your-photos photo-wall';

        if (this.get('selected').length > 0 && (this.get('permissions.sort') === true || this.get('permissions.move') === true)){
            base_class  = base_class + ' selection';
        }

        if (this.get('show_tags') === false){
            base_class  = base_class + ' no-tags';
        }

        return base_class;
    }.property('selected.length','permissions.move','permissions.sort','show_tags'),

    folders: function () {
        // Show all folders that have this path or below

        if (this.get('search_mode') === true){
            return [];
        }

        var photos = this.get('model.photos'),
            aid = this.get('model.id');

        if (Em.isEmpty(photos)) {
            return [];
        }

        var folder_list = {},
            cp = this.get('path') || '',
            fp,
            l = cp.length > 0 ? cp.length + 1 : 0;

        //   folder
        //   folder/1 great
        //   folder/1 great/another

        photos.forEach(function (_) {
            var p = _.get('path');

            if (Em.isPresent(p)) {
                if (below_folder(p, cp) && (p.length > cp.length)) {
                    fp = p.slice(l).split('/')[0];
                    folder_list[fp] = (folder_list[fp] || 0) + 1;
                }
            }
        });

        return Object.keys(folder_list).sort().map(function (k) {

            var fpath = aid + k,
                folder;

            if (fpath in Folders){
                folder = Folders[fpath];
            } else {
                folder = Folder.create({
                    name: k,
                    path: cp.length > 0 ? cp + '/' + k : k,
                    background: []
                });
            }
            folder.set('images',folder_list[k]);
            //return below_folder(_.get('path'), cp.length>0? cp + '/' +k:k);
            Folders[fpath] = folder;
            return folder;
        });
    }.property('path', 'model.photos.@each.path','search_mode'),
    breadcrumbs: function () {
        var cp = this.get('path'),
            paths = [];

        if (Em.$.trim(cp).length == 0) {
            this.set('path',undefined);
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
    _size_photos: function () {

        if (
            Em.$('.edge-to-edge').width() === null ||
            (
            Em.isEmpty(this.get('arrangedContent')) && Em.isEmpty(this.get('folders'))
            )) {
            return;
        }

        var w = Em.$('#photos').width(),
            cw = 0,
            i = 0,
            adjust = window.chrome? 2:0,
            cr = [],
            min_height = +this.get('minHeight'), //Minimum height of each row in pixels
            f = this.get('folders'),
            p = this.get('arrangedContent');

        //Sizing algorithm is choose a minimum row height, add images until
        // adding an additional image would be wider than the width of the element
        // then scale the images so they take up the full width

        var calc_width = function (_photo) {
            return min_height * (_photo.get('width') / _photo.get('height'));
        };

        var scale_row = function (row) {

            var row_width = 0;

            row.forEach(function (__) {
                row_width += calc_width(__);
            });

            var scale = (w - row.length * 2) / row_width;

            if (row.length ===1){
                scale = 2.5;
            }

            row.forEach(function (__) {
                var _width = (calc_width(__) * scale) + adjust,
                    _height = __.get('height') / __.get('width') * (_width-adjust),
                    existing_h = __.get('display_w'),
                    existing_w = __.get('display_w');

                //Only update the size if it has changed
                if (existing_w === _width && existing_h === _height) {
                    return;
                }

                __.set('visible', false);
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
        this.vis_check();
    },
    size_photos: function() {
        Em.run.debounce(this, this._size_photos, 150);
    }.observes('arrangedContent.@each', 'minHeight', 'path','folders.@each'),
    permissions: function(){
        var anon = this.get('session.isAuthenticated') === false,
            my_id = +this.get('session.secure.id'),
            perms = this.get('model.resolved_permissions').filter(function(_){

                if (anon === true){
                    return Em.isNone(_.get('user'));
                } else {
                    return _.get('user') === my_id;
                }
            });

        if (Em.isEmpty(perms)){
            return {};
        }

        if (perms[0].move === true || perms[0].sort === true) {
            perms[0].allow_select = true;
        }

        return perms[0];

    }.property('model.permissions.@each','session.isAuthenticated'),
    vis_check: function () {
        this.get('arrangedContent').forEach(function (photo) {
            if (photo.get('visible')){
                return;
            }

            var el = Em.$('.photo[data-photo=' + photo.get('id') + ']');
            if (Em.isEmpty(el)) {
                return;
            }
            if (isElementInViewport(el)) {
                photo.set('visible', true);
            }
        });
    },
    album_stats_gen: function() {
        var mr = this.get('model.more_results'),
            _this = this,
            owner = this.get('permissions.owner');

        if (mr === true || owner === false){
            return;
        }

        Em.run.later(function(){

            var total_size = 0,
                total_count = 0;

            _this.get('model.photos').forEach(function(p){
                total_count+=1;
                total_size += p.get('size') || 0;
            });

            console.log(total_count,total_size);
            _this.set('model.total_size',total_size);
            _this.set('model.photo_count',total_count);
        },2000);

    }.observes('model.more_results'),
    do_search: function () {
        this.set('_search', this.get('search'));
    },
    search_observer: function () {
        Em.run.debounce(this, this.do_search, 500);
    }.observes('search'),
    search_mode: false,
    search_paths: search_paths,
    actions: {
        transition: function(photo){
            this.transitionToRoute('album.show',photo);
        },
        path: function(path){
            this.set('path',path);
        },
        larger: function() {
            this.set('minHeight',Math.min(this.get('minHeight')+50,800));
            ga('send', 'event', 'action', 'larger_photos');
        },
        smaller: function(){
            this.set('minHeight',Math.max(this.get('minHeight')-50,150));
            ga('send', 'event', 'action', 'smaller_photos');
        },
        cancel_selection: function() {
            this.get('selected').forEach(function(_){
                _.set('selected',false);
            });
            last_clicked_photo = undefined;
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
            this.set('_search','');
            this.toggleProperty('search_mode');
            ga('send', 'event', 'action', 'search_mode',this.get('search_mode'));
        },
        toggle_search_path: function(sp){
            Em.set(sp,'disabled',!Em.get(sp,'disabled'));
        },
        move_selection: function() {

            var selected=this.get('selected'),
                i=0,
                new_path = prompt('Please enter the new path for ' + selected.length + ' photos',selected[0].get('path'));

            if (Em.isNone(new_path)){
                return;
            }

            selected.forEach(function (p) {
                p.set('path', new_path);
            });

        },
        delete_selection: function() {
            var _this = this,
                del = this.get('selected.length'),
                i = 0;

            if (Em.isPresent(this.get('confirm_delete'))) {
                this.set('confirm_delete', false);
                _this.get('selected').map(function (_) {
                    Em.run.later(function () {
                        _.destroyRecord();
                    }, i * 20);
                    i += 1;
                });

                Em.run.later(function(){
                    _this.album_stats_gen();
                },i*20 + 1000);
            } else {
                this.set('confirm_delete', true);
            }
        },
        add_tags: function() {

            var new_tag = prompt("Enter the (comma/space seperated) tags you'd like to add to these photos");

            if (Em.$.trim(new_tag).length === 0) {
                return
            }

            var nt = Em.$.trim(new_tag).toLowerCase().split(/[,\ ]+/),
                i=0,
                selection = this.get('selected');

            selection.forEach(function (photo) {
                var count = 0;
                Em.run.later(function () {
                    photo.set('_saving',true);
                    nt.forEach(function(t){
                        if(photo.get('tags').contains(t)){
                            return;
                        }
                        photo.get('tags').pushObject(t);
                        count += 1;
                    });

                    if (count > 0){

                    photo.save().then(function(p){
                        p.set('_saving',false);
                    });
                    } else {
                        photo.set('_saving',false);
                    }
                }, i * 20);
                i += 1;
            })
        },
        size_immediate:function(){
            this._size_photos();
        },
        add_comment: function(comment){
            ga('send', 'event', 'action', 'add_comment');
            this.get('store').createRecord('comment',{
                photo:comment.photo,
                album: +this.get('model.id'),
                text:comment.text
            }).save();
        },
        toggle_tags:function(){
            this.toggleProperty('show_tags')
        }
    },
    show_tags: true
});

