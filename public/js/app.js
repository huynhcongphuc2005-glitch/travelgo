/* Giao diện TravelGo: tìm kiếm, đặt chỗ, quản lý đơn. Không dùng framework. */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const state = {
  user: null,
  tab: 'flights',
  results: null, // { kind, items, params, meta }
  pending: null, // thông tin đặt chỗ đang chờ đăng nhập
  authMode: 'login',
};

const PAYMENT_LABELS = {
  card: 'Thẻ',
  bank_transfer: 'Chuyển khoản',
  e_wallet: 'Ví điện tử',
  pay_at_property: 'Thanh toán tại nơi lưu trú',
};

/* ---------- Tiện ích ---------- */
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => new Intl.NumberFormat('vi-VN').format(n) + ' ₫';
const fmtDate = (iso) => iso.split('-').reverse().join('/');
const fmtDuration = (m) => `${Math.floor(m / 60)}g ${String(m % 60).padStart(2, '0')}p`;

function isoDate(offsetDays) {
  const d = new Date(Date.now() + 7 * 3600 * 1000 + offsetDays * 86400000);
  return d.toISOString().slice(0, 10);
}

let toastTimer;
function toast(message, isError = false) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.toggle('is-error', isError);
  el.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-visible'), 3200);
}

function setBusy(button, busy, label) {
  button.disabled = busy;
  if (label) button.textContent = label;
}

/* ---------- Điều hướng ---------- */
function showView(name) {
  $('#viewSearch').hidden = name !== 'search';
  $('#viewBookings').hidden = name !== 'bookings';
  $$('.nav__link').forEach((b) => b.classList.toggle('is-active', b.dataset.view === name));
  if (name === 'bookings') loadBookings();
  window.scrollTo({ top: 0 });
}

function showTab(tab) {
  state.tab = tab;
  $$('.search-card .tab').forEach((b) => b.classList.toggle('is-active', b.dataset.tab === tab));
  $('#flightForm').hidden = tab !== 'flights';
  $('#hotelForm').hidden = tab !== 'hotels';
}

/* ---------- Xác thực ---------- */
function renderAuthArea() {
  const area = $('#authArea');
  if (state.user) {
    area.innerHTML = `<span class="user-chip">👤 ${esc(state.user.name)}</span>
      <button class="btn btn--ghost btn--sm" id="logoutBtn" type="button">Đăng xuất</button>`;
    $('#logoutBtn').addEventListener('click', logout);
  } else {
    area.innerHTML = `<button class="btn btn--ghost btn--sm" id="loginBtn" type="button">Đăng nhập</button>
      <button class="btn btn--primary btn--sm" id="registerBtn" type="button">Đăng ký</button>`;
    $('#loginBtn').addEventListener('click', () => openAuth('login'));
    $('#registerBtn').addEventListener('click', () => openAuth('register'));
  }
}

function setAuthMode(mode) {
  state.authMode = mode;
  const isRegister = mode === 'register';
  $$('[data-auth]').forEach((b) => b.classList.toggle('is-active', b.dataset.auth === mode));
  $('#authTitle').textContent = isRegister ? 'Tạo tài khoản' : 'Đăng nhập';
  $('#authSubmit').textContent = isRegister ? 'Đăng ký' : 'Đăng nhập';
  $('#nameField').hidden = !isRegister;
  $('#authForm').elements.password.autocomplete = isRegister ? 'new-password' : 'current-password';
  $('#authError').textContent = '';
}

function openAuth(mode = 'login', notice = '') {
  setAuthMode(mode);
  const n = $('#authNotice');
  n.textContent = notice;
  n.hidden = !notice;
  $('#authDialog').showModal();
}

async function onAuthSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const btn = $('#authSubmit');
  const isRegister = state.authMode === 'register';
  const payload = { email: form.elements.email.value, password: form.elements.password.value };
  // Lưu ý: form.name là thuộc tính tên của <form>, phải dùng form.elements.name để lấy ô input
  if (isRegister) payload.name = form.elements.name.value;

  setBusy(btn, true);
  try {
    const data = await Api.post(isRegister ? '/api/auth/register' : '/api/auth/login', payload);
    Api.setToken(data.token);
    state.user = data.user;
    renderAuthArea();
    $('#authDialog').close();
    form.reset();
    toast(`Xin chào ${data.user.name}!`);
    if (state.pending) {
      const p = state.pending;
      state.pending = null;
      openBooking(p.kind, p.item);
    }
  } catch (err) {
    $('#authError').textContent = err.message;
  } finally {
    setBusy(btn, false);
  }
}

function logout() {
  Api.setToken(null);
  state.user = null;
  renderAuthArea();
  showView('search');
  toast('Bạn đã đăng xuất');
}

