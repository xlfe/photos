import Em from 'ember';
import DS from 'ember-data';
import autosave from '../models/autosave';
import perm from '../objects/permissions';
import Channel from '../subscribers/channel';
import { below_folder, sort_pos } from '../controllers/album';

export default DS.Model.extend(autosave,{
    autosave_properties: ['name','photo_count','total_size'],

    name: DS.attr('string'),
    created: DS.attr('isodatetime'),
    photo_count: DS.attr('number'),
    total_size: DS.attr('number'),
    owner: DS.belongsTo('user', {async:true}),
    permissions: DS.attr('list'),

    _resolved_permissions: function() {
        var _this = this;

        return this.get('permissions').map(function (p) {
                var _p = perm.create().load(p);

            if (!Em.isNone(p.user)) {
                _p.set('_user',_this.store.find('user', p.user));
            }
                return _p;
            });

    }.property('permissions.@each'),
    resolved_permissions: function() {
        var owner = this.get('owner');


        return [perm.create().load({
            view: true,
            edit: true,
            comment: true,
            sort: true,
            move: true,
            upload: true,
            delete: true,
            owner: true,

            user: +this.get('owner.id'),
            _user: owner
        })].concat(this.get('_resolved_permissions'));

    }.property('permissions.@each'),
    //Self generated
    photos: [],
    more_results: true,
    public_url: function(){
        "use strict";
        return location.protocol + '//' + location.host + '/albums/'+this.get('id');
    }.property(),

    apply_path: function (path, include_below) {
        //Note when include_below is true, we get a maximum of 20 photos

        var done = 0;
        path = path || '';
        include_below = include_below || false;

        var photos = this.get('photos').filter(function (_) {
            if (done > 20){
                return;
            }
            var photo_path = _.get('path') || '';
            if (include_below ===true){
               if(below_folder(photo_path,path)===true){
                   done +=1;
                   return true;
               }
                return false;
            } else {
                if (path.length === 0 && photo_path.length===0){ return true;}
                return photo_path === path;
            }

        }).sort(sort_pos);

        return photos;

    },
    subscribe: function() {

        if (this.get('more_results') === false){

            this.get('store').find('comment', {'q': "album=KEY('Album', " + this.get('id') + ")"});

            Channel.subscribe(this.get('id'),this.get('store'));

        }

    }.observes('more_results')
});

