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
  { start: '09:10', origin: { lat: 37.4996, lng: 126.9284 }, title: '신대방삼거리 출발', note: '서울양양고속도로 → 남춘천IC → 신북 샘밭 (토요일 오전 기준 약 1시간 40~50분)' },
  { start: '10:50', place: 'dak', title: '통나무집닭갈비 3호점', note: '11:00 오픈. <strong>대기 30분 넘으면 바로 별당막국수로 전환 (15분 거리)</strong>' },
  { start: '12:30', end: '12:55', place: 'cafe', title: '카페 드 220볼트', note: '커피 한 잔, 숨 고르기' },
  { start: '14:10', place: 'falls', cancelled: '우천 취소', title: '구곡폭포', note: '카누 대신. 입구에서 폭포까지 약 20분 산책' },
  { start: '14:40', end: '16:00', place: 'emart', title: '이마트 춘천점', note: '저녁에 먹을 것 장보기', actions: [{ label: '🛒 장보기 시트 바로가기', href: 'https://docs.google.com/spreadsheets/d/1fZlDQ2KtcwuzCUQaptH2lqLO0msNBpkEQGia3m9Qmh4/edit?usp=sharing' }] },
  { start: '16:30', place: 'lodge', title: '숙소 도착', note: '짐 풀고 해질녘 의암호 산책' },
  { start: '19:00', label: '저녁', title: '삼겹살 🥓', note: '숙소에서 구워 먹어요' },
];

/* 장소 마스터 — 좌표는 카카오맵 기준 (WGS84) */
const PLACES = {
  lodge:   { emoji: '🏡', name: '숙소 (비안단테펜션)', addr: '강원특별자치도 춘천시 서면 금산리 477-1', lat: 37.9025010, lng: 127.7001772, kakaoId: 1506410889 },
  dak:     { emoji: '🍗', name: '통나무집닭갈비 3호점', addr: '강원특별자치도 춘천시 신북읍 신샘밭로 663 1층', lat: 37.9302906, lng: 127.7834141, kakaoId: 565901527, trafficBuffer: 60 }, // 서울→춘천 구간 정체 여유(분)
  cafe:    { emoji: '☕', name: '카페 드 220볼트', addr: '강원특별자치도 춘천시 동내면 금촌로 107-27 1-3층', lat: 37.8569708, lng: 127.7837874, kakaoId: 184325082 },
  falls:   { emoji: '💦', name: '구곡폭포', addr: '강원특별자치도 춘천시 남산면 강촌구곡길 254', lat: 37.7970328, lng: 127.6158520, kakaoId: 8235953 },
  emart:   { emoji: '🛒', name: '이마트 춘천점', addr: '강원특별자치도 춘천시 경춘로 2353', lat: 37.8638304, lng: 127.7185711, kakaoId: 8546847 },
  cake:    { emoji: '🎂', name: '케이크 픽업 (케이크베이크)', addr: '강원특별자치도 춘천시 춘천로 232 1층', lat: 37.8781191, lng: 127.7395238, kakaoId: 1783314184 },
};
const ADDRESSES = [PLACES.lodge, PLACES.dak, PLACES.cafe, PLACES.falls, PLACES.emart];

