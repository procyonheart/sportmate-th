// ============================================================
// SportMate TH — Google Apps Script Backend
// ============================================================
// วิธี Deploy:
// 1. เปิด Google Sheet ใหม่ ชื่อ "SportMate Members"
// 2. สร้าง 2 sheets: "Members" และ "Activities"
// 3. Copy URL ของ Google Sheet แล้วดึง ID มาใส่ใน SHEET_ID
//    (URL รูปแบบ: https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit)
// 4. Extensions → Apps Script → วางโค้ดนี้ทั้งหมด
// 5. Deploy → New deployment → Web App
//    - Execute as: Me
//    - Who has access: Anyone
// 6. Copy "Web app URL" ที่ได้ไปใส่ใน APPS_SCRIPT_URL ในทุกไฟล์ HTML
// ============================================================
//
// Members sheet column layout (index):
//  0: id, 1: fullname, 2: username, 3: email, 4: phone,
//  5: sports, 6: password_hash, 7: created_at,
//  8: gender, 9: skill_level, 10: province, 11: preferred_time,
//  12: verify_token, 13: is_verified, 14: id_verify_status
// ============================================================

const SHEET_ID = '1KpeFvnXGK6n7oa6jCDVZB3KkcFjnKG5SEsU7S9qVEBg';
const SITE_URL = 'https://procyonheart.github.io/sportmate-th';

function getSpreadsheet() {
  return SpreadsheetApp.openById(SHEET_ID);
}

function getMembersSheet() {
  return getSpreadsheet().getSheetByName('Members');
}

function getActivitiesSheet() {
  return getSpreadsheet().getSheetByName('Activities');
}

