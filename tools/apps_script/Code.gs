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

const SHEET_ID = '1KpeFvnXGK6n7oa6jCDVZB3KkcFjnKG5SEsU7S9qVEBg'; // ← ID ของ Google Sheet

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
      case 'signup':       result = signup(data);         break;
      case 'login':        result = login(data);          break;
      case 'postActivity': result = postActivity(data);   break;
      case 'getActivities':result = getActivities();      break;
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
        return { email: r[3], hashLen: (r[6] || '').toString().length, hashStart: (r[6] || '').toString().substring(0, 8) };
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
  const { fullname, username, email, phone, sports, password_hash } = data;

  // Validate required fields
  if (!fullname || !username || !email || !password_hash) {
    return { success: false, message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' };
  }

  const sheet = getMembersSheet();
  const rows = sheet.getDataRange().getValues();

  // ตรวจสอบ email / username ซ้ำ
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][3] && rows[i][3].toString() === 'email') continue; // ข้าม header
    if (rows[i][3] && rows[i][3].toString().toLowerCase() === email.toLowerCase()) {
      return { success: false, message: 'อีเมลนี้ถูกใช้งานแล้ว' };
    }
    if (rows[i][2] && rows[i][2].toString().toLowerCase() === username.toLowerCase()) {
      return { success: false, message: 'Username นี้ถูกใช้งานแล้ว' };
    }
  }

  const id = Utilities.getUuid();
  const createdAt = new Date().toISOString();
  const sportsStr = Array.isArray(sports) ? sports.join(', ') : (sports || '');

  sheet.appendRow([id, fullname, username, email, phone || '', sportsStr, password_hash, createdAt]);

  // ส่งอีเมลยืนยัน
  try {
    sendConfirmationEmail(email, fullname, username);
  } catch (mailErr) {
    // ไม่ให้ mail error ทำให้ signup ล้มเหลว
    console.log('Mail error: ' + mailErr.message);
  }

  return { success: true, message: 'สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมลของคุณ' };
}

function sendConfirmationEmail(email, fullname, username) {
  const subject = '🏃 ยินดีต้อนรับสู่ SportMate TH!';
  const body = `สวัสดีคุณ ${fullname}!

ยินดีต้อนรับสู่ SportMate TH — แพลตฟอร์มหาเพื่อนออกกำลังกาย GPS-Based สำหรับคนไทย

บัญชีของคุณ:
• Username: ${username}
• อีเมล: ${email}

ตอนนี้คุณสามารถ:
✓ เข้าสู่ระบบที่หน้าหลัก
✓ โพสกิจกรรมกีฬาหาเพื่อน
✓ ค้นหากิจกรรมใกล้บ้านด้วย GPS

มาออกกำลังกายกันเถอะ! 💪

SportMate TH Team`;

  MailApp.sendEmail(email, subject, body);
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
    if (rowEmail === 'email') continue; // ข้าม header row ถ้ามี

    if (rowEmail === email.toLowerCase() && rowHash === password_hash) {
      return {
        success: true,
        fullname: rows[i][1],
        username: rows[i][2],
        email:    rows[i][3],
        sports:   rows[i][5]
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

  const headers = rows[0];
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
  })).filter(a => a.id); // กรอง row ว่าง

  return { success: true, activities };
}
