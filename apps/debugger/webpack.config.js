const nxWebpack = require('@nrwl/react/plugins/webpack')
const TerserPlugin = require('terser-webpack-plugin')
const path = require('path')

module.exports = config => {
  const nxWebpackConfig = nxWebpack(config)
  console.log(nxWebpackConfig)

  const webpackConfig = {
    ...nxWebpackConfig,
    resolve: {
      ...nxWebpackConfig.resolve,
      alias: {
        path: require.resolve("path-browserify"),
      }
    },
    node: {
      fs: 'empty',
      tls: 'empty',
      readline: 'empty',
      net: 'empty',
      module: 'empty',
      child_process: 'empty'
    }
  }

  webpackConfig.module.rules.push({
    test: /\.js|jsx$/,
    use: {
        loader: 'babel-loader',
        options: {
            presets: [
                ["@babel/preset-env", {
                    useBuiltIns: 'entry',
                    corejs: 3
                }],
                "@babel/preset-react"
            ],
            plugins: [
                
            ],
            include: [
                path.resolve('node_modules/ethereumjs/'),
            ],
            exclude: /node_modules\/(?!ethereumjs).+/
        }
    }
})

  if (process.env.NODE_ENV === 'production') {
    return {
      ...webpackConfig,
      mode: 'production',
      devtool: 'source-map',
      optimization: {
        minimize: true,
        minimizer: [new TerserPlugin()]
      }
    }
  } else {
    return webpackConfig
  }
}
