import DS from 'ember-data';
import autosave from '../models/autosave';
import perm from '../objects/permissions';

export default DS.Model.extend(autosave,{
    autosave_properties: ['name','photo_count'],

    name: DS.attr('string'),
    created: DS.attr('isodatetime'),
    photo_count: DS.attr('number'),
    owner: DS.belongsTo('user', {async:true}),
    permissions: DS.attr('list'),

    _resolved_permissions: function() {
        var _this = this;

        return this.get('permissions').map(function (p) {
                var _p = perm.create().load(p);

                if (!Em.isNone(_p.get('user'))) {
                    _p.set(_this.store.find('user', _p.get('user')))
                }

                return _p;
            });

    }.property('permissions.@each'),
    resolved_permissions: function() {
        var owner = this.get('owner');

        return [perm.create().load({
            view: true,
            edit: true,
            move: true,
            upload: true,
            delete: true,
            owner: true,
            user: this.get('owner.id'),
            _user: owner
        })].concat(this.get('_resolved_permissions'));

    }.property('permissions.@each'),
    //Self generated
    photos: [],
    more_results: true,
    public_url: function(){
        "use strict";
        return location.protocol + '//' + location.host + '/albums/'+this.get('id');
    }.property()
});

