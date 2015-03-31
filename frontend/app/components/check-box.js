import Em from 'ember';

export default Em.Component.extend({
    tagName: 'td',
    classNames: 'check-box',
    click: function(){
        var _this = this;
        this.toggleProperty('value');
        Em.run.later(function(){
            _this.sendAction('save');
        })
    }
});
