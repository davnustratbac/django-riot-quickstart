var gulp = require('gulp'),
	debug = require('gulp-debug'),
	uglify = require('gulp-uglify'),
	sourcemaps = require('gulp-sourcemaps'),
	concat = require('gulp-concat'),
	jshint = require('gulp-jshint'),
	util = require("gulp-util"),
	sass = require("gulp-sass"),
	autoprefixer = require('gulp-autoprefixer'),
	minifycss = require('gulp-minify-css'),
	rename = require('gulp-rename'),
	env = require('gulp-env'),
	log = util.log,
	source = require('vinyl-source-stream'),
	buffer = require('vinyl-buffer'),
	browserify = require('browserify'),
	riotify = require('riotify'),
	glob = require('glob'),
	es = require('event-stream'),
	Server = require('karma').Server;

function DjangoFilePathParts(file) {
	var extension = file.slice(file.lastIndexOf('.') + 1, file.length),
		trimmable = (extension === 'js' ? process.env.JS_DIR : process.env.SASS_DIR) + '/',
		trimmed = file.slice(file.indexOf(trimmable) + trimmable.length),
		destModule = trimmed.slice(0, trimmed.indexOf('/')),
		destFolder = (extension === 'js' ? 'js' : 'css');

	this.baseName = trimmed.slice(trimmed.indexOf('/') + 1, trimmed.lastIndexOf('/'));
	this.directory = file.slice(0, file.lastIndexOf('/'));
	this.destPath = './' + destModule + '/static/' + destModule + '/' + destFolder + '/';
}

env({file: '.gulpenv.json'});

gulp.task('sass:compile', function (done) {
	var tasks = [];

	var sassPath = process.env.SASS_DIR + '/**/' + process.env.MAIN_SASS_FILE_NAME + '.scss';
	glob(sassPath, function(error, files) {
		if (error) { done(error); }

		tasks.concat(files.map(function(file){
			var filePathParts = new DjangoFilePathParts(file);

			return gulp.src(file)
				.pipe(sass({
					style: 'expanded'
				}))
				.pipe(autoprefixer('last 2 version'))
				.pipe(gulp.dest(filePathParts.destPath))
				.pipe(rename({
					basename: filePathParts.baseName,
					suffix: '.' + process.env.MINIFIED_CSS_SUFFIX
				}))
				.pipe(minifycss())
				.pipe(gulp.dest(filePathParts.destPath));
			})
		);
	});

	es.merge(tasks).on('end', done);
});

gulp.task('js:lint', function(){
	log("linting js files " + (new Date()).toString());
	gulp.src(process.env.JS_DIR + '/**/*.js')
		.pipe(debug())
		.pipe(jshint())
		.pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('js:test', ['js:lint'], function (done) {
	var serverConfig = {
		configFile: __dirname + '/karma.conf.js',
		singleRun: true
	};
	
	var exitCallback = function(exitStatus) {
		done(exitStatus ? "There are failing unit tests" : undefined);
	};
	
	new Server(serverConfig, exitCallback).start();
});

/**
 * We need to take all of the folders in our js folder and compile each of them 
 * into single files, depositing each file into the appropriate static location 
 * associated with a django module. We're using some ideas from this post: 
 * http://fettblog.eu/gulp-browserify-multiple-bundles/
 * to get multiple groups of files browserifying at the same time.
 */
gulp.task('js:compile', ['js:test', 'js:move'], function (done) {
	var tasks = [];

	var browerifyJSFilesPath = process.env.JS_DIR + '/**/' + process.env.MAIN_JS_FILE_NAME + '.js';
	glob(browerifyJSFilesPath, function(error, files) {
		if (error) { done(error); }

		tasks.concat(files.map(function(file){
			var filePathParts = new DjangoFilePathParts(file);

			return browserify({
					entries: [file],
					debug: true,
					transform: [riotify]
				}).bundle()
				.pipe(source(file))
				.pipe(buffer())
				.pipe(sourcemaps.init({loadMaps: true}))
				.pipe(uglify())
				.on('error', log)
				.pipe(rename({
					suffix: process.env.MINIFIED_JS_SUFFIX,
					basename: filePathParts.baseName,
					extname: '.js'
				}))
				.pipe(sourcemaps.write('./'))
				.pipe(gulp.dest(filePathParts.destPath));
			})
		);
	});

	var nonBrowerifyJSFilesPath = process.env.JS_DIR + '/**/' + process.env.MAIN_JS_FILE_NAME + '.' + process.env.JS_NO_BROWSERIFY_SUFFIX + '.js';
	glob(nonBrowerifyJSFilesPath, function(error, files) {
		if (error) { done(error); }

		tasks.concat(files.map(function(file){
			var filePathParts = new DjangoFilePathParts(file);
				
			return gulp.src(filePathParts.directory + '/*.js')
				.pipe(sourcemaps.init({loadMaps: true}))
				.pipe(concat(filePathParts.baseName + '.js'))
				.pipe(uglify())
				.on('error', log)
				.pipe(rename({
					suffix: process.env.MINIFIED_JS_SUFFIX,
					basename: filePathParts.baseName,
					extname: '.js'
				}))
				.pipe(sourcemaps.write('./'))
				.pipe(gulp.dest(filePathParts.destPath));
			})
		);
	});

	es.merge(tasks).on('end', done);
});

gulp.task('js:watch', function(){
	gulp.watch(process.env.JS_DIR + '/**/*.js', ['js:test', 'js:compile']);
});

gulp.task('sass:watch', function () {
	gulp.watch(process.env.SASS_DIR + '/**/*.scss', ['sass:compile']);
});

gulp.task('watch', ['sass:watch', 'js:watch']);

gulp.task('compile', ['sass:compile', 'js:compile']);

