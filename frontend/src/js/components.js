
App.PhotoGridPhotoComponent = Em.Component.extend({
    saveDelay: 3000,
    tagName: 'div',
    classNames: ['photo'],
    didInsertElement: function() {

        this.set('context.photo.title','HELLO');

        Em.addObserver(this,'context.photo.title',this,'wait_then_save');
    },
    wait_then_save: function(path) {
        var __t = this.get('__t'),
            _this = this;

        if (!Em.none(__t)){
            clearTimeout(__t);
        };

        var t = setTimeout(function() {
            _this.sendAction('save',_this.get('context.photo'));
        },this.get('saveDelay'));
        this.set('__t',t);
    }
})