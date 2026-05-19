// ============================================================
// SportMate TH — Google Apps Script Backend
// ============================================================
// วิธี Deploy:
// 1. เปิด Google Sheet ใหม่ ชื่อ "SportMate Members"
// 2. สร้าง 3 sheets: "Members", "Activities", "Joiners"
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
//  12: verify_token, 13: is_verified, 14: id_verify_status,
//  15: display_name, 16: display_name_changed_at, 17: photo_base64
//
// Activities sheet column layout (index):
//  0: id, 1: username, 2: sport, 3: location_name,
//  4: lat, 5: lng, 6: datetime, 7: description,
//  8: max_people, 9: created_at, 10: image_url,
//  11: display_name, 12: join_count, 13: privacy
//
// Joiners sheet column layout (index):
//  0: activity_id, 1: username, 2: joined_at
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

function getJoinersSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName('Joiners');
  if (!sheet) {
    sheet = ss.insertSheet('Joiners');
    sheet.appendRow(['activity_id', 'username', 'joined_at']);
  }
  return sheet;
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
      case 'joinActivity':       result = joinActivity(data);       break;
      case 'leaveActivity':      result = leaveActivity(data);      break;
      case 'updateDisplayName':  result = updateDisplayName(data);  break;
      case 'saveProfilePhoto':   result = saveProfilePhoto(data);   break;
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
  } else if (action === 'getProfile') {
    result = getProfile(e.parameter.username);
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
    verifyToken, false, 'unverified',
    username, '', ''  // display_name, display_name_changed_at, photo_base64
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
      const displayName = rows[i][15] ? rows[i][15].toString() : rows[i][2].toString();

      return {
        success: true,
        fullname:         rows[i][1],
        username:         rows[i][2],
        email:            rows[i][3],
        sports:           rows[i][5],
        gender:           rows[i][8] || '',
        skill_level:      rows[i][9] || '',
        province:         rows[i][10] || '',
        preferred_time:   rows[i][11] || '',
        id_verify_status: idVerifyStatus,
        display_name:     displayName,
        photo_base64:     rows[i][17] ? rows[i][17].toString() : ''
      };
    }
  }

  return { success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
}

// ─── Post Activity ───────────────────────────────────────────
function postActivity(data) {
  const { username, sport, location_name, lat, lng, datetime,
          description, max_people, image_url, display_name, privacy } = data;

  if (!username || !sport || !location_name || !datetime) {
    return { success: false, message: 'กรุณากรอกข้อมูลกิจกรรมให้ครบ' };
  }

  const sheet = getActivitiesSheet();
  const id = Utilities.getUuid();
  const createdAt = new Date().toISOString();

  var imgToStore = image_url || '';
  var imageStored = true;

  try {
    sheet.appendRow([
      id, username, sport,
      location_name,
      lat || '', lng || '',
      datetime, description || '',
      max_people || 1,
      createdAt,
      imgToStore,
      display_name || username,
      0,
      privacy || 'public'
    ]);
  } catch (appendErr) {
    // ถ้า image_url ยาวเกิน Sheets limit ให้ retry โดยไม่มีรูป
    if (imgToStore && appendErr.message && appendErr.message.indexOf('too long') !== -1) {
      imageStored = false;
      sheet.appendRow([
        id, username, sport,
        location_name,
        lat || '', lng || '',
        datetime, description || '',
        max_people || 1,
        createdAt,
        '',
        display_name || username,
        0,
        privacy || 'public'
      ]);
    } else {
      throw appendErr;
    }
  }

  return { success: true, id, message: 'โพสกิจกรรมสำเร็จ!', image_stored: imageStored };
}

// ─── Get Activities ──────────────────────────────────────────
function getActivities() {
  const sheet = getActivitiesSheet();
  const rows = sheet.getDataRange().getValues();

  if (rows.length <= 1) return { success: true, activities: [] };

  const now = new Date();

  // Build join count map from Joiners sheet
  const joinersSheet = getJoinersSheet();
  const joinRows = joinersSheet.getDataRange().getValues();
  const joinCountMap = {};
  for (let i = 1; i < joinRows.length; i++) {
    const aid = joinRows[i][0] ? joinRows[i][0].toString() : '';
    if (aid) joinCountMap[aid] = (joinCountMap[aid] || 0) + 1;
  }

  const activities = rows.slice(1)
    .map(row => ({
      id:            row[0],
      username:      row[1],
      sport:         row[2],
      location_name: row[3],
      lat:           parseFloat(row[4]) || null,
      lng:           parseFloat(row[5]) || null,
      datetime:      row[6],
      description:   row[7],
      max_people:    parseInt(row[8]) || 1,
      created_at:    row[9],
      image_url:     row[10] ? row[10].toString() : '',
      display_name:  row[11] ? row[11].toString() : (row[1] ? row[1].toString() : ''),
      join_count:    joinCountMap[row[0] ? row[0].toString() : ''] || parseInt(row[12]) || 0,
      privacy:       row[13] ? row[13].toString() : 'public'
    }))
    .filter(a => a.id && new Date(a.datetime) > now);

  return { success: true, activities };
}

