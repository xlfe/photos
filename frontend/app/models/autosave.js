import Em from 'ember';
import DS from 'ember-data';


if (typeof String.prototype.endsWith != 'function') {
    String.prototype.endsWith = function (str){
        return this.slice(-str.length) == str;
    };
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
            Em.removeObserver(_this,prop,_this,'_keep_watch');
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
    _keep_watch: function () {
        if (this.get('_saving') === true){
            return;
        }

        if (this.get('isDirty') === false && arguments[1].endsWith('.length') === false) {
            console.log('NOT DIRTY')
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

