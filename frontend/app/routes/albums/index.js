import Em from 'ember';

export default Em.Route.extend({
    model: function () {
        return this.get('store').find('album');
    },
    actions: {
        new_album: function () {
            var name = prompt('New album name?'),
                _this = this;

            if (Em.$.trim(name).length === 0) {
                return;
            }

            this.get('store').createRecord('album', {
                name: name,
                minHeight: 320,
                sortProperties: 'uploaded',
                sortAscending: true
            }).save().then(function (_) {
                _this.transitionTo('album', _);
            });
        }
    }
});

