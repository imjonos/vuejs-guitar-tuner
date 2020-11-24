// vue.config.js
const fs = require('fs')

module.exports = {
    runtimeCompiler: true,
    productionSourceMap: true, // NOTE: this is default
    configureWebpack: {
        devtool: 'source-map',
    }/*,
    devServer: {
        https: {
            key: fs.readFileSync('/etc/apache2/ssl/localhost.key'),
            cert: fs.readFileSync('/etc/apache2/ssl/localhost.crt'),
        },
        public: 'https://localhost:8080'
    }*/
}