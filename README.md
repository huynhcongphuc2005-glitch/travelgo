# ✈️ TravelGo

Nền tảng đặt **vé máy bay** và **khách sạn** trực tuyến, lấy cảm hứng từ [Traveloka](https://www.traveloka.com). Đây là đồ án cuối khóa: một ứng dụng web full-stack hoàn chỉnh gồm giao diện, REST API, xác thực người dùng, tài liệu và kiểm thử tự động.

> ⚠️ Dữ liệu chuyến bay, khách sạn và thanh toán chỉ mang tính **minh họa**, không phát sinh giao dịch thật.

## Mục lục

- [Tính năng](#tính-năng)
- [Công nghệ](#công-nghệ)
- [Bắt đầu nhanh](#bắt-đầu-nhanh)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Các lệnh npm](#các-lệnh-npm)
- [Tổng quan API](#tổng-quan-api)
- [Chạy bằng Docker](#chạy-bằng-docker)
- [Tài liệu chi tiết](#tài-liệu-chi-tiết)
- [Hướng phát triển](#hướng-phát-triển)
- [Giấy phép](#giấy-phép)

## Tính năng

| Nhóm | Mô tả |
| --- | --- |
| Tài khoản | Đăng ký, đăng nhập, phiên làm việc bằng JWT, mật khẩu băm bằng bcrypt |
| Vé máy bay | Tìm chuyến theo điểm đi/đến, ngày bay, số hành khách; sắp xếp theo giờ, giá, thời gian bay |
| Khách sạn | Tìm theo thành phố, ngày nhận/trả phòng, số khách/phòng; lọc theo hạng sao, giá; sắp xếp |
| Đặt chỗ | Đặt vé/phòng, sinh mã đặt chỗ (`TGXXXXXX`), chọn phương thức thanh toán (mô phỏng) |
| Quản lý đơn | Xem lịch sử đặt chỗ, hủy đơn |
| Chất lượng | Validate dữ liệu, xử lý lỗi tập trung, rate limit cho đăng nhập, test tự động, CI |

## Công nghệ

- **Backend:** Node.js (≥ 18), Express 4, JWT (`jsonwebtoken`), `bcryptjs`, `helmet`, `cors`, `morgan`, `express-rate-limit`
- **Frontend:** HTML5, CSS3, JavaScript thuần (không framework), `<dialog>` native
- **Lưu trữ:** file JSON (ghi atomic) — không cần cài database, dễ chạy và chấm bài. Có thể thay bằng MongoDB/PostgreSQL (xem [docs/DATABASE.md](docs/DATABASE.md))
- **Công cụ:** ESLint 9, `node:test` (test runner tích hợp), GitHub Actions, Docker

## Bắt đầu nhanh

Yêu cầu: **Node.js ≥ 18** và **npm**.

```bash
# 1. Lấy mã nguồn
git clone <URL-repo-cua-ban> travelgo
cd travelgo

# 2. Cài thư viện
npm install

# 3. Tạo file cấu hình môi trường
cp .env.example .env        # Windows (PowerShell): copy .env.example .env

# 4. Chạy ở chế độ phát triển (tự reload)
npm run dev
```

Mở trình duyệt tại **http://localhost:3000**.

Chạy ở chế độ thường: `npm start`.

### Thử nhanh luồng chính

1. Chọn tab **Vé máy bay** → bấm **Tìm chuyến bay** → bấm **Chọn** trên một chuyến.
2. Hệ thống yêu cầu đăng nhập → tạo tài khoản mới (mật khẩu ≥ 6 ký tự).
3. Điền thông tin hành khách, số điện thoại → **Xác nhận đặt chỗ**.
4. Vào **Đơn của tôi** để xem mã đặt chỗ và có thể hủy đơn.

## Cấu trúc thư mục

```
travelgo/
├── .github/                 # CI (GitHub Actions), template issue & pull request
├── data/                    # File dữ liệu runtime (db.json, được git bỏ qua)
├── docs/                    # Tài liệu: SRS, kiến trúc, API, CSDL, Git, triển khai, kiểm thử
├── public/                  # Frontend tĩnh
│   ├── css/styles.css
│   ├── js/api.js            # Lớp gọi API
│   ├── js/app.js            # Logic giao diện
│   └── index.html
├── scripts/                 # Script tiện ích (khởi tạo Git)
├── src/
│   ├── config/              # Đọc biến môi trường
│   ├── controllers/         # Nhận request, trả response
│   ├── data/                # Dữ liệu seed: chuyến bay, khách sạn, điểm đến
│   ├── middleware/          # Xác thực JWT, xử lý lỗi
│   ├── routes/              # Khai báo endpoint
│   ├── services/            # Logic nghiệp vụ
│   ├── utils/               # Validator, lỗi HTTP, kho dữ liệu JSON
│   ├── app.js               # Khởi tạo Express app
│   └── server.js            # Điểm vào, lắng nghe cổng
├── tests/                   # Test tích hợp API
├── .env.example
├── Dockerfile / docker-compose.yml
└── package.json
```

Kiến trúc phân lớp **routes → controllers → services → utils/db**, chi tiết tại [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Các lệnh npm

| Lệnh | Tác dụng |
| --- | --- |
| `npm start` | Chạy server |
| `npm run dev` | Chạy server với nodemon (tự khởi động lại khi sửa code) |
| `npm test` | Chạy toàn bộ test tự động |
| `npm run lint` | Kiểm tra phong cách code bằng ESLint |
| `npm run lint:fix` | Tự sửa các lỗi lint có thể sửa |

## Tổng quan API

Base URL: `http://localhost:3000/api`. Các endpoint đánh dấu 🔒 cần header `Authorization: Bearer <token>`.

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| GET | `/health` | Kiểm tra tình trạng server |
| POST | `/auth/register` | Đăng ký |
| POST | `/auth/login` | Đăng nhập |
| GET | `/auth/me` 🔒 | Thông tin tài khoản hiện tại |
| GET | `/airports` | Danh sách sân bay |
| GET | `/flights/search` | Tìm chuyến bay |
| GET | `/cities` | Danh sách thành phố có khách sạn |
| GET | `/destinations` | Điểm đến nổi bật |
| GET | `/hotels` | Tìm khách sạn |
| GET | `/hotels/:id` | Chi tiết khách sạn |
| POST | `/bookings` 🔒 | Tạo đơn đặt |
| GET | `/bookings` 🔒 | Danh sách đơn của tôi |
| GET | `/bookings/:id` 🔒 | Chi tiết đơn |
| PATCH | `/bookings/:id/cancel` 🔒 | Hủy đơn |

Ví dụ nhanh:

```bash
curl "http://localhost:3000/api/flights/search?from=SGN&to=DAD&date=2026-12-20&passengers=2&sort=price"
```

Tài liệu đầy đủ kèm ví dụ request/response: [docs/API.md](docs/API.md).

## Chạy bằng Docker

```bash
docker compose up --build
# Ứng dụng chạy tại http://localhost:3000, dữ liệu lưu trong volume "travelgo-data"
```

Nhớ đặt `JWT_SECRET` thật khi triển khai: `JWT_SECRET=chuoi-ngau-nhien-dai docker compose up -d`.

## Tài liệu chi tiết

| Tài liệu | Nội dung |
| --- | --- |
| [docs/SRS.md](docs/SRS.md) | Đặc tả yêu cầu phần mềm: yêu cầu chức năng, phi chức năng, use case |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Kiến trúc, luồng xử lý, quyết định thiết kế, bảo mật |
| [docs/API.md](docs/API.md) | Đặc tả REST API |
| [docs/DATABASE.md](docs/DATABASE.md) | Mô hình dữ liệu, ERD |
| [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md) | Quy trình Git, quy ước commit, cách push lên GitHub |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Hướng dẫn triển khai |
| [docs/TESTING.md](docs/TESTING.md) | Chiến lược kiểm thử, danh sách test case |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Hướng dẫn đóng góp |
| [CHANGELOG.md](CHANGELOG.md) | Lịch sử phiên bản |

## Hướng phát triển

- Chuyển lưu trữ sang MongoDB/PostgreSQL, thêm migration
- Thanh toán thật (VNPay, MoMo, Stripe), gửi email xác nhận
- Vé khứ hồi, chọn ghế, hành lý ký gửi
- Trang chi tiết khách sạn có ảnh, bản đồ, đánh giá của khách
- Đa ngôn ngữ (vi/en), đa tiền tệ
- Trang quản trị cho admin

## Giấy phép

Phát hành theo giấy phép [MIT](LICENSE).
