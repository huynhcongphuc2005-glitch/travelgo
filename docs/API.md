# Đặc tả REST API — TravelGo

- **Base URL:** `http://localhost:3000/api`
- **Định dạng:** JSON (`Content-Type: application/json`)
- **Xác thực:** header `Authorization: Bearer <token>` cho endpoint có 🔒
- **Ngày:** `YYYY-MM-DD`. **Tiền tệ:** VND (số nguyên)

## Quy ước lỗi

Mọi lỗi trả về dạng:

```json
{ "error": { "message": "Mô tả lỗi" } }
```

| Mã | Ý nghĩa |
| --- | --- |
| 400 | Dữ liệu không hợp lệ |
| 401 | Chưa đăng nhập / token sai hoặc hết hạn |
| 403 | Không có quyền với tài nguyên (đơn của người khác) |
| 404 | Không tìm thấy |
| 409 | Xung đột (email đã tồn tại) |
| 429 | Gửi quá nhiều yêu cầu đăng nhập/đăng ký |
| 500 | Lỗi hệ thống |

---

## Hệ thống

### `GET /health`
```json
{ "status": "ok", "uptime": 12.3, "timestamp": "2026-11-08T06:30:00.000Z" }
```

---

## Xác thực

### `POST /auth/register`
Body:
```json
{ "name": "Nguyễn Văn A", "email": "a@example.com", "password": "secret123" }
```
`201 Created`:
```json
{
  "user": { "id": "uuid", "name": "Nguyễn Văn A", "email": "a@example.com", "createdAt": "..." },
  "token": "<jwt>"
}
```
Lỗi: `400` (tên < 2 ký tự, email sai, mật khẩu < 6 ký tự), `409` (email đã tồn tại).

### `POST /auth/login`
Body: `{ "email": "a@example.com", "password": "secret123" }`  
`200 OK`: cùng cấu trúc `{ user, token }`. Sai thông tin → `401`.

### `GET /auth/me` 🔒
`200 OK`: `{ "user": { ... } }`

---

## Chuyến bay

### `GET /airports`
```json
{ "airports": [ { "code": "SGN", "city": "Hồ Chí Minh", "name": "Sân bay Tân Sơn Nhất" } ] }
```

### `GET /flights/search`

| Tham số | Bắt buộc | Mô tả |
| --- | --- | --- |
| `from` | ✔ | Mã sân bay đi (vd `SGN`) |
| `to` | ✔ | Mã sân bay đến, khác `from` |
| `date` | ✔ | Ngày bay, không ở quá khứ |
| `passengers` | | 1–9, mặc định 1 |
| `sort` | | `departure` (mặc định), `price`, `duration` |

Ví dụ: `/flights/search?from=SGN&to=DAD&date=2026-12-20&passengers=2&sort=price`

```json
{
  "passengers": 2,
  "count": 6,
  "flights": [
    {
      "id": "SGN-DAD-VJ215",
      "flightNumber": "VJ215",
      "airline": { "code": "VJ", "name": "Vietjet Air" },
      "from": { "code": "SGN", "city": "Hồ Chí Minh", "name": "Sân bay Tân Sơn Nhất" },
      "to":   { "code": "DAD", "city": "Đà Nẵng", "name": "Sân bay quốc tế Đà Nẵng" },
      "date": "2026-12-20",
      "departTime": "06:15",
      "arriveTime": "07:40",
      "arriveDayOffset": 0,
      "durationMin": 85,
      "pricePerPassenger": 1122000,
      "seatsLeft": 87,
      "totalPrice": 2244000
    }
  ]
}
```
> Giá trị cụ thể (số hiệu, giá, chỗ trống) minh họa; thực tế do hệ thống sinh theo quy tắc.

---

## Khách sạn

### `GET /cities`
`{ "cities": ["Đà Lạt", "Đà Nẵng", ...] }`

### `GET /destinations`
```json
{
  "destinations": [
    { "city": "Đà Nẵng", "tagline": "...", "emoji": "🌉", "theme": ["#0770cd", "#00b4d8"],
      "hotelCount": 2, "fromPrice": 980000 }
  ]
}
```

### `GET /hotels`

