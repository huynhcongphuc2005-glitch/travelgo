/* Lớp gọi API: gom fetch, token và xử lý lỗi vào một chỗ. */
const TOKEN_KEY = 'travelgo_token';

const Api = {
  getToken() {
    try { return localStorage.getItem(TOKEN_KEY); } catch (_e) { return null; }
  },
  setToken(token) {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch (_e) { /* trình duyệt chặn storage: bỏ qua */ }
  },

  async request(method, url, body) {
    const headers = { 'Content-Type': 'application/json' };
    const token = Api.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    let res;
    try {
      res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
    } catch (_e) {
      throw new Error('Không kết nối được máy chủ, vui lòng thử lại.');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error((data.error && data.error.message) || 'Có lỗi xảy ra');
      err.status = res.status;
      throw err;
    }
    return data;
  },

  get(url, params) {
    const qs = params
      ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined))
      : '';
    return Api.request('GET', url + qs);
  },
  post: (url, body) => Api.request('POST', url, body),
  patch: (url, body) => Api.request('PATCH', url, body),
};
