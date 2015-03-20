import Em from 'ember';

//selection
//photo_elem
function doObjectsCollide(s, p) { // a and b are your objects
    var margin = 20,
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
    didInsertElement: function () {
        var _this = this,
            initialW, initialH;

        Em.$(window).resize(function () {
            Em.run.debounce(_this, _this.didInsertElement, 100);
        });

        this.get('controller').size_photos();

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

            initialW = e.pageX;
            initialH = e.pageY;

            Em.$(document).bind("mouseup",done);
            Em.$(document).bind("mousemove", openSelector);

        });

        function done(e) {

            Em.$(document).unbind("mousemove", openSelector);
            Em.$(document).unbind("mouseup", done);

            var min_move = 30,
                click = (Math.abs(e.pageX - initialW) <= min_move && Math.abs(e.pageY - initialH) <= min_move),
                photos = _this.get('controller.model.photos'),
                selection = Em.$(".photo-select");

            Em.$(".photo").each(function () {

                var photo_elem = Em.$(this),
                    result = doObjectsCollide(selection, photo_elem),
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

        function openSelector(e) {
            var w = Math.abs(initialW - e.pageX);
            var h = Math.abs(initialH - e.pageY);

            Em.$(".photo-select").css({
                'width': w,
                'height': h
            });
            if (e.pageX <= initialW && e.pageY >= initialH) {
                Em.$(".photo-select").css({
                    'left': e.pageX
                });
            } else if (e.pageY <= initialH && e.pageX >= initialW) {
                Em.$(".photo-select").css({
                    'top': e.pageY
                });
            } else if (e.pageY < initialH && e.pageX < initialW) {
                Em.$(".photo-select").css({
                    'left': e.pageX,
                    "top": e.pageY
                });
            }
            Em.run.debounce(this,selectElements,25);
        }

        function selectElements(e) {
            var photos = _this.get('controller.model.photos'),
                selection = Em.$(".photo-select");

            Em.$(".photo").each(function () {
                var photo_elem = Em.$(this);
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

