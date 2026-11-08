const hotelService = require('../services/hotel.service');

exports.cities = (_req, res) => {
  res.json({ cities: hotelService.listCities() });
};

exports.destinations = (_req, res) => {
  res.json({ destinations: hotelService.listDestinations() });
};

exports.search = (req, res) => {
  res.json(hotelService.searchHotels(req.query));
};

exports.detail = (req, res) => {
  res.json({ hotel: hotelService.getHotel(req.params.id) });
};
