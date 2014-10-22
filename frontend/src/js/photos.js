"use strict";
var attr = DS.attr;

App.Photo = DS.Model.extend({
    title: attr(),
    caption: attr(),
    width: attr(),
    height: attr(),
    uploaded: attr('isodatetime'),
    serving_url: attr('string',{transient: true}),
    orientation: attr('number'),


    saving: true,
    am_loaded: function() {
        this.set('saving',false);
    }.on('didLoad'),
    save_me: function() {
        var _this =this;
        this.set('saving',true);
        this.save().then(function(){
            _this.set('saving',false);
        })
    },
    watch_keeper: function() {

        if (this.get('saving') == true){
            return;
        }

        Em.run.debounce(this,'save_me',5000);

    }.observes('title'),
    img_src: function(){
        return this.get('serving_url') + '=s300';
    }.property('serving_url')
});

App.PhotoGridPhotoComponent = Em.Component.extend({
    tagName: 'div',
    classNameBindings: [':photo', 'context.photo.saving:'],
    background_img: function(){
        var img_src = 'url(' + this.get('photo.img_src'),
            or = this.get('photo.orientation');

        if (or == 6) {
            img_src += '-r90)';
        } else if (or == 8) {
            img_src += '-r270)';
        } else {
            img_src += ')'
        }

        console.log(img_src);
        this.$().css({'background-image':img_src});
    }.observes('photo.img_src').on('didInsertElement'),
    setup: function() {
        var sz = this.get('photo.display_sz'),
            w = sz[0],
            h = sz[1];

        this.$().css({
            height: h + 'px',
            width:  w + 'px'
        });

        console.log(w,h);

    }.observes('photo.display_sz').on('didInsertElement'),
    click: function() {
        console.log('clicked')
    },
})
