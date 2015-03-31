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
    actions: {
        invite_user: function(){
            //console.log(this.get('model'))
            //var  p = new perm;
            //this.get('model.permissions').pushObject(p);
        },
        save: function() {
            var perms = this.get('model._resolved_permissions').map(function(p){console.log(p.object); return p.object;}),
                _this = this;
            this.set('model.permissions',perms);
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

        }
    }


});

