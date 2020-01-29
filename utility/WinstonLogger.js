const winston = require('winston');
const path = require('path');

const logDirectory = path.join(__dirname, '../log')

const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.File({
      filename: `${logDirectory}/error.log`,
      level: 'error',
      format: winston.format.combine(
        winston.format.label({ label: path.basename(process.mainModule.filename) }),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(
          info => `(${info.timestamp})[${info.label}]-[${info.level}]: ${info.message}`
        )
      )
    }),
    new winston.transports.File({
      filename: `${logDirectory}/combined.log`,
      level: 'info',
      format: winston.format.combine(
        winston.format.label({ label: path.basename(process.mainModule.filename) }),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(
          info => `(${info.timestamp})[${info.label}]-[${info.level}]: ${info.message}`
        )
      )
    }),
    new winston.transports.Console({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'silly',
      format: winston.format.combine(
        winston.format.label({ label: path.basename(process.mainModule.filename) }),
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(
          info => `(${info.timestamp})[${info.label}]-[${info.level}]: ${info.message}`
        )
      )
    })
  ]
});

module.exports = logger;
