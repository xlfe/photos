import DS from 'ember-data';
import Em from 'ember';
import autosave from '../models/autosave';

var attr = DS.attr,
    ro = {readOnly:true};


export default DS.Model.extend(autosave,{

    autosave_properties: ['title','caption','pos'],

    //ReadOnly

    filename:   attr('string',      ro),
    md5:        attr('string',      ro),
    taken:      attr('isodatetime', ro),
    uploaded:   attr('isodatetime', ro),
    width:      attr('number',      ro),
    height:     attr('number',      ro),
    modified:   attr('isodatetime', ro),
    serving_url: attr('string',     ro),

    //Mutable
    title:      attr('string'),
    caption:    attr('string'),
    pos:        attr('sort'),
    path:       attr('string'),



    //Local properties
    selected: false
});