async function restoreSession() {
  if (!Api.getToken()) return;
  try {
    state.user = (await Api.get('/api/auth/me')).user;
  } catch (_e) {
    Api.setToken(null);
  }
}

/* ---------- Dữ liệu ban đầu ---------- */
async function loadReferenceData() {
  const [{ airports }, { cities }, { destinations }] = await Promise.all([
    Api.get('/api/airports'),
    Api.get('/api/cities'),
    Api.get('/api/destinations'),
  ]);

  const airportOpts = airports
    .map((a) => `<option value="${esc(a.code)}">${esc(a.city)} (${esc(a.code)})</option>`)
    .join('');
  $('#flightFrom').innerHTML = airportOpts;
  $('#flightTo').innerHTML = airportOpts;
  $('#flightFrom').value = 'SGN';
  $('#flightTo').value = 'HAN';

  $('#hotelCity').innerHTML =
    '<option value="">Tất cả điểm đến</option>' +
    cities.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join('');

  $('#destinations').innerHTML = destinations
    .map(
      (d) => `<button class="dest" type="button" data-city="${esc(d.city)}"
        style="background:linear-gradient(135deg,${esc(d.theme[0])},${esc(d.theme[1])})">
        <span class="dest__emoji">${esc(d.emoji)}</span>
        <b>${esc(d.city)}</b><span>${esc(d.tagline)}</span>
        <span>Từ ${money(d.fromPrice)}/đêm</span></button>`
    )
    .join('');
}

function setDefaultDates() {
  const minToday = isoDate(0);
  $('#flightDate').min = minToday;
  $('#flightDate').value = isoDate(7);
  $('#hotelIn').min = minToday;
  $('#hotelIn').value = isoDate(7);
  $('#hotelOut').min = isoDate(1);
  $('#hotelOut').value = isoDate(9);
}

/* ---------- Tìm kiếm ---------- */
const SORT_OPTIONS = {
  flights: [
    ['departure', 'Giờ khởi hành'],
    ['price', 'Giá thấp nhất'],
    ['duration', 'Thời gian bay ngắn nhất'],
  ],
  hotels: [
    ['rating', 'Đánh giá cao nhất'],
    ['price_asc', 'Giá thấp → cao'],
    ['price_desc', 'Giá cao → thấp'],
    ['stars', 'Hạng sao'],
  ],
};

function formParams(form) {
  return Object.fromEntries(new FormData(form).entries());
}

