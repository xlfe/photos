import Em from 'ember';
import DS from 'ember-data';
//Album

export default DS.Model.extend({
    name: DS.attr('string'),
    manualSort: DS.attr('list'),
    minHeight: DS.attr('number'),

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
    saving: true,
    watch_keeper: function () {

        if (this.get('saving') === true) {
            return;
        }

        Em.run.debounce(this, 'save_me', 5000);

    }.observes('minHeight'),
    photos: [],
    more_results: true,
    selected: function() {



    }.property
});

