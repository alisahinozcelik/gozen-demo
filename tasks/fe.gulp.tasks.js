/**
 * Node Requirements
 */
const gulp = require('gulp');
const gutil = require('gulp-util');
const clean = require('gulp-clean');
const webpack = require('webpack');
const merge = require('webpack-merge');
const rootPath = require('app-root-path');
const WebpackDevServer = require('webpack-dev-server');
const fs = require('fs');

/**
 * Custom Requirements
 */
const mainConfig = JSON.parse(fs.readFileSync(rootPath + '/config/main.config.json', 'utf8'));
const webpackCommonConfig = require(rootPath + '/tasks/app.webpack.config.js');
const webpackEnvConfig = require(rootPath + '/tasks/app.env.webpack.config.js');

/**
 * Constants
 */
const appConstantsFilePath = `${rootPath}/${mainConfig.fe_app_cwd}/app.constants.ts`;
const environments = ['dev', 'prod'];
const constantsTemplate = `
	export const ENVIRONMENT = {
		isDev: #isDev,
		apiEndpoint: '#apiEndpoint'
	};`;

/**
 * Remove app.constants.ts File
 */
gulp.task('remove-const', [], () => {
	return gulp.src(appConstantsFilePath, {read: false}).pipe(clean());
});

/**
 * Set app.constants.ts file
 */
environments.forEach(val => {
	gulp.task('set-const:'+val, ['remove-const'], () => {
		const fileTmp = constantsTemplate
											.replace('#isDev', val === 'dev')
											.replace('#apiEndpoint', mainConfig['be_'+val+'_endpoint']);
		fs.writeFileSync(appConstantsFilePath, fileTmp);
	});
});

/**
 * Clean FE Destination Folder
 */
gulp.task('clean-fe-dest', [], () => {
	gulp.src(rootPath + mainConfig.fe_app_dest, {read: false}).pipe(clean());
});

/**
 * Bundle
 */
environments.forEach(env => {
	gulp.task('bundle:'+env, ['clean-fe-dest', 'set-const:'+env], () => {
		const bundler = webpack(merge(webpackCommonConfig, webpackEnvConfig.prod));

		bundler.run((err, stats) => {
			if (err) {
				gutil.log(gutil.colors.red(err.toString()));
			}
			gutil.log(stats.toString({
				colors: true,
				chunks: false,
				hash: false,
				version: false
			}));
		});
	});
});

/**
 * Serve
 */
environments.forEach(env => {
	gulp.task('serve:'+env, ['set-const:'+env], () => {
		const bundler = webpack(merge(webpackCommonConfig, webpackEnvConfig.dev));
		const serverOptions = {
			stats: {
				colors: true
			},
			compress: true,
			contentBase: rootPath + '/' + mainConfig.fe_app_cwd,
			historyApiFallback: true
		};

		const server = new WebpackDevServer(bundler, serverOptions);
		server.listen(mainConfig.fe_dev_port);
	});
});