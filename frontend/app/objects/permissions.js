import Em from 'ember';


export default Em.Object.extend({

    permissions: {
        view: {},
        edit: {},
        move: {},
        upload: {},
        delete: {}
    },

    init: function() {
        this._super();

        for (var k in this.get('permissions')){
            this.set(k,false);
            Ember.addObserver(this, k, this, this.object_obs);
        }
        Ember.addObserver(this, 'user', this, this.object_obs);

        this.object_obs();
    },
    user: null,

    object: {},
    object_obs: function(){
        var obj = {};

        for (var k in this.get('permissions')){
            obj[k] = this.get(k);
        }

        this.set('no_edit',obj['edit'] === false);
        obj['user'] = this.get('user')

         if (Em.isNone(obj.user)===true) {
             this.set('_user', {
                 full_name: 'Anonymous Users'
             });
         }

        this.set('object',obj);
    },

    load: function(obj){
        for (var k in obj){
            this.set(k,obj[k]);
        }
        return this;
    }
});

