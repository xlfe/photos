import Em from 'ember';
import config from '../config/environment';
var endpoint = [config.api_host, config.api_endpoint, 'channel'].join('/');
/* global goog */

var channel_id,
    channel,
    subscriptions = [],
    socket;

//    socket.onopen = onOpened;
//    socket.onmessage = onMessage;
//    socket.onerror = onError;
//    socket.onclose = onClose;

function modChannel(data){

    data = data || {};
    data['channel_id'] = channel_id;

    Em.$.ajax({
        url: endpoint,
        method: 'POST',
        data: JSON.stringify(data),
        xhrFields: {
            withCredentials: true
        },
        success: function(data){

            if (Em.isPresent(data['token']) === true){
                channel = new goog.appengine.Channel(data.token);
                socket = channel.open();
                channel_id = data['channel_id'];

            }
        },
        error: function(error){
            console.log("Error",error);
        }
    });
}

export function subscribe(album) {
    subscriptions.pushObject(album);
    modChannel({'add':album});
    console.log(album,"subscribed");
}

export function unsubscribe_except(album) {
    subscriptions.forEach(function(sub){
        if (sub === album){
            return;
        }
        subscriptions.removeObject(album);
        modChannel({'rem':sub});
        console.log(sub,'removed');
    });
    console.log(album,'removed except',subscriptions);
}

