var gulp = require('gulp');
var ts = require('gulp-typescript');
var tsProject = ts.createProject('src/tsconfig.json');
var sourcemaps = require('gulp-sourcemaps');
var shell = require('gulp-shell');

var spawn = require('child_process').spawn;

gulp.task('transpile', function () {
  return tsProject.src()
    .pipe(sourcemaps.init())
    .pipe(ts(tsProject))
    .js
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('dist'));
});

gulp.task('copy-package', function () {
  return gulp.src('package.json')
    .pipe(gulp.dest('dist'));
});

gulp.task('copy-credentials', function () {
  return gulp.src('credentials/*')
    .pipe(gulp.dest('dist/credentials'));
});

gulp.task('copy-src-files', ['copy-package', 'copy-credentials']);

gulp.task('copy-dockerfile', function () {
  return gulp.src('Dockerfile')
    .pipe(gulp.dest('dist'));
});

gulp.task('build', ['transpile', 'copy-src-files', 'copy-dockerfile'], shell.task(
  'docker build -t submission-api -f ./dist/Dockerfile ./dist'));

// Starts / restarts the api container
gulp.task('start', ['build', 'stop'], shell.task(
  'docker run -d --name submission-api -p 80:80 submission-api'));

// '2>/dev/null' ignores stderr
// '|| true' "forces" a 0 exit code
gulp.task('stop', shell.task([
  'docker kill submission-api 2>/dev/null || true',
  'docker rm submission-api 2>/dev/null || true'
]));
