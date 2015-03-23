import DS from 'ember-data';
import autosave from '../models/autosave';

export default DS.Model.extend(autosave,{
    autosave_properties: ['name'],


    name: DS.attr('string'),

    //Self generated
    photos: [],
    more_results: true
});

