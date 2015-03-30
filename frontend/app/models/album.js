import DS from 'ember-data';
import autosave from '../models/autosave';

export default DS.Model.extend(autosave,{
    autosave_properties: ['name','photo_count'],
    autosave_properties_immediate: ['allow_anon'],


    name: DS.attr('string'),
    created: DS.attr('isodatetime'),
    photo_count: DS.attr('number'),
    allow_anon: DS.attr('boolean'),

    owner: DS.belongsTo('user', {async:true}),
    permissions: DS.attr('list'),
    //Self generated
    photos: [],
    more_results: true,
    public_url: function(){
        "use strict";
        return location.protocol + '//' + location.host + '/albums/'+this.get('id');
    }.property()
});

