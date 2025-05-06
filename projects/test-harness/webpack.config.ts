const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

import 'webpack-dev-server';
import { resolve } from 'path';
import { Configuration } from 'webpack';

const buildConfig = (isRoot: boolean): Configuration => {
    const entry = isRoot ? 'root-app' : 'default-app';

    const plugins = isRoot
        ? [
            new HtmlWebpackPlugin({
                filename: `root-app.html`,
                template: resolve(__dirname, 'src', entry, `${entry}.html`),
                scriptLoading: 'defer',
                inject: 'body',
            }),
            new CopyPlugin({
                patterns: [{ from: resolve(__dirname, 'src', 'assets'), to: 'assets' }],
            }),
        ]
        : [
            // 2 HtmlWebpackPlugin - one to create html file for app A, one for app B
            new HtmlWebpackPlugin({
                filename: `app-a.html`,
                template: resolve(__dirname, 'src', entry, `${entry}.html`),
                scriptLoading: 'defer',
                inject: 'body',
            }),
            new HtmlWebpackPlugin({
                filename: `app-b.html`,
                template: resolve(__dirname, 'src', entry, `${entry}.html`),
                scriptLoading: 'defer',
                inject: 'body',
            }),
        ];

    return {
        entry: {
            [isRoot ? 'root-app' : 'default-app']: resolve(__dirname, `./src/${entry}/${entry}.ts`),
        },
        output: {
            filename: '[name].[contenthash].js',
            path: resolve(__dirname, '../../build/test-harness'),
        },
        resolve: {
            extensions: ['.ts', '.tsx', '.js'],
            alias: {
                '@morgan-stanley/fdc3-web': resolve(__dirname, '../../dist/@morgan-stanley/fdc3-web/'),
                '@morgan-stanley/fdc3-web-messaging-provider': resolve(__dirname, '../../dist/@morgan-stanley/fdc3-web-messaging-provider/'),
            },
            fullySpecified: false,
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    use: [
                        {
                            loader: 'ts-loader',
                            options: {
                                configFile: resolve(__dirname, './tsconfig.build.json'),
                            },
                        },
                    ],
                },
                {
                    test: /\.(scss|sass)$/,
                    use: ['style-loader', 'css-loader', 'sass-loader'],
                },
            ],
        },
        plugins,
        stats: {
            assets: true,
            colors: true,
            warnings: false,
            errors: true,
            errorDetails: true,
        },
        devtool: 'source-map',
        mode: "development"
    };
};

module.exports = () => {
    return [buildConfig(true), buildConfig(false)];
};
