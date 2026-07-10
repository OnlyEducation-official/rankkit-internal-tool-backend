"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendResponse = void 0;
const sendResponse = ({ res, statusCode, success, message, data, meta, error, }) => {
    res.status(statusCode).json({
        success,
        message,
        data,
        meta: {
            timestamp: new Date().toISOString(),
            ...meta,
        },
        error,
    });
};
exports.sendResponse = sendResponse;
