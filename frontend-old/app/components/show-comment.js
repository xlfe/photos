import Em from 'ember';

export default Em.Component.extend({
    tagName: 'tr',
    actions: {
        remove_comment: function(comment){
            this.sendAction('remove_comment',comment);
        }
    }
});
