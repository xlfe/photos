import Em from 'ember';
import perm from '../objects/permissions';

export default Em.Controller.extend({

    allow_anon: function(){
        var permissions = this.get('model.permissions'),
            anon_perms = permissions.filter(function(_){
                return Em.isNone(_.user);
            });

        if (anon_perms.length > 0) {
            return true;
        } else {
            return false;
        }
    }.property('model.permissions.@each'),
    invites: null,
    invite_list: function() {

        var invites = this.get('invites');

        if (Em.isNone(invites)){
            return;
        }

        var _invites = [];
        invites.split('\n').map(function(invite){

            var parts = invite.split(' '),
                mail = parts[parts.length-1],
                name = '';

            if (parts.length > 1){
                name = parts.slice(0,parts.length-1).join(' ');
                name = name.replace(/"/g,'');
            }
            mail = mail.replace(/</g,'').replace(/>/g,'').replace(/,* *$/,'');

            if (mail.trim() === name.trim()){
                name = ''
            }

            if (mail.trim().length === 0){
                return null;
            }

            var mm = Em.$.trim(mail.toLowerCase());

            if (mm.length > 0) {

                _invites.pushObject(perm.create().load({
                    email: mail,
                    view: true
                }));
            }
        });
        return _invites;

    }.property('invites'),
    view_only: true,
    saved_invites: function () {
        var id = +this.get('model.id'),
            _this = this,
            invites = this.get('store').filter('invite', function (i) {
                return i.get('album') === id;
            });


        new Em.RSVP.Promise(function(resolve,reject){

            _this.get('store').find('invite', {
                'q': "album=KEY('Album', " + id + ")"
            }).then(function () {
                _this.set('view_only', false);
                resolve();

            }, function (response) {
                _this.set('view_only', true);
                reject();
            });
        });
        return invites;

    }.property('model.id'),
    actions: {
        delete: function(perm) {
            perm.destroyRecord();
        },
        send_again: function(perm){

            perm.set('last_emailed',new Date().toString());
            perm.save();
        },
        send_invites: function(){
            var invites = this.get('invite_list'),
                store = this.get('store'),
                _this = this,
                album = +this.get('model.id'),
                tosave = invites.map(function(i){

                    return store.createRecord('invite',{
                        permissions: i.object,
                        email: i.get('email'),
                        album: album
                    }).save();
                });

            Em.RSVP.all(tosave).then(function(saved){
                console.log(saved);
                _this.set('invites',null);
            });

        },
        save: function() {
            var perms = this.get('model._resolved_permissions').map(function(p){ return p.object;}),
                _this = this;
            this.get('model').set('permissions',perms);
            Em.run.debounce(function(){
                _this.get('model').save();
            },2000);
        },
        toggle_anon: function() {

            var permissions = this.get('model.permissions'),
                anon_perms = permissions.filter(function(_){
                    return Em.isNone(_.user);
                });

            if (anon_perms.length > 0) {
                permissions.removeObject(permissions[0]);
            } else {
                var p = perm.create();
                p.set('view',true);
                permissions.pushObject(p.object);
            }

            this.get('model').save();
        },
        remove: function(_perm) {
            var user  = _perm.get('user'),
                perms = this.get('model.permissions'),
                perm = perms.findBy('user',user);

            perms.removeObject(perm);
            this.get('model').save();

        },
        error: function(){
            "use strict";
            return false;
        }
    }


});

