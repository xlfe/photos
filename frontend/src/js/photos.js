"use strict";
var attr = DS.attr;

App.Photo = DS.Model.extend({
    title: attr(),
    caption: attr(),
    width: attr('number',{transient: true}),
    height: attr('number',{transient: true}),
    uploaded: attr('isodatetime',{transient: true}),
    serving_url: attr('string',{transient: true}),
    orientation: attr('number',{transient:true}),

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

    }.observes('title')
});

App.PhotoGridPhotoComponent = Em.Component.extend({
    tagName: 'div',
    attributeBindings: ['draggable'],
    draggable: "true",
    classNameBindings: [':photo', 'context.photo.saving:','highlight-right:','highlight-left:'],
    get_img_url: function(long_edge_width) {
        var url = this.get('photo.serving_url') + '=s' + long_edge_width,
            or = this.get('photo.orientation');

        return url.replace('http:','');

        if (or == 6) {
            url += '-r90';
        } else if (or == 8) {
            url += '-r270';
        }

        return url;

    },
    background_img: function(){

        var img_src = this.get_img_url(300);
        this.$().css({'background-image':'url(' + img_src + ')'});

    }.on('didInsertElement'),
    setup: function() {
        var sz = this.get('photo.display_sz'),
            w = sz[0],
            h = sz[1];

        this.$().css({
            height: h + 'px',
            width:  w + 'px'
        });

    }.observes('photo.display_sz').on('didInsertElement'),
    click: function() {
        console.log('clicked')
    },
    dragStart: function() {
        console.log('dragstart')
        this.$().bind('drop',function(){
            console.log('dropped')
        })
    },
    dragOver: function(evt,hmm) {
        var left = evt.target.offsetLeft,
            top = evt.target.offsetTop,
            height = evt.target.offsetBottom - evt.target.offsetTop,
            width = evt.target.offsetWidth,
            mouseX = evt.originalEvent.clientX,
            mouseY = evt.originalEvent.clientY;

        if (mouseX > left + width / 2) {
            this.set('highlight-left',false);
            this.set('highlight-right',true);
        } else {
            this.set('highlight-left',true);
            this.set('highlight-right',false);
        }

//        console.log('dragOver',this.get('photo.title'),lorr);
//        this.set('highlight',lorr);
    },
    dragEnter: function() {
//        this.set('highlight',true)
        console.log('dragEnter',this.get('photo.title'))
    },
    dragLeave: function() {
        this.set('highlight-left',false)
        this.set('highlight-right',false)
        console.log('dragExit',this.get('photo.title'))
    },
    dragEnd: function() {
        console.log('dragEnd',this.get('photo.title'))
    },
    drop: function() {
        console.log('dragDrop',this.get('photo.title'))
    }
})
