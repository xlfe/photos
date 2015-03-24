import Em from 'ember';

export default Em.Component.extend({
    tagName: 'div',
    attributeBindings: ['draggable'],
    draggable: true,
    classNameBindings: [
        ':folder',
        'highlight:'
    ],
    setup: function() {
        var sz = this.get('folder.display_sz'),
            w = sz[0],
            h = sz[1];

        if (Em.isNone(this.$())){
            return
        }

        this.$().css({
            height: h + 'px',
            width:  w + 'px'
        });

    }.observes('folder','folder.display_sz').on('didInsertElement'),
    click: function() {
        this.sendAction('path',this.get('folder.path'));
    },
    dragOver: function(evt){
        this.set('highlight',true);
        evt.preventDefault();
    },
    dragLeave: function(){
        this.set('highlight', false);
    },
    drop: function(){

        var
            //Album controller
            album = this.get('album'),

            //The item we're draggin
            photo = album.get('drag.photo'),

            //Before or after?
            pos = album.get('drag.position'),

            //multiple photos?
            multi = !Em.isEmpty(this.get('album.selected')),

            //Where we've dropped the photo
            folder = this.get('folder');

        this.set('highlight', false);

        if (multi){

        } else {

            photo.set('path',folder.get('path'));

            console.log('one photo moved to',folder.get('path'));
        }




    }

});
