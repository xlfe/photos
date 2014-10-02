"use strict";
var attr = DS.attr;

App.Photo = DS.Model.extend({
    title: attr(),
    caption: attr()
});

App.PhotosRoute = Em.Route.extend({
    model: function(){
        console.log('getting photos')
        return this.get('store').find('photo');
    },
    actions: {
        save: function(obj) {
            obj.set('saving',true);
            obj.save().then(function(o){
                o.set('saving',false);
            });
        }
    }
})