| Tham số | Mô tả |
| --- | --- |
| `city` | Tên thành phố (lấy từ `/cities`) |
| `q` | Từ khóa trong tên khách sạn |
| `checkIn`, `checkOut` | Cần gửi cả hai; `checkOut` sau `checkIn`, tối đa 30 đêm; `checkIn` không ở quá khứ |
| `guests` | 1–20, mặc định 2 |
| `rooms` | 1–10, mặc định 1 |
| `stars` | Hạng sao tối thiểu (1–5) |
| `minPrice`, `maxPrice` | Giá/đêm (VND) |
| `sort` | `rating` (mặc định), `price_asc`, `price_desc`, `stars` |

```json
{
  "nights": 3, "guests": 2, "rooms": 1, "count": 2,
  "hotels": [
    {
      "id": "htl-dad-01",
      "name": "Sunrise Beach Resort Đà Nẵng",
      "city": "Đà Nẵng",
      "address": "Võ Nguyên Giáp, Sơn Trà",
      "stars": 5, "rating": 9.1, "reviews": 2380,
      "pricePerNight": 2450000,
      "amenities": ["Hồ bơi", "Bãi biển riêng"],
      "description": "...",
      "theme": ["#0770cd", "#00b4d8"],
      "totalPrice": 7350000
    }
  ]
}
```

### `GET /hotels/:id`
`{ "hotel": { ... } }` — `404` nếu không tồn tại.

---

## Đơn đặt 🔒

### `POST /bookings`

**Đặt vé máy bay**
```json
{
  "type": "flight",
  "flightId": "SGN-DAD-VJ215",
  "date": "2026-12-20",
  "passengers": [ { "fullName": "Nguyễn Văn A" }, { "fullName": "Trần Thị B" } ],
  "contactPhone": "0901234567",
  "paymentMethod": "card"
}
```

**Đặt phòng khách sạn**
```json
{
  "type": "hotel",
  "hotelId": "htl-dad-01",
  "checkIn": "2026-12-20",
  "checkOut": "2026-12-23",
  "rooms": 1,
  "guests": 2,
  "guestName": "Nguyễn Văn A",
  "contactPhone": "0901234567",
  "paymentMethod": "e_wallet"
}
```

`paymentMethod` ∈ `card` (mặc định) · `bank_transfer` · `e_wallet` · `pay_at_property`.

`201 Created`:
```json
{
  "booking": {
    "id": "uuid",
    "code": "TGK7M2QX",
    "type": "hotel",
    "title": "Sunrise Beach Resort Đà Nẵng",
    "subtitle": "Đà Nẵng · 2026-12-20 → 2026-12-23 (3 đêm)",
    "details": { "...": "..." },
    "totalPrice": 7350000,
    "currency": "VND",
    "contactPhone": "0901234567",
    "paymentMethod": "e_wallet",
    "status": "confirmed",
    "createdAt": "2026-11-08T06:30:00.000Z",
    "cancelledAt": null
  }
}
```
Tổng tiền luôn do server tính; giá do client gửi lên (nếu có) bị bỏ qua.

### `GET /bookings`
`{ "count": 2, "bookings": [ ... ] }` — chỉ đơn của người dùng hiện tại, mới nhất trước.

### `GET /bookings/:id`
`{ "booking": { ... } }` — `403` nếu là đơn của người khác, `404` nếu không có.

### `PATCH /bookings/:id/cancel`
`200 OK`: `{ "booking": { "status": "cancelled", "cancelledAt": "..." } }`  
`400` nếu đơn đã hủy trước đó.

---

## Ví dụ với curl

```bash
# Đăng ký và lưu token
TOKEN=$(curl -s -X POST localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Nguyễn Văn A","email":"a@example.com","password":"secret123"}' | jq -r .token)

# Đặt phòng
curl -X POST localhost:3000/api/bookings \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"type":"hotel","hotelId":"htl-dad-01","checkIn":"2026-12-20","checkOut":"2026-12-22",
       "guestName":"Nguyễn Văn A","contactPhone":"0901234567"}'

# Xem đơn của tôi
curl -H "Authorization: Bearer $TOKEN" localhost:3000/api/bookings
```
