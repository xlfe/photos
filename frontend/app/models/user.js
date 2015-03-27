import DS from 'ember-data';
import Em from 'ember';
import autosave from '../models/autosave';

var attr = DS.attr,
    ro = {readOnly:true};


export default DS.Model.extend(autosave,{

    autosave_properties: ['full_name'],

    //ReadOnly

    full_name:  attr('string')
});
