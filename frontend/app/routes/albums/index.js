import Em from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';


export default Em.Route.extend(AuthenticatedRouteMixin,{
    model: function () {
        var me = +this.get('session.secure.id');
        return this.get('store').findAll('album').then(function(albums){
            albums.forEach(function(a){
                //console.log(typeof me,me,typeof a.get('owner.id'),a.get('owner.id'));
                a.set('am_i_owner',+a.get('owner.id') === me);
            });
            return albums;
        });
    },
    afterModel: function() {
        ga('send', 'pageview', { 'page': '/albums', 'title': 'Album list' });
    },
    actions: {
        new_album: function () {
            var name = prompt('New album name?'),
                _this = this;

            if (Em.$.trim(name).length === 0) {
                return;
            }

            this.get('store').createRecord('album', {
                name: name
            }).save().then(function (_) {
                _this.transitionTo('album', _.get('id'));
            });
        },
        delete_album: function(album){

            var confirmation = prompt('Deleting an album is permanent. Please type "I understand" in the box below ' +
            'to continue deleting the album "' + album.get('name') + '"');

            if (Em.$.trim(confirmation).toLowerCase() === 'i understand'){
                album.destroyRecord();
                this.transitionTo('albums');
            }
        }
    }
});

