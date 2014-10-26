exports.paths = {
    siteroot: '../photos/static',
    js_dest:  '../photos/static/js/',
    scripts: 'src/js',
    handlebars: 'src/hbs',
    sass: 'src/sass',
    sass_build: 'src/sass/main.sass',
    vendor: '../../../build_archive/js-vendor/',
    static: 'src/static'
};

exports.versions = {
    ember: '1.7.0',
    ember_data: '1.0.0b9',
//    jserrorlog: '1.4.2',
//    typeahead: '10.2',
    moment: '2.7.0',
//    model_fragments: '0.2.0',
//    jquery_daterangepicker: '0.5',
    moment_timezone_with_data: '0.1.0',
//    tagit: '2.0',
    handlebars_runtime: '1.3.0',
    bootstrap: '3.2.0'
}

exports.override_for_release = false;

exports.static_js = [
    'jquery-1.11.0.min.js',
    'jquery-ui-1.11.0.min.js',
    'modernizr-2.6.2-respond-1.1.0.min.js'
]

exports.userefs = null;
