import DS from 'ember-data';
//Album

export default DS.Model.extend({
    name: DS.attr('string'),
    sortProperties: DS.attr('string'),
    sortAscending: DS.attr('boolean'),
    manualSort: DS.attr('list'),
    minHeight: DS.attr('number'),
    sortOptions: [
        {name: 'Uploaded date/time', val: 'uploaded'},
        {name: 'Photo title', val: 'title'},
        {name: 'Digitized', val: 'original_metadata.DateTime'},
        {name: 'Manual', val: 'position'}
    ],

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

    }.observes('minHeight')
});