const tmapUrl = (p) => `tmap://route?goalname=${encodeURIComponent(p.name)}&goalx=${p.lng}&goaly=${p.lat}`;
const kakaoUrl = (p) => p.kakaoId ? `https://map.kakao.com/link/to/${p.kakaoId}` : `https://map.kakao.com/link/to/${encodeURIComponent(p.name)},${p.lat},${p.lng}`;
const navButtons = (p, { dark = false } = {}) => `
  <button class="copy-btn" data-copy="${p.addr}">주소 복사</button>
  <a class="map-btn tmap" href="${tmapUrl(p)}" data-tmap>티맵</a>
  <a class="map-btn" href="${kakaoUrl(p)}" target="_blank" rel="noopener">카카오맵</a>`;

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
const distM = (a, b) => {
  const R = 6371000, r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
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
const DEPARTURES = [
  { name: '보미네', time: '08:00' },
  { name: '소영이네', time: '08:30' },
];
function fmtDiff(ms) {
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return d > 0 ? `${d}일 ${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(h)}:${pad(m)}:${pad(s)}`;
}
function renderCountdown() {
  const el = $('#countdown');
  const now = nowKST();
  if (document.body.dataset.mode === 'memory') {
    const d = Math.round((new Date(`${ymd(now)}T00:00:00+09:00`) - new Date(`${TRIP_DATE}T00:00:00+09:00`)) / 86400000);
    el.innerHTML = d > 0 ? `<span class="cd">그날로부터 <strong>D+${d}</strong></span>` : '<span class="cd"><strong>오늘</strong></span>';
    return;
  }
  const real = new Date();
  const lastTrip = new Date(`${TRIP_DATE}T${DEPARTURES[DEPARTURES.length - 1].time}:00+09:00`);
  if (ymd(now) > TRIP_DATE || (ymd(now) === TRIP_DATE && real > lastTrip && !SIM_TIME)) {
    el.innerHTML = '<strong>다녀왔어요.</strong> 고마웠던 하루 🎉'; return;
  }
  el.innerHTML = DEPARTURES.map(({ name, time }) => {
    const target = new Date(`${TRIP_DATE}T${time}:00+09:00`);
    const diff = target - real;
    const body = diff <= 0 ? '<strong>출발!</strong> 🚗' : `<strong>${fmtDiff(diff)}</strong>`;
    return `<span class="cd"><span class="cd-name">${name} 출발까지</span> ${body}</span>`;
  }).join('');
}

/* ---------- Timeline ---------- */
function renderTimeline() {
  const list = $('#timeline-list');
  list.innerHTML = TIMELINE.map((t, i) => {
    const time = t.label ? t.label : (t.end ? `${t.start} – ${t.end}` : t.start);
    return `
      <li class="tl-item${t.cancelled ? ' cancelled' : ''}" data-i="${i}">
        <span class="tl-dot" aria-hidden="true"></span>
        <div class="tl-card">
          <p class="tl-time">${time}</p>
          <h3 class="tl-title">${t.title}${t.cancelled ? `<span class="tl-cancel">${t.cancelled}</span>` : ''}<span class="tl-badge" hidden>NOW</span></h3>
          ${t.note ? `<p class="tl-note">${t.note}</p>` : ''}
          ${t.place ? `<p class="tl-addr">${PLACES[t.place].addr}</p><p class="tl-plan" data-plan="${t.place}" hidden></p><p class="tl-eta" data-eta="${t.place}" hidden></p>` : ''}
          ${(t.place || t.actions) ? `<div class="tl-actions">${t.place ? navButtons(PLACES[t.place]) : ''}${(t.actions || []).map((a) => `<a class="tl-btn" href="${a.href}" target="_blank" rel="noopener">${a.label}</a>`).join('')}</div>` : ''}
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
    TIMELINE.forEach((t, i) => { if (!t.cancelled && toMin(t.start) <= m) current = i; });
  }

  // 위치 추적 중이면 위치로 보정: 장소 300m 안 → 그 장소가 NOW, 아니면 아직 못 간 장소는 NOW가 될 수 없음
  let enroute = -1;
  const pos = window.ETA_POS;
  if (state === 'today' && pos) {
    const NEAR = 300;
    let visited = [];
    try { visited = JSON.parse(localStorage.getItem('chuncheon60:visited') || '[]'); } catch {}
    let near = -1;
    TIMELINE.forEach((t, i) => {
      if (!t.place || t.cancelled) return;
      if (distM(pos, PLACES[t.place]) <= NEAR) { near = i; if (!visited.includes(i)) visited.push(i); }
    });
    try { localStorage.setItem('chuncheon60:visited', JSON.stringify(visited)); } catch {}
    if (near >= 0) current = Math.max(current, near);
    else {
      // 시간상 NOW가 아직 안 가본 장소면, 그 앞의 항목으로 되돌림
      while (current >= 0 && (TIMELINE[current].cancelled || (TIMELINE[current].place && !visited.includes(current)))) current--;
      // 다음 장소로 이동 중
      for (let i = current + 1; i < TIMELINE.length; i++) if (TIMELINE[i].place && !TIMELINE[i].cancelled) { enroute = i; break; }
    }
  }
  // 위치 없이 시간만으로: 종료 시각이 지났으면 간 것으로 보고(past), 출발/이동 항목 중에는 다음 장소를 '이동 중'으로
  let doneThrough = -1; // 이 인덱스까지는 past
  if (state === 'today' && !pos && current >= 0) {
    const m = now.getHours() * 60 + now.getMinutes();
    const cur = TIMELINE[current];
    const finished = !!cur.end && toMin(cur.end) <= m;
    if (finished || !cur.place) {
      for (let i = current + 1; i < TIMELINE.length; i++) if (TIMELINE[i].place && !TIMELINE[i].cancelled) { enroute = i; break; }
    }
    if (finished) { doneThrough = current; current = -1; }
  }
  PLAN.enroute = enroute;
  PLAN.current = state === 'today' ? (doneThrough >= 0 ? doneThrough : current) : (state === 'before' ? -1 : TIMELINE.length);

  items.forEach((li, i) => {
    li.classList.remove('past', 'now', 'upcoming', 'enroute');
    const badge = $('.tl-badge', li);
    badge.hidden = true;
    badge.textContent = 'NOW';
    if (i === enroute) { li.classList.add('enroute'); badge.hidden = false; badge.textContent = '🚗 이동 중'; }
    if (state === 'after') { li.classList.add('past'); return; }
    if (state === 'before') { li.classList.add('upcoming'); return; }
    if (i < current || i <= doneThrough) li.classList.add('past');
    else if (i === current) { li.classList.add('now'); badge.hidden = false; }
    else li.classList.add('upcoming');
    if (li.classList.contains('cancelled')) { li.classList.remove('now', 'enroute', 'upcoming'); badge.hidden = true; }
  });
}

/* ---------- 현재 시각 기준 예상 도착시각 (구간 소요시간은 OSRM으로 1회 산출) ---------- */
const PLAN = { legs: null, fromMe: null };
(async function loadLegs() {
  // 경로 순서: 출발지(신대방삼거리) → 장소가 있는 일정 순서대로
  const origin = TIMELINE.find((t) => t.origin)?.origin;
  const stops = TIMELINE.filter((t) => t.place && !t.cancelled).map((t) => PLACES[t.place]);
  if (!origin || !stops.length) return;
  const pts = [origin, ...stops].map((p) => `${p.lng},${p.lat}`).join(';');
  try {
    const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${pts}?overview=false`);
    const data = await res.json();
    if (data.code !== 'Ok') throw new Error(data.code);
    PLAN.legs = data.routes[0].legs.map((l) => l.duration); // legs[i] = (i번째 이전 지점) → stops[i]
  } catch {
    // 오프라인/실패 시: 노션 기준 대략치 (초)
    PLAN.legs = stops.map((p, i) => (i === 0 ? 100 * 60 : 30 * 60));
  }
  renderPlan();
})();

