const winston = require("winston");

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      level: process.env.WINSTON_CONSOLE_LEVEL || "silly",
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.printf((info) => `(${info.timestamp})[${info.level}]: ${info.message}`)
      ),
    }),
  ],
});

setPath = (logDirectory) => {
  logger.add(
    new winston.transports.File({
      filename: `${logDirectory}/error.log`,
      level: process.env.WINSTON_LOG_ERROR_LEVEL || "error",
      format: winston.format.combine(winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), winston.format.json()),
    })
  );

  logger.add(
    new winston.transports.File({
      filename: `${logDirectory}/all.log`,
      level: process.env.WINSTON_LOG_ALL_LEVEL || "info",
      format: winston.format.combine(winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), winston.format.json()),
    })
  );
};

module.exports = logger;
module.exports.setPath = setPath;
