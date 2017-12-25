/*
* @author: indrajra
* @description: Common logger module that can help us unify logging pattern
*/

var log4js = require('log4js');
log4js.configure({
    appenders: {
        consoleAppender: { type: 'console',
            layout: {
                type: 'pattern',
                pattern: '%d{yyyy-MM-dd hh:mm:ss} %X{AWSRequestId} %p %m%n'
            } 
        }
    },
    categories: { default: { appenders: ['consoleAppender'], level: 'info' } }
});

var _logger = log4js.getLogger();

module.exports.logger = _logger;
module.exports.log4js = log4js;
