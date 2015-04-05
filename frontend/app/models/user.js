import DS from 'ember-data';
import Em from 'ember';
import autosave from '../models/autosave';

var attr = DS.attr;

export default DS.Model.extend(autosave,{
    autosave_properties: ['full_name'],
    full_name:  attr('string'),
    validated: attr('boolean')
});
