import DS from 'ember-data';
/* global moment */

//Default date formattings
var ISO8601 = 'YYYY-MM-DDTHH:mm:ss',
    datetime_local = 'dddd, MMMM Do YYYY, h:mm:ss a',
    default_Tz = 'Australia/Sydney';


export default DS.Transform.extend({
    deserialize: function (serialized) {
        if (serialized == null || serialized === undefined) {
            return null;
        }
        var tz = default_Tz;
        var m = moment.utc(serialized).tz(tz).format(datetime_local);
        return m;
    },
    serialize: function (deserialized) {
        var tz = default_Tz;
        if (deserialized === undefined || deserialized === null) {
            return moment().tz(tz).utc().format(ISO8601);
        }
        return moment(deserialized, datetime_local).tz(tz).utc().format(ISO8601);
    }
});

