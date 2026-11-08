# Hướng dẫn triển khai — TravelGo

## 1. Biến môi trường

| Biến | Mặc định | Mô tả |
| --- | --- | --- |
| `NODE_ENV` | `development` | `production` khi chạy thật (bật log `combined`, bắt buộc có `JWT_SECRET`) |
| `PORT` | `3000` | Cổng lắng nghe |
| `JWT_SECRET` | *(dev-only)* | **Bắt buộc** đặt ở production. Dùng chuỗi ngẫu nhiên ≥ 32 ký tự |
| `JWT_EXPIRES_IN` | `7d` | Thời hạn token (`1h`, `7d`, …) |
| `DB_FILE` | `./data/db.json` | Đường dẫn file dữ liệu |
| `CORS_ORIGINS` | *(tất cả)* | Danh sách origin được phép, phân tách bằng dấu phẩy |

Tạo secret ngẫu nhiên:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## 2. Chạy trên máy chủ Linux bình thường

```bash
git clone <URL-repo> travelgo && cd travelgo
npm ci --omit=dev
cp .env.example .env && nano .env      # đặt NODE_ENV=production và JWT_SECRET
npm start
```

Chạy nền và tự khởi động lại bằng PM2:

```bash
npm install -g pm2
pm2 start src/server.js --name travelgo
pm2 save && pm2 startup
```

Đặt Nginx phía trước để có HTTPS:

```nginx
server {
  listen 80;
  server_name travelgo.example.com;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Sau đó cấp chứng chỉ miễn phí: `sudo certbot --nginx -d travelgo.example.com`.

## 3. Docker

```bash
docker build -t travelgo .
docker run -d --name travelgo -p 3000:3000 \
  -e JWT_SECRET="<chuoi-ngau-nhien>" \
  -v travelgo-data:/app/data \
  travelgo
```

Hoặc dùng Compose: `JWT_SECRET=<chuoi-ngau-nhien> docker compose up -d --build`.

Image chạy bằng user `node` (không phải root) và có `HEALTHCHECK` gọi `/api/health`.

## 4. Nền tảng PaaS (Render, Railway, Fly.io…)

1. Kết nối repo GitHub.
2. Build command: `npm ci --omit=dev` — Start command: `npm start`.
3. Đặt biến môi trường `NODE_ENV=production` và `JWT_SECRET`.
4. Health check path: `/api/health`.

> ⚠️ **Lưu ý quan trọng:** nhiều gói miễn phí dùng ổ đĩa **tạm thời** — file `data/db.json` sẽ mất mỗi lần deploy/restart. Hãy gắn persistent disk vào đường dẫn `DB_FILE` (ví dụ `/var/data/db.json`), hoặc chuyển sang database thật (xem [DATABASE.md](DATABASE.md#5-nâng-cấp-lên-database-thật)). Với demo đồ án, việc mất dữ liệu sau restart thường chấp nhận được.

## 5. Kiểm tra sau triển khai

```bash
curl https://<ten-mien>/api/health
# → {"status":"ok", ...}
```

Danh sách kiểm tra:

- [ ] Trang chủ tải được, danh sách điểm đến hiển thị
- [ ] Đăng ký/đăng nhập thành công
- [ ] Tìm và đặt thử một vé, một phòng
- [ ] Đơn xuất hiện ở "Đơn của tôi" và hủy được
- [ ] `JWT_SECRET` không phải giá trị mặc định
- [ ] HTTPS đã bật (nếu công khai)

## 6. Sao lưu

Toàn bộ dữ liệu động nằm trong một file, nên sao lưu rất đơn giản:

```bash
cp data/db.json backups/db-$(date +%F).json
```
