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
        add_permission: function(){
            "use strict";
            //console.log(this.get('model'))
            //var  p = new perm;
            //this.get('model.permissions').pushObject(p);
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
        }
    }


});

