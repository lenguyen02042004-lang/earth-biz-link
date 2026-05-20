
# Kế hoạch: GlobalBiz Connect — Danh bạ doanh nghiệp toàn cầu

## Tổng quan
Website B2B kết nối doanh nghiệp toàn cầu. Trang chủ là **quả địa cầu 3D xoay** với logo doanh nghiệp tại vị trí thực, zoom sâu chuyển sang **Google Maps 2D**. Người dùng đăng ký miễn phí → tạo "card visit" doanh nghiệp → xuất hiện trên bản đồ → kết nối với doanh nghiệp khác qua mailbox tích hợp.

Phong cách: **Hồng tươi sáng mạnh mẽ** (hot pink → magenta gradient, nền sáng/tối tương phản, glassmorphism, micro-animation mượt).

---

## Hạ tầng cần bật
1. **Lovable Cloud** — database, auth, storage, server functions
2. **Google Maps connector** — cho map 2D + geocoding địa chỉ → toạ độ
3. **Stripe Payments (seamless)** — gói thành viên + mua thêm lượt
4. **PayPal** — cần bạn cung cấp `PAYPAL_CLIENT_ID` + `PAYPAL_CLIENT_SECRET` (tôi sẽ yêu cầu qua secrets form sau khi dựng UI)
5. **Email domain (tuỳ chọn)** — gửi email thông báo kết nối; có thể bỏ qua giai đoạn đầu, dùng in-app mailbox

---

## Mô hình dữ liệu (chính)

```text
profiles            (id=auth.uid, display_name, avatar_url, email)
user_roles          (user_id, role: user|admin)  -- bảng tách riêng, có hàm has_role()
businesses          (id, owner_id, name, slug, banner_url, logo_url,
                     address, country, province, lat, lng,
                     phone, email, website, short_intro,
                     industry_id, status: draft|public,
                     icon_tier: standard|premium, premium_until,
                     views_count, followers_count, created_at)
business_socials    (business_id, platform, url)   -- 15+ mạng xã hội
business_gallery    (business_id, image_url, order_index)  -- 5 ảnh
industries          (id, name, icon, slug)
countries           (code, name, flag)
follows             (follower_id, business_id)
connect_messages    (id, from_business_id, to_business_id, subject, body,
                     read_at, created_at)
message_quotas      (business_id, period_year, used_count, bonus_credits)
                     -- enforce ≤ 1000/năm + bonus đã mua
subscriptions       (user_id, business_id, tier, provider: stripe|paypal,
                     status, current_period_end, ...)
payments_log        (id, user_id, amount, currency, type:
                     membership|extra_quota|icon_premium, provider, status)
import_jobs         (id, admin_id, file_url, status, processed, errors)
```

RLS: tất cả bảng có policy. `businesses` public read nếu `status='public'`, owner full CRUD. Mailbox chỉ owner đọc. Admin dùng `has_role()`.

---

## Cấu trúc route

```text
/                    Globe 3D + filter (quốc gia, ngành) — landing
/explore             Google Maps 2D + danh sách doanh nghiệp
/b/$slug             Trang chi tiết doanh nghiệp + QR code chia sẻ
/login, /signup, /reset-password
/_authenticated/
  dashboard          Tổng quan: card visit, views, followers, hộp thư
  business/edit      Form nhập/sửa + preview/public
  inbox              Mailbox kết nối (gửi/nhận)
  billing            Gói thành viên, mua thêm lượt, tier icon
  settings           Avatar, tên, đổi mật khẩu, đổi email
  _admin/
    dashboard        Thống kê
    import           Upload CSV/XLSX bulk import
    businesses       Quản lý toàn bộ
    payments         Lịch sử giao dịch
/api/public/
  stripe-webhook
  paypal-webhook
```

---

## Các giai đoạn triển khai

### Giai đoạn 1 — Nền tảng & UI bản đồ (sẽ làm trước khi dừng để xác nhận)
1. Bật Lovable Cloud + Google Maps connector
2. Design system hồng tươi (tokens, gradients, shadows, animations)
3. Schema database + RLS + seed industries/countries
4. Trang chủ **Globe 3D** (react-globe.gl) với marker logo demo
5. Trang `/explore` Google Maps 2D + filter quốc gia/ngành
6. Popup chi tiết doanh nghiệp (card visit) — sang trọng, có nút follow/share/QR
7. Auth: email/password + Google sign-in

**Tôi sẽ dừng ở đây để bạn duyệt giao diện trước khi đi tiếp.**

### Giai đoạn 2 — Quản lý doanh nghiệp & user
8. Form tạo/sửa doanh nghiệp (multi-step, preview, publish)
9. Upload banner/logo/gallery (Lovable Cloud storage)
10. Geocode địa chỉ → lat/lng qua Google Maps server function
11. Dashboard: views, followers, hộp thư inbox
12. Settings tài khoản

### Giai đoạn 3 — Kết nối & Mailbox
13. Nút "Gửi card visit" trên popup → soạn message
14. Enforce quota ≤ 1000/năm (atomic increment với RLS check)
15. Inbox + notification badge

### Giai đoạn 4 — Payments
16. Bật Stripe Payments (seamless)
17. Tạo products: Membership $5/yr, Extra 1000 sends $5, Premium Icon $5/yr
18. Checkout + webhook → update subscriptions/quotas
19. PayPal: yêu cầu secrets, dựng SDK button, webhook verify
20. Icon tier (premium có viền gradient hồng + size lớn hơn trên bản đồ)

### Giai đoạn 5 — Admin
21. Bulk import CSV/XLSX (parse client-side, validate, batch insert, geocode)
22. Admin dashboard & moderation

---

## Chi tiết kỹ thuật quan trọng

- **Globe 3D**: dùng `react-globe.gl` (WebGL, mượt). Marker = HTML overlay với logo. Click → mở popup. Zoom > threshold → animate chuyển sang `/explore` Google Maps.
- **15+ social platforms**: Facebook, Instagram, X/Twitter, LinkedIn, YouTube, TikTok, Threads, Pinterest, Snapchat, WhatsApp, Telegram, WeChat, Line, Zalo, Discord, Reddit, GitHub, Behance, Dribbble.
- **QR code**: dùng thư viện `qrcode` render trên trang `/b/$slug`, link về chính URL đó.
- **Bulk import**: parse với `xlsx` lib trong server function, geocode song song (rate limit), insert qua admin client.
- **Payments**: Stripe seamless (1 click bật, không cần API key). PayPal cần bạn tạo app tại developer.paypal.com.

---

## Cần bạn xác nhận trước khi tôi bắt đầu

1. **OK với kế hoạch chia 5 giai đoạn này?** (Tôi sẽ dừng sau Giai đoạn 1 để bạn duyệt UI.)
2. **Đăng ký**: chỉ email/password hay thêm Google sign-in? (đề xuất: cả hai)
3. **PayPal**: bạn đã có tài khoản PayPal Business + Developer App chưa? Nếu chưa, tôi sẽ làm Stripe trước và PayPal sau khi bạn sẵn sàng.
4. **Ngôn ngữ giao diện**: tiếng Việt, tiếng Anh, hay song ngữ?

Trả lời các điểm trên rồi tôi sẽ bắt đầu Giai đoạn 1 ngay.
