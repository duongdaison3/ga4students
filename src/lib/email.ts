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
  let loginUrl = "http://localhost:3000/dang-nhap";
  try {
    const urlObj = new URL(setPasswordLink);
    loginUrl = `${urlObj.origin}/dang-nhap`;
  } catch (e) {
    // fallback if parsing fails
  }
  const mailOptions = {
    from: `"Gemini Academy" <${senderAddress}>`,
    to: email,
    subject: "[QUAN TRỌNG] Chào mừng đến với Gemini Academy for Students - Kích hoạt tài khoản",
    text: `Xin chào ${fullName},\n\nCảm ơn bạn đã đăng ký tham gia chương trình Google Gemini for Student được tổ chức bởi Pea Dương - GSA Trainer tại Google. Tài khoản của bạn đã được tạo thành công.\n\nVui lòng đặt mật khẩu bằng liên kết sau: ${setPasswordLink}\n\nSau khi đặt mật khẩu, bạn có thể đăng nhập tại: ${loginUrl}\n\nBạn vui lòng tham gia nhóm lớp học trên nền tảng MS Team bằng cách truy cập vào link sau:\nhttps://teams.microsoft.com/l/team/19%3AGxBewz-UCQwSGKyhFNDv6-WOtt13x2wS17yCjen4UQY1%40thread.tacv2/conversations?groupId=120d9962-ae60-4a85-81de-783b3ca2fd5f&tenantId=60900ae5-d282-4ecb-9134-bf478d1b93c1\n\nNếu bạn không yêu cầu đăng ký, vui lòng bỏ qua email này.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #4285F4; text-align: center;">Gemini Academy for Students</h2>
        <p>Xin chào <strong>${fullName}</strong>,</p>
        <p>Cảm ơn bạn đã đăng ký tham gia chương trình Google Gemini for Student được tổ chức bởi Pea Dương - GSA Trainer tại Google. Tài khoản của bạn đã được tạo thành công.</p>
        <p>Vui lòng nhấn nút bên dưới để đặt mật khẩu lần đầu:</p>
        <p style="text-align: center; margin: 24px 0;">
          <a href="${setPasswordLink}" style="background-color: #4285F4; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; display: inline-block; font-weight: 600;">Đặt mật khẩu</a>
        </p>
        <p style="color: #64748b; font-size: 14px;">Nếu nút không hoạt động, bạn có thể sao chép liên kết sau:</p>
        <p style="word-break: break-all; color: #0f172a; font-size: 14px;">${setPasswordLink}</p>
        <p style="margin-top: 12px;"><strong>Trang đăng nhập:</strong> <a href="${loginUrl}">Truy cập tại đây</a></p>
        <p style="margin-top: 24px; color: #0f172a;">Bạn vui lòng tham gia nhóm lớp học trên nền tảng MS Team bằng cách truy cập vào link sau:</p>
        <p style="text-align: center; margin: 16px 0;">
          <a href="https://teams.microsoft.com/l/team/19%3AGxBewz-UCQwSGKyhFNDv6-WOtt13x2wS17yCjen4UQY1%40thread.tacv2/conversations?groupId=120d9962-ae60-4a85-81de-783b3ca2fd5f&tenantId=60900ae5-d282-4ecb-9134-bf478d1b93c1" style="color: #4285F4; font-weight: bold; font-size: 16px; text-decoration: underline;">Chung | Pea - Google Academy for Students - Trainers</a>
        </p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">© 2026 GSA Trainers. All rights reserved.</p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  logEmailResult("Account email", info);
  return info;
};

export const sendWorkshopRegistrationEmail = async (
  email: string,
  fullName: string,
  workshopTitle: string,
  eventData?: { date: string, time: string, type: string, location: string, meetingLink: string }
) => {
  const locationString = eventData?.type === 'Online'
    ? `Microsoft Teams - <strong>Link:</strong> <a href="${eventData?.meetingLink}" style="color: #4285F4; text-decoration: none;">${eventData?.meetingLink}</a>`
    : (eventData?.location || "Chưa cập nhật");

  const mailOptions = {
    from: `"Gemini Academy" <${senderAddress}>`,
    to: email,
    subject: `Xác nhận đăng ký thành công: ${workshopTitle}`,
    text: `Xin chào ${fullName},\n\nBạn đã đăng ký thành công buổi đào tạo: ${workshopTitle}.\n\nVui lòng theo dõi email để nhận thông tin tham gia.`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #334155;">
        <h2 style="color: #4285F4; text-align: center; margin-bottom: 30px; font-size: 20px;">Gemini Academy for Students</h2>
        <p style="margin-bottom: 16px;">Xin chào <strong>${fullName}</strong>,</p>
        <p style="margin-bottom: 24px;">Bạn đã đăng ký tham gia thành công buổi đào tạo:</p>
        
        <div style="background-color: #f1f5f9; padding: 20px 24px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #4285F4;">
          <h3 style="color: #1e293b; margin-top: 0; margin-bottom: 16px; font-size: 18px;">${workshopTitle}</h3>
          <p style="margin: 0 0 6px 0;"><strong>Ngày:</strong> ${eventData?.date || "Chưa cập nhật"}</p>
          <p style="margin: 0 0 6px 0;"><strong>Giờ:</strong> ${eventData?.time || "Chưa cập nhật"}</p>
          <p style="margin: 0;"><strong>Tại:</strong> ${locationString}</p>
        </div>
        
        <p style="margin-top: 24px;">Vui lòng theo dõi email và nhóm lớp để nhận tài liệu trước buổi học (nếu có).</p>
        <p style="text-align: center; margin: 16px 0;">
          <a href="https://teams.microsoft.com/l/team/19%3AGxBewz-UCQwSGKyhFNDv6-WOtt13x2wS17yCjen4UQY1%40thread.tacv2/conversations?groupId=120d9962-ae60-4a85-81de-783b3ca2fd5f&tenantId=60900ae5-d282-4ecb-9134-bf478d1b93c1" style="color: #4285F4; font-weight: bold; font-size: 16px; text-decoration: underline;">Chung | Pea - Google Academy for Students - Trainers</a>
        </p>
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 40px 0 20px 0;" />
        <p style="font-size: 13px; color: #94a3b8; text-align: center; margin: 0;">© 2026 GSA Trainers. All rights reserved.</p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  logEmailResult("Workshop email", info);
  return info;
};

export const sendPersonalizedMarketingEmail = async (
  recipients: { email: string; name: string }[],
  subject: string,
  htmlContent: string
) => {
  const promises = recipients.map(async (recipient) => {
    // Replace {{name}} with the recipient's name
    const personalizedHtml = htmlContent.replace(/{{name}}/g, recipient.name);

    const mailOptions = {
      from: `"Gemini Academy" <${senderAddress}>`,
      to: recipient.email,
      subject: subject,
      html: `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: Arial, Helvetica, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px 0; }
  h1, h2, h3, h4, h5, h6 { color: #4285F4; margin-top: 0; }
  p { margin-top: 0; margin-bottom: 1em; }
  a { color: #4285F4; text-decoration: none; }
  .ql-align-center { text-align: center; }
  .ql-align-right { text-align: right; }
  .ql-align-justify { text-align: justify; }
  .ql-size-large { font-size: 1.5em; }
  .ql-size-huge { font-size: 2em; }
  .ql-size-small { font-size: 0.75em; }
</style>
</head>
<body>
  <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f8fafc">
    <tr>
      <td align="center" style="padding: 20px;">
        <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="max-width: 600px; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden;">
          <tr>
            <td style="padding: 30px; font-family: Arial, Helvetica, sans-serif; color: #334155; font-size: 15px; line-height: 1.6;">
              <h2 style="color: #4285F4; text-align: center; margin-bottom: 24px; font-size: 22px;">Gemini Academy for Students</h2>
              ${personalizedHtml}
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0 20px 0;" />
              <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">© 2026 GSA Trainers. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      return { success: true, email: recipient.email, info };
    } catch (error) {
      console.error(`Lỗi gửi mail cho ${recipient.email}:`, error);
      return { success: false, email: recipient.email, error };
    }
  });

  const results = await Promise.all(promises);
  logEmailResult("Personalized Marketing email batch completed", { messageId: "batch", accepted: [], rejected: [], response: `${results.filter(r => r.success).length} succeeded` } as any);
  return results;
};