// ─── Router หลัก ────────────────────────────────────────────
function doPost(e) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const data = JSON.parse(e.postData.contents);
    let result;

    switch (data.action) {
      case 'signup':             result = signup(data);             break;
      case 'login':              result = login(data);              break;
      case 'verifyEmail':        result = verifyEmail(data);        break;
      case 'resendVerification': result = resendVerification(data); break;
      case 'submitIdVerify':     result = submitIdVerify(data);     break;
      case 'postActivity':       result = postActivity(data);       break;
      case 'getActivities':      result = getActivities();          break;
      default:
        result = { success: false, message: 'Unknown action' };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  const action = e.parameter.action;
  let result;
  if (action === 'getActivities') {
    result = getActivities();
  } else if (action === 'debug') {
    const sheet = getMembersSheet();
    const rows = sheet.getDataRange().getValues();
    result = {
      totalRows: rows.length,
      rows: rows.map(function(r) {
        return { email: r[3], isVerified: r[13], idStatus: r[14] };
      })
    };
  } else {
    result = { success: false, message: 'Use POST for other actions' };
  }
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── Signup ─────────────────────────────────────────────────
function signup(data) {
  const { fullname, username, email, phone, sports, password_hash,
          gender, skill_level, province, preferred_time } = data;

  if (!fullname || !username || !email || !password_hash) {
    return { success: false, message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' };
  }

  const sheet = getMembersSheet();
  const rows = sheet.getDataRange().getValues();

  for (let i = 0; i < rows.length; i++) {
    if (rows[i][3] && rows[i][3].toString() === 'email') continue;
    if (rows[i][3] && rows[i][3].toString().toLowerCase() === email.toLowerCase()) {
      return { success: false, message: 'อีเมลนี้ถูกใช้งานแล้ว' };
    }
    if (rows[i][2] && rows[i][2].toString().toLowerCase() === username.toLowerCase()) {
      return { success: false, message: 'Username นี้ถูกใช้งานแล้ว' };
    }
  }

  const id = Utilities.getUuid();
  const verifyToken = Utilities.getUuid();
  const createdAt = new Date().toISOString();
  const sportsStr = Array.isArray(sports) ? sports.join(', ') : (sports || '');
  const preferredTimeStr = Array.isArray(preferred_time) ? preferred_time.join(', ') : (preferred_time || '');

  sheet.appendRow([
    id, fullname, username, email, phone || '', sportsStr, password_hash, createdAt,
    gender || '', skill_level || '', province || '', preferredTimeStr,
    verifyToken, false, 'unverified'
  ]);

  try {
    sendVerificationEmail(email, fullname, username, verifyToken);
  } catch (mailErr) {
    console.log('Mail error: ' + mailErr.message);
  }

  return { success: true, message: 'สมัครสมาชิกสำเร็จ! กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ' };
}

function sendVerificationEmail(email, fullname, username, token) {
  const verifyLink = SITE_URL + '/verify.html?token=' + token;
  const subject = '🏃 ยืนยันอีเมลของคุณ — SportMate TH';
  const body = `สวัสดีคุณ ${fullname}!

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

  MailApp.sendEmail(email, subject, body);
}

// ─── Verify Email ────────────────────────────────────────────
function verifyEmail(data) {
  const { token } = data;
  if (!token) return { success: false, message: 'Token ไม่ถูกต้อง' };

  const sheet = getMembersSheet();
  const rows = sheet.getDataRange().getValues();

  for (let i = 0; i < rows.length; i++) {
    if (rows[i][12] && rows[i][12].toString() === token) {
      if (rows[i][13] === true || rows[i][13] === 'true' || rows[i][13] === 'TRUE') {
        return { success: true, message: 'อีเมลนี้ยืนยันแล้ว', already: true };
      }
      // Mark as verified (col 13 = is_verified)
      sheet.getRange(i + 1, 14).setValue(true);
      return {
        success: true,
        message: 'ยืนยันอีเมลสำเร็จ! ตอนนี้คุณสามารถเข้าสู่ระบบได้แล้ว',
        fullname: rows[i][1],
        username: rows[i][2]
      };
    }
  }

  return { success: false, message: 'Token ไม่ถูกต้องหรือหมดอายุแล้ว' };
}

// ─── Resend Verification ─────────────────────────────────────
function resendVerification(data) {
  const { email } = data;
  if (!email) return { success: false, message: 'กรุณาระบุอีเมล' };

  const sheet = getMembersSheet();
  const rows = sheet.getDataRange().getValues();

  for (let i = 0; i < rows.length; i++) {
    if (rows[i][3] && rows[i][3].toString().toLowerCase() === email.toLowerCase()) {
      if (rows[i][13] === true || rows[i][13] === 'true' || rows[i][13] === 'TRUE') {
        return { success: false, message: 'อีเมลนี้ยืนยันแล้ว' };
      }
      // Generate new token
      const newToken = Utilities.getUuid();
      sheet.getRange(i + 1, 13).setValue(newToken);
      try {
        sendVerificationEmail(rows[i][3], rows[i][1], rows[i][2], newToken);
      } catch (mailErr) {
        return { success: false, message: 'ไม่สามารถส่งอีเมลได้: ' + mailErr.message };
      }
      return { success: true, message: 'ส่งอีเมลยืนยันใหม่แล้ว กรุณาตรวจสอบกล่องจดหมาย' };
    }
  }

  return { success: false, message: 'ไม่พบอีเมลนี้ในระบบ' };
}

// ─── Submit ID Verification ──────────────────────────────────
function submitIdVerify(data) {
  const { email, username } = data;
  if (!email) return { success: false, message: 'กรุณาระบุอีเมล' };

  const sheet = getMembersSheet();
  const rows = sheet.getDataRange().getValues();

  for (let i = 0; i < rows.length; i++) {
    if (rows[i][3] && rows[i][3].toString().toLowerCase() === email.toLowerCase()) {
      if (rows[i][14] === 'approved') {
        return { success: false, message: 'บัญชีนี้ยืนยันตัวตนแล้ว' };
      }
      sheet.getRange(i + 1, 15).setValue('pending');
      // Notify admin
      try {
        MailApp.sendEmail(
          Session.getActiveUser().getEmail(),
          '🆔 คำขอยืนยันตัวตนใหม่ — SportMate TH',
          'มีคำขอยืนยันตัวตนจาก @' + (username || rows[i][2]) + ' (' + rows[i][3] + ')\n\nกรุณาเปิด Google Sheet เพื่อตรวจสอบและอนุมัติ'
        );
      } catch(e) {}
      return { success: true, message: 'ส่งคำขอยืนยันตัวตนสำเร็จ รอการตรวจสอบจากทีมงาน' };
    }
  }

  return { success: false, message: 'ไม่พบบัญชีนี้ในระบบ' };
}

// ─── Login ──────────────────────────────────────────────────
function login(data) {
  const { email, password_hash } = data;

  if (!email || !password_hash) {
    return { success: false, message: 'กรุณากรอกอีเมลและรหัสผ่าน' };
  }

  const sheet = getMembersSheet();
  const rows = sheet.getDataRange().getValues();

  for (let i = 0; i < rows.length; i++) {
    const rowEmail = rows[i][3] ? rows[i][3].toString().toLowerCase() : '';
    const rowHash  = rows[i][6] ? rows[i][6].toString() : '';
    if (rowEmail === 'email') continue;

    if (rowEmail === email.toLowerCase() && rowHash === password_hash) {
      const isVerified = rows[i][13] === true || rows[i][13] === 'true' || rows[i][13] === 'TRUE';

      if (!isVerified) {
        return {
          success: false,
          need_verification: true,
          message: 'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ'
        };
      }

      const idVerifyStatus = rows[i][14] ? rows[i][14].toString() : 'unverified';

      return {
        success: true,
        fullname:        rows[i][1],
        username:        rows[i][2],
        email:           rows[i][3],
        sports:          rows[i][5],
        gender:          rows[i][8] || '',
        skill_level:     rows[i][9] || '',
        province:        rows[i][10] || '',
        preferred_time:  rows[i][11] || '',
        id_verify_status: idVerifyStatus
      };
    }
  }

  return { success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
}

// ─── Post Activity ───────────────────────────────────────────
function postActivity(data) {
  const { username, sport, location_name, lat, lng, datetime, description, max_people } = data;

  if (!username || !sport || !location_name || !datetime) {
    return { success: false, message: 'กรุณากรอกข้อมูลกิจกรรมให้ครบ' };
  }

  const sheet = getActivitiesSheet();
  const id = Utilities.getUuid();
  const createdAt = new Date().toISOString();

  sheet.appendRow([
    id, username, sport,
    location_name,
    lat || '', lng || '',
    datetime, description || '',
    max_people || 1,
    createdAt
  ]);

  return { success: true, id, message: 'โพสกิจกรรมสำเร็จ!' };
}

// ─── Get Activities ──────────────────────────────────────────
function getActivities() {
  const sheet = getActivitiesSheet();
  const rows = sheet.getDataRange().getValues();

  if (rows.length <= 1) return { success: true, activities: [] };

  const activities = rows.slice(1).map(row => ({
    id:            row[0],
    username:      row[1],
    sport:         row[2],
    location_name: row[3],
    lat:           parseFloat(row[4]) || null,
    lng:           parseFloat(row[5]) || null,
    datetime:      row[6],
    description:   row[7],
    max_people:    row[8],
    created_at:    row[9]
  })).filter(a => a.id);

  return { success: true, activities };
}
