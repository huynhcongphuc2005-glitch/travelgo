const hotels = require('../data/hotels.json');
const destinations = require('../data/destinations.json');
const { badRequest, notFound } = require('../utils/httpError');
const { assertNotPast, nightsBetween, parseDate, toInt } = require('../utils/validators');

function listCities() {
  return [...new Set(hotels.map((h) => h.city))].sort((a, b) => a.localeCompare(b, 'vi'));
}

function listDestinations() {
  return destinations.map((d) => {
    const inCity = hotels.filter((h) => h.city === d.city);
    return {
      ...d,
      hotelCount: inCity.length,
      fromPrice: inCity.length ? Math.min(...inCity.map((h) => h.pricePerNight)) : null,
    };
  });
}

function searchHotels(q) {
  const guests = toInt(q.guests, 'Số khách', { min: 1, max: 20, fallback: 2 });
  const rooms = toInt(q.rooms, 'Số phòng', { min: 1, max: 10, fallback: 1 });

  let nights = 1;
  if (q.checkIn || q.checkOut) {
    parseDate(q.checkIn, 'checkIn');
    parseDate(q.checkOut, 'checkOut');
    assertNotPast(q.checkIn, 'Ngày nhận phòng');
    nights = nightsBetween(q.checkIn, q.checkOut);
  }

  let result = hotels.slice();
  if (q.city) {
    if (!listCities().includes(q.city)) throw badRequest('Thành phố không hợp lệ');
    result = result.filter((h) => h.city === q.city);
  }
  if (q.q) {
    const kw = String(q.q).toLowerCase();
    result = result.filter((h) => h.name.toLowerCase().includes(kw));
  }
  if (q.stars) {
    const s = toInt(q.stars, 'Hạng sao', { min: 1, max: 5 });
    result = result.filter((h) => h.stars >= s);
  }
  if (q.minPrice) result = result.filter((h) => h.pricePerNight >= Number(q.minPrice));
  if (q.maxPrice) result = result.filter((h) => h.pricePerNight <= Number(q.maxPrice));

  const sorters = {
    price_asc: (a, b) => a.pricePerNight - b.pricePerNight,
    price_desc: (a, b) => b.pricePerNight - a.pricePerNight,
    rating: (a, b) => b.rating - a.rating,
    stars: (a, b) => b.stars - a.stars,
  };
  result.sort(sorters[q.sort] || sorters.rating);

  return {
    nights,
    guests,
    rooms,
    count: result.length,
    hotels: result.map((h) => ({ ...h, totalPrice: h.pricePerNight * nights * rooms })),
  };
}

function getHotel(id) {
  const hotel = hotels.find((h) => h.id === id);
  if (!hotel) throw notFound('Không tìm thấy khách sạn');
  return hotel;
}

module.exports = { listCities, listDestinations, searchHotels, getHotel };
