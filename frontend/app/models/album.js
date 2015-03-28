import DS from 'ember-data';
import autosave from '../models/autosave';

export default DS.Model.extend(autosave,{
    autosave_properties: ['name','photo_count'],


    name: DS.attr('string'),
    created: DS.attr('isodatetime'),
    photo_count: DS.attr('number'),

    //Self generated
    photos: [],
    more_results: true
});

