const data = require('../data/flights.json');
const { badRequest, notFound } = require('../utils/httpError');
const { parseDate, assertNotPast, toInt } = require('../utils/validators');

const airportByCode = Object.fromEntries(data.airports.map((a) => [a.code, a]));
const airlineByCode = Object.fromEntries(data.airlines.map((a) => [a.code, a]));

const pad = (n) => String(n).padStart(2, '0');

function hash(str) {
  let h = 0;
  for (const ch of str) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

function addMinutes(time, minutes) {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const dayOffset = Math.floor(total / 1440);
  const t = total % 1440;
  return { time: `${pad(Math.floor(t / 60))}:${pad(t % 60)}`, dayOffset };
}

/** Giá tăng nhẹ vào cuối tuần (CN, T6, T7). */
function dayFactor(dateObj) {
  return { 0: 1.1, 5: 1.05, 6: 1.1 }[dateObj.getUTCDay()] || 1;
}

function findRoute(from, to) {
  return data.routes.find(
    (r) => (r.from === from && r.to === to) || (r.from === to && r.to === from)
  );
}

function buildFlights(from, to, date) {
  const route = findRoute(from, to);
  if (!route) return [];
  const dateObj = parseDate(date, 'date');
  const factor = dayFactor(dateObj);
  const flights = [];

  data.airlines.forEach((airline, ai) => {
    data.slots.forEach((slot, si) => {
      // Mỗi hãng chỉ khai thác 3/4 khung giờ để kết quả đa dạng hơn
      if ((ai + si) % 4 === 3) return;
      const number = `${airline.code}${100 + hash(`${from}${to}`) % 400 + ai * 7 + si * 3}`;
      const arrive = addMinutes(slot, route.durationMin);
      const price = Math.round((route.basePrice * airline.priceFactor * factor) / 1000) * 1000;
      flights.push({
        id: `${from}-${to}-${number}`,
        flightNumber: number,
        airline: { code: airline.code, name: airline.name },
        from: airportByCode[from],
        to: airportByCode[to],
        date,
        departTime: slot,
        arriveTime: arrive.time,
        arriveDayOffset: arrive.dayOffset,
        durationMin: route.durationMin,
        pricePerPassenger: price,
        seatsLeft: 12 + (hash(`${number}${date}`) % 130),
      });
    });
  });
  return flights;
}

function searchFlights({ from, to, date, passengers, sort }) {
  if (!airportByCode[from]) throw badRequest('Sân bay đi không hợp lệ');
  if (!airportByCode[to]) throw badRequest('Sân bay đến không hợp lệ');
  if (from === to) throw badRequest('Điểm đi và điểm đến phải khác nhau');
  parseDate(date, 'date');
  assertNotPast(date, 'Ngày bay');
  const pax = toInt(passengers, 'Số hành khách', { min: 1, max: 9, fallback: 1 });

  const flights = buildFlights(from, to, date).map((f) => ({
    ...f,
    totalPrice: f.pricePerPassenger * pax,
  }));

  const sorters = {
    price: (a, b) => a.pricePerPassenger - b.pricePerPassenger,
    duration: (a, b) => a.durationMin - b.durationMin,
    departure: (a, b) => a.departTime.localeCompare(b.departTime),
  };
  flights.sort(sorters[sort] || sorters.departure);
  return { passengers: pax, count: flights.length, flights };
}

function getFlight(id, date) {
  const m = /^([A-Z]{3})-([A-Z]{3})-/.exec(id || '');
  if (!m) throw notFound('Không tìm thấy chuyến bay');
  const flight = buildFlights(m[1], m[2], date).find((f) => f.id === id);
  if (!flight) throw notFound('Không tìm thấy chuyến bay');
  return flight;
}

const listAirports = () => data.airports;
const getAirlines = () => data.airlines.map(({ code, name }) => ({ code, name }));

module.exports = { searchFlights, getFlight, listAirports, getAirlines, airlineByCode };
