# Đặc tả yêu cầu phần mềm (SRS) — TravelGo

| Mục | Giá trị |
| --- | --- |
| Tên hệ thống | TravelGo |
| Phiên bản tài liệu | 1.0 |
| Loại tài liệu | Software Requirements Specification |

## 1. Giới thiệu

### 1.1 Mục đích
Tài liệu mô tả yêu cầu của TravelGo — website đặt vé máy bay và khách sạn trực tuyến cho thị trường Việt Nam, lấy cảm hứng từ Traveloka. Tài liệu dùng làm cơ sở cho thiết kế, lập trình và kiểm thử.

### 1.2 Phạm vi
TravelGo cho phép người dùng tìm kiếm, so sánh và đặt vé máy bay nội địa, phòng khách sạn; quản lý lịch sử đặt chỗ. Phiên bản này là bản đồ án nên thanh toán được **mô phỏng** và dữ liệu là **dữ liệu mẫu**.

### 1.3 Thuật ngữ

| Thuật ngữ | Ý nghĩa |
| --- | --- |
| Khách (Guest) | Người dùng chưa đăng nhập |
| Thành viên (Member) | Người dùng đã có tài khoản và đăng nhập |
| Đơn đặt (Booking) | Bản ghi đặt vé máy bay hoặc phòng khách sạn |
| Mã đặt chỗ | Mã định danh dạng `TG` + 6 ký tự, hiển thị cho người dùng |
| JWT | JSON Web Token dùng để xác thực phiên |

## 2. Mô tả tổng quan

### 2.1 Tác nhân

| Tác nhân | Quyền |
| --- | --- |
| Khách | Xem điểm đến, tìm kiếm chuyến bay và khách sạn, đăng ký, đăng nhập |
| Thành viên | Tất cả quyền của Khách + đặt chỗ, xem và hủy đơn của chính mình |

### 2.2 Môi trường vận hành
- Máy chủ: Node.js ≥ 18
- Máy khách: trình duyệt hiện đại hỗ trợ `<dialog>` (Chrome, Edge, Firefox, Safari 15.4+)

### 2.3 Giả định và ràng buộc
- Giá cả, lịch bay và khách sạn là dữ liệu mẫu, sinh theo quy tắc cố định.
- Tiền tệ duy nhất: VND. Múi giờ nghiệp vụ: UTC+7.
- Dữ liệu người dùng và đơn đặt lưu trong file JSON trên máy chủ.

## 3. Yêu cầu chức năng

### 3.1 Tài khoản

| Mã | Yêu cầu | Ưu tiên |
| --- | --- | --- |
| FR-01 | Người dùng đăng ký bằng họ tên, email, mật khẩu | Cao |
| FR-02 | Email là duy nhất (không phân biệt hoa/thường); mật khẩu tối thiểu 6 ký tự | Cao |
| FR-03 | Người dùng đăng nhập bằng email và mật khẩu, nhận token phiên | Cao |
| FR-04 | Giao diện giữ phiên đăng nhập sau khi tải lại trang; có chức năng đăng xuất | Trung bình |
| FR-05 | Mật khẩu được băm, không bao giờ trả về qua API | Cao |

### 3.2 Tìm kiếm chuyến bay

| Mã | Yêu cầu | Ưu tiên |
| --- | --- | --- |
| FR-10 | Tìm chuyến bay theo sân bay đi, sân bay đến, ngày bay, số hành khách (1–9) | Cao |
| FR-11 | Điểm đi và điểm đến phải khác nhau; ngày bay không ở quá khứ | Cao |
| FR-12 | Kết quả hiển thị hãng, số hiệu, giờ đi/đến, thời gian bay, giá/hành khách, tổng tiền, số chỗ còn lại | Cao |
| FR-13 | Sắp xếp theo giờ khởi hành, giá thấp nhất, thời gian bay ngắn nhất | Trung bình |
| FR-14 | Tuyến bay có hai chiều (ví dụ SGN→HAN và HAN→SGN đều tìm được) | Trung bình |

### 3.3 Tìm kiếm khách sạn

| Mã | Yêu cầu | Ưu tiên |
| --- | --- | --- |
| FR-20 | Tìm khách sạn theo thành phố, ngày nhận/trả phòng, số khách, số phòng | Cao |
| FR-21 | Lọc theo hạng sao tối thiểu, khoảng giá, từ khóa tên | Trung bình |
| FR-22 | Sắp xếp theo đánh giá, giá tăng/giảm, hạng sao | Trung bình |
| FR-23 | Hiển thị tổng tiền = giá/đêm × số đêm × số phòng | Cao |
| FR-24 | Trang chủ hiển thị điểm đến nổi bật với giá từ thấp nhất; chọn điểm đến sẽ tìm khách sạn tương ứng | Thấp |

### 3.4 Đặt chỗ

