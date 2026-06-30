// script.js for index2.html (dashboard)

const RTDB_BASE = 'https://pionix-5ff2c-default-rtdb.firebaseio.com';
const LOGIN_DB_BASE = 'https://admin-login-ab66b-default-rtdb.firebaseio.com';
const TIER_TO_FOLDER = {
  LUNATIC: 'PX Lunatic',
  SIERRA: 'PX Sierra',
  AERIS: 'PX Aeris'
};

let cTier = 'LUNATIC';
let cExp = null;
let cCustomEnabled = false;

function qs(id){ return document.getElementById(id); }

function updatePreview(){
  const custom = (qs('genCustom')?.value || '').toUpperCase().trim();
  // preview: kalau custom kosong, pakai label RANDOM-UUID (mengikuti generateLicense)
  const suffix = custom || randomSuffix8();

  if(qs('prevKey')) qs('prevKey').innerText = `PX-PREM-${cTier}-${suffix}`;
}

function selectTier(t, el){
  cTier = t;
  document.querySelectorAll('.btn-tier').forEach(b => b.classList.remove('btn-active'));
  if(el) el.classList.add('btn-active');
  updatePreview();
}

function selectExp(e, el){
  cExp = e;
  document.querySelectorAll('.btn-exp').forEach(b => b.classList.remove('btn-active'));
  if(el) el.classList.add('btn-active');
  if(qs('cDate')) qs('cDate').classList.add('hidden');
  cCustomEnabled = false;
}

function toggleCustom(el){
  document.querySelectorAll('.btn-exp').forEach(b => b.classList.remove('btn-active'));
  if(el) el.classList.add('btn-active');
  if(qs('cDate')) qs('cDate').classList.remove('hidden');
  cCustomEnabled = true;
}

function toggleMaint(status){
  const overlay = qs('maintOverlay');
  if(!overlay) return;
  const msg = qs('maintInput')?.value || '';
  if(status){
    const display = qs('maintMsgDisplay');
    if(display) display.innerText = msg || 'System is currently under maintenance.';
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
  } else {
    overlay.classList.add('hidden');
    overlay.classList.remove('flex');
  }
}

function logout(){
  localStorage.clear();
  location.href = 'login.html';
}

async function fetchAccountInfo(){
  const username = localStorage.getItem('px_u') || localStorage.getItem('px_username') || '';
  if(!username) return;
  try{
    const res = await fetch(`${LOGIN_DB_BASE}/users/${encodeURIComponent(username)}.json`);
    const data = await res.json();
    if(data){
      if(qs('uName')) qs('uName').innerText = data.name || username;
      if(qs('uRole')) qs('uRole').innerText = (data.role || 'user').toUpperCase();
      const token = data.token || data.coins || data.balance || 0;
      if(qs('uToken')) qs('uToken').innerText = token;
    }
  }catch(_){ }
}

function buildLicenseKey(tier, suffix){
  return `PX-PREM-${tier}-${suffix}`;
}

function randomSuffix8(){
  // 8 char campur angka/huruf (contoh: a1B2c3D4)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let out = '';
  for(let i=0;i<8;i++){
    out += chars[Math.floor(Math.random()*chars.length)];
  }
  return out;
}




