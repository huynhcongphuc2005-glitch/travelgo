# Quy trình Git — TravelGo

## 1. Đưa dự án lên GitHub lần đầu

### Cách nhanh: dùng script

```bash
bash scripts/git-init.sh
```

Script sẽ khởi tạo repo, đặt nhánh `main`, và tạo các commit đầu tiên theo chuẩn Conventional Commits (xem mục 3).

### Cách thủ công

```bash
git init -b main
git add .
git commit -m "chore: khởi tạo dự án TravelGo"
```

### Kết nối với GitHub

1. Vào GitHub → **New repository** → đặt tên `travelgo` → **không** tick "Add a README/.gitignore/license" (repo đã có sẵn).
2. Chạy lệnh GitHub hiển thị:

```bash
git remote add origin https://github.com/<ten-tai-khoan>/travelgo.git
git push -u origin main
```

Nếu dùng SSH: `git remote add origin git@github.com:<ten-tai-khoan>/travelgo.git`.

### Kiểm tra trước khi push

```bash
git status                    # không thấy node_modules/, .env, data/db.json
git ls-files | grep -E "\.env$|node_modules|db\.json"   # phải không ra dòng nào
npm run lint && npm test      # phải sạch lỗi
```

> ⚠️ **Tuyệt đối không commit file `.env`** (chứa `JWT_SECRET`). Nếu lỡ commit, hãy đổi secret ngay vì lịch sử Git vẫn còn bản cũ.

## 2. Chiến lược nhánh

| Nhánh | Vai trò |
| --- | --- |
| `main` | Luôn ổn định, có thể chạy/nộp bài bất cứ lúc nào |
| `develop` | (Tùy chọn) Tích hợp tính năng trước khi vào `main` |
| `feat/<tên>` | Một tính năng, ví dụ `feat/hotel-filter` |
| `fix/<tên>` | Sửa lỗi, ví dụ `fix/booking-total` |
| `docs/<tên>` | Chỉ sửa tài liệu |

Quy trình làm một tính năng:

```bash
git switch main && git pull
git switch -c feat/hotel-filter
# ... sửa code, chạy npm test ...
git add -A
git commit -m "feat(hotels): thêm lọc theo khoảng giá"
git push -u origin feat/hotel-filter
# Mở Pull Request trên GitHub → CI chạy → review → Merge (Squash) vào main
```

Bảo vệ nhánh `main` (Settings → Branches): yêu cầu PR và CI (`build-and-test`) pass trước khi merge.

## 3. Quy ước commit (Conventional Commits)

Dạng: `<loại>(<phạm vi>): <mô tả ngắn, thể mệnh lệnh>`

| Loại | Dùng khi |
| --- | --- |
| `feat` | Thêm tính năng |
| `fix` | Sửa lỗi |
| `docs` | Chỉ thay đổi tài liệu |
| `style` | Định dạng, không đổi logic |
| `refactor` | Cấu trúc lại code, không đổi hành vi |
| `test` | Thêm/sửa test |
| `chore` | Cấu hình, công cụ, phụ thuộc |
| `ci` | Thay đổi pipeline CI |

Ví dụ:

```
feat(flights): thêm sắp xếp theo thời gian bay
fix(auth): chuẩn hóa email về chữ thường khi đăng nhập
docs(api): bổ sung ví dụ đặt phòng
test(bookings): kiểm tra không xem được đơn của người khác
```

Mỗi commit nên nhỏ, làm **một việc**, và chạy được.

## 4. Gắn phiên bản (tag)

```bash
# Sau khi cập nhật CHANGELOG.md và version trong package.json
git tag -a v1.0.0 -m "Phiên bản 1.0.0 - nộp đồ án"
git push origin v1.0.0
```

Dùng [Semantic Versioning](https://semver.org/lang/vi/): `MAJOR.MINOR.PATCH`.

## 5. Làm việc nhóm

- Mỗi thành viên làm trên nhánh riêng, không push thẳng vào `main`.
- Luôn `git pull --rebase origin main` trước khi mở PR để giảm xung đột.
- Giải quyết xung đột bằng cách sửa file, `git add`, rồi `git rebase --continue` (hoặc `git commit` nếu dùng merge).
- Dùng Issue để giao việc; liên kết bằng `Closes #<số>` trong mô tả PR.

## 6. Lệnh hay dùng

| Mục đích | Lệnh |
| --- | --- |
| Xem lịch sử gọn | `git log --oneline --graph --decorate -20` |
| Hủy thay đổi chưa commit ở một file | `git restore <file>` |
| Bỏ file khỏi staging | `git restore --staged <file>` |
| Sửa message commit gần nhất (chưa push) | `git commit --amend` |
| Cất tạm thay đổi | `git stash` / `git stash pop` |
| Tạm quay lại commit cũ để xem | `git switch --detach <hash>` |
