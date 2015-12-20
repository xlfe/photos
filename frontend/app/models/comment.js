import DS from 'ember-data';
import Em from 'ember';
import Session from 'ember-simple-auth/session';


var attr = DS.attr;

export default DS.Model.extend({
    album: attr('number'),
    photo: DS.belongsTo('photo'),
    user: DS.belongsTo('user',{async:true}),
    created: attr('isodatetime'),
    text: attr('string'),

    owner: false
});
