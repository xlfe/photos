import Em from 'ember';

export default Em.Controller.extend({
    needs:['album'],
    manualsortOptions: [
        {name: 'Title', val: 'title'},
        {name: 'Uploaded date-time', val: 'uploaded'}
    ],

    sortOptions: function() {

        var photos = this.get('controllers.album.arrangedContent'),
            options = {},
            sortOptions = [];

        photos.forEach(function(_){
            for (var k in _.get('metadata')){
                options[k] = true;
            }
        });

        for (var k in options) {
            sortOptions.pushObject({
                name: k,
                val: 'metadata.'+k
            })
        }

        return this.manualsortOptions.concat(sortOptions);

    }.property('controllers.album.arrangedContent.length'),
    actions: {
        save: function () {

            if (Em.isNone(this.get('sort_by'))){
                alert('Please select the photo property to sort by')
                return;
            }

            var c = this.get('controllers.album'),
                photos = c.get('arrangedContent'),
                sort_by = this.get('sort_by'),
                ascending = this.get('sortDescending') === false,
                min = new Big(0.1),
                max = new Big(0.9),
                interval = max.minus(min).div(photos.length);

            Em.run(function(){
                photos = photos.sortBy(sort_by);

                if (ascending === false){
                    photos = photos.reverseObjects();
                }

                photos.forEach(function (_) {
                    _.set('pos', min.toString());
                    min = min.add(interval);
                });
            });
            this.send('closeModal')
        },
        sort_check: function(option){
            this.set('sort_by',option.val);
        },
        close: function () {
            this.send('closeModal');
        }
    }
});

