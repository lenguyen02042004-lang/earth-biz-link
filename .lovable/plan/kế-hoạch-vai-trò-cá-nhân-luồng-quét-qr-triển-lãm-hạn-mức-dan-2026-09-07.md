# Kế hoạch: Vai trò Cá nhân, luồng quét QR triển lãm, hạn mức danh bạ, bản in

## Mục tiêu
Bổ sung 4 hạng mục còn thiếu so với đặc tả:
1. Vai trò Cá nhân + danh thiếp cá nhân (QR riêng, trang công khai)
2. Luồng quét QR tại triển lãm (kết nối 1 chạm, mở khóa liên hệ, đẩy lead)
3. Hạn mức lưu danh bạ 200 / 1.000 + mua block +1.000
4. Xuất bản in: standee A5/A6 và card visit 9x5.4 cm

---

## 1. Danh thiếp cá nhân

**Dữ liệu mới:** bảng `personal_profiles` — chủ tài khoản, họ tên, chức vụ, công ty đang làm, điện thoại/Zalo, email, avatar, Facebook, LinkedIn, slug công khai.
Ai cũng xem được hồ sơ đã bật công khai; chỉ chủ sở hữu sửa/xoá.

**Màn hình mới:**
- `/me` — tạo/sửa danh thiếp cá nhân (form ngắn 1 màn, mobile-first)
- `/p/$slug` — trang công khai danh thiếp cá nhân, có QR lồng avatar, nút Gọi / Zalo / Email / Lưu vCard
- Thêm mục "Danh thiếp cá nhân" vào menu bên trái của khu vực tài khoản

---

## 2. Luồng quét QR tại triển lãm

**Dữ liệu mới:** bảng `connections` — người gửi, người nhận (doanh nghiệp hoặc cá nhân), thời điểm, nguồn (`qr`, `manual`), trạng thái mặc định `connected`.

**Luồng:**
1. Khách quét QR → mở `/b/$slug` (công khai). Điện thoại/email/Zalo hiển thị **che một phần** (`090xxxx123`) kèm nút **"Kết nối giao thương"**.
2. Chưa đăng nhập → mở hộp đăng nhập nhanh Google (Apple bổ sung sau, cần bật provider).
3. Lần đầu → form 4 ô: Họ tên, Chức vụ, Công ty, SĐT/Zalo → tự tạo danh thiếp cá nhân.
4. Xác nhận → chạy 1 hàm phía máy chủ làm cùng lúc:
   - ghi `connections`
   - lưu doanh nghiệp vào ví danh bạ của khách (kiểm tra hạn mức)
   - đẩy thông tin khách vào mục **Khách hàng tiềm năng (Leads)** của doanh nghiệp
   - mở khóa hiển thị đầy đủ liên hệ + nút Gọi / Zalo / Email
   - bắn thông báo thời gian thực cho doanh nghiệp (dùng chuông thông báo sẵn có)
5. Đã đăng nhập và đã có danh thiếp → chỉ 1 chạm, không hỏi lại.

**Chống spam:** giới hạn 5 lượt kết nối/phút/người, kiểm tra ngay trong hàm máy chủ.

**Màn hình mới:** `/leads` — danh sách khách đã quét mã của doanh nghiệp (tên, chức vụ, công ty, SĐT, thời gian, nút gọi/Zalo/email, xuất CSV).

---

## 3. Hạn mức lưu danh bạ

**Dữ liệu mới:** bảng `wallet_limits` — mỗi người dùng: mức lưu tối đa (mặc định 200 cá nhân / 1.000 doanh nghiệp), số đã lưu, số block đã mua.

- Mỗi lần lưu danh bạ đều đi qua hàm máy chủ kiểm tra hạn mức; vượt mức thì báo và mời mua thêm block +1.000.
- Trang danh bạ và trang gói dịch vụ hiển thị thanh tiến trình "đã dùng 137/200".
- Nút mua block hiện tại dẫn tới trang gói dịch vụ và ghi nhận yêu cầu; **thanh toán thật sẽ nối khi bạn bật cổng thanh toán** (Stripe hoặc PayOS).

---

## 4. Bản in

Tạo trang `/print/$type/$slug` với 3 khuôn in, render bằng CSS khổ chuẩn và tải về dạng ảnh độ phân giải cao / in trực tiếp qua trình duyệt:
- **Standee để bàn A5/A6**: tiêu đề "Quét mã nhận ngay Catalogue & Kết nối B2B", QR siêu lớn, logo, số gian hàng ở chân trang.
- **Card visit 9x5.4 cm**: mặt trước thông tin, mặt sau nền màu thương hiệu + QR lớn.
- **Card cá nhân 9x5.4 cm**: avatar, họ tên, chức vụ, công ty, QR.

Nút "Xuất bản in" đặt trên trang quản lý doanh nghiệp và trang danh thiếp cá nhân.

---

## Chi tiết kỹ thuật
- Bảng mới: `personal_profiles`, `connections`, `wallet_limits`, `leads` (hoặc view dựng từ `connections`). Mỗi bảng có GRANT + RLS theo chuẩn dự án.
- Hàm máy chủ bảo mật `connect_and_exchange(...)`: kiểm tra đăng nhập, rate limit, hạn mức, ghi connections + saved_contacts + lead trong một giao dịch.
- Liên hệ che/mở: trang công khai chỉ trả về trường đã che; bản đầy đủ lấy qua hàm máy chủ sau khi xác nhận đã kết nối — không dựa vào việc ẩn ở giao diện.
- Bản in dùng `html-to-image` cho xuất PNG chất lượng cao và `@media print` cho in trực tiếp.
- Apple sign-in cần bạn có tài khoản Apple Developer; tạm thời chỉ bật Google.

## Ngoài phạm vi lần này
Mã số thuế tra cứu API, tích xanh xác thực, catalogue PDF/video, thanh toán thật — làm ở đợt sau.
