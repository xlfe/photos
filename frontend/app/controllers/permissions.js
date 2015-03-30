import Em from 'ember';
import perm from '../objects/permissions';


export default Em.Controller.extend({



    actions: {
        add_permission: function(){
            "use strict";
            console.log(this.get('model'))
            var  p = new perm;
            this.get('model.permissions').pushObject(p);
        }
    }


});

