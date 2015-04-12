import Em from 'ember';
import Channel from '../subscribers/channel';
import config from '../config/environment';

export var endpoint = [config.api_host, config.api_endpoint,'photos'].join('/');

export default Em.Route.extend({
    renderTemplate: function () {
        var c = this.get('controller');

        this.render('album-menu', {
            into: 'application',
            outlet: 'menu',
            controller: c
        });

        this.render();
    },
    model: function (params) {
        var store = this.get('store'),
            query_params = {
                'limit':500,
                'order': 'path,pos',
                'q': "album=KEY('Album', " + params.album_id + ")"
            };

        var get_more = function(album,photos) {

            var more_results = Em.get(photos,'meta.next_results_url');

            if (Em.isPresent(more_results)) {
                album.set('more_results',true);

                query_params['cursor'] = more_results;
                //query_params['limit'] = query_params['limit'] * 2;

                store.find('photo',query_params).then(function(more){
                    Em.run.later(function(){
                        get_more(album,more);
                    });
                });
            } else {
                album.set('more_results',false);
            }

        };

        return new Em.RSVP.Promise(function(resolve,reject){

            store.find('album', params.album_id).then(function (album) {

                Channel.unsubscribe_except(params.album_id);

                album.set('photos', store.filter('photo',function(p){
                    if(p.get('album') === +params.album_id) {
                        //if (p.get('currentState.isLoading') === true || p.get('currentState.isDeleted') === true) {
                        //    return false;
                        //}
                        return true;
                    }
                    return false;
                }));

                //Only reload photos if we need to...
                if (Em.isEmpty(album.get('photos'))) {
                    store.find('photo', query_params).then(function (photos) {
                        if (Em.isEmpty(photos)){
                            album.set('more_results',false);
                            album.set('photo_count',0);
                        } else {
                            Em.run.later(function(){
                                get_more(album,photos);
                            });
                        }
                    });
                } else {
                    album.set('more_results',false);
                }

                resolve(album);
            },
                function(error){
                    reject(error);
                });
        });
    },
    afterModel: function(resolved,transition) {
        Em.$(document).attr('title', resolved.get('name') + ' | Slidenight');
        ga('send', 'pageview', {
            'page': '/album',
            'title': 'Album view'
        });
    },
    resetTitle: function() {
        Em.$(document).attr('title', 'Slidenight');
    }.on('deactivate'),
    actions: {
        error: function(error,transition) {

            alert('Sorry you do not have permission to view that album');
            ga('send', 'exception', { 'exDescription': 'Authentication failed to ' + transition.targetName, 'exFatal': true});
            transition.abort();
            this.transitionTo('login')
            return false;
        }
    }
});
