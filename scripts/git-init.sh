#!/usr/bin/env bash
# Khởi tạo repo Git cho TravelGo với các commit đầu tiên theo Conventional Commits.
# Cách dùng (chạy ở thư mục gốc dự án):  bash scripts/git-init.sh
set -euo pipefail

cd "$(dirname "$0")/.."

if [ -d .git ]; then
  echo "Thư mục này đã là một repo Git. Dừng lại để không ghi đè lịch sử."
  exit 1
fi

if [ -z "$(git config --get user.name || true)" ] || [ -z "$(git config --get user.email || true)" ]; then
  echo "Bạn chưa cấu hình danh tính Git. Chạy hai lệnh sau rồi thử lại:"
  echo '  git config --global user.name  "Tên của bạn"'
  echo '  git config --global user.email "email@cua-ban.com"'
  exit 1
fi

git init -b main

git add .gitignore .gitattributes .editorconfig .env.example .dockerignore \
        package.json package-lock.json eslint.config.js LICENSE data/.gitkeep
git commit -m "chore: khởi tạo dự án và cấu hình công cụ"

git add src
git commit -m "feat(api): thêm backend Express (auth, chuyến bay, khách sạn, đặt chỗ)"

git add public
git commit -m "feat(ui): thêm giao diện tìm kiếm, đặt chỗ và quản lý đơn"

git add tests
git commit -m "test(api): thêm test tích hợp cho các endpoint chính"

git add docs README.md CONTRIBUTING.md CHANGELOG.md
git commit -m "docs: thêm README, SRS, kiến trúc, API, CSDL và hướng dẫn"

git add .github Dockerfile docker-compose.yml scripts
git commit -m "ci: thêm GitHub Actions, Docker và script tiện ích"

echo
echo "Hoàn tất. Lịch sử commit:"
git log --oneline
echo
echo "Bước tiếp theo - đẩy lên GitHub:"
echo "  git remote add origin https://github.com/<ten-tai-khoan>/travelgo.git"
echo "  git push -u origin main"