async function runSearch(kind, params, sort) {
  const list = $('#resultsList');
  $('#results').hidden = false;
  list.innerHTML = '<div class="empty">Đang tìm kiếm…</div>';
  $('#sortSelect').innerHTML = SORT_OPTIONS[kind]
    .map(([v, l]) => `<option value="${v}">${l}</option>`)
    .join('');
  if (sort) $('#sortSelect').value = sort;

  try {
    const url = kind === 'flights' ? '/api/flights/search' : '/api/hotels';
    const data = await Api.get(url, { ...params, sort: $('#sortSelect').value });
    state.results = { kind, params, data };
    renderResults();
    $('#results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    list.innerHTML = `<div class="empty">${esc(err.message)}</div>`;
  }
}

function renderResults() {
  const { kind, params, data } = state.results;
  const items = kind === 'flights' ? data.flights : data.hotels;

  if (kind === 'flights') {
    const from = $('#flightFrom').selectedOptions[0].textContent;
    const to = $('#flightTo').selectedOptions[0].textContent;
    $('#resultsTitle').textContent = `${from} → ${to} · ${fmtDate(params.date)} · ${data.count} chuyến bay`;
  } else {
    const where = params.city || 'Tất cả điểm đến';
    $('#resultsTitle').textContent = `${where} · ${data.nights} đêm · ${data.count} khách sạn`;
  }

  const list = $('#resultsList');
  if (!items.length) {
    list.innerHTML = '<div class="empty">Không tìm thấy kết quả phù hợp. Hãy thử đổi ngày hoặc điểm đến.</div>';
    return;
  }
  list.innerHTML = items.map((it, i) => (kind === 'flights' ? flightCard(it, data, i) : hotelCard(it, data, i))).join('');
}

function flightCard(f, data, i) {
  const next = f.arriveDayOffset ? ` <small>+${f.arriveDayOffset}</small>` : '';
  return `<article class="card">
    <div class="card__body">
      <div class="card__meta"><b>${esc(f.airline.name)}</b> · ${esc(f.flightNumber)}</div>
      <div class="flight">
        <div class="flight__time"><b>${esc(f.departTime)}</b><span>${esc(f.from.code)}</span></div>
        <div class="flight__line">${fmtDuration(f.durationMin)} · Bay thẳng</div>
        <div class="flight__time"><b>${esc(f.arriveTime)}${next}</b><span>${esc(f.to.code)}</span></div>
      </div>
      ${f.seatsLeft < 30 ? `<span class="warn">Chỉ còn ${f.seatsLeft} chỗ</span>` : ''}
    </div>
    <div class="card__side">
      <div class="price">${money(f.pricePerPassenger)}<small>/ hành khách${data.passengers > 1 ? ` · Tổng ${money(f.totalPrice)}` : ''}</small></div>
      <button class="btn btn--accent" type="button" data-select="${i}">Chọn</button>
    </div></article>`;
}

function hotelCard(h, data, i) {
  return `<article class="card">
    <div class="card__thumb" style="background:linear-gradient(135deg,${esc(h.theme[0])},${esc(h.theme[1])})">🏨</div>
    <div class="card__body">
      <h3 class="card__title">${esc(h.name)}</h3>
      <div class="card__meta">${'★'.repeat(h.stars)} · ${esc(h.address)}, ${esc(h.city)}</div>
      <div><span class="rating">${h.rating.toFixed(1)}</span> <span class="card__meta">${h.reviews.toLocaleString('vi-VN')} đánh giá</span></div>
      <p class="card__meta" style="margin:0">${esc(h.description)}</p>
      <div class="tags">${h.amenities.map((a) => `<span class="tag">${esc(a)}</span>`).join('')}</div>
    </div>
    <div class="card__side">
      <div class="price">${money(h.pricePerNight)}<small>/ đêm${data.nights > 1 || data.rooms > 1 ? ` · Tổng ${money(h.totalPrice)}` : ''}</small></div>
      <button class="btn btn--accent" type="button" data-select="${i}">Đặt phòng</button>
    </div></article>`;
}

/* ---------- Đặt chỗ ---------- */
function openBooking(kind, item) {
  if (!state.user) {
    state.pending = { kind, item };
    openAuth('login', 'Vui lòng đăng nhập hoặc đăng ký để tiếp tục đặt chỗ.');
    return;
  }
  const { params, data } = state.results;
  state.booking = { kind, item, params, data };
  const form = $('#bookingForm');
  form.reset();
  $('#bookingError').textContent = '';
  const fields = $('#passengerFields');

  if (kind === 'flight') {
    $('#bookingSummary').innerHTML = `<b>${esc(item.from.city)} → ${esc(item.to.city)}</b>
      ${esc(item.airline.name)} · ${esc(item.flightNumber)}<br>
      ${fmtDate(item.date)} · ${esc(item.departTime)} - ${esc(item.arriveTime)}`;
    fields.innerHTML = Array.from({ length: data.passengers }, (_, i) =>
      `<label>Họ tên hành khách ${i + 1} (theo giấy tờ)
        <input type="text" name="passenger" required value="${i === 0 ? esc(state.user.name) : ''}" /></label>`
    ).join('');
    $('#bookingTotal').textContent = money(item.pricePerPassenger * data.passengers);
  } else {
    $('#bookingSummary').innerHTML = `<b>${esc(item.name)}</b>
      ${esc(item.city)}<br>${fmtDate(params.checkIn)} → ${fmtDate(params.checkOut)} · ${data.nights} đêm ·
      ${data.rooms} phòng · ${data.guests} khách`;
    fields.innerHTML = `<label>Tên khách nhận phòng
      <input type="text" name="guestName" required value="${esc(state.user.name)}" /></label>`;
    $('#bookingTotal').textContent = money(item.pricePerNight * data.nights * data.rooms);
  }
  $('#bookingDialog').showModal();
}

async function onBookingSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const { kind, item, params, data } = state.booking;
  const btn = $('#bookingSubmit');

  const payload = {
    contactPhone: form.elements.contactPhone.value,
    paymentMethod: form.elements.paymentMethod.value,
  };
  if (kind === 'flight') {
    Object.assign(payload, {
      type: 'flight',
      flightId: item.id,
      date: item.date,
      passengers: $$('input[name="passenger"]', form).map((i) => ({ fullName: i.value })),
    });
  } else {
    Object.assign(payload, {
      type: 'hotel',
      hotelId: item.id,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      rooms: data.rooms,
      guests: data.guests,
      guestName: form.elements.guestName.value,
    });
  }

  setBusy(btn, true, 'Đang xử lý…');
  try {
    const { booking } = await Api.post('/api/bookings', payload);
    $('#bookingDialog').close();
    toast(`Đặt chỗ thành công! Mã đặt chỗ: ${booking.code}`);
    showView('bookings');
  } catch (err) {
    $('#bookingError').textContent = err.message;
    if (err.status === 401) {
      Api.setToken(null);
      state.user = null;
      renderAuthArea();
    }
  } finally {
    setBusy(btn, false, 'Xác nhận đặt chỗ');
  }
}