function renderPlan() {
  if (!PLAN.legs) return;
  const now = nowKST();
  const state = ymd(now) === TRIP_DATE ? 'today' : (ymd(now) < TRIP_DATE ? 'before' : 'after');
  const items = $$('.tl-item');
  const at = (t) => new Date(`${TRIP_DATE}T${t}:00+09:00`).getTime();
  const cur = PLAN.current ?? -1;
  const originItem = TIMELINE.find((t) => t.origin);
  // 현재 일정이 장소면 "거기 있음", 아니면(출발/이동 중) "다음 장소로 이동 중"
  const curItem = TIMELINE[cur];
  const atPlace = state === 'today' && curItem && curItem.place && window.ETA_POS ? true : (state === 'today' && curItem && curItem.place);
  let prevArrive = null;   // 이전 장소 도착(예상) 시각
  let prevEnd = originItem ? originItem.start : null;
  let legIdx = 0, started = false;
  TIMELINE.forEach((t, i) => {
    if (!t.place) return;
    const el = $('.tl-plan', items[i]);
    if (t.cancelled) { el.hidden = true; return; }
    const leg = PLAN.legs[legIdx++];
    const buf = (PLACES[t.place].trafficBuffer || 0) * 60;
    // 이미 도착한(지난 또는 현재) 장소는 표시 안 함
    if (state === 'after' || (state === 'today' && i <= cur)) {
      el.hidden = true;
      prevArrive = at(t.start); prevEnd = t.end || null;
      return;
    }
    const travel = ((!started && PLAN.fromMe && PLAN.fromMe[t.place] != null) ? PLAN.fromMe[t.place] : leg) + buf;
    const schedDepart = prevEnd ? at(prevEnd) : at(t.start) - travel * 1000; // 예정 출발
    let depart;
    if (!started) {
      if (state !== 'today') depart = schedDepart;
      else if (atPlace && PLAN.enroute < 0) depart = Math.max(now.getTime(), schedDepart); // 현재 장소에서 예정대로 출발
      else depart = now.getTime();                                        // 이동 중: 지금부터
    } else depart = Math.max(prevArrive, schedDepart);
    const arrive = depart + travel * 1000;
    el.hidden = false;
    const late = arrive - at(t.start);
    const lateTxt = late > 5 * 60 * 1000 ? ` <span class="late">예정보다 ${Math.round(late / 60000)}분 늦음</span>` : '';
    el.innerHTML = (state === 'today' ? '⏱ 지금 기준 ' : '⏱ 09:10 출발 기준 ')
      + `<strong>${hm(new Date(arrive))} 도착</strong> 예정${buf ? ` (정체 +${Math.round(buf / 60)}분 포함)` : ''}${lateTxt}`;
    prevArrive = Math.max(arrive, t.end ? at(t.end) : arrive);
    prevEnd = t.end || null;
    started = true;
  });
}

