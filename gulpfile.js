const gulp = require('gulp');
const csso = require('gulp-csso');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');
const sass = require('gulp-sass');
const plumber = require('gulp-plumber');
const cp = require('child_process');
const imagemin = require('gulp-imagemin');
const browserSync = require('browser-sync');
const del = require('del');
const babel = require('gulp-babel');
const autoprefixer = require('gulp-autoprefixer');

const jekyllCommand = (/^win/.test(process.platform)) ? 'jekyll.bat' : 'jekyll';

/*
 * Build the Jekyll Site
 * runs a child process in node that runs the jekyll commands
 */
gulp.task('jekyll-build', function (done) {
	return cp.spawn(jekyllCommand, ['build'], {stdio: 'inherit'})
		.on('close', done);
});

/*
 * Rebuild Jekyll & reload browserSync
 */
gulp.task('jekyll-rebuild', gulp.series('jekyll-build', function () {
	browserSync.reload();
}));


/*
 * Build the jekyll site and launch browser-sync
 */
gulp.task('browser-sync', gulp.series('jekyll-build', function() {
	browserSync({
		server: {
			baseDir: '_site'
		}
	});
}));

/*
* Compile and minify sass
*/
gulp.task('sass', function() {
  return gulp.src('src/styles/**/*.scss')
    .pipe(plumber())
    .pipe(sass({
        includePaths: ['node_modules']
    }))
    .pipe(autoprefixer())
    .pipe(csso())
    .pipe(gulp.dest('assets/css'));
});

/*
 * Minify images
 */
gulp.task('imagemin', function() {
	return gulp.src('src/img/**/*.{jpg,png,gif}')
		.pipe(plumber())
		.pipe(imagemin({ optimizationLevel: 3, progressive: true, interlaced: true }))
		.pipe(gulp.dest('assets/img/'));
});

/**
 * Compile and minify js
 */
gulp.task('js', function() {
	return gulp.src('src/js/**/*.js')
		.pipe(plumber())
        .pipe(babel({ presets: ['env'] }))
		.pipe(concat('main.js'))
		.pipe(uglify())
		.pipe(gulp.dest('assets/js/'));
});

gulp.task('watch', function() {
	return gulp.parallel(
		'watch:styles',
		'watch:js',
		'watch:images',
		'watch:html',
		'watch:yml')
});

gulp.task('watch:styles', function() {
    return gulp.watch('src/styles/**/*.scss').on('all', gulp.series('jekyll-rebuild'));
});

gulp.task('watch:js', function() {
    return gulp.watch('src/js/**/*.js').on('all', gulp.series('jekyll-rebuild'))
});

gulp.task('watch:images', function() {
    return gulp.watch('src/img/**/*.{jpg,png,gif}').on('all', gulp.series('imagemin'))
});

gulp.task('watch:html', function() {
    return gulp.watch(['*html', '_includes/*html', '_layouts/*.html']).on('all', gulp.series('jekyll-rebuild'));
});

gulp.task('watch:yml', function() {
    return gulp.watch(['_data/*.yml', '_includes/*.yml', '_config.yml']).on('all', gulp.series('jekyll-rebuild'));
});

gulp.task('cpToSrc', function() {
    return gulp.src('_site/**/*', {base: './_site'})
        .pipe(gulp.dest('./'));
});

gulp.task('pdf', function () {
    return gulp.src('src/pdf/*.pdf')
        .pipe(gulp.dest('assets/pdf'))
});

gulp.task('reload', gulp.series(gulp.parallel('js', 'pdf'), 'jekyll-rebuild'));

gulp.task('build', gulp.series(gulp.parallel('js', 'sass', 'pdf'), 'jekyll-build'));

gulp.task('default', gulp.series('build', 'browser-sync', 'watch'));

gulp.task('clean', function (cb) {
    del([
        'src/**/*',
        'assets/**/*',
        '_data/**/*',
        '_includes/**/*',
        '_layouts/**/*',
        'gulpfile.js',
        'index.html',
        '.DS_Store',
        '.travis.yml',
        'package.json'
    ]);
    cb()
});

const deploy = gulp.series('jekyll-build', 'clean', 'cpToSrc', 'pdf');

gulp.task('deploy', deploy);
