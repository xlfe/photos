import DS from 'ember-data';
import Em from 'ember';
/* global Big */


export default DS.Transform.extend({
    deserialize: function (serialized) {
        return Em.isNone() ? null : new Big(serialized);
    },
    serialize: function (deserialized) {
        return Em.isNone(deserialized) ? null : deserialized.toString();
    }
});

