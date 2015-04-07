import Em from 'ember';
import config from '../config/environment';

export default Em.Route.extend({
    model: function(params){
        var _this = this;
        if (this.get('session.isAuthenticated') === false){
            this.set('session.invite',params.invite_id);
        } else {


            var endpoint = [config.api_host, config.api_endpoint, 'claim'].join('/');

            Em.$.ajax({
                url: endpoint,
                method: 'POST',
                data: JSON.stringify({invite: params.invite_id}),
                dataType: 'json',
                success: function (_data) {
                    _this.transitionTo('album',_data.album);
                },
                error: function (error) {
                    alert("Something wen't wrong. Please try again!");
                }
            });
        }
        return;
    }

});
