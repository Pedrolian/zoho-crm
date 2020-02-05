logger = require('../../../utility/WinstonLogger.js');
logger.setPath('../../../log');

logger.error('error log test');
logger.warn('warn log test');
logger.info('info log test');
logger.http('http log test');
logger.verbose('verbose log test');
logger.debug('debug log test');
logger.silly('silly log test');