// ─── Join Activity ───────────────────────────────────────────
function joinActivity(data) {
  const { activity_id, username } = data;
  if (!activity_id || !username) {
    return { success: false, message: 'ข้อมูลไม่ครบ' };
  }

  const joinersSheet = getJoinersSheet();
  const rows = joinersSheet.getDataRange().getValues();

  // Check if already joined
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0].toString() === activity_id && rows[i][1].toString() === username) {
      return { success: false, message: 'เข้าร่วมแล้ว' };
    }
  }

  // Check activity max_people
  const actSheet = getActivitiesSheet();
  const actRows = actSheet.getDataRange().getValues();
  let actRowIndex = -1;
  let maxPeople = 0;
  for (let i = 1; i < actRows.length; i++) {
    if (actRows[i][0].toString() === activity_id) {
      actRowIndex = i + 1; // 1-indexed
      maxPeople = parseInt(actRows[i][8]) || 1;
      break;
    }
  }

  // Count current joiners
  let currentCount = 0;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0].toString() === activity_id) currentCount++;
  }

  if (currentCount >= maxPeople) {
    return { success: false, message: 'กิจกรรมเต็มแล้ว' };
  }

  joinersSheet.appendRow([activity_id, username, new Date().toISOString()]);
  const newCount = currentCount + 1;

  // Update join_count cache in Activities sheet (col 13, 1-indexed)
  if (actRowIndex > 0) {
    actSheet.getRange(actRowIndex, 13).setValue(newCount);
  }

  return { success: true, join_count: newCount };
}

// ─── Leave Activity ──────────────────────────────────────────
function leaveActivity(data) {
  const { activity_id, username } = data;
  if (!activity_id || !username) {
    return { success: false, message: 'ข้อมูลไม่ครบ' };
  }

  const joinersSheet = getJoinersSheet();
  const rows = joinersSheet.getDataRange().getValues();

  let deletedRow = -1;
  let newCount = 0;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0].toString() === activity_id) {
      if (rows[i][1].toString() === username) {
        deletedRow = i + 1; // 1-indexed
      } else {
        newCount++;
      }
    }
  }

  if (deletedRow < 0) {
    return { success: false, message: 'ไม่พบการเข้าร่วม' };
  }

  joinersSheet.deleteRow(deletedRow);

  // Update join_count cache in Activities sheet
  const actSheet = getActivitiesSheet();
  const actRows = actSheet.getDataRange().getValues();
  for (let i = 1; i < actRows.length; i++) {
    if (actRows[i][0].toString() === activity_id) {
      actSheet.getRange(i + 1, 13).setValue(newCount);
      break;
    }
  }

  return { success: true, join_count: newCount };
}

// ─── Update Display Name ─────────────────────────────────────
function updateDisplayName(data) {
  const { username, new_display_name } = data;
  if (!username || !new_display_name) {
    return { success: false, message: 'ข้อมูลไม่ครบ' };
  }

  const trimmed = new_display_name.trim();
  if (trimmed.length < 1 || trimmed.length > 30) {
    return { success: false, message: 'ชื่อที่แสดงต้องมี 1-30 ตัวอักษร' };
  }

  const sheet = getMembersSheet();
  const rows = sheet.getDataRange().getValues();
  const today = new Date().toDateString();

  for (let i = 0; i < rows.length; i++) {
    if (rows[i][2] && rows[i][2].toString() === username) {
      const lastChanged = rows[i][16] ? rows[i][16].toString() : '';
      if (lastChanged === today) {
        return { success: false, message: 'สามารถเปลี่ยนชื่อที่แสดงได้วันละ 1 ครั้งเท่านั้น' };
      }
      sheet.getRange(i + 1, 16).setValue(trimmed);         // col 16 = display_name (index 15)
      sheet.getRange(i + 1, 17).setValue(today);            // col 17 = display_name_changed_at (index 16)
      return { success: true, message: 'เปลี่ยนชื่อที่แสดงสำเร็จ' };
    }
  }

  return { success: false, message: 'ไม่พบบัญชีผู้ใช้' };
}

// ─── Save Profile Photo ──────────────────────────────────────
function saveProfilePhoto(data) {
  const { username, photo_base64 } = data;
  if (!username) return { success: false, message: 'ข้อมูลไม่ครบ' };

  const sheet = getMembersSheet();
  const rows = sheet.getDataRange().getValues();

  for (let i = 0; i < rows.length; i++) {
    if (rows[i][2] && rows[i][2].toString() === username) {
      sheet.getRange(i + 1, 18).setValue(photo_base64 || '');  // col 18 = photo_base64 (index 17)
      return { success: true };
    }
  }
  return { success: false, message: 'ไม่พบบัญชีผู้ใช้' };
}

// ─── Get Public Profile ──────────────────────────────────────
function getProfile(username) {
  if (!username) return { success: false, message: 'กรุณาระบุ username' };

  const sheet = getMembersSheet();
  const rows = sheet.getDataRange().getValues();

  for (let i = 0; i < rows.length; i++) {
    if (rows[i][2] && rows[i][2].toString().toLowerCase() === username.toLowerCase()) {
      const displayName = rows[i][15] ? rows[i][15].toString() : rows[i][2].toString();
      return {
        success: true,
        username:         rows[i][2],
        display_name:     displayName,
        sports:           rows[i][5] || '',
        gender:           rows[i][8] || '',
        skill_level:      rows[i][9] || '',
        province:         rows[i][10] || '',
        preferred_time:   rows[i][11] || '',
        id_verify_status: rows[i][14] ? rows[i][14].toString() : 'unverified',
        created_at:       rows[i][7] || '',
        photo_base64:     rows[i][17] ? rows[i][17].toString() : ''
      };
    }
  }

  return { success: false, message: 'ไม่พบผู้ใช้นี้' };
}
