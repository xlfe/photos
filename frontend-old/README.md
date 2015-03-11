Frontend development folder
---------------------------

### Setup

I use npm and gulp.js to compile the front-end templates into the live site.

You will need node.js installed on your machine to use it:

```
$ brew install npm
$ npm install gulp -g
```

Then, inside ./frontend/ run:

```
$ npm install
```

This should download the requirements listed in `package.json` and create a folder called `node_modules` (excluded from git).

Then you should be able to run:

```
$ gulp
```

Which will compile the javascript into the required format and copy all files into ./siteroot it will also watch the src 
files for changes and recompile/copy only changed files. Ctrl-c to cancel that watch.
