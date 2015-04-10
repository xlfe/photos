import Em from 'ember';
import DS from 'ember-data';


if (typeof String.prototype.endsWith != 'function') {
    String.prototype.endsWith = function (str){
        return this.slice(-str.length) == str;
    };
}
// attach the .equals method to Array's prototype to call it on any array
var compare_arrays = function (a,b) {
    if (!a || !b) {
        return false;
    }

    var l_a = Em.get(a,'length'),
        l_b = Em.get(b,'length');

    if (l_a !== l_b) {
        return false;
    }

    //check b has all items in a and vice versa
    for (var i=0; i< l_a; i++){
        if (b.indexOf(a[i]) == -1){
            return false;
        }

        if (a.indexOf(b[i]) == -1){
            return false;
        }
    }

    return true;
}

export default Em.Mixin.create({
    //define these
    save_delay: 5000,
    autosave_properties: [],
    autosave_properties_immediate: [],

    _i_am_loaded: function () {

        var props = this.get('autosave_properties').concat(this.get('autosave_properties_immediate')),
            _this = this;

        props.forEach(function(prop){
            if (Em.isArray(_this.get(prop))){
                Em.addObserver(_this,prop +'.length',_this,'_keep_watch');
                _this.set('__'+prop,JSON.parse(JSON.stringify(_this.get(prop).toArray())));
            } else {
                Em.addObserver(_this,prop,_this,'_keep_watch');
            }
        });

        this.set('_saving', false);
    }.on('ready'),

    _remove: function(){
        "use strict";

        var props = this.get('autosave_properties').concat(this.get('autosave_properties_immediate')),
            _this = this;

        props.forEach(function(prop){
            if (Em.isArray(_this.get(prop))){
                Em.removeObserver(_this,prop +'.length',_this,'_keep_watch');
            } else {
                Em.removeObserver(_this,prop,_this,'_keep_watch');
            }
        });

    }.on('becameInvalid'),

    _save_me: function () {
        var _this = this;
        this.set('_saving', true);

        this.save().then(function () {
            //To allow the transition to take effect
            setTimeout(function(){
                _this.set('_saving', false);
            },500);
        });
    },
    _saving: true,
    _keep_watch: function (sender,key,value) {
        if (this.get('_saving') === true){
            return;
        }

        //Need to check the list for changes
        if (key.endsWith('.length') === true) {
            var k = key.split('.')[0],
                prev = this.get('__' + k),
                now = this.get(k),
                same = compare_arrays(prev,now);

            this.set('__'+k,JSON.parse(JSON.stringify(now.toArray())));

            if (same === true && this.get('isDirty') === false){
                return;
            }

        }else if (this.get('isDirty') === false){
            return;
        }

        var immediate = false;

        for (var k in this.changedAttributes()){
            if (this.get('autosave_properties_immediate').indexOf(k)!== -1){
                immediate =true;
            }
        }

        Em.run.debounce(this, '_save_me', immediate === true? 25: 5000);
    }
});