/* ---------- 내 위치 → 일정 장소 소요시간 (OSRM, 무료·교통 미반영) ---------- */
(function initEta() {
  const btn = $('#eta-toggle'); if (!btn) return;
  const status = $('#eta-status');
  const KEY = 'chuncheon60:eta';
  const keys = Object.keys(PLACES);
  let watchId = null, timer = null, lastPos = null, lastFetchAt = 0, inflight = false;

  const fmt = (sec) => {
    const m = Math.round(sec / 60);
    if (m < 60) return `${m}분`;
    return `${Math.floor(m / 60)}시간 ${m % 60 ? `${m % 60}분` : ''}`.trim();
  };
  const km = (m) => m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0)}km`;
  const setStatus = (msg) => { status.hidden = !msg; status.textContent = msg || ''; };

  function render(durations, distances) {
    $$('.tl-eta').forEach((el) => {
      const i = keys.indexOf(el.dataset.eta);
      const li = el.closest('.tl-item');
      const d = durations?.[i], dist = distances?.[i];
      if (d == null || li.classList.contains('past') || li.classList.contains('now') || li.classList.contains('cancelled')) { el.hidden = true; return; }
      el.hidden = false;
      el.innerHTML = `🚗 내 위치에서 <strong>${fmt(d)}</strong> · ${km(dist)}`;
    });
  }

  async function fetchEta(force) {
    if (!lastPos || inflight) return;
    if (!force && Date.now() - lastFetchAt < 60 * 1000) return;
    inflight = true;
    try {
      const coords = [`${lastPos.lng},${lastPos.lat}`, ...keys.map((k) => `${PLACES[k].lng},${PLACES[k].lat}`)].join(';');
      const url = `https://router.project-osrm.org/table/v1/driving/${coords}?sources=0&annotations=duration,distance`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.code !== 'Ok') throw new Error(data.code);
      lastFetchAt = Date.now();
      render(data.durations[0].slice(1), data.distances[0].slice(1));
      PLAN.fromMe = Object.fromEntries(keys.map((k, i) => [k, data.durations[0][i + 1]]));
      renderPlan();
      setStatus(`내 위치 기준 · ${hm(nowKST())} 갱신`);
    } catch (e) {
      setStatus('경로 서버에 연결하지 못했어요. 잠시 후 다시 시도합니다.');
    } finally { inflight = false; }
  }

  function onPos(p) {
    const { latitude: lat, longitude: lng } = p.coords;
    const moved = !lastPos || Math.hypot(lat - lastPos.lat, (lng - lastPos.lng) * Math.cos(lat * Math.PI / 180)) > 0.002; // ≈200m
    lastPos = { lat, lng };
    window.ETA_POS = lastPos;
    updateTimeline(); renderPlan();
    fetchEta(moved);
  }
  function onErr(e) {
    const msg = e.code === 1 ? '위치 권한이 꺼져 있어요. 브라우저 설정에서 허용해 주세요.' : '위치를 가져오지 못했어요.';
    setStatus(msg);
    if (e.code === 1) stop();
  }

  function start() {
    if (!('geolocation' in navigator)) { toast('이 기기는 위치를 지원하지 않아요'); return; }
    btn.setAttribute('aria-pressed', 'true');
    btn.textContent = '📍 내 위치 추적 중 · 끄기';
    setStatus('위치 확인 중…');
    try { localStorage.setItem(KEY, '1'); } catch {}
    watchId = navigator.geolocation.watchPosition(onPos, onErr, { enableHighAccuracy: false, maximumAge: 30000, timeout: 20000 });
    timer = setInterval(() => fetchEta(true), 2 * 60 * 1000);
  }
  function stop() {
    btn.setAttribute('aria-pressed', 'false');
    btn.textContent = '📍 내 위치에서 걸리는 시간 보기';
    setStatus('');
    try { localStorage.removeItem(KEY); } catch {}
    if (watchId != null) navigator.geolocation.clearWatch(watchId);
    clearInterval(timer); watchId = null; timer = null; lastPos = null;
    window.ETA_POS = null; updateTimeline();
    render(null, null);
    PLAN.fromMe = null; renderPlan();
  }

  btn.addEventListener('click', () => (watchId == null ? start() : stop()));
  document.addEventListener('visibilitychange', () => { if (!document.hidden && watchId != null) fetchEta(true); });
  // 타임라인 상태가 바뀌어도(past 전환) 배지가 맞게 보이도록
  setInterval(() => { if (watchId != null && lastPos) $$('.tl-eta').forEach((el) => { if (el.closest('.tl-item').classList.contains('past')) el.hidden = true; }); }, 30 * 1000);

  let auto = false;
  try { auto = localStorage.getItem(KEY) === '1'; } catch {}
  if (auto) start();
})();

/* ---------- Addresses ---------- */
function renderAddresses() {
  const list = $('#addr-list');
  list.innerHTML = ADDRESSES.map((a) => `
      <li class="addr">
        <span class="addr-emoji" aria-hidden="true">${a.emoji}</span>
        <div class="addr-body">
          <p class="addr-name">${a.name}</p>
          <p class="addr-text">${a.addr}</p>
        </div>
        <div class="addr-actions">${navButtons(a)}</div>
      </li>`).join('');
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

/* 티맵 미설치 시: 앱이 안 열리면 1.5초 뒤 카카오맵 길찾기로 대체 */
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-tmap]');
  if (!a) return;
  const fallback = a.parentElement.querySelector('a[href*="map.kakao.com"]')?.href;
  if (!fallback) return;
  const t0 = Date.now();
  const timer = setTimeout(() => {
    // 앱으로 전환됐다면 페이지가 숨겨져 타이머가 지연됨 → 그 경우 대체 이동 안 함
    if (document.visibilityState === 'visible' && Date.now() - t0 < 2500) window.location.href = fallback;
  }, 1500);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearTimeout(timer); }, { once: true });
});

