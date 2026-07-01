import nodemailer from "nodemailer";

const senderAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

const logEmailResult = (label: string, info: nodemailer.SentMessageInfo) => {
  console.info(`[mail] ${label}`, {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
    response: info.response,
  });
};

export const sendAccountEmail = async (email: string, fullName: string, setPasswordLink: string) => {
  const loginUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/dang-nhap`;
  const mailOptions = {
    from: `"Gemini Academy" <${senderAddress}>`,
    to: email,
    subject: "Chào mừng đến với Gemini Academy for Students - Kích hoạt tài khoản",
    text: `Xin chào ${fullName},\n\nTài khoản của bạn đã được tạo thành công. Vui lòng đặt mật khẩu bằng liên kết sau: ${setPasswordLink}\n\nSau khi đặt mật khẩu, bạn có thể đăng nhập tại: ${loginUrl}\n\nNếu bạn không yêu cầu đăng ký, vui lòng bỏ qua email này.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #4285F4; text-align: center;">Gemini Academy for Students</h2>
        <p>Xin chào <strong>${fullName}</strong>,</p>
        <p>Cảm ơn bạn đã đăng ký tham gia chương trình. Tài khoản của bạn đã được tạo thành công.</p>
        <p>Vui lòng nhấn nút bên dưới để đặt mật khẩu lần đầu:</p>
        <p style="text-align: center; margin: 24px 0;">
          <a href="${setPasswordLink}" style="background-color: #4285F4; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; display: inline-block; font-weight: 600;">Đặt mật khẩu</a>
        </p>
        <p style="color: #64748b; font-size: 14px;">Nếu nút không hoạt động, bạn có thể sao chép liên kết sau:</p>
        <p style="word-break: break-all; color: #0f172a; font-size: 14px;">${setPasswordLink}</p>
        <p style="margin-top: 12px;"><strong>Trang đăng nhập:</strong> <a href="${loginUrl}">Truy cập tại đây</a></p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">© 2026 GSA Trainers. All rights reserved.</p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  logEmailResult("Account email", info);
  return info;
};

export const sendWorkshopRegistrationEmail = async (email: string, fullName: string, workshopTitle: string) => {
  const mailOptions = {
    from: `"Gemini Academy" <${senderAddress}>`,
    to: email,
    subject: `Xác nhận đăng ký thành công: ${workshopTitle}`,
    text: `Xin chào ${fullName},\n\nBạn đã đăng ký thành công buổi đào tạo: ${workshopTitle}.\n\nVui lòng theo dõi email để nhận thông tin tham gia.`,
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

  const info = await transporter.sendMail(mailOptions);
  logEmailResult("Workshop email", info);
  return info;
};
