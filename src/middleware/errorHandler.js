const config = require('../config');
const { HttpError, notFound } = require('../utils/httpError');

/** Bắt mọi request /api không khớp route nào. */
function apiNotFound(_req, _res, next) {
  next(notFound('Không tìm thấy endpoint'));
}

// Express nhận diện error handler qua đủ 4 tham số, nên phải giữ `_next`.
function errorHandler(err, _req, res, _next) {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { message: 'Body JSON không hợp lệ' } });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: { message: err.message, details: err.details } });
  }
  if (!config.isTest) console.error(err);
  return res.status(500).json({ error: { message: 'Lỗi hệ thống, vui lòng thử lại sau' } });
}

module.exports = { apiNotFound, errorHandler };
