const express = require('express');
const rateLimit = require('express-rate-limit');
const config = require('../config');
const { requireAuth } = require('../middleware/auth');
const auth = require('../controllers/auth.controller');
const flights = require('../controllers/flight.controller');
const hotels = require('../controllers/hotel.controller');
const bookings = require('../controllers/booking.controller');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Giới hạn số lần thử đăng nhập/đăng ký để chống dò mật khẩu
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.isTest,
  message: { error: { message: 'Quá nhiều yêu cầu, vui lòng thử lại sau ít phút' } },
});

// Auth
router.post('/auth/register', authLimiter, auth.register);
router.post('/auth/login', authLimiter, auth.login);
router.get('/auth/me', requireAuth, auth.me);

// Chuyến bay
router.get('/airports', flights.airports);
router.get('/flights/search', flights.search);

// Khách sạn
router.get('/cities', hotels.cities);
router.get('/destinations', hotels.destinations);
router.get('/hotels', hotels.search);
router.get('/hotels/:id', hotels.detail);

// Đơn đặt (yêu cầu đăng nhập)
router.post('/bookings', requireAuth, bookings.create);
router.get('/bookings', requireAuth, bookings.list);
router.get('/bookings/:id', requireAuth, bookings.detail);
router.patch('/bookings/:id/cancel', requireAuth, bookings.cancel);

module.exports = router;
