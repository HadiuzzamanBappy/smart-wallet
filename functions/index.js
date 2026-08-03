const { initializeApp } = require("firebase-admin/app");
initializeApp();

exports.parseTransaction = require("./handlers/parseTransaction");
exports.getAIAdvice = require("./handlers/getAIAdvice");