/* ---------- 추억 모드: 챕터 데이터 ---------- */
const MEMORY = [
  { id: 'dak', emoji: '🍗', time: '10:50', title: '통나무집닭갈비', sub: '춘천의 시작은 역시 닭갈비', tone: '#ff7a3d',
    memo: '대기 없이 들어가 치즈까지 얹었다. 마지막 볶음밥은 국룰.',
    cover: 'images/memory/dak/01-dakgalbi.jpg',
    photos: ['images/memory/dak/02-table.jpg', 'images/memory/dak/03-bokkeumbap.jpg', 'images/memory/dak/01-dakgalbi.jpg'] },
  { id: 'cafe', emoji: '☕', time: '12:30', title: '카페 드 220볼트', sub: '빨간 문 앞에서', tone: '#e0564e',
    memo: '커피보다 오래 머문 건 빨간 문 앞과 레고 전시. 셜록이도 한 컷.',
    cover: 'images/memory/cafe/04-reddoor-all.jpg',
    photos: ['images/memory/cafe/01-three.jpg', 'images/memory/cafe/05-mom-terrace.jpg', 'images/memory/cafe/02-reddoor.jpg', 'images/memory/cafe/09-parents-reddoor.jpg', 'images/memory/cafe/03-reddoor-three.jpg', 'images/memory/cafe/06-dad-profile.jpg', 'images/memory/cafe/07-mom-sherlock-lego.jpg', 'images/memory/cafe/08-eiffel-lego.jpg', 'images/memory/cafe/04-reddoor-all.jpg'] },
  { id: 'emart', emoji: '🛒', time: '14:40', title: '이마트 춘천점', sub: '저녁거리 고르기', tone: '#ffc107',
    memo: '빗길 정체를 뚫고 도착. 포도는 아빠가 골랐고, 한 명은 슬쩍 빠져나가 케이크를 찾으러.',
    cover: 'images/memory/emart/02-grapes.jpg',
    photos: ['images/memory/emart/05-rain-traffic.jpg', 'images/memory/emart/04-walk.jpg', 'images/memory/emart/03-veggies.jpg', 'images/memory/emart/01-vsign.jpg', 'images/memory/emart/02-grapes.jpg'] },
  { id: 'dinner', emoji: '🥓', time: '저녁', title: '삼겹살, 그리고 케이크', sub: '숙소 마당에서', tone: '#b47cff',
    memo: '연기 속에서 구운 고기, 60이 적힌 케이크, 그림 맞히기와 추억의 뽑기판.',
    cover: 'images/memory/dinner/01-grill.jpg',
    photos: ['images/memory/dinner/07-grill-three.jpg', 'images/memory/dinner/08-yard.jpg', 'images/memory/dinner/09-balloons.jpg', 'images/memory/dinner/06-table.jpg', 'images/memory/dinner/02-cake.jpg', 'images/memory/dinner/03-game-board.jpg', 'images/memory/dinner/04-drawing-mom.jpg', 'images/memory/dinner/05-drawing-glasses.jpg', 'images/memory/dinner/01-grill.jpg'] },
];

// 세로 사진 목록 (레이아웃을 로드 전에 고정하기 위한 비율 정보)
const PORTRAIT = new Set(['02-reddoor.jpg', '03-reddoor-three.jpg', '04-reddoor-all.jpg', '02-cake.jpg']);

function renderMemory() {
  const root = $('#memory-root'); if (!root || root.dataset.built) return;
  root.innerHTML = MEMORY.map((c, idx) => `
    <section id="m-${c.id}" class="mem" style="--tone:${c.tone}">
      <div class="mem-cover">
        <img class="mem-cover-img" src="${c.cover}" alt="${c.title}" loading="${idx === 0 ? 'eager' : 'lazy'}" />
        <div class="mem-cover-shade"></div>
        <div class="mem-cover-text">
          <p class="mem-kicker"><span class="mem-chip">${c.emoji} ${c.time}</span></p>
          <h2 class="mem-title">${c.title}</h2>
          <p class="mem-sub">${c.sub}</p>
        </div>
      </div>
      <div class="mem-body">
        <div class="strip" data-strip aria-label="${c.title} 사진">
          <div class="strip-track">
            ${c.photos.map((src) => { const pt = PORTRAIT.has(src.split('/').pop()); return `<figure class="strip-item" style="aspect-ratio:${pt ? '3/4' : '4/3'}"><img src="${src}" alt="${c.title}" width="${pt ? 1200 : 1600}" height="${pt ? 1600 : 1200}" loading="lazy" decoding="async" /></figure>`; }).join('')}
          </div>
        </div>
        <p class="mem-memo">${c.memo}</p>
      </div>
    </section>`).join('') + `
    <section class="mem-end">
      <p class="mem-end-title">다시, 고마웠어요.</p>
      <p class="mem-end-sub">2026. 8. 22. 춘천 · 보미네 & 소영이네 & 셜록이</p>
    </section>`;
  root.dataset.built = '1';
  initStrips();
  initNav();
}

