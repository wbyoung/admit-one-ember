var gulp = require('gulp');
var $ = require('gulp-load-plugins')();

gulp.task('default', ['build']);

gulp.task('build', ['lint', 'clean'], function() {
  return gulp.src('src/admit-one-ember.js')
    .pipe(gulp.dest('dist'))
    .pipe($.uglify())
    .pipe($.rename('admit-one-ember.min.js'))
    .pipe(gulp.dest('dist'));
});

gulp.task('lint', function() {
  return gulp.src('src/**/*.js')
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish'));
});

gulp.task('clean', function() {
  return gulp.src('dist')
    .pipe($.clean());
});
