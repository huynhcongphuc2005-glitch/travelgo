const bookingService = require('../services/booking.service');

exports.create = (req, res) => {
  res.status(201).json({ booking: bookingService.createBooking(req.user.id, req.body) });
};

exports.list = (req, res) => {
  const bookings = bookingService.listBookings(req.user.id);
  res.json({ count: bookings.length, bookings });
};

exports.detail = (req, res) => {
  res.json({ booking: bookingService.getBooking(req.user.id, req.params.id) });
};

exports.cancel = (req, res) => {
  res.json({ booking: bookingService.cancelBooking(req.user.id, req.params.id) });
};
