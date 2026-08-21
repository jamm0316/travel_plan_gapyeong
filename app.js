/* ==========================================================
   춘천 환갑여행 — app.js
   ========================================================== */

const TRIP_DATE = '2026-08-22'; // KST
const KST_OFFSET = 9 * 60; // minutes

// 춘천 (의암호 / 서면 숙소 근처)
const LAT = 37.88;
const LON = 127.70;

/* ---------- 데이터 ---------- */
const TIMELINE = [
  { start: '08:00', title: '보미네 출발', note: '' },
  { start: '08:30', title: '소영이네 출발', note: '' },
  { start: '09:10', title: '신대방삼거리 출발', note: '서울양양고속도로 → 남춘천IC → 신북 샘밭 (토요일 오전 기준 약 1시간 40~50분)' },
  { start: '10:50', title: '통나무집닭갈비 본점', note: '10:30 오픈. <strong>대기 30분 넘으면 바로 별당막국수로 전환 (15분 거리)</strong>' },
  { start: '12:30', end: '12:55', title: '카페 드 220볼트', note: '커피 한 잔, 숨 고르기' },
  { start: '14:10', title: '구곡폭포', note: '카누 대신. 입구에서 폭포까지 약 20분 산책' },
  { start: '16:10', end: '16:20', title: '이마트 춘천점', note: '두 팀으로 나눠 진행 — 한 팀은 장보기, 한 팀은 케이크 픽업 (춘천로 232 1층)' },
  { start: '17:10', end: '17:30', title: '숙소 도착', note: '짐 풀고 해질녘 의암호 산책' },
  { start: '19:00', label: '저녁', title: '삼겹살 🥓 + 케이크 서프라이즈 🎂 + 게임 🎲', note: '' },
];

const ADDRESSES = [
  { emoji: '🏡', name: '숙소', addr: '강원특별자치도 춘천시 서면 금산리 477-1' },
  { emoji: '🍗', name: '통나무집닭갈비 본점', addr: '강원특별자치도 춘천시 신북읍 신샘밭로 763', kakao: 'https://place.map.kakao.com/8107636' },
  { emoji: '☕', name: '카페 드 220볼트', addr: '강원특별자치도 춘천시 동내면 금촌로 107-27 1-3층', kakao: 'https://place.map.kakao.com/184325082' },
  { emoji: '💦', name: '구곡폭포', addr: '강원 춘천시 남산면 강촌구곡길 254', kakao: 'https://place.map.kakao.com/8235953' },
  { emoji: '🎂', name: '케이크 픽업', addr: '강원특별자치도 춘천시 춘천로 232 1층' },
];

/* ---------- 유틸 ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// 디버그: ?t=HH:MM 으로 여행 당일 특정 시각을 시뮬레이션
const SIM_TIME = new URLSearchParams(location.search).get('t');
function nowKST() {
  if (SIM_TIME && /^\d{2}:\d{2}$/.test(SIM_TIME)) return new Date(`${TRIP_DATE}T${SIM_TIME}:00`);
  const d = new Date();
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  return new Date(utc + KST_OFFSET * 60000);
}
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 1800);
}

function legacyCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, text.length);
  let ok = false;
  try { ok = document.execCommand('copy'); } catch {}
  ta.remove();
  return ok;
}
async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      // 권한 프롬프트 등으로 멈추면 800ms 후 폴백
      await Promise.race([
        navigator.clipboard.writeText(text),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 800)),
      ]);
      return true;
    } catch {}
  }
  return legacyCopy(text);
}

/* ---------- Reveal on scroll ---------- */
(function initReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach((el) => io.observe(el));
})();

/* ---------- Countdown (hero) ---------- */
function renderCountdown() {
  const el = $('#countdown');
  const now = nowKST();
  const trip = new Date(`${TRIP_DATE}T08:00:00+09:00`);
  const diff = trip - new Date();
  const today = ymd(now) === TRIP_DATE;
  if (today) { el.innerHTML = '<strong>오늘이에요.</strong> 좋은 하루 보내요 🎂'; return; }
  if (diff < 0) { el.innerHTML = '<strong>다녀왔어요.</strong> 고마웠던 하루 🎂'; return; }
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  el.innerHTML = d > 0
    ? `출발까지 <strong>${d}일 ${h}시간</strong>`
    : `출발까지 <strong>${h}시간 ${m}분</strong>`;
}

