import Em from 'ember';

//selection
//photo_elem
function doObjectsCollide(s, p,margin) { // a and b are your objects
    var margin = margin||20,
        aTop = s.offset().top - margin,
        aLeft = s.offset().left - margin,
        bTop = p.offset().top - margin,
        bLeft = p.offset().left - margin;

    return !(
        ((aTop + s.height()-margin) < (bTop)) ||
        (aTop > (bTop + p.height()-margin)) ||
        ((aLeft + s.width()-margin) < bLeft) ||
        (aLeft > (bLeft + p.width()-margin))
    );
}



export default Em.View.extend({
    size_photos: function(){
        this.get('controller').size_photos();
    },
    didInsertElement: function () {
        var _this = this,
            initialX, initialY;

        Em.$(window).resize(function () {
            Em.run.debounce(_this, _this.size_photos, 100);
        });
        this.size_photos();


        Em.$(".your-photos").mousedown(function (e) {

            if (Em.$(e.target).hasClass('photo')) {

                var photos = _this.get('controller.model.photos'),
                    id = Em.$(e.target).attr('data-photo'),
                    photo = photos.findBy('id', id);
                if (photo.get('selected') === true){
                    return;
                } else if (Em.$('.your-photos').hasClass('selection') === false){
                    return;
                }

            } else if (Em.$(e.target).hasClass('your-photos') !== true){
                return;
            }

            Em.$(".photo-select").addClass("active");
            Em.$(".photo-select").css({
                'left': e.pageX,
                'top': e.pageY
            });

            initialX = e.pageX;
            initialY = e.pageY;

            Em.$(document).bind("mouseup",done);
            Em.$(document).bind("mousemove", make_selection);

        });

        function done(e) {

            Em.$(document).unbind("mousemove", make_selection);
            Em.$(document).unbind("mouseup", done);

            var min_move = 30,
                click = (Math.abs(e.pageX - initialX) <= min_move && Math.abs(e.pageY - initialY) <= min_move),
                photos = _this.get('controller.model.photos'),
                selection = Em.$(".photo-select");

            Em.$(".photo").each(function () {

                var photo_elem = Em.$(this);

                if (photo_elem.hasClass('folder')){
                    return;
                }
                var
                    result = doObjectsCollide(selection, photo_elem,-1),
                    id = Em.$(this).attr('data-photo'),
                    photo = photos.findBy('id', id);

                if (result === true && click === true){
                    photo.toggleProperty('selected');
                } else {
                    if (photo.get('_selected') === true) {
                        photo.set('_selected', false);
                    }
                }
            });

            Em.$(".photo-select").removeClass("active");
            Em.$(".photo-select").width(0).height(0);
        }

        function make_selection(e) {
            var x = e.pageX,
                y = e.pageY,
                ps = Em.$('.photo-select'),
                w = Math.abs(initialX - x),
                h = Math.abs(initialY - y),
                yp = Em.$('.your-photos'),
                max_w = yp.outerWidth() - initialX - 10,
                max_h = yp.outerHeight() + yp.position().top - initialY;

                ps.css({
                    left: Math.min(x,initialX)
                });
            if (x <= initialX) {
                max_w = initialX;
            }

            if (y <= initialY) {

                if (yp.position().top > y) {
                    h = initialY - yp.position().top - 10;
                }
                max_h = initialY - yp.position().top;
            }

            ps.css({
                top: Math.min(initialY,Math.max(yp.position().top +10,y))
            });

            ps.css({
                width: Math.min(w,max_w),
                height: Math.min(h,max_h)
            });

            Em.run.debounce(this,selectElements,25);
        }

        function selectElements(e) {
            var photos = _this.get('controller.model.photos'),
                selection = Em.$(".photo-select");

            Em.$(".photo").each(function () {
                var photo_elem = Em.$(this);
                if (photo_elem.hasClass('folder')){
                    return;
                }
                var result = doObjectsCollide(selection, photo_elem),
                    id = Em.$(this).attr('data-photo'),
                    photo = photos.findBy('id', id);

                if (result === true) {
                    if (photo.get('selected') === false) {
                        photo.set('selected', true);
                        photo.set('_selected', true);
                    }
                } else {
                    if (photo.get('selected') === true && photo.get('_selected') === true) {
                        photo.set('selected', false);
                        photo.set('_selected', false);
                    }
                }
            });
        }
    }
});

