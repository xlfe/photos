import Em from 'ember';
import config from '../config/environment';

export default Em.Controller.extend({
    authenticator: 'authenticator:custom',
    queryParams: ['do'],
    session: Ember.inject.service('session'),

    processing: false,

    _show: function () {
        this.send('show', this.get('do') || 'login');
    }.observes('do'),

    login: true,
    actions: {
        show: function (what) {
            var _this = this;
            ['login', 'register', 'reset'].forEach(function (_) {
                _this.set(_, false);
            });
            this.set(what, true);
            this.set('do', what);

            ga('send', 'pageview', { 'page': '/login/'+what});
        },
        authenticate: function () {
            var _this = this,
                invite = this.get('session.invite');

            ga('send', 'event', 'action', 'authenticate');

            let { identification, password } = this.getProperties('identification', 'password');

            this.get('session').authenticate('authenticator:custom', {identification: identification, password: password})
            .then(function () {

                if (Em.isNone(invite) === false){
                    _this.transitionToRoute('invite',invite);
                }

            }, function (error) {
                ga('send', 'event', 'action', 'authentication-error');
                _this.set('error', error.error);
            });

        },
        register: function () {
            var _this = this;

            ga('send', 'event', 'action', 'register');
            this.set('processing', true);

            var data = this.getProperties('name', 'email', 'password'),
                endpoint = [config.api_host, config.api_endpoint, 'register'].join('/');

            Em.$.ajax({
                url: endpoint,
                method: 'POST',
                data: JSON.stringify({user: data}),
                dataType: 'json',
                success: function (_data) {
                    _this.set('identification', data['email'].toLowerCase());

                    setTimeout(function(){
                        _this.send('authenticate');
                    },1000);
                },
                error: function (error) {
                    _this.set('error', error.responseJSON.error);
                    _this.set('processing', false);
                }
            });

        }
    }
});