/* ---------- Timeline ---------- */
function renderTimeline() {
  const list = $('#timeline-list');
  list.innerHTML = TIMELINE.map((t, i) => {
    const time = t.label ? t.label : (t.end ? `${t.start} – ${t.end}` : t.start);
    return `
      <li class="tl-item" data-i="${i}">
        <span class="tl-dot" aria-hidden="true"></span>
        <div class="tl-card">
          <p class="tl-time">${time}</p>
          <h3 class="tl-title">${t.title}<span class="tl-badge" hidden>NOW</span></h3>
          ${t.note ? `<p class="tl-note">${t.note}</p>` : ''}
        </div>
      </li>`;
  }).join('');
}

function updateTimeline() {
  const now = nowKST();
  $('#clock').textContent = hm(now);
  const today = ymd(now);
  const items = $$('.tl-item');

  let state; // 'before' | 'today' | 'after'
  if (today < TRIP_DATE) state = 'before';
  else if (today > TRIP_DATE) state = 'after';
  else state = 'today';

  $('#clock-label').textContent = state === 'today' ? '지금 시각' : (state === 'before' ? '여행 전 · 지금' : '여행 후 · 지금');

  // 현재 일정 인덱스: start <= now < 다음 start
  let current = -1;
  if (state === 'today') {
    const m = now.getHours() * 60 + now.getMinutes();
    TIMELINE.forEach((t, i) => { if (toMin(t.start) <= m) current = i; });
  }

  items.forEach((li, i) => {
    li.classList.remove('past', 'now', 'upcoming');
    const badge = $('.tl-badge', li);
    badge.hidden = true;
    if (state === 'after') { li.classList.add('past'); return; }
    if (state === 'before') { li.classList.add('upcoming'); return; }
    if (i < current) li.classList.add('past');
    else if (i === current) { li.classList.add('now'); badge.hidden = false; }
    else li.classList.add('upcoming');
  });
}

/* ---------- Addresses ---------- */
function renderAddresses() {
  const list = $('#addr-list');
  list.innerHTML = ADDRESSES.map((a) => {
    const mapUrl = a.kakao || `https://map.kakao.com/link/search/${encodeURIComponent(a.addr)}`;
    return `
      <li class="addr">
        <span class="addr-emoji" aria-hidden="true">${a.emoji}</span>
        <div class="addr-body">
          <p class="addr-name">${a.name}</p>
          <p class="addr-text">${a.addr}</p>
        </div>
        <div class="addr-actions">
          <a class="map-btn" href="${mapUrl}" target="_blank" rel="noopener">지도</a>
          <button class="copy-btn" data-copy="${a.addr}">복사</button>
        </div>
      </li>`;
  }).join('');
}

document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-copy]');
  if (!btn) return;
  const ok = await copyText(btn.dataset.copy);
  if (ok) {
    const orig = btn.textContent;
    btn.textContent = '복사됨 ✓';
    btn.classList.add('done');
    toast('주소를 복사했어요');
    setTimeout(() => { btn.textContent = orig; btn.classList.remove('done'); }, 1600);
  } else {
    toast('복사에 실패했어요');
  }
});

/* ---------- Checklists (localStorage) ---------- */
(function initChecklists() {
  $$('.checklist[data-list]').forEach((ul) => {
    const key = `chuncheon60:${ul.dataset.list}`;
    let saved = [];
    try { saved = JSON.parse(localStorage.getItem(key) || '[]'); } catch {}
    const boxes = $$('input[type=checkbox]', ul);
    boxes.forEach((b, i) => { b.checked = !!saved[i]; });
    ul.addEventListener('change', () => {
      try { localStorage.setItem(key, JSON.stringify(boxes.map((b) => b.checked))); } catch {}
    });
  });
})();

/* ---------- Weather (Open-Meteo, no key) ---------- */
const WMO = {
  0: ['☀️', '맑음'], 1: ['🌤️', '대체로 맑음'], 2: ['⛅', '구름 조금'], 3: ['☁️', '흐림'],
  45: ['🌫️', '안개'], 48: ['🌫️', '안개'],
  51: ['🌦️', '약한 이슬비'], 53: ['🌦️', '이슬비'], 55: ['🌧️', '강한 이슬비'],
  56: ['🌧️', '어는 이슬비'], 57: ['🌧️', '어는 이슬비'],
  61: ['🌧️', '약한 비'], 63: ['🌧️', '비'], 65: ['🌧️', '강한 비'],
  66: ['🌧️', '어는 비'], 67: ['🌧️', '어는 비'],
  71: ['🌨️', '약한 눈'], 73: ['🌨️', '눈'], 75: ['❄️', '강한 눈'], 77: ['🌨️', '싸락눈'],
  80: ['🌦️', '소나기'], 81: ['🌧️', '소나기'], 82: ['⛈️', '강한 소나기'],
  85: ['🌨️', '눈 소나기'], 86: ['🌨️', '강한 눈 소나기'],
  95: ['⛈️', '뇌우'], 96: ['⛈️', '우박 동반 뇌우'], 99: ['⛈️', '강한 우박 뇌우'],
};
const wmo = (c, isDay = 1) => {
  const r = WMO[c] || ['🌡️', '—'];
  if (!isDay && (c === 0 || c === 1)) return ['🌙', r[1]];
  return r;
};

