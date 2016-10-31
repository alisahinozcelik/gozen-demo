const gulp = require('gulp');
const rootPath = require('app-root-path');

/**
 * Require gulp tasks
 */
require(rootPath + '/tasks/fe.gulp.tasks');

gulp.task('default', [], () => {
	console.log('ok');
});

