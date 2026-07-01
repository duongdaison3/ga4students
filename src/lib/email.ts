import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

export const sendAccountEmail = async (email: string, fullName: string, randomPass: string) => {
  const mailOptions = {
    from: `"Gemini Academy" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Chào mừng đến với Gemini Academy for Students - Thông tin tài khoản",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #4285F4; text-align: center;">Gemini Academy for Students</h2>
        <p>Xin chào <strong>${fullName}</strong>,</p>
        <p>Cảm ơn bạn đã đăng ký tham gia chương trình. Dưới đây là thông tin tài khoản để truy cập vào hệ thống:</p>
        <div style="background-color: #f8fbff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4285F4;">
          <p style="margin: 5px 0;"><strong>Trang đăng nhập:</strong> <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dang-nhap">Truy cập tại đây</a></p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 5px 0;"><strong>Mật khẩu:</strong> ${randomPass}</p>
        </div>
        <p style="color: #64748b; font-size: 14px;">Vui lòng lưu trữ thông tin này cẩn thận và có thể đổi mật khẩu sau khi đăng nhập.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">© 2026 GSA Trainers. All rights reserved.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

export const sendWorkshopRegistrationEmail = async (email: string, fullName: string, workshopTitle: string) => {
  const mailOptions = {
    from: `"Gemini Academy" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Xác nhận đăng ký thành công: ${workshopTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #4285F4; text-align: center;">Gemini Academy for Students</h2>
        <p>Xin chào <strong>${fullName}</strong>,</p>
        <p>Bạn đã đăng ký tham gia thành công buổi đào tạo:</p>
        <div style="background-color: #eaf1ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4285F4;">
          <h3 style="color: #1e293b; margin-top: 0;">${workshopTitle}</h3>
        </div>
        <p>Vui lòng theo dõi email và nhóm lớp để nhận link tham gia và tài liệu trước buổi học.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">© 2026 GSA Trainers. All rights reserved.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};
