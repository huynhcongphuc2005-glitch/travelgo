const flightService = require('../services/flight.service');

exports.airports = (_req, res) => {
  res.json({ airports: flightService.listAirports() });
};

exports.search = (req, res) => {
  res.json(flightService.searchFlights(req.query));
};
