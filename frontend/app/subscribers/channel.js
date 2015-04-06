import Em from 'ember';
import config from '../config/environment';
import Photo from '../models/photo';
var endpoint = [config.api_host, config.api_endpoint, 'channel'].join('/');
/* global goog */

export var channel_id;

var channel,
    store,
    subscriptions = [],
    socket;

function onOpen() {
    Em.$.ajaxPrefilter(function( options, originalOptions, jqXHR ) {
        if (Em.isPresent(channel_id)){
            jqXHR.setRequestHeader('X-Channel-ID', channel_id);
        }
    });
}

function onMessage(data) {
    data =JSON.parse(data.data);

    var from_user = data.user,
        _type = data.type,
        kind = data.model,
        d = data.data;

    if (_type === 'DEL') {
        var photo = store.getById('photo',d);
        if (Em.isPresent(photo)){
            photo.deleteRecord();
        }
    } else if (_type === 'UPD') {
        var photo = store.getById('photo',d['id']);

        if (Em.isPresent(photo)){
            photo.set('_saving',true);
            setTimeout(function(){
                photo.set('_saving',false);
            },500);
        }
        store.push('photo', d);
    } else if (_type === 'NEW'){
        store.push('photo',d);
    } else {
        console.log("Unknown event",_type,data);
    }
}

function onError(data) {
}

function onClose(data) {
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
                channel_id = data['channel_id'];
                channel = new goog.appengine.Channel(data.token);
                socket = channel.open();
                socket.onopen = onOpen;
                socket.onmessage = onMessage;
                socket.onerror = onError;
                socket.onclose = onClose;

            }
        },
        error: function(error){
            console.log("Error",error);
        }
    });
}

export function subscribe(album,_store) {
    store=_store;
    subscriptions.pushObject(album);
    modChannel({'add':album});
}

export function unsubscribe_except(album) {
    subscriptions.forEach(function(sub){
        if (sub === album){
            return;
        }
        subscriptions.removeObject(album);
        modChannel({'rem':sub});
    });
}

