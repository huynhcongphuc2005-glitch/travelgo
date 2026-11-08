# Kiểm thử — TravelGo

## 1. Chiến lược

| Cấp | Công cụ | Phạm vi |
| --- | --- | --- |
| Tích hợp API (tự động) | `node:test` + `fetch` | Khởi động app thật trên cổng ngẫu nhiên, dùng file DB tạm, gọi API như client thật |
| Phân tích tĩnh | ESLint | Lỗi cú pháp, biến thừa, `==` thay vì `===`, … |
| Thủ công | Trình duyệt | Luồng giao diện, responsive |
| CI | GitHub Actions | Chạy lint + test trên Node 18, 20, 22 mỗi lần push/PR |

## 2. Chạy test

```bash
npm test          # toàn bộ test tự động
npm run lint      # kiểm tra phong cách
```

Test không đụng tới `data/db.json` thật: mỗi lần chạy tạo một thư mục tạm và xóa khi xong.

## 3. Test tự động hiện có (`tests/api.test.js`)

| # | Kịch bản | Kết quả mong đợi |
| --- | --- | --- |
| 1 | `GET /api/health` | 200, `status = ok` |
| 2 | Gọi endpoint không tồn tại | 404 dạng JSON |
| 3 | Đăng ký dữ liệu sai; đăng ký đúng; đăng ký trùng email khác hoa/thường | 400; 201 có token và không lộ `passwordHash`; 409 |
| 4 | Đăng nhập sai/đúng mật khẩu; `GET /auth/me` | 401; 200; trả đúng email |
| 5 | Tìm chuyến bay SGN→HAN sắp theo giá; chiều ngược lại | Giá tăng dần, `totalPrice = giá × số khách`; chiều ngược có kết quả |
| 6 | Tìm chuyến bay: điểm đi = đến, ngày quá khứ, sai định dạng | 400 cho cả ba |
| 7 | Tìm khách sạn Đà Nẵng ≥ 4 sao, 3 đêm; ngày trả trước ngày nhận | Đúng bộ lọc, `totalPrice` đúng; 400 |
| 8 | Đặt chỗ khi chưa đăng nhập | 401 |
| 9 | Đặt khách sạn → xem danh sách → hủy → hủy lần hai | 201 (tổng đúng, mã `TG…`); 1 đơn; 200 `cancelled`; 400 |
| 10 | Đặt vé 2 hành khách | 201, tổng = giá × 2 |
| 11 | Người dùng khác xem đơn không phải của mình | 403 |

## 4. Test thủ công (giao diện)

| # | Bước | Kết quả mong đợi |
| --- | --- | --- |
| M1 | Mở trang chủ | Hiển thị 6 điểm đến với giá "Từ … ₫/đêm" |
| M2 | Tab Vé máy bay, chọn cùng điểm đi và đến, tìm | Toast báo "Điểm đi và điểm đến phải khác nhau" |
| M3 | Tìm SGN → HAN, đổi sắp xếp "Giá thấp nhất" | Danh sách sắp lại, tiêu đề hiển thị số chuyến |
| M4 | Chưa đăng nhập, bấm "Chọn" | Hiện hộp thoại đăng nhập kèm thông báo |
| M5 | Đăng ký tài khoản mới | Đóng hộp thoại, hiện tên ở góc phải, **tự mở lại** form đặt chỗ vừa chọn |
| M6 | Đặt vé, để trống số điện thoại | Báo lỗi trong form, không tạo đơn |
| M7 | Đặt vé hợp lệ | Toast có mã đặt chỗ, chuyển tới "Đơn của tôi" |
| M8 | Bấm "Hủy đơn" → đồng ý | Đơn chuyển nhãn "Đã hủy", nút hủy biến mất |
| M9 | Bấm một điểm đến trên trang chủ | Chuyển sang tab Khách sạn và hiện danh sách khách sạn thành phố đó |
| M10 | Tải lại trang khi đã đăng nhập | Vẫn giữ trạng thái đăng nhập |
| M11 | Bấm Đăng xuất | Quay về tìm kiếm; "Đơn của tôi" yêu cầu đăng nhập |
| M12 | Thu nhỏ cửa sổ còn ~360 px | Bố cục không tràn ngang, thẻ kết quả xếp dọc |
| M13 | Đăng ký với tên chứa `<script>` | Tên hiển thị dạng văn bản, không chạy script |

## 5. Thêm test mới

1. Thêm `test('mô tả', async () => { ... })` vào `tests/api.test.js` hoặc tạo file `tests/<ten>.test.js` (tự được nhận theo mẫu `tests/**/*.test.js`).
2. Dùng helper `api(method, url, body, auth)` để gọi API; `futureDate(n)` để lấy ngày hợp lệ trong tương lai.
3. Nhớ test cả trường hợp lỗi (400/401/403/404), không chỉ trường hợp thành công.
