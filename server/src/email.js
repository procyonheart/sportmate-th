import { Resend } from 'resend';
import { config } from './config.js';

const resend = config.resendApiKey ? new Resend(config.resendApiKey) : null;

// If no Resend key is configured (local dev), just log the email instead of sending.
async function send({ to, subject, text }) {
  if (!resend) {
    console.log(`\n[email:dev] to=${to}\nsubject=${subject}\n${text}\n`);
    return { dev: true };
  }
  return resend.emails.send({ from: config.mailFrom, to, subject, text });
}

// port of sendVerificationEmail() from tools/apps_script/Code.gs:166
export async function sendVerificationEmail(email, fullname, username, token) {
  const verifyLink = `${config.siteUrl}/verify.html?token=${token}`;
  const subject = '🏃 ยืนยันอีเมลของคุณ — SportMate TH';
  const text = `สวัสดีคุณ ${fullname}!

ขอบคุณที่สมัครสมาชิก SportMate TH 🎉

กรุณาคลิกลิงก์ด้านล่างเพื่อยืนยันอีเมลและเปิดใช้งานบัญชีของคุณ:

${verifyLink}

ลิงก์นี้ใช้ได้ภายใน 24 ชั่วโมง

บัญชีของคุณ:
• Username: @${username}
• อีเมล: ${email}

หากคุณไม่ได้สมัครสมาชิก SportMate TH กรุณาเพิกเฉยอีเมลนี้

มาออกกำลังกายด้วยกันเถอะ! 💪
SportMate TH Team`;
  return send({ to: email, subject, text });
}

export async function sendIdVerifyAdminAlert(username, email) {
  if (!config.adminEmail) return;
  return send({
    to: config.adminEmail,
    subject: '🆔 คำขอยืนยันตัวตนใหม่ — SportMate TH',
    text: `มีคำขอยืนยันตัวตนจาก @${username} (${email})\n\nกรุณาตรวจสอบและอนุมัติในฐานข้อมูล`,
  });
}
