import Em from 'ember';

export default Em.View.extend({
    didInsertElement: function(){
        var c = this.get('controller');
        c.set('sorted',[]);
        c.set('sort_by',undefined);
        c.set('sortDescending',false);
        c.set('sortNatural',true);
        console.log("reset")

    }
})