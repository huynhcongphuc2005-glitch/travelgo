# Hướng dẫn đóng góp

Cảm ơn bạn đã quan tâm đến TravelGo! Vui lòng đọc nhanh tài liệu này trước khi gửi thay đổi.

## Thiết lập môi trường

```bash
git clone <URL-repo> travelgo && cd travelgo
npm install
cp .env.example .env
npm run dev
```

## Quy trình

1. Tạo nhánh từ `main`: `git switch -c feat/ten-tinh-nang` (hoặc `fix/…`, `docs/…`).
2. Viết code và **thêm test** cho hành vi mới/sửa lỗi.
3. Chạy `npm run lint` và `npm test` — cả hai phải sạch.
4. Commit theo [Conventional Commits](docs/GIT_WORKFLOW.md#3-quy-ước-commit-conventional-commits).
5. Push và mở Pull Request, điền đủ mẫu PR.

## Phong cách code

- Tuân theo `.editorconfig` và cấu hình ESLint của dự án (`npm run lint:fix` để tự sửa).
- Giữ đúng phân tầng: routes → controllers → services → utils. Logic nghiệp vụ đặt trong **services**.
- Lỗi nghiệp vụ ném bằng `HttpError` (xem `src/utils/httpError.js`), không tự `res.status(...)` trong service.
- Dữ liệu chèn vào HTML ở frontend luôn qua hàm `esc()`.
- Không commit `.env`, `node_modules/`, `data/db.json`.

## Báo lỗi và đề xuất

Dùng mục **Issues** với template có sẵn (Bug report / Feature request). Với lỗi, cho biết các bước tái hiện, kết quả mong đợi và thực tế.
