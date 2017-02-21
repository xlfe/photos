import Em from 'ember';
import { endpoint } from '../authenticators/custom';

export default Em.Component.extend({
    resent: false,
    resending: false,
    actions: {
        resend: function(){
            var _this = this;
            this.set('resending',true);
            Em.$.ajax({
                url: endpoint,
                method: 'PUT',
                xhrFields: {
                    withCredentials: true
                },
                dataType: 'json',
                success: function(_data){
                    _this.set('resent',true);
                    _this.set('resending',false);
                },
                error: function(error){
                    alert("Unable to resend - please try again in a few minutes");
                    _this.set('resending',false);
                }
            });

        }
    }

})