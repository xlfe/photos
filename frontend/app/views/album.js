import Em from 'ember';

export default Em.View.extend({
    images: 'photos.arrangedContent',
    templateName: 'albums/album',
    didInsertElement: function () {
        var _this = this;

        Em.$(window).resize(function () {
            Em.run.debounce(_this, _this.didInsertElement, 100);
        });

        this.get('controller').size_photos();
    }
});

