import Base from 'simple-auth/authenticators/base';
import Em from 'ember';
import config from '../config/environment';

var endpoint = [config.api_host, config.api_endpoint,'login'].join('/');

export default Base.extend({
    restore: function (data) {

        return new Em.RSVP.Promise(function (resolve, reject) {

            Em.$.ajax({
                url: endpoint,
                method: 'GET',
                xhrFields: {
                    withCredentials: true
                },
                dataType: 'json',
                success: function(data){
                    console.log(data);
                    resolve(data);
                },
                error: function(error){
                    reject(error.responseJSON || {error:'An unknown error occurred'});
                }
            });

        });
    },
    authenticate: function (options) {
        return new Em.RSVP.Promise(function (resolve, reject) {
            Em.$.ajax({
                url: endpoint,
                method:'POST',
                data: JSON.stringify(options),
                dataType: 'json',
                success: function(data){
                    resolve(data);
                },
                error: function(error){
                    reject(error.responseJSON || {error:'An unknown error occurred'});
                }
            });
        });
    },
    invalidate: function (data) {
        return new Em.RSVP.Promise(function (resolve, reject) {

            Em.$.ajax({
                url: endpoint,
                method: 'PUT',
                xhrFields: {
                    withCredentials: true
                },
                dataType: 'json',
                success: function(){
                    resolve();
                }
            });
        });
    }
});