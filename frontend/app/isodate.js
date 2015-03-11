import DS from 'ember-data';
/* global moment */

//Don't convert timezones on ISODates...
export default DS.Transform.extend({
    deserialize: function (serialized) {
        if (serialized == null) {
            return null;
        }
        var m = moment(serialized, 'YYYY-MM-DD').format('YYYY-MM-DD');
        return m;
    },
    serialize: function (deserialized) {
        if (deserialized === undefined || deserialized === null) {
            return null;
        }
        return moment(deserialized, "YYYY-MM-DD").format('YYYY-MM-DD');
    }
});

