# Gemini Academy for Students

Website vận hành chương trình **Gemini Academy for Students - Vươn mình bứt phá cùng AI**. Chương trình dành cho sinh viên các trường đại học, cao đẳng, giúp người học tiếp cận và ứng dụng Google AI vào học tập, nghiên cứu, sáng tạo và phát triển nghề nghiệp.

## Về chương trình

- **Thời gian:** 01/07/2026 - 01/10/2026
- **Hình thức:** 5 buổi trực tuyến
- **Chi phí:** Miễn phí
- **Mô hình:** Peer-to-peer, sinh viên học cùng sinh viên thông qua mạng lưới GSA Trainers
- **Đối tượng:** Sinh viên đại học, cao đẳng trên toàn quốc; người muốn cải thiện hiệu suất học tập và kỹ năng số

### Nội dung đào tạo

1. **Academic Excellence:** Học thông minh, nghiên cứu sâu cùng Google AI
2. **Productivity Hub:** Tối ưu hiệu suất và làm việc nhóm
3. **Creativity Studio:** Phát triển tư duy sáng tạo và tạo nội dung
4. **Tech & Innovation:** Biến ý tưởng thành ứng dụng thực tế
5. **Lifestyle & Soft Skills:** Khám phá bản thân và nâng cao kỹ năng mềm

Sau chương trình, học viên có thể thực hành với các ví dụ thực tế, bài tập ứng dụng và bộ câu lệnh chuẩn hóa. Học viên cũng có thể nhận chứng nhận tham gia, tài liệu học tập, quà lưu niệm và kết nối với diễn giả cùng cộng đồng sinh viên.

## Tính năng website

- Trang giới thiệu chương trình, lộ trình học và sự kiện sắp diễn ra
- Đăng ký tài khoản bằng họ tên, email, số điện thoại và trường học
- Gửi email kích hoạt tài khoản và đặt mật khẩu lần đầu
- Đăng nhập, đổi hoặc đặt lại mật khẩu
- Đăng ký workshop, nhận thông tin tham gia và truy cập phòng học trực tuyến
- Xem lại slide, bản ghi và chi tiết các sự kiện đã diễn ra
- Tích điểm qua hoạt động học tập, theo dõi bảng xếp hạng **The Gemini Elite** và đổi quà
- Khu vực quản trị cho người được cấp quyền: quản lý người dùng, sự kiện, phần thưởng và email marketing

## Công nghệ

- Next.js 16 với App Router và TypeScript
- React 19, Tailwind CSS 4 và Framer Motion
- Firebase Authentication và Cloud Firestore
- Firebase Admin SDK cho các API phía máy chủ
- Nodemailer/Gmail cho email giao dịch và email marketing
- Recharts cho báo cáo trong trang quản trị

## Yêu cầu

- Node.js 22.x
- npm
- Một Firebase project đã bật Authentication và Firestore
- Tài khoản Gmail cùng App Password để gửi email

## Cài đặt và chạy local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) sau khi server khởi động. Nếu repository chưa có `.env.example`, hãy tạo `.env.local` thủ công theo danh sách bên dưới.

### Biến môi trường

Các biến `NEXT_PUBLIC_*` được dùng ở phía trình duyệt. Các biến còn lại chỉ được dùng phía máy chủ và không được đưa vào mã nguồn hoặc commit vào Git.

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# SMTP transactional chính (ví dụ Brevo SMTP)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
BREVO_API_KEY=

# Gmail chỉ dùng dự phòng khi SMTP chính gặp lỗi giới hạn gửi
EMAIL_USER=pea44.work@gmail.com
EMAIL_APP_PASSWORD=
EMAIL_FROM=pea44.work@gmail.com

# Gmail dự phòng thứ hai khi tài khoản trên cũng hết hạn mức
EMAIL_USER_2=
EMAIL_APP_PASSWORD_2=
EMAIL_FROM_2=
```

`FIREBASE_PRIVATE_KEY` phải giữ các ký tự xuống dòng dưới dạng `\n`. `SMTP_FROM` phải là địa chỉ đã xác thực trên nền tảng email. Khi có đủ `SMTP_HOST`, `SMTP_USER` và `SMTP_PASSWORD`, hệ thống sẽ dùng SMTP transactional làm kênh chính. Nếu có `BREVO_API_KEY`, hệ thống kiểm tra quota Brevo trước khi gửi để chuyển ngay sang Gmail khi quota bằng 0. Khi kênh hiện tại trả về lỗi hết hạn mức (ví dụ `5.4.5`, `4.5.3`, `daily send limit` hoặc `quota exceeded`), hệ thống thử ngay tài khoản kế tiếp theo thứ tự `Brevo -> EMAIL_USER -> EMAIL_USER_2`. Mỗi Gmail cần App Password và phải có `EMAIL_FROM` tương ứng với tài khoản đã xác thực.

## Các lệnh thường dùng

```bash
npm run dev      # Chạy môi trường phát triển
npm run lint     # Kiểm tra ESLint
npm run build    # Kiểm tra và build bản production
npm run start    # Chạy bản production sau khi build
```

## Cấu trúc chính

```text
src/
	app/                Các trang, route API và khu vực admin
	components/         Navbar, hero, timeline, sự kiện và các thành phần dùng chung
	lib/                Firebase, email, danh sách trường và tiện ích
public/               Hình ảnh chương trình và tài nguyên tĩnh
```

Các đường dẫn người dùng chính:

- `/` - Trang chủ và tổng quan chương trình
- `/dang-ky` - Đăng ký tài khoản
- `/dang-nhap` - Đăng nhập
- `/su-kien` - Danh sách workshop
- `/the-gemini-elite` - Bảng xếp hạng và thành tích
- `/doi-qua` - Cửa hàng đổi quà
- `/faq` - Câu hỏi thường gặp

Khu vực quản trị bắt đầu tại `/admin` và được bảo vệ bằng Firebase Authentication cùng vai trò admin trong Firestore.

## Dữ liệu và vận hành

Website sử dụng các collection Firestore chính: `users`, `events`, `registrations`, `rewards` và `missions`. Trước khi chạy production, cần thiết lập Firebase Security Rules, cấu hình quyền admin và kiểm tra App Password của Gmail. Không chia sẻ các khóa Firebase Admin, mật khẩu ứng dụng hoặc thông tin người tham gia trong repository.

## Triển khai

Chạy `npm run build` để kiểm tra bản production, sau đó triển khai ứng dụng Next.js trên nền tảng hỗ trợ Node.js 22. Cấu hình toàn bộ biến môi trường trong phần quản lý secrets của nền tảng triển khai và dùng URL production để tạo các liên kết email đặt mật khẩu, đăng ký sự kiện và tham gia lớp học.

## Liên hệ chương trình

Nội dung chương trình được điều phối bởi đội ngũ GSA Trainers. Thông tin lịch học, liên kết lớp và tài liệu mới nhất được cập nhật qua website và kênh liên lạc của lớp.
