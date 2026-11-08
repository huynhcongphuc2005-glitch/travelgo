const jwt = require('jsonwebtoken');
const config = require('../config');
const { unauthorized } = require('../utils/httpError');

function requireAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(unauthorized('Thiếu hoặc sai định dạng token (Authorization: Bearer <token>)'));
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = { id: payload.sub, email: payload.email };
    return next();
  } catch {
    return next(unauthorized('Token không hợp lệ hoặc đã hết hạn'));
  }
}

module.exports = { requireAuth };