async function loadWeather() {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.search = new URLSearchParams({
    latitude: LAT, longitude: LON, timezone: 'Asia/Seoul',
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,is_day,precipitation',
    hourly: 'temperature_2m,weather_code,precipitation_probability',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code',
    start_date: ymd(nowKST()) < TRIP_DATE ? ymd(nowKST()) : TRIP_DATE,
    end_date: TRIP_DATE > ymd(nowKST()) ? TRIP_DATE : ymd(nowKST()),
  }).toString();

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.status);
    const d = await res.json();

    // 현재
    const c = d.current;
    const [icon, desc] = wmo(c.weather_code, c.is_day);
    $('#w-icon').textContent = icon;
    $('#w-temp').textContent = Math.round(c.temperature_2m);
    $('#w-desc').textContent = desc;
    $('#w-feel').textContent = `${Math.round(c.apparent_temperature)}°`;
    $('#w-hum').textContent = `${c.relative_humidity_2m}%`;
    $('#w-sub').textContent = `춘천시 · ${hm(nowKST())} 기준`;

    // 토요일(여행일) daily
    const di = d.daily.time.indexOf(TRIP_DATE);
    if (di >= 0) {
      $('#w-range').textContent = `${Math.round(d.daily.temperature_2m_min[di])}° / ${Math.round(d.daily.temperature_2m_max[di])}°`;
      $('#w-rain').textContent = `${d.daily.precipitation_probability_max[di] ?? '--'}%`;
    } else {
      $('#w-range').textContent = `${Math.round(d.daily.temperature_2m_min[0])}° / ${Math.round(d.daily.temperature_2m_max[0])}°`;
      $('#w-rain').textContent = `${d.daily.precipitation_probability_max[0] ?? '--'}%`;
      $('.wd-item .wd-label').textContent = '오늘';
    }

    // 시간별 (여행일 07~22시, 여행일이 범위 밖이면 오늘)
    const targetDay = di >= 0 ? TRIP_DATE : d.daily.time[0];
    const curHour = `${targetDay}T${pad(nowKST().getHours())}:00`;
    const rows = d.hourly.time
      .map((t, i) => ({ t, temp: d.hourly.temperature_2m[i], code: d.hourly.weather_code[i], p: d.hourly.precipitation_probability[i] }))
      .filter((r) => r.t.startsWith(targetDay))
      .filter((r) => { const h = +r.t.slice(11, 13); return h >= 7 && h <= 22; });
    $('#w-hourly').innerHTML = rows.map((r) => {
      const h = +r.t.slice(11, 13);
      const [ic] = wmo(r.code, h >= 6 && h < 20 ? 1 : 0);
      return `<div class="wh ${r.t === curHour ? 'now' : ''}">
        <div class="wh-t">${h}시</div>
        <div class="wh-i">${ic}</div>
        <div class="wh-v">${Math.round(r.temp)}°</div>
        <div class="wh-p">${r.p != null && r.p > 0 ? `💧${r.p}%` : ''}</div>
      </div>`;
    }).join('');
    $('#w-foot').textContent = `데이터: Open‑Meteo · ${di >= 0 ? '8월 22일(토)' : '오늘'} 시간별 예보`;
  } catch (err) {
    console.warn('weather failed', err);
    $('#w-desc').textContent = '날씨를 불러오지 못했어요';
    $('#w-sub').textContent = '노션 기준: 흐리고 비 (강수 90%) · 22° / 27°';
    $('#w-icon').textContent = '🌧️';
  }
}

/* ---------- Bottom nav active state ---------- */
(function initNav() {
  const links = $$('.bottom-nav a');
  const map = new Map(links.map((a) => [a.dataset.nav, a]));
  const sections = [...map.keys()].map((id) => document.getElementById(id)).filter(Boolean);
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        links.forEach((a) => a.classList.remove('active'));
        const a = map.get(e.target.id);
        if (a) { a.classList.add('active'); a.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }); }
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
  sections.forEach((s) => io.observe(s));
})();

/* ---------- Boot ---------- */
renderTimeline();
renderAddresses();
renderCountdown();
updateTimeline();
loadWeather();
setInterval(() => { updateTimeline(); renderCountdown(); }, 30 * 1000);
setInterval(loadWeather, 10 * 60 * 1000);
