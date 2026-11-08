const crypto = require('crypto');
const db = require('../utils/db');
const flightService = require('./flight.service');
const hotelService = require('./hotel.service');
const { badRequest, notFound, forbidden } = require('../utils/httpError');
const {
  assertNotPast,
  nightsBetween,
  parseDate,
  requireString,
  toInt,
} = require('../utils/validators');

const PAYMENT_METHODS = ['card', 'bank_transfer', 'e_wallet', 'pay_at_property'];

function bookingCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'TG';
  for (let i = 0; i < 6; i++) code += alphabet[crypto.randomInt(alphabet.length)];
  return code;
}

function validateCommon(payload) {
  const contactPhone = requireString(payload.contactPhone, 'Số điện thoại', { min: 8, max: 15 });
  if (!/^[0-9+\s-]+$/.test(contactPhone)) throw badRequest('Số điện thoại không hợp lệ');
  const paymentMethod = payload.paymentMethod || 'card';
  if (!PAYMENT_METHODS.includes(paymentMethod)) throw badRequest('Phương thức thanh toán không hợp lệ');
  return { contactPhone, paymentMethod };
}

function buildFlightBooking(payload) {
  parseDate(payload.date, 'date');
  assertNotPast(payload.date, 'Ngày bay');
  const flight = flightService.getFlight(payload.flightId, payload.date);

  if (!Array.isArray(payload.passengers) || payload.passengers.length < 1) {
    throw badRequest('Cần ít nhất 1 hành khách');
  }
  if (payload.passengers.length > 9) throw badRequest('Tối đa 9 hành khách mỗi đơn');
  const passengers = payload.passengers.map((p, i) => ({
    fullName: requireString(p && p.fullName, `Họ tên hành khách ${i + 1}`, { min: 2, max: 60 }),
  }));
  if (passengers.length > flight.seatsLeft) throw badRequest('Chuyến bay không đủ chỗ trống');

  return {
    type: 'flight',
    title: `${flight.from.city} → ${flight.to.city}`,
    subtitle: `${flight.airline.name} · ${flight.flightNumber} · ${flight.departTime} - ${flight.arriveTime}`,
    details: { flight, passengers },
    totalPrice: flight.pricePerPassenger * passengers.length,
  };
}

function buildHotelBooking(payload) {
  const hotel = hotelService.getHotel(payload.hotelId);
  assertNotPast(payload.checkIn, 'Ngày nhận phòng');
  const nights = nightsBetween(payload.checkIn, payload.checkOut);
  const rooms = toInt(payload.rooms, 'Số phòng', { min: 1, max: 10, fallback: 1 });
  const guests = toInt(payload.guests, 'Số khách', { min: 1, max: 20, fallback: 2 });
  const guestName = requireString(payload.guestName, 'Tên khách', { min: 2, max: 60 });

  return {
    type: 'hotel',
    title: hotel.name,
    subtitle: `${hotel.city} · ${payload.checkIn} → ${payload.checkOut} (${nights} đêm)`,
    details: {
      hotel: { id: hotel.id, name: hotel.name, city: hotel.city, stars: hotel.stars },
      checkIn: payload.checkIn,
      checkOut: payload.checkOut,
      nights,
      rooms,
      guests,
      guestName,
      pricePerNight: hotel.pricePerNight,
    },
    totalPrice: hotel.pricePerNight * nights * rooms,
  };
}

function createBooking(userId, payload = {}) {
  const common = validateCommon(payload);
  let built;
  if (payload.type === 'flight') built = buildFlightBooking(payload);
  else if (payload.type === 'hotel') built = buildHotelBooking(payload);
  else throw badRequest("type phải là 'flight' hoặc 'hotel'");

  const booking = {
    id: crypto.randomUUID(),
    code: bookingCode(),
    userId,
    ...built,
    ...common,
    currency: 'VND',
    status: 'confirmed',
    createdAt: new Date().toISOString(),
    cancelledAt: null,
  };
  db.collection('bookings').push(booking);
  db.save();
  return booking;
}

function listBookings(userId) {
  return db
    .collection('bookings')
    .filter((b) => b.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function ownBooking(userId, id) {
  const booking = db.collection('bookings').find((b) => b.id === id);
  if (!booking) throw notFound('Không tìm thấy đơn đặt');
  if (booking.userId !== userId) throw forbidden();
  return booking;
}

function getBooking(userId, id) {
  return ownBooking(userId, id);
}

function cancelBooking(userId, id) {
  const booking = ownBooking(userId, id);
  if (booking.status === 'cancelled') throw badRequest('Đơn đã được hủy trước đó');
  booking.status = 'cancelled';
  booking.cancelledAt = new Date().toISOString();
  db.save();
  return booking;
}

module.exports = { createBooking, listBookings, getBooking, cancelBooking, PAYMENT_METHODS };
