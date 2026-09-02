export const ADMIN_EMAILS = [
  "pea44.work@gmail.com",
  "spea22@xpea.io.vn",
  "vuongtonga171105@gmail.com",
  "hieutrandanh322@gmail.com",
];

export function isAdminEmail(email?: string | null) {
  return Boolean(email && ADMIN_EMAILS.includes(email.toLowerCase()));
}
