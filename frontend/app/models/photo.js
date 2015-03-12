import DS from 'ember-data';
import Em from 'ember';

var attr = DS.attr;

export default DS.Model.extend({
    title: attr(),
    caption: attr(),
    album_pos_id: attr('number'),
    width: attr('number', {transient: true}),
    height: attr('number', {transient: true}),
    path: attr('string'),
    uploaded: attr('isodatetime', {transient: true}),
    serving_url: attr('string', {transient: true}),
    orientation: attr('number', {transient: true}),
    original_metadata: attr('object'),

    saving: true,
    am_loaded: function () {
        this.set('saving', false);
    }.on('didLoad'),
    save_me: function () {
        var _this = this;
        this.set('saving', true);
        this.save().then(function () {
            _this.set('saving', false);
        });
    },
    watch_keeper: function () {

        if (this.get('saving') === true) {
            return;
        }

        Em.run.debounce(this, 'save_me', 5000);

    }.observes('title')
});