| Mã | Yêu cầu | Ưu tiên |
| --- | --- | --- |
| FR-30 | Chỉ thành viên đã đăng nhập mới đặt được; khách chọn đặt sẽ được yêu cầu đăng nhập rồi tiếp tục | Cao |
| FR-31 | Đặt vé: nhập họ tên từng hành khách, số điện thoại liên hệ, phương thức thanh toán | Cao |
| FR-32 | Đặt phòng: nhập tên khách nhận phòng, số điện thoại, phương thức thanh toán | Cao |
| FR-33 | Tổng tiền do **máy chủ tính lại**, không tin giá từ trình duyệt | Cao |
| FR-34 | Mỗi đơn có mã đặt chỗ duy nhất và trạng thái `confirmed` | Cao |
| FR-35 | Không cho đặt khi số hành khách vượt số chỗ còn lại | Trung bình |

### 3.5 Quản lý đơn

| Mã | Yêu cầu | Ưu tiên |
| --- | --- | --- |
| FR-40 | Thành viên xem danh sách đơn của mình, mới nhất trước | Cao |
| FR-41 | Thành viên hủy đơn đang `confirmed`; đơn đã hủy không hủy lại được | Cao |
| FR-42 | Thành viên không xem hay hủy được đơn của người khác | Cao |

## 4. Quy tắc nghiệp vụ

| Mã | Quy tắc |
| --- | --- |
| BR-01 | Giá vé = giá cơ sở của tuyến × hệ số hãng × hệ số ngày (Chủ nhật, thứ Sáu, thứ Bảy đắt hơn), làm tròn 1.000 ₫ |
| BR-02 | Số đêm khách sạn tối thiểu 1, tối đa 30; ngày trả phòng sau ngày nhận phòng |
| BR-03 | Mỗi đơn vé tối đa 9 hành khách; mỗi đơn phòng tối đa 10 phòng, 20 khách |
| BR-04 | Phương thức thanh toán hợp lệ: `card`, `bank_transfer`, `e_wallet`, `pay_at_property` |
| BR-05 | Đơn đã hủy không thể khôi phục |

## 5. Yêu cầu phi chức năng

| Mã | Nhóm | Yêu cầu |
| --- | --- | --- |
| NFR-01 | Hiệu năng | API tìm kiếm phản hồi dưới 300 ms với dữ liệu mẫu |
| NFR-02 | Bảo mật | Mật khẩu băm bcrypt; token JWT hết hạn; header bảo mật qua `helmet`; chống XSS bằng cách escape dữ liệu khi render |
| NFR-03 | Bảo mật | Giới hạn 100 yêu cầu/15 phút/IP cho đăng ký và đăng nhập |
| NFR-04 | Toàn vẹn dữ liệu | Ghi file theo kiểu atomic (ghi tạm rồi rename) |
| NFR-05 | Khả dụng | Giao diện responsive từ 360 px đến desktop |
| NFR-06 | Trợ năng | Có nhãn cho input, `aria-live` cho kết quả, focus hiển thị rõ |
| NFR-07 | Bảo trì | Kiến trúc phân lớp, lint bằng ESLint, test tự động chạy trong CI |
| NFR-08 | Di động | Chạy được bằng một lệnh (`npm start`) hoặc Docker |
| NFR-09 | Lỗi | API trả lỗi JSON thống nhất `{ "error": { "message": ... } }` kèm mã HTTP đúng |

## 6. Use case chính

### UC-01 Đặt vé máy bay
- **Tác nhân:** Thành viên (Khách nếu chưa đăng nhập)
- **Tiền điều kiện:** Có chuyến bay phù hợp trong kết quả tìm kiếm
- **Luồng chính:**
  1. Người dùng nhập điểm đi, điểm đến, ngày bay, số hành khách rồi tìm kiếm.
  2. Hệ thống hiển thị danh sách chuyến bay.
  3. Người dùng chọn một chuyến.
  4. Nếu chưa đăng nhập, hệ thống yêu cầu đăng nhập/đăng ký rồi quay lại bước này.
  5. Người dùng nhập họ tên hành khách, số điện thoại, chọn thanh toán.
  6. Hệ thống kiểm tra dữ liệu, tính tổng tiền, tạo đơn và trả mã đặt chỗ.
- **Luồng ngoại lệ:** Dữ liệu sai (tên quá ngắn, số điện thoại sai) → báo lỗi tại form; token hết hạn → yêu cầu đăng nhập lại.
- **Hậu điều kiện:** Đơn trạng thái `confirmed` xuất hiện trong "Đơn của tôi".

### UC-02 Đặt phòng khách sạn
Tương tự UC-01 nhưng thay bước tìm kiếm bằng thành phố, ngày nhận/trả phòng, số khách/phòng; thông tin nhập là tên khách nhận phòng.

### UC-03 Hủy đơn
1. Thành viên vào "Đơn của tôi".
2. Bấm "Hủy đơn" ở đơn đang xác nhận và đồng ý hộp thoại xác nhận.
3. Hệ thống chuyển trạng thái sang `cancelled` và ghi thời điểm hủy.

## 7. Ngoài phạm vi (phiên bản 1.0)
Thanh toán thật, email/SMS xác nhận, vé khứ hồi, chọn ghế, hoàn tiền, trang quản trị, đánh giá khách sạn, quốc tế hóa.
