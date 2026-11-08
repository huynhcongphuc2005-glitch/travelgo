const { badRequest } = require('./httpError');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Trả về chuỗi ngày hôm nay (YYYY-MM-DD) theo giờ Việt Nam (UTC+7). */
function todayVN() {
  const now = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return now.toISOString().slice(0, 10);
}

function parseDate(value, field) {
  if (typeof value !== 'string' || !DATE_RE.test(value)) {
    throw badRequest(`${field} phải có định dạng YYYY-MM-DD`);
  }
  const d = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value) {
    throw badRequest(`${field} không hợp lệ`);
  }
  return d;
}

function assertNotPast(value, field) {
  if (value < todayVN()) {
    throw badRequest(`${field} không được ở trong quá khứ`);
  }
}

function toInt(value, field, { min = 1, max = 20, fallback } = {}) {
  if (value === undefined || value === '') {
    if (fallback !== undefined) return fallback;
    throw badRequest(`Thiếu ${field}`);
  }
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw badRequest(`${field} phải là số nguyên từ ${min} đến ${max}`);
  }
  return n;
}

function requireString(value, field, { min = 1, max = 100 } = {}) {
  if (typeof value !== 'string') throw badRequest(`Thiếu ${field}`);
  const s = value.trim();
  if (s.length < min || s.length > max) {
    throw badRequest(`${field} phải dài từ ${min} đến ${max} ký tự`);
  }
  return s;
}

function nightsBetween(checkIn, checkOut) {
  const a = parseDate(checkIn, 'checkIn');
  const b = parseDate(checkOut, 'checkOut');
  const nights = Math.round((b - a) / 86400000);
  if (nights < 1) throw badRequest('Ngày trả phòng phải sau ngày nhận phòng');
  if (nights > 30) throw badRequest('Chỉ hỗ trợ đặt tối đa 30 đêm');
  return nights;
}

module.exports = {
  EMAIL_RE,
  todayVN,
  parseDate,
  assertNotPast,
  toInt,
  requireString,
  nightsBetween,
};
