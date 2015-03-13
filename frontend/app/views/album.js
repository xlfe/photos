import Em from 'ember';

function calc_width(_photo) {
    var _aspect = _photo.get('width') / _photo.get('height'), // 600w / 400h = 1.5
        min_height = 320, //Minimum height of each row in pixels
        _width = min_height * _aspect; // 200 * 1.5 = 300

    return _width;
}

export default Em.View.extend({
    images: 'photos.arrangedContent',
    templateName: 'albums/album',
    didInsertElement: function () {
        var _this = this;

        Em.$(window).resize(function () {
            Em.run.debounce(_this, _this.size_photos, 100);
        });

        this.size_photos();
    },
    size_photos: function () {

        if (this.$('edge-to-edge') === undefined || this.get('controller.model.photos') === undefined) {
            return;
        }

        var w = this.$('.edge-to-edge').width(),
            cw = 0,
            cr = [],
            p = this.get('controller.model.photos.folders').concat(this.get('controller.model.photos.filtered_arrangedContent'));

        //Sizing algorithm is choose a minimum row height, add images until
        // adding an additional image would be wider than the width of the element
        // then scale the images so they take up the full width


        var scale_row = function (row) {

            var row_width = 0;

            row.forEach(function (__) {
                row_width += calc_width(__);
            });

            var scale = (w - row.length * 2) / row_width;

            row.forEach(function (__) {
                var _width = calc_width(__) * scale,
                    _height = __.get('height') / __.get('width') * _width;

                __.set('display_sz', [_width, _height]);
            });
        };

        p.forEach(function (_) {
            var _width = calc_width(_);

            if (_width + cw <= w) {
                //adding this image would not overflow the row, so add it
                cr.pushObject(_);
                cw += _width;
            } else {
                scale_row(cr);
                cr = [_];
                cw = _width;
            }

        });

        if (cr.length > 0) {
            scale_row(cr);
        }
    }.observes('controller.model.photos', 'controller.model.sortProperties','controller.model.photos.current_path'),
    actions: {
        do_size: function () {
            console.log('doing size');
            this.size_photos();
        }
    }
});

