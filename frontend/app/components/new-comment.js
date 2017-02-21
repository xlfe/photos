import Em from 'ember';

export default Em.Component.extend({
    actions: {
        add_comment: function(){
            var photo = this.get('photo'),
                text = this.get('text');
                // session = this.get('session');

            if(Em.$.trim(text).length ===0){
                return;
            }
            this.sendAction('add_comment',{
                text:text,
                photo: photo
            });

            this.set('text',undefined);
            this.sendAction('resize_details');
        }
    }
});
