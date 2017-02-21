/* global require, module */

var EmberApp = require('ember-cli/lib/broccoli/ember-app');

var Funnel = require('broccoli-funnel');


module.exports = function(defaults) {
    var app = new EmberApp(defaults, {
        // Any other options
    });

    // app.import('bower_components/spark-md5/spark-md5.min.js');
    // app.import('bower_components/big.js/big.js');
    // app.import('bower_components/moment/moment.js');
    // app.import('bower_components/moment-timezone/builds/moment-timezone-with-data-2010-2020.min.js');
    // app.import('bower_components/hammerjs/hammer.js');
    // app.import('bower_components/ember-hammer/ember-hammer.js');

    var static = Funnel('static/', {
        srcDir: '/',
        destDir: '/static'
    });

    return app.toTree([static]);
};
