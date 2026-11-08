const fs = require('fs');
const path = require('path');
const config = require('../config');

/**
 * Kho dữ liệu JSON đơn giản (đủ cho đồ án, không cần cài database).
 * Toàn bộ dữ liệu được giữ trong bộ nhớ và ghi xuống file theo kiểu atomic
 * (ghi file tạm rồi rename) để tránh hỏng file khi tiến trình bị dừng đột ngột.
 * Có thể thay bằng MongoDB / PostgreSQL mà không cần đổi tầng controller.
 */
let cache = null;

function emptyDb() {
  return { users: [], bookings: [] };
}

function load() {
  if (cache) return cache;
  try {
    const raw = fs.readFileSync(config.dbFile, 'utf8');
    cache = { ...emptyDb(), ...JSON.parse(raw) };
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
    cache = emptyDb();
  }
  return cache;
}

function save() {
  const dir = path.dirname(config.dbFile);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${config.dbFile}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(cache, null, 2), 'utf8');
  fs.renameSync(tmp, config.dbFile);
}

/** Đọc collection (mảng) theo tên: 'users' | 'bookings' */
function collection(name) {
  return load()[name];
}

/** Dùng cho test: xóa cache để nạp lại từ file */
function reset() {
  cache = null;
}

module.exports = { collection, save, reset };
