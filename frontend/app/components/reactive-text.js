import Em from 'ember';

export default Em.TextField.extend({
    focusIn: function (evt) {
        this.get('photo').set('hasFocus', true);

        var me = Em.$(evt.target),
            footerHeight = Em.$('.app-footer').outerHeight(),
            ypHeight = Em.$(window).innerHeight() - footerHeight,
            ypTop = Em.$('.your-photos').position().top,
            photoTop = me.position().top,
            photoBottom = photoTop + me.parent('.photo').innerHeight(),
            y = self.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop,
            x = self.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft,

            visible_top = ypTop + y,
            visible_bottom = visible_top + ypHeight - footerHeight,
            offscreen = photoBottom - visible_bottom;


        if (offscreen > 0) {
            console.log('scrolling');
            window.scrollTo(x,y + offscreen + footerHeight);
        }
        //console.log('visible_top',visible_top);
        //console.log('visible_bottom',visible_bottom);
        //console.log('photoTop',photoTop);
        //console.log('photoBottom',photoBottom);
        //console.log('offscreen bottom',offscreen);
    },
    focusOut: function (evt) {
        this.get('photo').set('hasFocus', false);
    },
    keyDown: function(evt) {

        if (evt.which === 9){

            var idx = Em.$(evt.target).attr('tabindex');

            if (Em.$('[tabindex='+(+idx+1)+']').length === 0){
                evt.preventDefault();
                evt.stopPropagation();
                Em.$('[tabindex=1]').focus();
            }
        }
    }
});
