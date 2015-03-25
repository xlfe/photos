import Em from 'ember';

export default Em.Controller.extend({
    actions: {
        save: function () {

            console.log(this.get('sort_by'))
            //var c = this.get('model.photos');
            //c.update_sort();
            //this.$('.modal').modal('hide');
            console.log('hmm')
        },
        //close: function () {
        //  console.log('sort-close');
        //}
    }
});

