function assert(condition, message) {
    if (!condition) {
        throw message || "Assertion failed";
    }
}

var     gulp            = require('gulp'),
        gutil           = require('gulp-util'),
        uglify          = require('gulp-uglify'),
        concat          = require('gulp-concat'),
        rename          = require('gulp-rename'),
        closureCompiler = require('gulp-closure-compiler'),
        minifyCSS       = require('gulp-minify-css'),
        handlebars      = require('gulp-ember-handlebars'),
        defineModule    = require('gulp-define-module'),
        sass            = require('gulp-ruby-sass'),
        defn            = require(process.cwd() + '/defn.js'),
        rimraf          = require('gulp-rimraf'),
        watch           = require('gulp-watch'),
        debug           = require('gulp-debug'),
        useref          = require('gulp-useref'),
        gulpif          = require('gulp-if');

//console.log(process.cwd())

var needs = [];

var paths = defn.paths,
    versions = defn.versions,
    static_js = defn.static_js,
    userefs = defn.userefs;

gulp.task('clean-siteroot', function() {
    return gulp
        .src(paths.siteroot + '/', {read: false})
        .pipe(rimraf({force: true}));
});

function copy_vendor_files(t,cb) {

    var js_root = paths.vendor,
        v = versions,
        files = [];

    for (k in v) {
        files.push(k + '.' + v[k] + '.' + t + '.js');
    }

    static_js.forEach(function(s) {
        files.push(s);
    });

    needs = files.slice(0);

    return gulp
        .src(files,{cwd:js_root})
       .pipe(rename(function(path) {
            var idx = needs.indexOf(path.basename + path.extname);
            needs.splice(idx,1);

            for (k in v) {
                //only rename files in the v dictionary
                if (path.basename.search(k) == 0) {
                    //remove the version and debug/min from the filename
                    path.basename = path.basename.replace(/\..*/,'');
                    return;
                }
            }

        }))

        .pipe(gulp.dest(paths.js_dest));

}


gulp.task('copy-vendor-debug', ['move-vendor-debug'], function () {
    assert(needs.length == 0,needs);
});

gulp.task('copy-vendor-release', ['move-vendor-release'], function () {
    assert(needs.length == 0,needs);
});

gulp.task('move-vendor-debug', function(){
    return copy_vendor_files('debug');
});

gulp.task('move-vendor-release', function(){
    return copy_vendor_files('min');
});

gulp.task('copy-static',function() {
    return gulp
        .src([paths.static + '/**/**','!**/**.py','!**/**.csv','!**/**.sh'])
        .pipe(gulp.dest(paths.siteroot));
});

var compile_sass = function(level) {
    var _ = gulp
        .src(paths.sass_build)
        .pipe(sass({sourcemap: level == 'debug'}));

    if (level == 'min') {
        _ = _.pipe(minifyCSS({keepBreaks:false}));
    }

    return _.pipe(gulp.dest(paths.siteroot + '/css'));
}

gulp.task('compile-sass-debug', function(){
    return compile_sass('debug');
})

gulp.task('compile-sass-release', function(){
    return compile_sass('min');
})


function compile_hbs(level) {
    var hbs = gulp
//        .src(paths.handlebars + '/components/progress-bar.hbs')
        .src(paths.handlebars + '/**/*.hbs')
        .pipe(handlebars({
            outputType: 'browser'
        }))
        .pipe(defineModule('plain'));

    if (level == 'min') {
        hbs = hbs.pipe(uglify());
    }

    return hbs
        .pipe(concat('templates.js'))
        .pipe(gulp.dest(paths.js_dest));
}

gulp.task('compile-hbs-debug', function() {
    return compile_hbs('debug');
});

gulp.task('compile-hbs-release', function() {
    return compile_hbs('min');
});

var compile_app = function(level) {
    var app = gulp
        .src(paths.scripts + '/**/*.js');

    if (level == 'min') {
        app = app.pipe(uglify());
    }

    return app
        .pipe(concat('app.js'))
        .pipe(gulp.dest(paths.js_dest));
}

gulp.task('compile-app-release', function () {
    return compile_app('min')
});

gulp.task('compile-app-debug', function () {
    return compile_app('debug')
});



gulp.task('compile-useref',function(){
    console.log(userefs);
    if (userefs == null) {
        return
    }
    var assets = useref.assets();

    return gulp.src(userefs+'.html')
        .pipe(assets)
        .pipe(gulpif('*.js', rename(function(path){
            if (path.basename == 'combined'){
                path.extname = '.skipjs';
            } else if (path.basename == 'application') {
                path.extname = '.hbs'
            }
            console.log(path);
        })))
        .pipe(gulpif('*.hbs',handlebars({outputType: 'browser'})))
        .pipe(gulpif('*.hbs',defineModule('plain')))
        .pipe(gulpif('*.hbs',rename(function(path){path.extname='.js';})))
        .pipe(gulpif('*.js', uglify()))
        .pipe(gulpif('*.skipjs', rename(function(path){path.extname='.js'})))
        .pipe(gulpif('*.css',rename(function(path){
            if (path.basename == 'survey'){
                path.extname = '.sass'
            }
        })))
        .pipe(gulpif('*.sass',sass({sourcemap:false})))
        .pipe(gulpif('*.css', minifyCSS()))
        .pipe(assets.restore())
        .pipe(useref())
        .pipe(gulp.dest(paths.siteroot + '/' + userefs + '/'));
});

gulp.task('watch', ['debug'], function() {
    gulp.watch(paths.handlebars + '/**',['compile-hbs-debug']);
    gulp.watch(paths.scripts + '/**/*.js',['compile-app-debug']);
    if ('sass' in paths) {
        gulp.watch(paths.sass + '/**',['compile-sass-debug']);
    }
    gulp.watch(paths.static + '/**',['copy-static']);
});

gulp.task('watch-useref',['compile-useref'],function(){
    gulp.watch(userefs + '/**',['compile-useref']);
    gulp.watch(paths.handlebars + '/**',['compile-useref']);
    gulp.watch(paths.scripts + '/**/*.js',['compile-useref']);
    if ('sass' in paths) {
        gulp.watch(paths.sass + '/**', ['compile-useref']);
    }
})


var build = function(level) {
    gulp.start('copy-static');
    gulp.start('copy-vendor-' + level);
    gulp.start('compile-hbs-' + level);
    if ('sass' in paths) {
        gulp.start('compile-sass-' + level);
    }
    gulp.start('compile-app-' + level);

}


gulp.task('debug',['clean-siteroot'], function() {
    build('debug');
    gulp.start('compile-useref');
});


gulp.task('release',['clean-siteroot'], function() {
    if (defn.override_for_release != false) {
        paths.siteroot = './release';
        paths.js_dest = './release/js';
    }
    build('release');
    gulp.start('compile-useref');
});

gulp.task('default',['watch']);
