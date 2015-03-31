import Em from 'ember';

export default Em.TextField.extend({
    focusIn: function (evt) {

        var me = Em.$(evt.target),
            footerHeight = Em.$('.app-footer').outerHeight(),
            ypTop = Em.$('.your-photos').position().top,
            ypHeight = Em.$(window).innerHeight() - footerHeight - ypTop,
            photoTop = me.position().top,
            additional = 0,
            transition = 0,
            photoHeight = me.parent('.photo').outerHeight(),
            y = document.documentElement.scrollTop || document.body.scrollTop;

        if ((photoHeight) < ypHeight) {
            additional = (ypHeight - photoHeight) / 5;
        }


        if (photoTop + ypTop + photoHeight < y + ypHeight && photoTop > y) {
        } else {
            if (y < photoTop - ypTop - additional) {

                Em.$('html,body').animate(
                    {
                        scrollTop: photoTop - ypTop - additional
                    },
                    400);
            } else {

                Em.$('html,body').animate({
                        scrollTop: photoTop - ypTop - additional
                    },transition);
            }

        }
        this.get('photo').set('hasFocus', true);

        return;
    },
    focusOut: function (evt) {
        this.get('photo').set('hasFocus', false);
    },
    keyDown: function (evt) {

        if (evt.which === 9){

            var idx = Em.$(evt.target).attr('tabindex'),
                offset = evt.shiftKey === true? -1 : 1,
                c = Em.$('[tabindex=' + (+idx + offset) + ']').length,
                l = Em.$('.photo').length;

            if (c === 0) {
                evt.preventDefault();
                evt.stopPropagation();
                Em.$('[tabindex='+(evt.shiftKey === true? l:1)+']').focus();
            }
        }
    }
});