/* 사진 스트립: 손 안 대면 오른쪽으로 천천히 흐르고, 만지면 멈추고 직접 넘김 */
function initStrips() {
  $$('[data-strip]').forEach((strip) => {
    const track = $('.strip-track', strip);
    // 끊김 없는 루프를 위해 복제
    const count = track.children.length;
    track.innerHTML += track.innerHTML;                      // 2벌 복제 → 끊김 없는 루프
    const firstB = () => track.children[count];              // 두 번째 벌의 첫 사진
    let paused = false, visible = false, raf = null, resumeTimer = null;
    let pos = 0;               // 소수 누적 위치 (scrollLeft는 정수로 반올림되므로 따로 관리)
    const speed = 0.4;         // px/frame ≈ 24px/s
    // 반복 주기 = 첫 사진 → 복제본 첫 사진까지의 거리 (좌우 패딩 때문에 scrollWidth/2 와 다름)
    const half = () => firstB().offsetLeft - track.children[0].offsetLeft;
    const step = () => {
      if (!paused && visible) {
        pos += speed;
        if (pos >= half()) pos -= half();
        strip.scrollLeft = pos;
      }
      raf = requestAnimationFrame(step);
    };
    const pause = () => { paused = true; clearTimeout(resumeTimer); };
    const resume = () => { clearTimeout(resumeTimer); resumeTimer = setTimeout(() => { pos = strip.scrollLeft; paused = false; }, 2500); };
    strip.addEventListener('pointerdown', pause);
    strip.addEventListener('pointerup', resume);
    strip.addEventListener('pointercancel', resume);
    strip.addEventListener('mouseenter', pause);
    strip.addEventListener('mouseleave', resume);
    strip.addEventListener('touchstart', pause, { passive: true });
    strip.addEventListener('touchend', resume, { passive: true });
    strip.addEventListener('scroll', () => {
      if (!paused) return;
      const h = half();
      if (strip.scrollLeft >= h) strip.scrollLeft -= h;
      else if (strip.scrollLeft <= 0) strip.scrollLeft += h;
      pos = strip.scrollLeft;
    }, { passive: true });
    new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible && !raf) raf = requestAnimationFrame(step); }, { threshold: 0.1 }).observe(strip);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) paused = true;
  });
}

/* 커버 패럴랙스 */
(function initParallax() {
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      $$('.mem-cover').forEach((cv) => {
        const r = cv.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight; // -1..1
        $('.mem-cover-img', cv).style.transform = `translateY(${p * -12}%) scale(1.15)`;
      });
      ticking = false;
    });
  }, { passive: true });
})();

/* ---------- 여행 / 추억 모드 ---------- */
(function initMode() {
  const KEY = 'chuncheon60:mode';
  const sw = $('.mode-switch'); if (!sw) return;
  const btns = $$('button', sw);
  function apply(mode, { scroll = false } = {}) {
    document.body.dataset.mode = mode;
    $$('[data-trip]').forEach((el) => { el.hidden = mode !== 'trip'; });
    $$('[data-memory]').forEach((el) => { el.hidden = mode !== 'memory'; });
    btns.forEach((b) => b.setAttribute('aria-selected', String(b.dataset.mode === mode)));
    sw.dataset.mode = mode;
    if (mode === 'memory') renderMemory();
    renderCountdown();
    try { localStorage.setItem(KEY, mode); } catch {}
    if (scroll) window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  btns.forEach((b) => b.addEventListener('click', () => { if (document.body.dataset.mode !== b.dataset.mode) apply(b.dataset.mode, { scroll: true }); }));
  let mode = null;
  try { mode = localStorage.getItem(KEY); } catch {}
  if (location.hash.startsWith('#m-')) mode = 'memory';
  if (!mode) mode = ymd(nowKST()) > TRIP_DATE ? 'memory' : 'trip';
  apply(mode);
})();

/* ---------- Gallery lightbox ---------- */
(function initLightbox() {
  const lb = $('#lightbox'); if (!lb) return;
  const img = $('img', lb);
  const close = () => { lb.hidden = true; img.src = ''; document.body.style.overflow = ''; };
  document.addEventListener('click', (e) => {
    const src = e.target.closest('.gallery img, .strip img');
    if (src) { img.src = src.src; img.alt = src.alt; lb.hidden = false; document.body.style.overflow = 'hidden'; return; }
    if (e.target.closest('#lightbox')) close();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !lb.hidden) close(); });
})();

/* ---------- hero CTA: 오늘이면 NOW 항목으로, 아니면 첫 항목으로 ---------- */
(function initHeroCta() {
  const cta = $('.hero-cta'); if (!cta) return;
  cta.addEventListener('click', (e) => {
    e.preventDefault();
    const target = $('.tl-item.now') || $('.tl-item.enroute') || $('.tl-item');
    if (!target) { location.hash = '#timeline'; return; }
    const top = target.getBoundingClientRect().top + window.scrollY - Math.max(24, window.innerHeight * 0.18);
    window.scrollTo({ top, behavior: 'smooth' });
    history.replaceState(null, '', '#timeline');
  });
})();

/* ---------- Checklists (localStorage) ---------- */
function initChecklists(root = document) {
  $$('.checklist[data-list]', root).forEach((ul) => {
    if (ul.dataset.bound) return;
    ul.dataset.bound = '1';
    const key = `chuncheon60:${ul.dataset.list}`;
    let saved = [];
    try { saved = JSON.parse(localStorage.getItem(key) || '[]'); } catch {}
    const boxes = $$('input[type=checkbox]', ul);
    boxes.forEach((b, i) => { b.checked = !!saved[i]; });
    ul.addEventListener('change', () => {
      try { localStorage.setItem(key, JSON.stringify(boxes.map((b) => b.checked))); } catch {}
    });
  });
}
initChecklists();

