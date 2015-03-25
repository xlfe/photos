import Em from 'ember';

export default Em.Controller.extend({
    sortOptions: [
        {name: 'Uploaded date/time', val: 'uploaded'},
        {name: 'Photo title', val: 'title'},
        {name: 'Digitized', val: 'original_metadata.DateTime'},
        {name: 'Manual', val: 'position'}
    ],

    actions: {
        save: function () {
            console.log(this.get('sort_by'))
            console.log(this.get('sortAscending'));
        },
        sort_check: function(option){
            this.set('sort_by',option.val);
        },
        close: function () {
          console.log('sort-close');
        }
    }
});

