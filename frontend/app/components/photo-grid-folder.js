import Em from 'ember';

export default Em.Component.extend({
    tagName: 'div',
    classNameBindings: [
        ':folder'
    ],
    setup: function() {
        var sz = this.get('folder.display_sz'),
            w = sz[0],
            h = sz[1];

        this.$().css({
            height: h + 'px',
            width:  w + 'px'
        });

    }.observes('folder.display_sz').on('didInsertElement'),
    click: function() {
        this.sendAction('path',this.get('folder.path'));
    }
});
