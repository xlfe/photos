import DS from 'ember-data';
//Album

export default DS.Model.extend({
    name: DS.attr('string'),
    sortProperties: DS.attr('string'),
    sortAscending: DS.attr('boolean'),
    manualSort: DS.attr('list'),
    sortOptions: [
        {name: 'Uploaded date/time', val: 'uploaded'},
        {name: 'Photo title', val: 'title'},
        {name: 'Digitized', val: 'original_metadata.DateTime'},
        {name: 'Manual', val: 'position'}
    ]
});

