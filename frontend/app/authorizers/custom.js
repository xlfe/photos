import Base from 'simple-auth/authorizers/base';
import Channel from '../subscribers/channel';

export default Base.extend({
    authorize: function(jqXHR, requestOptions){
        console.log(jqXHR,requestOptions);
        console.log(Channel.channel_id);
    }
});