import Em from 'ember';
import DS from 'ember-data';

export default Em.Mixin.create({
    //define these
    save_delay: 5000,
    autosave_properties: [],

    _i_am_loaded: function () {

        var props = this.get('autosave_properties'),
            _this = this;

        props.forEach(function(prop){
            Em.addObserver(_this,prop,_this,'_keep_watch');
        });

        this.set('_saving', false);
    }.on('didLoad'),

    _save_me: function () {
        var _this = this;
        this.set('saving', true);
        this.save().then(function () {
            //To allow the transition to take effect
            setTimeout(function(){
                _this.set('saving', false);
            },500);
        });
    },
    _saving: true,
    _keep_watch: function () {
        if (this.get('_saving') === true || this.get('isDirty') === false) {
            return;
        }

        Em.run.debounce(this, '_save_me', 5000);
    }
});

