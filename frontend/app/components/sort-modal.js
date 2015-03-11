import Em from 'ember';

export default Em.Controller.extend({
    actions: {
        save: function () {
//            console.log('sort-save');
            var c = this.get('model.photos');
            c.update_sort();
            this.get('model').save();
            this.$('.modal').modal('hide');
        },
        close: function () {
//            console.log('sort-close');
        }
    }
});

