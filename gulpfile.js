var gulp = require('gulp');
var ts = require('gulp-typescript');
var tsProject = ts.createProject('src/tsconfig.json');
var sourcemaps = require('gulp-sourcemaps');
var shell = require('gulp-shell');

var spawn = require('child_process').spawn;
var node;

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

gulp.task('copy-scripts', function () {
  return gulp.src('src/scripts/*')
    .pipe(gulp.dest('dist/scripts'));
});

gulp.task('copy-files', ['copy-package', 'copy-credentials', 'copy-scripts']);

gulp.task('build', ['transpile', 'copy-files']);

gulp.task('run', ['build'], shell.task(
  'node ./dist/index.js'
));

gulp.task('server', function () {
  if (node) {
    node.kill();
  }
  node = spawn('node', ['dist/index.js'], {stdio: 'inherit'})
  node.on('close', function (code) {
    if (code === 8) {
      gulp.log('Error detected, waiting for changes...');
    }
  });
});

gulp.task('run', ['build'], function () {
  gulp.run('server');
  gulp.watch('src/**/*', ['run'], function () {
    gulp.run('server');
  });
})

gulp.task('build-api', ['build'], shell.task(
  'docker build -t api -f dockerfile/api.dockerfile ./dist'
));

gulp.task('start-api', ['build-api'], shell.task(
  'docker run -d --name api -p 8080:8080 -v /var/run/docker.sock:/var/run/docker.sock api'
));

gulp.task('stop-api', shell.task([
  'docker kill api',
  'docker rm api'
]));

gulp.task('build-compiler', shell.task(
  'docker build -t compiler -f dockerfile/compiler.dockerfile .'
));

gulp.task('default', ['run']);

process.on('exit', function() {
  if (node) {
    node.kill();
  }
})
