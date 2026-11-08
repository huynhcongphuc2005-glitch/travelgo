const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const os = require('os');
const path = require('path');
const fs = require('fs');

// Cấu hình môi trường test TRƯỚC khi nạp app
const tmpDb = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'travelgo-')), 'db.json');
process.env.NODE_ENV = 'test';
process.env.DB_FILE = tmpDb;
process.env.JWT_SECRET = 'test-secret';

const createApp = require('../src/app');

let server;
let base;
let token;

function futureDate(days) {
  const d = new Date(Date.now() + 7 * 3600 * 1000 + days * 86400000);
  return d.toISOString().slice(0, 10);
}

async function api(method, url, body, auth = token) {
  const res = await fetch(base + url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}

before(async () => {
  server = createApp().listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
  fs.rmSync(path.dirname(tmpDb), { recursive: true, force: true });
});

test('GET /api/health trả về ok', async () => {
  const r = await api('GET', '/api/health');
  assert.equal(r.status, 200);
  assert.equal(r.body.status, 'ok');
});

test('endpoint không tồn tại trả 404 dạng JSON', async () => {
  const r = await api('GET', '/api/khong-co');
  assert.equal(r.status, 404);
  assert.ok(r.body.error.message);
});

test('đăng ký: validate và chống trùng email', async () => {
  const bad = await api('POST', '/api/auth/register', { name: 'A', email: 'x', password: '1' });
  assert.equal(bad.status, 400);

  const ok = await api('POST', '/api/auth/register', {
    name: 'Nguyễn Văn A',
    email: 'a@example.com',
    password: 'secret123',
  });
  assert.equal(ok.status, 201);
  assert.ok(ok.body.token);
  assert.equal(ok.body.user.passwordHash, undefined);
  token = ok.body.token;

  const dup = await api('POST', '/api/auth/register', {
    name: 'Nguyễn Văn A',
    email: 'A@example.com',
    password: 'secret123',
  });
  assert.equal(dup.status, 409);
});

test('đăng nhập đúng/sai mật khẩu và lấy profile', async () => {
  const wrong = await api('POST', '/api/auth/login', { email: 'a@example.com', password: 'sai' });
  assert.equal(wrong.status, 401);

  const ok = await api('POST', '/api/auth/login', { email: 'a@example.com', password: 'secret123' });
  assert.equal(ok.status, 200);

  const me = await api('GET', '/api/auth/me', null, ok.body.token);
  assert.equal(me.status, 200);
  assert.equal(me.body.user.email, 'a@example.com');
});

test('tìm chuyến bay hợp lệ, hai chiều, sắp xếp theo giá', async () => {
  const date = futureDate(10);
  const r = await api('GET', `/api/flights/search?from=SGN&to=HAN&date=${date}&passengers=2&sort=price`);
  assert.equal(r.status, 200);
  assert.ok(r.body.count > 0);
  const prices = r.body.flights.map((f) => f.pricePerPassenger);
  assert.deepEqual(prices, [...prices].sort((a, b) => a - b));
  assert.equal(r.body.flights[0].totalPrice, prices[0] * 2);

  const back = await api('GET', `/api/flights/search?from=HAN&to=SGN&date=${date}`);
  assert.equal(back.status, 200);
  assert.ok(back.body.count > 0);
});

test('tìm chuyến bay: lỗi tham số', async () => {
  const same = await api('GET', `/api/flights/search?from=SGN&to=SGN&date=${futureDate(5)}`);
  assert.equal(same.status, 400);
  const past = await api('GET', '/api/flights/search?from=SGN&to=HAN&date=2020-01-01');
  assert.equal(past.status, 400);
  const fmt = await api('GET', '/api/flights/search?from=SGN&to=HAN&date=abc');
  assert.equal(fmt.status, 400);
});

test('tìm khách sạn theo thành phố, sao và tính tổng tiền', async () => {
  const r = await api(
    'GET',
    `/api/hotels?city=${encodeURIComponent('Đà Nẵng')}&checkIn=${futureDate(10)}&checkOut=${futureDate(13)}&stars=4&sort=price_asc`
  );
  assert.equal(r.status, 200);
  assert.equal(r.body.nights, 3);
  assert.ok(r.body.hotels.every((h) => h.city === 'Đà Nẵng' && h.stars >= 4));
  assert.equal(r.body.hotels[0].totalPrice, r.body.hotels[0].pricePerNight * 3);

  const bad = await api('GET', `/api/hotels?checkIn=${futureDate(10)}&checkOut=${futureDate(9)}`);
  assert.equal(bad.status, 400);
});

test('đặt chỗ yêu cầu đăng nhập', async () => {
  const r = await api('POST', '/api/bookings', {}, null);
  assert.equal(r.status, 401);
});

test('đặt khách sạn, xem danh sách, hủy đơn', async () => {
  const create = await api('POST', '/api/bookings', {
    type: 'hotel',
    hotelId: 'htl-dad-01',
    checkIn: futureDate(10),
    checkOut: futureDate(12),
    rooms: 1,
    guests: 2,
    guestName: 'Nguyễn Văn A',
    contactPhone: '0901234567',
    paymentMethod: 'card',
  });
  assert.equal(create.status, 201);
  assert.equal(create.body.booking.totalPrice, 2450000 * 2);
  assert.match(create.body.booking.code, /^TG[A-Z0-9]{6}$/);
  const id = create.body.booking.id;

  const list = await api('GET', '/api/bookings');
  assert.equal(list.body.count, 1);

  const cancel = await api('PATCH', `/api/bookings/${id}/cancel`);
  assert.equal(cancel.status, 200);
  assert.equal(cancel.body.booking.status, 'cancelled');

  const again = await api('PATCH', `/api/bookings/${id}/cancel`);
  assert.equal(again.status, 400);
});

test('đặt vé máy bay và tính tổng theo số hành khách', async () => {
  const date = futureDate(15);
  const search = await api('GET', `/api/flights/search?from=SGN&to=DAD&date=${date}`);
  const flight = search.body.flights[0];

  const create = await api('POST', '/api/bookings', {
    type: 'flight',
    flightId: flight.id,
    date,
    passengers: [{ fullName: 'Nguyễn Văn A' }, { fullName: 'Trần Thị B' }],
    contactPhone: '0901234567',
    paymentMethod: 'e_wallet',
  });
  assert.equal(create.status, 201);
  assert.equal(create.body.booking.totalPrice, flight.pricePerPassenger * 2);
});

test('người dùng khác không xem được đơn của người khác', async () => {
  const other = await api('POST', '/api/auth/register', {
    name: 'Người Khác',
    email: 'b@example.com',
    password: 'secret123',
  });
  const mine = await api('GET', '/api/bookings');
  const r = await api('GET', `/api/bookings/${mine.body.bookings[0].id}`, null, other.body.token);
  assert.equal(r.status, 403);
});
