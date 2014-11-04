"use strict";
var attr = DS.attr;

App.Photo = DS.Model.extend({
    title: attr(),
    caption: attr(),
    album_pos_id: attr('number'),
    width: attr('number',{transient: true}),
    height: attr('number',{transient: true}),
    uploaded: attr('isodatetime',{transient: true}),
    serving_url: attr('string',{transient: true}),
    orientation: attr('number',{transient:true}),
    original_metadata: attr('object'),

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
var drag = {
    dragging: null,
    position: null
};

App.PhotoGridPhotoComponent = Em.Component.extend({
    tagName: 'div',
    attributeBindings: ['draggable'],
    draggable: "true",
    classNameBindings: [':photo', 'context.photo.saving:','highlight-right:','highlight-left:'],
    get_img_url: function(long_edge_width) {
        var url = this.get('photo.serving_url') + '=s' + (+long_edge_width).toFixed(0),
            or = this.get('photo.orientation');

        return url.replace('http:','');

        if (or == 6) {
            url += '-r90';
        } else if (or == 8) {
            url += '-r270';
        }

        return url;

    },
    background_img: function(width,height){

        var long_edge = Math.min(1600,Math.max(width,height)),
            img_src = this.get_img_url(long_edge);

        this.$().css({'background-image':'url(' + img_src + ')'});
    },
    setup: function() {
        var sz = this.get('photo.display_sz'),
            w = sz[0],
            h = sz[1];

        this.$().css({
            height: h + 'px',
            width:  w + 'px'
        });

        this.background_img(w,h);


    }.observes('photo.display_sz').on('didInsertElement'),
    didInsertElement: function() {
        console.log(this.get('album._lightbox'))
    },
    dragStart: function() {
        drag['dragging']= this.get('photo.album_pos_id');
        console.log('Drag starting with ' + drag['dragging']);
    },
    dragOver: function(evt) {
        var left = evt.target.offsetLeft,
            width = evt.target.offsetWidth,
            mouseX = evt.originalEvent.clientX;

        if (mouseX > left + width / 2) {
            this.set('highlight-left',false);
            this.set('highlight-right',true);
            drag['position'] = 'after';
        } else {
            this.set('highlight-left',true);
            this.set('highlight-right',false);
            drag['position'] = 'before';
        }
        evt.preventDefault()
    },
    dragLeave: function() {
        this.set('highlight-left',false)
        this.set('highlight-right',false)
    },
//    dragEnd: function() {
//        console.log('dragEnd',this.get('photo.title'))
//    },
    drop: function(evt) {

        var ms = this.get('album.manualSort'),
            offset = 0,
            asc = this.get('album.sortAscending');

        if (this.get('album.sortProperties') !== 'position') {
            this.set('album.sortProperties','position');
            this.get('album.photos').update_sort();
        }

        //Remove the item we just dragged
        ms.removeObject(drag['dragging']);
//        ms.splice(ms.indexOf(drag['dragging']),1);

        offset = ms.indexOf(this.get('photo.album_pos_id'));

        if (drag['position'] =='after'){
            offset +=1;
        }

        if (asc == false){
            offset += 1;
        }

        if (asc == false && drag['position'] == 'after') {

            offset -= 2;
        }
        console.log(offset);
        ms.insertAt(offset,drag['dragging']);
//        ms.splice(offset,0,drag['dragging'])

//        this.set('album.manualSort',ms);

        this.set('highlight-left',false);
        this.set('highlight-right',false);
        this.get('album.photos').update_sort();
        this.get('album').save();
    }
})