/* ---------- 출발 타일: 자동차 튀어나오기 + 물들기 ---------- */
$$('.tile-depart').forEach((tile) => {
  tile.addEventListener('click', () => {
    tile.classList.toggle('tinted');
    tile.classList.remove('drive');
    void tile.offsetWidth; // 애니메이션 재시작
    tile.classList.add('drive');
    tile.addEventListener('animationend', () => tile.classList.remove('drive'), { once: true });
  });
});

/* ---------- Secret vault (PIN 0822) ---------- */
(function initVault() {
  const PIN = '0822';
  const UNLOCK_KEY = 'chuncheon60:unlocked';
  const vault = $('#vault'); if (!vault) return;
  const door = $('#vault-door');
  const content = $('#vault-content');
  const input = $('#pin-input');
  const dots = $$('#pin-dots i');
  const tpl = $('#secret-template');
  let value = '';
  let busy = false;
  let openTimer = null;

  const draw = () => dots.forEach((d, i) => d.classList.toggle('on', i < value.length));

  function mount() {
    if (content.dataset.mounted) return;
    content.appendChild(tpl.content.cloneNode(true));
    content.dataset.mounted = '1';
    initChecklists(content);
    const cake = $('#cake-actions', content);
    if (cake) cake.innerHTML = navButtons(PLACES.cake);
    $('#secret-lock', content)?.addEventListener('click', lock);
  }

  function open(animate) {
    mount();
    content.hidden = false;
    vault.classList.add('unlocked');
    if (animate) {
      vault.classList.add('opening');
      // 진입 연출: 문이 열리며 안쪽 콘텐츠가 순차적으로 떠오름
      $$('.secret-inner > *', content).forEach((el, i) => {
        el.style.setProperty('--i', i);
      });
      clearTimeout(openTimer);
      openTimer = setTimeout(() => { door.hidden = true; vault.classList.remove('opening'); }, 1400);
    } else {
      door.hidden = true;
    }
  }

  function lock() {
    clearTimeout(openTimer); openTimer = null;
    busy = false;
    try { sessionStorage.removeItem(UNLOCK_KEY); } catch {}
    vault.classList.remove('unlocked', 'opening', 'granted', 'denied');
    content.hidden = true;
    door.hidden = false;
    value = ''; input.value = ''; draw();
    vault.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function submit() {
    if (busy) return;
    busy = true;
    if (value === PIN) {
      try { sessionStorage.setItem(UNLOCK_KEY, '1'); } catch {}
      vault.classList.add('granted');
      if (navigator.vibrate) navigator.vibrate([30, 40, 30]);
      setTimeout(() => { open(true); busy = false; }, 650);
    } else {
      vault.classList.add('denied');
      if (navigator.vibrate) navigator.vibrate(120);
      toast('암호가 달라요');
      setTimeout(() => { vault.classList.remove('denied'); value = ''; input.value = ''; draw(); busy = false; }, 550);
    }
  }

  function setValue(v) {
    value = v.replace(/\D/g, '').slice(0, 4);
    input.value = value;
    draw();
    if (value.length === 4) setTimeout(submit, 120);
  }

  input.addEventListener('input', () => setValue(input.value));
  $('#pin-form').addEventListener('submit', (e) => { e.preventDefault(); if (value.length === 4) submit(); });
  $('#pin-pad').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-k]'); if (!b) return;
    const k = b.dataset.k;
    setValue(k === 'del' ? value.slice(0, -1) : value + k);
  });

  let unlocked = false;
  try { unlocked = sessionStorage.getItem(UNLOCK_KEY) === '1'; } catch {}
  if (unlocked) open(false);
})();

/* ---------- PWA: service worker + 설치 안내 모달 ---------- */
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