export const sendEventInvitationEmail = async (
  email: string,
  fullName: string,
  event: any,
  eventLink: string
) => {
  const mailOptions = {
    from: `"Gemini Academy" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `[THƯ MỜI] ĐĂNG KÝ THAM GIA LỚP HỌC - ${event.title.toUpperCase()}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #334155; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4285F4; text-align: center; font-size: 24px; margin-bottom: 30px;">Gemini Academy for Students</h2>
        
        <p>Xin chào <strong>${fullName}</strong>,</p>
        
        <p>Gemini Academy for Students trân trọng mời bạn đăng ký tham gia workshop <strong>${event.title}</strong>. ${event.description || ""}</p>
        
        <div style="margin: 25px 0;">
          <p style="margin: 10px 0;">📅 <strong>Thời gian:</strong> ${event.time}, ngày <strong>${event.date}</strong></p>
          <p style="margin: 10px 0;">💻 <strong>Hình thức:</strong> ${event.location}</p>
        </div>
        
        <p>👉 <strong>Đăng ký ngay</strong> để giữ chỗ và nhận thông tin tham gia qua email.</p>
        
        <div style="text-align: center; margin: 35px 0;">
          <a href="${eventLink}" style="background-color: #4285F4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Đăng ký ngay</a>
        </div>
        
        <p style="font-style: italic; color: #64748b;">Lưu ý: Nếu <strong>bạn đã đăng ký tham gia sự kiện</strong>, vui lòng <strong>bỏ qua email này</strong>.</p>
        
        <p>Bạn vui lòng tham gia nhóm lớp học trên nền tảng Zalo bằng cách truy cập vào link sau:</p>
        
        <p style="text-align: center; margin: 20px 0;">
          <a href="https://zalo.me/g/lu6hdfxsvzdqjkhs5buv" style="color: #4285F4; font-weight: bold; font-size: 16px; text-decoration: underline;">Tham gia Nhóm Zalo Lớp Học</a>
        </p>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
        <p style="text-align: center; font-size: 12px; color: #94a3b8;">
          © ${new Date().getFullYear()} GSA Trainers. All rights reserved.
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logEmailResult("Event Invitation Email", info);
    return true;
  } catch (error) {
    console.error("Error sending event invitation email:", error);
    return false;
  }
};
