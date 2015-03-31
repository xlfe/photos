import Em from 'ember';

export default Em.Component.extend({
    tagName: 'td',
    classNameBindings: 'disabled::check-box',
    click: function(){
        var _this = this,
            disabled = this.get('disabled');
        if (disabled === true){
            return;
        }
        this.toggleProperty('value');
        Em.run.later(function(){
            _this.sendAction('save');
        })
    }
});
