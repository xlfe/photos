var attr = DS.attr,
    belongsTo = DS.belongsTo,
    hasMany = DS.hasMany;

var is_nan = function (totest) {
    return !isFinite(String(totest).trim() || NaN)
};

//Default date formattings
var ISO8601 = 'YYYY-MM-DDTHH:mm:ss',
    datetime_local = 'dddd, MMMM Do YYYY, h:mm:ss a',
    default_Tz = 'Australia/Sydney';



App.ObjectTransform = DS.Transform.extend({
  deserialize: function(serialized) {
    return Em.isNone(serialized) ? {} : serialized;
  },
  serialize: function(deserialized) {
    return Em.isNone(deserialized) ? {} : deserialized;
  }
});

App.ListTransform = DS.Transform.extend({
    deserialize: function(serialized) {
        return Em.isNone(serialized) ? Em.A() : Em.A(serialized);
    },
    serialize: function(deserialized) {
        return Em.isNone(deserialized) ? [] : deserialized.toArray();
    }
})

//Don't convert timezones on ISODates...
App.IsodateTransform = DS.Transform.extend({
    deserialize: function (serialized) {
        if (serialized == null) {
            return null;
        }
        var m = moment(serialized,'YYYY-MM-DD').format('YYYY-MM-DD');
        return m;
    },
    serialize: function (deserialized) {
        if (deserialized === undefined || deserialized === null) {
            return null;
        }
        return moment(deserialized, "YYYY-MM-DD").format('YYYY-MM-DD');
    }
});


App.IsodatetimeTransform = DS.Transform.extend({
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
        return moment(deserialized, datetime_local).tz(tz).utc().format(ISO8601)
    }
})


