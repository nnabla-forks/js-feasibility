const gulp = require("gulp");

const gulpBabel = require("gulp-babel");
const gulpClean = require("gulp-clean");
const gulpCleanCSS = require("gulp-clean-css");
const gulpConcat = require("gulp-concat");
const gulpCSSlint = require("gulp-csslint");
const gulpEslint = require("gulp-eslint");
const gulpRename = require("gulp-rename");
const gulpStripImportExport = require("gulp-strip-import-export");
const gulpUglify = require("gulp-uglify");
const browserify = require("browserify");
const vinylSourceStream     = require("vinyl-source-stream");
const vinylBuffer     = require("vinyl-buffer");

const jsSources = "src/js/*.js";
const cssSources = "src/css/*.css";

const cleanRelTask = () => {
  return gulp.src("dist/release", {allowEmpty:true})
    .pipe(gulpClean());
};

const cleanDevTask = () => {
  return gulp.src("dist/dev", {allowEmpty:true})
    .pipe(gulpClean());
};


const jsLintTask = () => {
  return gulp.src("src/js/*.js")
    .pipe(gulpEslint({useEslintrc: true}))
    .pipe(gulpEslint.format())
    .pipe(gulpEslint.failAfterError())
    .pipe(gulpStripImportExport());
}

const jsBase = ( release ) => {
  let js = browserify("src/js/test02.js")
      .bundle()
      .pipe(vinylSourceStream("test02.js"))
      .pipe(vinylBuffer())
      //.pipe(gulpBabel({presets: ["@babel/env"]}))
  if ( release ) {
    js = js.pipe(gulpUglify())
      .pipe(gulpRename({extname: ".min.js"}))
      .pipe(gulp.dest("dist/release/"));
  } else {
    js = js.pipe(gulpRename({extname: ".js"}))
      .pipe(gulp.dest("dist/dev/"));
  }
  return js;
}

const jsRelTask = () => {
  return jsBase(true);
};

const jsDevTask = () => {
  return jsBase(false);
};

const cssLintTask = () => {
  return gulp.src("src/css/*.css")
    .pipe(gulpCSSlint(".csslintrc.json"))
}

const cssRelTask = () => {
  return gulp.src("src/css/*.css")
    .pipe(gulpConcat("test02.css"))
    .pipe(gulpCleanCSS())
    .pipe(gulpRename({extname: ".min.css"}))
    .pipe(gulp.dest("dist/release/"));
};

const cssDevTask = () => {
  return gulp.src("src/css/*.css")
    .pipe(gulpConcat("test02.css"))
    .pipe(gulpRename({extname: ".css"}))
    .pipe(gulp.dest("dist/dev/"));
};

const htmlRelTask = () => {
  return gulp.src("src/html/release/index.html")
    .pipe(gulp.dest("dist/release/"));
};

const htmlDevTask = () => {
  return gulp.src("src/html/dev/index.html")
    .pipe(gulp.dest("dist/dev/"));
};

const relTasks = gulp.series(
  cleanRelTask,
  gulp.parallel(
    jsRelTask,
    cssRelTask,
    htmlRelTask,
  ));

const devTasks = gulp.series(
  cleanDevTask,
  gulp.parallel(
    jsDevTask,
    cssDevTask,
    htmlDevTask,
  ));

const lintTasks = gulp.parallel(
  jsLintTask,
  cssLintTask);

exports.lint = lintTasks;
exports.release = relTasks;
exports.dev = devTasks;

exports.default = gulp.series(
  lintTasks,
  gulp.parallel(devTasks,
                relTasks));
