// Config.js

const fs   = require('fs');
const yaml = require('js-yaml');

class ConfigClass {
    constructor() {
                
        const rawConfig = yaml.load(fs.readFileSync('./config/config.yaml', 'utf8'));
        
        this.raspi = {};
        this.appServer = {};
        
        for (var item in rawConfig.raspi) {
            this.raspi[item] = rawConfig.raspi[item];
        }
        
        for (var item in rawConfig.appServer) {
            this.appServer[item] = rawConfig.appServer[item];
        }
        
    }
} // class ConfigClass

const Config = new ConfigClass();

module.exports = Config;