function calculateExpiry(expOption, customDate) {
  if (cCustomEnabled) {
    return customDate || '';
  }
  if (!expOption) return 'Lifetime';
  if (expOption === '∞') return 'Lifetime';

  const match = expOption.match(/^(\d+)[Dd]$/);
  if (match) {
    const days = parseInt(match[1], 10);
    const date = new Date();
    date.setDate(date.getDate() + days);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  return expOption;
}

async function generateLicense(){
  const username = qs('genUsername')?.value?.trim() || (localStorage.getItem('px_u') || localStorage.getItem('px_username') || '');
  const limit = qs('genLimit')?.value || '1';
  const deviceId = qs('genDevId')?.value || '';
  const customField = (qs('genCustom')?.value || '').toUpperCase().trim();
  const customDate = qs('cDate')?.value || '';

  const suffix = customField || randomSuffix8();
  const licenseKey = buildLicenseKey(cTier, suffix);
  const expValue = calculateExpiry(cExp, customDate);

  const folder = TIER_TO_FOLDER[cTier] || cTier;
  const url = `${RTDB_BASE}/${encodeURIComponent(folder)}/${encodeURIComponent(licenseKey)}.json`;

  const body = {
    LisensiKey: licenseKey,
    Device: String(limit),
    Exp: String(expValue),
    Type: 'premium',
    DeviceId: String(deviceId),
    Username: String(username),
    Name: String(suffix)
  };

  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      // Set values inside centered success modal
      if (qs('m_license')) qs('m_license').innerText = licenseKey;
      if (qs('m_deviceId')) qs('m_deviceId').innerText = deviceId || '-';
      if (qs('m_deviceLimit')) qs('m_deviceLimit').innerText = limit;
      if (qs('m_exp')) qs('m_exp').innerText = expValue;
      if (qs('m_username')) qs('m_username').innerText = username;

      // Show overlay
      const overlay = qs('notifyOverlay');
      if (overlay) {
        overlay.classList.remove('hidden');
      }

      updatePreview();

      // Show bottom copyBox too if exists
      const copyBox = qs('copyBox');
      if (copyBox) {
        const keyEl = qs('copyLicenseKey');
        const userEl = qs('copyUsername');
        if (userEl) userEl.value = username;
        if (keyEl) keyEl.value = licenseKey;
        copyBox.classList.remove('hidden');
      }

      if (qs('prevKey')) qs('prevKey').innerText = licenseKey;
    } else {
      const text = await res.text();
      alert('Generate failed: ' + res.status + ' - ' + text);
    }
  } catch (err) {
    alert('Database connection error: ' + err.message);
  }
}

function viewModule(name){
  const map = { Lunatic:'LUNATIC', Aeris:'AERIS', Sierra:'SIERRA' };
  const tier = map[name] || 'LUNATIC';
  location.href = `inventory.html?tier=${encodeURIComponent(tier)}`;
}

function initActiveTier(){
  const active = document.querySelector('.btn-tier.btn-active');
  if(active) return;
  const first = document.querySelector('.btn-tier');
  if(first) first.classList.add('btn-active');
}

document.addEventListener('DOMContentLoaded', () => {
  fetchAccountInfo();
  updatePreview();
  initActiveTier();

  // Close notify modal & clear inputs (returns to dashboard state)
  const btnClose = qs('btnCloseNotify');
  if (btnClose) {
    btnClose.addEventListener('click', () => {
      qs('notifyOverlay').classList.add('hidden');
      if (qs('genUsername')) qs('genUsername').value = '';
      if (qs('genLimit')) qs('genLimit').value = '';
      if (qs('genDevId')) qs('genDevId').value = '';
      if (qs('genCustom')) qs('genCustom').value = '';
      if (qs('cDate')) {
        qs('cDate').value = '';
        qs('cDate').classList.add('hidden');
      }
      cExp = null;
      cCustomEnabled = false;
      document.querySelectorAll('.btn-exp').forEach(b => b.classList.remove('btn-active'));
      updatePreview();
    });
  }

  // Copy username + license key
  const btnCopy = qs('btnCopyLicense');
  if (btnCopy) {
    btnCopy.addEventListener('click', async () => {
      const license = qs('m_license')?.innerText || '';
      const username = qs('m_username')?.innerText || '';
      const text = `Username: ${username}\nLisensi: ${license}`;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          const ta = document.createElement('textarea');
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }
        alert('Username dan Lisensi berhasil di-copy!');
      } catch (e) {
        alert('Gagal menyalin: ' + (e?.message || 'unknown'));
      }
    });
  }
});

// expose globals for inline onclick
window.updatePreview = updatePreview;
window.selectTier = selectTier;
window.selectExp = selectExp;
window.toggleCustom = toggleCustom;
window.toggleMaint = toggleMaint;
window.logout = logout;
window.viewModule = viewModule;
window.generateLicense = generateLicense;

window.hideCopyBox = function(){
  const box = qs('copyBox');
  if(box) box.classList.add('hidden');
};

window.copyGeneratedAll = async function(){
  const userEl = qs('copyUsername');
  const keyEl = qs('copyLicenseKey');
  const username = userEl?.value || '';
  const key = keyEl?.value || '';
  const text = `Username: ${username}\nLisensi: ${key}`.trim();

  try{
    if(navigator.clipboard && navigator.clipboard.writeText){
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    alert('Tersalin!');
  } catch(e){
    alert('Gagal copy: ' + (e?.message || 'unknown'));
  }
};