/* ---------- Đơn của tôi ---------- */
async function loadBookings() {
  const list = $('#bookingsList');
  if (!state.user) {
    list.innerHTML = '<div class="empty">Vui lòng <b>đăng nhập</b> để xem đơn đặt của bạn.</div>';
    return;
  }
  list.innerHTML = '<div class="empty">Đang tải…</div>';
  try {
    const { bookings } = await Api.get('/api/bookings');
    if (!bookings.length) {
      list.innerHTML = '<div class="empty">Bạn chưa có đơn đặt nào. Hãy bắt đầu một chuyến đi mới! 🌴</div>';
      return;
    }
    list.innerHTML = bookings.map(bookingRow).join('');
  } catch (err) {
    list.innerHTML = `<div class="empty">${esc(err.message)}</div>`;
  }
}

function bookingRow(b) {
  const icon = b.type === 'flight' ? '✈️' : '🏨';
  const cancelled = b.status === 'cancelled';
  return `<article class="booking">
    <div>
      <div class="booking__code">${icon} ${esc(b.code)}
        <span class="badge badge--${esc(b.status)}">${cancelled ? 'Đã hủy' : 'Đã xác nhận'}</span></div>
      <h3 class="card__title">${esc(b.title)}</h3>
      <div class="card__meta">${esc(b.subtitle)}</div>
      <div class="card__meta">${esc(PAYMENT_LABELS[b.paymentMethod] || b.paymentMethod)} · Đặt lúc ${new Date(b.createdAt).toLocaleString('vi-VN')}</div>
    </div>
    <div style="text-align:right">
      <div class="price">${money(b.totalPrice)}</div>
      ${cancelled ? '' : `<button class="btn btn--danger" type="button" data-cancel="${esc(b.id)}">Hủy đơn</button>`}
    </div></article>`;
}

async function cancelBooking(id) {
  if (!confirm('Bạn chắc chắn muốn hủy đơn này?')) return;
  try {
    await Api.patch(`/api/bookings/${encodeURIComponent(id)}/cancel`);
    toast('Đã hủy đơn đặt');
    loadBookings();
  } catch (err) {
    toast(err.message, true);
  }
}

/* ---------- Khởi tạo & sự kiện ---------- */
function bindEvents() {
  $$('.nav__link').forEach((b) => b.addEventListener('click', () => showView(b.dataset.view)));
  $$('.search-card .tab').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));
  $$('[data-auth]').forEach((b) => b.addEventListener('click', () => setAuthMode(b.dataset.auth)));

  $('#flightForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const params = formParams(e.target);
    if (params.from === params.to) return toast('Điểm đi và điểm đến phải khác nhau', true);
    runSearch('flights', params);
  });

  $('#hotelForm').addEventListener('submit', (e) => {
    e.preventDefault();
    runSearch('hotels', formParams(e.target));
  });

  $('#hotelIn').addEventListener('change', (e) => {
    const next = new Date(`${e.target.value}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    const minOut = next.toISOString().slice(0, 10);
    $('#hotelOut').min = minOut;
    if ($('#hotelOut').value < minOut) $('#hotelOut').value = minOut;
  });

  $('#sortSelect').addEventListener('change', () => {
    if (state.results) runSearch(state.results.kind, state.results.params, $('#sortSelect').value);
  });

  // Ủy quyền sự kiện cho các danh sách được render động
  $('#resultsList').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-select]');
    if (!btn || !state.results) return;
    const { kind, data } = state.results;
    const items = kind === 'flights' ? data.flights : data.hotels;
    openBooking(kind === 'flights' ? 'flight' : 'hotel', items[Number(btn.dataset.select)]);
  });

  $('#bookingsList').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cancel]');
    if (btn) cancelBooking(btn.dataset.cancel);
  });

  $('#destinations').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-city]');
    if (!btn) return;
    showTab('hotels');
    $('#hotelCity').value = btn.dataset.city;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    runSearch('hotels', formParams($('#hotelForm')));
  });

  $('#authForm').addEventListener('submit', onAuthSubmit);
  $('#bookingForm').addEventListener('submit', onBookingSubmit);
}

async function init() {
  bindEvents();
  setDefaultDates();
  try {
    await Promise.all([loadReferenceData(), restoreSession()]);
  } catch (err) {
    toast(err.message, true);
  }
  renderAuthArea();
}

init();
