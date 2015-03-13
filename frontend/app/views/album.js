import Em from 'ember';

export default Em.View.extend({
    didInsertElement: function () {
        var _this = this;

        Em.$(window).resize(function () {
            Em.run.debounce(_this, _this.didInsertElement, 100);
        });

        this.get('controller').size_photos();
    }
});

