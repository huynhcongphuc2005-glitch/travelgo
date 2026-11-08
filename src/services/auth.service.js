const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../utils/db');
const { badRequest, unauthorized, conflict } = require('../utils/httpError');
const { EMAIL_RE, requireString } = require('../utils/validators');

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, createdAt: u.createdAt });

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

function register({ name, email, password }) {
  const cleanName = requireString(name, 'Họ tên', { min: 2, max: 60 });
  const cleanEmail = requireString(email, 'Email', { max: 120 }).toLowerCase();
  if (!EMAIL_RE.test(cleanEmail)) throw badRequest('Email không hợp lệ');
  if (typeof password !== 'string' || password.length < 6) {
    throw badRequest('Mật khẩu phải có ít nhất 6 ký tự');
  }

  const users = db.collection('users');
  if (users.some((u) => u.email === cleanEmail)) {
    throw conflict('Email đã được đăng ký');
  }

  const user = {
    id: crypto.randomUUID(),
    name: cleanName,
    email: cleanEmail,
    passwordHash: bcrypt.hashSync(password, 10),
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  db.save();

  return { user: publicUser(user), token: signToken(user) };
}

function login({ email, password }) {
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const user = db.collection('users').find((u) => u.email === cleanEmail);
  if (!user || typeof password !== 'string' || !bcrypt.compareSync(password, user.passwordHash)) {
    throw unauthorized('Email hoặc mật khẩu không đúng');
  }
  return { user: publicUser(user), token: signToken(user) };
}

function getProfile(userId) {
  const user = db.collection('users').find((u) => u.id === userId);
  if (!user) throw unauthorized('Tài khoản không tồn tại');
  return publicUser(user);
}

module.exports = { register, login, getProfile };
