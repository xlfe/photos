import Em from 'ember';

function calc_width(_photo,min_height) {
    var _aspect = _photo.get('width') / _photo.get('height'), // 600w / 400h = 1.5
        _width = min_height * _aspect; // 200 * 1.5 = 300

    return _width;
}

export default Em.Controller.extend({
    queryParams: ['path'],
    p_obs: function() {
        var cp = this.get('path'),
            model = this.get('model.photos');
        if (Em.isNone(model)){
            return;
        }
        this.set('model.photos.current_path',cp);
    }.observes('path'),
    pp_obs: function() {
        var mpcp = this.get('model.photos.current_path');
        if (Em.isNone(mpcp)){
            return;
        }
        this.set('path',this.get('model.photos.current_path'));
        console.log(this.get('path'));
    }.observes('model.photos.current_path'),
    size_photos: function () {

        if (Em.$('.edge-to-edge').width() === null || Em.isEmpty(this.get('model.photos'))) {
            return;
        }

        var w = Em.$('.edge-to-edge').width(),
            cw = 0,
            cr = [],
            min_height = +this.get('model.minHeight')||320, //Minimum height of each row in pixels
            p = this.get('model.photos.folders').concat(this.get('model.photos.filtered_arrangedContent'));

        //Sizing algorithm is choose a minimum row height, add images until
        // adding an additional image would be wider than the width of the element
        // then scale the images so they take up the full width

        var scale_row = function (row) {

            var row_width = 0;

            row.forEach(function (__) {
                row_width += calc_width(__,min_height);
            });

            var scale = (w - row.length * 2) / row_width;

            row.forEach(function (__) {
                var _width = calc_width(__,min_height) * scale,
                    _height = __.get('height') / __.get('width') * _width;

                __.set('display_sz', [_width, _height]);
            });
        };

        p.forEach(function (_) {
            var _width = calc_width(_,min_height);

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
    }.observes('model.photos.content.[]', 'model.sortProperties','model.minHeight','model.photos.current_path')
});

