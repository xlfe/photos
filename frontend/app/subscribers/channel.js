import Em from 'ember';
import config from '../config/environment';
var endpoint = [config.api_host, config.api_endpoint, 'channel'].join('/');
/* global goog */

export var channel_id;

var channel,
    subscriptions = [],
    socket;

function onOpen(data) {
    console.log('channel open',data);
}

function onMessage(data) {
    console.log('channel message',data);
}

function onError(data) {
    console.log('channel error',data);
}

function onClose(data) {
    console.log('channel close',data);
    channel_id = undefined;
    subscriptions=[];
}

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
                socket.onopen = onOpen;
                socket.onmessage = onMessage;
                socket.onerror = onError;
                socket.onclose = onClose;
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

