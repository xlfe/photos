import Base from 'simple-auth/authenticators/base';
import config from '../config/environment';

export default Base.extend({
    endpoint : [config.api_host, config.api_endpoint,'login'].join('/'),
    restore: function (data) {
        console.log(data);
        console.log(this.get('store').find('user',data.id))

    },
    authenticate: function (options) {
        var ep = this.get('endpoint');

        return new Ember.RSVP.Promise(function (resolve, reject) {
            Em.$.ajax({
                url: ep,
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
        var ep = this.get('endpoint');
        return new Ember.RSVP.Promise(function (resolve, reject) {

            Em.$.ajax({
                url: ep,
                method: 'GET',
                success: function(){
                    resolve();
                }
            })
        });
    }
});