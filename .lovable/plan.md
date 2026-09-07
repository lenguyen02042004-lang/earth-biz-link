# Đối chiếu ứng dụng hiện tại với 2 bản đặc tả (PRD)

## Kết luận nhanh
Ứng dụng hiện đạt khoảng **50–55%** yêu cầu trong PRD.

Phần đã làm tốt: nền tảng doanh nghiệp (hồ sơ, bản đồ, danh bạ, hộp thư, thống kê, admin, import hàng loạt, SEO).
Phần còn thiếu nhiều nhất: **vai trò Cá nhân (Buyer)**, **luồng quét QR tại triển lãm**, **xác thực tích xanh**, **bản in QR/standee**, **thanh toán**.

## Bảng đối chiếu

| Nhóm chức năng theo PRD | Hiện trạng | Mức đạt |
|---|---|---|
| Tài khoản & đăng nhập (Google/Apple 3 giây) | Có đăng ký/đăng nhập email + Google. Chưa có Apple, chưa có luồng đăng nhập nhanh trong popup | 60% |
| Hai vai trò: Cá nhân (Buyer) / Doanh nghiệp (Seller), chuyển đổi vai trò | Chưa có. Chỉ có 1 loại tài khoản gắn với doanh nghiệp | 10% |
| Card visit Doanh nghiệp (logo, banner, liên hệ, mạng xã hội, QR, gallery) | Đã có đầy đủ và đẹp | 85% |
| Card visit Cá nhân (avatar, họ tên, chức vụ, công ty, QR cá nhân) | Chưa có | 0% |
| Thông tin triển lãm: tên triển lãm, số gian hàng (booth) | Chưa có trường dữ liệu | 0% |
| Mã số thuế + khóa cứng tên/địa chỉ theo MST | Chưa có | 0% |
| Tích xanh xác thực (email tên miền / MST / admin duyệt) | Chưa có | 0% |
| Catalogue PDF + album ảnh + video giới thiệu | Có album 5 ảnh; chưa có PDF catalogue, chưa có video | 35% |
| Ẩn một phần liên hệ trước khi kết nối (090xxxx123) | Chưa có — thông tin liên hệ đang hiển thị công khai | 0% |
| Nút hành động: Gọi / Zalo / Email sau khi kết nối | Có link liên hệ và Zalo trong danh sách mạng xã hội, nhưng chưa gắn với trạng thái "đã kết nối" | 40% |
| Ví danh bạ + xuất vCard | Có trang danh bạ + lưu liên hệ + xuất vCard | 80% |
| Hạn mức lưu trữ 200 (cá nhân) / 1.000 (doanh nghiệp), mua thêm block +1.000 | Chưa có giới hạn lưu trữ (chỉ có hạn mức gửi card) | 20% |
| Hạn mức 1.000 lượt kết nối chủ động/năm | Đã có bảng hạn mức và trừ lượt khi gửi card | 75% |
| Danh sách "Khách hàng tiềm năng (Leads)" cho doanh nghiệp | Chưa có (mới chỉ có hộp thư nhận card) | 25% |
| Luồng quét QR → mở khóa → đồng bộ 2 chiều 1-Click | Chưa có. QR hiện chỉ dẫn tới trang hồ sơ và đếm lượt quét | 20% |
| Thông báo tức thời khi có người kết nối | Có chuông thông báo hộp thư theo thời gian thực | 80% |
| Xuất bản in: standee A5/A6 và card visit 9x5.4cm (ảnh/PDF 300 DPI) | Chưa có | 0% |
| Thanh toán 5 USD/năm + mua block | Chưa kích hoạt (Stripe đang chờ) | 10% |
| Chống spam: giới hạn 5 yêu cầu/phút | Chưa có rate limit | 0% |
| Tối ưu Mobile-first, tốc độ tải < 1.5s | Đã tối ưu LCP, SEO, responsive | 75% |

## Việc còn lại, xếp theo thứ tự nên làm

1. **Vai trò Cá nhân + card visit cá nhân** (hồ sơ cá nhân, QR riêng, trang công khai).
2. **Luồng quét QR tại triển lãm**: xem hồ sơ → bấm "Kết nối giao thương" → đăng nhập nhanh → form 4 ô → mở khóa liên hệ + đồng bộ 2 chiều + đẩy lead cho doanh nghiệp.
3. **Che/mở khóa thông tin liên hệ** theo trạng thái kết nối, kèm nút Gọi / Zalo / Email.
4. **Trường triển lãm**: tên triển lãm, số gian hàng; hiển thị nổi bật trên card và lọc theo triển lãm.
5. **Tích xanh xác thực**: tự động theo email tên miền, admin duyệt thủ công; MST tra cứu API để sau.
6. **Catalogue PDF + video giới thiệu** trên hồ sơ doanh nghiệp.
7. **Hạn mức lưu trữ danh bạ** 200/1.000 + mua block +1.000.
8. **Xuất bản in standee A5/A6 và card visit 9x5.4cm**.
9. **Thanh toán** (Stripe hoặc PayOS/VietQR) cho gói 5 USD/năm và block mở rộng.
10. **Rate limit** 5 kết nối/phút.

## Ghi chú kỹ thuật
- Dữ liệu hiện có: `businesses`, `business_socials`, `business_gallery`, `saved_contacts`, `connect_messages`, `message_quotas`, `follows`, `subscriptions`, `payments_log`, `profiles`, `user_roles`, `industries`, `countries`.
- Cần bổ sung: `personal_profiles`, `connections`, `wallet_limits`, `leads` (hoặc dùng chung `connections`), và các cột `tax_code`, `booth_number`, `exhibition_name`, `catalogue_url`, `video_url`, `is_verified` trên `businesses`.
- Mọi bảng mới đều cần GRANT + RLS theo chuẩn hiện tại của dự án.

## Cần bạn quyết
Bạn muốn tôi bắt tay vào nhóm nào trước — (1)+(2)+(3) là bộ ba tạo ra giá trị lớn nhất tại hội chợ, hay ưu tiên (8) bản in QR/standee để kịp in ấn?
