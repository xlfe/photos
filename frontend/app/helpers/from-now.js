import Em from 'ember';
/* global moment */

var tz = "Australia/Sydney",
    datetime_local = 'dddd, MMMM Do YYYY, h:mm:ss a';

export default Em.Handlebars.makeBoundHelper(function(date) {
    return moment(date,datetime_local).fromNow();
});
