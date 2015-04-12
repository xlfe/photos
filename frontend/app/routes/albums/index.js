import Em from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';


export default Em.Route.extend(AuthenticatedRouteMixin,{
    model: function () {
        return this.get('store').find('album');
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
        }
    }
});

