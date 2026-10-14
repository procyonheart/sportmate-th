/*
 * SportMate TH — central API client
 * Talks to the Fastify backend (server/). Replaces the old direct
 * Google Apps Script calls. Stores the JWT auth token in localStorage.
 *
 * Config: set window.SM_API_BASE before loading this file to override the
 * backend origin (e.g. for local dev). Defaults to the deployed API.
 */
(function () {
  var DEFAULT_BASE = 'https://sportmate-api.onrender.com'; // <-- set to your deployed backend
  var ORIGIN = (window.SM_API_BASE || DEFAULT_BASE).replace(/\/+$/, '');
  var BASE = ORIGIN + '/api';

  // actions that require a logged-in user (token sent automatically)
  var AUTH_ACTIONS = {
    postActivity: 1, joinActivity: 1, leaveActivity: 1,
    updateDisplayName: 1, saveProfilePhoto: 1, getNotifications: 1
  };
  // actions served over GET (params go in the query string)
  var GET_ACTIONS = { getActivities: 1, getProfile: 1, getNotifications: 1 };

  function getToken() { try { return localStorage.getItem('sm_token') || ''; } catch (e) { return ''; } }
  function setToken(t) { try { if (t) localStorage.setItem('sm_token', t); } catch (e) {} }
  function clearToken() { try { localStorage.removeItem('sm_token'); } catch (e) {} }

  async function request(method, path, opts) {
    opts = opts || {};
    var headers = {};
    if (method !== 'GET') headers['Content-Type'] = 'application/json';
    if (opts.auth) { var t = getToken(); if (t) headers['Authorization'] = 'Bearer ' + t; }
    var res;
    try {
      res = await fetch(BASE + path, {
        method: method,
        headers: headers,
        body: opts.body ? JSON.stringify(opts.body) : undefined
      });
    } catch (e) {
      return { success: false, message: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่' };
    }
    var data = {};
    try { data = await res.json(); } catch (e) {}
    if (res.status === 401) { clearToken(); if (data && !data.message) data.message = 'เซสชันหมดอายุ'; }
    return data;
  }

  // call(action, payload) -> Promise<responseObject>
  // mirrors the old `{action, ...}` contract so call sites stay simple.
  async function call(action, payload) {
    payload = payload || {};
    var auth = !!AUTH_ACTIONS[action];
    if (GET_ACTIONS[action]) {
      var qs = new URLSearchParams(payload).toString();
      return request('GET', '/' + action + (qs ? '?' + qs : ''), { auth: auth });
    }
    return request('POST', '/' + action, { body: payload, auth: auth });
  }

  window.SM_API = {
    base: BASE,
    origin: ORIGIN,
    call: call,
    getToken: getToken,
    setToken: setToken,
    clearToken: clearToken
  };
})();