(function initInstallGuide() {
  const SEEN_KEY = 'chuncheon60:a2hsSeen';
  let deferred = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    reflect();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    try { localStorage.setItem(SEEN_KEY, '1'); } catch {}
    $('#a2hs')?.remove();
  });

  function reflect() {
    const box = $('#a2hs'); if (!box) return;
    const btn = $('#a2hs-install', box);
    if (btn && deferred) { btn.hidden = false; $('#a2hs-steps', box).hidden = true; $('#a2hs-manual', box).hidden = false; }
  }

  function doInstall() {
    if (!deferred) return;
    deferred.prompt();
    deferred.userChoice.then((r) => {
      if (r?.outcome === 'accepted') { try { localStorage.setItem(SEEN_KEY, '1'); } catch {} }
      deferred = null;
      $('#a2hs')?.remove();
    });
  }

  function show() {
    const standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
    if (standalone) return;

    const ua = navigator.userAgent;
    const inKakao = /KAKAOTALK/i.test(ua);
    const inApp = inKakao || /(NAVER\(inapp|DaumApps|Instagram|FBAN|FBAV|FB_IAB|Line\/)/i.test(ua);
    const forced = /[?&]a2hs=1(?:&|$)/.test(location.search);
    if (forced && history.replaceState) {
      try { history.replaceState(null, document.title, location.href.replace(/[?&]a2hs=1\b/, '').replace(/\?$/, '')); } catch {}
    }
    if (!inApp && !forced) {
      try { if (localStorage.getItem(SEEN_KEY) === '1') return; } catch {}
    }

    const isIOS = /iP(hone|ad|od)/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    let body;
    if (inKakao) {
      body = `
        <div class="a2hs-ic">🌐</div>
        <h3>브라우저에서 열어주세요</h3>
        <p class="a2hs-sub">카카오톡 안에서는 홈 화면에 추가할 수 없어요.<br/>아래 버튼을 누르면 사파리·크롬으로 열려요.</p>
        <button class="a2hs-btn" id="a2hs-open">사파리·크롬에서 열기</button>
        <p class="a2hs-note">버튼이 안 되면 오른쪽 아래 <b>⋯ 메뉴</b> → <b>'다른 브라우저로 열기'</b></p>
        <button class="a2hs-btn ghost" id="a2hs-close">나중에 할게요</button>`;
    } else if (inApp) {
      body = `
        <div class="a2hs-ic">🌐</div>
        <h3>브라우저에서 열어주세요</h3>
        <p class="a2hs-sub">앱 안의 브라우저라 홈 화면에 추가할 수 없어요.<br/>메뉴에서 <b>'다른 브라우저로 열기'</b>를 선택해 주세요.</p>
        <button class="a2hs-btn" id="a2hs-close">알겠어요</button>`;
    } else {
      const steps = isIOS
        ? ['<b>주소창</b> 옆 <b>공유 버튼</b> (⎙) 탭', '아래로 내려 <b>\'홈 화면에 추가\'</b> 선택', '오른쪽 위 <b>\'추가\'</b> 탭 — 끝!']
        : ['오른쪽 위 <b>⋮ 메뉴</b> 탭', '<b>\'홈 화면에 추가\'</b> 또는 <b>\'앱 설치\'</b> 선택', '<b>\'설치\'</b> 탭 — 끝!'];
      body = `
        <div class="a2hs-ic"><img src="icons/icon-192.png" alt="" width="64" height="64"/></div>
        <h3>앱으로 설치하기</h3>
        <p class="a2hs-sub">홈 화면에 추가하면 여행 당일<br/>앱처럼 바로 열 수 있어요.</p>
        <button class="a2hs-btn" id="a2hs-install" hidden>홈 화면에 추가</button>
        <p class="a2hs-note" id="a2hs-manual" hidden>버튼이 안 되면 아래 방법으로도 추가할 수 있어요</p>
        <ol class="a2hs-steps" id="a2hs-steps">${steps.map((t, i) => `<li><span class="n">${i + 1}</span><span>${t}</span></li>`).join('')}</ol>
        <p class="a2hs-note">앱 이름은 <b>환갑여행</b>으로 들어가요 🎂</p>
        <button class="a2hs-btn ghost" id="a2hs-close">알겠어요</button>`;
    }

    const bg = document.createElement('div');
    bg.className = 'a2hs-bg'; bg.id = 'a2hs';
    bg.innerHTML = `<div class="a2hs" role="dialog" aria-modal="true" aria-label="앱 설치 안내">${body}</div>`;
    document.body.appendChild(bg);
    requestAnimationFrame(() => bg.classList.add('show'));
    reflect();

    const close = () => {
      if (!inApp) { try { localStorage.setItem(SEEN_KEY, '1'); } catch {} }
      bg.classList.remove('show');
      setTimeout(() => bg.remove(), 350);
    };
    $('#a2hs-open', bg)?.addEventListener('click', () => {
      const base = location.href.split('#')[0];
      const ext = base + (base.includes('?') ? '&' : '?') + 'a2hs=1';
      location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(ext);
    });
    $('#a2hs-install', bg)?.addEventListener('click', doInstall);
    $('#a2hs-close', bg)?.addEventListener('click', close);
    bg.addEventListener('click', (e) => { if (e.target === bg) close(); });
  }

  window.addEventListener('load', () => setTimeout(show, 900));
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
let navIO = null;
function initNav() {
  if (navIO) navIO.disconnect();
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
  navIO = io;
}
initNav();

/* ---------- Boot ---------- */
renderTimeline();
renderAddresses();
renderCountdown();
updateTimeline();
loadWeather();
/* ---------- 시크릿 타임 테두리 (여행 당일 16:40–17:40, ?secret=1로 미리보기) ---------- */
function updateSecretTime() {
  const el = $('#secret-time'); if (!el) return;
  const now = nowKST();
  const m = now.getHours() * 60 + now.getMinutes();
  const forced = new URLSearchParams(location.search).get('secret') === '1';
  const on = forced || (ymd(now) === TRIP_DATE && m >= toMin('16:40') && m < toMin('17:40'));
  if (on && el.hidden) { el.hidden = false; el.classList.add('show'); }
  if (!on && !el.hidden) { el.hidden = true; el.classList.remove('show'); }
}
updateSecretTime();
setInterval(() => { updateTimeline(); renderPlan(); updateSecretTime(); }, 30 * 1000);
setInterval(renderCountdown, 1000);
setInterval(loadWeather, 10 * 60 * 1000);
