import DS from 'ember-data';
import Em from 'ember';

var attr = DS.attr;

export default DS.Model.extend({
    email: attr('string'),
    album: attr('number'),
    permissions: attr('object'),
    last_emailed: attr('isodatetime')
});
