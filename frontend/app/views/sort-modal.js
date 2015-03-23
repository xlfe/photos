import Em from 'ember';

export default Em.View.extend({
    sortOptions: [
        {name: 'Uploaded date/time', val: 'uploaded'},
        {name: 'Photo title', val: 'title'},
        {name: 'Digitized', val: 'original_metadata.DateTime'},
        {name: 'Manual', val: 'position'}
    ],
    actions: {
        save: function() {
            console.log("sort me")
        }
    }
});


