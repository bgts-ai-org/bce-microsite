/* Minimal Gmail API sender — OAuth2 refresh-token flow, zero dependencies.
   Needs GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, GMAIL_USER in env. */
const fs   = require('fs');
const path = require('path');

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([\w.-]+)\s*=\s*(.*)?\s*$/.exec(line);
    if (!m || line.trim().startsWith('#')) continue;
    const key = m[1];
    let val = (m[2] || '').trim();
    if (val.length >= 2 && ((val[0] === '"' && val.at(-1) === '"') || (val[0] === "'" && val.at(-1) === "'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadEnvFile(path.join(__dirname, '..', '.env'));

async function getAccessToken() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GMAIL_CLIENT_ID,
      client_secret: process.env.GMAIL_CLIENT_SECRET,
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error('Gmail token refresh failed: ' + JSON.stringify(data));
  return data.access_token;
}

function b64url(str) {
  return Buffer.from(str, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/* opts: { to, subject, text, replyTo } */
async function sendMail(opts) {
  const from = process.env.GMAIL_USER;
  const headers = [
    `From: ${from}`,
    `To: ${opts.to}`,
    opts.replyTo ? `Reply-To: ${opts.replyTo}` : null,
    `Subject: =?UTF-8?B?${Buffer.from(opts.subject, 'utf8').toString('base64')}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
  ].filter(Boolean).join('\r\n');
  const raw = b64url(`${headers}\r\n\r\n${opts.text}`);

  const accessToken = await getAccessToken();
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error('Gmail send failed: ' + (data.error?.message || res.status));
  return data;
}

module.exports = { sendMail };
