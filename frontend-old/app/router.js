import Ember from 'ember';
import config from './config/environment';

var Router = Ember.Router.extend({
  location: config.locationType
});

Router.map(function() {
    this.resource('permissions', {path: '/albums/:album_id/permissions'});
    this.resource('albums',function() {
        this.resource('albums.index',{path: ''});
        this.resource('album', {path:'/:album_id'},function(){
            this.route('show', {path: ':photo_id'});
        });
    });
    this.route('login');
    this.resource('invites', function(){
        this.resource('invite', {path: '/:invite_id'});
    });
    this.resource('user', {path: ':user_id'});
});

export default Router;
