/* jshint node: true */

module.exports = function (environment) {
    var ENV = {
        modulePrefix: 'frontend',
        environment: environment,
        baseURL: '/',
        locationType: 'auto',
        EmberENV: {
            FEATURES: {
                // Here you can enable experimental features on an ember canary build
                // e.g. 'with-controller': true
            }
        },

        APP: {
            // Here you can pass flags/options to your application instance
            // when it is created
        }
    };

    ENV['simple-auth'] = {
        authorizer: 'authorizer:custom',
        routeAfterAuthentication: 'albums',
        routeIfAlreadyAuthenticated: 'albums'
    };

    ENV.api_endpoint = 'api';

    if (environment === 'development') {
        // ENV.APP.LOG_RESOLVER = true;
        // ENV.APP.LOG_ACTIVE_GENERATION = true;
        // ENV.APP.LOG_TRANSITIONS = true;
        // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
        // ENV.APP.LOG_VIEW_LOOKUPS = true;

        ENV.contentSecurityPolicy = {
            'connect-src': "'self' http://iolggr.appspot.com http://localhost:8080 http://192.168.5.5:8080"
        }
        ENV.development = true;

        ENV.api_host = 'http://192.168.5.5:8080';
        ENV.api_host = 'http://localhost:8080';
    }

    if (environment === 'test') {
        // Testem prefers this...
        ENV.baseURL = '/';
        ENV.locationType = 'none';

        // keep test console output quieter
        ENV.APP.LOG_ACTIVE_GENERATION = false;
        ENV.APP.LOG_VIEW_LOOKUPS = false;

        ENV.APP.rootElement = '#ember-testing';
    }

    if (environment === 'production') {

    }

    return ENV;
};
