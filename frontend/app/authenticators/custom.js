import Base from 'ember-simple-auth/authenticators/base';
import Em from 'ember';
import config from '../config/environment';

export var endpoint = [config.api_host, config.api_endpoint,'login'].join('/');


export default Base.extend({
    restore: function () {

        return new Em.RSVP.Promise(function (resolve, reject) {

            Em.$.ajax({
                url: endpoint,
                method: 'GET',
                xhrFields: {
                    withCredentials: true
                },
                dataType: 'json',
                success: function(_data){
                    resolve(_data);
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
    invalidate: function () {

        return new Em.RSVP.Promise(function (resolve, reject) {
            Em.$.ajax({
                url: endpoint,
                method: 'DELETE',
                xhrFields: {
                    withCredentials: true
                },
                success: function(){
                    resolve({});
                },
                error: function(error){
                    reject(error);
                }
            });
        });
    }
});
