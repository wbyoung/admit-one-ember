var gulp = require('gulp');
var path = require('path');
var $ = require('gulp-load-plugins')();

var moduleName = function(name, file) {
  var compoents = name.split(path.sep);
  var name = compoents[compoents.length-1];
  var package = require(path.join('packages', compoents[0], 'package.json'));
  if (compoents[1] === 'lib') {
    compoents.splice(1, 1);
  }
  if (name === package.main) {
    compoents.pop();
  }
  return compoents.join(path.sep);
}

gulp.task('default', ['clean'], function() {
  gulp.start('lint', 'build');
});

gulp.task('build', ['lint', 'clean', 'transpile', 'browser']);

gulp.task('transpile', function() {
  var src = [
    'packages/**/*.js',
    '!packages/ember-admit-one-loader/**/*.js'
  ];
  return gulp.src(src)
    .pipe($.es6ModuleTranspiler({
      type: "amd",
      moduleName: moduleName
    }))
    .pipe($.concat('admit-one-ember.amd.js'))
    .pipe(gulp.dest('dist'));
});

gulp.task('browser', ['transpile'], function() {
  var src = [
    'bower_components/loader.js/loader.js',
    'dist/admit-one-ember.amd.js',
    'packages/ember-admit-one-loader/lib/loader.js'
  ];
  return gulp.src(src)
    .pipe($.concat('admit-one-ember.js'))
    .pipe($.wrap('(function() {\n<%= contents %>}());\n'))
    .pipe(gulp.dest('dist'))
    .pipe($.uglify())
    .pipe($.rename('admit-one-ember.min.js'))
    .pipe(gulp.dest('dist'));
});

gulp.task('lint', function() {
  return gulp.src('packages/**/*.js')
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish'));
});

gulp.task('test', ['build'], function() {
  return gulp.src([
    'bower_components/jquery/dist/jquery.js',
    'bower_components/handlebars/handlebars.runtime.js',
    'bower_components/ember/ember.js',
    'dist/admit-one-ember.js',
    'test/**/*.js'
  ])
  .pipe($.karma({
    configFile: 'karma.conf.js',
    action: 'run'
  }));
});

gulp.task('clean', function() {
  return gulp.src('dist')
    .pipe($.clean());
});
