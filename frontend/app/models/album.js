import DS from 'ember-data';
import autosave from '../models/autosave';

export default DS.Model.extend(autosave,{
    autosave_properties: ['name','photo_count','allow_anon'],


    name: DS.attr('string'),
    created: DS.attr('isodatetime'),
    photo_count: DS.attr('number'),
    allow_anon: DS.attr('boolean'),

    //Self generated
    photos: [],
    more_results: true,
    public_url: function(){
        "use strict";
        return location.protocol + '//' + location.host + '/albums/'+this.get('id');
    }.property('id')
});

