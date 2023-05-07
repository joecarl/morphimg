import path from 'path';
import { fileURLToPath } from 'url';
//import ESLintPlugin from 'eslint-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack from 'webpack';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default params => {

	return {

		entry: './test/index.ts',

		devServer: {
			hot: true,
			liveReload: false,
			allowedHosts: 'all',
			port: 3000,			
		},

		module: {
			rules: [
				{
					test: /\.tsx?$/,
					use: {
						loader: 'ts-loader',
					},
					exclude: /node_modules/,
				},
			],
		},
		
		plugins: [
			//new ESLintPlugin({}),
			new HtmlWebpackPlugin({
				template: './test/index.html'
			}),
		],

		resolve: {
			extensions: ['.ts', '.js', '...'],
		}
	};

};
