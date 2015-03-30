import Em from 'ember';
import LoginControllerMixin from 'simple-auth/mixins/login-controller-mixin';
import config from '../config/environment';

export default Em.Controller.extend(LoginControllerMixin, {
    authenticator: 'authenticator:custom',
    queryParams: ['do'],

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
        },
        authenticate: function () {
            var _this = this;

            this._super().then(function () {
                this.transition

            }, function (error) {
                _this.set('error', error.error);
            });
        },
        register: function () {
            var _this = this;

            this.set('processing', true);

            var data = this.getProperties('name', 'email', 'password'),
                endpoint = [config.api_host, config.api_endpoint, 'register'].join('/');

            Em.$.ajax({
                url: endpoint,
                method: 'POST',
                data: JSON.stringify({user: data}),
                dataType: 'json',
                success: function (_data) {
                    console.log(_data,data);
                    _this.set('identification', data['email'].toLowerCase());

                    _this.send('authenticate');
                },
                error: function (error) {
                    _this.set('error', error.responseJSON.error);
                    _this.set('processing', false);
                }
            });

        }
    }
});

