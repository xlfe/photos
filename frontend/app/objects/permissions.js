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

        this.object_obs();
    },

    object: {},
    object_obs: function(){
        var obj = {};

        for (var k in this.get('permissions')){
            obj[k] = this.get(k);
        }

        this.set('object',obj);
    },

    load: function(obj){
        for (var k in obj){
            this.set(k,obj[k]);
        }
    }
});

