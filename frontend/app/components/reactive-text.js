import Em from 'ember';

export default Em.TextField.extend({
        focusIn: function(){
            this.get('photo').set('hasFocus',true);
        },
        focusOut: function() {
            this.get('photo').set('hasFocus',false);
        }

});
