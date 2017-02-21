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
    last_clicked_photo: null,
    size_photos: function(){
        this.get('controller').size_photos();
    },
    willDestroyElement: function() {

        Em.$(window).on('DOMContentLoaded load resize scroll', undefined);
        Em.$(window).resize(undefined);
    },
    didInsertElement: function () {
        var _this = this,
            controller = this.get('controller'),
            initialX, initialY;

        Em.$(window).resize(function () {
            Em.run.debounce(_this, _this.size_photos, 100);
        });
        //this.size_photos();

        //track visibility of photos
        var handler = function(){
            Em.run.debounce(controller,controller.vis_check,100);
        };
        Em.$(window).on('DOMContentLoaded load scroll', handler);

        if (this.get('controller.permissions.move') !== true && this.get('controller.permissions.sort') !== true){
            return;
        }

        Em.$("#photos").mousedown(function (e) {

            if (Em.$(e.target).hasClass('photo')) {

                var photos = _this.get('controller.model.photos'),
                    id = Em.$(e.target).attr('data-photo'),
                    photo = photos.findBy('id', id);
                if (photo.get('selected') === true){
                    return;
                } else if (Em.$('#photos').hasClass('selection') === false){
                    return;
                }

            } else if (Em.$(e.target).attr('id') !== "photos"){
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
                photos = _this.get('controller.arrangedContent'),
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
                    console.log('click',e);
                    if (e.shiftKey === true && photo.get('selected')===false){
                        console.log('Shift select!');
                        var last,
                            lcp = _this.get('last_clicked_photo');

                        if (!Em.isNone(lcp)) {
                            last = photos.indexOf(lcp);
                        }else {
                            last = photos.filter(function(_){
                                return _.get('selected') ===true && _ !== photo;
                            });

                            if (Em.isEmpty(last)) {
                                last=undefined;
                            } else {
                                if (last.get('length')>1) {
                                    console.log("Hmm");
                                }
                                last = photos.indexOf(last[0]);
                            }

                        }
                        var current = photos.indexOf(photo);

                        if (Em.isNone(last) || Em.isNone(current)){
                            console.log(last,current,'NONE');
                            return;
                        }

                        for (var i=Math.min(last,current); i <= Math.max(last,current); i++){
                            photos.objectAt(i).set('selected',true);
                        }
                        photo.set('selected',true);

                    } else {
                        photo.toggleProperty('selected');
                    }

                    _this.set('last_clicked_photo',photo);
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
                yp = Em.$('#photos'),
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

        function selectElements() {
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

