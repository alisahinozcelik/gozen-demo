const webpack = require('webpack');

module.exports = {
	dev: {
		metadata: {
			isDevServer: true
		},
		devtool: 'source-map'
	},
	prod: {
		plugins: [
			new webpack.optimize.UglifyJsPlugin({
				comments: false,
				sourceMap: false
			})
		]
	}
};