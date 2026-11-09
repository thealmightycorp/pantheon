/* PANTHEON 웹앱 — 홍석진 대표님 PANTHEON v0.1 화면 구조 그대로 + 판테온 DB(Supabase pt_ 표)
   2026-10-22 AX팀 김현우
   · 로그인 = 헤임달 계정 (같은 Supabase · 같은 주소라 헤임달에 로그인돼 있으면 그대로 들어옴)
   · 쓰는 사람 = 헤임달 승인 구성원 (DB 가 막음 — pt_can_use)
   · 누가·언제·무엇을 = DB 트리거가 pt_change 에 남김 (화면은 그 기록을 보여 주기만)
   · 질문·명함 인식 = pt_ask 에 넣으면 사무실 PC 궁니르 봇이 Claude 로 처리해 답을 씀 (키는 PC 에만)
   · 이번 범위 = 10/21 회의 지시(엔티티 DB·등록·명함·회사 연결·연락) — 모니터링·딜은 숨김 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// 판테온 지도에서 바로 들어오는 일회용 로그인 링크 (11-07 홍석진 대표님) — 화면 주소(#chart)와 로그인 정보(#access_token=…)가 「#chart#access_token=…」처럼 겹쳐 오면
// 로그인 정보만 주소에 남겨 supabase 가 읽게 하고, 화면은 로그인 뒤에 연다. 지도는 ?go=<화면> 으로 보내도 된다(이쪽이 확실함)
const HANDOFF = (() => {
  const q = new URLSearchParams(location.search), h = location.hash || '';
  let go = q.get('go') || '';
  const m = h.match(/^#([^#=&]*)[#&]((?:.*&)?(?:access_token|error|error_code)=.*)$/);
  if (m) { go = go || m[1]; try { history.replaceState(null, '', location.pathname + location.search + '#' + m[2]); } catch {} }
  const on = q.has('go') || !!m;
  if (q.has('go')) { q.delete('go'); const s = q.toString(); try { history.replaceState(null, '', location.pathname + (s ? '?' + s : '') + location.hash); } catch {} }
  return {on, go: go.replace(/[^\w\-/]/g, '')};
})();
// 비밀번호 재설정 메일 링크로 들어왔는지 — supabase 가 주소를 읽어 지우기 전에 본다 (헤임달과 같은 방식)
let RECOVERY = /type=recovery/.test(location.hash || '');
// 이미 쓴·만료된 메일 링크로 들어오면 주소에 error_code 만 붙어 온다 — 아무 안내 없이 로그인 화면만 뜨던 것 (11-03 정원하 대표님이 오전 메일 링크를 다시 누르심)
// 슬랙 로그인에서 돌아왔는데 오류가 붙어 있으면 슬랙 안내 (11-04) — 우리 워크스페이스가 아니면 가입 트리거가 막아 「Database error saving new user」
const AUTH_Q = decodeURIComponent((location.hash || '') + (location.search || '')).replace(/\+/g, ' ');
const SLACK_ERR = sessionStorage.getItem('pt_slack') && /error/.test(AUTH_Q) ? (/saving new user/i.test(AUTH_Q) ? '더올마이티 슬랙 계정으로만 로그인할 수 있습니다. 회사 슬랙 계정으로 다시 시도해 주세요.' : /access_denied/.test(AUTH_Q) ? '슬랙 로그인을 취소했습니다.' : '슬랙으로 로그인하지 못했습니다. 잠시 후 다시 시도해 주세요.') : '';
if (SLACK_ERR) { sessionStorage.removeItem('pt_slack'); try { history.replaceState(null, '', location.pathname); } catch {} }
const LINK_ERR = !SLACK_ERR && /error_code=|error=access_denied/.test(location.hash || '') ? (HANDOFF.on ? '이미 사용했거나 만료된 로그인 링크입니다. 판테온 지도에서 다시 눌러 주세요.' : '이미 사용했거나 만료된 링크입니다. 로그인 화면의 「처음이거나 비밀번호를 잊었어요」에서 다시 요청하고, 가장 최근에 받은 메일의 링크를 클릭해 주세요.') : '';
if (LINK_ERR) try { history.replaceState(null, '', location.pathname); } catch {}
const SB = createClient('https://dwoiobqucmikbtikfjwk.supabase.co', 'sb_publishable_K6BW26u2jRkTBDwuMqaaFA_3HkfnOc9');
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const icons = {review:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="m8 9 1.5 1.5L12 8 M8 15l1.5 1.5L12 14 M14 9.5h3 M14 15.5h3"/>',chart:'<path d="M4 20V10 M10 20V4 M16 20v-7 M22 20H2"/>',studio:'<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/><path d="M10 13h6M10 17h4"/>',home:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',entities:'<path d="M12 3 3 8l9 5 9-5-9-5Z M3 12l9 5 9-5 M3 16l9 5 9-5"/>',contacts:'<rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="9" r="2.5"/><path d="M8 17c0-4 8-4 8 0 M2 7h3 M2 12h3 M2 17h3"/>',admin:'<path d="m10 3-1 3-3 1-3 3 2 2-1 4 3 3 3-1 2 3 4-1 1-3 3-1 1-4-3-2 1-3-3-3-3 1Z"/><circle cx="12" cy="12" r="3"/>',search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',bell:'<path d="M5 16h14l-2-3V8a5 5 0 0 0-10 0v5l-2 3Z M10 20h4"/>',plus:'<path d="M12 5v14 M5 12h14"/>',upload:'<path d="M12 16V4 m-5 5 5-5 5 5 M4 15v5h16v-5"/>',download:'<path d="M12 3v12 m-5-5 5 5 5-5 M4 16v5h16v-5"/>',arrow:'<path d="M4 12h16 m-5-5 5 5-5 5"/>',up:'<path d="m3 16 7-7 4 4 7-9 M15 4h6v6"/>',warning:'<path d="M12 3 2 21h20L12 3Z M12 9v5 M12 17v.2"/>',close:'<path d="m6 6 12 12 M6 18 18 6"/>',side:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M14 4v16"/>',big:'<path d="M4 9V4h5 M20 9V4h-5 M4 15v5h5 M20 15v5h-5"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',image:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m3 18 5-5 4 4 3-3 6 6"/>',link:'<path d="m9 15 6-6 M7 14l-2 2a3 3 0 0 0 4 4l4-4 M11 8l4-4a3 3 0 0 1 4 4l-2 2"/>'};
icons.manual = '<path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5 M8 7h7 M8 11h7"/>';
icons.graph = '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="8" r="2.5"/><circle cx="9" cy="18" r="2.5"/><path d="M8.3 7.2 15.6 7.6 M7 8.4l1.4 7.2 M16.6 10.2l-5.8 6.2"/>';
const icon = n => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[n]||icons.entities}</svg>`;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const TYPES = ['회사','브랜드','IP·유명인','기관','미디어·매체','미디어·OTT','판매 채널'];
const COLOR = {'회사':'gray','브랜드':'','기관':'purple','IP·유명인':'yellow','미디어·매체':'purple','미디어·OTT':'purple','판매 채널':'gray','거래처 담당자':''};
const PUBLIC_MAIL = new Set(['gmail.com','naver.com','daum.net','hanmail.net','kakao.com','nate.com','outlook.com','hotmail.com','icloud.com','yahoo.com']);
const today = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
const kst = iso => { try { return new Date(iso).toLocaleString('ko-KR', {timeZone:'Asia/Seoul', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false}) + ' KST'; } catch { return iso || ''; } };
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random()).replace(/-/g, '');

/* ---------- 상태 ---------- */
let me = null, myName = '', isAdmin = false;
let all = [];
let page = 'home', filter = '전체', query = '', activeDetail = null, lastAnswer = '';
// 한 원본에서 두 앱을 만든다 (11-01 · 이그드라실 PRD 10.4 궁니르 분리): ygg = 이그드라실(관계·엔티티·소싱) · gungnir = 제안서 스튜디오
// build_web.py 가 <html data-app> 을 정한다. 이그드라실의 #studio 주소는 궁니르로 안내한다(슬랙에 붙인 링크 보호, 최소 1개월)
const APP = document.documentElement.dataset.app === 'gungnir' ? 'gungnir' : 'ygg';
const BRAND = APP === 'gungnir' ? 'GUNGNIR' : 'YGGDRASIL';
const GUNGNIR_URL = 'https://thealmightycorp.github.io/pantheon/gungnir/', YGG_URL = 'https://thealmightycorp.github.io/pantheon/';
// 11-02 홍석진 대표님: 이그드라실은 엔티티 DB 축적·관리만 · 콜라보 점수·IP 차트(소싱)는 궁니르에서
const menus = APP === 'gungnir' ? [['studio','제안서 스튜디오'],['chart','소싱 · IP 차트'],['manual','사용 매뉴얼']]
  : [['home','대시보드'],['contacts','주소록'],['cards','명함 올리기'],['entities','엔티티'],['graph','관계 그래프'],['review','확인 대기'],['admin','DB 관리'],['manual','사용 매뉴얼']];
const navMenus = () => menus.filter(m => (m[0] !== 'admin' || isAdmin) && (m[0] !== 'studio' || studioCan) && (m[0] !== 'chart' || ipcCan));
const byId = id => all.find(e => e.id === id);
const isContact = e => e.type === '거래처 담당자';
const entities = () => all.filter(e => !isContact(e)), contacts = () => all.filter(isContact);
const contactsOf = e => all.filter(x => isContact(x) && x.parentId === e.id);
// 운영 브랜드 · 소속 IP·매체 (2026-10-26) — 브랜드·IP·매체의 소속 회사 = parent_id (거래처 담당자와 같은 연결)
const kidsOf = e => all.filter(x => !isContact(x) && x.parentId === e.id);
const HOLDERS = ['회사', '기관'];
const KID_TYPES = ['브랜드', 'IP·유명인', '미디어·매체', '미디어·OTT', '판매 채널'];
// 상태 용어·숫자는 여기 하나로 센다 (10-31 대표님 UX 리뷰 ⑤) — 기관·IP·유명인은 거래처 담당자가 없는 것이 보통이라 「담당자 없음」에서 뺀다
const needsContact = e => !['기관', 'IP·유명인'].includes(e.type);
const noContact = e => needsContact(e) && !contactsOf(e).length;
const PILL_NOREL = '<span class="pill warn">근거 없음</span>', PILL_NOC = '<span class="pill muted">담당자 없음</span>';
const ymd = iso => { try { return new Date(iso).toLocaleDateString('ko-KR', {timeZone: 'Asia/Seoul'}); } catch { return ''; } };
const isPhone = () => matchMedia('(max-width:600px)').matches;
const kidsText = ks => !ks.length ? '' : ks.every(k => k.type === '브랜드') ? `브랜드 ${ks.length}개` : `연결 엔티티 ${ks.length}개`;

function fromRow(r) {
  const en = r.en || '';
  const w = en.split(/[\s\-:&]+/).filter(Boolean);
  return {id:r.id, type:r.kind, name:r.name, en, aliases:r.aliases||[], parentId:r.parent_id, agencyText:r.agency||'',
    role:r.role||'', rel:r.rel||'', points:r.points||[], facts:r.facts||[], note:r.note, sides:r.sides||[], owners:r.owners||[],
    img:r.img||'', cardImg:r.card_img||'', createdBy:r.created_by||'', first:r.first_seen||'', last:r.last_seen||'', hidden:!!r.hidden, updated:r.updated_at||'',
    pipeline:r.pipeline||'', contactDepth:r.contact_depth||null, depthEvent:r.depth_event||null, ownedIp:!!r.owned_ip, relOwner:r.rel_owner||null,
    color:COLOR[r.kind]||'', initial: en ? (w.length === 1 ? w[0].slice(0,3) : w.slice(0,3).map(x => x[0]).join('')).toUpperCase() : r.name.slice(0,1)};
}
// 등록한 직원 (10-28 홍석진 대표님 요청) — 누가 연락처·관계를 갖고 있는지. 웹·슬랙으로 등록한 사람
const registrar = e => (e.createdBy && (MEMBERS || []).find(m => m.id === e.createdBy)?.name) || '';
const agencyOf = e => (e.parentId && byId(e.parentId)?.name) || e.agencyText || '';
const toRow = p => {           // 화면 칸 → DB 칸 (보낸 것만)
  const m = {name:'name', en:'en', type:'kind', aliases:'aliases', parentId:'parent_id', agencyText:'agency', role:'role', rel:'rel',
             points:'points', facts:'facts', note:'note', sides:'sides', owners:'owners', img:'img', cardImg:'card_img', first:'first_seen', last:'last_seen'};
  const o = {}; for (const [k, v] of Object.entries(p)) if (m[k]) o[m[k]] = v; return o;
};

// 알림 — undo 를 주면 「되돌리기」 단추가 붙고 8초 동안 보인다. 창(dialog) 위에도 보이게 popover 로 띄운다
function toast(s, undo) {
  const t = $('#toast'); t.textContent = '';
  const sp = document.createElement('span'); sp.textContent = s; t.appendChild(sp);
  if (undo) { const b = document.createElement('button'); b.type = 'button'; b.className = 'toast-undo'; b.textContent = undo.label || '실행 취소';
    b.onclick = async () => { b.disabled = true; t.classList.remove('visible'); clearTimeout(window.tt); try { await undo.fn(); } catch (e) { toast('실행 취소하지 못했습니다: ' + (e?.message || '')); } }; t.appendChild(b); }
  t.classList.toggle('has-undo', !!undo);
  try { if (!t.hasAttribute('popover')) t.setAttribute('popover', 'manual'); t.hidePopover?.(); t.showPopover?.(); } catch {}
  t.classList.add('visible'); clearTimeout(window.tt);
  window.tt = setTimeout(() => { t.classList.remove('visible'); setTimeout(() => { try { if (!t.classList.contains('visible')) t.hidePopover?.(); } catch {} }, 300); }, undo ? 8000 : 2800);
}
// 확인 창 — 단추에 실제 행동을 적는다(「확인」 금지). 돌려주는 값: true(ok) · false(cancel 단추) · null(Esc·바깥)
function confirmBox({title, body = '', ok, cancel = '취소', danger = false}) {
  return new Promise(res => {
    let d = $('#ask'); if (!d) { d = document.createElement('dialog'); d.id = 'ask'; d.className = 'ask'; document.body.appendChild(d); }
    d.innerHTML = `<h2>${esc(title)}</h2>${body ? `<p>${body}</p>` : ''}<div class="modal-actions"><button class="button" type="button" data-a="0">${esc(cancel)}</button><button class="button ${danger ? 'danger' : 'primary'}" type="button" data-a="1">${esc(ok)}</button></div>`;
    const end = v => { d.close(); res(v); };
    d.querySelector('[data-a="0"]').onclick = () => end(false); d.querySelector('[data-a="1"]').onclick = () => end(true);
    d.oncancel = ev => { ev.preventDefault(); end(null); };
    d.showModal(); d.querySelector('[data-a="1"]').focus();
  });
}
// 작성 중인 내용이 있으면 닫기 전에 묻는다 — 「계속 작성」이 기본, 「닫기」를 골라야 닫힌다
const askLeave = () => confirmBox({title: '작성 중인 내용이 있습니다', body: '저장하지 않고 닫으면 입력한 내용이 사라집니다.', ok: '계속 작성', cancel: '저장하지 않고 닫기'}).then(v => v === false);

/* ---------- 이미지 (비공개 저장소 → 잠깐 쓰는 주소) ---------- */
const imgUrl = {}, imgLoading = new Set();
function imgSrc(path) {
  if (!path) return '';
  if (path.startsWith('data:') || path.startsWith('blob:')) return path;
  if (imgUrl[path]) return imgUrl[path];
  if (!imgLoading.has(path)) {
    imgLoading.add(path);
    SB.storage.from('pt-files').createSignedUrl(path, 3600).then(({data}) => {
      if (data?.signedUrl) { imgUrl[path] = data.signedUrl; rerender(); }
    });
  }
  return '';
}
let rr; function rerender() { clearTimeout(rr); rr = setTimeout(() => { if (!$('#modal').open) render(); if (activeDetail && !$('#modal').open && !$('#drawer').hidden) openDetail(activeDetail, true); }, 150); }
function resize(file, longest, quality = .85, square = false) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => {
      let sx = 0, sy = 0, sw = im.width, sh = im.height;
      if (square) { const s = Math.min(sw, sh); sx = (sw - s) / 2; sy = (sh - s) / 2; sw = sh = s; }
      const k = Math.min(1, longest / Math.max(sw, sh)), c = document.createElement('canvas');
      c.width = Math.round(sw * k); c.height = Math.round(sh * k);
      c.getContext('2d').drawImage(im, sx, sy, sw, sh, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob(b => b ? res({blob: b, url: URL.createObjectURL(b)}) : rej(), 'image/jpeg', quality);
    };
    im.onerror = () => { URL.revokeObjectURL(url); rej(); };
    im.src = url;
  });
}
async function upload(blob, folder) {
  const path = `${folder}/${today()}/${uid()}.jpg`;
  const { error } = await SB.storage.from('pt-files').upload(path, blob, {contentType: 'image/jpeg', upsert: false});
  if (error) throw error;
  return path;
}

/* ---------- 저장 (DB 가 누가·언제를 채우고 기록을 남김) ---------- */
async function save(id, patch, isNew = false) {
  const row = toRow(patch);
  const q = isNew ? SB.from('pt_entity').insert({id, ...row}).select().single()
                  : SB.from('pt_entity').update(row).eq('id', id).select().single();
  const { data, error } = await q;
  if (error) { toast(/permission|row-level|policy/i.test(error.message) ? '저장할 권한이 없습니다. 헤임달 승인이 필요합니다.' : '저장하지 못했습니다: ' + error.message); return null; }
  const e = fromRow(data), i = all.findIndex(x => x.id === id);
  if (i >= 0) all[i] = e; else all.push(e);
  if (isContact(e) && APP === 'ygg') loadRel().then(rerender).catch(() => {});     // 사람 표·소속·명함은 DB 트리거가 따라 바꿈
  return e;
}
async function load() {
  const [{ data, error }] = await Promise.all([SB.from('pt_entity').select('*').order('name').limit(5000), loadMembers(), loadRel().catch(() => {}), APP === 'ygg' ? loadAcc().catch(() => {}) : null]);
  if (error) throw error;
  all = data.map(fromRow);
}

/* ---------- 화면 조각 ---------- */
const avatar = e => { const s = imgSrc(e.img); return `<span class="entity-avatar ${s ? 'has-img' : e.color || ''}">${s ? `<img src="${s}" alt="">` : esc(e.initial)}</span>`; };
function entityCard(e) { const c = contactsOf(e).length; return `<article class="entity-card" data-detail="${e.id}" tabindex="0" role="button" aria-label="${esc(e.name)} 상세 보기"><div class="entity-top">${avatar(e)}<div><b>${esc(e.name)}</b><small>${esc(e.en || agencyOf(e))}</small></div></div><span class="entity-category">${esc(e.type)}</span>${e.parentId && byId(e.parentId) ? ` <span class="entity-category">${esc(byId(e.parentId).name)}</span>` : ''}${e.hidden ? ' <span class="entity-category">숨김</span>' : ''}${e.rel ? `<p class="entity-rel">${esc(e.rel)}</p>` : `<p class="entity-rel none">${PILL_NOREL}</p>`}<div class="card-bottom"><span>${[c ? '담당자 ' + c + '명' : noContact(e) ? '담당자 없음' : '', kidsText(kidsOf(e)), registrar(e) && '등록 ' + registrar(e)].filter(Boolean).join(' · ')}</span><span>상세 보기 ↗</span></div></article>`; }
function stats() { const es = entities(), cs = contacts(); return `<div class="stats"><div class="stat" data-stat="전체" role="button" tabindex="0" aria-label="엔티티 전체 보기"><div class="stat-label">${icon('entities')} 등록 엔티티</div><div class="stat-value">${es.length}<small>개</small></div><div class="stat-bottom"><span class="positive">이그드라실</span> · 전 직원 공유</div></div><div class="stat" data-stat="contacts" role="button" tabindex="0" aria-label="연락처 보기"><div class="stat-label">${icon('contacts')} 거래처 담당자</div><div class="stat-value">${cs.length}<small>명</small></div><div class="stat-bottom">회사별로 연결해 관리</div></div><div class="stat" data-stat="IP·유명인" role="button" tabindex="0" aria-label="IP·유명인 보기"><div class="stat-label">${icon('up')} IP·유명인</div><div class="stat-value">${es.filter(e => e.type === 'IP·유명인').length}<small>명</small></div><div class="stat-bottom">계약·협업 중인 인물</div></div><div class="stat highlight" data-stat="담당자 연결" role="button" tabindex="0" aria-label="담당자 연결 회사 보기"><div class="stat-label">${icon('link')} 담당자 연결 회사</div><div class="stat-value">${es.filter(e => contactsOf(e).length).length}<small>곳</small></div><div class="stat-bottom">거래처 담당자가 등록된 회사</div></div></div>`; }
const EXAMPLES = ['골포스트가 협업한 리그·매체는 어디인가요?', '사운드스루 제작지원 브랜드 목록', '브이티코스메틱 담당자는 누구인가요?', '포켓몬과 현재 진행 중인 건이 있나요?'];
function askPanel() { return `<section class="panel ask-panel"><div class="panel-head"><div><div class="panel-title">무엇이든 물어보세요 <small>ASK YGGDRASIL</small></div><p class="panel-caption">이그드라실 DB를 검색해 Claude가 답변합니다. 슬랙 이그드라실 봇에서도 같은 답변을 받을 수 있습니다.</p></div></div><div class="ask-body"><div class="ask-row"><input id="ask-input" type="search" autocomplete="off" placeholder="예: 게티이미지 담당자는 누구인가요?"><button class="button primary" id="ask-btn" type="button">질문하기</button></div><div class="ask-examples">${EXAMPLES.map(x => `<button type="button" data-ask="${esc(x)}">${esc(x)}</button>`).join('')}</div><div class="ask-answer" id="ask-answer" ${lastAnswer ? '' : 'hidden'}>${lastAnswer}</div></div></section>`; }
function alerts() { const es = entities(); const noC = es.filter(noContact).length, nr = es.filter(e => !e.rel).length, ip = es.filter(e => e.type === 'IP·유명인').length; return `<div class="side-stack"><section class="panel"><div class="panel-head"><div class="panel-title">확인이 필요한 항목</div><span class="alert-count">4건</span></div><div class="alert-list"><button class="alert-row" data-page-go="review"><span class="alert-symbol">${icon('review')}</span><span class="alert-text">확인 대기<small>${reviewCount()}건 · 시스템이 찾은 후보</small></span></button><button class="alert-row" data-state-go="장기 미접촉"><span class="alert-symbol red">${icon('clock')}</span><span class="alert-text">장기 미접촉<small>${es.filter(stale).length}곳 · 미팅 단계 이상 거래처 중 ${STALE_DAYS}일 넘게 접촉 없음</small></span></button><button class="alert-row" data-state-go="담당자 없음"><span class="alert-symbol green">${icon('link')}</span><span class="alert-text">담당자 없음<small>${noC}곳 · 명함을 등록하면 연결됩니다</small></span></button><button class="alert-row" data-state-go="근거 없음"><span class="alert-symbol red">${icon('warning')}</span><span class="alert-text">관계 근거 없음<small>${nr}개 · 내부 담당자 확인이 필요합니다</small></span></button></div></section><section class="panel"><div class="alert-list"><button class="alert-row" data-filter-go="IP·유명인"><span class="alert-symbol">${icon('up')}</span><span class="alert-text">활용 가능한 IP·유명인<small>${ip}명 · 엔티티 DB에서 보기</small></span></button></div></section></div>`; }
const STATES = ['전체', '담당자 있음', '담당자 없음', '근거 없음', '장기 미접촉'];
let entState = '전체', entSort = {k: 'name', d: 1}, entView = 'table';
try { entView = localStorage.getItem('pt-ent-view') || 'table'; } catch {}
function filters() { const types = TYPES.filter(t => entities().some(e => e.type === t)); return `<div class="filter-rows"><div class="tabs" role="group" aria-label="유형"><span class="filter-label">유형</span>${['전체', ...types].map(t => `<button class="tab ${filter === t ? 'active' : ''}" data-filter="${t}">${t}</button>`).join('')}</div><div class="tabs" role="group" aria-label="상태"><span class="filter-label">상태</span>${STATES.map(t => `<button class="tab ${entState === t ? 'active' : ''}" data-state="${t}">${t}</button>`).join('')}</div></div>`; }
const sideOf = e => e.sides.join(' · ');
function entSorted(arr) { const {k, d} = entSort, v = e => k === 'type' ? e.type : k === 'side' ? sideOf(e) : k === 'contacts' ? contactsOf(e).length : k === 'updated' ? e.updated : e.name; return arr.slice().sort((a, b) => { const x = v(a), y = v(b); return (typeof x === 'number' ? x - y : String(x).localeCompare(String(y), 'ko')) * d || a.name.localeCompare(b.name, 'ko'); }); }
function entityTable(arr) {
  const th = (k, t) => `<th aria-sort="${entSort.k === k ? (entSort.d > 0 ? 'ascending' : 'descending') : 'none'}"><button type="button" class="th-sort" data-sort="${k}">${t}${entSort.k === k ? (entSort.d > 0 ? ' ▲' : ' ▼') : ''}</button></th>`;
  return `<div class="table-wrap"><table class="et"><thead><tr>${th('name', '이름')}${th('type', '유형')}${th('side', '관련 계열사')}<th>관계 근거</th><th>관계</th>${th('contacts', '담당자')}${th('updated', '최근 수정')}</tr></thead><tbody>${entSorted(arr).map(e => { const c = contactsOf(e).length; return `<tr class="clickable" data-detail="${e.id}" tabindex="0"><td><span class="et-name">${avatar(e)}<span><b>${esc(e.name)}</b>${e.en && e.en !== e.name ? `<small>${esc(e.en)}</small>` : ''}</span></span></td><td><span class="pill">${esc(e.type)}</span>${e.hidden ? ' <span class="pill muted">숨김</span>' : ''}</td><td>${esc(sideOf(e) || '—')}</td><td class="et-rel">${e.rel ? esc(e.rel) : PILL_NOREL}</td><td>${e.pipeline ? stagePill(e.pipeline) : ''}${rel.state[e.id] ? `<small class="et-score">${rel.state[e.id].rel_score}점 · ${dotDate(rel.state[e.id].last_touch)}</small>` : e.pipeline ? '' : '—'}</td><td>${c ? c + '명' : noContact(e) ? PILL_NOC : '—'}</td><td>${e.updated ? esc(ymd(e.updated)) : '—'}</td></tr>`; }).join('')}</tbody></table></div>`;
}
// 목록 안 검색 (②) — 입력하면 바로 거르고, 걸려 있으면 칩으로 알리고, 0건이면 지우기·등록 단추
const localForm = ph => `<form class="table-tools local-form" id="local-form" role="search"><input class="local-search" id="local-q" type="search" placeholder="${ph} 검색" value="${esc(query)}" aria-label="이 목록에서 검색" autocomplete="off"></form>${query.trim() ? `<div class="q-chip">「${esc(query.trim())}」 검색 중 <button type="button" class="q-clear" aria-label="검색 해제">✕ 해제</button></div>` : ''}`;
const noHits = (what, add) => `<div class="empty"><p><b>${query.trim() ? `「${esc(query.trim())}」에 맞는 ${what}가 없습니다.` : `조건에 맞는 ${what}가 없습니다.`}</b></p><p>${query.trim() ? '<button class="button q-clear" type="button">검색어 삭제</button> ' : ''}<button class="button primary" type="button" data-add>${add}</button></p></div>`;
const hay = e => [e.name, e.en, registrar(e), agencyOf(e), e.role, e.rel, e.note, ...e.aliases, ...e.sides, ...e.owners, ...e.facts, ...e.points, ...kidsOf(e).flatMap(k => [k.name, k.en, ...k.aliases])].join(' ').toLowerCase();
const LINKED = '담당자 연결';   // 오버뷰 「담당자 연결 회사」 — 거래처 담당자가 연결된 회사만
const stateOk = e => entState === '전체' || (entState === '담당자 있음' ? contactsOf(e).length > 0 : entState === '담당자 없음' ? noContact(e) : entState === '장기 미접촉' ? stale(e) : !e.rel);
const match = e => (filter === '전체' || e.type === filter) && stateOk(e) && hay(e).includes(query.trim().toLowerCase());
// 주소록 (PRD R-09) — 사람 단위로 현 소속 · 휴대폰 · 이메일 · 회사 관계 단계 · 마지막 접촉 · 담당 직원 (칸은 pt_directory)
function contactTable(arr) {
  const cell = (v, link) => v ? `${esc(v)} ${link}` : '—';
  return `<div class="table-wrap"><table class="ct"><thead><tr><th>이름</th><th>현 소속</th><th>직함</th><th>휴대폰</th><th>이메일</th><th>관계 단계</th><th>마지막 접촉</th><th>담당 직원</th></tr></thead><tbody>${arr.map(c => { const d = rel.dir[c.id] || {}, mob = d.mobile || '', mail = d.email || (c.points.find(p => /@/.test(p)) || ''), lk = !d.can_see && d.n_channels ? '<span class="lock-cell" title="열람 승인 후 볼 수 있습니다">🔒</span>' : '—'; return `<tr class="clickable" data-detail="${c.id}" tabindex="0"><td data-label="이름"><b>${esc(c.name)}</b>${d.has_card ? ' <span class="pill muted" title="명함 있음">명함</span>' : ''}</td><td data-label="현 소속">${c.parentId ? `<button type="button" class="pill good ref-pill" data-open-ent="${c.parentId}">${esc(agencyOf(c))}</button>` : esc(c.agencyText || '회사 미연결')}</td><td data-label="직함">${esc(c.role || '—')}</td><td data-label="휴대폰">${mob ? cell(mob, contactLink(mob)) : lk}</td><td data-label="이메일">${mail ? cell(mail, contactLink(mail)) : lk}</td><td data-label="관계 단계">${d.pipeline ? stagePill(d.pipeline) : '—'}</td><td data-label="마지막 접촉">${d.last_touch ? touchText(d.last_touch) : '—'}</td><td data-label="담당 직원">${esc(c.owners[0] || registrar(c) || '—')}</td></tr>`; }).join('') || `<tr><td colspan="8"><div class="empty">${NOT_FOUND}</div></td></tr>`}</tbody></table></div>`;
}

// 통합 검색 (10-26) — 어느 메뉴에서든 엔티티·거래처 담당자 전체에서 찾는다. Enter: 하나면 바로 상세
const NOT_FOUND = '등록되지 않은 정보입니다. 다시 한 번 확인해 주세요.';
let backPage = 'home';
const searchHits = q => { const t = q.trim().toLowerCase(); return t ? all.filter(e => hay(e).includes(t)) : []; };
function searchView() {
  const hits = searchHits(query), es = hits.filter(e => !isContact(e)), cs = hits.filter(isContact);
  if (!hits.length) return `<section class="panel"><div class="empty"><p><b>${NOT_FOUND}</b></p><p>이름·영문 이름·별칭·브랜드명·연락처로 검색할 수 있습니다.</p></div></section>`;
  return (es.length ? `<section class="panel"><div class="panel-head"><div class="panel-title">엔티티 <small>${es.length}건</small></div></div><div class="entity-grid">${es.map(entityCard).join('')}</div></section>` : '')
       + (cs.length ? `<section class="panel" style="margin-top:16px"><div class="panel-head"><div class="panel-title">거래처 담당자 <small>${cs.length}명</small></div></div>${contactTable(cs)}</section>` : '');
}
function render() {
  if (APP === 'ygg' && page === 'studio') { if (studioCan) return location.replace(GUNGNIR_URL + location.hash); page = 'moved'; }
  if (APP === 'ygg' && page === 'chart') { if (ipcCan) return location.replace(GUNGNIR_URL + location.hash); page = 'home'; }
  if (page !== 'search' && page !== 'moved' && !navMenus().some(m => m[0] === page)) page = APP === 'gungnir' ? (navMenus()[0]?.[0] || 'studio') : 'home';
  $('#nav').innerHTML = navMenus().map(([key, title]) => `<a class="nav-item ${page === key ? 'active' : ''}" href="#${key}" data-page="${key}"${page === key ? ' aria-current="page"' : ''}>${icon(key)}<span>${title}</span>${key === 'contacts' ? `<span class="nav-count">${contacts().length}</span>` : key === 'review' && reviewCount() ? `<span class="nav-count">${reviewCount()}</span>` : ''}</a>`).join('')
    + (APP === 'ygg' ? (studioCan || ipcCan ? `<a class="nav-item nav-app" href="${GUNGNIR_URL}${studioCan ? '' : '#chart'}" title="궁니르 · 제안서·소싱으로 이동">${icon('studio')}<span>궁니르</span><i aria-hidden="true">↗</i></a>` : '')
      : `<a class="nav-item nav-app" href="${YGG_URL}" title="이그드라실로 이동">${icon('entities')}<span>이그드라실</span><i aria-hidden="true">↗</i></a>`);
  const title = {home:['대시보드','거래처·IP·담당자와의 관계를 한곳에서 확인하세요.'], entities:['엔티티','더올마이티·골포스트·사운드스루의 거래처·브랜드·기관·IP 목록입니다.'], contacts:['주소록','거래처 담당자를 사람 단위로 찾습니다. 연락처는 직접 올린 분과 승인권자가 보고, 다른 분은 열람 요청으로 볼 수 있습니다.'], cards:['명함 올리기','받은 명함을 여러 장 한 번에 올리고, 한 장씩 보며 어디서 만났는지 메모를 남깁니다.'], chart:['소싱 · IP 차트','인기 상승 IP 순위와 IP 스코어, 조합 시뮬레이션을 확인합니다. IP 차트는 하루 4회 갱신됩니다.'], graph:['관계 그래프','회사·IP·담당자 간 연결 관계를 그래프로 확인합니다. 항목을 클릭하면 연결된 대상이 강조됩니다.'], manual:['사용 매뉴얼', APP === 'gungnir' ? '궁니르 화면별 사용법과 자주 묻는 질문을 정리했습니다. 궁금한 것은 「매뉴얼에 물어보기」에 질문하세요.' : '이그드라실 화면별 사용법과 자주 묻는 질문을 정리했습니다. 궁금한 것은 「매뉴얼에 물어보기」에 질문하세요.'], review:['확인 대기','시스템이 찾은 후보를 확인해 반영합니다.'], moved:['제안서 스튜디오','제안서 스튜디오가 궁니르로 이전되었습니다.'], studio:['제안서 스튜디오','IP를 입력하면 리서치·제안서·이미지는 궁니르 봇이 진행하고, 담당자는 결정 단계에서만 확인합니다.'], search:['검색 결과', `「${query.trim()}」 검색 결과 ${searchHits(query).length}건입니다. 결과가 하나이면 Enter 키로 상세 화면을 바로 열 수 있습니다.`], admin:['DB 관리','누가 언제 무엇을 수정했는지 확인하고, 필요하면 이전 내용으로 복원할 수 있습니다.']}[page];
  $('#crumb').textContent = page === 'search' ? '검색 결과' : title[0];
  $('#page-title').innerHTML = title[0] + '<span class="title-dot">.</span>';
  document.title = title[0] + ' · ' + BRAND;
  $('#page-subtitle').textContent = title[1];
  $('#export-btn').innerHTML = icon('download') + '내보내기';
  $('#add-btn').innerHTML = icon('plus') + (page === 'contacts' ? '연락처 등록' : page === 'studio' ? (studio.tab === 'refs' ? '레퍼런스 등록' : '새 프로젝트') : '엔티티 등록');
  $('#export-btn').hidden = !isAdmin || !['entities', 'contacts'].includes(page);   // 내보내기는 DB 관리자만 · 기록 남김 (PRD 8.1)
  $('#add-btn').hidden = !['home', 'entities', 'contacts', 'studio'].includes(page) || (page === 'studio' && studio.tab === 'ref-new');
  if (APP === 'gungnir') { let b = $('#demo-btn'); if (!b) { b = document.createElement('button'); b.className = 'button'; b.id = 'demo-btn'; b.type = 'button'; b.onclick = tourStart; $('#add-btn').before(b); } b.textContent = '▶ 시연 모드'; b.hidden = !studioCan || !['studio', 'chart', 'manual'].includes(page); }   // 기능 소개 (11-04 온보딩)
  let html = '';
  if (page === 'moved') { const to = GUNGNIR_URL + location.hash; html = `<section class="panel"><div class="empty"><p><b>제안서 스튜디오는 궁니르로 이전되었습니다.</b></p><p>프로젝트·이미지·레퍼런스는 그대로 유지되며, 같은 헤임달 계정으로 로그인할 수 있습니다.</p><p><a class="button primary" href="${esc(to)}">궁니르에서 열기</a></p></div></section>`; }
  if (page === 'review') html = reviewView();
  if (page === 'cards') html = cardsView();
  if (page === 'graph') html = graphView();
  if (page === 'manual') html = manualView();
  if (page === 'home') html = stats() + `<div class="main-grid">${askPanel()}${alerts()}</div>`;
  if (page === 'entities') { const arr = entities().filter(match), cards = entView === 'card' || isPhone(); html = `<div class="notice">엔티티 ${entities().length}개가 등록되어 있습니다. 등록·수정한 내용은 전 직원에게 공유되며 변경 이력이 기록됩니다.</div><section class="panel"><div class="panel-head"><div class="panel-title">엔티티 목록 <small>${arr.length}개</small></div><div class="view-toggle" role="group" aria-label="보기 방식"><button type="button" class="segment ${cards ? '' : 'active'}" data-view="table" aria-pressed="${!cards}">표</button><button type="button" class="segment ${cards ? 'active' : ''}" data-view="card" aria-pressed="${cards}">카드</button></div></div><div class="watch-toolbar">${filters()}</div>${localForm('이름·영문 이름·별칭·브랜드명')}${arr.length ? (cards ? `<div class="entity-grid">${entSorted(arr).map(entityCard).join('')}</div>` : entityTable(arr)) : noHits('엔티티', '엔티티 등록')}</section>`; }
  if (page === 'contacts') { const arr = contacts().filter(c => hay(c).includes(query.trim().toLowerCase())); html = `<div class="notice">주소록의 연락처는 업무 목적으로만 사용합니다. 「연락처 등록」에서 명함 사진을 업로드하면 궁니르 봇이 내용을 자동으로 입력하고, 명함 이미지와 수령 경로도 함께 저장합니다. 본인이 삭제를 요청하면 DB 관리자에게 알려 주세요.</div><section class="panel"><div class="panel-head"><div class="panel-title">주소록 <small>사람 단위</small></div><div class="pf-tools"><button class="button" type="button" id="cards-btn">명함 여러 장 올리기</button><button class="button" type="button" id="remember-btn">리멤버에서 가져오기</button><span class="nav-count">${query.trim() ? arr.length + ' / ' : ''}${contacts().length}</span></div></div>${localForm('이름·회사·직함·연락처')}${arr.length ? contactTable(arr) : noHits('연락처', '연락처 등록')}</section>`; }
  if (page === 'admin') html = adminView();
  if (page === 'studio') html = studioCan ? studioView() : '<section class="panel"><div class="empty"><p><b>제안서 스튜디오는 시험 기간이라 일부 직원만 사용할 수 있습니다.</b></p><p>필요하면 AX팀에 요청해 주세요.</p></div></section>';
  if (page === 'chart') html = srcView();
  if (page === 'search') html = searchView();
  $('#content').innerHTML = html;
  bindContent();
}

/* ---------- 상세 ---------- */
// 상세는 주소에 남긴다 #<화면>/<id> (10-31 대표님 UX 리뷰 ④) — 링크로 바로 열고, 뒤로가기로 닫는다
let routed = false, ignoreHash = false, lastFocus = null;
function setRoute(id) { if (page === 'graph') return;   // 그래프의 주소는 「기준 점」이 차지 (11-03) — 그래프 안 상세는 주소를 바꾸지 않음
  const h = '#' + (page === 'search' ? 'entities' : page) + '/' + id; if (location.hash === h) return; try { if (location.hash.includes('/')) history.replaceState(null, '', h); else { history.pushState(null, '', h); routed = true; } } catch {} }
async function openRoute(pg, id) { if (pg === 'graph' && APP === 'ygg') return graphGo(id); if (byId(id)) return openDetail(id); if (pg === 'studio' && APP === 'gungnir') { if (!studio.list) await loadStudio(); return openProposal(id); } if (pg === 'chart') return openIp(id); }
function hideDrawer() { $('#drawer').hidden = true; $('#overlay').hidden = true; activeDetail = null; ipc.open = null; document.body.style.overflow = ''; if (lastFocus && document.contains(lastFocus)) lastFocus.focus(); lastFocus = null; }
function closeDrawer() {
  if ($('#drawer').hidden) return;
  if (page === 'graph') return hideDrawer();
  hideDrawer();
  if (!location.hash.includes('/')) return;
  if (routed) { routed = false; ignoreHash = true; history.back(); } else try { history.replaceState(null, '', '#' + location.hash.slice(1).split('/')[0]); } catch {}
}
// 상세는 기본으로 크게(가운데 창) · 머리의 단추로 오른쪽 사이드바와 바꾼다 (10-29 김현우) — 고른 모양은 이 브라우저에 기억
let drawerSide = false;
try { drawerSide = localStorage.getItem('pt-drawer') === 'side'; } catch {}
const drawerModeBtn = () => drawerSide ? `<button class="icon-btn" id="drawer-mode" title="크게 보기" aria-label="크게 보기">${icon('big')}</button>` : `<button class="icon-btn" id="drawer-mode" title="사이드바로 보기" aria-label="사이드바로 보기">${icon('side')}</button>`;
function showDrawer(content, keepScroll, label = 'ENTITY') {
  const top = keepScroll ? $('#drawer').scrollTop : 0;
  if (!keepScroll && $('#drawer').hidden) lastFocus = document.activeElement;
  $('#drawer').classList.toggle('big', !drawerSide);
  $('#drawer').innerHTML = `<div class="drawer-header"><span>${BRAND} / ${label}</span><span class="drawer-tools">${location.hash.includes('/') ? `<button class="icon-btn" id="drawer-link" title="링크 복사" aria-label="링크 복사">${icon('link')}</button>` : ''}${drawerModeBtn()}<button class="icon-btn" id="close-drawer" aria-label="닫기">${icon('close')}</button></span></div>${content}`;
  const flip = () => { drawerSide = !drawerSide; try { localStorage.setItem('pt-drawer', drawerSide ? 'side' : 'big'); } catch {} $('#drawer').classList.toggle('big', !drawerSide); $('#drawer-mode').outerHTML = drawerModeBtn(); $('#drawer-mode').onclick = flip; };
  $('#drawer-mode').onclick = flip;
  $('#drawer-link')?.addEventListener('click', async () => { try { await navigator.clipboard.writeText(location.href); toast('링크를 복사했습니다. 슬랙에 붙여넣으면 이 화면이 바로 열립니다.'); } catch { toast(location.href); } });
  $('#drawer').hidden = false; $('#overlay').hidden = false; document.body.style.overflow = 'hidden';
  $('#close-drawer').onclick = closeDrawer; $('#drawer').scrollTop = top; if (!keepScroll) $('#close-drawer').focus();
  $$('#drawer [data-open]').forEach(b => b.onclick = () => openDetail(b.dataset.open));
  $$('#drawer [data-copy]').forEach(b => b.onclick = async () => { const el = document.getElementById(b.dataset.copy); try { await navigator.clipboard.writeText(el.textContent); b.textContent = '복사됨'; } catch { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = '선택됨'; } setTimeout(() => b.textContent = '복사', 1800); });
}
const linkList = arr => `<div class="link-list">${arr.map(m => `<button type="button" data-open="${m.id}"><b>${esc(m.name)}</b><span>${esc(m.role || m.type)}</span></button>`).join('')}</div>`;
// 연락처 한 줄 — 이메일은 메일 쓰기, 전화번호는 바로 걸기(폰) · 복사 (회의 지시: 새 직원이 보고 바로 연락)
const contactLink = p => { const m = String(p).match(/[\w.+-]+@[\w-]+(\.[\w-]+)+/); if (m) return `<a class="point-go" href="mailto:${esc(m[0])}">메일</a>`; const t = String(p).match(/\+?\d[\d\s().-]{7,}\d/); return t && t[0].replace(/\D/g, '').length >= 8 ? `<a class="point-go" href="tel:${t[0].replace(/[^\d+]/g, '')}">전화</a>` : ''; };
const pointsBlock = e => e.points.map((p, i) => `<div class="point"><code id="pt-${e.id}-${i}">${esc(p)}</code><span class="point-acts">${contactLink(p)}<button type="button" data-copy="pt-${e.id}-${i}">복사</button></span></div>`).join('');
const noteOf = e => e.note ?? e.facts.join('\n');
const noteBlock = e => `<div class="detail-block"><h3>리서치 노트</h3><textarea id="research-note" placeholder="확인한 내용과 출처를 기록해 주세요." aria-label="리서치 노트">${esc(noteOf(e))}</textarea><button class="button primary" id="save-note">노트 저장</button><p>업무 기록의 내용으로 시작합니다. 저장한 노트는 전 직원에게 공유되며 변경 이력이 기록됩니다.</p></div>`;
function bindNote(e) { $('#save-note').onclick = async () => { const b = $('#save-note'); b.disabled = true; const ok = await save(e.id, {note: $('#research-note').value}); b.disabled = false; if (ok) toast('리서치 노트를 저장했습니다.'); }; }
const adminTools = e => isAdmin ? `<button class="button" id="hide-entity">${e.hidden ? '숨김 해제' : '숨기기'}</button>` : '';
function bindAdminTools(e) { $('#hide-entity')?.addEventListener('click', async () => { const { error } = await SB.rpc('pt_set_hidden', {entity: e.id, value: !e.hidden}); if (error) return toast('변경하지 못했습니다: ' + error.message); await load(); render(); openDetail(e.id);
  toast(e.hidden ? '숨김을 해제했습니다.' : '숨김 처리했습니다. DB 관리자만 볼 수 있습니다.', {fn: async () => { const r = await SB.rpc('pt_set_hidden', {entity: e.id, value: !!e.hidden}); if (r.error) throw r.error; await load(); render(); openDetail(e.id); toast('실행을 취소했습니다.'); }}); }); }

// 내부 담당자 이력 (10-26) — 최초 등록자 → 주 담당자 지정·변경(인수인계)을 시각과 함께. 변경 기록에서 담당자 항목만 (pt_owner_history)
function ownerHistoryHtml(rows) {
  if (!rows.length) return '<p>기록된 이력이 없습니다.</p>';
  const who = r => esc(r.actor_name) + (r.via === 'slack' ? ' (슬랙)' : '');
  const items = rows.map(r => {
    const b = r.before_owners || [], a = r.after_owners || [], lines = [];
    if (r.op === 'insert') { lines.push(`<b>최초 등록</b> · 등록자 ${who(r)}`); if (a.length) lines.push(`주 담당자 <b>${esc(a[0])}</b>${a.length > 1 ? ` · 내부 담당자 ${a.slice(1).map(esc).join(', ')}` : ''}`); }
    else {
      if ((b[0] || '') !== (a[0] || '')) lines.push(b[0] && a[0] ? `<b>주 담당자 변경</b> ${esc(b[0])} → <b>${esc(a[0])}</b>` : a[0] ? `<b>주 담당자 지정</b> ${esc(a[0])}` : `<b>주 담당자 해제</b> ${esc(b[0])}`);
      const added = a.filter(x => !b.includes(x) && x !== a[0]), removed = b.filter(x => !a.includes(x) && x !== b[0]);
      if (added.length) lines.push(`내부 담당자 추가 ${added.map(esc).join(', ')}`);
      if (removed.length) lines.push(`내부 담당자 제외 ${removed.map(esc).join(', ')}`);
      if (!lines.length) lines.push('내부 담당자 순서 변경');
      lines.push(`변경자 ${who(r)}`);
    }
    return `<li><time>${esc(kst(r.at))}</time><span>${lines.join('<br>')}</span></li>`;
  });
  return `<ol class="owner-hist">${items.join('')}</ol>`;
}
async function loadOwnerHistory(id) {
  const { data, error } = await SB.rpc('pt_owner_history', {entity: id});
  const box = $('#owner-hist'); if (!box || activeDetail !== id) return;
  box.innerHTML = error ? '<p>이력을 불러오지 못했습니다.</p>' : ownerHistoryHtml(data || []);
}
function openDetail(id, keep) {
  const e = byId(id); if (!e) return; activeDetail = id;
  if (!keep) setRoute(id);
  if (isContact(e)) return openContact(e, keep);
  const cs = contactsOf(e), parent = e.parentId && byId(e.parentId);
  showDrawer(`${avatar(e)}<h2>${esc(e.name)}</h2><span class="detail-sub">${esc(e.en ? e.en + ' · ' : '')}${esc(e.type)}</span><div class="drawer-actions"><button class="button" id="edit-entity">정보 수정</button>${APP === 'ygg' ? `<button class="button" type="button" data-graph-go="${e.id}">그래프에서 보기</button>` : ''}${adminTools(e)}</div><div class="detail-block"><h3>기본 정보 및 관계</h3><div class="detail-row"><span>소속 / 권리 관계</span><b>${parent ? `<button class="ref" type="button" data-open="${parent.id}">${esc(parent.name)}</button>` : esc(e.agencyText || '—')}</b></div><div class="detail-row"><span>관계 근거</span><b>${e.rel ? esc(e.rel) : PILL_NOREL}</b></div><div class="detail-row"><span>내부 담당자</span><b>${ownersLine(e.owners)}</b></div><div class="detail-row"><span>등록한 직원</span><b>${esc(registrar(e) || '—')}</b></div>${kidsOf(e).length ? `<div class="detail-row"><span>운영 브랜드 · 연결 엔티티</span><b>${kidsOf(e).length}개</b></div>${linkList(kidsOf(e))}` : ''}<div class="detail-row"><span>등록된 담당자</span><b>${cs.length}명</b></div>${cs.length ? linkList(cs) : ''}${pointsBlock(e)}</div>${APP === 'ygg' ? relBlock(e) + pathBlock(e) + timelineBlock(evOf(e.id)) + wikiBlock(e) + relationsBlock(e) : ''}<div class="detail-block"><h3>별칭</h3>${[e.name, ...e.aliases].map(a => `<span class="tag">${esc(a)}</span>`).join('')}</div><div class="detail-block"><h3>내부 담당자 이력</h3><div id="owner-hist"><p>이력을 불러오는 중입니다<span class="dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></p></div></div>${noteBlock(e)}`, keep);
  $('#edit-entity').onclick = () => entityModal(e); bindNote(e); bindAdminTools(e); loadOwnerHistory(e.id); bindRel(e); bindKn(e); if (APP === 'ygg') loadPaths(e);
}
function openContact(c, keep) {
  const org = c.parentId && byId(c.parentId), card = imgSrc(c.cardImg);
  showDrawer(`<span class="entity-avatar">${esc(c.name.slice(0, 2))}</span><h2>${esc(c.name)}</h2><span class="detail-sub">${esc(c.role ? c.role + ' · ' : '')}거래처 담당자</span><div class="drawer-actions"><button class="button" id="edit-contact">정보 수정</button>${APP === 'ygg' ? `<button class="button" type="button" data-graph-go="${c.id}">그래프에서 보기</button>` : ''}${adminTools(c)}</div><div class="detail-block"><h3>기본 정보 및 관계</h3><div class="detail-row"><span>회사 연결</span><b>${org ? `<button class="ref" type="button" data-open="${org.id}">${esc(org.name)}</button> <button class="text-btn" type="button" id="link-company">변경</button>` : `<button class="button" type="button" id="link-company">${icon('link')} 회사 미연결 · 연결하기</button>`}</b></div><div class="detail-row"><span>관계 근거</span><b>${c.rel ? esc(c.rel) : PILL_NOREL}</b></div><div class="detail-row"><span>내부 담당자</span><b>${ownersLine(c.owners)}</b></div><div class="detail-row"><span>등록한 직원</span><b>${esc(registrar(c) || '—')}</b></div><div id="priv-box">${privHtml(c)}</div></div>${APP === 'ygg' ? personBlock(c) + timelineBlock(evOfContact(c.id), true) : ''}<div class="detail-block"><h3>내부 담당자 이력</h3><div id="owner-hist"><p>이력을 불러오는 중입니다<span class="dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></p></div></div>`, keep, 'CONTACT');
  bindAdminTools(c); loadOwnerHistory(c.id); bindRel(byId(c.parentId) || c, c); bindPriv(c); if (!keep || !priv[c.id]) loadPriv(c);
  $('#card-where')?.addEventListener('click', () => cardWhereModal(c));
  $('#link-company').onclick = () => linkModal(c);
  $('#edit-contact').onclick = () => contactEditModal(c);
}

/* ---------- 관계 레이어 (이그드라실 PRD v2 CL-2 · 11-01 · sql/014) ----------
   사람 = pt_directory (거래처 담당자 행을 트리거가 옮겨 적은 pt_contact + 소속 + 마지막 접촉)
   조직 = pt_entity.pipeline·contact_depth·rel_owner (사람이 정함, pt_set_* 함수로만) · 타임라인 = pt_rel_event
   관계 점수·마지막 접촉 = pt_rel_state (DB 가 계산) · 확인 대기 = pt_review_queue + 승격 후보(화면에서 계산) */
const rel = {dir: {}, state: {}, events: [], review: [], cards: {}};
const STAGE = {R0: '접점 없음', R1: '첫 연락', R2: '미팅', R3: '제안 송부', R4: '협의 중', R5: '계약·실행', R6: '반복 협업'};
const DEPTH = {1: '실무 팀장급', 2: '대표·의사결정권자', 3: '협업 이력·결과 양호', 4: '아티스트 본인 직접'};
const EV = {card: '명함', introduced: '소개', reached: '첫 연락', mentioned: '미팅 언급', recommended: '경로 추천', meeting: '미팅', sent: '제안 송부', reply: '회신', deal: '딜', dead: '중단', note: '메모'};
const EV_ADD = ['reached', 'meeting', 'sent', 'reply', 'introduced', 'deal', 'dead', 'note'];
const SRC_KO = {manual: '', heimdall: '헤임달 미팅', gungnir: '궁니르', thor: '토르', core: '판테온 코어', slack: '슬랙'};
const STALE_DAYS = 90;
async function loadRel() {
  const [d, s, ev, rq] = await Promise.all([SB.from('pt_directory').select('*'), SB.from('pt_rel_state').select('*'),
    SB.from('pt_rel_event').select('*').order('occurred_on', {ascending: false}).order('id', {ascending: false}).limit(3000),
    SB.from('pt_review_queue').select('*').eq('status', 'pending').order('created_at', {ascending: false}).limit(500)]);
  const [wk, rl] = await Promise.all([SB.from('pt_wiki_page').select('*'), SB.from('pt_relation').select('*').limit(5000)]);
  rel.wiki = Object.fromEntries((wk.data || []).map(x => [x.entity_id, x])); rel.relations = rl.data || [];
  rel.dir = Object.fromEntries((d.data || []).map(x => [x.id, x])); rel.state = Object.fromEntries((s.data || []).map(x => [x.id, x]));
  rel.events = ev.data || []; rel.review = rq.data || [];
}
const memberName = id => (MEMBERS || []).find(m => m.id === id)?.name || '';
const nameOf = id => byId(id)?.name || rel.dir[id]?.name || '';
const dayN = d => d ? Math.floor((Date.now() + 9 * 3600e3 - Date.parse(d + 'T00:00:00Z')) / 864e5) : null;
const dotDate = d => d ? d.slice(2, 10).replace(/-/g, '.') : '';
const touchText = d => { if (!d) return '—'; const n = dayN(d); return `${dotDate(d)} <small>${n <= 0 ? '오늘' : n + '일 전'}</small>`; };
const evOf = id => rel.events.filter(x => x.entity_id === id);
const evOfContact = id => rel.events.filter(x => x.contact_id === id || x.via_contact_id === id);
const stagePill = s => `<span class="rl-stage ${s ? 's-' + s : ''}">${s ? `${s} · ${STAGE[s]}` : '단계 없음'}</span>`;
const canRel = e => !e.relOwner || e.relOwner === me?.id || isAdmin;
const stale = e => ['R2', 'R3', 'R4', 'R5', 'R6'].includes(e.pipeline) && dayN(rel.state[e.id]?.last_touch) > STALE_DAYS;
// 승격 후보 — 시스템은 후보만, 확정은 관계 담당자 (PRD R-05). 기록 종류 → 그 기록이 뒷받침하는 단계
const STAGE_HINT = {reached: 'R1', introduced: 'R1', meeting: 'R2', sent: 'R3', reply: 'R4', deal: 'R5'};
function stageHint(e) {
  const cur = e.pipeline || 'R0'; let best = null;
  for (const x of evOf(e.id)) { const s = x.type === 'reply' && x.outcome !== 'positive' ? null : STAGE_HINT[x.type]; if (x.status === 'confirmed' && s && s > cur && (!best || s > best.s)) best = {s, ev: x}; }
  return best;
}
const partsTable = st => !st?.parts?.parts ? '' : `<table class="rl-parts"><thead><tr><th>항목</th><th>비중</th><th>점수</th><th>근거</th></tr></thead><tbody>${st.parts.parts.map(p => `<tr><td>${esc(p.label)}</td><td>${p.weight}</td><td><b>${p.score}</b></td><td>${esc(p.basis)}</td></tr>`).join('')}</tbody></table><p class="rl-note">관계 점수 = 항목 점수 × 비중의 합 ÷ 100 · 기준 버전 ${st.parts.version}. 사람을 평가하는 점수가 아니라 회사와의 관계 상태입니다.</p>`;
function relBlock(e) {
  const st = rel.state[e.id], h = stageHint(e), dev = e.depthEvent && rel.events.find(x => x.id === e.depthEvent);
  return `<div class="detail-block rl"><h3>관계</h3><div class="rl-grid">
    <div class="rl-card"><small>관계 단계</small>${stagePill(e.pipeline)}${h && canRel(e) ? `<button type="button" class="rl-hint" data-rl-hint="${h.s}|${h.ev.id}">승격 후보 ${h.s} · ${esc(EV[h.ev.type])} ${dotDate(h.ev.occurred_on)}</button>` : ''}</div>
    <div class="rl-card"><small>관계 점수</small><b>${st?.rel_score ?? '—'}${st ? '<em>/100</em>' : ''}</b>${st ? '<button type="button" class="text-btn" id="rl-why" aria-expanded="false">점수 산정 근거</button>' : '<span>접촉 기록이 등록되면 산정됩니다</span>'}</div>
    <div class="rl-card"><small>관계 깊이</small><b>${e.contactDepth ? e.contactDepth + '<em>/4</em>' : '—'}</b><span>${e.contactDepth ? esc(DEPTH[e.contactDepth]) + (dev ? '' : ' ' + PILL_NOREL) : '미입력'}${e.ownedIp ? ' <span class="pill good">당사 IP</span>' : ''}</span></div>
    <div class="rl-card"><small>마지막 접촉</small><b class="rl-date">${touchText(st?.last_touch)}</b>${stale(e) ? '<span class="pill warn">장기 미접촉</span>' : ''}</div></div>
    <div id="rl-parts" hidden>${partsTable(st)}</div>
    <div class="detail-row"><span>관계 담당자</span><b>${e.relOwner ? esc(memberName(e.relOwner) || '이름 확인 불가') : '미지정'}</b></div>
    ${canRel(e) ? `<div class="drawer-actions"><button class="button" type="button" id="rl-stage-btn">단계 변경</button><button class="button" type="button" id="rl-depth-btn">관계 깊이</button><button class="button" type="button" id="rl-owner-btn">${e.relOwner ? '관계 담당자 변경' : '관계 담당자 지정'}</button></div>` : '<p class="rl-note">관계 단계·깊이는 관계 담당자가 지정합니다.</p>'}</div>`;
}
function timelineBlock(list, forContact) {
  const li = x => { const org = forContact && x.entity_id && byId(x.entity_id), mine = x.created_by === me?.id || isAdmin;
    return `<li class="tl-${x.type}${x.status === 'candidate' ? ' cand' : ''}"><time>${esc(dotDate(x.occurred_on))}</time><div><span class="tl-type">${esc(EV[x.type] || x.type)}</span>${x.outcome ? ` <span class="pill ${x.outcome === 'positive' ? 'good' : 'warn'}">${x.outcome === 'positive' ? '긍정' : '부정'}</span>` : ''}${x.status === 'candidate' ? ' <span class="pill muted">확인 대기</span>' : ''}${!forContact && x.contact_id ? ` <button class="ref" type="button" data-open="${x.contact_id}">${esc(nameOf(x.contact_id))}</button>` : ''}${org ? ` <button class="ref" type="button" data-open="${org.id}">${esc(org.name)}</button>` : ''}${x.via_contact_id ? ` <small>소개 ${esc(nameOf(x.via_contact_id))}</small>` : ''}${x.summary ? `<p>${esc(x.summary)}</p>` : ''}<small>${esc([SRC_KO[x.source_system], memberName(x.created_by)].filter(Boolean).join(' · '))}</small></div>${mine && x.source_system === 'manual' && x.type !== 'card' ? `<button type="button" class="text-btn" data-tl-del="${x.id}">삭제</button>` : ''}</li>`; };
  return `<div class="detail-block"><div class="rl-head"><h3>관계 타임라인 <small>${list.length}건</small></h3><button class="button" type="button" id="tl-add">${icon('plus')} 접촉 기록</button></div>${list.length ? `<ol class="tl">${list.map(li).join('')}</ol>` : '<p>기록된 접점이 없습니다. 연락·미팅·제안을 기록하면 관계 점수와 마지막 접촉일에 반영됩니다.</p>'}</div>`;
}
async function relReload(id) { await Promise.all([load(), loadRel()]); render(); if (id) openDetail(id, true); }
function bindRel(e, contact) {
  $('#rl-why')?.addEventListener('click', ev => { const p = $('#rl-parts'); p.hidden = !p.hidden; ev.target.setAttribute('aria-expanded', String(!p.hidden)); });
  $('#rl-stage-btn')?.addEventListener('click', () => stageModal(e));
  $$('[data-rl-hint]').forEach(b => b.onclick = () => { const [s, ev] = b.dataset.rlHint.split('|'); stageModal(e, {s, ev: Number(ev)}); });
  $('#rl-depth-btn')?.addEventListener('click', () => depthModal(e));
  $('#rl-owner-btn')?.addEventListener('click', () => relOwnerModal(e));
  $('#tl-add')?.addEventListener('click', () => eventModal(contact ? {contact} : {entity: e}));
  $$('[data-tl-del]').forEach(b => b.onclick = async () => {
    const x = rel.events.find(v => String(v.id) === b.dataset.tlDel); if (!x) return;
    const { error } = await SB.from('pt_rel_event').delete().eq('id', x.id); if (error) return toast('삭제하지 못했습니다: ' + error.message);
    await relReload(activeDetail);
    toast('기록을 삭제했습니다.', {fn: async () => { const {id, created_at, created_by, ...row} = x; const r = await SB.from('pt_rel_event').insert(row); if (r.error) throw r.error; await relReload(activeDetail); toast('실행을 취소했습니다.'); }});
  });
}
function eventModal({entity, contact}) {
  const people = entity ? contactsOf(entity) : [], org = contact && contact.parentId && byId(contact.parentId);
  const who = contact ? contact.name + ' 님' + (org ? ` (${org.name})` : '') : entity.name;
  modal(`<form id="ev-form"><h2>접촉 기록</h2><p>${esc(who)}과(와)의 접점을 기록합니다. 전 직원에게 공유되고 관계 점수·마지막 접촉일에 반영됩니다.</p>
    <label>종류<select id="ev-type">${EV_ADD.map(t => `<option value="${t}">${EV[t]}</option>`).join('')}</select></label>
    <label>날짜<input id="ev-date" type="date" value="${today()}" max="${today()}" required></label>
    ${contact ? '' : `<label>상대 담당자<select id="ev-contact"><option value="">(회사 전체)</option>${people.map(p => `<option value="${p.id}">${esc(p.name)}${p.role ? ' · ' + esc(p.role) : ''}</option>`).join('')}</select></label>`}
    <label id="ev-via-f" hidden>소개자<select id="ev-via"><option value="">(선택)</option>${contacts().filter(p => p.id !== contact?.id).sort((a, b) => a.name.localeCompare(b.name, 'ko')).map(p => `<option value="${p.id}">${esc(p.name)}${agencyOf(p) ? ' · ' + esc(agencyOf(p)) : ''}</option>`).join('')}</select></label>
    <label id="ev-out-f" hidden>반응<select id="ev-out"><option value="">모름</option><option value="positive">긍정</option><option value="negative">부정·거절</option></select></label>
    <label>내용<textarea id="ev-sum" rows="3" maxlength="500" placeholder="예: KREAM 협업 제안서 메일 발송"></textarea></label>
    <div id="ev-err" class="form-err" role="alert"></div>
    <div class="modal-actions"><button class="button" type="button" data-cancel>취소</button><button class="button primary" type="submit">기록 저장</button></div></form>`);
  const sync = () => { const t = $('#ev-type').value; $('#ev-via-f').hidden = t !== 'introduced'; $('#ev-out-f').hidden = !['reply', 'sent', 'meeting'].includes(t); };
  $('#ev-type').onchange = sync; sync();
  $('#ev-form').onsubmit = async ev => {
    ev.preventDefault(); const t = $('#ev-type').value, sum = $('#ev-sum').value.trim();
    if (t === 'introduced' && !$('#ev-via').value) { $('#ev-err').textContent = '소개자를 선택해 주세요.'; return; }
    if (['note', 'dead'].includes(t) && !sum) { $('#ev-err').textContent = '내용을 입력해 주세요.'; return; }
    const row = {entity_id: entity?.id || org?.id || null, contact_id: contact?.id || $('#ev-contact')?.value || null, type: t, occurred_on: $('#ev-date').value || today(), summary: sum, outcome: $('#ev-out-f').hidden ? '' : $('#ev-out').value, via_contact_id: t === 'introduced' ? $('#ev-via').value : null};
    const btn = ev.submitter; if (btn) btn.disabled = true;
    const { data, error } = await SB.from('pt_rel_event').insert(row).select('id').single();
    if (btn) btn.disabled = false;
    if (error) { $('#ev-err').textContent = '저장하지 못했습니다: ' + error.message; return; }
    $('#modal').dataset.dirty = ''; $('#modal').close(); const back = (contact || entity).id; await relReload(back);
    toast(`${EV[t]} 기록을 저장했습니다.`, {fn: async () => { const r = await SB.from('pt_rel_event').delete().eq('id', data.id); if (r.error) throw r.error; await relReload(back); toast('실행을 취소했습니다.'); }});
  };
}
function stageModal(e, pre) {
  const evs = evOf(e.id).filter(x => x.status === 'confirmed'), cur = e.pipeline || '', sel = pre?.s || cur;
  modal(`<form id="st-form"><h2>관계 단계 변경</h2><p>${esc(e.name)} · 지금 ${cur ? cur + ' ' + STAGE[cur] : '단계 없음'}</p>
    <div class="rl-opts" role="radiogroup" aria-label="관계 단계">${Object.entries(STAGE).map(([k, t]) => `<label class="rl-opt"><input type="radio" name="st" value="${k}" ${k === sel ? 'checked' : ''}><b>${k}</b><span>${t}</span></label>`).join('')}</div>
    <label>근거 기록 <small>단계 상향 시 필수</small><select id="st-ev"><option value="">(선택 안 함)</option>${evs.map(x => `<option value="${x.id}" ${pre?.ev === x.id ? 'selected' : ''}>${dotDate(x.occurred_on)} · ${EV[x.type]}${x.summary ? ' · ' + esc(x.summary.slice(0, 40)) : ''}</option>`).join('')}</select></label>
    ${evs.length ? '' : '<p class="rl-note">근거로 선택할 기록이 없습니다. 상세 화면의 「접촉 기록」에서 먼저 등록해 주세요.</p>'}
    <label>메모<input id="st-note" maxlength="200" placeholder="예: 11/3 미팅에서 하반기 협업 합의"></label><div id="st-err" class="form-err" role="alert"></div>
    <div class="modal-actions"><button class="button" type="button" data-cancel>취소</button><button class="button primary" type="submit">단계 변경</button></div></form>`);
  $('#st-form').onsubmit = async ev => {
    ev.preventDefault(); const to = $('[name=st]:checked')?.value; if (!to) { $('#st-err').textContent = '단계를 선택해 주세요.'; return; }
    if (to === cur) { $('#modal').close(); return; }
    const evid = Number($('#st-ev').value) || null;
    if (to > (cur || 'R0') && !evid) { $('#st-err').textContent = '단계를 상향할 때는 근거 기록을 선택해 주세요.'; return; }
    const { error } = await SB.rpc('pt_set_pipeline', {p_entity: e.id, p_to: to, p_event: evid, p_note: $('#st-note').value.trim()});
    if (error) { $('#st-err').textContent = error.message; return; }
    $('#modal').dataset.dirty = ''; $('#modal').close(); await relReload(e.id);
    toast(`${e.name} 관계 단계를 ${to} ${STAGE[to]}(으)로 변경했습니다.`, {fn: async () => { const r = await SB.rpc('pt_set_pipeline', {p_entity: e.id, p_to: cur || null, p_event: evid, p_note: '실행 취소'}); if (r.error) throw r.error; await relReload(e.id); toast('실행을 취소했습니다.'); }});
  };
}
function depthModal(e) {
  const evs = evOf(e.id).filter(x => x.status === 'confirmed'), ip = e.type === 'IP·유명인';
  modal(`<form id="dp-form"><h2>관계 깊이</h2><p>${esc(e.name)}과(와)의 거래를 진행할 수 있는 접점 수준입니다. 근거가 되는 기록을 함께 선택해 주세요.</p>
    <div class="rl-opts" role="radiogroup" aria-label="관계 깊이"><label class="rl-opt"><input type="radio" name="dp" value="" ${!e.contactDepth ? 'checked' : ''}><b>—</b><span>미입력</span></label>${Object.entries(DEPTH).map(([k, t]) => `<label class="rl-opt"><input type="radio" name="dp" value="${k}" ${String(e.contactDepth) === k ? 'checked' : ''}><b>${k}</b><span>${t}</span></label>`).join('')}</div>
    <label>근거 기록<select id="dp-ev"><option value="">(없음 · 「근거 없음」으로 표시)</option>${evs.map(x => `<option value="${x.id}" ${e.depthEvent === x.id ? 'selected' : ''}>${dotDate(x.occurred_on)} · ${EV[x.type]}${x.summary ? ' · ' + esc(x.summary.slice(0, 40)) : ''}</option>`).join('')}</select></label>
    ${ip ? `<label class="check"><input type="checkbox" id="dp-own" ${e.ownedIp ? 'checked' : ''}> 당사 귀속 IP (예: 《MY FIRST DREAM》) — 최고점·최우선</label>` : ''}
    <div id="dp-err" class="form-err" role="alert"></div>
    <div class="modal-actions"><button class="button" type="button" data-cancel>취소</button><button class="button primary" type="submit">관계 깊이 저장</button></div></form>`);
  $('#dp-form').onsubmit = async ev => {
    ev.preventDefault(); const v = $('[name=dp]:checked')?.value;
    const { error } = await SB.rpc('pt_set_depth', {p_entity: e.id, p_depth: v ? Number(v) : null, p_event: Number($('#dp-ev').value) || null, p_owned: ip ? $('#dp-own').checked : null});
    if (error) { $('#dp-err').textContent = error.message; return; }
    $('#modal').dataset.dirty = ''; $('#modal').close(); await relReload(e.id); toast('관계 깊이를 저장했습니다.');
  };
}
function relOwnerModal(e) {
  const ms = (MEMBERS || []).slice().sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  modal(`<form id="ro-form"><h2>관계 담당자</h2><p>${esc(e.name)}과(와)의 관계를 책임지는 직원입니다. 관계 단계·깊이를 지정하고, 장기간 연락이 없으면 슬랙 알림을 받습니다.</p>
    <label>직원<select id="ro-sel"><option value="">미지정</option>${ms.map(m => `<option value="${m.id}" ${m.id === e.relOwner ? 'selected' : ''}>${esc(m.name)}${memberSub(m) ? ' · ' + esc(memberSub(m)) : ''}</option>`).join('')}</select></label>
    <div id="ro-err" class="form-err" role="alert"></div>
    <div class="modal-actions"><button class="button" type="button" data-cancel>취소</button><button class="button primary" type="submit">관계 담당자 저장</button></div></form>`);
  $('#ro-form').onsubmit = async ev => {
    ev.preventDefault(); const prev = e.relOwner || null, v = $('#ro-sel').value || null;
    const { error } = await SB.rpc('pt_set_rel_owner', {p_entity: e.id, p_member: v});
    if (error) { $('#ro-err').textContent = error.message; return; }
    $('#modal').dataset.dirty = ''; $('#modal').close(); await relReload(e.id);
    toast(v ? `관계 담당자를 ${memberName(v)}(으)로 지정했습니다.` : '관계 담당자 지정을 해제했습니다.', prev !== v && (!prev || isAdmin || prev === me.id) ? {fn: async () => { const r = await SB.rpc('pt_set_rel_owner', {p_entity: e.id, p_member: prev}); if (r.error) throw r.error; await relReload(e.id); toast('실행을 취소했습니다.'); }} : undefined);
  };
}
// 사람 상세 — 소속(지금·이전) · 접촉 · 명함 수령 경로
function personBlock(c) {
  const d = rel.dir[c.id] || {}, past = d.past || [], card = rel.cards[c.id];
  return `<div class="detail-block"><h3>소속 · 접촉</h3>
    <div class="detail-row"><span>현 소속</span><b>${esc(d.entity_name || agencyOf(c) || '—')}${c.role ? ` <small>${esc(c.role)}</small>` : ''}</b></div>
    ${past.length ? `<div class="detail-row"><span>이전 소속</span><b>${past.map(p => `${esc(p.name || '')}${p.until ? ` <small>~${esc(dotDate(p.until))}</small>` : ''}`).join('<br>')}</b></div>` : ''}
    <div class="detail-row"><span>첫 접촉</span><b>${d.first_touch ? esc(dotDate(d.first_touch)) : '—'}</b></div>
    <div class="detail-row"><span>마지막 접촉</span><b class="rl-date">${touchText(d.last_touch)}</b></div>
    ${d.pipeline ? `<div class="detail-row"><span>회사 관계 단계</span><b>${stagePill(d.pipeline)}</b></div>` : ''}
    ${card ? `<div class="detail-row"><span>명함 수령 경로</span><b>${esc(card.received_where || '모름')} <button class="text-btn" type="button" id="card-where">수정</button></b></div>` : ''}</div>`;
}
async function loadCard(c) {
  if (!c.cardImg) return; const { data } = await SB.from('pt_card').select('*').eq('contact_id', c.id).order('id', {ascending: false}).limit(1).maybeSingle();
  if (data && (!rel.cards[c.id] || rel.cards[c.id].id !== data.id || rel.cards[c.id].received_where !== data.received_where)) { rel.cards[c.id] = data; if (activeDetail === c.id) openDetail(c.id, true); }
}
function cardWhereModal(c) {
  const card = rel.cards[c.id]; if (!card) return;
  modal(`<form id="cw-form"><h2>명함 수령 경로</h2><p>명함을 받은 장소와 전달한 사람을 기록해 두면 이후 관계를 확인하기 쉽습니다.</p><label>수령 경로<input id="cw-where" maxlength="200" value="${esc(card.received_where)}" placeholder="예: 10/22 KREAM 미팅 · 모르면 입력하지 않아도 됩니다"></label><div class="modal-actions"><button class="button" type="button" data-cancel>취소</button><button class="button primary" type="submit">저장</button></div></form>`);
  $('#cw-form').onsubmit = async ev => { ev.preventDefault(); const v = $('#cw-where').value.trim(); const { error } = await SB.from('pt_card').update({received_where: v}).eq('id', card.id); if (error) return toast('저장하지 못했습니다: ' + error.message); rel.cards[c.id] = {...card, received_where: v}; $('#modal').dataset.dirty = ''; $('#modal').close(); openDetail(c.id, true); toast('명함 수령 경로을 저장했습니다.'); };
}

/* ---------- 확인 대기 (PRD C-02) — 사람이 확인해야 할 후보를 한곳에 ---------- */
const RQ = {meeting: '헤임달 미팅 · 거래처 연결', ocr: '명함 인식 결과', mentioned: '미팅에서 언급된 사람', recommended: '연락 경로 추천', affiliation: '소속 변경 후보', ip_candidate: 'IP 차트 신규 IP', distill: '지식 정리 초안', wiki: '위키 수정', pipeline: '관계 단계 승격 후보', alias: '별칭 추가 제안', auto: '헤임달 미팅에서 자동 등록', mail: '메일에서 찾은 거래처'};
const hints = () => entities().filter(e => canRel(e)).map(e => ({e, h: stageHint(e)})).filter(x => x.h);
const reviewCount = () => rel.review.length + hints().length + (acc.approver ? pendingReqs().length : 0);
function ipHitSelect(r) {
  const P = r.payload || {}, pool = entities().filter(e => e.type === 'IP·유명인' && !e.hidden);
  const hits = [...new Set([...(r.target_id && byId(r.target_id) ? [byId(r.target_id)] : []), ...nameHits([P.name, P.name_en, r.title], pool)])];
  return hits.length ? `<select class="table-select" data-rq-ipent="${r.id}" aria-label="연결할 IP 엔티티"><option value="">새 엔티티로 등록</option>${hits.map(e => `<option value="${e.id}" ${e.id === r.target_id ? 'selected' : ''}>${esc(e.name)}에 연결</option>`).join('')}</select>` : '<span class="rq-new">새 엔티티로 등록</span>';
}
let rqKind = '';               // 확인 대기 종류 고르기 (11-02 UI 점검)
function reviewView() {
  const hs = hints(), byKind = {};
  rel.review.forEach(r => (byKind[r.kind] ||= []).push(r));
  const P = r => r.payload || {}, from = r => `<small>${esc(dotDate(P(r).held_on))} 헤임달 미팅 「${esc(P(r).meeting || '')}」</small>`;
  const card = r => ['wiki', 'distill'].includes(r.kind) ? wikiCard(r) : r.kind === 'meeting' ? `<li class="rq-item rq-wide"><div><b>${esc(P(r).org || r.title)}</b>${from(r)}${P(r).summary ? `<small>${esc(P(r).summary)}</small>` : ''}${P(r).evidence ? `<small>근거: ${esc(P(r).evidence)}</small>` : ''}</div><span class="rq-acts"><select class="table-select" data-rq-ent="${r.id}" aria-label="연결할 회사"><option value="">연결할 회사 선택</option>${companyOptions(r.target_id, [P(r).org, r.title])}</select><button class="button" type="button" data-rq="${r.id}|rejected">제외</button><button class="button primary" type="button" data-rq-link="${r.id}">타임라인에 연결</button></span></li>`
    : r.kind === 'ip_candidate' ? `<li class="rq-item rq-wide"><div><b>${esc(P(r).name || r.title)}</b>${P(r).name_en && P(r).name_en !== P(r).name ? ` <span>${esc(P(r).name_en)}</span>` : ''} <span class="pill">${esc(IPK[P(r).kind] || '')}</span><small>IP 차트 ${P(r).chart === 'new' ? '신규' : '전체'} ${esc(P(r).rank)}위${P(r).owner ? ' · ' + esc(P(r).owner) : ''}${P(r).holder_entity_id && byId(P(r).holder_entity_id) ? ' · 권리사 ' + esc(byId(P(r).holder_entity_id).name) : ''}</small>${P(r).summary ? `<small>${esc(P(r).summary)}</small>` : ''}</div><span class="rq-acts">${ipHitSelect(r)}<button class="button" type="button" data-rq="${r.id}|rejected">제외</button><button class="button primary" type="button" data-rq-ip="${r.id}">반영</button></span></li>`
    : r.kind === 'auto' ? `<li class="rq-item rq-wide"><div><b>${esc(P(r).meeting || r.title)}</b><small>${esc(dotDate(P(r).held_on))} 헤임달 미팅 · ${esc(P(r).by || '')} 님이 업로드한 미팅에서 새로 등록했습니다. 잘못 등록된 항목은 숨김 처리해 주세요.</small><ul class="rq-auto">${(P(r).created || []).map(c => { const e = byId(c.id); return `<li>${e ? `<button class="text-btn" type="button" data-detail="${esc(c.id)}">${esc(e.name)}</button>` : `<s>${esc(c.name)}</s>`} <span class="pill">${esc(c.kind)}</span>${e && isAdmin ? ` <button class="rq-hide" type="button" data-auto-hide="${esc(c.id)}" aria-label="${esc(e.name)} 숨기기">숨기기</button>` : ''}</li>`; }).join('')}</ul></div><span class="rq-acts"><button class="button primary" type="button" data-rq="${r.id}|approved">확인</button></span></li>`
    : r.kind === 'mail' ? `<li class="rq-item rq-wide rq-mail"><div><b>${esc(P(r).company || r.title)}</b> <span>@${esc(P(r).domain || r.title)}</span><small>직원들이 보낸 메일 ${esc(P(r).total || 0)}통 · 마지막 ${esc(dotDate(P(r).last))}</small>
        <div class="rq-mail-org"><select class="table-select" data-mail-ent="${r.id}" aria-label="회사"><option value="">새 회사로 등록</option>${companyOptions(r.target_id, [P(r).company, P(r).domain])}</select><input class="table-select" data-mail-name="${r.id}" value="${esc(P(r).company || '')}" aria-label="새 회사 이름" ${r.target_id ? 'hidden' : ''}></div>
        <ul class="rq-mail-people">${(P(r).people || []).map((x, i) => `<li><label><input type="checkbox" data-mail-p="${r.id}|${i}" checked> <input class="rq-mail-nm" data-mail-nm="${r.id}|${i}" value="${esc(x.name || '')}" placeholder="이름" aria-label="이름"></label><span>${esc(x.email)}</span><small>${esc(x.count)}통 · ${esc(dotDate(x.last))} · ${esc((x.staff || []).join(', '))}</small></li>`).join('')}</ul></div><span class="rq-acts"><button class="button" type="button" data-rq="${r.id}|rejected">제외</button><button class="button primary" type="button" data-mail-go="${r.id}">선택한 담당자 등록</button></span></li>`
    : r.kind === 'mentioned' ? `<li class="rq-item"><div><b>${esc(P(r).name || r.title)}</b>${P(r).role || P(r).org ? ` <span>${esc([P(r).org, P(r).role].filter(Boolean).join(' · '))}</span>` : ''}${P(r).attended ? ' <span class="pill good">참석</span>' : ''}${from(r)}</div><span class="rq-acts"><button class="button" type="button" data-rq="${r.id}|rejected">제외</button><button class="button primary" type="button" data-rq-person="${r.id}">연락처 등록</button></span></li>`
    : `<li class="rq-item"><div><span class="pill">${esc(RQ[r.kind] || r.kind)}</span> <b>${esc(r.title || '')}</b>${Object.entries(r.payload || {}).filter(([, v]) => v && typeof v !== 'object').slice(0, 4).map(([k, v]) => `<small>${esc(k)}: ${esc(String(v).slice(0, 80))}</small>`).join('')}<time>${esc(ymd(r.created_at))}</time></div><span class="rq-acts"><button class="button" type="button" data-rq="${r.id}|rejected">제외</button><button class="button primary" type="button" data-rq="${r.id}|approved">확인</button></span></li>`;
  return accPanel() + `<div class="notice">시스템이 찾은 후보입니다. 사람이 확인해야 반영됩니다. 확인 또는 제외한 항목은 목록에서 사라지고 이력에 기록됩니다.</div>
    <section class="panel"><div class="panel-head"><div class="panel-title">관계 단계 승격 후보 <small>${hs.length}건</small></div></div>${hs.length ? `<ul class="rq-list">${hs.map(({e, h}) => `<li class="rq-item"><div><b>${esc(e.name)}</b> ${stagePill(e.pipeline)} → <span class="rl-stage s-${h.s}">${h.s} · ${STAGE[h.s]}</span><small>근거: ${esc(dotDate(h.ev.occurred_on))} ${esc(EV[h.ev.type])}${h.ev.summary ? ' · ' + esc(h.ev.summary.slice(0, 60)) : ''}</small></div><span class="rq-acts"><button class="button" type="button" data-detail="${e.id}">상세</button><button class="button primary" type="button" data-rq-stage="${e.id}|${h.s}|${h.ev.id}">단계 상향</button></span></li>`).join('')}</ul>` : '<div class="empty"><p>승격 후보가 없습니다. 접촉 기록이 누적되면 시스템이 후보를 찾습니다.</p></div>'}</section>
    <section class="panel" style="margin-top:16px"><div class="panel-head"><div class="panel-title">확인할 항목 <small>${rel.review.length}건</small></div></div>${Object.keys(byKind).length > 1 ? `<div class="rq-kinds" role="group" aria-label="종류별로 보기"><button type="button" class="tab ${!byKind[rqKind] ? 'active' : ''}" data-rq-kind="" aria-pressed="${!byKind[rqKind]}">전체 ${rel.review.length}</button>${Object.keys(byKind).map(k => `<button type="button" class="tab ${rqKind === k ? 'active' : ''}" data-rq-kind="${k}" aria-pressed="${rqKind === k}">${esc(RQ[k] || k)} ${byKind[k].length}</button>`).join('')}</div>` : ''}${rel.review.length ? Object.keys(byKind).filter(k => !byKind[rqKind] || k === rqKind).map(k => `<h4 class="rq-kind">${esc(RQ[k] || k)}</h4><ul class="rq-list">${byKind[k].map(card).join('')}</ul>`).join('') : '<div class="empty"><p>확인할 항목이 없습니다. 미팅·리서치·IP 차트에서 나온 후보가 생기면 이곳에 표시됩니다.</p></div>'}</section>`;
}
function bindReview() {
  $$('[data-rq-kind]').forEach(b => b.onclick = () => { rqKind = b.dataset.rqKind; render(); });
  $$('[data-mail-ent]').forEach(s => s.onchange = () => { const i = $(`[data-mail-name="${s.dataset.mailEnt}"]`); if (i) i.hidden = !!s.value; });
  $$('[data-mail-go]').forEach(b => b.onclick = async () => {
    const id = Number(b.dataset.mailGo), r = rel.review.find(x => x.id === id), p = r?.payload || {}, d = today();
    const picked = (p.people || []).map((x, i) => ({...x, i, name: ($(`[data-mail-nm="${id}|${i}"]`)?.value || '').trim()})).filter(x => $(`[data-mail-p="${id}|${x.i}"]`)?.checked);
    if (!picked.length) return toast('등록할 담당자를 하나 이상 선택해 주세요.');
    const noName = picked.find(x => !x.name); if (noName) return toast(`${noName.email} 의 이름을 입력해 주세요.`);
    let ent = $(`[data-mail-ent="${id}"]`)?.value; b.disabled = true;
    const staff = picked[0].staff?.[0] || myName;
    if (!ent) {
      const nm = ($(`[data-mail-name="${id}"]`)?.value || '').trim(); if (!nm) { b.disabled = false; return toast('회사 이름을 입력해 주세요.'); }
      const e = await save(uid(), {type: '회사', name: nm, points: [`메일 도메인 ${p.domain}`], owners: [staff], facts: [`메일에서 등록 ${d}`], first: d, last: d}, true);
      if (!e) { b.disabled = false; return; } ent = e.id;
    }
    const org = byId(ent); let n = 0;
    for (const x of picked) {
      const c = await save(uid(), {type: '거래처 담당자', name: x.name, parentId: ent, agencyText: org?.name || '', points: [x.email], owners: [x.staff?.[0] || staff],
                                   facts: [`메일에서 등록 ${d} · 주고받은 메일 ${x.count}통 · 마지막 ${x.last}`], first: d, last: d}, true);
      if (c) n++;
    }
    await SB.rpc('pt_review_decide', {p_id: id, p_status: 'approved', p_note: `${n}명 등록`, p_entity: ent});
    await Promise.all([load(), loadRel()]); render();
    toast(`${org?.name || '회사'}에 담당자 ${n}명을 등록했습니다.`);
  });
  $$('[data-auto-hide]').forEach(b => b.onclick = async () => {
    const id = b.dataset.autoHide, nm = byId(id)?.name || ''; b.disabled = true;
    const { error } = await SB.rpc('pt_set_hidden', {entity: id, value: true});
    if (error) { b.disabled = false; return toast('숨기지 못했습니다: ' + error.message); }
    await load(); render();
    toast(`${nm}을(를) 숨겼습니다.`, {fn: async () => { const r = await SB.rpc('pt_set_hidden', {entity: id, value: false}); if (r.error) throw r.error; await load(); render(); toast('실행을 취소했습니다.'); }});
  });
  $$('[data-rq]').forEach(b => b.onclick = async () => {
    const [id, st] = b.dataset.rq.split('|'); b.disabled = true;
    const { error } = await SB.rpc('pt_review_decide', {p_id: Number(id), p_status: st, p_note: ''});
    if (error) { b.disabled = false; return toast('처리하지 못했습니다: ' + error.message); }
    await loadRel(); render();
    toast(st === 'approved' ? '확인했습니다.' : '제외했습니다.', {fn: async () => { const r = await SB.rpc('pt_review_decide', {p_id: Number(id), p_status: 'pending', p_note: ''}); if (r.error) throw r.error; await loadRel(); render(); toast('실행을 취소했습니다.'); }});
  });
  $$('[data-rq-link]').forEach(b => b.onclick = async () => {
    const id = Number(b.dataset.rqLink), ent = $(`[data-rq-ent="${id}"]`)?.value;
    if (!ent) return toast('연결할 회사를 선택해 주세요. 목록에 없으면 엔티티로 먼저 등록해 주세요.');
    b.disabled = true;
    const { error } = await SB.rpc('pt_review_decide', {p_id: id, p_status: 'approved', p_note: '', p_entity: ent});
    if (error) { b.disabled = false; return toast('연결하지 못했습니다: ' + error.message); }
    await Promise.all([load(), loadRel()]); render();
    toast(`${byId(ent)?.name || '회사'} 관계 타임라인에 미팅을 기록했습니다.`, {fn: async () => { const r = await SB.rpc('pt_review_decide', {p_id: id, p_status: 'pending', p_note: ''}); if (r.error) throw r.error; await Promise.all([load(), loadRel()]); render(); toast('실행을 취소했습니다.'); }});
  });
  $$('[data-rq-ip]').forEach(b => b.onclick = async () => {
    const id = Number(b.dataset.rqIp), ent = $(`[data-rq-ipent="${id}"]`)?.value || null, r = rel.review.find(x => x.id === id);
    b.disabled = true;
    const { error } = await SB.rpc('pt_review_decide', {p_id: id, p_status: 'approved', p_note: '', p_entity: ent});
    if (error) { b.disabled = false; return toast('반영하지 못했습니다: ' + error.message); }
    await Promise.all([load(), loadRel()]); src.d = null; render();
    toast(ent ? `${byId(ent)?.name || 'IP'}에 IP 차트를 연결했습니다.` : `${r?.payload?.name || 'IP'}를 엔티티로 등록했습니다. 소싱 「IP 스코어」에 표시됩니다.`, {fn: async () => { const x = await SB.rpc('pt_review_decide', {p_id: id, p_status: 'pending', p_note: ''}); if (x.error) throw x.error; await Promise.all([load(), loadRel()]); src.d = null; render(); toast('연결을 취소했습니다. 새로 등록한 엔티티는 엔티티 화면에서 숨길 수 있습니다.'); }});
  });
  $$('[data-rq-person]').forEach(b => b.onclick = () => {
    const r = rel.review.find(x => String(x.id) === b.dataset.rqPerson); if (!r) return; const p = r.payload || {};
    contactModal({name: p.name || r.title, role: p.role, company: p.org, orgId: p.entity_id || r.target_id, where: `${dotDate(p.held_on)} 헤임달 미팅 「${p.meeting || ''}」`,
      onSaved: async (c, org) => { const { error } = await SB.rpc('pt_review_decide', {p_id: r.id, p_status: 'approved', p_note: '', p_entity: org?.id || null, p_contact: c.id}); if (error) toast('연락처는 등록했지만 확인 대기 처리를 하지 못했습니다: ' + error.message); }});
  });
  $$('[data-rq-stage]').forEach(b => b.onclick = () => { const [id, s, ev] = b.dataset.rqStage.split('|'); const e = byId(id); if (e) stageModal(e, {s, ev: Number(ev)}); });
  bindKw();
}

/* ---------- 내부 담당자 입력 (헤임달 참석자 입력과 같은 방식) ----------
   이름 입력 후 Enter · 헤임달 승인 직원이면 정식 이름으로 맞추고 소속을 보여 줌 · 없는 이름은 빨갛게 · 맨 앞 = 주 담당자 */
let MEMBERS = null;
async function loadMembers() {
  if (MEMBERS) return MEMBERS;
  const { data } = await SB.from('hd_member').select('id,name,company,dept').eq('approved', true).order('name');
  MEMBERS = (data || []).filter(m => (m.name || '').trim());
  let dl = document.getElementById('pt-mnames');
  if (!dl) { dl = document.createElement('datalist'); dl.id = 'pt-mnames'; document.body.appendChild(dl); }
  dl.innerHTML = MEMBERS.map(m => `<option value="${esc(m.name)}">`).join('');
  return MEMBERS;
}
const flatName = t => (t || '').replace(/\s/g, '');
function findMember(nm) {
  const t = flatName(nm); if (t.length < 2) return null;
  return (MEMBERS || []).find(m => { const x = flatName(m.name); return x && (t.includes(x) || x.includes(t)); }) || null;
}
const memberSub = m => [...new Set([m.company, m.dept].filter(Boolean))].join(' · ');
// 이름 칩 입력 — 이름 입력 후 Enter. 찾으면 정식 이름으로 맞추고, 못 찾으면 빨간 칩
function chipInput(host, initial, o) {
  host.innerHTML = `<div class="atin"><input type="text" list="${o.list}" placeholder="이름 입력 후 Enter"></div><small class="atnote">${o.note}</small>`;
  const box = host.querySelector('.atin'), inp = host.querySelector('input');
  let vals = (initial || []).map(x => (x || '').trim()).filter(Boolean);
  const draw = () => {
    [...box.querySelectorAll('.atc')].forEach(x => x.remove());
    vals.forEach((v, i) => {
      const hit = o.find(v), c = document.createElement('span'), main = o.main && i === 0, sub = hit ? o.sub(hit) : '';
      c.className = 'atc' + (hit ? '' : ' out') + (main ? ' main' : '');
      c.title = o.title(hit, v);
      c.innerHTML = `${main ? `<em>${o.main}</em>` : ''}<span>${esc(v)}</span>${o.badge ? `<em>${o.badge(hit)}</em>` : ''}${sub ? `<small>${esc(sub)}</small>` : ''}<button type="button" aria-label="${esc(v)} 삭제">×</button>`;
      c.querySelector('button').onclick = ev => { ev.stopPropagation(); vals.splice(i, 1); draw(); };
      if (o.main) c.onclick = () => { if (i) { vals.unshift(vals.splice(i, 1)[0]); draw(); } };
      box.insertBefore(c, inp);
    });
  };
  const add = t => {
    t = (t || '').replace(/,+$/, '').trim(); if (!t) return;
    const hit = o.find(t); if (hit) t = hit.name;          // 정식 이름으로 맞춤 (「김성효 팀장」 → 「김성효」)
    if (!vals.some(v => flatName(v) === flatName(t))) vals.push(t);
    inp.value = ''; draw();
  };
  // 한글 조합 중 Enter 는 조합이 끝난 뒤에 넣음 (헤임달과 같은 처리)
  let composing = false, wantAdd = false;
  inp.addEventListener('compositionstart', () => { composing = true; });
  inp.addEventListener('compositionend', () => { composing = false; if (wantAdd) { wantAdd = false; add(inp.value); } });
  inp.onkeydown = e => {
    const ime = composing || e.isComposing || e.keyCode === 229;
    if (e.key === 'Enter') { e.preventDefault(); if (ime) { wantAdd = true; return; } add(inp.value); }
    else if (e.key === ',') { if (ime) return; e.preventDefault(); add(inp.value); }
    else if (e.key === 'Backspace' && !ime && !inp.value && vals.length) { vals.pop(); draw(); }
  };
  inp.onblur = () => { if (!composing) add(inp.value); };
  inp.onpaste = e => { const t = (e.clipboardData || window.clipboardData).getData('text') || ''; if (/[,\n]/.test(t)) { e.preventDefault(); t.split(/[,\n]/).forEach(add); } };
  draw(); o.load?.().then(draw).catch(() => {});
  return { value() { add(inp.value); return vals.slice(); } };
}
const memberChips = (host, initial, o) => chipInput(host, initial, {list: 'pt-mnames', find: findMember, sub: memberSub, load: loadMembers,
  title: (hit) => hit ? [hit.name, memberSub(hit)].filter(Boolean).join(' · ') : '헤임달에 등록되지 않은 사람입니다', ...o});
const ownersInput = (host, initial) => memberChips(host, initial, {main: '주 담당자', note: '맨 앞 사람이 <b>주 담당자</b>입니다. 이름을 클릭하면 주 담당자로 지정됩니다. <span class="err">빨간 이름</span>은 헤임달에 등록되지 않은 사람입니다.'});
const ownersLine = owners => owners.length ? owners.map((o, i) => `${i === 0 ? '<span class="main-badge">주 담당자</span> ' : ''}${esc(o)}`).join(' · ') : '—';

/* ---------- 창 ---------- */
function modal(content) {
  const m = $('#modal'); m.innerHTML = content; m.dataset.dirty = ''; m.showModal();
  m.oninput = ev => { if (!ev.target.matches('[type=search], [data-nodirty]')) m.dataset.dirty = '1'; };
  const leave = async () => { if (!m.dataset.dirty || await askLeave()) { m.dataset.dirty = ''; m.close(); } };
  m.oncancel = ev => { if (m.dataset.dirty) { ev.preventDefault(); leave(); } };
  m.querySelectorAll('[data-cancel]').forEach(b => b.addEventListener('click', leave));
}
// 확인 대기 선택지 (11-01) — 후보 이름·별칭과 겹치는 엔티티만 「추천」으로 (전엔 종류만 맞으면 전부 나와 IP 후보마다 축구 인물이 뜸)
const nameHits = (texts, pool) => { const ts = texts.flatMap(t => String(t || '').split(/[·,/()\[\]|]|\s+(?:및|등|과|와)\s+/)).map(normCo).filter(t => t.length >= 2);
  return ts.length ? pool.filter(e => [e.name, e.en, ...(e.aliases || [])].some(x => { const n = normCo(x || ''); return n.length >= 2 && ts.some(t => t === n || (n.length >= 3 && t.includes(n)) || (t.length >= 3 && n.includes(t))); })) : []; };
function companyOptions(selected, hint) {
  const es = entities().filter(e => e.type !== 'IP·유명인').sort((a, b) => a.name.localeCompare(b.name, 'ko')), hits = hint ? nameHits(hint, es) : [];
  const opt = e => `<option value="${e.id}" ${e.id === selected ? 'selected' : ''}>${esc(e.name)}${e.en ? ' · ' + esc(e.en) : ''} (${esc(e.type)})</option>`;
  return hits.length ? `<optgroup label="이름이 비슷한 회사">${hits.map(opt).join('')}</optgroup><optgroup label="전체">${es.filter(e => !hits.includes(e)).map(opt).join('')}</optgroup>` : es.map(opt).join('');
}
function linkModal(c) {
  modal(`<form id="link-form"><h2>회사 연결</h2><p>${esc(c.name)} 님의 소속 회사를 선택하세요. 연결하면 회사 상세의 「등록된 담당자」에도 표시됩니다.</p><label>회사 찾기<input id="link-find" type="search" autocomplete="off" placeholder="이름·영문명·별칭"></label><label>회사<select id="link-select" size="8" required>${companyOptions(c.parentId)}</select></label><div id="link-error" style="color:#ba775e;margin-top:12px;font-size:12px" role="alert"></div><p style="font-size:12px">목록에 없으면 「엔티티 등록」으로 회사를 먼저 등록한 뒤 연결하세요.</p><div class="modal-actions">${c.parentId ? '<button class="button" type="button" id="link-clear">연결 해제</button>' : ''}<button class="button" type="button" data-cancel>취소</button><button class="button primary" type="submit">이 회사로 연결</button></div></form>`);
  $('#link-find').oninput = ev => { const q = ev.target.value.toLowerCase(); [...$('#link-select').options].forEach(o => { const e = byId(o.value); o.hidden = !!q && ![e.name, e.en, ...e.aliases].filter(Boolean).join(' ').toLowerCase().includes(q); }); $('#link-error').textContent = [...$('#link-select').options].some(o => !o.hidden) ? '' : '찾는 회사가 없습니다. 「엔티티 등록」으로 먼저 등록해 주세요.'; };
  const prevOrg = c.parentId ? byId(c.parentId) : null;
  const go = async org => { if (!await save(c.id, {parentId: org ? org.id : null, agencyText: org ? org.name : ''})) return; $('#modal').dataset.dirty = ''; $('#modal').close(); render(); openDetail(c.id);
    toast(org ? `${c.name} 님을 ${org.name}에 연결했습니다.` : `${c.name} 님의 회사 연결을 해제했습니다.`, {fn: async () => { if (!await save(c.id, {parentId: prevOrg ? prevOrg.id : null, agencyText: prevOrg ? prevOrg.name : ''})) return; render(); openDetail(c.id); toast('실행을 취소했습니다.'); }}); };
  $('#link-clear')?.addEventListener('click', () => go(null));
  $('#link-form').onsubmit = ev => { ev.preventDefault(); const org = byId($('#link-select').value); if (!org) { $('#link-error').textContent = '연결할 회사를 선택해 주세요.'; return; } go(org); };
}
function contactEditModal(c) {
  // 11-08 연락처 잠금: 연락처 칸은 볼 수 있는 분(승인권자·승인받은 분 · 직접 올린 분은 자기 값)만 고친다 — pt_contact_set_channels
  const p = priv[c.id] || {}, own = (p.cards || []).find(k => k.mine)?.fields || {}, ch = p.can_see ? (p.channels || {}) : {mobile: own.mobile, office_phone: own.phone || own.office_phone, email: own.email, address: own.address, web: own.web};
  const canCh = p.can_see || (p.cards || []).some(k => k.mine);
  const CHF = [['mobile', '휴대폰'], ['office_phone', '전화'], ['email', '이메일'], ['address', '주소'], ['web', '웹사이트']];
  modal(`<form id="ce-form"><h2>연락처 수정</h2><p>이름·직함·관계 근거는 전 직원에게 공유되며 변경 이력이 기록됩니다.</p><label>이름 *<input id="ce-name" required maxlength="50" value="${esc(c.name)}"></label><label>직함 · 부서<input id="ce-role" maxlength="100" value="${esc(c.role)}"></label>${canCh ? CHF.map(([k, l]) => `<label>${l}<input data-ce-ch="${k}" maxlength="200" value="${esc(ch[k] || '')}"></label>`).join('') + `<p class="lock-note">${p.can_see ? '연락처는 승인권자와 승인받은 분만 봅니다.' : '직접 올린 명함의 연락처를 고칩니다.'}</p>` : '<p class="lock-note">🔒 연락처는 열람 승인을 받은 뒤 고칠 수 있습니다.</p>'}<label>관계 근거<input id="ce-rel" maxlength="200" value="${esc(c.rel)}"></label><div class="field"><span class="flabel">내부 담당자</span><div id="ce-owners"></div></div><div id="ce-error" style="color:#ba775e;margin-top:14px;font-size:12px" role="alert"></div><div class="modal-actions"><button class="button" type="button" data-cancel>취소</button><button class="button primary" type="submit">변경 저장</button></div></form>`);
  const owners = ownersInput($('#ce-owners'), c.owners);
  $('#ce-form').onsubmit = async ev => {
    ev.preventDefault(); const name = $('#ce-name').value.trim(); if (!name) { $('#ce-error').textContent = '이름을 입력해 주세요.'; return; }
    if (!await save(c.id, {name, role: $('#ce-role').value.trim(), rel: $('#ce-rel').value.trim(), owners: owners.value()})) return;
    if (canCh) { const f = {}; $$('[data-ce-ch]').forEach(i => { if ((ch[i.dataset.ceCh] || '') !== i.value.trim()) f[i.dataset.ceCh] = i.value.trim(); });
      if (Object.keys(f).length) { if (f.office_phone !== undefined) f.phone = f.office_phone; const { error } = await SB.rpc('pt_contact_set_channels', {p_contact: c.id, f}); if (error) return toast('연락처를 저장하지 못했습니다: ' + error.message); delete priv[c.id]; } }
    $('#modal').close(); render(); openDetail(c.id); toast('연락처를 수정했습니다.');
  };
}
function entityModal(e) {
  modal(`<form id="entity-form"><h2>${e ? '엔티티 수정' : '새 엔티티 등록'}</h2><p>저장한 내용은 전 직원에게 공유되며, 변경 이력이 기록됩니다.</p><div class="img-field"><span id="img-preview">${avatar(e || {initial: '+', color: 'gray'})}</span><div><label for="entity-img" style="margin-top:0">프로필 이미지</label><input id="entity-img" type="file" accept="image/png,image/jpeg,image/webp"><button class="text-btn" type="button" id="img-clear" ${e?.img ? '' : 'hidden'}>이미지 삭제</button><small><b>권장 크기: 정사각형 500×500px 이상</b> (PNG·JPG, 15MB 이하)<br>로고 또는 인물 사진을 사용해 주세요. 정사각형이 아니면 가운데 부분을 잘라 240×240px로 저장합니다.</small></div></div><label>한글 이름 *<input id="entity-name" required maxlength="50" value="${esc(e?.name || '')}" placeholder="예: 분데스리가"></label><label>영문 이름<input id="entity-en" maxlength="80" value="${esc(e?.en || '')}" placeholder="예: BUNDESLIGA"></label><label>유형<select id="entity-type">${TYPES.map(t => `<option ${e?.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select></label><label>별칭 <input id="entity-alias" maxlength="200" value="${esc(e?.aliases.join(', ') || '')}" placeholder="쉼표로 구분해 주세요"></label><label>관계 근거 <input id="entity-rel" maxlength="200" value="${esc(e?.rel || '')}" placeholder="예: 골포스트 공식 미디어 파트너"></label><div class="field"><span class="flabel">내부 담당자</span><div id="entity-owners"></div></div><label id="parent-field">소속 회사<select id="entity-parent"><option value="">(없음)</option>${all.filter(x => HOLDERS.includes(x.type) && !x.hidden && x.id !== e?.id).sort((a, b) => a.name.localeCompare(b.name, 'ko')).map(x => `<option value="${x.id}" ${x.id === e?.parentId ? 'selected' : ''}>${esc(x.name)}${x.en ? ' · ' + esc(x.en) : ''}</option>`).join('')}</select></label><div class="field" id="kids-field"><span class="flabel">운영 브랜드 · 연결 엔티티</span><div id="entity-kids"></div></div><div id="form-error" style="color:#ba775e;margin-top:15px;font-size:12px" role="alert"></div><div class="modal-actions"><button class="button" type="button" data-cancel>취소</button><button class="button primary" type="submit">${e ? '변경 저장' : '엔티티 등록'}</button></div></form>`);
  let pending; // undefined = 그대로 · null = 지움 · Blob = 새 이미지
  const owners = ownersInput($('#entity-owners'), e?.owners || []);
  const kids = kidsInput($('#entity-kids'), e);
  const syncType = () => { const h = HOLDERS.includes($('#entity-type').value); $('#kids-field').hidden = !h; $('#parent-field').hidden = h; };
  $('#entity-type').onchange = syncType; syncType();
  const show = src => { $('#img-preview').innerHTML = avatar({...(e || {initial: '+', color: 'gray'}), img: src || ''}); $('#img-clear').hidden = !src; };
  $('#entity-img').onchange = async ev => { const f = ev.target.files[0]; if (!f) return; if (f.size > 15e6) { $('#form-error').textContent = '15MB 이하 이미지를 선택해 주세요.'; return; } try { const r = await resize(f, 240, .85, true); pending = r.blob; show(r.url); $('#form-error').textContent = ''; } catch { $('#form-error').textContent = '이미지를 열 수 없습니다. PNG·JPG 파일을 선택해 주세요.'; } };
  $('#img-clear').onclick = () => { pending = null; $('#entity-img').value = ''; show(''); };
  $('#entity-form').onsubmit = async ev => {
    ev.preventDefault();
    const name = $('#entity-name').value.trim(), en = $('#entity-en').value.trim(), aliases = $('#entity-alias').value.split(',').map(s => s.trim()).filter(Boolean), rel = $('#entity-rel').value.trim(), type = $('#entity-type').value;
    if (!name) { $('#form-error').textContent = '한글 이름을 입력해 주세요.'; return; }
    const terms = [name, en, ...aliases].filter(Boolean).map(s => s.toLowerCase());
    if (all.some(x => x.id !== e?.id && [x.name, x.en, ...x.aliases].filter(Boolean).some(s => terms.includes(s.toLowerCase())))) { $('#form-error').textContent = '이름 또는 별칭이 같은 엔티티가 이미 있습니다. 기존 엔티티를 확인해 주세요.'; return; }
    const btn = $('#entity-form [type=submit]'); btn.disabled = true;
    try {
      const patch = {name, en: en.toUpperCase(), type, aliases, rel, owners: owners.value()};
      if (!HOLDERS.includes(type)) { const pid = $('#entity-parent').value || null; if (pid !== (e?.parentId || null)) { patch.parentId = pid; patch.agencyText = pid ? byId(pid).name : ''; } }
      if (pending === null) patch.img = '';
      else if (pending) patch.img = await upload(pending, 'profiles');
      const id = e ? e.id : 'e-' + uid().slice(0, 12);
      const done = await save(id, e ? patch : {...patch, first: today(), last: today()}, !e);
      if (!done) return;
      if (HOLDERS.includes(type) && !await kids.apply(done)) return;
      $('#modal').close(); render(); openDetail(id); toast(e ? '엔티티 정보를 수정했습니다.' : '엔티티를 등록했습니다.');
    } catch { $('#form-error').textContent = '이미지를 업로드하지 못했습니다. 다시 시도해 주세요.'; }
    finally { btn.disabled = false; }
  };
}

/* 운영 브랜드 · 연결 엔티티 입력 — 유형·한글·영문 이름을 넣고 추가. 이미 있는 엔티티는 연결, 없으면 저장할 때 새로 등록 */
function kidsInput(host, e) {
  const orig = e ? kidsOf(e).map(k => k.id) : [];
  let rows = e ? kidsOf(e).map(k => ({id: k.id, name: k.name, en: k.en, type: k.type})) : [];
  host.innerHTML = `<div class="kid-list"></div><div class="kid-add"><select id="kid-type" aria-label="유형">${KID_TYPES.map(t => `<option>${t}</option>`).join('')}</select><input id="kid-name" maxlength="50" placeholder="한글 이름"><input id="kid-en" maxlength="80" placeholder="영문 이름"><button type="button" class="button" id="kid-add">추가</button></div><small class="atnote">예) 브랜드 · 내셔널지오그래픽 어패럴 · NATIONAL GEOGRAPHIC APPAREL — 이미 등록된 엔티티는 그대로 연결하고, 없으면 저장할 때 새로 등록합니다. 왼쪽 이미지 영역을 클릭하면 로고 이미지를 등록할 수 있습니다(정사각형 500×500px 이상 권장).</small>`;
  const list = host.querySelector('.kid-list');
  const draw = () => {
    list.innerHTML = rows.map((r, i) => { const cur = r.id && byId(r.id);
      const logo = r.logo ? `<span class="entity-avatar has-img"><img src="${r.logo.url}" alt=""></span>` : cur && cur.img ? avatar(cur) : '<span class="kid-logo-empty">로고<br>등록</span>';
      return `<div class="kid-row${r.id ? '' : ' new'}"><label class="kid-logo" title="${esc(r.name)} 로고 이미지 등록 (정사각형 권장)">${logo}<input type="file" accept="image/png,image/jpeg,image/webp" data-logo="${i}" hidden></label><div class="kid-name"><b>${esc(r.name)}</b><small>${esc(r.type)}${r.en ? ' · ' + esc(r.en) : ''}</small></div>${r.id ? (r.moveFrom ? `<span class="kid-tag" title="${esc(r.moveFrom)}에서 이 회사로 소속이 변경됩니다">소속 변경</span>` : '') : '<span class="kid-tag">새로 등록</span>'}<button type="button" class="kid-x" data-i="${i}" aria-label="${esc(r.name)} 연결 해제">×</button></div>`; }).join('') || '<p class="atnote" style="margin:4px 0">연결된 엔티티가 없습니다.</p>';
    list.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { rows.splice(+b.dataset.i, 1); draw(); });
    list.querySelectorAll('[data-logo]').forEach(inp => inp.onchange = async ev => {      // 로고 — 프로필 이미지와 같이 240px 정사각형으로
      const f = ev.target.files[0]; if (!f) return;
      if (f.size > 15e6) return toast('15MB 이하 이미지를 선택해 주세요.');
      try { rows[+inp.dataset.logo].logo = await resize(f, 240, .85, true); draw(); } catch { toast('이미지를 열 수 없습니다. PNG·JPG 파일을 선택해 주세요.'); }
    });
  };
  const same = (a, b) => !!a && !!b && normCo(a) === normCo(b);
  const add = () => {
    const name = $('#kid-name').value.trim(), en = $('#kid-en').value.trim(); if (!name && !en) return;
    const hit = all.find(x => !isContact(x) && x.id !== e?.id && [x.name, x.en, ...x.aliases].some(s => same(s, name) || same(s, en)));
    if (hit ? rows.some(r => r.id === hit.id) : rows.some(r => same(r.name, name || en))) { $('#kid-name').value = $('#kid-en').value = ''; return; }
    rows.push(hit ? {id: hit.id, name: hit.name, en: hit.en, type: hit.type, moveFrom: hit.parentId && hit.parentId !== e?.id ? agencyOf(hit) : ''}
                  : {name: name || en, en: en.toUpperCase(), type: $('#kid-type').value});
    $('#kid-name').value = $('#kid-en').value = ''; $('#kid-name').focus(); draw();
  };
  let composing = false, wantAdd = false;      // 한글 조합 중 Enter 는 조합이 끝난 뒤에 추가 (헤임달과 같은 처리)
  ['#kid-name', '#kid-en'].forEach(sel => { const inp = host.querySelector(sel);
    inp.addEventListener('compositionstart', () => { composing = true; });
    inp.addEventListener('compositionend', () => { composing = false; if (wantAdd) { wantAdd = false; add(); } });
    inp.onkeydown = ev => { if (ev.key !== 'Enter') return; ev.preventDefault(); if (composing || ev.isComposing || ev.keyCode === 229) { wantAdd = true; return; } add(); }; });
  host.querySelector('#kid-add').onclick = add;
  draw();
  return {
    async apply(p) {         // 회사를 저장한 뒤 — 새로 등록 · 소속 변경 · 연결 해제 (하나하나 변경 기록에 남음)
      add();
      for (const r of rows) {
        const img = r.logo ? await upload(r.logo.blob, 'profiles') : null;
        if (!r.id) { if (!await save('e-' + uid().slice(0, 12), {name: r.name, en: r.en, type: r.type, parentId: p.id, agencyText: p.name, owners: p.owners, facts: [`${p.name} 연결 엔티티로 등록 ${today()}`], first: today(), last: today(), ...(img ? {img} : {})}, true)) return false; }
        else { const patch = {...(byId(r.id)?.parentId !== p.id ? {parentId: p.id, agencyText: p.name} : {}), ...(img ? {img} : {})};
          if (Object.keys(patch).length && !await save(r.id, patch)) return false; }
      }
      for (const id of orig) if (!rows.some(r => r.id === id)) { if (!await save(id, {parentId: null, agencyText: ''})) return false; }
      return true;
    }
  };
}

/* ---------- 명함으로 연락처 등록 ---------- */
const normCo = s => String(s || '').toLowerCase().replace(/\(주\)|㈜|주식회사|\binc\.?|\bco\.?,?\s*ltd\.?|\bltd\.?|\bcorp\.?|[\s.,·()\-]/g, '');
function matchCompany(...names) {
  const ns = names.map(normCo).filter(n => n.length >= 2); if (!ns.length) return null;
  const es = entities().filter(e => e.type !== 'IP·유명인');
  return es.find(e => [e.name, e.en, ...e.aliases].some(x => ns.includes(normCo(x))))
      || es.find(e => [e.name, e.en, ...e.aliases].map(normCo).filter(x => x.length >= 2).some(x => ns.some(n => n.includes(x) || x.includes(n)))) || null;
}
const domainOf = em => (em || '').toLowerCase().includes('@') ? em.toLowerCase().split('@').pop().trim() : '';
function matchByDomain(email) {          // 회사명이 없는 명함 — 이메일 도메인이 같은 담당자의 회사 (공용 메일 제외)
  const d = domainOf(email); if (!d || PUBLIC_MAIL.has(d)) return null;
  const c = contacts().find(x => x.parentId && x.points.some(p => domainOf(p) === d));
  return c ? byId(c.parentId) : null;
}
async function waitAsk(id, onTick, limitSec = 120) {
  const t0 = Date.now();
  while ((Date.now() - t0) / 1000 < limitSec) {
    await new Promise(r => setTimeout(r, 1500));
    onTick?.(Math.round((Date.now() - t0) / 1000));
    const { data } = await SB.from('pt_ask').select('status,answer,result,entity_ids').eq('id', id).single();
    if (data && (data.status === 'done' || data.status === 'fail')) return data;
  }
  return null;
}
/* ---------- 사용 매뉴얼 (11-03 홍석진 대표님 「궁니르 쓰는 법 매뉴얼 … hr 시스템에 올린 거 참조 … 이그드라실도 같이」) ----------
   본문은 web/manual/<앱>.md → build_web.py 가 manual.md 로 함께 올린다. 「매뉴얼에 물어보기」는 pt_ask(kind manual_<앱>) → 궁니르 봇이 매뉴얼 내용으로만 답 */
const MAN_EX = APP === 'gungnir' ? ['파트너 추천을 다시 받고 싶습니다', '작업 취소를 잘못 눌렀습니다', '수신사를 변경하고 싶습니다', '제안서를 PPTX로 받을 수 있나요?']
  : ['비밀번호를 잊어버렸습니다', '명함으로 연락처를 등록하는 방법', '관계 단계는 누가 변경하나요?', '헤임달 미팅은 어떻게 연동되나요?'];
const man = {md: '', err: '', answer: '', busy: false};
const mdInline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
function manDoc(md) {
  const toc = [], out = [], lines = String(md || '').split(/\r?\n/);
  let list = '', table = [];
  const flush = () => {
    if (list) { out.push(`</${list}>`); list = ''; }
    if (table.length) {
      const [head, ...rows] = table.filter(r => !/^\|[\s:|-]+\|$/.test(r)).map(r => r.replace(/^\||\|$/g, '').split('|').map(c => mdInline(c.trim())));
      out.push(`<div class="table-wrap"><table class="man-t"><thead><tr>${head.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      table = [];
    }
  };
  for (const raw of lines) {
    const ln = raw.trim();
    if (ln.startsWith('|')) { if (list) { out.push(`</${list}>`); list = ''; } table.push(ln); continue; }
    if (table.length) flush();
    let m;
    if ((m = ln.match(/^(#{1,3})\s+(.+)/))) {
      flush();
      if (m[1] === '#') continue;                       // 문서 제목은 화면 제목으로 대신
      if (m[1] === '##') { const id = 'man-' + toc.length; toc.push([id, m[2]]); out.push(`<h2 class="man-h" id="${id}">${mdInline(m[2])}</h2>`); }
      else out.push(`<h3>${mdInline(m[2])}</h3>`);
      continue;
    }
    const ol = ln.match(/^\d+\.\s+(.+)/), ul = ln.match(/^[-•]\s+(.+)/);
    if (ol || ul) {
      const tag = ol ? 'ol' : 'ul';
      if (list !== tag) { if (list) out.push(`</${list}>`); out.push(`<${tag}>`); list = tag; }
      out.push(`<li>${mdInline((ol || ul)[1])}</li>`); continue;
    }
    flush();
    if (!ln) continue;
    out.push(/^대상:/.test(ln) ? `<p class="man-who">${mdInline(ln)}</p>` : `<p>${mdInline(ln)}</p>`);
  }
  flush();
  return {toc, html: out.join('')};
}
function manualView() {
  const d = manDoc(man.md);
  const ask = `<section class="panel ask-panel man-ask"><div class="panel-head"><div><div class="panel-title">매뉴얼에 물어보기</div><p class="panel-caption">매뉴얼 내용으로만 답합니다. ${APP === 'gungnir' ? '제안서·IP 정보' : '회사·담당자 정보'} 등 실제 데이터는 해당 메뉴에서 확인해 주세요.</p></div></div>
    <div class="ask-body"><div class="ask-row"><input id="man-q" type="search" autocomplete="off" placeholder="예: ${esc(MAN_EX[0])}"><button class="button primary" id="man-go" type="button" ${man.busy ? 'disabled' : ''}>질문</button></div>
    <div class="ask-examples">${MAN_EX.map(x => `<button type="button" data-man-ex="${esc(x)}">${esc(x)}</button>`).join('')}</div>
    <div class="ask-answer" id="man-answer" ${man.answer ? '' : 'hidden'}>${man.answer}</div></div></section>`;
  const body = man.err ? `<div class="empty"><p><b>매뉴얼을 불러오지 못했습니다.</b></p><p>${esc(man.err)}</p><p><button class="button" type="button" id="man-retry">다시 불러오기</button></p></div>`
    : !man.md ? '<p class="rm-sum" style="padding:22px">매뉴얼을 불러오는 중입니다<span class="dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></p>'
    : `<details class="man-toc"><summary>목차</summary><ul>${d.toc.map(([id, t]) => `<li><a href="#manual" data-man-go="${id}">${esc(t)}</a></li>`).join('')}</ul></details><article class="man-doc">${d.html}</article>`;
  return ask + `<section class="panel man-panel" style="margin-top:16px">${body}</section>`;
}
async function loadManual() {
  man.err = '';
  try {
    const v = new URL(import.meta.url).searchParams.get('v') || Date.now();
    const r = await fetch(`manual.md?v=${v}`, {cache: 'no-cache'});
    if (!r.ok) throw new Error('파일이 없습니다 (' + r.status + ')');
    man.md = await r.text();
  } catch (e) { man.err = e?.message || ''; }
  if (page === 'manual') render();
}
function manualMount() {
  if (!man.md && !man.err) loadManual();
  $('#man-retry')?.addEventListener('click', () => { man.err = ''; render(); });
  $$('[data-man-go]').forEach(a => a.onclick = ev => { ev.preventDefault(); document.getElementById(a.dataset.manGo)?.scrollIntoView({behavior: 'smooth', block: 'start'}); });
  const go = $('#man-go'); if (!go) return;
  go.onclick = manAsk; $('#man-q').onkeydown = e => { if (e.key === 'Enter' && !e.isComposing) manAsk(); };
  $$('[data-man-ex]').forEach(b => b.onclick = () => { $('#man-q').value = b.dataset.manEx; manAsk(); });
}
async function manAsk() {
  const q = $('#man-q').value.trim(); if (!q || man.busy) return;
  const head = `<p class="muted">질문: ${esc(q)}</p>`, put = h => { const o = $('#man-answer'); if (o) { o.hidden = false; o.innerHTML = h; } };   // 그사이 화면이 다시 그려져도 지금 칸에
  man.busy = true; $('#man-go').disabled = true;
  const step = pc => `${head}<div class="ref-prog wide"><span class="row"><span class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pc}"><i style="width:${pc}%"></i></span><b>${pc}%</b></span><small>${pc < 30 ? '질문을 궁니르 봇에 전달했습니다' : '궁니르 봇이 매뉴얼에서 답변을 찾고 있습니다'}<span class="dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></small></div>`;
  put(step(5));
  try {
    const { data, error } = await SB.from('pt_ask').insert({kind: 'manual_' + APP, question: q}).select('id').single();
    if (error) throw error;
    put(step(20));
    const res = await waitAsk(data.id, s => put(step(Math.min(95, 20 + Math.round(s * 4)))), 90);
    man.answer = head + (!res ? '<div class="warn">궁니르 봇이 응답하지 않습니다. 잠시 후 다시 질문해 주세요. 계속되면 AX팀에 알려 주세요.</div>'
      : res.status === 'done' ? res.answer.split(/\n+/).filter(Boolean).map(x => `<p>${mdInline(x.replace(/^[-•]\s+/, '· '))}</p>`).join('')
      : '<div class="warn">답변을 작성하지 못했습니다. 잠시 후 다시 질문해 주세요.</div>');
  } catch (e) { man.answer = head + `<div class="warn">질문을 보내지 못했습니다: ${esc(e?.message || '')}</div>`; }
  man.busy = false; put(man.answer); const g = $('#man-go'); if (g) g.disabled = false;
}
/* ---------- 관계 그래프 (11-02 홍석진 대표님 「관계 그래프 뷰 PRD E-07」) ----------
   엔티티·담당자를 점, 관계를 선으로. 새 표 없이 화면이 이미 읽은 데이터(pt_entity·pt_relation·pt_directory)로 그린다 → 각 표의 권한(RLS)이 그대로.
   전화·메일·주소는 그래프에 넣지 않는다. 설정은 이 브라우저에만 저장 */
const G_TYPES = ['회사', '브랜드', '기관', 'IP·유명인', '미디어·매체', '미디어·OTT', '판매 채널', '거래처 담당자'];
const G_COLOR = {'회사': '#2f6f5e', '브랜드': '#3b7fc4', '기관': '#7b5ea7', 'IP·유명인': '#d08a1f', '미디어·매체': '#c2577a', '미디어·OTT': '#2a9d8f', '판매 채널': '#8c6d4a', '거래처 담당자': '#98a19e'};
const G_EDGE = {rel: '엔티티 관계', work: '재직', past: '전 소속', parent: '소속 회사'};
const G_EDGE_COLOR = {rel: '#5c6b66', work: '#9fb3aa', past: '#b9a98f', parent: '#c9d2ce'};
const G_KEY = 'pantheon.graph.settings.v1';
const G_DEF = {offTypes: [], offEdges: [], ended: false, sourced: false, orphans: true, contacts: true, labels: true, arrows: false, fade: 1.6, repel: 60, dist: 40, link: 0.6, depth: 1};
const graph = {fg: null, sel: null, near: null, focus: null, set: (() => { try { return {...G_DEF, ...JSON.parse(localStorage.getItem(G_KEY) || '{}')}; } catch { return {...G_DEF}; } })()};
const gSave = () => { try { localStorage.setItem(G_KEY, JSON.stringify(graph.set)); } catch {} };
async function loadForceGraph() {
  if (window.ForceGraph) return;
  await new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/force-graph@1.43.5/dist/force-graph.min.js'; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
}
function graphData() {
  const S = graph.set, today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
  let nodes = all.filter(e => !e.hidden && !S.offTypes.includes(e.type) && (S.contacts || !isContact(e)));
  let ids = new Set(nodes.map(e => e.id));
  const links = [], add = (s, t, kind, label, x = {}) => { if (s && t && s !== t && ids.has(s) && ids.has(t) && !S.offEdges.includes(kind)) links.push({source: s, target: t, kind, label, ...x}); };
  for (const e of nodes) if (e.parentId) add(e.id, e.parentId, isContact(e) ? 'work' : 'parent', isContact(e) ? '재직' : '소속');
  for (const c of nodes) if (isContact(c)) for (const p of rel.dir[c.id]?.past || []) add(c.id, p.entity_id, 'past', '전 소속', {ended: true});
  for (const r of rel.relations) {
    const ended = !!(r.valid_to && r.valid_to < today);
    if ((ended && !S.ended) || (S.sourced && !r.source_url)) continue;
    add(r.subject_id, r.object_id, 'rel', VERB[r.verb] || r.verb, {ended, src: r.source_url || ''});
  }
  if (graph.focus && ids.has(graph.focus)) {   // 이 항목 기준으로 보기 — 1·2단계 이웃만
    const keep = new Set([graph.focus]); let edge = [graph.focus];
    for (let d = 0; d < S.depth; d++) { const nx = []; for (const l of links) for (const [a, b] of [[l.source, l.target], [l.target, l.source]]) if (edge.includes(a) && !keep.has(b)) { keep.add(b); nx.push(b); } edge = nx; }
    nodes = nodes.filter(e => keep.has(e.id)); ids = keep;
  }
  const ls = links.filter(l => ids.has(l.source) && ids.has(l.target)), deg = {};
  ls.forEach(l => { deg[l.source] = (deg[l.source] || 0) + 1; deg[l.target] = (deg[l.target] || 0) + 1; });
  if (!S.orphans) nodes = nodes.filter(e => deg[e.id] || e.id === graph.focus);
  return {nodes: nodes.map(e => ({id: e.id, e, deg: deg[e.id] || 0})), links: ls};
}
const gNeighbors = (data, id) => { const s = new Set([id]); data.links.forEach(l => { const a = l.source.id || l.source, b = l.target.id || l.target; if (a === id) s.add(b); if (b === id) s.add(a); }); return s; };
function graphView() {
  const S = graph.set, cnt = t => all.filter(e => !e.hidden && e.type === t).length;
  const chk = (k, label) => `<label class="g-chk"><input type="checkbox" data-gset="${k}" ${S[k] ? 'checked' : ''}> ${label}</label>`;
  const rng = (k, label, min, max, step) => `<label class="g-rng"><span>${label}</span><input type="range" data-grng="${k}" min="${min}" max="${max}" step="${step}" value="${S[k]}"></label>`;
  return `<div class="g-wrap"><section class="panel g-main">
    <div class="g-bar"><div class="g-search">${icon('search')}<input id="g-q" type="search" list="g-names" placeholder="이름·별칭 검색" aria-label="그래프에서 검색" autocomplete="off"><datalist id="g-names">${all.filter(e => !e.hidden).map(e => `<option value="${esc(e.name)}">`).join('')}</datalist></div>
      <span class="g-count" id="g-count"></span>
      <span id="g-focus"></span></div>
    <div id="g-canvas" class="g-canvas" role="img" aria-label="엔티티·담당자 관계 그래프"><div class="g-loading">그래프를 불러오는 중입니다<span class="dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></div></div>
    <div class="g-legend" role="group" aria-label="유형별 표시">${G_TYPES.map(t => `<button type="button" class="g-lg${S.offTypes.includes(t) ? ' off' : ''}" data-gtype="${esc(t)}" aria-pressed="${!S.offTypes.includes(t)}"><i style="background:${G_COLOR[t]}"></i>${esc(t)} <small>${cnt(t)}</small></button>`).join('')}</div>
  </section>
  <aside class="g-side">
    <section class="panel g-detail" id="g-detail"></section>
    <section class="panel g-set"><details ${isPhone() ? '' : 'open'}><summary>필터</summary>
      <div class="g-sub">선 종류</div>${Object.entries(G_EDGE).map(([k, t]) => `<label class="g-chk"><input type="checkbox" data-gedge="${k}" ${S.offEdges.includes(k) ? '' : 'checked'}> <i class="g-ln g-ln-${k}"></i>${t}</label>`).join('')}
      <div class="g-sub">보기</div>${chk('contacts', '담당자 표시')}${chk('orphans', '연결 없는 항목 표시')}${chk('ended', '종료된 관계 포함')}${chk('sourced', '출처 있는 관계만')}
    </details>
    <details><summary>표시 · 배치 설정</summary>
      ${chk('labels', '이름 표시')}${chk('arrows', '방향 화살표')}${rng('fade', '이름 표시 배율', 0.4, 4, 0.2)}
      ${rng('repel', '반발력', 10, 200, 5)}${rng('dist', '선 길이', 10, 150, 5)}${rng('link', '연결 강도', 0.05, 1, 0.05)}
      <div class="drawer-actions"><button class="button" type="button" id="g-reheat">재배치</button><button class="text-btn" type="button" id="g-reset">설정 초기화</button></div>
    </details></section>
  </aside></div>`;
}
function gDetail() {
  const box = $('#g-detail'); if (!box) return;
  const e = graph.sel && byId(graph.sel);
  if (!e) { box.innerHTML = `<div class="empty"><p>항목을 클릭하면 연결된 회사·IP·담당자가 이곳에 표시됩니다.</p><p class="muted">원이 클수록 연결이 많은 항목입니다. 드래그해 이동하고, 마우스 휠이나 두 손가락으로 확대·축소할 수 있습니다.</p></div>`; return; }
  const data = graph.fg ? graph.fg.graphData() : {links: []};
  const rows = data.links.filter(l => (l.source.id || l.source) === e.id || (l.target.id || l.target) === e.id).map(l => {
    const out = (l.source.id || l.source) === e.id, other = byId(out ? (l.target.id || l.target) : (l.source.id || l.source));
    return other ? {other, txt: l.kind === 'rel' ? (out ? `${l.label} →` : `← ${l.label}`) : l.label, l} : null;
  }).filter(Boolean).sort((a, b) => G_TYPES.indexOf(a.other.type) - G_TYPES.indexOf(b.other.type));
  const d = rel.dir[e.id] || {}, st = rel.state[e.id] || {};
  const info = isContact(e)
    ? [['회사', d.entity_name || agencyOf(e) || '—'], ['직함', e.role || d.title || '—'], ['마지막 접촉', (d.last_touch || st.last_touch) ? dotDate(d.last_touch || st.last_touch) : '—']]
    : [['종류', e.type], e.en ? ['영문', e.en] : null, e.aliases.length ? ['별칭', e.aliases.slice(0, 6).join(', ')] : null, ['연결', `${rows.length}개`]].filter(Boolean);
  box.innerHTML = `<div class="g-dh"><i style="background:${G_COLOR[e.type]}"></i><div><b>${esc(e.name)}</b><small>${esc(e.type)}</small></div></div>
    ${info.map(([k, v]) => `<div class="detail-row"><span>${k}</span><b>${esc(v)}</b></div>`).join('')}
    <div class="drawer-actions"><button class="button primary" type="button" data-detail="${e.id}">상세 보기</button>${graph.focus === e.id ? '' : `<button class="button" type="button" id="g-focus-go">이 항목 기준으로 보기</button>`}</div>
    ${rows.length ? `<ul class="g-nb">${rows.map(r => `<li><button type="button" data-gsel="${r.other.id}"><i style="background:${G_COLOR[r.other.type]}"></i><span>${esc(r.other.name)}</span><small>${esc(r.txt)}${r.l.ended ? ' · 끝남' : ''}</small></button>${r.l.src ? `<a href="${esc(r.l.src)}" target="_blank" rel="noopener" title="출처">출처</a>` : ''}</li>`).join('')}</ul>` : '<p class="muted">연결된 항목이 없습니다. 상세 화면에서 소속 회사나 관계를 추가하면 연결됩니다.</p>'}`;
  $$('#g-detail [data-detail]').forEach(b => b.onclick = () => openDetail(b.dataset.detail));
  $$('#g-detail [data-gsel]').forEach(b => b.onclick = () => gSelect(b.dataset.gsel, true));
  const f = $('#g-focus-go'); if (f) f.onclick = () => { graph.focus = e.id; gRefresh(true); };
}
function gFocusChip() {
  const el = $('#g-focus'); if (!el) return;
  const f = graph.focus && byId(graph.focus);
  el.innerHTML = f ? `<span class="g-fchip"><b>${esc(f.name)}</b> 기준 <span class="seg-mini" role="group" aria-label="단계">${[1, 2].map(n => `<button type="button" data-gdepth="${n}" class="${graph.set.depth === n ? 'on' : ''}" aria-pressed="${graph.set.depth === n}">${n}단계</button>`).join('')}</span><button type="button" class="text-btn" id="g-all">전체 보기</button><button type="button" class="text-btn" id="g-link">링크 복사</button></span>` : '';
  $$('[data-gdepth]').forEach(b => b.onclick = () => { graph.set.depth = Number(b.dataset.gdepth); gSave(); gRefresh(true); });
  const a = $('#g-all'); if (a) a.onclick = () => { graph.focus = null; gRefresh(true); };
  const l = $('#g-link'); if (l) l.onclick = async () => { gHash(); try { await navigator.clipboard.writeText(location.href); toast('이 그래프 링크를 복사했습니다. 슬랙에 붙여 넣으면 같은 화면이 열립니다.'); } catch { toast('복사하지 못했습니다. 주소창의 주소를 복사해 주세요.'); } };
}
// 그래프 주소 공유 (11-03 · PRD E-07) — #graph/<기준 점>/<단계>. 상세의 「그래프에서 보기」와 슬랙에 붙인 링크가 여기로 온다
function graphGo(id) {
  const e = byId(id); if (!e) return toast('그래프에 해당 항목이 없습니다.');
  const d = Number(location.hash.split('/')[2]); if (d === 1 || d === 2) graph.set.depth = d;
  if (graph.set.offTypes.includes(e.type)) graph.set.offTypes = graph.set.offTypes.filter(t => t !== e.type);
  if (isContact(e)) graph.set.contacts = true;
  graph.focus = id; graph.sel = id; gSave(); hideDrawer();
  if (graph.fg && graph.el && graph.el === $('#g-canvas')) { gRefresh(true); setTimeout(() => gSelect(id, true), 900); } else graph.pendingSel = id;
}
function gHash() {   // 기준 점이 바뀌면 주소도 — 뒤로 가기 기록은 남기지 않음
  const h = graph.focus ? `#graph/${graph.focus}/${graph.set.depth}` : '#graph';
  if (location.hash !== h) try { history.replaceState(null, '', h); } catch {}
}
function gSelect(id, move) {
  graph.sel = id; graph.near = graph.fg ? gNeighbors(graph.fg.graphData(), id) : null; gDetail();
  const n = graph.fg?.graphData().nodes.find(x => x.id === id);
  if (move && n && n.x != null) { graph.fg.centerAt(n.x, n.y, 600); graph.fg.zoom(Math.max(graph.fg.zoom(), 2.2), 600); }
}
function gRefresh(refit) {
  if (!graph.fg) return;
  const data = graphData();
  graph.fg.graphData(data);
  if (graph.sel && !data.nodes.some(n => n.id === graph.sel)) graph.sel = null;
  graph.near = graph.sel ? gNeighbors(data, graph.sel) : null;
  $('#g-count').textContent = `점 ${data.nodes.length} · 선 ${data.links.length}`;
  gFocusChip(); gDetail(); if (page === 'graph') gHash();
  if (refit) setTimeout(() => graph.fg?.zoomToFit(500, 40), 700);
}
function gForces() {
  const S = graph.set, fg = graph.fg; if (!fg) return;
  fg.d3Force('charge').strength(-S.repel); fg.d3Force('link').distance(S.dist).strength(S.link);
  fg.linkDirectionalArrowLength(S.arrows ? 4 : 0); fg.d3ReheatSimulation();
}
async function graphMount() {
  const el = $('#g-canvas'); if (!el) return;
  try { await loadForceGraph(); } catch { el.innerHTML = '<div class="g-loading">그래프 도구를 불러오지 못했습니다. 새로고침해 주세요.</div>'; return; }
  if (!$('#g-canvas')) return;
  el.innerHTML = '';
  const S = graph.set, ink = '#202a29';
  graph.el = el;
  const fg = graph.fg = ForceGraph()(el).width(el.clientWidth).height(el.clientHeight).backgroundColor('#fbfcfb')
    .nodeId('id').nodeRelSize(4).nodeVal(n => 1 + n.deg)
    .linkColor(l => { const hl = graph.sel ? ((l.source.id || l.source) === graph.sel || (l.target.id || l.target) === graph.sel) : true; return hl ? G_EDGE_COLOR[l.kind] : '#e6ebe8'; })
    .linkWidth(l => graph.sel && ((l.source.id || l.source) === graph.sel || (l.target.id || l.target) === graph.sel) ? 2 : l.kind === 'rel' ? 1.2 : 0.8)
    .linkLineDash(l => l.kind === 'past' || l.kind === 'parent' || l.ended ? [3, 3] : null)
    .linkDirectionalArrowRelPos(1).linkLabel(l => `${esc(l.label)}${l.ended ? ' · 끝남' : ''}`)
    .nodeLabel(n => `${esc(n.e.name)} · ${esc(n.e.type)}${n.e.en ? ' · ' + esc(n.e.en) : ''}`)
    .nodeCanvasObject((n, ctx, k) => {
      const near = graph.near, dim = near && !near.has(n.id);
      const r = isContact(n.e) ? 2.6 : 3 + Math.sqrt(n.deg) * 1.7;
      ctx.globalAlpha = dim ? 0.18 : 1;
      ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 2 * Math.PI); ctx.fillStyle = G_COLOR[n.e.type] || '#999'; ctx.fill();
      if (n.id === graph.sel || n.id === graph.focus) { ctx.lineWidth = 2 / k; ctx.strokeStyle = ink; ctx.stroke(); }
      if (graph.set.labels && (k >= graph.set.fade || (near && near.has(n.id)) || n.deg >= 8)) {
        const fs = Math.max(11 / k, 2); ctx.font = `${n.id === graph.sel ? 600 : 400} ${fs}px Pretendard, "Malgun Gothic", sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillStyle = ink; ctx.fillText(n.e.name, n.x, n.y + r + 1.5 / k);
      }
      ctx.globalAlpha = 1;
    })
    .nodePointerAreaPaint((n, color, ctx) => { const r = (isContact(n.e) ? 2.6 : 3 + Math.sqrt(n.deg) * 1.7) + 3; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 2 * Math.PI); ctx.fill(); })
    .onNodeClick(n => gSelect(n.id)).onBackgroundClick(() => { graph.sel = null; graph.near = null; gDetail(); })
    .cooldownTicks(200);
  gForces(); gRefresh(); setTimeout(() => graph.fg === fg && fg.zoomToFit(500, 40), 900);
  if (graph.pendingSel) { const id = graph.pendingSel; graph.pendingSel = null; setTimeout(() => graph.fg === fg && gSelect(id, true), 1400); }
  const ro = new ResizeObserver(() => { if (graph.fg === fg && el.isConnected) fg.width(el.clientWidth).height(el.clientHeight); else ro.disconnect(); }); ro.observe(el);
  // 찾기 — 이름·영문·별칭
  const q = $('#g-q'), find = v => { const s = normCo(v); if (!s) return null; const hits = all.filter(e => !e.hidden && [e.name, e.en, ...e.aliases].some(x => x && normCo(x) === s)); return hits[0] || all.find(e => !e.hidden && [e.name, e.en, ...e.aliases].some(x => x && normCo(x).includes(s))); };
  const goFind = () => { const e = find(q.value); if (!e) return toast('그래프에 해당 항목이 없습니다.'); if (!fg.graphData().nodes.some(n => n.id === e.id)) { graph.focus = null; if (graph.set.offTypes.includes(e.type)) graph.set.offTypes = graph.set.offTypes.filter(t => t !== e.type); if (isContact(e)) graph.set.contacts = true; graph.set.orphans = true; gSave(); gRefresh(); render(); return setTimeout(() => gSelect(e.id, true), 1200); } gSelect(e.id, true); };
  q.onkeydown = ev => { if (ev.key === 'Enter') { ev.preventDefault(); goFind(); } };
  q.onchange = () => { if ([...$('#g-names').options].some(o => o.value === q.value)) goFind(); };
  $$('[data-gtype]').forEach(b => b.onclick = () => { const t = b.dataset.gtype, off = graph.set.offTypes; graph.set.offTypes = off.includes(t) ? off.filter(x => x !== t) : [...off, t]; b.classList.toggle('off'); b.setAttribute('aria-pressed', !graph.set.offTypes.includes(t)); gSave(); gRefresh(); });
  $$('[data-gedge]').forEach(c => c.onchange = () => { const k = c.dataset.gedge, off = graph.set.offEdges; graph.set.offEdges = c.checked ? off.filter(x => x !== k) : [...off, k]; gSave(); gRefresh(); });
  $$('[data-gset]').forEach(c => c.onchange = () => { graph.set[c.dataset.gset] = c.checked; gSave(); if (c.dataset.gset === 'arrows') gForces(); else gRefresh(); });
  $$('[data-grng]').forEach(c => c.oninput = () => { graph.set[c.dataset.grng] = Number(c.value); gSave(); if (c.dataset.grng !== 'fade') gForces(); });
  $('#g-reheat').onclick = () => { fg.d3ReheatSimulation(); setTimeout(() => fg.zoomToFit(500, 40), 1200); };
  $('#g-reset').onclick = () => { graph.set = {...G_DEF}; graph.focus = null; gSave(); render(); };
}
/* ---------- 리멤버 가져오기 (11-02 홍석진 대표님 「리멤버에서 끌고 오는 거」) ----------
   리멤버 앱 설정 → 명함 내보내기 → 메일로 받은 엑셀(xls·xlsx·csv)을 올리면 회사별로 묶어 보여 주고, 고른 사람만 주소록에 넣는다.
   같은 메일 주소·같은 회사의 같은 이름은 이미 있음으로 건너뛰고, 그룹사·내부 사람은 기본으로 빼 둔다. 넣기는 웹 등록과 같은 save() — 변경 기록에 남는다 */
const RM_COLS = {name: /^(이름|성명|name|full ?name)$/i, company: /^(회사|회사명|소속|company|organization)$/i, dept: /^(부서|부서명|팀|department)$/i,
  title: /^(직책|직급|직함|직위|title|position)$/i, mobile: /^(휴대폰|휴대전화|핸드폰|모바일|mobile|cell)/i, phone: /^(전화|전화번호|회사전화|유선|tel|phone|office)/i,
  fax: /^(팩스|fax)/i, email: /^(이메일|e-?mail|메일)/i, address: /^(주소|회사주소|address)/i, web: /^(홈페이지|웹사이트|website|url)/i, memo: /^(메모|note|memo)/i};
const RM_INTERNAL = /더올마이티|올마이티|almighty|골포스트|goalpost|사운드스루|soundthrough|루트82|route ?82|슈퍼홀릭|superholics|브룩스글로벌|ouah/i;
const rm = {groups: []};
async function loadXlsx() {
  if (window.XLSX) return;
  await new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
}
function rmParse(rows) {
  const hi = rows.findIndex(r => r.filter(c => Object.values(RM_COLS).some(re => re.test(String(c).trim()))).length >= 2);
  if (hi < 0) return null;
  const head = rows[hi].map(c => String(c).trim()), col = {};
  head.forEach((h, i) => { for (const [k, re] of Object.entries(RM_COLS)) if (col[k] === undefined && re.test(h)) col[k] = i; });
  if (col.name === undefined) return null;
  const v = (r, k) => col[k] === undefined ? '' : String(r[col[k]] ?? '').trim();
  return rows.slice(hi + 1).map(r => ({name: v(r, 'name'), company: v(r, 'company'), dept: v(r, 'dept'), title: v(r, 'title'), mobile: v(r, 'mobile'), phone: v(r, 'phone'),
    fax: v(r, 'fax'), email: v(r, 'email').toLowerCase(), address: v(r, 'address'), web: v(r, 'web'), memo: v(r, 'memo')})).filter(p => p.name);
}
function rmGroup(people) {
  const cs = contacts(), mails = new Set(cs.flatMap(c => (c.points || []).join(' ').toLowerCase().match(/[\w.+-]+@[\w.-]+/g) || []));
  const orgs = entities().filter(e => e.type !== 'IP·유명인'), by = {};
  for (const p of people) { const key = normCo(p.company) || '-'; (by[key] ||= {company: p.company || '', people: []}).people.push(p); }
  return Object.values(by).map(g => {
    const hit = g.company ? orgs.find(e => [e.name, e.en, ...(e.aliases || [])].some(n => n && normCo(n) === normCo(g.company))) : null;
    const internal = RM_INTERNAL.test(g.company) || g.people.some(p => /@(thealmighty|route82|superholics)\./.test(p.email));
    g.people.forEach(p => {
      p.dup = !!((p.email && mails.has(p.email)) || (hit && cs.some(c => c.parentId === hit.id && normCo(c.name) === normCo(p.name))));
      p.on = !p.dup && !internal;
    });
    return {...g, orgId: hit?.id || '', internal};
  }).sort((a, b) => (a.internal - b.internal) || b.people.length - a.people.length);
}
function rememberModal() {
  modal(`<form id="rm-form" class="rm-modal"><h2>리멤버에서 가져오기</h2>
    <p>리멤버 앱 <b>설정 → 명함 내보내기</b>에서 엑셀 파일을 메일로 받은 뒤 이곳에 업로드해 주세요. 회사별로 정리해 보여 드리며, 선택한 사람만 주소록에 등록합니다. 이미 등록된 연락처와 그룹사 명함은 제외합니다.</p>
    <label>엑셀 파일 (xls · xlsx · csv)<input type="file" id="rm-file" accept=".xls,.xlsx,.csv"></label>
    <div id="rm-prog-wrap"></div><div id="rm-body"></div><div id="rm-error" style="color:#ba775e;margin-top:8px;font-size:12px" role="alert"></div>
    <div class="modal-actions"><button class="button" type="button" data-cancel>닫기</button><button class="button primary" type="submit" id="rm-go" disabled>등록</button></div></form>`);
  const body = $('#rm-body'), err = $('#rm-error'), goBtn = $('#rm-go');
  const draw = () => {
    const n = rm.groups.reduce((a, g) => a + g.people.filter(p => p.on).length, 0), total = rm.groups.reduce((a, g) => a + g.people.length, 0);
    body.innerHTML = `<p class="rm-sum">명함 ${total}장 · 회사 ${rm.groups.length}곳 · 등록할 사람 <b>${n}명</b></p><div class="rm-list">${rm.groups.map((g, gi) => `<section class="rm-g${g.internal ? ' internal' : ''}">
      <div class="rm-gh"><b>${esc(g.company || '회사 없음')}</b>${g.internal ? ' <span class="pill">그룹사·내부</span>' : ''}
      <select class="table-select" data-rm-org="${gi}" aria-label="${esc(g.company || '회사 없음')} 연결할 회사"><option value="">${g.company ? '새 회사로 등록' : '회사 없이 등록'}</option>${companyOptions(g.orgId, [g.company])}</select></div>
      <ul>${g.people.map((p, pi) => `<li><label><input type="checkbox" data-rm-p="${gi}|${pi}" ${p.on ? 'checked' : ''} ${p.dup ? 'disabled' : ''}> <b>${esc(p.name)}</b> <span>${esc([p.dept, p.title].filter(Boolean).join(' '))}</span></label><small>${esc(p.email || p.mobile || p.phone || '')}${p.dup ? ' · 주소록 등록됨' : ''}</small></li>`).join('')}</ul></section>`).join('')}</div>`;
    goBtn.disabled = !n; goBtn.textContent = n ? `${n}명 등록` : '등록';
    $$('[data-rm-p]').forEach(c => c.onchange = () => { const [gi, pi] = c.dataset.rmP.split('|').map(Number); rm.groups[gi].people[pi].on = c.checked; draw(); });
    $$('[data-rm-org]').forEach(sl => sl.onchange = () => { rm.groups[Number(sl.dataset.rmOrg)].orgId = sl.value; });
  };
  $('#rm-file').onchange = async ev => {
    const f = ev.target.files[0]; if (!f) return; err.textContent = '';
    body.innerHTML = '<p class="rm-sum">파일을 읽는 중입니다<span class="dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></p>';
    try {
      await loadXlsx();
      const wb = XLSX.read(await f.arrayBuffer(), {type: 'array'}), rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {header: 1, defval: ''});
      const people = rmParse(rows);
      if (!people?.length) { body.innerHTML = ''; err.textContent = '이름 항목을 찾지 못했습니다. 리멤버에서 내보낸 엑셀 파일인지 확인해 주세요.'; return; }
      rm.groups = rmGroup(people); draw();
    } catch (e) { body.innerHTML = ''; err.textContent = '파일을 읽지 못했습니다: ' + (e?.message || ''); }
  };
  $('#rm-form').onsubmit = async ev => {
    ev.preventDefault();
    const todo = rm.groups.map(g => ({g, ps: g.people.filter(p => p.on)})).filter(x => x.ps.length), total = todo.reduce((a, x) => a + x.ps.length, 0);
    if (!total) return;
    goBtn.disabled = true; $$('#rm-form input, #rm-form select').forEach(x => { x.disabled = true; });
    const d = today(), me = myName || ''; let done = 0, made = 0, orgsMade = 0;
    $('#rm-prog-wrap').innerHTML = '<div class="ref-prog rm-prog"><span class="row"><span class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100"><i></i></span><b>0%</b></span><small></small></div>';
    const prog = () => { const pc = Math.round(done / total * 100), w = $('#rm-prog-wrap'); w.querySelector('i').style.width = pc + '%'; w.querySelector('b').textContent = pc + '%'; w.querySelector('small').textContent = `${done} / ${total}명 등록 중`; };
    prog();
    for (const {g, ps} of todo) {
      let org = g.orgId ? byId(g.orgId) : null;
      if (!org && g.company) {
        const web = ps.map(p => p.web).find(Boolean), addr = ps.map(p => p.address).find(Boolean);
        org = await save(uid(), {type: '회사', name: g.company, points: [web, addr].filter(Boolean), owners: me ? [me] : [], facts: [`리멤버에서 가져옴 ${d}`], first: d, last: d}, true);
        if (org) orgsMade++;
      }
      for (const p of ps) {
        const pts = [p.email, p.mobile && '휴대전화 ' + p.mobile, p.phone && '전화 ' + p.phone, p.fax && '팩스 ' + p.fax, p.address].filter(Boolean);
        const c = await save(uid(), {type: '거래처 담당자', name: p.name, role: [p.dept, p.title].filter(Boolean).join(' '), parentId: org?.id || null, agencyText: org?.name || g.company || '',
          points: pts, owners: me ? [me] : [], facts: [`리멤버에서 가져옴 ${d}`, p.memo].filter(Boolean), first: d, last: d}, true);
        if (c) made++;
        done++; prog();
      }
    }
    $('#modal').dataset.dirty = ''; $('#modal').close(); rm.groups = [];
    await loadRel().catch(() => {}); render();
    toast(`리멤버에서 ${made}명을 주소록에 등록했습니다${orgsMade ? ` (새 회사 ${orgsMade}곳)` : ''}.`);
  };
}
function contactModal(pre = {}) {
  const F = [['c-name','이름 *','명함에서 읽은 이름'],['c-title','직함 · 부서',''],['c-company','회사명 (명함 표기)',''],['c-email','이메일',''],['c-phone','사무실 전화',''],['c-mobile','휴대전화',''],['c-address','주소',''],['c-web','웹사이트','']];
  modal(`<form id="contact-form"><h2>연락처 등록</h2><p>명함 사진을 업로드하면 궁니르 봇이 내용을 자동으로 입력합니다(약 20~40초). 저장 전에 내용을 확인해 주세요. 명함 이미지도 함께 저장됩니다.</p><label>명함 이미지<input id="c-card" type="file" accept="image/*" capture="environment"></label><div id="c-preview" hidden><img id="c-img" alt="업로드한 명함" style="width:100%;max-height:220px;object-fit:contain;border:1px solid #e4eae4;border-radius:7px;margin-top:10px;background:#fafbfa"></div><p id="c-status" class="ask-note" role="status" style="margin-top:8px"></p>${F.map(([id, l, ph]) => `<label>${l}<input id="${id}" maxlength="200" ${id === 'c-name' ? 'required' : ''} placeholder="${ph}"></label>`).join('')}<label>회사 연결<select id="c-org"><option value="">연결 안 함</option><option value="__new">새 회사로 등록 (입력한 회사명으로)</option>${companyOptions('')}</select></label><label>명함 수령 경로<input id="c-where" maxlength="200" placeholder="예: 10/22 KREAM 미팅 · 모르면 입력하지 않아도 됩니다"></label><label>메모<input id="c-memo" maxlength="300" placeholder="예: 다음 주 샘플 전달 예정"></label><p class="rl-note">연락처는 업무 목적으로만 사용합니다. 이름·회사·직함은 전 직원에게 공유되고, 연락처·명함·메모는 등록한 분과 승인권자만 봅니다. 여러 장은 「명함 올리기」에서 한 번에 올릴 수 있습니다.</p><div id="c-error" style="color:#ba775e;margin-top:14px;font-size:12px" role="alert"></div><div class="modal-actions"><button class="button" type="button" data-cancel>취소</button><button class="button primary" type="submit" id="c-save">연락처 등록</button></div></form>`);
  if (pre.name) { [['c-name', pre.name], ['c-title', pre.role], ['c-company', pre.company], ['c-where', pre.where]].forEach(([id, v]) => { if (v) $('#' + id).value = v; }); const m = (pre.orgId && byId(pre.orgId)) || (pre.company && matchCompany(pre.company)); if (m) $('#c-org').value = m.id; else if (pre.company) $('#c-org').value = '__new'; }
  let cardPath = '';
  const setStatus = s => $('#c-status').textContent = s;
  const autoLink = (email, ...n) => { const m = matchCompany(...n) || matchByDomain(email); if (m) { $('#c-org').value = m.id; return m; } if (n.some(x => x && x.trim())) $('#c-org').value = '__new'; return null; };
  $('#c-company').onchange = () => autoLink($('#c-email').value, $('#c-company').value);
  $('#c-card').onchange = async ev => {
    const f = ev.target.files[0]; if (!f) return; $('#c-error').textContent = '';
    let r; try { r = await resize(f, 1600, .82); } catch { $('#c-error').textContent = '이미지를 열 수 없습니다. JPG·PNG 사진을 선택해 주세요.'; return; }
    $('#c-img').src = r.url; $('#c-preview').hidden = false; $('#c-save').disabled = true;
    try {
      setStatus('명함 이미지를 업로드하는 중입니다…');
      cardPath = await upload(r.blob, 'cards');
      const { data, error } = await SB.from('pt_ask').insert({kind: 'ocr', image_path: cardPath}).select('id').single();
      if (error) throw error;
      const res = await waitAsk(data.id, s => setStatus(`궁니르 봇이 명함을 읽는 중입니다… ${s}초`));
      if (!res) { setStatus(''); $('#c-error').textContent = '궁니르 봇이 2분 안에 응답하지 않았습니다. 명함을 보고 직접 입력해 주세요. 명함 이미지는 저장됩니다.'; return; }
      if (res.status !== 'done' || !res.result) { setStatus(''); $('#c-error').textContent = '명함을 인식하지 못했습니다. 직접 입력해 주세요. 명함 이미지는 저장됩니다.'; return; }
      const v = k => String(res.result[k] || '').trim();
      [['c-name', v('name') || v('name_en')], ['c-title', v('title')], ['c-company', v('company') || v('company_en')], ['c-email', v('email')], ['c-phone', v('phone')], ['c-mobile', v('mobile')], ['c-address', v('address')], ['c-web', v('website')]].forEach(([id, val]) => { if (val && !$('#' + id).value) $('#' + id).value = val; });
      if (v('name_en') && v('name') && !$('#c-memo').value) $('#c-memo').value = '영문 이름: ' + v('name_en');
      const m = autoLink(v('email'), v('company'), v('company_en'));
      setStatus(`명함 내용을 입력했습니다. 내용을 확인해 주세요.${m ? ` 회사는 「${m.name}」로 자동 연결했습니다.` : v('company') ? ' 등록되지 않은 회사여서 새 회사로 등록하도록 선택해 두었습니다.' : ''}`);
    } catch (e) { setStatus(''); $('#c-error').textContent = '명함을 처리하지 못했습니다: ' + (e?.message || '') + ' — 직접 입력해 주세요.'; }
    finally { $('#c-save').disabled = false; }
  };
  $('#contact-form').onsubmit = async ev => {
    ev.preventDefault(); const g = id => $('#' + id).value.trim(); const name = g('c-name'), email = g('c-email');
    if (!name) { $('#c-error').textContent = '이름을 입력해 주세요.'; return; }
    let orgId = $('#c-org').value, org = orgId && orgId !== '__new' ? byId(orgId) : null;
    const dupHit = (await cuMatch({name, email, mobile: g('c-mobile'), company: g('c-company'), org: org?.id || null}))[0], dup = dupHit && byId(dupHit.contact_id);
    if (dup && !$('#contact-form').dataset.dupOk) { $('#c-error').innerHTML = `동일 인물로 보이는 연락처가 이미 있습니다: <b>${esc(dup.name)}</b>${agencyOf(dup) ? ' (' + esc(agencyOf(dup)) + ')' : ''}. 그래도 등록하려면 「연락처 등록」을 한 번 더 눌러 주세요.`; $('#contact-form').dataset.dupOk = '1'; return; }
    if (cardPath && !g('c-where') && !$('#contact-form').dataset.whereOk) {
      const v = await confirmBox({title: '명함을 수령 경로을 적을까요?', body: '어디서 받았는지 남겨 두면 나중에 관계를 확인하기 쉽습니다. 모르면 그대로 저장해도 됩니다.', ok: '모름으로 저장', cancel: '수령 경로 적기'});
      if (v !== true) { $('#c-where').focus(); return; }
      $('#contact-form').dataset.whereOk = '1';
    }
    $('#c-save').disabled = true;
    try {
      if (orgId === '__new') {
        const co = g('c-company'); if (!co) { $('#c-error').textContent = '새 회사로 등록하려면 회사명을 입력해 주세요.'; return; }
        org = matchCompany(co) || await save('e-' + uid().slice(0, 12), {name: co, type: '회사', points: [g('c-web'), g('c-address')].filter(Boolean), facts: ['명함 등록으로 생성 ' + today()], first: today(), last: today()}, true);
        if (!org) return;
      }
      const c = await save('c-' + uid().slice(0, 12), {type: '거래처 담당자', name, role: g('c-title'), parentId: org ? org.id : null, agencyText: org ? org.name : '',
        points: [email, g('c-mobile') && '휴대전화 ' + g('c-mobile'), g('c-phone') && '전화 ' + g('c-phone'), g('c-address'), g('c-web')].filter(Boolean),
        facts: [g('c-memo'), '명함 등록 ' + today()].filter(Boolean), cardImg: cardPath, first: today(), last: today()}, true);
      if (!c) return;
      if (cardPath) await SB.from('pt_card').update({received_where: g('c-where') || '모름'}).eq('contact_id', c.id).eq('image_path', cardPath);
      $('#modal').dataset.dirty = ''; $('#modal').close();
      if (pre.onSaved) { await pre.onSaved(c, org); await loadRel().catch(() => {}); render(); toast(`${name} 님을 주소록에 등록했습니다.`); return; }
      await loadRel().catch(() => {}); go('contacts'); openDetail(c.id); toast(`${name} 님을 주소록에 등록했습니다.`);
    } finally { $('#c-save').disabled = false; }
  };
}

/* ---------- 질문하기 (사무실 PC 궁니르 봇 → Claude) ---------- */
function renderAnswer(text, sources) {
  let html = '', inList = false;
  for (let ln of esc(text).split(/\n/)) {
    ln = ln.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/「([^」]{1,40})」/g, (m, n) => { const e = all.find(x => [x.name, x.en, ...x.aliases].filter(Boolean).some(a => a.toLowerCase() === n.toLowerCase())); return e ? `<button class="ref" type="button" data-open="${e.id}">${n}</button>` : m; }).replace(/\[(\d{1,3})\]/g, '<sup class="cite">$1</sup>');
    if (/^\s*[-•*]\s+/.test(ln)) { if (!inList) { html += '<ul>'; inList = true; } html += `<li>${ln.replace(/^\s*[-•*]\s+/, '')}</li>`; }
    else { if (inList) { html += '</ul>'; inList = false; } if (ln.trim()) html += `<p>${ln}</p>`; }
  }
  return html + (inList ? '</ul>' : '') + srcList(sources);
}
function bindAsk() {
  const btn = $('#ask-btn'); if (!btn) return;
  btn.onclick = ask; $('#ask-input').onkeydown = e => { if (e.key === 'Enter' && !e.isComposing) ask(); };
  $$('[data-ask]').forEach(b => b.onclick = () => { $('#ask-input').value = b.dataset.ask; ask(); });
  $$('#ask-answer [data-open]').forEach(b => b.onclick = () => openDetail(b.dataset.open));
}
async function ask() {
  const q = $('#ask-input').value.trim(); if (!q) return;
  const out = $('#ask-answer'), head = `<p class="muted">질문: ${esc(q)}</p>`;
  out.hidden = false; out.innerHTML = head + '<p class="muted">궁니르 봇이 답변을 작성하는 중입니다…</p>'; $('#ask-btn').disabled = true;
  try {
    const { data, error } = await SB.from('pt_ask').insert({kind: 'ask', question: q}).select('id').single();
    if (error) throw error;
    const res = await waitAsk(data.id, s => { const p = out.querySelector('.muted:last-child'); if (p) p.textContent = `궁니르 봇이 답변을 작성하는 중입니다… ${s}초`; }, 150);
    out.innerHTML = head + (!res ? '<div class="warn">궁니르 봇이 응답하지 않습니다. 잠시 후 다시 질문해 주세요. 계속되면 AX팀에 알려 주세요.</div>'
      : res.status === 'done' ? renderAnswer(res.answer, res.result?.sources) : '<div class="warn">답변을 작성하지 못했습니다. 잠시 후 다시 질문해 주세요.</div>');
  } catch (e) { out.innerHTML = head + `<div class="warn">질문을 전송하지 못했습니다: ${esc(e?.message || '')}</div>`; }
  finally { lastAnswer = out.innerHTML; $('#ask-btn').disabled = false; bindAsk(); }
}

/* ---------- 지식 관리 (11-01 · Phase 3 · sql/019) — 위키 · 연결 관계 · 출처 붙은 답 · 지식 점검 ----------
   위키 수정은 확인 대기(wiki)를 거쳐 관계 담당자가 반영 — 반영할 수 있는 사람이 쓰면 바로 반영(되돌리기 8초) · 봇 초안(distill)도 같은 카드 */
const VERB = {collaborates: '협업', licenses: '라이선스 제공', launches: '출시', exhibits: '전시', sells: '판매', produces: '제작', distributes: '유통', invests: '투자', represents: '대리·매니지먼트', owns: '보유'};
const wikiOf = id => rel.wiki?.[id];
const relsOf = id => (rel.relations || []).filter(r => r.subject_id === id || r.object_id === id);
const canWiki = e => !!e && canRel(e);
const WIKI_TPL = '## 개요\n\n## 협업 이력\n\n## 참고 사항\n';
function mdHtml(md) {
  let html = '', inList = false;
  for (const raw of String(md || '').split(/\n/)) {
    const ln = esc(raw).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\[(\d{1,3})\]/g, '<sup class="cite">$1</sup>'), h = raw.match(/^#{1,3}\s+(.+)/);
    if (h) { if (inList) { html += '</ul>'; inList = false; } html += `<h4>${esc(h[1])}</h4>`; continue; }
    if (/^\s*[-•*]\s+/.test(raw)) { if (!inList) { html += '<ul>'; inList = true; } html += `<li>${ln.replace(/^\s*[-•*]\s+/, '')}</li>`; continue; }
    if (inList) { html += '</ul>'; inList = false; }
    if (raw.trim()) html += `<p>${ln}</p>`;
  }
  return html + (inList ? '</ul>' : '');
}
const safeUrl = u => /^https?:\/\//.test(u || '') ? u : '';
function srcList(list, title = '출처') {
  if (!list?.length) return '';
  return `<div class="kn-src"><small>${title}</small><ol>${list.map((s, i) => { const n = s.n || i + 1, u = safeUrl(s.url), ent = s.entity_id && byId(s.entity_id);
    return `<li value="${n}">${ent && !u ? `<button class="ref" type="button" data-open="${esc(s.entity_id)}">${esc(s.label)}</button>` : u ? `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(s.label)}</a>` : esc(s.label)}</li>`; }).join('')}</ol></div>`;
}
function wikiBlock(e) {
  const w = wikiOf(e.id), pend = rel.review.filter(r => ['wiki', 'distill'].includes(r.kind) && r.target_id === e.id).length;
  return `<div class="detail-block kn-wiki"><div class="rl-head"><h3>위키 ${w ? `<small>${w.version}판 · ${esc(ymd(w.updated_at))}${w.updated_via === 'distill' ? ' · 지식 정리' : ''}</small>` : ''}${w?.confidentiality === 'restricted' ? ' <span class="pill warn">관계 담당자만 열람</span>' : ''}</h3><button class="button" type="button" id="wiki-edit">${icon('plus')} ${w ? '위키 수정' : '위키 작성'}</button></div>
    ${pend ? `<p class="rl-note">검토 중인 수정 ${pend}건 · <button class="text-btn" type="button" id="wiki-pend">확인 대기에서 보기</button></p>` : ''}
    ${w ? `<div class="kn-md">${mdHtml(w.md)}</div>${srcList(w.sources)}` : '<p>등록된 위키가 없습니다. 이 거래처와의 협업 이력과 참고 사항을 정리해 두면 질문 답변의 근거로 활용됩니다.</p>'}</div>`;
}
function relationsBlock(e) {
  const rs = relsOf(e.id), who = id => id === e.id ? `<b>${esc(e.name)}</b>` : `<button class="ref" type="button" data-open="${esc(id)}">${esc(nameOf(id) || '—')}</button>`;
  return `<div class="detail-block"><div class="rl-head"><h3>연결 관계 <small>${rs.length}건</small></h3><button class="button" type="button" id="kr-add">${icon('plus')} 관계 추가</button></div>
    ${rs.length ? `<ul class="kn-rel">${rs.map(r => `<li><span>${who(r.subject_id)} <em>${esc(VERB[r.verb] || r.verb)}</em> ${who(r.object_id)}</span><small>${esc([[r.valid_from, r.valid_to].filter(Boolean).join(' ~ '), r.note].filter(Boolean).join(' · '))}</small>${safeUrl(r.source_url) ? `<a href="${esc(r.source_url)}" target="_blank" rel="noopener">출처</a>` : '<span class="pill warn">출처 없음</span>'}${r.created_by === me?.id || isAdmin ? `<button type="button" class="text-btn" data-kr-del="${r.id}">삭제</button>` : ''}</li>`).join('')}</ul>`
      : '<p>회사·브랜드·IP 사이의 협업·라이선스·매니지먼트·보유 관계를 기록합니다.</p>'}</div>`;
}
function parseSources(text) {
  return String(text || '').split(/\n/).map(l => l.trim()).filter(Boolean).map(l => { const u = (l.match(/https?:\/\/\S+/) || [''])[0]; const label = l.replace(u, '').replace(/[|·\-–]\s*$/, '').trim(); return {label: label || u, url: u}; });
}
function wikiModal(e) {
  const w = wikiOf(e.id), own = canWiki(e);
  modal(`<form id="wk-form" class="kn-form"><h2>${esc(e.name)} 위키 ${w ? '수정' : '작성'}</h2><p>${own ? '저장하면 바로 위키에 반영됩니다. 변경 내용은 버전 이력으로 남습니다.' : '저장하면 확인 대기에 등록되며, 관계 담당자가 반영하면 위키가 수정됩니다.'}</p>
    <label>내용 <small>「## 제목」으로 섹션을 구분합니다. 사실 끝에 [1]처럼 출처 번호를 붙여 주세요.</small><textarea id="wk-md" rows="14">${esc(w?.md || WIKI_TPL)}</textarea></label>
    <label>출처 <small>한 줄에 하나씩 · 「이름 https://…」 (번호는 위에서부터 1, 2, 3…)</small><textarea id="wk-src" rows="4" placeholder="SM 공식 발표 https://…">${esc((w?.sources || []).map(s => [s.label, s.url].filter(Boolean).join(' ')).join('\n'))}</textarea></label>
    ${own ? `<label>열람 범위<select id="wk-conf"><option value="internal" ${w?.confidentiality !== 'restricted' ? 'selected' : ''}>전 직원</option><option value="restricted" ${w?.confidentiality === 'restricted' ? 'selected' : ''}>관계 담당자·DB 관리자만</option></select></label>` : ''}
    <label>변경 내용 <input id="wk-sum" type="text" maxlength="120" placeholder="예: 11월 미팅 내용 추가"></label>
    <div id="wk-err" class="form-err" role="alert"></div>
    <div class="modal-actions"><button class="button" type="button" data-cancel>취소</button><button class="button primary" type="submit">${own ? '위키에 반영' : '확인 대기에 등록'}</button></div></form>`);
  $('#wk-form').onsubmit = async ev => {
    ev.preventDefault(); const btn = ev.submitter; if (btn) btn.disabled = true;
    const { data: rid, error } = await SB.rpc('pt_wiki_propose', {p_entity: e.id, p_md: $('#wk-md').value, p_sources: parseSources($('#wk-src').value), p_conf: own ? $('#wk-conf').value : null, p_summary: $('#wk-sum').value.trim()});
    if (error) { if (btn) btn.disabled = false; $('#wk-err').textContent = error.message; return; }
    if (own) { const r = await SB.rpc('pt_wiki_decide', {p_id: rid, p_status: 'approved', p_note: ''}); if (r.error) { if (btn) btn.disabled = false; $('#wk-err').textContent = r.error.message; return; } }
    $('#modal').dataset.dirty = ''; $('#modal').close(); await relReload(e.id);
    toast(own ? '위키에 반영했습니다.' : '확인 대기에 등록했습니다. 관계 담당자가 반영하면 위키가 수정됩니다.', own ? {fn: async () => { const r = await SB.rpc('pt_wiki_decide', {p_id: rid, p_status: 'pending', p_note: ''}); if (r.error) throw r.error; await SB.rpc('pt_wiki_decide', {p_id: rid, p_status: 'rejected', p_note: '실행 취소'}); await relReload(e.id); toast('실행을 취소했습니다.'); }} : undefined);
  };
}
function relationModal(e) {
  const opts = sel => entities().filter(x => !isContact(x)).sort((a, b) => a.name.localeCompare(b.name, 'ko')).map(x => `<option value="${x.id}" ${x.id === sel ? 'selected' : ''}>${esc(x.name)} · ${esc(x.type)}</option>`).join('');
  modal(`<form id="kr-form" class="kn-form"><h2>관계 추가</h2><p>「누가 · 무엇을 · 누구와」 순서로 입력합니다. 출처가 있으면 함께 입력해 주세요.</p>
    <label>누가<select id="kr-s">${opts(e.id)}</select></label>
    <label>관계<select id="kr-v">${Object.entries(VERB).map(([k, t]) => `<option value="${k}">${t}</option>`).join('')}</select></label>
    <label>누구와 · 무엇을<select id="kr-o"><option value="">선택</option>${opts('')}</select></label>
    <div class="kn-two"><label>시작일<input id="kr-f" type="date"></label><label>종료일<input id="kr-t" type="date"></label></div>
    <label>출처 주소<input id="kr-u" type="url" placeholder="https://…"></label>
    <label>메모<input id="kr-n" type="text" maxlength="200"></label>
    <div id="kr-err" class="form-err" role="alert"></div>
    <div class="modal-actions"><button class="button" type="button" data-cancel>취소</button><button class="button primary" type="submit">관계 저장</button></div></form>`);
  $('#kr-form').onsubmit = async ev => {
    ev.preventDefault(); const s = $('#kr-s').value, o = $('#kr-o').value;
    if (!o || s === o) { $('#kr-err').textContent = '서로 다른 두 엔티티를 선택해 주세요.'; return; }
    const row = {subject_id: s, verb: $('#kr-v').value, object_id: o, valid_from: $('#kr-f').value || null, valid_to: $('#kr-t').value || null, source_url: $('#kr-u').value.trim(), note: $('#kr-n').value.trim()};
    const { error } = await SB.from('pt_relation').insert(row);
    if (error) { $('#kr-err').textContent = /unique|duplicate/i.test(error.message) ? '같은 관계가 이미 있습니다.' : /source_url/.test(error.message) ? '출처 주소는 http로 시작해야 합니다.' : error.message; return; }
    $('#modal').dataset.dirty = ''; $('#modal').close(); await relReload(e.id); toast('관계를 저장했습니다.');
  };
}
function bindKn(e) {
  $('#wiki-edit')?.addEventListener('click', () => wikiModal(e));
  $('#wiki-pend')?.addEventListener('click', () => { closeDrawer(); go('review'); });
  $('#kr-add')?.addEventListener('click', () => relationModal(e));
  $$('[data-kr-del]').forEach(b => b.onclick = async () => {
    const x = (rel.relations || []).find(v => String(v.id) === b.dataset.krDel); if (!x) return;
    const { error } = await SB.from('pt_relation').delete().eq('id', x.id); if (error) return toast('삭제하지 못했습니다: ' + error.message);
    await relReload(e.id);
    toast('관계를 삭제했습니다.', {fn: async () => { const {id, created_by, captured_at, ...row} = x; const r = await SB.from('pt_relation').insert(row); if (r.error) throw r.error; await relReload(e.id); toast('실행을 취소했습니다.'); }});
  });
}
// 위키 바뀌는 내용 — 줄 단위 비교 (지운 줄 · 넣은 줄)
function diffHtml(a, b) {
  const x = String(a || '').split('\n'), y = String(b || '').split('\n'), n = x.length, m = y.length;
  const L = Array.from({length: n + 1}, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = x[i] === y[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out = []; let i = 0, j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && x[i] === y[j]) { out.push(['', x[i]]); i++; j++; }
    else if (j < m && (i >= n || L[i][j + 1] >= L[i + 1][j])) out.push(['add', y[j++]]);
    else out.push(['del', x[i++]]);
  }
  return `<pre class="kn-diff">${out.filter(([k, t]) => k || t.trim()).map(([k, t]) => `<span class="${k}">${k === 'add' ? '+ ' : k === 'del' ? '− ' : '  '}${esc(t)}</span>`).join('\n')}</pre>`;
}
function wikiCard(r) {
  const P = r.payload || {}, e = byId(r.target_id);
  return `<li class="rq-item rq-wide"><div><b>${esc(e?.name || r.title)}</b> <span class="pill">${r.kind === 'distill' ? '지식 정리 초안' : '위키 수정'}</span>${P.summary ? `<small>${esc(P.summary)}</small>` : ''}<small>${r.kind === 'distill' ? esc(P.from || '') : '제안 ' + esc(memberName(P.by) || '직원')} · ${esc(ymd(r.created_at))}</small><details class="kn-diffbox"><summary>변경 내용 보기</summary>${diffHtml(wikiOf(r.target_id)?.md || '', P.md || '')}${srcList(P.sources, '출처')}</details></div>
    <span class="rq-acts">${canWiki(e) ? `<button class="button" type="button" data-kw="${r.id}|rejected">제외</button><button class="button primary" type="button" data-kw="${r.id}|approved">위키에 반영</button>` : '<small>관계 담당자가 반영합니다</small>'}</span></li>`;
}
function bindKw() {
  $$('[data-kw]').forEach(b => b.onclick = async () => {
    const [id, st] = b.dataset.kw.split('|'); b.disabled = true;
    const { error } = await SB.rpc('pt_wiki_decide', {p_id: Number(id), p_status: st, p_note: ''});
    if (error) { b.disabled = false; return toast((st === 'approved' ? '반영하지 못했습니다: ' : '제외하지 못했습니다: ') + error.message); }
    await loadRel(); render();
    toast(st === 'approved' ? '위키에 반영했습니다.' : '제외했습니다.', {fn: async () => { const r = await SB.rpc('pt_wiki_decide', {p_id: Number(id), p_status: 'pending', p_note: ''}); if (r.error) throw r.error; await loadRel(); render(); toast('실행을 취소했습니다.'); }});
  });
}
// 지식 점검 (K-07) — 봇이 매주 월요일 09시에 만든 결과
const KH = [['no_wiki', '위키 없는 활성 거래처', '관계 단계가 있거나 최근 180일 이내에 접촉한 곳'], ['no_source', '출처 없는 사실', '위키·연결 관계·관계 근거에 출처가 없는 곳'],
  ['stale', '90일 접촉 없는 제안 이상 관계', 'R3 이상이며 마지막 접촉 후 90일 경과'], ['no_alias', '별칭 없는 IP', '별칭 사전에 등록된 항목이 없는 IP·유명인']];
async function loadHealth() {
  const { data, error } = await SB.from('pt_health_report').select('*').order('week_of', {ascending: false}).limit(1);
  admin.health = error ? {err: error.message} : (data[0] || {none: true}); render();
}
function healthPanel() {
  if (!admin.health) { setTimeout(loadHealth); return '<div class="empty"><p>지식 점검 결과를 불러오는 중입니다<span class="dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></p></div>'; }
  const h = admin.health;
  if (h.err) return `<div class="notice">결과를 불러오지 못했습니다: ${esc(h.err)}</div>`;
  if (h.none) return '<div class="empty"><p>아직 점검 결과가 없습니다. 궁니르 봇이 매주 월요일 오전 9시에 점검합니다.</p></div>';
  const it = h.items || {};
  return `<div class="quality-grid">${KH.map(([k, t, d]) => `<div class="stat"><div class="stat-label">${t}</div><div class="stat-value">${(it[k] || []).length}<small>곳</small></div><div class="stat-bottom">${d}</div></div>`).join('')}</div>
    <p class="rl-note">${esc(h.week_of)} 주 점검 · ${esc(kst(h.created_at))}</p>
    ${KH.map(([k, t]) => (it[k] || []).length ? `<section class="panel" style="margin-top:12px"><div class="panel-head"><div class="panel-title">${t} <small>${it[k].length}</small></div></div><ul class="rq-list">${it[k].map(x => `<li class="rq-item"><div><b>${esc(x.name)}</b>${x.why ? `<small>${esc(x.why)}</small>` : ''}</div><span class="rq-acts">${byId(x.id) ? `<button class="button" type="button" data-detail="${esc(x.id)}">상세</button>` : ''}</span></li>`).join('')}</ul></section>` : '').join('')}`;
}

/* ---------- Phase 5 (11-01 · sql/021) — 닿는 경로(R-12) · 사내 관심(S-12) · 민감 메모(R-13) · 운영 지표(12장) ---------- */
const canSens = e => isAdmin || (!!e.relOwner && e.relOwner === me?.id);
const PATH_KO = {direct: '등록된 담당자', owner: '관계 담당자', introduced: '소개', former: '예전 소속'};
function pathBlock(e) {
  return `<div class="detail-block"><h3>이 조직과의 연결 경로</h3><div id="kp-paths"><p class="rl-note">경로를 찾는 중입니다<span class="dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></p></div><div id="kp-interest"></div></div>`
    + (canSens(e) ? `<div class="detail-block"><h3>민감 메모 <span class="pill warn">관계 담당자·DB 관리자만</span></h3><textarea id="sens-note" placeholder="다른 직원과 질문 답변에는 보이지 않습니다." aria-label="민감 메모"></textarea><button class="button primary" id="sens-save" type="button">민감 메모 저장</button></div>` : '');
}
async function loadPaths(e) {
  const [pr, ir, sr] = await Promise.all([SB.rpc('pt_paths', {p_entity: e.id}), SB.from('pt_internal_interest').select('*').eq('entity_id', e.id).maybeSingle(),
    canSens(e) ? SB.from('pt_sensitive_note').select('note').eq('entity_id', e.id).maybeSingle() : Promise.resolve({data: null})]);
  if (activeDetail !== e.id) return;
  const host = $('#kp-paths'); if (!host) return;
  const ps = pr.data || [], who = x => x.contact_id && byId(x.contact_id) ? `<button class="ref" type="button" data-open="${esc(x.contact_id)}">${esc(x.via)}</button>` : `<b>${esc(x.via || '—')}</b>`;
  const ours = x => (x.our || []).length ? ` · 당사 ${esc(x.our.join(', '))}` : '';
  host.innerHTML = ps.length ? `<ul class="kn-rel">${ps.map(x => `<li><span><span class="pill">${PATH_KO[x.kind] || x.kind}</span> ${x.kind === 'introduced' ? `당사 직원 → ${who(x)}(${esc(x.via_org || '소속 미상')}) → <b>${esc(e.name)}</b>` : x.kind === 'former' ? `${who(x)} — ${esc(dotDate(x.until))}까지 이 조직 소속, 현재 ${esc(x.now_org || '소속 미상')}` : x.kind === 'owner' ? `<b>${esc(x.via)}</b>` : `${who(x)}${x.title ? ' · ' + esc(x.title) : ''}`}</span><small>${ours(x).replace(/^ · /, '')}</small></li>`).join('')}</ul>`
    : '<p>연결 경로가 없습니다. 명함을 등록하거나 소개 기록(접촉 기록 → 소개)을 등록하면 경로가 표시됩니다.</p>';
  const it = ir.data; $('#kp-interest').innerHTML = it && it.n90 ? `<p class="rl-note">사내 관심 — 최근 30일 미팅 ${it.n30}건 · 90일 ${it.n90}건에서 언급(마지막 ${esc(dotDate(it.last_on))})</p>` : '';
  const ta = $('#sens-note'); if (ta) { ta.value = sr.data?.note || ''; $('#sens-save').onclick = async () => {
    const { error } = await SB.from('pt_sensitive_note').upsert({entity_id: e.id, note: ta.value}); if (error) return toast('저장하지 못했습니다: ' + error.message); toast('민감 메모를 저장했습니다.'); }; }
  host.querySelectorAll('[data-open]').forEach(b => b.onclick = () => openDetail(b.dataset.open));
}
async function loadMetrics() {
  const [m, h] = await Promise.all([SB.rpc('pt_metrics'), SB.from('pt_metric_snapshot').select('week_of,data').order('week_of', {ascending: false}).limit(12)]);
  admin.metrics = m.error ? {err: m.error.message} : {now: m.data, hist: h.data || []}; render();
}
function metricsPanel() {
  if (!admin.metrics) { setTimeout(loadMetrics); return '<div class="empty"><p>운영 지표를 계산하는 중입니다<span class="dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></p></div>'; }
  if (admin.metrics.err) return `<div class="notice">운영 지표를 불러오지 못했습니다: ${esc(admin.metrics.err)}</div>`;
  const items = admin.metrics.now.items || [], hist = admin.metrics.hist;
  const past = (name, w) => (w.data?.items || []).find(x => x.name === name)?.value;
  return `<div class="notice">PRD 12장 성공 지표입니다. 매주 월요일 9시에 기록하며, 운영 3개월 후 다음 단계 전환을 검토할 때 활용합니다.</div>
  <section class="panel"><div class="panel-head"><div class="panel-title">운영 지표 <small>${esc(kst(admin.metrics.now.at))} 기준</small></div><button class="button" type="button" id="metric-reload">${icon('clock')} 다시 계산</button></div>
  <div class="table-wrap"><table><thead><tr><th>영역</th><th>지표</th><th>목표</th><th>지금</th><th>근거</th>${hist.slice(0, 4).map(w => `<th>${esc(dotDate(w.week_of))} 주</th>`).join('')}</tr></thead><tbody>
  ${items.map(x => `<tr><td><span class="pill">${esc(x.area)}</span></td><td>${esc(x.name)}</td><td>${esc(x.target)}</td><td><b>${x.value ?? '—'}</b>${x.value != null ? esc(x.unit) : ''}</td><td><small>${esc(x.value == null && !x.base ? '측정할 기록 없음' : x.base || '')}</small></td>${hist.slice(0, 4).map(w => `<td>${past(x.name, w) ?? '—'}</td>`).join('')}</tr>`).join('')}
  </tbody></table></div></section>`;
}

/* ---------- AI 비용 (11-06 · sql/2026-11-06_ai_usage) — 봇 cost.py 가 남긴 Claude 사용량 · 기능별·날짜별 (금액은 표준 단가 추정) ---------- */
const COST_KO = {ipchart: 'IP 차트', fandom: '팬덤 수집', sourcing: '소싱', hdlink: '헤임달 미팅 연동', relscore: '관계 점수', knowledge: '지식 관리',
  slack: '슬랙 질문·명함', aside: 'Aside 캡처 정리', mailscan: '메일 거래처 수집', '궁니르': '궁니르 기타',
  partners: '파트너 IP 추천', research: '리서치', concepts: '컨셉 설계', build: '원고 작성', image_plan: '이미지 계획', generate: '이미지 생성',
  finalize: '제안서 다시 생성', qa: '자동 검수', analyze_reference: '레퍼런스 학습', page_types: '페이지 종류 정리', aside_task: 'Aside 작업'};
const costName = f => { const [a, b] = String(f || '').split(':'); return b ? '궁니르 · ' + (COST_KO[b] || b) : (COST_KO[a] || a || '기타'); };
const costUsd = v => '$' + (Number(v) || 0).toFixed(Number(v) >= 100 ? 0 : 2);
async function loadCost() {
  const { data, error } = await SB.rpc('pt_ai_cost', {p_days: admin.costDays || 30});
  admin.cost = error ? {err: error.message} : {rows: data || [], at: new Date()}; if (page === 'admin' && admin.tab === 'cost') render();
}
function costPanel() {
  if (!admin.cost) { setTimeout(loadCost); return '<div class="empty"><p>AI 사용 비용을 불러오는 중입니다<span class="dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></p></div>'; }
  if (admin.cost.err) return `<div class="notice">AI 사용 비용을 불러오지 못했습니다: ${esc(admin.cost.err)}</div>`;
  const rows = admin.cost.rows, days = admin.costDays || 30;
  const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
  const sum = a => a.reduce((s, r) => s + Number(r.usd || 0), 0);
  const byDay = {}, byFeat = {};
  rows.forEach(r => { (byDay[r.day] ||= []).push(r); const k = costName(r.feature); byFeat[k] ||= {usd: 0, calls: 0, searches: 0, models: new Set()}; byFeat[k].usd += Number(r.usd || 0); byFeat[k].calls += Number(r.calls || 0); byFeat[k].searches += Number(r.searches || 0); byFeat[k].models.add(String(r.model || '').replace('claude-', '').replace(/-(\d)-(\d)$/, ' $1.$2')); });
  const total = sum(rows), dayKeys = Object.keys(byDay).sort().reverse(), nDays = Math.max(1, dayKeys.length);
  const feats = Object.entries(byFeat).sort((a, b) => b[1].usd - a[1].usd);
  const top = (list) => { const m = {}; list.forEach(r => { const k = costName(r.feature); m[k] = (m[k] || 0) + Number(r.usd || 0); }); return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${esc(k)} ${costUsd(v)}`).join(' · '); };
  return `<div class="notice">Claude API 사용 비용입니다. 표준 단가로 계산한 금액이라 실제 청구액과 조금 다를 수 있습니다. 하루 사용액이 $40을 넘으면 슬랙으로 알림이 갑니다.</div>
  <section class="panel"><div class="panel-head"><div class="panel-title">AI 비용 <small>최근 ${days}일</small></div><div style="display:flex;gap:8px;flex-wrap:wrap">${[7, 30, 90].map(d => `<button class="button ${d === days ? 'primary' : ''}" type="button" data-cost-days="${d}">${d}일</button>`).join('')}<button class="button" type="button" id="cost-reload">${icon('clock')} 새로고침</button></div></div>
  <div class="cost-kpi"><div><span>오늘</span><b>${costUsd(sum(byDay[today] || []))}</b></div><div><span>최근 ${days}일 합계</span><b>${costUsd(total)}</b></div><div><span>하루 평균</span><b>${costUsd(total / nDays)}</b></div></div>
  ${rows.length ? `<h3 class="cost-h">기능별</h3><div class="table-wrap"><table><thead><tr><th>기능</th><th>비용</th><th>비중</th><th>호출</th><th>웹 검색</th><th>모델</th></tr></thead><tbody>
  ${feats.map(([k, v]) => `<tr><td>${esc(k)}</td><td><b>${costUsd(v.usd)}</b></td><td>${total ? Math.round(v.usd * 100 / total) : 0}%</td><td>${v.calls.toLocaleString()}</td><td>${v.searches.toLocaleString()}</td><td><small>${esc([...v.models].join(', '))}</small></td></tr>`).join('')}
  </tbody></table></div>
  <h3 class="cost-h">날짜별</h3><div class="table-wrap"><table><thead><tr><th>날짜</th><th>비용</th><th>많이 쓴 기능</th></tr></thead><tbody>
  ${dayKeys.map(d => `<tr><td>${esc(dotDate(d))}</td><td><b>${costUsd(sum(byDay[d]))}</b></td><td><small>${top(byDay[d])}</small></td></tr>`).join('')}
  </tbody></table></div>` : '<div class="empty"><p>아직 기록이 없습니다. 이그드라실 봇이 AI를 사용하면 1분 안에 표시됩니다.</p></div>'}</section>`;
}

/* ---------- DB 관리 (관리자) — 변경 기록 · 질문 기록 ---------- */
const TABLE_KO = {pt_contact: '주소록', pt_affiliation: '소속', pt_card: '명함', pt_rel_event: '관계 기록', pt_review_queue: '확인 대기', pt_erasure_request: '개인정보 삭제'};
const FIELD_KO = {pipeline:'관계 단계', contact_depth:'관계 깊이', depth_event:'깊이 근거', owned_ip:'당사 IP', rel_owner:'관계 담당자', type:'종류', occurred_on:'날짜', summary:'내용', outcome:'반응', status:'상태', received_where:'명함 수령 경로', mobile:'휴대폰', email:'이메일', title:'직함', trigger_type:'등록 경로', contact_id:'사람', entity_id:'회사', via_contact_id:'소개자', name:'이름', en:'영문 이름', kind:'유형', aliases:'별칭', parent_id:'회사 연결', agency:'소속 / 회사', role:'직함', rel:'관계 근거', points:'연락처', facts:'업무 기록', note:'리서치 노트', sides:'관련 계열사', owners:'내부 담당자', img:'프로필 이미지', card_img:'명함 이미지', first_seen:'최초 확인일', last_seen:'최근 확인일', hidden:'숨김', id:'ID'};
const VIA_KO = {web: '웹', slack: '슬랙', server: '시스템 입력', sql: '시스템 입력'};
const OP_KO = {insert: '등록', update: '수정', delete: '삭제'};
const showVal = (k, v) => { if (v === null || v === undefined || v === '' || (Array.isArray(v) && !v.length)) return '(없음)'; if (k === 'img' || k === 'card_img') return '(이미지)'; if (k === 'parent_id') return byId(v)?.name || v; if (k === 'hidden') return v ? '숨김' : '표시'; if (Array.isArray(v)) return v.join(' / '); return String(v); };
let admin = {tab: 'log', changes: null, asks: null, people: {}, who: '', q: '', err: '', loading: false};
async function loadAdmin() {
  if (admin.loading) return; admin.loading = true; admin.err = ''; render();
  try {
    const [c, a] = await Promise.all([
      SB.from('pt_change').select('*').order('at', {ascending: false}).limit(500),
      SB.from('pt_ask').select('id,at,asker,via,slack_user,kind,question,status').order('at', {ascending: false}).limit(500)]);
    if (c.error) throw c.error; if (a.error) throw a.error;
    admin.changes = c.data; admin.asks = a.data;
    const ids = [...new Set([...c.data.map(x => x.actor), ...a.data.map(x => x.asker)].filter(Boolean))];
    if (ids.length) { const p = await SB.rpc('pt_people', {ids}); (p.data || []).forEach(x => admin.people[x.id] = x); }
  } catch (e) { admin.err = '기록을 불러오지 못했습니다: ' + (e?.message || ''); }
  admin.loading = false; render();
}
const whoName = (id, fallback) => id ? (admin.people[id]?.name || fallback || '이름 확인 불가') : '';
function adminView() {
  if (!isAdmin) return '<div class="notice">DB 관리는 DB 관리자만 볼 수 있습니다.</div>';
  if (!admin.changes && !admin.loading && !admin.err) setTimeout(loadAdmin);
  const tabs = `<div class="tabs" style="margin-bottom:16px">${[['log', '변경 기록'], ['asks', '질문 기록'], ['quality', '데이터 점검'], ['score', '관계 점수 기준'], ['knowledge', '지식 점검'], ['metrics', '운영 지표'], ['cost', 'AI 비용'], ['erase', '개인정보 삭제'], ['bot', '궁니르 봇']].map(([k, t]) => `<button class="tab ${admin.tab === k ? 'active' : ''}" data-admin-tab="${k}">${t}</button>`).join('')}</div>`;
  if (admin.err) return tabs + `<div class="notice">${esc(admin.err)}</div>`;
  if (!admin.changes) return tabs + '<div class="empty"><p>기록을 불러오는 중입니다<span class="dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></p></div>';
  if (admin.tab === 'asks') return tabs + asksPanel();
  if (admin.tab === 'quality') return tabs + qualityPanel();
  if (admin.tab === 'bot') return tabs + botPanel();
  if (admin.tab === 'score') return tabs + scorePanel();
  if (admin.tab === 'knowledge') return tabs + healthPanel();
  if (admin.tab === 'metrics') return tabs + metricsPanel();
  if (admin.tab === 'cost') return tabs + costPanel();
  if (admin.tab === 'erase') return tabs + erasePanel();
  const people = [...new Set(admin.changes.map(x => x.actor || '(화면 밖)'))];
  const list = admin.changes.filter(x => (!admin.who || (x.actor || '(화면 밖)') === admin.who) && (!admin.q || String(x.entity_name).toLowerCase().includes(admin.q.toLowerCase()))).slice(0, 300);
  return tabs + `
  <section class="panel"><div class="panel-head"><div class="panel-title">변경 기록 <small>AUDIT LOG</small> <span class="nav-count">${admin.changes.length}</span></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="button" type="button" id="log-reload">${icon('clock')} 새로고침</button><button class="button" type="button" id="log-export">${icon('download')} 기록 CSV</button></div></div>
  <div class="watch-toolbar"><div style="display:flex;gap:8px;flex-wrap:wrap"><select class="table-select" id="log-who" aria-label="사용자별 보기"><option value="">전체 사용자</option>${people.map(p => `<option value="${esc(p)}" ${admin.who === p ? 'selected' : ''}>${esc(p === '(화면 밖)' ? '시스템 입력' : whoName(p))}</option>`).join('')}</select><input class="table-select" id="log-q" type="search" placeholder="엔티티 이름" value="${esc(admin.q)}" aria-label="엔티티 이름 검색"></div></div>
  <div class="table-wrap"><table><thead><tr><th>일시</th><th>변경자</th><th>엔티티</th><th>변경 대상</th><th>변경 내용 (이전 → 이후)</th><th>조치</th></tr></thead><tbody>${list.map(x => `<tr><td style="white-space:nowrap">${esc(kst(x.at))}</td><td>${x.actor ? esc(whoName(x.actor, x.actor_name)) : `<span class="pill">${esc(VIA_KO[x.via] || x.via)}</span>`}${x.reason ? `<small style="display:block;color:#9aa29d">${esc(x.reason)}</small>` : ''}</td><td>${TABLE_KO[x.table_name] ? `<span class="pill muted">${TABLE_KO[x.table_name]}</span> ` : ''}${byId(x.entity_id) ? `<button class="text-btn" data-detail="${esc(x.entity_id)}">${esc(x.entity_name)}</button>` : esc(x.entity_name)}</td><td><span class="pill">${esc(OP_KO[x.op] || x.op)}</span></td><td style="font-size:12px;line-height:1.6">${x.op === 'insert' ? '<span style="color:#285541">새로 등록</span>' : (x.fields || []).map(k => `<div><b>${esc(FIELD_KO[k] || k)}</b>: <span style="color:#a0563a;text-decoration:line-through">${esc(showVal(k, x.before?.[k]))}</span> → <span style="color:#285541">${esc(showVal(k, x.after?.[k]))}</span></div>`).join('')}</td><td>${x.op === 'update' ? `<button class="text-btn" type="button" data-restore="${x.id}">이전 내용으로 복원</button>` : ''}</td></tr>`).join('') || '<tr><td colspan="6"><div class="empty">기록이 없습니다.</div></td></tr>'}</tbody></table></div></section>`;
}
function asksPanel() {
  const list = admin.asks.slice(0, 300);
  return `<section class="panel"><div class="panel-head"><div class="panel-title">질문 기록 <small>웹·슬랙</small> <span class="nav-count">${admin.asks.length}</span></div></div><div class="table-wrap"><table><thead><tr><th>일시</th><th>요청자</th><th>경로</th><th>내용</th><th>상태</th></tr></thead><tbody>${list.map(a => `<tr><td style="white-space:nowrap">${esc(kst(a.at))}</td><td>${esc(whoName(a.asker) || '—')}</td><td>${a.via === 'slack' ? '슬랙' : '웹'}</td><td>${a.kind === 'ocr' ? '<span class="pill">명함 인식</span>' : a.kind === 'restart' ? '<span class="pill">봇 재시작</span>' : a.kind.startsWith('manual') ? '<span class="pill">매뉴얼</span> ' + esc(a.question) : esc(a.question)}</td><td>${{done: '답변 완료', fail: '실패', wait: '대기', work: '처리 중'}[a.status] || a.status}</td></tr>`).join('') || '<tr><td colspan="5"><div class="empty">아직 질문이 없습니다.</div></td></tr>'}</tbody></table></div></section>`;
}
/* 궁니르 봇 — 상태 보기 · 다시 시작 (헤임달 「처리 서버 → 다시 시작」과 같은 방식, DB 관리자만) */
async function loadBot() {
  const [{ data, error }, a] = await Promise.all([SB.from('pt_bot').select('*').maybeSingle(), SB.from('pt_aside_worker').select('*').maybeSingle()]);
  admin.bot = error ? {err: error.message} : (data || {});
  admin.aside = a.error ? {err: a.error.message} : (a.data || {});
  if (page === 'admin' && admin.tab === 'bot') render();
  return admin.bot;
}
const agoText = sec => sec < 60 ? `${sec}초 전` : sec < 3600 ? `${Math.floor(sec / 60)}분 전` : `${Math.floor(sec / 3600)}시간 전`;
function botPanel() {
  if (!admin.bot) { setTimeout(loadBot); return '<div class="empty"><p>상태를 불러오는 중입니다<span class="dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></p></div>'; }
  const b = admin.bot;
  if (b.err) return `<div class="notice">상태를 불러오지 못했습니다: ${esc(b.err)}</div>`;
  const age = b.beat_at ? Math.max(0, Math.round((Date.now() - new Date(b.beat_at)) / 1000)) : null;
  const alive = age !== null && age < 180;
  const stateText = !b.beat_at ? '기록 없음' : !alive ? '응답 없음' : b.connected ? '정상' : '슬랙 연결 끊김';
  return `<div class="quality-grid"><div class="stat ${alive && b.connected ? 'highlight' : ''}"><div class="stat-label">상태</div><div class="stat-value">${stateText}</div><div class="stat-bottom">${age === null ? '—' : '마지막 응답 ' + agoText(age)}</div></div><div class="stat"><div class="stat-label">시작 시각</div><div class="stat-value" style="font-size:17px">${b.started_at ? esc(kst(b.started_at)) : '—'}</div><div class="stat-bottom">${b.model ? '답변 모델 ' + esc(b.model) : ''}</div></div><div class="stat"><div class="stat-label">웹 요청 처리</div><div class="stat-value">${Number(b.handled || 0)}<small>건</small></div><div class="stat-bottom">시작 이후</div></div></div>
  <section class="panel"><div class="panel-head"><div><div class="panel-title">궁니르 봇 <small>슬랙 질문 · 웹 질문 · 명함 인식</small></div><p class="panel-caption">답변이 오지 않거나 상태가 「응답 없음」이면 재시작해 주세요. 재시작하는 약 20초 동안은 답변이 중단됩니다.</p></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="button" id="bot-reload">${icon('clock')} 새로고침</button><button class="button primary" id="bot-restart">재시작</button></div></div>
  <div id="bot-msg" class="panel-caption" style="padding:0 23px 18px" role="status">${b.last_error ? '최근 오류: ' + esc(b.last_error) : ''}</div></section>${asidePanel()}`;
}
// Aside (서버 PC 의 SNS·이미지 검색) — 원격 일시 정지·다시 시작 (11-04 김현우 「aside 원격으로 켜고 끄는 기능」)
function asidePanel() {
  const a = admin.aside || {};
  if (a.err) return `<section class="panel"><div class="panel-head"><div class="panel-title">Aside</div></div><p class="panel-caption" style="padding:0 23px 18px">상태를 불러오지 못했습니다: ${esc(a.err)}</p></section>`;
  const age = a.beat_at ? Math.max(0, Math.round((Date.now() - new Date(a.beat_at)) / 1000)) : null;
  const alive = age !== null && age < 180;
  const stateText = a.paused ? '일시 정지' : !a.beat_at ? '기록 없음' : !alive ? '응답 없음' : a.busy ? '작업 중' : '대기 중';
  return `<section class="panel"><div class="panel-head"><div><div class="panel-title">Aside <small>SNS·커뮤니티 조사 · 이미지 찾기 · 로그인 유지</small></div>
    <p class="panel-caption">서버 PC의 메모리가 부족하거나 다른 작업을 먼저 처리해야 할 때 일시 정지해 주세요. 진행 중이던 작업은 대기 상태로 돌아가고, 다시 시작하면 이어서 진행합니다.</p></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">${a.paused ? '<button class="button primary" id="aside-resume">다시 시작</button>' : '<button class="button danger" id="aside-pause">일시 정지</button>'}</div></div>
    <div class="quality-grid" style="padding:0 23px 18px"><div class="stat ${a.paused ? '' : alive ? 'highlight' : ''}"><div class="stat-label">상태</div><div class="stat-value">${stateText}</div><div class="stat-bottom">${a.paused ? esc((a.paused_by || '관리자') + ' · ' + (a.paused_at ? kst(a.paused_at) : '')) : age === null ? '—' : '마지막 응답 ' + agoText(age)}</div></div>
    <div class="stat"><div class="stat-label">시작 시각</div><div class="stat-value" style="font-size:17px">${a.started_at ? esc(kst(a.started_at)) : '—'}</div><div class="stat-bottom">${a.host ? esc(a.host) : ''}</div></div></div>
    <div id="aside-msg" class="panel-caption" style="padding:0 23px 18px" role="status">${a.last_error && !a.paused ? '최근 알림: ' + esc(a.last_error) : ''}</div></section>`;
}
async function setAsidePaused(on) {
  const msg = t => { const el = $('#aside-msg'); if (el) el.textContent = t; };
  const btn = $(on ? '#aside-pause' : '#aside-resume'); if (btn) btn.disabled = true;
  const { error } = await SB.rpc('pt_aside_set_paused', {p_paused: on});
  if (error) { if (btn) btn.disabled = false; return msg((on ? '일시 정지하지 못했습니다: ' : '다시 시작하지 못했습니다: ') + error.message); }
  await loadBot(); render();
  toast(on ? 'Aside를 일시 정지했습니다. 10초 안에 서버 PC에서 Aside가 종료됩니다.' : 'Aside를 다시 시작했습니다. 대기 중인 작업부터 이어서 진행합니다.');
}
async function restartBot() {
  const msg = t => { const el = $('#bot-msg'); if (el) el.textContent = t; };
  const before = admin.bot?.started_at || '';
  $('#bot-restart').disabled = true;
  const { data, error } = await SB.from('pt_ask').insert({kind: 'restart', question: '궁니르 봇 재시작'}).select('id').single();
  if (error) { $('#bot-restart').disabled = false; return msg('재시작하지 못했습니다: ' + error.message); }
  const res = await waitAsk(data.id, s => msg(`궁니르 봇에 재시작을 요청했습니다… ${s}초`), 60);
  if (!res) { $('#bot-restart').disabled = false; return msg('궁니르 봇이 응답하지 않습니다. 서버 PC가 켜져 있는지 확인해 주세요. 봇이 꺼져 있으면 5분 이내에 자동으로 재시작됩니다.'); }
  if (res.status === 'fail') { $('#bot-restart').disabled = false; return msg(res.answer || '재시작하지 못했습니다.'); }
  const t0 = Date.now();
  while (Date.now() - t0 < 90000) {
    await new Promise(r => setTimeout(r, 3000));
    msg(`궁니르 봇을 재시작하는 중입니다… ${Math.round((Date.now() - t0) / 1000)}초`);
    const b = await SB.from('pt_bot').select('*').maybeSingle();
    if (b.data?.started_at && b.data.started_at !== before) { admin.bot = b.data; render(); toast('궁니르 봇이 재시작되었습니다.'); return; }
  }
  admin.bot = null; render(); toast('궁니르 봇이 아직 재시작되지 않았습니다. 잠시 후 새로고침해 주세요.');
}
function qualityPanel() {
  const es = entities(), hidden = all.filter(e => e.hidden);
  return `<div class="quality-grid"><div class="stat"><div class="stat-label">담당자 없음</div><div class="stat-value">${es.filter(noContact).length}<small>곳</small></div><div class="stat-bottom">회사·브랜드·매체 중 등록된 담당자가 없는 곳</div></div><div class="stat"><div class="stat-label">관계 근거 없음</div><div class="stat-value">${es.filter(e => !e.rel).length}<small>개</small></div><div class="stat-bottom">내부 담당자 확인 필요</div></div><div class="stat"><div class="stat-label">연락처 항목 확인 필요</div><div class="stat-value">${Object.values(rel.dir).filter(d => (d.other_points || []).length).length}<small>명</small></div><div class="stat-bottom">휴대폰·이메일 항목으로 인식되지 않은 연락처가 있는 사람</div></div><div class="stat"><div class="stat-label">숨김 항목</div><div class="stat-value">${hidden.length}<small>개</small></div><div class="stat-bottom">상세 화면에서 숨김 해제</div></div></div><section class="panel"><div class="panel-head"><div class="panel-title">데이터 점검</div><button class="button" id="admin-export">${icon('download')} 엔티티 CSV</button></div><div class="table-wrap"><table><thead><tr><th>엔티티</th><th>유형</th><th>관계 근거</th><th>등록된 담당자</th><th>조치</th></tr></thead><tbody>${[...es, ...hidden.filter(isContact)].sort((a, b) => ((!b.rel) + noContact(b)) - ((!a.rel) + noContact(a))).map(e => `<tr><td>${esc(e.name)}${e.hidden ? ' <span class="pill">숨김</span>' : ''}</td><td>${esc(e.type)}</td><td>${e.rel ? '<span class="pill good">입력됨</span>' : PILL_NOREL}</td><td>${contactsOf(e).length ? contactsOf(e).length + '명' : noContact(e) ? PILL_NOC : '—'}</td><td><button class="text-btn" data-detail="${e.id}">상세 확인 ↗</button></td></tr>`).join('')}</tbody></table></div></section>`;
}
// 관계 점수 기준 (PRD 5.1.1) — 기본 규칙으로 시작, Claude 가 월 1회·어긋날 때 항목당 ±10 안에서 조정, DB 관리자가 한 번에 되돌림
const W_KO = {recency: '최근성', frequency: '연락 빈도', outcome: '결과', stage: '관계 단계'};
async function loadScore() {
  const [c, l] = await Promise.all([SB.from('pt_rel_score_config').select('*').maybeSingle(), SB.from('pt_rel_score_config_log').select('*').order('id', {ascending: false}).limit(50)]);
  admin.score = {cfg: c.data, log: l.data || [], err: c.error?.message || l.error?.message || ''};
  if (page === 'admin' && admin.tab === 'score') render();
}
function scorePanel() {
  if (!admin.score) { setTimeout(loadScore); return '<div class="empty"><p>기준을 불러오는 중입니다<span class="dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></p></div>'; }
  const {cfg, log, err} = admin.score; if (err || !cfg) return `<div class="notice">기준을 불러오지 못했습니다: ${esc(err)}</div>`;
  const wl = w => Object.entries(w || {}).map(([k, v]) => `${W_KO[k] || k} ${v}`).join(' · ');
  return `<section class="panel"><div class="panel-head"><div><div class="panel-title">관계 점수 기준 <small>${cfg.version}판</small></div><p class="panel-caption">초기 기준을 바탕으로 Claude가 월 1회, 또는 점수와 실제 결과가 다를 때 항목당 10점 이내에서 조정합니다. 변경 시 사유와 근거가 아래에 기록되며, 복원하면 30일 동안 같은 방향으로 다시 조정하지 않습니다.</p></div></div>
    <div class="quality-grid">${Object.entries(cfg.weights).map(([k, v]) => `<div class="stat"><div class="stat-label">${W_KO[k] || k}</div><div class="stat-value">${v}<small>점</small></div></div>`).join('')}</div>
    <div class="table-wrap"><table><thead><tr><th>일시</th><th>버전</th><th>변경자</th><th>변경</th><th>이유</th><th>조치</th></tr></thead><tbody>${log.map(x => `<tr><td style="white-space:nowrap">${esc(kst(x.at))}</td><td>${x.version}</td><td>${x.changed_by === 'claude' ? '<span class="pill">Claude</span>' : esc(whoName(x.changed_member, '관리자'))}</td><td style="font-size:12px">${esc(wl(x.before?.weights))}<br>→ <b>${esc(wl(x.after?.weights))}</b></td><td style="font-size:12px">${esc(x.reason)}${x.reverted_at ? ' <span class="pill muted">복원됨</span>' : ''}</td><td>${!x.reverted_at && x.before && !x.reason.startsWith('복원') ? `<button class="text-btn" type="button" data-score-revert="${x.id}">이전 기준으로 복원</button>` : ''}</td></tr>`).join('') || '<tr><td colspan="6"><div class="empty">변경 이력이 없습니다. 초기 기준을 적용하고 있습니다.</div></td></tr>'}</tbody></table></div></section>`;
}
// 개인정보 삭제 요청 (PRD 8.1 · sql/024 · 11-02) — 접수 → 처리(되돌릴 수 없음) → 명함·프로필 파일과 백업은 궁니르 봇이 이어서 지움
const ERASE_VIA = ['이메일', '전화', '직접 요청', '기타'];
async function loadErase() {
  const { data, error } = await SB.from('pt_erasure_request').select('*').order('id', {ascending: false}).limit(200);
  admin.erase = {rows: data || [], err: error?.message || ''};
  const ids = [...new Set((data || []).flatMap(x => [x.requested_by, x.processed_by]).filter(id => id && !admin.people[id]))];
  if (ids.length) { const p = await SB.rpc('pt_people', {ids}); (p.data || []).forEach(x => admin.people[x.id] = x); }
  if (page === 'admin' && admin.tab === 'erase') render();
  clearTimeout(admin.eraseTimer);
  if ((data || []).some(x => x.status === 'done' && !x.files_done_at)) admin.eraseTimer = setTimeout(() => { if (page === 'admin' && admin.tab === 'erase') loadErase(); }, 15000);
}
const eraseWho = x => { const c = byId(x.contact_id); return x.status === 'done' || !c ? '삭제된 연락처' : c.name + (agencyOf(c) ? ' · ' + agencyOf(c) : ''); };
function erasePanel() {
  if (!admin.erase) { setTimeout(loadErase); return '<div class="empty"><p>요청을 불러오는 중입니다<span class="dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></p></div>'; }
  const {rows, err} = admin.erase; if (err) return `<div class="notice">요청을 불러오지 못했습니다: ${esc(err)}</div>`;
  const day = x => Math.floor((Date.now() - new Date(x.requested_at)) / 86400000) + 1;
  const state = x => x.status === 'canceled' ? '<span class="pill muted">취소</span>'
    : x.status === 'pending' ? (day(x) > 7 ? `<span class="pill warn">처리 대기 · ${day(x)}일째 (기한 초과)</span>` : `<span class="pill">처리 대기 · ${day(x)}일째</span>`)
    : !x.files_done_at ? `<span class="pill">명함 이미지 정리 중<span class="dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></span>`
    : '<span class="pill good">삭제 완료</span>';
  const done = x => x.processed_at ? `<small class="cell-sub">${esc(kst(x.processed_at))} · ${esc(whoName(x.processed_by, '관리자'))}</small>` : '';
  const got = x => Object.entries(x.result || {}).filter(([, v]) => v).map(([k, v]) => `${k} ${v}`).join(' · ');
  return `<section class="panel"><div class="panel-head"><div><div class="panel-title">개인정보 삭제 요청 <small>${rows.filter(x => x.status === 'pending').length}건 대기</small></div><p class="panel-caption">본인이 연락처 삭제를 요청하면 이곳에서 접수하고, 요청일로부터 7일 이내에 처리해 주세요. 처리하면 연락처·명함·소속·변경 기록에서 해당 인물의 정보가 삭제되며, 관계 기록에는 「삭제된 연락처」로만 표시됩니다. 처리 후에는 복원할 수 없습니다.</p></div><button class="button primary" type="button" id="erase-add">삭제 요청 접수</button></div>
  <div class="table-wrap"><table><thead><tr><th>접수</th><th>연락처</th><th>요청 경로 · 메모</th><th>상태</th><th>조치</th></tr></thead><tbody>${rows.map(x => `<tr><td style="white-space:nowrap">${esc(kst(x.requested_at))}<small class="cell-sub">${esc(whoName(x.requested_by, '관리자'))}</small></td><td><b>${esc(eraseWho(x))}</b></td><td>${esc(x.requested_via || '—')}${x.note ? `<small class="cell-sub">${esc(x.note)}</small>` : ''}</td><td>${state(x)}${done(x)}${x.status === 'done' && got(x) ? `<small class="cell-sub">삭제 항목: ${esc(got(x))}</small>` : ''}</td><td style="white-space:nowrap">${x.status === 'pending' ? `<button class="button danger" type="button" data-erase-go="${x.id}">삭제 처리</button> <button class="text-btn" type="button" data-erase-cancel="${x.id}">접수 취소</button>` : ''}</td></tr>`).join('') || '<tr><td colspan="5"><div class="empty">접수된 삭제 요청이 없습니다.</div></td></tr>'}</tbody></table></div></section>`;
}
function eraseAdd() {
  const list = contacts().filter(c => c.name !== '삭제된 연락처').sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  const opt = arr => arr.map(c => `<option value="${esc(c.id)}">${esc(c.name)}${agencyOf(c) ? ' · ' + esc(agencyOf(c)) : ''}${c.role ? ' · ' + esc(c.role) : ''}</option>`).join('');
  modal(`<form id="erase-form"><h2>삭제 요청 접수</h2><p>삭제를 요청한 본인의 연락처를 선택하고, 요청 경로를 입력해 주세요. 접수만으로는 삭제되지 않으며, 목록에서 「삭제 처리」를 클릭해야 삭제됩니다.</p>
    <label>연락처 찾기<input id="ef-q" maxlength="50" placeholder="이름 또는 회사"></label>
    <label>연락처<select id="ef-c" required><option value="">선택해 주세요</option>${opt(list)}</select></label>
    <label>요청 경로<select id="ef-via">${ERASE_VIA.map(v => `<option>${v}</option>`).join('')}</select></label>
    <label>메모<input id="ef-note" maxlength="500" placeholder="예: 11/2 본인 이메일로 요청 (수신 메일 제목)"></label>
    <div id="ef-err" style="color:#ba775e;margin-top:14px;font-size:12px" role="alert"></div>
    <div class="modal-actions"><button class="button" type="button" data-cancel>취소</button><button class="button primary" type="submit" id="ef-go">접수</button></div></form>`);
  $('#ef-q').oninput = e => { const q = e.target.value.trim().toLowerCase(), cur = $('#ef-c').value; $('#ef-c').innerHTML = '<option value="">선택해 주세요</option>' + opt(list.filter(c => !q || (c.name + ' ' + agencyOf(c)).toLowerCase().includes(q))); $('#ef-c').value = cur; };
  $('#erase-form').onsubmit = async ev => {
    ev.preventDefault(); const id = $('#ef-c').value; if (!id) { $('#ef-err').textContent = '연락처를 선택해 주세요.'; return; }
    $('#ef-go').disabled = true;
    const { error } = await SB.rpc('pt_erasure_add', {p_contact: id, p_via: $('#ef-via').value, p_note: $('#ef-note').value.trim()});
    if (error) { $('#ef-go').disabled = false; $('#ef-err').textContent = '접수하지 못했습니다: ' + error.message; return; }
    $('#modal').dataset.dirty = ''; $('#modal').close(); admin.erase = null; render(); toast('삭제 요청을 접수했습니다.');
  };
}
function bindAdmin() {
  $$('[data-score-revert]').forEach(b => b.onclick = async () => {
    const ok = await confirmBox({title: '이전 기준으로 복원할까요?', body: '모든 관계 점수를 이전 비중으로 다시 계산합니다. 30일 동안 같은 방향으로 다시 조정하지 않습니다.', ok: '이전 기준으로 복원'});
    if (!ok) return; const { error } = await SB.rpc('pt_rel_config_revert', {p_log: Number(b.dataset.scoreRevert)});
    if (error) return toast('복원하지 못했습니다: ' + error.message); admin.score = null; await loadRel(); render(); toast('이전 기준으로 복원했습니다.');
  });
  $$('[data-admin-tab]').forEach(b => b.onclick = () => { admin.tab = b.dataset.adminTab; render(); });
  $$('[data-cost-days]').forEach(b => b.onclick = () => { admin.costDays = +b.dataset.costDays; admin.cost = null; render(); });
  const costRe = $('#cost-reload'); if (costRe) costRe.onclick = () => { admin.cost = null; render(); };
  $('#erase-add')?.addEventListener('click', eraseAdd);
  $$('[data-erase-cancel]').forEach(b => b.onclick = async () => {
    const ok = await confirmBox({title: '접수를 취소할까요?', body: '잘못 접수한 요청만 취소해 주세요. 연락처는 그대로 유지됩니다.', ok: '접수 취소', cancel: '닫기'});
    if (!ok) return; const { error } = await SB.rpc('pt_erasure_cancel', {p_id: Number(b.dataset.eraseCancel)});
    if (error) return toast('취소하지 못했습니다: ' + error.message); admin.erase = null; render(); toast('접수를 취소했습니다.');
  });
  $$('[data-erase-go]').forEach(b => b.onclick = async () => {
    const x = admin.erase.rows.find(r => String(r.id) === b.dataset.eraseGo); if (!x) return;
    const ok = await confirmBox({title: `${eraseWho(x)} 님의 개인정보를 삭제할까요?`, body: '연락처·명함 기록·소속·변경 기록에서 해당 인물의 정보를 삭제하고, 관계 기록에는 「삭제된 연락처」로만 표시합니다. 명함 이미지 파일은 궁니르 봇이 몇 분 이내에 삭제합니다. <b>복원할 수 없습니다.</b>', ok: '삭제', cancel: '닫기', danger: true});
    if (!ok) return; b.disabled = true; b.textContent = '삭제하는 중…';
    const { error } = await SB.rpc('pt_erasure_process', {p_id: x.id});
    if (error) { b.disabled = false; b.textContent = '삭제 처리'; return toast('삭제하지 못했습니다: ' + error.message); }
    admin.erase = null; admin.changes = null; await load(); loadAdmin(); toast('개인정보를 삭제했습니다. 명함 이미지는 궁니르 봇이 이어서 삭제합니다.');
  });
  $('#metric-reload')?.addEventListener('click', () => { admin.metrics = null; render(); });
  $('#log-reload')?.addEventListener('click', () => { admin.changes = null; loadAdmin(); });
  $('#bot-reload')?.addEventListener('click', () => { admin.bot = null; render(); });
  $('#aside-pause')?.addEventListener('click', async () => {
    if (!(await confirmBox({title: 'Aside를 일시 정지하시겠습니까?', body: '진행 중인 SNS 조사·이미지 찾기를 멈추고 서버 PC의 Aside를 종료합니다. 멈춘 작업은 대기 상태로 남았다가 다시 시작하면 이어서 진행합니다.', ok: '일시 정지', cancel: '계속 실행', danger: true}))) return;
    setAsidePaused(true);
  });
  $('#aside-resume')?.addEventListener('click', () => setAsidePaused(false));
  $('#bot-restart')?.addEventListener('click', () => {
    modal(`<h2>궁니르 봇 재시작</h2><p>궁니르 봇을 재시작합니다. 약 20초 동안 슬랙·웹 질문 답변이 중단됩니다.</p><div class="modal-actions"><button class="button" type="button" data-cancel>취소</button><button class="button primary" type="button" id="restart-go">재시작</button></div>`);
    $('#restart-go').onclick = () => { $('#modal').close(); restartBot(); };
  });
  $('#log-who')?.addEventListener('change', e => { admin.who = e.target.value; render(); });
  const q = $('#log-q'); if (q) q.onchange = e => { admin.q = e.target.value; render(); };
  $('#log-export')?.addEventListener('click', () => { const rows = [['일시(KST)', '변경자', '경로', '엔티티', '변경 대상', '변경 항목', '이전', '이후', '메모'], ...admin.changes.flatMap(x => (x.op === 'insert' ? ['(새로 등록)'] : x.fields || []).map(k => [kst(x.at), whoName(x.actor, x.actor_name), VIA_KO[x.via] || x.via, x.entity_name, OP_KO[x.op] || x.op, FIELD_KO[k] || k, x.op === 'insert' ? '' : showVal(k, x.before?.[k]), x.op === 'insert' ? '' : showVal(k, x.after?.[k]), x.reason]))]; download('pantheon-change-log.csv', rows); });
  $$('[data-restore]').forEach(b => b.onclick = () => {
    const x = admin.changes.find(c => String(c.id) === b.dataset.restore); if (!x) return;
    modal(`<h2>복원 확인</h2><p><b>${esc(x.entity_name)}</b>을(를) ${esc(kst(x.at))}에 변경되기 <b>이전</b> 내용으로 복원합니다. 복원한 내용도 변경 기록에 남으며, 필요하면 다시 복원할 수 있습니다.</p><div class="table-wrap" style="max-height:260px;overflow:auto"><table><thead><tr><th>항목</th><th>현재</th><th>복원 후</th></tr></thead><tbody>${(x.fields || []).map(k => { const cur = byId(x.entity_id); return `<tr><td>${esc(FIELD_KO[k] || k)}</td><td>${esc(showVal(k, cur ? toRow(cur)[k] ?? cur[k] : null))}</td><td>${esc(showVal(k, x.before?.[k]))}</td></tr>`; }).join('')}</tbody></table></div><div class="modal-actions"><button class="button" type="button" data-cancel>취소</button><button class="button primary" type="button" id="restore-go">${esc(x.entity_name)} 복원</button></div>`);
    $('#restore-go').onclick = async () => { $('#restore-go').disabled = true; const { error } = await SB.rpc('pt_restore', {change_id: x.id, side: 'before'}); $('#modal').close(); if (error) return toast('복원하지 못했습니다: ' + error.message); await load(); admin.changes = null; loadAdmin(); toast(`${x.entity_name}을(를) 복원했습니다.`); };
  });
}

/* ---------- 제안서 스튜디오 (2026-10-27 · 시험 기간: 홍석진·김현우·류성열만 — DB 가 pt_studio_can 으로 막음) ----------
   대표님 almighty-proposal-studio 의 흐름: IP 입력 → 인테이크 → (콜라보) 파트너 추천 → 리서치 → 컨셉 → 제안서 생성 → 이미지 계획 → 생성·삽입·QA
   사람은 게이트에서만 결정하고, 단계 작업은 pt_proposal_job 대기열에 넣어 궁니르 봇(서버 PC)이 처리한다. 엔티티는 판테온 pt_entity 를 쓴다 */
let studioCan = false, ipcCan = false;         // IP 차트 — 11-01 전 직원 공개 (sql/022 pt_ipchart_can = pt_can_use)
const studio = {tab: 'projects', filter: 'all', by: '', stage: 0, q: '', refQ: '', refType: '', refNew: null, sort: {k: 'updated', d: -1}, list: null, refs: null, jobs: [], loading: false, err: ''};
const STAGES = ['IP 입력', '기본 정보', '파트너 IP 추천', '리서치', '컨셉 설계', '제안서 생성', '이미지 계획', '생성·삽입·검수'];
const GATES = {2: '기본 정보 확정', 3: '파트너 IP 선택', 5: '컨셉 확정', 7: '이미지 수급·크레딧 승인', 8: '반려 이미지 최종 판단'};
const JOB_OF = {3: 'partners', 4: 'research', 5: 'concepts', 6: 'build', 7: 'image_plan', 8: 'generate'};
// 같은 IP 조합·수신사로 만든 제안서는 한 프로젝트로 보고, 만든 순서대로 「제안서 1 · 2 · 3」 (10-29 김현우)
const pKey = p => [p.mode, p.ip_a_name, p.ip_b_name || '', (p.recipient || '').trim().toLowerCase()].join('|');
function propNo(p) {
  const same = (studio.list || []).filter(x => x.ip_b_name && pKey(x) === pKey(p)).sort((a, b) => a.created_at.localeCompare(b.created_at));
  const i = same.findIndex(x => x.id === p.id);
  return i < 0 ? null : {n: i + 1, of: same.length};
}
const propSub = p => { const no = propNo(p), c = p.data?.concept_selected?.name; return [no ? `제안서 ${no.n}` : '', c ? `「${c}」` : ''].filter(Boolean).join(' · '); };
const pTitle = p => p.mode === 'single' ? `${p.ip_a_name} 단독` : `${p.ip_a_name} × ${p.ip_b_name || '파트너 선택 전'}`;
const pStatus = p => p.status === 'done' ? '완료' : p.status === 'failed' ? '작업 실패' : p.status === 'working' ? `${STAGES[p.stage - 1]} 진행 중` : `${GATES[p.stage] || '확인'} 대기`;
const pPill = p => `<span class="pill ${p.status === 'done' ? 'good' : p.status === 'failed' ? 'bad' : p.status === 'waiting' ? 'wait' : ''}">${esc(pStatus(p))}</span>`;
const contactPoint = e => e ? '등록된 연락처 있음' : '등록된 연락처 없음';
const ipChips = (host, initial, list) => chipInput(host, initial, {list, find: entityByName, badge: contactPoint,
  sub: e => [e.type, contactsOf(e).length ? `등록된 담당자 ${contactsOf(e).length}명` : ''].filter(Boolean).join(' · '),
  title: e => e ? `이그드라실 엔티티 「${e.name}」` : '이그드라실 엔티티에 등록되지 않은 IP입니다',
  note: '이그드라실 엔티티에 등록된 IP는 <b>등록된 연락처 있음</b>, <span class="err">빨간 칩</span>은 등록되지 않은 IP입니다.'});
const entityByName = name => { const n = normCo(name); return n.length < 2 ? null : entities().find(e => [e.name, e.en, ...e.aliases].some(x => x && normCo(x) === n)) || null; };

async function loadStudio() {
  if (studio.loading) return; studio.loading = true; studio.err = '';
  try {
    const [p, r, j, , cj, pty] = await Promise.all([
      SB.from('pt_proposal').select('*').order('updated_at', {ascending: false}),
      SB.from('pt_proposal_ref').select('*').eq('hidden', false).order('created_at', {ascending: false}),
      SB.from('pt_proposal_job').select('id,proposal_id,ref_id,kind,status,at,error,result,input').in('status', ['wait', 'work']), loadMembers(),
      SB.from('pt_proposal_job').select('id,proposal_id,kind,status,at,error,input').eq('status', 'fail').like('error', '%취소%').order('at', {ascending: false}).limit(200),
      SB.from('pt_page_type').select('*').eq('hidden', false).order('sort')]);
    if (p.error) throw p.error; if (r.error) throw r.error; if (j.error) throw j.error;
    studio.list = p.data; studio.refs = r.data; studio.jobs = j.data; studio.ptypes = pty.data || [];
    studio.cancelled = {}; (cj.data || []).forEach(x => { if (x.proposal_id && !studio.cancelled[x.proposal_id]) studio.cancelled[x.proposal_id] = x; });
  } catch (e) { studio.err = '제안서 스튜디오를 불러오지 못했습니다: ' + (e?.message || ''); }
  studio.loading = false; if (page === 'studio') render();
}

function studioView() {
  if (!studio.list && !studio.err) { setTimeout(loadStudio); return '<div class="empty"><p>불러오는 중입니다<span class="dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></p></div>'; }
  const tabs = `<div class="tabs" style="margin-bottom:16px">${[['projects', '프로젝트', studio.list?.length], ['refs', '레퍼런스 라이브러리', studio.refs?.length], ['archive', '이미지 아카이브', studio.arch?.length]].map(([k, t, n]) => `<button class="tab ${studio.tab === k || (k === 'refs' && studio.tab === 'ref-new') ? 'active' : ''}" data-studio-tab="${k}">${t}${n ? ` <span class="nav-count">${n}</span>` : ''}</button>`).join('')}</div>`;
  if (studio.err) return tabs + `<div class="notice">${esc(studio.err)}</div>`;
  return tabs + (studio.tab === 'refs' ? studioRefs() : studio.tab === 'ref-new' ? studioRefNew() : studio.tab === 'archive' ? studioArchive() : studioProjects());
}

// 프로젝트 목록 — 맨 위 「내가 할 일」 · 이름·단계·상태·기안자 조건으로 거르기 (11-04 홍석진 대표님 회의 「제일 위에는 내가 해야 할 일 먼저, 필요하면 조건으로 필터링」)
// 기안자 = 프로젝트를 연 사람(pt_proposal.created_by) · 기안자로 거르고 열 머리로 정렬 (11-02 홍석진 대표님)
const pjByOf = p => memberName(p.created_by) || '궁니르 봇';
const pjText = p => [pTitle(p), propSub(p), p.recipient, p.ip_a_name, p.ip_b_name, p.note, pjByOf(p)].join(' ').toLowerCase();
const pjSets = () => { const all = studio.list; return {live: ['진행 중', all.filter(p => p.status !== 'done')], wait: ['결정 대기', all.filter(p => p.status === 'waiting')], work: ['궁니르 봇 처리 중', all.filter(p => p.status === 'working')], done: ['완료', all.filter(p => p.status === 'done')]}; };
const pjAny = () => !!(pjSets()[studio.filter] || studio.by || studio.stage || studio.q.trim());
const SORT_KO = {title: '프로젝트 이름순', by: '기안자순', stage: '단계순', created: '기안일순', updated: '업데이트순'};
function pjFiltered() {
  const F = pjSets(), q = studio.q.trim().toLowerCase(), {k: sk, d: sd} = studio.sort;
  const sv = p => sk === 'title' ? pTitle(p) : sk === 'by' ? pjByOf(p) : sk === 'stage' ? p.stage : sk === 'created' ? p.created_at : p.updated_at;
  return (F[studio.filter]?.[1] || studio.list).filter(p => (!studio.by || pjByOf(p) === studio.by) && (!studio.stage || p.stage === studio.stage) && (!q || pjText(p).includes(q)))
    .slice().sort((a, b) => { const x = sv(a), y = sv(b); return (typeof x === 'number' ? x - y : String(x || '').localeCompare(String(y || ''), 'ko')) * sd || String(b.updated_at).localeCompare(String(a.updated_at)); });
}
function pjTable(ps) {
  if (!ps.length) return `<div class="empty"><p>${pjAny() ? '조건에 맞는 프로젝트가 없습니다.' : '아직 프로젝트가 없습니다.<br>오른쪽 위 「새 프로젝트」에서 IP를 입력해 시작해 주세요.'}</p></div>`;
  const {k: sk, d: sd} = studio.sort;
  const th = (k, t) => `<th aria-sort="${sk === k ? (sd > 0 ? 'ascending' : 'descending') : 'none'}"><button type="button" class="th-sort" data-psort="${k}">${t}${sk === k ? (sd > 0 ? ' ▲' : ' ▼') : ''}</button></th>`;
  const rows = ps.map(p => `<tr class="clickable" data-proposal="${p.id}" tabindex="0"><td>${esc(pTitle(p))}${p.visibility === 'private' ? ' <span class="pill">나만 보기</span>' : ''}${propSub(p) ? ` <span class="prop-no">${esc(propSub(p))}</span>` : ''}<small class="cell-sub">${esc(p.recipient || '수신사 미정')}</small></td><td data-label="기안자" style="white-space:nowrap">${esc(pjByOf(p))}<small class="cell-sub">${esc(ymd(p.created_at))}</small></td><td data-label="단계">${p.stage}. ${esc(STAGES[p.stage - 1])}</td><td data-label="버전">${p.data?.build ? `<b class="ver">v${p.data.build.version}</b>` : '—'}</td><td data-label="상태">${pPill(p)}${p.status === 'working' ? `<div data-prow="${p.id}">${rowProg(p)}</div>` : ''}</td><td data-label="업데이트" style="white-space:nowrap">${esc(kst(p.updated_at))}</td></tr>`).join('');
  return `<div class="table-wrap"><table class="ct"><thead><tr>${th('title', '프로젝트')}${th('by', '기안자')}${th('stage', '현재 단계')}<th>버전</th><th>상태</th>${th('updated', '업데이트')}</tr></thead><tbody>${rows}</tbody></table></div>`;
}
// 내가 할 일 — 내가 기안한 프로젝트 중 내 결정을 기다리거나 멈춘 것. 대기 기간이 긴 순서, 하루가 넘으면 눈에 띄게
const waitH = p => (Date.now() - Date.parse(p.updated_at)) / 3600e3;
const waitAgo = h => h < 1 ? '방금' : h < 24 ? `${Math.floor(h)}시간 경과` : `${Math.floor(h / 24)}일 경과`;
const todoWhat = p => p.status === 'failed' ? '작업 중단 · 확인 후 재시도 필요' : resumeOf(p) ? `${STAGES[resumeOf(p).stage - 1]} 취소됨 · 재시작 대기` : `${GATES[p.stage] || '확인'} 대기`;
const todoRow = (p, mine) => { const h = waitH(p), hot = h >= 24 || p.status === 'failed'; return `<button class="alert-row todo-row${hot ? ' hot' : ''}" data-proposal="${p.id}"><span class="alert-symbol${p.status === 'failed' ? ' red' : ''}">${icon('warning')}</span><span class="alert-text">${esc(pTitle(p))}${propSub(p) ? ` <span class="prop-no">${esc(propSub(p))}</span>` : ''}<small>${esc(todoWhat(p))}${mine ? '' : ` · ${esc(pjByOf(p))}`}</small></span><span class="todo-age">${hot && p.status !== 'failed' ? '<b>처리 지연</b>' : ''}${esc(waitAgo(h))}</span></button>`; };

// 진행 중인 내 프로젝트 (11-04 김현우 「진행 중 따로 보이게」) — 궁니르 봇이 작업 중인 것, 진행률은 3초마다 pollProjects 가 갱신
const liveRow = p => `<button class="alert-row todo-row" data-proposal="${p.id}"><span class="alert-symbol live">${icon('clock')}</span><span class="alert-text">${esc(pTitle(p))}${propSub(p) ? ` <span class="prop-no">${esc(propSub(p))}</span>` : ''}<small>${esc(STAGES[p.stage - 1] || '')} 진행 중${p.visibility === 'private' ? ' · 나만 보기' : ''}</small><span class="todo-prog" data-prow="${p.id}">${rowProg(p)}</span></span></button>`;

function studioProjects() {
  const all = studio.list, F = pjSets(), ps = pjFiltered();
  const isMine = p => !!me && p.created_by === me.id;
  const todo = all.filter(p => isMine(p) && (p.status === 'waiting' || p.status === 'failed')).sort((a, b) => (b.status === 'failed') - (a.status === 'failed') || waitH(b) - waitH(a));
  const mineLive = all.filter(p => isMine(p) && p.status === 'working').sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at));
  const others = F.wait[1].filter(p => !isMine(p)).sort((a, b) => waitH(b) - waitH(a));
  const byNames = [...new Set(all.map(pjByOf))].sort((a, b) => a.localeCompare(b, 'ko'));
  if (studio.by && !byNames.includes(studio.by)) studio.by = '';
  const n = f => all.filter(p => (!studio.by || pjByOf(p) === studio.by) && f(p)).length;
  const sel = (attr, label, opts, cur) => `<select class="pf-by" ${attr} aria-label="${label}" data-nodirty>${opts.map(([v, t]) => `<option value="${esc(v)}"${String(cur) === String(v) ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select>`;
  const bar = `<div class="pf-bar"><input type="search" class="pf-q" data-pq placeholder="프로젝트·IP·수신사·기안자 검색" value="${esc(studio.q)}" aria-label="프로젝트 검색" data-nodirty>`
    + sel('data-pstage', '단계별 보기', [['', '단계 전체'], ...STAGES.map((s, i) => [i + 1, `${i + 1}. ${s} (${n(p => p.stage === i + 1)})`])], studio.stage || '')
    + sel('data-pstatus', '상태별 보기', [['all', '상태 전체'], ...Object.entries(F).map(([k, [t, xs]]) => [k, `${t} (${xs.length})`])], F[studio.filter] ? studio.filter : 'all')
    + sel('data-pby', '기안자별 보기', [['', '기안자 전체'], ...byNames.map(x => [x, `${x} (${all.filter(p => pjByOf(p) === x).length})`])], studio.by)
    + `<button class="text-btn" type="button" data-pclear${pjAny() ? '' : ' hidden'}>조건 초기화</button></div>`;
  const stat = (key, num, bottom, hi) => `<div class="stat${hi ? ' highlight' : ''}${studio.filter === key ? ' on' : ''}" data-pfilter="${key}" role="button" tabindex="0" aria-pressed="${studio.filter === key}" aria-label="${F[key][0]} 프로젝트만 보기"><div class="stat-label">${F[key][0]}</div><div class="stat-value">${num}<small>건</small></div><div class="stat-bottom">${bottom}</div></div>`;
  return `<section class="panel todo-panel"><div class="panel-head"><div class="panel-title">내가 할 일${todo.length ? ` <span class="alert-count">${todo.length}건</span>` : ''}</div>${todo.length > 1 ? '<small class="muted">대기 기간이 긴 순서</small>' : ''}</div>${todo.length ? `<div class="alert-list todo-list">${todo.map(p => todoRow(p, true)).join('')}</div>` : '<p class="panel-caption todo-none">지금 결정하실 프로젝트가 없습니다.</p>'}${mineLive.length ? `<div class="panel-head todo-sub"><div class="panel-title">진행 중 <span class="alert-count">${mineLive.length}건</span></div><small class="muted">끝나면 위 목록으로 올라옵니다</small></div><div class="alert-list todo-list">${mineLive.map(liveRow).join('')}</div>` : ''}</section>
  <div class="stats">${stat('live', F.live[1].length, `전체 ${all.length}건`)}${stat('wait', F.wait[1].length, '담당자 확인이 필요한 단계')}${stat('work', F.work[1].length, '리서치·생성 등 자동 단계')}${stat('done', F.done[1].length, '제안서 전달 완료', true)}</div>
  <div class="main-grid studio-grid"><section class="panel"><div class="panel-head"><div class="panel-title">${F[studio.filter] ? F[studio.filter][0] : '전체'} 프로젝트${studio.by ? ` · ${esc(studio.by)}` : ''} <small id="pj-count">${ps.length}건 · ${SORT_KO[studio.sort.k]}</small></div></div>${bar}<div id="pj-body">${pjTable(ps)}</div></section>
  <section class="panel"><div class="panel-head"><div class="panel-title">다른 담당자 결정 대기</div>${others.length ? `<span class="alert-count">${others.length}건</span>` : ''}</div><div class="alert-list">${others.length ? others.map(p => todoRow(p, false)).join('') : '<p class="panel-caption" style="padding:0 0 18px">다른 담당자가 결정할 프로젝트가 없습니다.</p>'}</div></section></div>`;
}

// 레퍼런스 라이브러리 — 콜라보 대상(누구 × 누구)·유형이 보이게, 이름 검색·유형으로 거르기 (11-04 회의 「레퍼런스가 많아지면 헷갈린다」)
const REF_TYPES = ['아티스트 × 패션', '아티스트 × 캐릭터', '아티스트 × 브랜드', '캐릭터 × 플랫폼', '캐릭터 × 브랜드', '브랜드 전략·리포지셔닝', '기타'];
const refA = r => r.ip_names || r.profile?.collab?.a || '';
const refB = r => r.partner || r.profile?.collab?.b || '';
const refType = r => r.collab_type || r.profile?.collab?.type || '';
// IP 칸에 두 이름을 적었으면 학습한 상대 이름(영문)을 또 붙이지 않는다 (11-04)
const refPair = r => { const xs = refA(r).split(/\s*,\s*/).filter(Boolean), b = xs.length > 1 && !r.partner ? '' : refB(r); if (b && !xs.some(x => x.toLowerCase() === b.toLowerCase())) xs.push(b); return xs.join(' × '); };
// 레퍼런스를 파일 이름 대신 「누구 × 누구 콜라보 제안서」와 포맷 한 줄로 보여 준다 (11-04 김현우 「파일명처럼 말고」)
const refKind = r => { const t = refType(r); return /×/.test(t) ? '콜라보 제안서' : /브랜드|전략/.test(t) ? '브랜드 전략 제안서' : '제안서'; };
const refName = r => { const k = refKind(r), who = k === '브랜드 전략 제안서' ? refA(r).split(/\s*,\s*/)[0] : refPair(r); return who ? `${who} ${k}` : r.title; };
const refFormat = r => { const f = r.profile?.format_line || (r.profile?.summary || '').split(/\s*→\s*/).slice(0, 4).join(' → '); return f ? `${f} 포맷의 제안서입니다.` : '학습이 끝나면 어떤 포맷인지 표시됩니다.'; };
document.addEventListener('click', ev => { const b = ev.target.closest?.('[data-ref-pdf]'); if (!b) return; ev.preventDefault(); ev.stopPropagation(); refPdf(b.dataset.refPdf); }, true);
async function refPdf(id) {
  const r = (studio.refs || []).find(x => x.id === id); if (!r?.file_path) return toast('레퍼런스 파일을 찾지 못했습니다.');
  const w = window.open('', '_blank');           // 휴대폰은 기다린 뒤 여는 새 창을 막으므로 먼저 열어 둔다
  const { data, error } = await SB.storage.from('pt-studio').createSignedUrl(r.file_path, 3600);
  if (error || !data) { w?.close(); return toast('레퍼런스를 열지 못했습니다: ' + (error?.message || '')); }
  if (w) w.location = data.signedUrl; else location.href = data.signedUrl;
}
const refLearned = r => !!r.profile?.pages;
const refDeep = r => !!r.profile?.writing?.register;
const refBusy = r => r.status === 'uploaded' || r.status === 'analyzing';
const refMatch = r => (!studio.refType || refType(r) === studio.refType) && (!studio.refQ.trim() || [r.title, refA(r), refB(r), refType(r), r.recipient, r.author].join(' ').toLowerCase().includes(studio.refQ.trim().toLowerCase()));
function refLearnCell(r) {
  if (refBusy(r)) return refProg(r);
  if (r.status === 'failed') return `<span class="pill bad" title="${esc(r.profile?.error || '')}">학습 실패</span> <button class="text-btn" data-ref-relearn="${r.id}">다시 학습</button>`;
  return `<button class="text-btn" data-ref-view="${r.id}"><span class="pill good">학습 완료</span> 보기</button>${refDeep(r) ? '' : '<small class="cell-sub">다시 학습하면 문체·디자인까지 상세히 학습합니다</small>'}`;
}
function refTable(rs) {
  if (!rs.length) return `<div class="empty"><p>${(studio.refs || []).length ? '조건에 맞는 레퍼런스가 없습니다.' : '등록된 레퍼런스가 없습니다.<br>오른쪽 위 「레퍼런스 등록」에서 완성 제안서 PDF를 업로드해 주세요.'}</p></div>`;
  return `<div class="table-wrap"><table class="ct"><thead><tr><th>제안서</th><th>콜라보</th><th>수신사</th><th>학습</th><th>기본 포맷</th><th>파일</th></tr></thead><tbody>${rs.map(r => `<tr${refLearned(r) ? ` class="clickable" data-ref-view="${r.id}"` : ''}><td class="wrap-cell">${esc(r.title)}<small class="cell-sub">${esc([r.author, ymd(r.created_at)].filter(Boolean).join(' · '))}</small></td><td data-label="콜라보" class="wrap-cell">${esc(refPair(r) || '—')}${refType(r) ? `<small class="cell-sub"><span class="pill">${esc(refType(r))}</span></small>` : ''}</td><td data-label="수신사">${esc(r.recipient || '—')}</td><td data-label="학습">${refLearnCell(r)}</td><td data-label="기본 포맷">${r.is_default ? '<span class="pill good">기본</span>' : `<button class="text-btn" data-ref-default="${r.id}">기본으로 지정</button>`}</td><td data-label="파일"><button class="text-btn" data-ref-open="${r.id}">열기 ↗</button></td></tr>`).join('')}</tbody></table></div>`;
}
function studioRefs() {
  const all = studio.refs, rs = all.filter(refMatch), types = REF_TYPES.filter(t => all.some(r => refType(r) === t));
  if (studio.refType && !types.includes(studio.refType)) studio.refType = '';
  return `<section class="panel"><div class="panel-head"><div><div class="panel-title">레퍼런스 라이브러리 <small id="ref-count">${rs.length === all.length ? `${all.length}건` : `${rs.length} / ${all.length}건`}</small></div><p class="panel-caption">팀에서 작성한 완성 제안서입니다. 새 제안서는 선택한 레퍼런스의 디자인·구성·문체·설득 흐름을 반영해 작성됩니다.</p></div><button class="button primary" type="button" data-ref-new>${icon('plus')}레퍼런스 등록</button></div>
  <div class="pf-bar">${types.length ? `<div class="ar-kinds" role="group" aria-label="콜라보 유형">${[['', '전체'], ...types.map(t => [t, t])].map(([k, t]) => `<button type="button" class="ar-chip${studio.refType === k ? ' on' : ''}" data-ref-type="${esc(k)}" aria-pressed="${studio.refType === k}">${esc(t)} <small>${k ? all.filter(r => refType(r) === k).length : all.length}</small></button>`).join('')}</div>` : ''}<input type="search" class="pf-q" data-ref-q placeholder="제안서 이름·IP·수신사·작성자 검색" value="${esc(studio.refQ)}" aria-label="레퍼런스 검색" data-nodirty></div>
  <div id="ref-body">${refTable(rs)}</div></section>`;
}

// 레퍼런스 등록 화면 (11-04 김현우 「레퍼런스 추가도 별도의 UI로 — AI가 디자인·구조·문어체·제안서 구조를 아주 상세하게 학습」)
// 파일·콜라보 대상·유형·중점 학습 사항을 받고, 올린 뒤 같은 화면에서 학습 진행을 단계별로 보여 준다
const LEARN = [[12, '제안서 파일 수신'], [31, '제안서 전체 분석'], [88, '페이지별 구성·원문·배치 학습'], [100, '문체·디자인·작성 기준 정리']];
function refLearnCard(r) {
  if (!r) return '';
  if (r.status === 'failed') return `<div class="rl-card" data-ref-learn="${r.id}"><h3>「${esc(r.title)}」 학습하지 못했습니다</h3><p class="muted-box">${esc(r.profile?.error || '궁니르 봇이 학습을 완료하지 못했습니다.')}</p><div class="drawer-actions"><button class="button primary" data-ref-relearn="${r.id}">다시 학습</button><button class="button" data-ref-new>다른 파일 등록</button></div></div>`;
  if (!refBusy(r)) {
    const f = r.profile || {}, w = f.writing || {};
    return `<div class="rl-card done" data-ref-learn="${r.id}"><h3>「${esc(r.title)}」 학습을 완료했습니다</h3>
    <div class="detail-row"><span>콜라보</span><b>${esc(refPair(r) || '—')}${refType(r) ? ` · ${esc(refType(r))}` : ''}</b></div><div class="detail-row"><span>페이지</span><b>${esc(f.page_count || (f.pages || []).length)}페이지 · 이미지 ${esc(f.image_pattern?.total || 0)}장</b></div>${w.register ? `<div class="detail-row"><span>문체</span><b>${esc(w.register)}</b></div>` : ''}${f.design?.mood ? `<div class="detail-row"><span>디자인</span><b>${esc(f.design.mood)}</b></div>` : ''}
    <div class="drawer-actions"><button class="button primary" data-ref-view="${r.id}">학습 결과 상세 보기</button><button class="button" data-ref-new>추가 등록</button><button class="button" data-studio-tab="refs">레퍼런스 라이브러리</button></div></div>`;
  }
  const j = refJob(r), pct = j?.result?.progress || 0, work = j?.status === 'work';
  const steps = LEARN.map(([to, t], i) => { const from = i ? LEARN[i - 1][0] : 0; return `<li class="${pct >= to ? 'done' : work && pct >= from ? 'now' : ''}">${esc(t)}</li>`; }).join('');
  return `<div class="rl-card" data-ref-learn="${r.id}"><h3>「${esc(r.title)}」 학습 중</h3>${refProg(r)}<ol class="rl-steps">${steps}</ol><p class="muted-box">화면을 벗어나도 학습은 계속 진행됩니다. 완료되면 레퍼런스 라이브러리에 「학습 완료」로 표시됩니다.</p></div>`;
}
function studioRefNew() {
  const back = `<button class="text-btn rn-back" type="button" data-studio-tab="refs">← 레퍼런스 라이브러리</button>`;
  if (studio.refNew) return back + `<section class="panel rn-panel">${refLearnCard(studio.refs.find(x => x.id === studio.refNew))}</section>`;
  return back + `<div class="rn-grid"><section class="panel rn-panel"><form id="rn-form" novalidate><div class="panel-title">레퍼런스 등록</div><p class="panel-caption">팀에서 실제 발송한 완성 제안서를 업로드하면 궁니르 봇이 전체 내용을 분석해 학습합니다.</p>
  <label class="rn-drop" id="rn-drop"><input id="rn-file" type="file" accept=".pdf,application/pdf" data-nodirty><span class="rn-drop-in">${icon('upload')}<b id="rn-file-name">PDF 파일을 드래그하거나 클릭해 선택해 주세요</b><small id="rn-file-sub">100MB 이하 · PPTX 파일은 PowerPoint에서 PDF로 변환해 업로드해 주세요</small></span></label>
  <label>제안서 이름 *<input id="rn-title" maxlength="120" placeholder="예: 바비 × 장원영 IP 콜라보레이션 제안서"></label>
  <datalist id="rn-ents">${entities().filter(e => !e.hidden).map(e => `<option value="${esc(e.name)}">`).join('')}</datalist>
  <div class="rn-pair"><label>IP·아티스트<input id="rn-a" list="rn-ents" maxlength="80" placeholder="예: aespa"></label><span aria-hidden="true">×</span><label>콜라보 상대<input id="rn-b" list="rn-ents" maxlength="80" placeholder="예: 사이버펑크 엣지러너"></label></div>
  <div class="field"><span class="flabel">콜라보 유형</span><div class="ar-kinds" role="radiogroup" aria-label="콜라보 유형">${[['', '자동 판별'], ...REF_TYPES.map(t => [t, t])].map(([k, t], i) => `<button type="button" class="ar-chip${i ? '' : ' on'}" role="radio" aria-checked="${!i}" data-rn-type="${esc(k)}">${esc(t)}</button>`).join('')}</div><small class="muted">입력하지 않으면 궁니르 봇이 제안서를 분석해 IP·콜라보 상대·유형·수신사를 자동으로 입력합니다.</small></div>
  <label>수신사<input id="rn-to" list="rn-ents" maxlength="80"></label>
  <div class="field"><span class="flabel">작성자</span><div id="rn-author"></div></div>
  <label>중점 학습 사항<textarea id="rn-note" maxlength="500" rows="3" placeholder="예: 컨셉 3안 페이지 구성과 굿즈 페이지 디자인을 특히 참고"></textarea></label>
  <div id="rn-up" class="ref-prog" hidden><span class="row"><span class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100"><i style="width:0%"></i></span><b>0%</b></span><small>파일 업로드 중</small></div>
  <div id="rn-error" class="err" role="alert"></div>
  <div class="modal-actions"><button class="button" type="button" data-studio-tab="refs">취소</button><button class="button primary" type="submit">등록하고 학습 시작</button></div></form></section>
  <section class="panel rn-panel rn-side"><div class="panel-title">학습 항목</div><ol class="rule-list rn-learn">
  <li><b>디자인</b><br><small>배경·여백·레이아웃 구성, 글꼴 크기 체계, 색상별 용도, 페이지 번호·라벨 등 반복 요소</small></li>
  <li><b>페이지 구성</b><br><small>섹션 순서, 페이지별 역할과 배치, 이미지 위치와 유형</small></li>
  <li><b>문어체</b><br><small>제목·라벨·본문 작성 방식, 숫자 표기, 주요 표현과 원문 예시</small></li>
  <li><b>제안서 구조</b><br><small>도입부터 마무리까지의 설득 흐름, 더올마이티 소개 방식</small></li></ol>
  <p class="panel-caption">학습한 내용은 새 제안서의 「제안서 구성」에서 이 레퍼런스를 선택하면 반영됩니다.</p></section></div>`;
}
// 파일 올리기 진행률 — 서명된 업로드 주소로 직접 올려 진행률을 받는다. 안 되면 기존 방식으로
async function uploadWithProgress(bucket, path, file, onp) {
  const s = await SB.storage.from(bucket).createSignedUploadUrl(path);
  if (!s.error) {
    try {
      await new Promise((ok, no) => {
        const x = new XMLHttpRequest(), fd = new FormData(); fd.append('cacheControl', '3600'); fd.append('', file);
        x.open('PUT', s.data.signedUrl); x.setRequestHeader('x-upsert', 'false');
        x.upload.onprogress = e => e.lengthComputable && onp(e.loaded / e.total);
        x.onload = () => x.status < 300 ? ok() : no(new Error(`${x.status} ${x.responseText.slice(0, 160)}`)); x.onerror = () => no(new Error('네트워크 오류'));
        x.send(fd);
      });
      return {};
    } catch (e) { console.warn('[업로드] 서명 주소 실패, 기본 방식으로', e); }
  }
  onp(-1);
  return SB.storage.from(bucket).upload(path, file, {contentType: file.type || 'application/pdf', upsert: true});
}
function bindRefNew() {
  const form = $('#rn-form'); if (!form) return;
  const authors = memberChips($('#rn-author'), myName ? [myName] : [], {note: '<span class="err">빨간 이름</span>은 헤임달에 등록되지 않은 사람입니다.'});
  let file = null, type = '';
  const pick = f => {
    $('#rn-error').textContent = '';
    if (!f) return;
    if (!/\.pdf$/i.test(f.name)) { $('#rn-error').textContent = 'PDF 파일만 학습할 수 있습니다. PPTX 파일은 PowerPoint에서 PDF로 변환해 업로드해 주세요.'; return; }
    if (f.size > 100e6) { $('#rn-error').textContent = '100MB 이하 파일을 선택해 주세요.'; return; }
    file = f; $('#rn-drop').classList.add('picked'); $('#rn-file-name').textContent = f.name; $('#rn-file-sub').textContent = `${(f.size / 1e6).toFixed(1)}MB · 다른 파일을 선택하려면 다시 클릭해 주세요`;
    if (!$('#rn-title').value) $('#rn-title').value = f.name.replace(/\.pdf$/i, '');
  };
  $('#rn-file').onchange = () => pick($('#rn-file').files[0]);
  const drop = $('#rn-drop');
  ['dragenter', 'dragover'].forEach(k => drop.addEventListener(k, e => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(k => drop.addEventListener(k, e => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', e => pick(e.dataTransfer.files[0]));
  $$('[data-rn-type]').forEach(b => b.onclick = () => { type = b.dataset.rnType; $$('[data-rn-type]').forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-checked', on); }); });
  form.onsubmit = async ev => {
    ev.preventDefault();
    const title = $('#rn-title').value.trim();
    if (!file) { $('#rn-error').textContent = '제안서 PDF 파일을 선택해 주세요.'; return; }
    if (!title) { $('#rn-error').textContent = '제안서 이름을 입력해 주세요.'; $('#rn-title').focus(); return; }
    const btn = form.querySelector('[type=submit]'), up = $('#rn-up'); btn.disabled = true; btn.textContent = '업로드 중…'; up.hidden = false;
    const bar = p => { if (p < 0) { up.querySelector('.bar').classList.add('indet'); up.querySelector('b').textContent = ''; return; } const n = Math.round(p * 100); up.querySelector('i').style.width = n + '%'; up.querySelector('b').textContent = n + '%'; up.querySelector('.bar').setAttribute('aria-valuenow', n); };
    const fail = m => { btn.disabled = false; btn.textContent = '등록하고 학습 시작'; up.hidden = true; $('#rn-error').textContent = m; };
    const path = `refs/${today()}/${uid()}.pdf`;
    const res = await uploadWithProgress('pt-studio', path, file, bar);
    if (res.error) return fail('파일을 올리지 못했습니다: ' + res.error.message);
    up.querySelector('small').textContent = '학습을 요청하는 중';
    const { data, error } = await SB.from('pt_proposal_ref').insert({title, ip_names: $('#rn-a').value.trim(), partner: $('#rn-b').value.trim(), collab_type: type, recipient: $('#rn-to').value.trim(), author: authors.value().join(', '), note: $('#rn-note').value.trim(), file_path: path, file_size: file.size, is_default: !(studio.refs || []).length}).select().single();
    if (error) return fail('등록하지 못했습니다: ' + error.message);
    const jr = await SB.from('pt_proposal_job').insert({ref_id: data.id, kind: 'analyze_reference', input: {file_path: path}});
    if (jr.error) return fail('학습을 요청하지 못했습니다: ' + jr.error.message);
    studio.refNew = data.id; studio.refs = null; studio.list = null; await loadStudio(); toast('레퍼런스를 등록했습니다. 학습을 시작합니다.');
  };
}
async function refRelearn(id) {
  const r = studio.refs.find(x => x.id === id); if (!r) return;
  // 이미 배운 결과는 지우지 않는다 — 다시 학습이 끝날 때까지 새 제안서는 지금 결과로 만든다 (봇 pipeline.ref_profiles)
  const { error } = await SB.from('pt_proposal_ref').update(refLearned(r) ? {status: 'uploaded'} : {status: 'uploaded', profile: null}).eq('id', id);
  if (error) return toast('다시 학습을 요청하지 못했습니다: ' + error.message);
  const jr = await SB.from('pt_proposal_job').insert({ref_id: id, kind: 'analyze_reference', input: {file_path: r.file_path, retry: true}});
  if (jr.error) return toast('다시 학습을 요청하지 못했습니다: ' + jr.error.message);
  closeDrawer?.(); await loadStudio(); toast(refLearned(r) ? '다시 학습을 시작했습니다. 완료 전까지는 기존 학습 결과로 제안서를 생성합니다.' : '다시 학습을 시작했습니다.');
}

// 이미지 아카이브 (10-31 김현우 「Aside로 찾거나 힉스필드로 만든 이미지를 종류별로 정리해 나중에도 쓰게」)
// 궁니르 봇이 이미지 작업이 끝날 때마다 pt_image_archive 에 복사본을 쌓는다(bot/src/archive.py). 여기선 보고·내려받고·다른 제안서에 넣는다
const AR_KIND = [['logo', '로고'], ['symbol', '심볼'], ['artist', '아티스트 사진'], ['official', '공식 이미지'], ['capture', '캡처'], ['reference', '참고 사례'], ['ai_concept', 'AI 컨셉'], ['mockup', '굿즈·목업'], ['texture', '배경·질감']];
const AR_KO = Object.fromEntries(AR_KIND), AR_SRC = {aside: 'Aside', higgsfield: '힉스필드', search: '자동 검색'};
const arF = {kind: '', source: '', ip: '', q: ''};
async function loadArchive() {
  if (studio.archLoading) return; studio.archLoading = true;
  const { data, error } = await SB.from('pt_image_archive').select('*').eq('hidden', false).order('created_at', {ascending: false}).limit(3000);
  studio.archLoading = false;
  if (error) { studio.archErr = '이미지 아카이브를 불러오지 못했습니다: ' + error.message; studio.arch = []; } else { studio.archErr = ''; studio.arch = data; }
  if (page === 'studio' && studio.tab === 'archive') render();
  window.dispatchEvent(new Event('pt-arch'));
}
const arIps = () => [...new Set((studio.arch || []).flatMap(a => a.ips || []))].sort((a, b) => a.localeCompare(b, 'ko'));
const arMatch = (a, f) => (!f.kind || a.kind === f.kind) && (!f.source || a.source === f.source) && (!f.ip || (a.ips || []).includes(f.ip))
  && (!f.q || [a.what, a.prompt, ...(a.ips || [])].join(' ').toLowerCase().includes(f.q.toLowerCase()));
const arProp = a => { const p = studio.list?.find(x => x.id === a.proposal_id); return p ? `${pTitle(p)}${propSub(p) ? ' · ' + propSub(p) : ''}` : ''; };
// 거르기 줄 + 사진 격자 — 탭 화면과 「아카이브에서 선택」 창이 같이 쓴다
function arFilters(f, id) {
  const all = studio.arch || [], n = k => all.filter(a => arMatch(a, {...f, kind: k})).length;
  return `<div class="ar-tools" id="${id}"><div class="ar-kinds" role="group" aria-label="종류">${[['', '전체'], ...AR_KIND].map(([k, t]) => `<button type="button" class="ar-chip${f.kind === k ? ' on' : ''}" data-ar-kind="${k}" aria-pressed="${f.kind === k}">${t} <small>${n(k)}</small></button>`).join('')}</div>
  <div class="ar-row"><select data-ar-src aria-label="출처" data-nodirty><option value="">모든 출처</option>${Object.entries(AR_SRC).map(([k, t]) => `<option value="${k}"${f.source === k ? ' selected' : ''}>${t}</option>`).join('')}</select><select data-ar-ip aria-label="IP" data-nodirty><option value="">모든 IP</option>${arIps().map(x => `<option${f.ip === x ? ' selected' : ''}>${esc(x)}</option>`).join('')}</select><input type="search" data-ar-q placeholder="설명·IP·프롬프트 검색" value="${esc(f.q)}" aria-label="아카이브 검색"></div></div>`;
}
function arGrid(f, pick) {
  const xs = (studio.arch || []).filter(a => arMatch(a, f));
  if (!xs.length) return `<div class="empty"><p>${(studio.arch || []).length ? '조건에 맞는 이미지가 없습니다.' : '아직 보관된 이미지가 없습니다.<br>제안서 이미지를 확보하거나 생성하면 이곳에 자동으로 보관됩니다.'}</p></div>`;
  return `<div class="ar-grid">${xs.slice(0, 300).map(a => `<button type="button" class="ar-card" data-ar="${a.id}"${pick ? ' data-ar-pick="1"' : ''}><div class="ithumb" data-ar-thumb="${esc(a.path)}"></div><span class="ar-meta"><b>${esc(AR_KO[a.kind] || a.kind)}</b><span class="pill">${esc(AR_SRC[a.source] || a.source)}</span></span><small>${esc(whatText(a.what) || '설명 없음')}</small><small class="ar-ip">${esc((a.ips || []).join(' · '))}</small></button>`).join('')}</div>${xs.length > 300 ? `<p class="panel-caption">${xs.length}장 중 300장만 표시됩니다. 유형·IP로 범위를 좁혀 주세요.</p>` : ''}`;
}
async function arThumbs(root) {
  const els = [...root.querySelectorAll('[data-ar-thumb]')], paths = [...new Set(els.map(e => e.dataset.arThumb))];
  for (let i = 0; i < paths.length; i += 100) {
    const { data } = await SB.storage.from('pt-studio').createSignedUrls(paths.slice(i, i + 100), 3600);
    (data || []).forEach(x => { if (x.signedUrl) root.querySelectorAll(`[data-ar-thumb="${CSS.escape(x.path)}"]`).forEach(el => { el.style.backgroundImage = `url("${x.signedUrl}")`; }); });
  }
}
// 거르기 묶기 — 바뀌면 redraw()
function arBind(root, f, redraw) {
  root.querySelectorAll('[data-ar-kind]').forEach(b => b.onclick = () => { f.kind = b.dataset.arKind; redraw(); });
  const s = root.querySelector('[data-ar-src]'), ip = root.querySelector('[data-ar-ip]'), q = root.querySelector('[data-ar-q]');
  if (s) s.onchange = () => { f.source = s.value; redraw(); };
  if (ip) ip.onchange = () => { f.ip = ip.value; redraw(); };
  if (q) { let t; q.oninput = () => { clearTimeout(t); t = setTimeout(() => { f.q = q.value.trim(); redraw(true); }, 250); }; }
}
function studioArchive() {
  if (!studio.arch) { setTimeout(loadArchive); return '<div class="empty"><p>이미지 아카이브를 불러오는 중입니다<span class="dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></p></div>'; }
  if (studio.archErr) return `<div class="notice">${esc(studio.archErr)}</div>`;
  return `<section class="panel"><div class="panel-head"><div><div class="panel-title">이미지 아카이브 <small>${studio.arch.length}장</small></div><p class="panel-caption">제안서를 만들며 Aside로 찾거나 힉스필드로 생성한 이미지입니다. 이미지를 클릭하면 크게 보거나 다운로드할 수 있고, 제안서 이미지 확인·수정 화면의 「아카이브에서 선택」으로 다른 제안서에 적용할 수 있습니다.</p></div></div>
  ${arFilters(arF, 'ar-tools')}<div id="ar-body">${arGrid(arF)}</div></section>`;
}
function bindArchive() {
  const host = $('#ar-tools'); if (!host) return;
  const redraw = keepInput => {
    if (keepInput) { $('#ar-body').innerHTML = arGrid(arF); } else { host.outerHTML = arFilters(arF, 'ar-tools'); $('#ar-body').innerHTML = arGrid(arF); bindArchive(); return; }
    arCards($('#ar-body')); arThumbs($('#ar-body'));
  };
  arBind(host, arF, redraw); arCards($('#ar-body')); arThumbs($('#ar-body'));
}
function arCards(root) { root.querySelectorAll('[data-ar]:not([data-ar-pick])').forEach(b => b.onclick = () => arView(b.dataset.ar)); }
async function arView(id) {
  const a = studio.arch.find(x => x.id === id); if (!a) return;
  const from = arProp(a);
  modal(`<div class="ar-view"><h2>${esc(AR_KO[a.kind] || a.kind)} <span class="pill">${esc(AR_SRC[a.source] || a.source)}</span></h2><div class="ar-big"><img id="ar-img" alt="${esc(whatText(a.what))}"></div>
  <div class="detail-row"><span>설명</span><b>${esc(whatText(a.what) || '—')}</b></div><div class="detail-row"><span>IP</span><b>${esc((a.ips || []).join(' · ') || '—')}</b></div>
  ${a.w && a.h ? `<div class="detail-row"><span>크기</span><b>${a.w} × ${a.h}</b></div>` : ''}${from ? `<div class="detail-row"><span>최초 사용 제안서</span><b>${esc(from)}${a.slide ? ` · ${a.slide}페이지` : ''}</b></div>` : ''}
  <div class="detail-row"><span>보관일</span><b>${esc(kst(a.created_at))}</b></div>
  ${a.source_page ? `<div class="detail-row"><span>출처</span><b><a href="${esc(a.source_page)}" target="_blank" rel="noopener">${esc(a.source_page.replace(/^https?:\/\//, '').slice(0, 60))} ↗</a></b></div>` : ''}
  ${a.prompt ? `<details class="ar-prompt"><summary>생성 프롬프트</summary><p>${esc(a.prompt)}</p><button class="text-btn" type="button" id="ar-copy">프롬프트 복사</button></details>` : ''}
  <label>종류<select id="ar-kind" data-nodirty>${AR_KIND.map(([k, t]) => `<option value="${k}"${a.kind === k ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
  <div class="modal-actions"><button class="button" type="button" id="ar-hide">아카이브에서 제외</button><button class="button" type="button" data-cancel>닫기</button><button class="button primary" type="button" id="ar-down">${icon('download')} 원본 다운로드</button></div></div>`);
  $('#modal').classList.add('wide'); $('#modal').addEventListener('close', () => $('#modal').classList.remove('wide'), {once: true});
  SB.storage.from('pt-studio').createSignedUrl(a.path, 3600).then(({ data }) => { if (data && $('#ar-img')) $('#ar-img').src = data.signedUrl; });
  $('#ar-copy')?.addEventListener('click', async () => { try { await navigator.clipboard.writeText(a.prompt); toast('프롬프트를 복사했습니다.'); } catch { toast('복사하지 못했습니다.'); } });
  $('#ar-down').onclick = async () => {
    const ext = a.path.split('.').pop(), name = `${(a.ips || []).join('_') || 'image'}_${AR_KO[a.kind] || a.kind}_${a.id.slice(0, 6)}.${ext}`.replace(/[\\/:*?"<>|\s]+/g, '_');
    const { data, error } = await SB.storage.from('pt-studio').createSignedUrl(a.path, 600, {download: name});
    if (error) return toast('다운로드하지 못했습니다: ' + error.message);
    const l = document.createElement('a'); l.href = data.signedUrl; l.download = name; document.body.appendChild(l); l.click(); l.remove();
  };
  $('#ar-kind').onchange = async ev => { const old = a.kind, k = ev.target.value;
    await optimistic(() => { a.kind = k; render(); }, () => SB.from('pt_image_archive').update({kind: k}).eq('id', a.id), () => { a.kind = old; ev.target.value = old; render(); });
    toast(`「${AR_KO[k]}」(으)로 이동했습니다.`); };
  $('#ar-hide').onclick = async () => { const i = studio.arch.indexOf(a);
    $('#modal').close();
    const done = await optimistic(() => { studio.arch.splice(i, 1); render(); }, () => SB.from('pt_image_archive').update({hidden: true}).eq('id', a.id), () => { studio.arch.splice(i, 0, a); render(); }, '삭제하지 못해 원래대로 복원했습니다');
    if (done) toast('아카이브에서 제외했습니다.', {fn: async () => { const r = await SB.from('pt_image_archive').update({hidden: false}).eq('id', a.id); if (r.error) throw r.error; studio.arch.splice(i, 0, a); render(); toast('실행을 취소했습니다.'); }}); };
}
// 제안서 이미지 확인·수정 카드 「아카이브에서 선택」 — 고른 이미지를 그 자리에 넣는다(복사본 그대로 · 내 이미지로 교체와 같은 흐름)
const AR_NEAR = {official: 'official', logo: 'logo', capture: 'capture', reference: 'reference', ai_concept: 'ai_concept', mockup: 'mockup', texture: 'texture'};
function arPick(p, key, done) {
  const S = (studio.list?.find(x => x.id === p.id)?.data || p.data).images.slots, s = S[key];
  const ip = [p.ip_a_name, p.ip_b_name].filter(Boolean);
  const f = {kind: AR_NEAR[s.kind] || '', source: '', ip: '', q: ''};
  const draw = () => {
    const box = $('#arp'); if (!box) return;
    if (!studio.arch) { box.innerHTML = '<div class="empty"><p>이미지 아카이브를 불러오는 중입니다<span class="dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></p></div>'; return; }
    box.innerHTML = arFilters(f, 'arp-tools') + `<div id="arp-body">${arGrid(f, true)}</div>`;
    arBind($('#arp-tools'), f, keep => { if (keep) { $('#arp-body').innerHTML = arGrid(f, true); bindPick(); } else draw(); });
    bindPick();
  };
  const bindPick = () => { const b = $('#arp-body'); arThumbs(b); b.querySelectorAll('[data-ar-pick]').forEach(c => c.onclick = async () => {
    const a = studio.arch.find(x => x.id === c.dataset.ar); if (!a) return;
    $('#modal').close(); if (await useArchive(p, key, a)) done?.(); }); };
  modal(`<div><h2>아카이브에서 선택</h2><p>${esc(whatText(s.what))} 위치에 적용할 이미지를 선택해 주세요. ${ip.length ? `${esc(ip.join(' · '))} 이미지만 보려면 IP를 선택해 주세요.` : ''}</p><div id="arp"></div><div class="modal-actions"><button class="button" type="button" data-cancel>닫기</button></div></div>`);
  $('#modal').classList.add('wide'); $('#modal').addEventListener('close', () => { $('#modal').classList.remove('wide'); window.removeEventListener('pt-arch', draw); }, {once: true});
  window.addEventListener('pt-arch', draw); draw(); if (!studio.arch) loadArchive();
}
async function useArchive(p, key, a) {
  const { data: row, error: e0 } = await SB.from('pt_proposal').select('data').eq('id', p.id).single();
  if (e0) return toast('불러오지 못했습니다: ' + e0.message);
  const d = row.data, was = d.images.slots[key];
  const slots = {...d.images.slots, [key]: {...was, status: 'found', via: 'archive', archive_id: a.id, path: a.path, source_page: a.source_page || '', image_url: a.image_url || '', w: a.w, h: a.h, pos: {}, cand: undefined, before: undefined}};
  const { error } = await SB.from('pt_proposal').update({data: {...d, images: {...d.images, slots}}}).eq('id', p.id);
  if (error) return toast('저장하지 못했습니다: ' + error.message);
  await proposalEvent(p.id, `이미지 ${key} 을(를) 아카이브 이미지로 교체했습니다`);
  studio.list = null; await loadStudio(); toast('아카이브 이미지로 교체했습니다. 「변경 사항 반영」을 클릭하면 제안서에 적용됩니다.', {fn: async () => {
    const { data: r2 } = await SB.from('pt_proposal').select('data').eq('id', p.id).single(); const d2 = r2.data;
    await SB.from('pt_proposal').update({data: {...d2, images: {...d2.images, slots: {...d2.images.slots, [key]: was}}}}).eq('id', p.id);
    await proposalEvent(p.id, `이미지 ${key} 교체를 취소했습니다`); studio.list = null; await loadStudio(); toast('원래 이미지로 복원했습니다.'); window.dispatchEvent(new Event('pt-refresh')); }});
  return true;
}
// 레퍼런스 분석 진행률 — 궁니르 봇이 pt_proposal_job.result 에 3초마다 적는 값(1~100% · 남은 초)을 읽어 막대로
const refJob = r => studio.jobs.find(j => j.ref_id === r.id && j.kind === 'analyze_reference');
function refProg(r) {
  const j = refJob(r), g = j?.result;
  if (!j || j.status === 'wait' || !g) {
    const long = j && Date.now() - Date.parse(j.at) > 120000;
    return `<span class="ref-prog" data-ref-prog="${r.id}"><span class="pill">분석 대기</span><small>궁니르 봇 작업 대기 중<span class="dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></small>${long ? '<small class="warn">2분 넘게 대기 중입니다. DB 관리에서 궁니르 봇을 재시작해 주세요.</small>' : ''}</span>`;
  }
  return `<span class="ref-prog" data-ref-prog="${r.id}" data-k="r${r.id}" data-eta="${g.eta}" data-at="${esc(g.at)}" data-step="${esc(g.step || '')}"><span class="row"><span class="bar" role="progressbar" aria-valuenow="${g.progress}" aria-valuemin="0" aria-valuemax="100"><i style="width:${g.progress}%"></i></span><b>${g.progress}%</b></span><small>${esc(g.step || '분석 중')}</small></span>`;
}
let studioPoll, studioTick;
async function pollRefJobs() {
  if (page !== 'studio') return;
  const ids = (studio.refs || []).filter(r => r.status === 'uploaded' || r.status === 'analyzing').map(r => r.id);
  if (!ids.length) return;
  const { data, error } = await SB.from('pt_proposal_job').select('id,proposal_id,ref_id,kind,status,at,error,result,input').eq('kind', 'analyze_reference').in('ref_id', ids).order('at', {ascending: false});
  if (error || page !== 'studio') return;
  if (ids.some(id => { const j = data.find(x => x.ref_id === id); return j && (j.status === 'done' || j.status === 'fail'); })) return loadStudio();
  studio.jobs = [...studio.jobs.filter(j => !ids.includes(j.ref_id)), ...data.filter(j => j.status === 'wait' || j.status === 'work')];
  ids.forEach(id => { const r = studio.refs.find(x => x.id === id), card = document.querySelector(`[data-ref-learn="${id}"]`); if (!r) return; if (card) { card.outerHTML = refLearnCard(r); bindStudioBtns(); } document.querySelectorAll(`[data-ref-prog="${id}"]`).forEach(el => { el.outerHTML = refProg(r); }); });
  studioPoll = setTimeout(pollRefJobs, 3000);
}
// 목록에서도 진행이 보이게 — 작업 중인 프로젝트가 있으면 3초마다 진행률·상태를 다시 읽는다
function rowProg(p) {
  // 도는 작업(진행률 있는 것 먼저)을 보여 준다 — 예전엔 아무 작업이나 잡아 「작업 대기 중」으로 보여 멈춘 줄 알았다 (10-30)
  const js = studio.jobs.filter(x => x.proposal_id === p.id && ['wait', 'work'].includes(x.status));
  const j = js.find(x => x.status === 'work' && x.result?.progress) || js.find(x => x.status === 'work') || js[0], g = j?.result;
  if (!j) return `<small class="row-prog">다음 작업을 준비하는 중<span class="dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></small>`;
  if (j.status === 'wait') return `<small class="row-prog">${esc(jobName(j))} 시작 대기 중<span class="dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></small>`;
  if (!g?.progress) return `<span class="ref-prog row-prog"><span class="row"><span class="bar indet"><i></i></span></span><small>${esc(jobName(j))} 진행 중</small></span>`;
  return `<span class="ref-prog row-prog"><span class="row"><span class="bar"><i style="width:${g.progress}%"></i></span><b>${g.progress}%</b></span><small>${esc(g.step || '')}</small></span>`;
}
let listPoll;
async function pollProjects() {
  if (page !== 'studio' || studio.tab !== 'projects') return;
  const ids = (studio.list || []).filter(p => p.status === 'working').map(p => p.id);
  if (!ids.length) return;
  const [ps, js] = await Promise.all([SB.from('pt_proposal').select('id,status,stage').in('id', ids),
    SB.from('pt_proposal_job').select('id,proposal_id,ref_id,kind,status,at,error,result,input').in('proposal_id', ids).in('status', ['wait', 'work'])]);
  if (ps.error || js.error || page !== 'studio' || !studio.list) return;          // 그 사이 목록을 새로 읽는 중이면 그쪽에 맡긴다
  if (ps.data.some(x => { const o = studio.list.find(p => p.id === x.id); return o && (o.status !== x.status || o.stage !== x.stage); })) { studio.list = null; return loadStudio(); }
  studio.jobs = [...studio.jobs.filter(j => !ids.includes(j.proposal_id)), ...js.data];
  ids.forEach(id => { const p = studio.list.find(x => x.id === id); if (p) document.querySelectorAll(`[data-prow="${id}"]`).forEach(el => { el.innerHTML = rowProg(p); }); });
  listPoll = setTimeout(pollProjects, 3000);
}
function bindStudio() {
  clearTimeout(studioPoll); clearInterval(studioTick); clearTimeout(listPoll);
  if ((studio.list || []).some(p => p.status === 'working')) listPoll = setTimeout(pollProjects, 3000);
  if ((studio.refs || []).some(r => r.status === 'uploaded' || r.status === 'analyzing')) {
    studioPoll = setTimeout(pollRefJobs, 3000);
  }
  bindStudioBtns();
  bindRefNew();
  bindStudioFilters();
  if (studio.tab === 'archive') bindArchive();
  $$('[data-pfilter]').forEach(b => { const pick = () => { const v = b.dataset.pfilter; studio.filter = studio.filter === v ? 'all' : v; render(); }; b.onclick = pick; b.onkeydown = ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); pick(); } }; });
  bindPjRows(document);
  $$('[data-ref-open]').forEach(b => b.onclick = ev => { ev.stopPropagation(); refFile(b.dataset.refOpen); });
  $$('[data-ref-default]').forEach(b => b.onclick = () => setRefDefault(b));
}
async function setRefDefault(b) {
  {
    b.disabled = true;
    const old = studio.refs.filter(r => r.is_default).map(r => r.id);
    if (old.length) await SB.from('pt_proposal_ref').update({is_default: false}).in('id', old);
    const { error } = await SB.from('pt_proposal_ref').update({is_default: true}).eq('id', b.dataset.refDefault);
    if (error) { b.disabled = false; return toast('기본 포맷을 지정하지 못했습니다: ' + error.message); }
    studio.refs = null; studio.list = null; await loadStudio(); toast('기본 포맷으로 지정했습니다.');
  }
}

// 학습 진행 카드처럼 다시 그리는 곳에서도 쓰는 단추들
function bindStudioBtns() {
  $$('[data-ref-view]').forEach(b => b.onclick = ev => { ev.stopPropagation(); openRef(b.dataset.refView); });
  $$('[data-ref-relearn]').forEach(b => b.onclick = ev => { ev.stopPropagation(); b.disabled = true; refRelearn(b.dataset.refRelearn); });
  $$('[data-ref-new]').forEach(b => b.onclick = studioRefModal);
  $$('[data-studio-tab]').forEach(b => b.onclick = () => { studio.tab = b.dataset.studioTab; studio.refNew = null; if (studio.tab === 'archive') studio.arch = null; render(); });
}
function bindPjRows(root) {
  root.querySelectorAll('[data-psort]').forEach(b => b.onclick = ev => { ev.stopPropagation(); const k = b.dataset.psort; studio.sort = studio.sort.k === k ? {k, d: -studio.sort.d} : {k, d: ['updated', 'created'].includes(k) ? -1 : 1}; render(); });
  root.querySelectorAll('[data-proposal]').forEach(b => { b.onclick = () => openProposal(b.dataset.proposal); b.onkeydown = e => { if (e.key === 'Enter') openProposal(b.dataset.proposal); }; });
}
// 검색 칸은 글자마다 표만 다시 그린다(입력 칸 포커스·한글 조합 유지) · 고르개는 화면 전체를 다시 그린다
function liveSearch(input, go) {
  if (!input) return; let t;
  const run = () => { clearTimeout(t); t = setTimeout(go, 150); };
  input.addEventListener('input', e => { if (!e.isComposing) run(); });
  input.addEventListener('compositionend', run);
}
function bindStudioFilters() {
  liveSearch($('[data-pq]'), () => {
    studio.q = $('[data-pq]').value; const ps = pjFiltered();
    $('#pj-body').innerHTML = pjTable(ps); $('#pj-count').textContent = `${ps.length}건 · ${SORT_KO[studio.sort.k]}`;
    const c = $('[data-pclear]'); if (c) c.hidden = !pjAny(); bindPjRows($('#pj-body')); clearTimeout(listPoll); if (ps.some(p => p.status === 'working')) listPoll = setTimeout(pollProjects, 3000);
  });
  $$('[data-pstage]').forEach(x => x.onchange = () => { studio.stage = Number(x.value) || 0; render(); });
  $$('[data-pstatus]').forEach(x => x.onchange = () => { studio.filter = x.value; render(); });
  $$('[data-pby]').forEach(x => x.onchange = () => { studio.by = x.value; render(); });
  $$('[data-pclear]').forEach(b => b.onclick = () => { Object.assign(studio, {filter: 'all', by: '', stage: 0, q: ''}); render(); });
  liveSearch($('[data-ref-q]'), () => {
    studio.refQ = $('[data-ref-q]').value; const rs = studio.refs.filter(refMatch);
    $('#ref-body').innerHTML = refTable(rs); $('#ref-count').textContent = rs.length === studio.refs.length ? `${rs.length}건` : `${rs.length} / ${studio.refs.length}건`;
    bindStudioBtns(); $$('#ref-body [data-ref-open]').forEach(b => b.onclick = ev => { ev.stopPropagation(); refFile(b.dataset.refOpen); });
    $$('#ref-body [data-ref-default]').forEach(b => b.onclick = () => setRefDefault(b));
  });
  $$('[data-ref-type]').forEach(b => b.onclick = () => { studio.refType = b.dataset.refType; render(); });
}

const IMG_KIND = {official: '공식 이미지', logo: '로고', ai_concept: 'AI 컨셉 이미지', mockup: '목업', reference: '참고 사례', capture: '캡처', texture: '배경·질감'};
function openRef(id) {
  const r = studio.refs?.find(x => x.id === id), f = r?.profile; if (!f?.pages) return;
  activeDetail = 'r:' + id;
  const kinds = Object.entries(f.image_pattern?.by_kind || {}).filter(([, n]) => n).sort((a, b) => b[1] - a[1]);
  const st = f.style || {}, s = f.story || {}, w = f.writing || {}, d = f.design || {};
  const rows = xs => xs.filter(([, v]) => v).map(([k, v]) => `<div class="detail-row ref-row"><span>${k}</span><b>${esc(v)}</b></div>`).join('');
  const tags = xs => (xs || []).filter(Boolean).map(x => `<span class="tag">${esc(x)}</span>`).join('');
  const hex = c => /^#[0-9a-f]{3,8}$/i.test(c || '');
  // 11-04 자세히 학습 — 설득 흐름·문어체(원문 예시)·디자인(색 용도·반복 요소)·페이지별 원문까지
  const pages = (f.pages || []).map(x => { const c = x.copy || {}; return `<tr><td>${esc(x.page)}</td><td>${esc(x.role || '')}<small class="cell-sub">${esc(x.title || '')}</small>${x.purpose ? `<small class="cell-sub">${esc(x.purpose)}</small>` : ''}</td><td>${esc(x.layout || '')}${c.headline || c.eyebrow ? `<small class="cell-sub ref-copy">${esc([c.eyebrow, c.headline, c.sub].filter(Boolean).join(' / '))}</small>` : ''}${(x.images || []).length ? `<small class="cell-sub">${x.images.map(i => esc(`${IMG_KIND[i.kind] || i.kind} ${i.ratio || ''}${i.what ? ' · ' + i.what : ''}`)).join('<br>')}</small>` : ''}</td></tr>`; }).join('');
  const busy = refBusy(r);
  showDrawer(`<span class="entity-avatar">${icon('studio')}</span><h2>${esc(r.title)}</h2><span class="detail-sub">${esc([refPair(r), refType(r), r.recipient, r.author].filter(Boolean).join(' · '))}</span>
  ${busy ? `<div class="detail-block"><h3>다시 학습 중</h3>${refProg(r)}<p class="muted-box">완료 전까지는 아래 학습 결과로 제안서를 생성합니다.</p></div>` : ''}
  ${!busy && !refDeep(r) ? `<div class="detail-block"><p class="muted-box">구성·이미지 위주로 학습한 레퍼런스입니다. 다시 학습하면 문어체·디자인·설득 흐름까지 상세히 학습합니다.</p></div>` : ''}
  ${f.relearn_error && !busy ? `<div class="detail-block"><p class="muted-box">최근 재학습에 실패해 이전 학습 결과를 사용하고 있습니다. (${esc(f.relearn_error)})</p></div>` : ''}
  <div class="detail-block"><h3>구성 요약</h3><p>${esc(f.summary || '')}</p>${rows([['콜라보', refPair(r)], ['유형', refType(r)], ['페이지', `${f.page_count || (f.pages || []).length}페이지`], ['이미지', `${f.image_pattern?.total || 0}장`], ['학습일', f.analyzed_at ? ymd(f.analyzed_at) : '']])}${r.is_default ? '<div class="detail-row"><span>기본 포맷</span><b><span class="pill good">기본</span></b></div>' : ''}${r.note ? `<p class="muted-box">중점 학습 사항: ${esc(r.note)}</p>` : ''}</div>
  ${Object.values(s).some(Boolean) ? `<div class="detail-block"><h3>설득 흐름</h3>${rows([['도입', s.hook], ['설득 순서', s.logic], ['더올마이티 소개', s.why_us], ['마무리', s.close], ['페이지 전개', s.rhythm]])}</div>` : ''}
  ${(f.acts || []).length ? `<div class="detail-block"><h3>섹션 구성</h3><ol class="rule-list">${f.acts.map(a => `<li><b>${esc(a.name || '')}</b> <span class="muted">· ${esc(a.pages || '')}페이지</span><br><small>${esc(a.purpose || '')}</small></li>`).join('')}</ol></div>` : ''}
  ${w.register ? `<div class="detail-block"><h3>문어체</h3>${rows([['문체', w.register], ['제목', w.headline], ['라벨', w.eyebrow], ['본문', w.body], ['숫자 표기', w.numbers]])}
    ${(w.terms || []).length ? `<div class="ref-sub">주요 표현</div><div>${tags(w.terms)}</div>` : ''}${(w.endings || []).length ? `<div class="ref-sub">문장 종결</div><div>${tags(w.endings)}</div>` : ''}
    ${(w.samples || []).length ? `<div class="ref-sub">원문 예시</div><ul class="ref-samples">${w.samples.map(x => `<li><small>${esc(x.page ? x.page + '페이지' : '')}${x.kind ? ' · ' + esc({headline: '제목', eyebrow: '라벨', body: '본문', caption: '캡션', cta: '맺음말'}[x.kind] || x.kind) : ''}</small>${esc(x.text)}</li>`).join('')}</ul>` : ''}
    ${(w.avoid || []).length ? `<div class="ref-sub">지양하는 표현</div><ul class="rule-list">${w.avoid.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</div>`
    : `<div class="detail-block"><h3>문체</h3>${rows([['문체', st.tone], ['강조', st.emphasis]])}</div>`}
  <div class="detail-block"><h3>디자인</h3>${rows([['전체 인상', d.mood], ['판형', d.canvas], ['배경', d.background], ['여백·레이아웃', d.grid], ['글꼴', d.type || st.type], ['표지', d.cover], ['섹션 표지', d.section], ['정보량', d.density]])}
    ${(d.colors || []).length ? `<div class="ref-sub">색</div>${d.colors.filter(c => hex(c.hex)).map(c => `<div class="detail-row ref-row"><span><i class="swatch" style="background:${c.hex}"></i> ${esc(c.hex)}</span><b>${esc(c.use || '')}</b></div>`).join('')}`
      : (st.colors || []).length ? `<div class="detail-row"><span>주요 색</span><b>${st.colors.filter(hex).map(c => `<i class="swatch" style="background:${c}" title="${c}"></i>`).join('')}</b></div>` : ''}
    ${(d.components || []).length ? `<div class="ref-sub">반복 요소</div><ul class="rule-list">${d.components.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</div>
  ${kinds.length ? `<div class="detail-block"><h3>이미지 사용</h3>${kinds.map(([k, n]) => `<div class="detail-row"><span>${esc(IMG_KIND[k] || k)}</span><b>${n}장</b></div>`).join('')}${f.image_pattern?.note ? `<p>${esc(f.image_pattern.note)}</p>` : ''}</div>` : ''}
  ${(f.rules || []).length ? `<div class="detail-block"><h3>새 제안서 작성 기준</h3><ol class="rule-list">${f.rules.map(x => `<li>${esc(x)}</li>`).join('')}</ol></div>` : ''}
  ${pages ? `<div class="detail-block"><h3>페이지별 구성</h3><div class="table-wrap"><table class="ref-pages"><thead><tr><th>페이지</th><th>역할</th><th>배치·원문·이미지</th></tr></thead><tbody>${pages}</tbody></table></div></div>` : ''}
  ${busy ? '' : `<div class="drawer-actions"><button class="button" id="ref-relearn">다시 학습</button><button class="button" data-ref-open="${r.id}" id="ref-file">원본 열기 ↗</button></div>`}`);
  $('#ref-relearn')?.addEventListener('click', ev => { ev.currentTarget.disabled = true; refRelearn(r.id); });
  $('#ref-file')?.addEventListener('click', () => refFile(r.id));
}

const SCORE_KO = {fandom: '팬덤', world: '세계관', asset: '자산 결합', business: '사업성', timing: '타이밍', risk: '리스크'};
const host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return '출처'; } };
const srcLinks = urls => (urls || []).map(u => `<a class="src" href="${esc(u)}" target="_blank" rel="noopener">${esc(host(u))}</a>`).join('');
// 단계 작업 진행률 — 궁니르 봇이 job.result 에 3초마다 적는 값을 막대로 (레퍼런스 분석과 같은 모양)
function jobProg(j) {
  const g = j?.result;
  // 진행률을 남기지 않는 작업(자동 검수·Aside 등)도 돌고 있으면 움직이는 막대 + 경과 시간 (10-30)
  if (j && j.status === 'work' && !g) return `<div class="ref-prog wide job-prog run" data-since="${esc(j.claimed_at || j.at)}"><span class="row"><span class="bar indet" role="progressbar" aria-label="진행 중"><i></i></span></span><small>${esc(jobName(j) || '작업')} 진행 중</small></div>`;
  if (!j || j.status === 'wait' || !g) return `<p class="job-wait">${j?.kind === 'aside' ? 'Aside 작업 대기 중' : '궁니르 봇 작업 대기 중'}<span class="dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></p>`;
  return `<div class="ref-prog wide job-prog" data-k="j${j.id}" data-eta="${g.eta}" data-at="${esc(g.at)}" data-step="${esc(g.step || '')}"><span class="row"><span class="bar" role="progressbar" aria-valuenow="${g.progress}" aria-valuemin="0" aria-valuemax="100"><i style="width:${g.progress}%"></i></span><b>${g.progress}%</b></span><small>${esc(g.step || '진행 중')}</small></div>`;
}
// 한 단계에 작업이 둘일 때(리서치 = 공개 웹 + 팬·SNS) 막대를 이름과 함께 나란히 (10-28)
const JOB_KO = {qa: '자동 검수', partners: '파트너 추천', research: '공개 웹 리서치', concepts: '컨셉 설계', build: '제안서 생성', image_plan: '이미지 수급', finalize: '제안서 다시 생성', generate: 'AI 이미지 생성'};
// 이미지 한두 자리만 다루는 작업은 「26페이지 2번째 이미지 · 무엇」까지 보인다 (10-30 김현우 「몇 페이지 몇 번째 이미지인지」)
const jobWhere = j => { const keys = j.input?.keys || (j.input?.slots || []).map(x => x.key); if (!keys?.length || keys.length > 3) return '';
  const d = studio.list?.find(x => x.id === j.proposal_id)?.data || {}, S = d.images?.slots || {}, B = d.build?.boxes || {};
  return keys.map(k => { const s = S[k]; if (!s) return ''; const pg = +(B[k]?.page || s.slide);
    const same = Object.keys(S).filter(x => +(B[x]?.page || S[x].slide) === pg).sort((a, b) => (B[a]?.y ?? 0) - (B[b]?.y ?? 0) || (B[a]?.x ?? 0) - (B[b]?.x ?? 0) || a.localeCompare(b));
    const pgs = [...new Set((B[k]?.at || []).map(a => +a.page))].sort((a, b) => a - b);
    if (pgs.length > 1) return `${pgs.join('·')}페이지 이미지 「${whatText(s.what).slice(0, 24)}」`;      // 여러 페이지에 쓴 이미지
    return `${pg}페이지${same.length > 1 ? ` ${same.indexOf(k) + 1}번째` : ''} 이미지 「${whatText(s.what).slice(0, 24)}」`; }).filter(Boolean).join(', '); };
const jobName = j => { const base = j.kind === 'aside' ? (j.input?.task === 'social' ? '팬·SNS 조사 · Aside' : '이미지 검색 · Aside') : (JOB_KO[j.kind] || ''), w = j.kind === 'aside' && j.input?.task ? '' : jobWhere(j);
  return w ? `${base} · ${w}` : base; };
const jobsProg = list => `<div id="job-progs">${list.length > 1 || (list[0] && jobWhere(list[0])) ? list.map(j => `<p class="sub-label">${esc(j ? jobName(j) : '')}</p>${jobProg(j)}`).join('') : jobProg(list[0])}</div>`;
const liveJobs = id => studio.jobs.filter(j => j.proposal_id === id && ['wait', 'work'].includes(j.status)).sort((a, b) => a.id - b.id);
let propPoll, propShown = '';     // 상세 화면이 지금 그리고 있는 상태(상태|단계) — 목록이 먼저 바뀌어도 화면을 다시 그리게 (11-04)
async function pollProposal(id) {
  if (activeDetail !== 'p:' + id) return;
  const [p, j] = await Promise.all([SB.from('pt_proposal').select('*').eq('id', id).single(), SB.from('pt_proposal_job').select('id,proposal_id,ref_id,kind,status,at,error,result,input').eq('proposal_id', id).order('id', {ascending: false}).limit(4)]);
  if (activeDetail !== 'p:' + id || p.error || !studio.list) { if (activeDetail === 'p:' + id) propPoll = setTimeout(() => pollProposal(id), 3000); return; }
  // 화면에 그린 상태와 비교한다 — 목록(studio.list)은 따로 새로 고쳐져 먼저 바뀔 수 있어, 그것과 비교하면 파트너 추천이 끝나도 화면이 「진행 중」에 머물렀다 (11-04 김현우)
  if (`${p.data.status}|${p.data.stage}` !== propShown) { studio.list = null; await loadStudio(); return openProposal(id, true); }
  const got = j.data || [];
  if (got.length) {
    studio.jobs = [...studio.jobs.filter(x => !got.some(g => g.id === x.id)), ...got];
    const live = got.filter(x => ['wait', 'work'].includes(x.status)).sort((a, b) => a.id - b.id);
    const el = $('#job-progs'); if (el) el.outerHTML = jobsProg(live.length ? live : [got[0]]);
  }
  propPoll = setTimeout(() => pollProposal(id), 3000);
}
// 새 버전 알림 (10-29) — 판테온 탭을 며칠 열어 두면 예전 화면이 남는다(홍석진 대표님 10/27 화면). 5분마다·탭으로 돌아올 때 확인
const MY_VER = (document.querySelector('script[src*="app.js?v="]')?.src.match(/v=([\w]+)/) || [])[1] || '';
async function checkVersion() {
  if (!MY_VER || $('#new-ver')) return;
  try {
    const html = await (await fetch(location.pathname + '?nv=' + Date.now(), {cache: 'no-store'})).text();
    const v = (html.match(/app\.js\?v=([\w]+)/) || [])[1];
    if (v && v !== MY_VER) {
      const bar = document.createElement('div'); bar.id = 'new-ver';
      bar.innerHTML = (APP === 'gungnir' ? '궁니르가' : '이그드라실이') + ' 업데이트되었습니다. <button class="button primary small" type="button">새로고침</button>';
      bar.querySelector('button').onclick = () => location.reload();
      document.body.appendChild(bar);
    }
  } catch {}
}
setInterval(checkVersion, 300000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) checkVersion(); });
function partnersPanel(p) {
  const P = p.data.partners;
  const cats = (P.categories || []).map(cat => {
    const cards = P.candidates.map((c, i) => [c, i]).filter(([c]) => c.category === cat.name).map(([c, i]) => {
      const e = entityByName(c.ip);
      return `<div class="pcard"><div class="pcard-head"><b>${esc(c.ip)}</b><span class="pill ${e ? 'good' : 'bad'}">${contactPoint(e)}</span></div><p>${esc(c.one_line_concept || '')}</p><div class="scores">${Object.entries(SCORE_KO).map(([k, n]) => `<span class="${k === 'risk' ? 'risk' : ''}" title="${n} ${c.scores?.[k] ?? '-'}/5">${n} <b>${c.scores?.[k] ?? '-'}</b><i style="--v:${(c.scores?.[k] || 0) * 20}%"></i></span>`).join('')}</div><div class="pcard-foot"><span>${srcLinks(c.evidence_urls)}</span><button class="button primary small" data-pick="${i}">이 파트너 선택</button></div></div>`;
    }).join('');
    return `<div class="pcat"><div class="pcat-head"><div><b>${esc(cat.name)}</b><small>${esc(cat.reason || '')}</small></div><button class="text-btn" data-reroll="${esc(cat.name)}">다른 후보</button></div>${cards}</div>`;
  }).join('');
  return `<div class="detail-block"><h3>결정 · 파트너 IP 선택</h3><p>카드 하나를 선택하면 궁니르 봇이 두 IP 리서치를 시작합니다. 점수는 1~5점이며, 리스크 점수가 높을수록 위험합니다.</p>${P.ip_a_card?.summary ? `<p class="muted-box">${esc(p.ip_a_name)} · ${esc(P.ip_a_card.summary)}</p>` : ''}${cats}<div class="pcat"><div class="pcat-head"><div><b>직접 입력</b><small>추천 IP 중 적합한 IP가 없으면 원하는 IP를 직접 입력해 진행합니다.</small></div></div><datalist id="pb-ents">${entities().filter(e => !e.hidden).map(e => `<option value="${esc(e.name)}">`).join('')}</datalist><div class="ask-row"><input id="pb-own" list="pb-ents" maxlength="80" placeholder="예: 산리오" aria-label="파트너 IP"><button class="button primary" id="pb-own-go" type="button">이 IP로 진행</button></div><small class="atnote" id="pb-own-note"></small></div><div class="drawer-actions"><button class="button" id="recategorize">카테고리 변경 후 재추천</button></div></div>`;
}
const conceptCard = (c, i) => `<div class="pcard"><div class="pcard-head"><b>${esc(c.name)}</b></div>${c.key_copy ? `<p class="key-copy">“${esc(c.key_copy)}”</p>` : ''}<p>${esc(c.summary || '')}</p>${c.world ? `<details><summary>세계관</summary><p>${esc(c.world)}</p></details>` : ''}${(c.axes || []).length ? `<p class="sub-label">연결 포인트</p><ul class="axes">${c.axes.map(a => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}${(c.formats || []).length ? `<p class="sub-label">실행 포맷</p><ul class="axes">${c.formats.map(f => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}${c.why ? `<small class="why">${esc(c.why)}</small>` : ''}${i !== undefined ? `<div class="pcard-foot"><span></span><button class="button primary small" data-concept="${i}">이 컨셉으로 확정</button></div>` : ''}</div>`;
// ── 제안서 구성 편집기 (11-04 김현우 PRD · 나원태 이사님 요청 · 대표님 승인) — ② 기본 정보 확정에서 뼈대를 정하고 ⑤ 컨셉 확정에서 다듬는다 → data.outline
//    페이지 종류 = pt_page_type (기본 27종 + 레퍼런스 학습으로 자동 추가) · 견본은 궁니르 page_types/<레이아웃>.jpg · 봇은 deck.outline_structure 로 이 순서 그대로 원고를 쓴다
const OL_GROUPS = ['전체', '도입', '배경', '컨셉', '실행', '비즈니스', '공통', '학습한 페이지'];
const OL_TPL = {
  collab: ['콜라보 제안 기본', 'cover disclaimer full_image statement points cases section stats ip_detail compare section hero concept_detail moodboard pillars feature journey big_word product product section columns timeline circles roadmap closing'],
  brand: ['브랜딩·전략 기본', 'cover disclaimer r_3dc0b02eca r_4520bdaf7b r_aded38ed3b r_31c3394339 section r_2cbcbd216e hero concept_detail r_14d45d349d section columns roadmap closing'],
  short: ['요약 제안', 'cover statement points stats compare hero concept_detail pillars feature product columns closing'],
  blank: ['빈 구성', 'cover closing']};
const olType = id => (studio.ptypes || []).find(t => t.id === id);
const olSnap = t => ({id: t.id, name: t.name, layout: t.layout, grp: t.grp, descr: t.descr || '', ...(t.learned && (t.source_refs || []).length ? {from: t.source_refs.map(s => s.title).join(', ').slice(0, 120)} : {})});
const olImg = x => `page_types/${encodeURIComponent(x.layout)}.jpg`;
// 11-06 대표님 「레퍼런스 넣고 돌리면 구성도 레퍼런스에서 끌고 오는 게 효과적」 — 고른 레퍼런스 포맷의 페이지 순서(profile.outline · 봇 page_types.sync_from_ref)가 기본 구성
const olRefs = () => (studio.refs || []).filter(r => r.status === 'ready' && r.profile?.outline?.length);
const olRefOf = p => { const ids = [p.ref_id, ...(p.data?.deck_style?.refs || [])].filter(Boolean); return ids.map(id => olRefs().find(r => r.id === id)).find(Boolean); };
const olDefault = p => { const r = olRefOf(p); return r ? 'ref:' + r.id : p.mode === 'collab' ? 'collab' : 'brand'; };
const olTplName = k => { if (!k.startsWith('ref:')) return OL_TPL[k]?.[0] || ''; const r = olRefs().find(x => 'ref:' + x.id === k); return r ? `레퍼런스 구성 · ${refName(r)}` : '레퍼런스 구성'; };
const olTplOpts = () => [...olRefs().map(r => ['ref:' + r.id, olTplName('ref:' + r.id)]), ...Object.entries(OL_TPL).map(([k, [n]]) => [k, n])];
const olFromTpl = k => (k.startsWith('ref:') ? olRefs().find(r => 'ref:' + r.id === k)?.profile.outline || [] : OL_TPL[k][1].split(' ')).map(olType).filter(Boolean).map(olSnap);
const olOf = p => p.data?.outline?.length ? p.data.outline : olFromTpl(olDefault(p));
function olSummary(p) {
  const ol = olOf(p), saved = !!p.data?.outline?.length;
  return `<div class="ol-sum"><div class="ol-sum-h"><b>페이지 구성</b><small>${ol.length}페이지 · ${saved ? '저장한 구성' : esc(olTplName(olDefault(p))) + '(기본 구성)'}</small><button class="button small" type="button" id="ol-edit">구성 편집</button></div>
    <ol class="ol-strip">${ol.map((x, i) => `<li title="${i + 1}. ${esc(x.name)}"><span style="background-image:url('${olImg(x)}')"></span><small>${i + 1}</small></li>`).join('')}</ol></div>`;
}
function olEditor(p) {
  const types = studio.ptypes || [];
  if (!types.length) return toast('페이지 종류 목록을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.');
  let D = $('#olx'); if (!D) { D = document.createElement('dialog'); D.id = 'olx'; D.className = 'review olx'; document.body.appendChild(D); }
  const later = p.stage >= 5;
  let uid = 0, rows = olOf(p).map(x => ({k: ++uid, x: {...x}})), sel = 0, group = '전체', idx = 0, drag = 0, moving = null, last = null, dirty = false,
    tpl = p.data?.outline?.length ? (p.data.outline_tpl || '') : olDefault(p);
  D.innerHTML = `<div class="rv-head"><div><h2>제안서 구성 · ${esc(pTitle(p))}</h2><small>${later ? '확정한 컨셉에 맞게 페이지를 넣고 빼거나 순서를 바꿉니다. 저장한 구성 그대로 제안서를 생성합니다.' : '제안 방향에 맞는 기본 구성을 불러와 뼈대를 정합니다. 저장한 구성은 리서치·컨셉 설계·제안서 생성에 반영됩니다.'}</small></div><div class="rv-nav"><button class="button" type="button" id="ol-close">닫기</button><button class="button primary" type="button" id="ol-save">이 구성으로 저장</button></div></div>
  <div class="ol-grid">
    <section class="ol-panel" aria-label="페이지 구역"><div class="ol-ph"><h3>페이지 구역 <small id="ol-count"></small></h3><label class="ol-tpl"><span>기본 구성</span><select id="ol-tpl" aria-label="기본 구성"><option value="">선택</option>${olTplOpts().map(([k, n]) => `<option value="${esc(k)}"${k === tpl ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select></label></div>
      <div class="ol-selbar" id="ol-selbar" hidden><span><b id="ol-seln">0</b>개 선택 · 선택한 구역 중 하나를 끌면 한꺼번에 이동합니다</span><span><button type="button" id="ol-seldel" class="danger">선택 삭제</button><button type="button" id="ol-selclear">선택 해제</button></span></div>
      <ol class="ol-list" id="ol-list"></ol><button type="button" class="ol-addend" id="ol-addend">+ 맨 아래에 페이지 구역 추가</button>
      <p class="ol-legend">⠿ 를 끌어 순서 변경 · 체크하면 여러 개를 한꺼번에 이동 · 맨 아래 칸에 놓으면 끝으로 · + 아래에 추가 · − 삭제</p></section>
    <section class="ol-panel" aria-label="페이지 종류"><div class="ol-ph"><h3>페이지 종류 <small id="ol-target"></small></h3><small class="ol-legend">카드를 끌거나 ← → 로 넘기고 Enter로 확정 · 다시 Enter는 확정 취소</small></div>
      <div class="ol-chips" id="ol-chips" role="group" aria-label="분류"></div>
      <div class="ol-stage" id="ol-stage" tabindex="0" aria-roledescription="carousel" aria-label="페이지 종류 카드"></div>
      <div class="ol-nav"><button class="button" type="button" id="ol-prev" aria-label="이전 카드">←</button><span id="ol-dots"></span><button class="button" type="button" id="ol-next" aria-label="다음 카드">→</button></div>
      <p class="ol-desc" id="ol-desc"></p><button class="button primary" type="button" id="ol-apply"></button></section></div>`;
  const q = s => D.querySelector(s), L = q('#ol-list'), S = q('#ol-stage');
  const touch = () => { dirty = true; };
  const list = () => types.filter(t => group === '전체' || (group === '학습한 페이지' ? t.learned : t.grp === group));
  function draw() {
    L.replaceChildren();
    rows.forEach((r, i) => {
      const x = r.x, li = document.createElement('li');
      li.className = 'ol-row' + (i === sel ? ' sel' : '') + (x.layout === 'section' ? ' sec' : '') + (r.ck ? ' checked' : ''); li.draggable = true;
      li.innerHTML = `<span class="ol-handle" aria-hidden="true">⠿</span><input type="checkbox" class="ol-ck"${r.ck ? ' checked' : ''} aria-label="${i + 1}번 구역 선택"><span class="ol-no">${i + 1}</span><span class="ol-thumb" style="background-image:url('${olImg(x)}')"></span>
        <span class="ol-rt"><b></b><small></small></span><span class="ol-rbtn"><button type="button" class="ol-ib add" aria-label="아래에 추가" title="아래에 페이지 구역 추가">+</button><button type="button" class="ol-ib" aria-label="삭제" title="이 페이지 구역 삭제">−</button></span>`;
      li.querySelector('b').textContent = x.name;
      li.querySelector('small').textContent = x.from ? `${x.grp} · 「${x.from}」에서 학습` : x.grp;
      li.querySelector('.ol-ck').onclick = e => { e.stopPropagation(); r.ck = e.target.checked; draw(); };
      li.onclick = e => { if (e.target.closest('button, input')) return; sel = i; syncCarousel(); draw(); if (matchMedia('(max-width:900px)').matches) S.scrollIntoView({block: 'center', behavior: 'smooth'}); };
      li.querySelector('.add').onclick = () => { rows.splice(i + 1, 0, {k: ++uid, x: olSnap(olType('statement') || types[0])}); sel = i + 1; touch(); syncCarousel(); draw(); toast(`${i + 2}번에 페이지 구역을 추가했습니다. 오른쪽에서 종류를 선택해 주세요.`); };
      li.querySelector('.ol-ib:not(.add)').onclick = () => { if (rows.length <= 1) return toast('페이지 구역은 하나 이상 있어야 합니다.'); const before = rows.slice(), [g] = rows.splice(i, 1); sel = Math.min(sel, rows.length - 1); touch(); syncCarousel(); draw();
        toast(`「${g.x.name}」 구역을 삭제했습니다.`, {fn: () => { rows = before; syncCarousel(); draw(); toast('삭제한 구역을 되돌렸습니다.'); }}); };
      // 체크한 구역 중 하나를 끌면 체크한 구역 전부를 원래 순서대로 묶어서 옮긴다 · 체크 안 한 구역을 끌면 그 하나만
      li.ondragstart = e => { const keys = r.ck ? rows.filter(z => z.ck).map(z => z.k) : [r.k]; moving = keys;
        L.querySelectorAll('.ol-row').forEach((el, j) => { if (keys.includes(rows[j].k)) el.classList.add('drag'); });
        e.dataTransfer.setData('text/plain', keys.join(',')); e.dataTransfer.effectAllowed = 'move'; };
      li.ondragend = () => { L.querySelectorAll('.drag').forEach(el => el.classList.remove('drag')); moving = null; };
      li.ondragover = e => { e.preventDefault(); li.classList.add('over'); };
      li.ondragleave = () => li.classList.remove('over');
      li.ondrop = e => { e.preventDefault(); li.classList.remove('over'); moveBefore(r.k); };
      // 폰·태블릿 — 손가락으로 ⠿ 를 끌어 옮긴다 (터치에서는 HTML5 끌어 놓기가 동작하지 않는 기기가 있음 · 11-04)
      const hd = li.querySelector('.ol-handle');
      hd.onpointerdown = e => {
        if (e.pointerType === 'mouse') return;
        e.preventDefault(); try { hd.setPointerCapture(e.pointerId); } catch {}
        moving = r.ck ? rows.filter(z => z.ck).map(z => z.k) : [r.k];
        L.querySelectorAll('.ol-row').forEach((el, j) => { if (moving.includes(rows[j].k)) el.classList.add('drag'); });
        let over = null;
        const sc = L.scrollHeight > L.clientHeight + 4 ? L : D;
        hd.onpointermove = ev => {
          const t = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('.ol-row, .ol-addend');
          if (t !== over) { over?.classList.remove('over'); over = t; t?.classList.add('over'); }
          const rc = sc.getBoundingClientRect(); if (ev.clientY < rc.top + 40) sc.scrollTop -= 14; else if (ev.clientY > rc.bottom - 40) sc.scrollTop += 14;
        };
        hd.onpointerup = hd.onpointercancel = ev => {
          hd.onpointermove = hd.onpointerup = hd.onpointercancel = null; over?.classList.remove('over');
          L.querySelectorAll('.drag').forEach(el => el.classList.remove('drag'));
          if (ev.type === 'pointerup' && over) moveBefore(over.classList.contains('ol-addend') ? null : rows[[...L.children].indexOf(over)]?.k);
          moving = null;
        };
      };
      L.append(li);
    });
    const nck = rows.filter(z => z.ck).length; q('#ol-selbar').hidden = !nck; q('#ol-seln').textContent = nck;
    q('#ol-count').textContent = `${rows.length}페이지`;
    q('#ol-target').textContent = rows[sel] ? `· ${sel + 1}번 구역에 넣을 페이지` : '';
    L.querySelector('.sel')?.scrollIntoView({block: 'nearest'});
  }
  // 옮길 구역들(moving)을 빼고 대상 구역(k) 바로 앞에 원래 순서대로 끼운다 · k 가 없으면 맨 아래로
  function moveBefore(k) {
    if (!moving || moving.includes(k)) return;
    const cur = rows[sel]?.k, take = rows.filter(z => moving.includes(z.k)), rest = rows.filter(z => !moving.includes(z.k));
    rest.splice(k == null ? rest.length : rest.findIndex(z => z.k === k), 0, ...take); rows = rest;
    sel = Math.max(0, rows.findIndex(z => z.k === cur)); moving = null; touch(); draw();
    toast(take.length > 1 ? `${take.length}개 구역을 한꺼번에 옮겼습니다.` : '구역 순서를 변경했습니다.');
  }
  const AE = q('#ol-addend');
  AE.ondragover = e => { e.preventDefault(); AE.classList.add('over'); };
  AE.ondragleave = () => AE.classList.remove('over');
  AE.ondrop = e => { e.preventDefault(); AE.classList.remove('over'); moveBefore(null); };
  AE.onclick = () => { rows.push({k: ++uid, x: olSnap(olType('statement') || types[0])}); sel = rows.length - 1; touch(); syncCarousel(); draw(); };
  q('#ol-selclear').onclick = () => { rows.forEach(z => { z.ck = false; }); draw(); };
  // 선택 삭제 — 체크한 구역을 한꺼번에 지우고, 8초 동안 「되돌리기」로 그대로 복원
  q('#ol-seldel').onclick = () => {
    const del = rows.filter(z => z.ck); if (!del.length) return;
    if (del.length === rows.length) return toast('페이지 구역은 하나 이상 있어야 합니다. 남길 구역의 체크를 해제해 주세요.');
    const before = rows.map(z => ({...z, ck: false})), selK = rows[sel]?.k;
    rows = rows.filter(z => !z.ck); sel = Math.max(0, rows.findIndex(z => z.k === selK)); touch(); syncCarousel(); draw();
    toast(`${del.length}개 구역을 삭제했습니다.`, {fn: () => { rows = before; sel = Math.max(0, rows.findIndex(z => z.k === selK)); syncCarousel(); draw(); toast('삭제한 구역을 되돌렸습니다.'); }});
  };
  function syncCarousel() { const cur = rows[sel]?.x.id, j = list().findIndex(t => t.id === cur); if (j >= 0) idx = j; else { group = '전체'; idx = Math.max(0, types.findIndex(t => t.id === cur)); } chips(); deck(); }
  function chips() { const C = q('#ol-chips'); C.replaceChildren(); OL_GROUPS.forEach(g => { const b = document.createElement('button'); b.type = 'button'; b.className = 'ol-chip' + (g === group ? ' on' : ''); b.textContent = g; b.setAttribute('aria-pressed', g === group); b.onclick = () => { group = g; idx = 0; chips(); deck(); }; C.append(b); }); }
  function deck() {
    S.replaceChildren();
    list().forEach((t, i) => {
      const c = document.createElement('div'); c.className = 'ol-card'; c.dataset.i = i;
      c.innerHTML = `<div class="ol-img" style="background-image:url('${olImg(t)}')"></div><div class="ol-cap"><b></b><small></small></div>`;
      c.querySelector('b').textContent = t.name; if (t.learned) { const s = document.createElement('span'); s.className = 'ol-learned'; s.textContent = '학습한 페이지'; c.querySelector('b').append(s); }
      c.querySelector('small').textContent = t.grp;
      c.onclick = () => { if (Math.abs(drag) < 6 && i !== idx) { idx = i; place(); } };
      S.append(c);
    });
    place();
  }
  const applied = () => last && rows[sel] && rows[sel].k === last.k && rows[sel].x.id === last.to.id && list()[idx]?.id === last.to.id;
  function place() {
    const Ls = list(), W = S.clientWidth || 600;
    S.querySelectorAll('.ol-card').forEach(c => {
      const dd = +c.dataset.i - idx + drag / (W * 0.45), a = Math.abs(dd);
      c.style.transform = `translateX(calc(-50% + ${dd * 42}%)) translateY(${a * 18}px) rotate(${dd * 4}deg) scale(${1 - Math.min(a, 3) * 0.1})`;
      c.style.zIndex = 100 - Math.round(a * 10); c.style.opacity = a > 3.2 ? 0 : 1 - Math.min(a, 3) * 0.12;
    });
    const t = Ls[idx]; q('#ol-dots').textContent = Ls.length ? `${idx + 1} / ${Ls.length}` : '0 / 0';
    q('#ol-desc').textContent = t ? (t.descr || '') + (t.learned && (t.source_refs || []).length ? ` · 「${t.source_refs.map(s => s.title).join(', ')}」 레퍼런스에서 학습한 페이지입니다.` : '') : '이 분류에는 아직 페이지 종류가 없습니다.';
    const on = applied(); q('#ol-apply').textContent = on ? '확정 취소 (Enter)' : '이 페이지로 확정 (Enter)'; q('#ol-apply').classList.toggle('primary', !on); q('#ol-apply').disabled = !t;
  }
  // 끌어서 넘기기
  let x0 = null;
  S.onpointerdown = e => { x0 = e.clientX; drag = 0; S.setPointerCapture(e.pointerId); S.classList.add('dragging'); };
  S.onpointermove = e => { if (x0 === null) return; drag = x0 - e.clientX; place(); };
  const end = () => { if (x0 === null) return; S.classList.remove('dragging'); const n = Math.round(drag / ((S.clientWidth || 600) * 0.45)); idx = Math.max(0, Math.min(list().length - 1, idx + n)); x0 = null; const was = drag; drag = 0; place(); if (Math.abs(was) >= 6) setTimeout(() => { drag = 0; }, 0); };
  S.onpointerup = end; S.onpointercancel = end;
  // Enter 로 확정 · 같은 카드에서 Enter 를 다시 누르면 확정 취소(바꾸기 전 페이지로)
  const toggle = () => {
    const t = list()[idx]; if (!rows[sel] || !t) return;
    if (applied()) { rows[sel].x = last.from; toast(`확정을 취소했습니다. ${sel + 1}번 구역을 「${last.from.name}」(으)로 되돌렸습니다.`); last = null; }
    else { const nx = olSnap(t); last = {k: rows[sel].k, from: rows[sel].x, to: nx}; rows[sel].x = nx; toast(`${sel + 1}번 구역을 「${t.name}」(으)로 확정했습니다. Enter를 다시 누르면 취소됩니다.`); }
    touch(); draw(); place();
  };
  D.onkeydown = e => {
    if (e.target.closest('select, input, textarea') || $('#ask')?.open) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); idx = Math.min(list().length - 1, idx + 1); place(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); idx = Math.max(0, idx - 1); place(); }
    else if (e.key === 'Enter' && !e.target.closest('button')) { e.preventDefault(); toggle(); }
  };
  q('#ol-prev').onclick = () => { idx = Math.max(0, idx - 1); place(); };
  q('#ol-next').onclick = () => { idx = Math.min(list().length - 1, idx + 1); place(); };
  q('#ol-apply').onclick = toggle;
  q('#ol-tpl').onchange = async e => {
    const k = e.target.value; if (!k) return;
    if (dirty && !(await confirmBox({title: `「${olTplName(k)}」 구성을 불러올까요?`, body: '지금 편집한 페이지 구역이 이 기본 구성으로 바뀝니다.', ok: '기본 구성 불러오기', cancel: '지금 구성 유지'}))) { e.target.value = tpl; return; }
    tpl = k; rows = olFromTpl(k).map(x => ({k: ++uid, x})); sel = 0; last = null; touch(); syncCarousel(); draw(); toast('기본 구성을 불러왔습니다. 필요한 페이지를 넣고 빼 주세요.');
  };
  const close = async () => {
    if (dirty && !(await confirmBox({title: '저장하지 않고 닫을까요?', body: '편집한 제안서 구성이 저장되지 않습니다.', ok: '저장하지 않고 닫기', cancel: '계속 편집', danger: true}))) return;
    D.close();
  };
  q('#ol-close').onclick = close;
  D.oncancel = e => { e.preventDefault(); close(); };
  q('#ol-save').onclick = async ev => {
    ev.target.disabled = true;
    const outline = rows.map(r => r.x);
    const { data: row, error: e0 } = await SB.from('pt_proposal').select('data').eq('id', p.id).single();
    if (e0) { ev.target.disabled = false; return toast('불러오지 못했습니다: ' + e0.message); }
    const { error } = await SB.from('pt_proposal').update({data: {...row.data, outline, outline_tpl: tpl}}).eq('id', p.id);
    if (error) { ev.target.disabled = false; return toast('저장하지 못했습니다: ' + error.message); }
    await proposalEvent(p.id, `제안서 구성을 ${outline.length}페이지로 저장했습니다`);
    dirty = false; D.close(); studio.list = null; await loadStudio(); if (activeDetail === 'p:' + p.id) openProposal(p.id, true);
    toast(`${outline.length}페이지 구성으로 저장했습니다.`);
  };
  D.showModal();
  addEventListener('resize', place);
  D.addEventListener('close', () => removeEventListener('resize', place), {once: true});
  syncCarousel(); draw();
  requestAnimationFrame(place);
}
// 제안서 구성 — 페이지 순서는 구성 편집기(11-04), 참고할 레퍼런스(여럿 조합)·추가 요청은 여기서 (10-30 원태 이사님 「한 템플릿만 따라간다 · 선택해서 조합」)
function deckStyleBox(p) {
  const st = p.data.deck_style || {}, refs = (studio.refs || []).filter(r => r.status === 'ready');
  const chosen = st.refs || (p.ref_id ? [p.ref_id] : refs.filter(r => r.is_default).map(r => r.id));
  return `<details class="pv-fold" open><summary><b>제안서 구성</b> <small>확정 전에 선택</small></summary>
    ${olSummary(p)}
    ${refs.length ? `<div class="ds-row"><span>참고 레퍼런스</span><div>${refs.map(r => `<label class="chk" title="${esc(refFormat(r))}"><input type="checkbox" data-ds-ref="${esc(r.id)}"${chosen.includes(r.id) ? ' checked' : ''}> ${esc(refName(r))}</label>`).join('')}<small class="muted">선택한 레퍼런스의 문체·디자인·이미지 활용 방식을 조합해 반영합니다. 페이지 순서는 위 구성을 따릅니다.</small></div></div>` : ''}
    <div class="ds-row"><span>추가 요청</span><div><input id="ds-note" maxlength="300" value="${esc(st.note || '')}" placeholder="예: 굿즈 비중 확대, 팝업은 1곳으로 한정"></div></div>
  </details>`;
}
const readDeckStyle = p => ({...(p.data.deck_style || {}), refs: $$('[data-ds-ref]').filter(x => x.checked).map(x => x.dataset.dsRef), ref_mode: 'tone', note: ($('#ds-note')?.value || '').trim()});
const conceptsPanel = p => `<div class="detail-block"><h3>결정 · 컨셉 확정</h3><p>컨셉을 하나 확정하면 아래 구성으로 제안서를 생성합니다.</p>${deckStyleBox(p)}${p.data.concepts.candidates.map((c, i) => conceptCard(c, i)).join('')}
  <details class="pv-fold"><summary><b>컨셉 수정 요청</b> <small>적합한 후보가 없을 때</small></summary><textarea id="cc-ins" rows="3" maxlength="1500" placeholder="예: 2번 컨셉을 상품 중심으로 변경, 세계관보다 팬 참여형으로 재구성"></textarea><div class="drawer-actions"><button class="button" id="cc-go">이 요청으로 컨셉 재생성</button></div></details></div>`;
// 팬·SNS 조사 — Aside 가 인스타그램·틱톡·X·유튜브·팬 커뮤니티에서 읽은 것 (10-28)
const PLAT_KO = {instagram: '인스타그램', tiktok: '틱톡', x: 'X', youtube: '유튜브', naver: '네이버', community: '커뮤니티'};
function socialBlock(S) {
  if (S.failed) return `<div class="detail-block"><h3>팬·SNS</h3><p>${esc(S.error || '이번에는 팬·SNS 조사를 진행하지 못했습니다.')}</p></div>`;
  if (!S.ips) return '';
  const fact = f => `<li>${esc(f.text)} ${f.url ? `<a class="src" href="${esc(f.url)}" target="_blank" rel="noopener">${esc(host(f.url))}${f.as_of ? ' · ' + esc(f.as_of) : ''}</a>` : ''}</li>`;
  const theme = (v, key, body) => `<li><b>${esc(v[key])}</b> ${esc(v[body] || '')} ${srcLinks(v.urls)}</li>`;
  const list = (title, arr, fn) => (arr || []).length ? `<p><b>${title}</b></p><ul class="facts">${arr.map(fn).join('')}</ul>` : '';
  const ips = S.ips.map(x => `<details class="research"><summary><b>${esc(x.name)}</b> <small>채널 ${x.channels.length}개 · 반응 ${x.loves.length + x.dislikes.length + x.collab_reactions.length}개</small></summary>
    ${list('채널', x.channels, c => `<li>${esc(PLAT_KO[c.platform] || c.platform)} · ${esc(c.name || '')}${c.followers ? ` <b>${esc(c.followers)}</b>` : ''}${c.note ? ` · ${esc(c.note)}` : ''} <a class="src" href="${esc(c.url)}" target="_blank" rel="noopener">${esc(host(c.url))}${c.as_of ? ' · ' + esc(c.as_of) : ''}</a></li>`)}
    ${list('수치', x.metrics, fact)}${list('팬 용어', x.fan_terms, t => `<li><b>${esc(t.term)}</b> ${esc(t.meaning || '')} ${t.url ? srcLinks([t.url]) : ''}</li>`)}
    ${list('좋아하는 점', x.loves, v => theme(v, 'theme', 'detail'))}${list('싫어하는 점', x.dislikes, v => theme(v, 'theme', 'detail'))}
    ${list('지난 협업 반응', x.collab_reactions, v => theme(v, 'collab', 'reaction'))}${list('도입부 활용 장면', x.hooks, fact)}</details>`).join('');
  const caps = (S.captures || []).length ? `<p><b>캡처 ${S.captures.length}장</b></p><div class="iboard">${S.captures.map(c => `<div class="icard"><div class="ithumb" data-thumb="${esc(c.path)}" data-label="팬·SNS 캡처"></div></div>`).join('')}</div>` : '';
  const locked = (S.locked || []).length ? `<p><b>가입이 필요해 확인하지 못한 채널</b></p><ul class="facts">${S.locked.map(l => `<li>${esc(l.site)} · ${esc(l.need || '')} ${l.url ? srcLinks([l.url]) : ''}</li>`).join('')}</ul>` : '';
  return `<div class="detail-block"><h3>팬·SNS</h3>${ips}${caps}${locked}</div>`;
}
function researchBlock(R) {
  const fact = f => `<li>${esc(f.text)} ${f.url ? `<a class="src" href="${esc(f.url)}" target="_blank" rel="noopener">${esc(host(f.url))}${f.as_of ? ' · ' + esc(f.as_of) : ''}</a>` : ''}</li>`;
  return `<div class="detail-block"><h3>리서치</h3>${(R.ips || []).map(x => `<details class="research"><summary><b>${esc(x.name)}</b> <small>출처가 확인된 사실 ${x.facts.length}개</small></summary><p>${esc(x.summary || '')}</p>${x.fandom ? `<p><b>팬덤</b> ${esc(x.fandom)}</p>` : ''}${x.world ? `<p><b>세계관·정서</b> ${esc(x.world)}</p>` : ''}<ul class="facts">${x.facts.map(fact).join('')}</ul>${(x.collabs || []).length ? `<p><b>지난 협업</b></p><ul class="facts">${x.collabs.map(fact).join('')}</ul>` : ''}${(x.hooks || []).length ? `<p><b>도입부 활용 장면</b></p><ul class="facts">${x.hooks.map(h => fact({...h, text: h.text + (h.note ? ` (${h.note})` : '')})).join('')}</ul>` : ''}${(x.risks || []).length ? `<p><b>유의 사항</b> ${x.risks.map(esc).join(' · ')}</p>` : ''}</details>`).join('')}${(R.common_ground || []).length ? `<p><b>공통점</b></p><ul class="facts">${R.common_ground.map(c => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}</div>`;
}

// 지금 원고에 쓰인 이미지만 — 새 디자인 적용·수정 버전에서 빠진 이미지는 숫자·목록에 넣지 않는다 (10-30 에스파 SIGNAL 21개)
const liveSlots = d => { const S = d.images?.slots || {}, ks = new Set((d.build?.deck?.slides || []).flatMap(x => (x.images || []).map(i => i.key)));
  return ks.size ? Object.fromEntries(Object.entries(S).filter(([k]) => ks.has(k))) : S; };
const SLOT_ST = {found: ['good', '확보'], uploaded: ['good', '직접 업로드'], generated: ['good', 'AI 생성'], missing: ['bad', '미확보'], ai: ['wait', 'AI 생성 대기']};
function imagesPanel(p) {
  const S = liveSlots(p.data), keys = Object.keys(S).sort();
  const n = st => keys.filter(k => S[k].status === st).length;
  const E = p.data.images.ai_estimate, nW = keys.filter(k => S[k].widen && S[k].status === 'found').length, nAi = n('ai') + nW;
  const aiWhat = [n('ai') ? `AI 이미지 ${n('ai')}장` : '', nW ? `세로 사진 좌우 확장 ${nW}장` : ''].filter(Boolean).join(' + ');
  const ai = nAi ? (E && E.count === nAi ? `<div class="ai-box"><b>${aiWhat} · 예상 약 $${E.usd}</b><small>힉스필드 ${esc((E.model || '').replace('higgsfield-ai/', ''))} · 실패하거나 부적절 판정된 이미지는 청구되지 않습니다</small><div class="drawer-actions"><button class="button primary" id="ai-go" data-usd="${E.usd}">승인 후 생성</button><button class="text-btn" id="ai-est">견적 다시 받기</button></div></div>` : `<div class="ai-box"><b>${aiWhat}</b><small>생성 전에 힉스필드 견적을 먼저 받습니다(비용 없음)</small><div class="drawer-actions"><button class="button" id="ai-est">견적 받기</button></div></div>`) : '';
  // 대표님 설계(10-30 김현우): 결정 카드에는 숫자·확인할 곳·버튼만 — 이미지는 「이미지 수정」에서 실제 페이지를 보며 누른다
  const qa = qaOf(p.data), flags = qa?.flags || [], final = p.stage >= 8 || !nAi;
  const stat = (label, v, cls, go) => `<button class="pv-stat${cls ? ' ' + cls : ''}" type="button" data-review="${go || 1}"><b>${v}</b><span>${label}</span></button>`;
  const firstMiss = keys.find(k => S[k].status === 'missing'), firstAi = keys.find(k => S[k].status === 'ai');
  return `<div class="detail-block pv-decide"><h3>지금 할 일 · ${final ? '최종 확인' : '이미지 수급·AI 이미지 승인'}</h3>
  <div class="pv-stats">${stat('확보', n('found') + n('uploaded') + n('generated'), 'good')}${stat('미확보', n('missing'), n('missing') ? 'bad' : '', firstMiss && S[firstMiss].slide)}${stat('AI 생성 대기', n('ai'), n('ai') ? 'wait' : '', firstAi && S[firstAi].slide)}${qa ? stat('검수 확인 필요 항목', flags.length, flags.length ? 'bad' : 'good', flags[0]?.slide) : ''}</div>
  ${ai}${qaBlock(p)}
  <div class="pv-main-act"><button class="button primary" data-review="${flags[0]?.slide || 1}">${icon('image')} 제안서 화면에서 이미지 확인·수정</button><small>페이지에서 이미지를 클릭하면 교체·위치 조정·다시 생성할 수 있습니다</small></div>
  <div class="drawer-actions pv-final"><button class="button" id="img-rerender">변경 사항 반영</button><button class="button primary" id="img-done">이 버전으로 완료</button></div></div>`;
}
// 이미지 설명에 섞여 온 내부 파일 경로(proposals/…/cap_03.jpg)는 화면에 보이지 않게 (10-30)
const whatText = t => String(t || '').replace(/\s*\(?(?:proposals|social)\/[^\s)]*\)?/g, '').trim();
const KIND_KO_IMG = {official: '공식 이미지', logo: '로고', ai_concept: 'AI 컨셉', mockup: '목업', reference: '참고 사례', capture: '캡처', texture: '배경·질감'};
async function loadImgThumbs(slots) {
  const paths = [...new Set(Object.values(slots).map(s => s.path).filter(Boolean))];
  if (!paths.length) return;
  const { data } = await SB.storage.from('pt-studio').createSignedUrls(paths, 900);
  (data || []).forEach(x => { if (!x.signedUrl) return; $$(`#drawer [data-thumb="${CSS.escape(x.path)}"]`).forEach(el => {
    el.style.backgroundImage = `url("${x.signedUrl}")`; el.dataset.src = x.signedUrl;
    el.classList.add('zoom'); el.setAttribute('role', 'button'); el.tabIndex = 0; el.setAttribute('aria-label', '크게 보기');
  }); });
}
// 이미지 크게 보기 (10-29 김현우) — 원본 전체 + 제안서 자리 비율로 가운데를 잘라 넣은 모양(실제 제안서와 같은 방식)
// 이미지 크게 보기 · 위치 맞추기 (10-29 김현우) — 원본 전체 + 제안서 상자(실제 그려진 크기) 안에서 끌어 옮기기
// 궁니르 봇이 그릴 때와 같은 방식: 채우기는 x·y(0~1) 위치를 남기고 자르고, 맞춤는 자르지 않는다
const POS_TOP = ['official', 'capture', 'reference'];
const defaultPos = s => ({x: 0.5, y: POS_TOP.includes(s?.kind) ? 0.15 : 0.5, fit: s?.kind === 'logo' ? 'contain' : 'cover', zoom: 1});
// 다시 만들기 (10-29 김현우) — 고친 프롬프트·개선할 점은 제안서 데이터(prompt_log)에 쌓이고, 다음 원고를 쓸 때 궁니르 봇이 참고한다
const AI_KINDS = ['ai_concept', 'mockup', 'texture'];
const regenBox = s => { const ai = AI_KINDS.includes(s.kind) && !s.widened;
  return `<details class="regen"><summary>이미지 다시 생성</summary>
  <label>개선할 점<input id="rg-why" maxlength="200" placeholder="예: 얼굴이 너무 크게 나옴 · 배경이 너무 밝음"></label>
  ${ai ? `<label>생성 프롬프트 (영문)<textarea id="rg-prompt" rows="5">${esc(s.prompt || '')}</textarea></label>`
       : `<label>좌우 확장 추가 지시(영문 권장)<textarea id="rg-prompt" rows="3" placeholder="예: extend as a dark concert stage with purple haze">${esc(s.widen_extra || '')}</textarea></label>`}
  <button class="button" type="button" id="rg-go">${ai ? '이 프롬프트로 다시 생성' : '이 지시로 다시 확장'}</button><small>견적 확인 후 승인하면 생성합니다. 수정한 내용은 다음 제안서 원고에도 반영됩니다.</small></details>`; };
function imgViewer(el) {
  const src = el.dataset.src, key = el.dataset.key;
  const p = studio.list?.find(x => activeDetail === 'p:' + x.id), d = p?.data || {}, s = key && d.images?.slots?.[key];
  const box = key && d.build?.boxes?.[key], r = (el.dataset.ratio || '').split(':').map(Number);
  const ar = box ? box.w / box.h : (r.length === 2 && r[0] > 0 && r[1] > 0 ? r[0] / r[1] : 0);
  const canEdit = !!(s && ar && p.status === 'waiting');
  let pos = {...defaultPos(s), ...(s?.pos || {})};
  modal(`<h2>${esc(el.dataset.label || '이미지')}</h2><div class="imgv${ar ? '' : ' one'}"><figure><figcaption>원본 전체</figcaption><img src="${esc(src)}" alt="원본 이미지"></figure>${ar ? `<figure><figcaption>제안서 적용 미리보기${box ? '' : ' (예상)'}</figcaption><div class="imgv-crop${canEdit ? ' drag' : ''}" id="imgv-box" style="aspect-ratio:${ar};width:min(100%,calc(64vh * ${ar}));background-image:url('${esc(src)}')"></div>${canEdit ? `${canEdit && (AI_KINDS.includes(s.kind) || s.widened) ? regenBox(s) : ''}<small>이미지를 드래그해 표시 영역을 조정하고, 아래 슬라이더(PC에서는 마우스 휠)로 확대·축소해 주세요. 「맞춤」을 선택하면 이미지를 자르지 않고 전체를 표시합니다.</small><div class="imgv-zoom"><span>확대</span><input type="range" id="imgv-zoom" min="100" max="400" step="5" aria-label="확대"><b id="imgv-zoom-v"></b></div><div class="imgv-tools"><div class="seg-pick"><label><input type="radio" name="imgv-fit" value="cover"> 채우기</label><label><input type="radio" name="imgv-fit" value="contain"> 맞춤</label></div><button class="text-btn" type="button" id="imgv-reset">위치 초기화</button></div>` : ''}</figure>` : ''}</div><div class="modal-actions"><a class="button" href="${esc(src)}" target="_blank" rel="noopener">새 창에서 열기</a>${canEdit && s.widen ? '<span class="imgv-wide-on">좌우 확장 대기 · 견적 승인 시 함께 생성합니다</span>' : ''}${canEdit && !s.widen ? '<button class="button" id="imgv-widen" hidden>힉스필드로 확장해 전체 표시</button>' : ''}${canEdit ? '<button class="button" data-cancel>취소</button><button class="button primary" id="imgv-save">위치 저장</button>' : '<button class="button primary" data-cancel>닫기</button>'}</div>`);
  $('#modal').classList.add('wide'); $('#modal').addEventListener('close', () => $('#modal').classList.remove('wide'), {once: true});
  const bx = $('#imgv-box'); if (!bx) return;
  const nat = new Image(); nat.src = src;
  // 꽉 채운 크기 × 확대 — 궁니르 봇이 그릴 때와 같은 계산 (위치 %는 남는 부분 중 어디를 보이게 할지)
  const scale = () => Math.max(bx.clientWidth / nat.naturalWidth, bx.clientHeight / nat.naturalHeight) * (pos.zoom || 1);
  const paint = () => {
    const fit = pos.fit === 'contain';
    bx.style.backgroundSize = fit ? 'contain' : nat.naturalWidth ? `${nat.naturalWidth * scale()}px ${nat.naturalHeight * scale()}px` : 'cover';
    bx.style.backgroundPosition = fit ? 'center' : `${pos.x * 100}% ${pos.y * 100}%`; bx.classList.toggle('fit', fit);
    const z = $('#imgv-zoom'); if (z) { z.value = Math.round((pos.zoom || 1) * 100); z.disabled = fit; $('#imgv-zoom-v').textContent = Math.round((pos.zoom || 1) * 100) + '%'; }
  };
  // 가로 상자에 세로로 긴 이미지면 좌우 넓히기 단추를 보인다 (10-29) — 넓힌 이미지를 줄여 넣으면 잘리지 않는다
  const wideBtn = () => { const b = $('#imgv-widen'); if (b && nat.naturalWidth) b.hidden = !shapeOff(nat.naturalWidth, nat.naturalHeight, ar); };
  paint(); wideBtn(); nat.onload = () => { paint(); wideBtn(); };
  if (!canEdit) return;
  const dirty = () => { $('#modal').dataset.dirty = '1'; };
  $$('input[name=imgv-fit]').forEach(i => { i.checked = i.value === pos.fit; i.onchange = () => { pos.fit = i.value; dirty(); paint(); }; });
  $('#imgv-reset').onclick = () => { pos = defaultPos(s); dirty(); $$('input[name=imgv-fit]').forEach(i => i.checked = i.value === pos.fit); paint(); };
  const setZoom = z => { pos.zoom = Math.min(4, Math.max(1, Math.round(z * 100) / 100)); dirty(); paint(); };
  $('#imgv-zoom').oninput = ev => setZoom(ev.target.value / 100);
  bx.onwheel = ev => { if (pos.fit === 'contain') return; ev.preventDefault(); setZoom((pos.zoom || 1) * (ev.deltaY < 0 ? 1.08 : 1 / 1.08)); };
  let drag = null;
  bx.onpointerdown = ev => {
    if (pos.fit === 'contain' || !nat.naturalWidth) return;
    const W = bx.clientWidth, H = bx.clientHeight, sc = scale();
    drag = {x0: ev.clientX, y0: ev.clientY, px: pos.x, py: pos.y, ex: nat.naturalWidth * sc - W, ey: nat.naturalHeight * sc - H};
    bx.setPointerCapture(ev.pointerId); bx.classList.add('moving');
  };
  bx.onpointermove = ev => {
    if (!drag) return;
    const cl = v => Math.min(1, Math.max(0, v));
    if (drag.ex > 1) pos.x = cl(drag.px - (ev.clientX - drag.x0) / drag.ex);
    if (drag.ey > 1) pos.y = cl(drag.py - (ev.clientY - drag.y0) / drag.ey);
    dirty();
    paint();
  };
  bx.onpointerup = bx.onpointercancel = () => { drag = null; bx.classList.remove('moving'); };
  $('#imgv-widen')?.addEventListener('click', async ev => {
    ev.target.disabled = true;
    const fresh = studio.list?.find(x => x.id === p.id)?.data || d;
    const slots = {...fresh.images.slots, [key]: {...fresh.images.slots[key], widen: true, pos: {}, note: '좌우 배경을 확장해 적용합니다(견적 승인 시 함께 생성)'}};
    const { error } = await SB.from('pt_proposal').update({data: {...fresh, images: {...fresh.images, slots}}, status: 'working'}).eq('id', p.id);
    if (error) { ev.target.disabled = false; return toast('저장하지 못했습니다: ' + error.message); }
    await SB.from('pt_proposal_job').insert({proposal_id: p.id, kind: 'generate', input: {estimate_only: true}});
    await proposalEvent(p.id, `${s.slide}페이지 이미지 좌우 확장을 요청했습니다 · 견적을 받습니다`);
    $('#modal').close(); studio.list = null; await loadStudio(); openProposal(p.id, true);
    toast('좌우 확장 견적을 받습니다. 견적이 나오면 승인해 주세요.');
  });
  $('#rg-go')?.addEventListener('click', async ev => {
    const why = $('#rg-why').value.trim(), txt = $('#rg-prompt').value.trim(), ai = AI_KINDS.includes(s.kind) && !s.widened;
    if (ai && !txt) return toast('프롬프트를 입력해 주세요.');
    ev.target.disabled = true;
    const fresh = studio.list?.find(x => x.id === p.id)?.data || d, cur = fresh.images.slots[key];
    const prev = [...(cur.prev_paths || []), cur.path].filter(Boolean);
    const next = ai ? {...cur, status: 'ai', prompt: txt, prev_paths: prev, pos: {}, note: '재생성 대기'}
                    : {...cur, path: cur.orig_path || cur.path, widen: true, widened: false, widen_extra: txt, prev_paths: prev, pos: {}, note: '좌우 확장 재생성 대기'};
    const log = {at: new Date().toISOString(), key, slide: s.slide, kind: s.kind, what: s.what || '', mode: ai ? 'ai' : 'widen',
                 before: ai ? (cur.prompt || '') : (cur.widen_extra || ''), after: txt, why, by: myName || ''};
    const data = {...fresh, images: {...fresh.images, slots: {...fresh.images.slots, [key]: next}}, prompt_log: [...(fresh.prompt_log || []), log]};
    const { error } = await SB.from('pt_proposal').update({data, status: 'working'}).eq('id', p.id);
    if (error) { ev.target.disabled = false; return toast('저장하지 못했습니다: ' + error.message); }
    await SB.from('pt_proposal_job').insert({proposal_id: p.id, kind: 'generate', input: {estimate_only: true}});
    await proposalEvent(p.id, `${s.slide}페이지 이미지 재생성을 요청했습니다${why ? ' · ' + why : ''}`);
    $('#modal').close(); studio.list = null; await loadStudio(); openProposal(p.id, true);
    toast('견적을 받습니다. 견적이 나오면 승인해 주세요.');
  });
  $('#imgv-save').onclick = async () => {
    $('#imgv-save').disabled = true;
    const fresh = studio.list?.find(x => x.id === p.id)?.data || d;
    const v = {x: Math.round(pos.x * 1000) / 1000, y: Math.round(pos.y * 1000) / 1000, fit: pos.fit, zoom: pos.zoom || 1};
    const slots = {...fresh.images.slots, [key]: {...fresh.images.slots[key], pos: v}};
    const { error } = await SB.from('pt_proposal').update({data: {...fresh, images: {...fresh.images, slots}}}).eq('id', p.id);
    if (error) { $('#imgv-save').disabled = false; return toast('저장하지 못했습니다: ' + error.message); }
    await proposalEvent(p.id, `${s.slide}페이지 이미지 위치를 조정했습니다`);
    $('#modal').close(); studio.list = null; await loadStudio(); openProposal(p.id, true);
    toast('위치를 저장했습니다. 「변경 사항 반영」을 클릭하면 제안서에 반영됩니다.');
  };
}
document.addEventListener('click', ev => { const el = ev.target.closest('#drawer .ithumb.zoom'); if (el) imgViewer(el); });
document.addEventListener('keydown', ev => { const el = ev.target.closest?.('#drawer .ithumb.zoom'); if (el && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); imgViewer(el); } });

// ── 페이지별 검토 · 자동 검수 표시 (10-29 김현우) — 실제 그려진 페이지(PDF)를 한 페이지씩 보며 그 페이지 이미지 자리를 바로 고친다
const QA_KO = {wrong: '다른 대상', brand_text: '타사 글자·로고 노출', cropped: '잘림', empty: '비어 있음', quality: '품질', mismatch: '페이지 내용과 불일치', duplicate: '같은 이미지 반복'};
let PDFJS = null;
const PATCH_DOCS = {};         // 확정해 갈아 끼운 페이지 PDF (한 장짜리)
async function loadPdfjs() {
  if (PDFJS) return PDFJS;
  await new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
  PDFJS = window['pdfjs-dist/build/pdf'];
  PDFJS.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  return PDFJS;
}
async function replaceSlotImage(p, key, f) {
  if (f.size > 15e6) return toast('15MB 이하 이미지를 선택해 주세요.');
  const d = studio.list?.find(x => x.id === p.id)?.data || p.data;
  const ext = (f.name.match(/\.(jpe?g|png|webp)$/i)?.[1] || 'jpg').toLowerCase().replace('jpeg', 'jpg');
  const path = `proposals/${p.id}/img/${key}-u${Date.now()}.${ext}`;
  const up = await SB.storage.from('pt-studio').upload(path, f, {contentType: f.type || 'image/jpeg', upsert: false});
  if (up.error) return toast('업로드하지 못했습니다: ' + up.error.message);
  const slots = {...d.images.slots, [key]: {...d.images.slots[key], status: 'uploaded', path, source_page: '', image_url: '', pos: {}}};
  const { error } = await SB.from('pt_proposal').update({data: {...d, images: {...d.images, slots}}}).eq('id', p.id);
  if (error) return toast('저장하지 못했습니다: ' + error.message);
  await proposalEvent(p.id, `이미지 ${key} 을(를) 직접 업로드한 이미지로 교체했습니다`);
  const was = d.images.slots[key];
  studio.list = null; await loadStudio(); toast('이미지를 교체했습니다. 「변경 사항 반영」을 클릭하면 제안서에 적용됩니다.', {fn: async () => {
    const { data: r2 } = await SB.from('pt_proposal').select('data').eq('id', p.id).single(); const d2 = r2.data;
    await SB.from('pt_proposal').update({data: {...d2, images: {...d2.images, slots: {...d2.images.slots, [key]: was}}}}).eq('id', p.id);
    await proposalEvent(p.id, `이미지 ${key} 교체를 취소했습니다`); studio.list = null; await loadStudio(); toast('원래 이미지로 복원했습니다.'); window.dispatchEvent(new Event('pt-refresh')); }});
  return true;
}
const qaBlock = p => { const d = p.data || {}, qa = qaOf(d), busy = studio.jobs.some(j => j.proposal_id === p.id && j.kind === 'qa' && ['wait', 'work'].includes(j.status));
  if (!qa) return busy ? `<div class="qa-line"><b>자동 검수 중</b>${jobsProg(studio.jobs.filter(j => j.proposal_id === p.id && j.kind === 'qa' && ['wait', 'work'].includes(j.status)))}</div>` : '';
  if (qa.error) return `<p class="qa-line">${esc(qa.error)}</p>`;
  if (!qa.flags.length) return '<p class="qa-line good">자동 검수 · 특이 사항 없음</p>';
  return `<div class="qa-box"><b>자동 검수 · 확인 필요 항목 ${qa.flags.length}곳</b><small>클릭하면 해당 페이지로 이동해 바로 수정할 수 있습니다</small>${qa.flags.map(f => `<button class="qa-flag" data-review="${f.slide}"><span>${f.slide}페이지</span><b>${esc(QA_KO[f.type] || '확인')}</b> ${esc(f.detail)}</button>`).join('')}</div>`; };
// 검수 표시 중 사람이 「이대로 사용」한 이미지는 뺀다 — 같은 이미지(path)인 동안은 다음 검수에서 다시 걸려도 숨김 (10-30 · 대표님 설계 「그대로 사용」)
const qaOf = d => { if (!(d.qa && d.build && d.qa.version === d.build.version)) return null; const ok = d.qa_ok || {}, S = d.images?.slots || {};
  return {...d.qa, flags: (d.qa.flags || []).filter(f => !(f.key && ok[f.key] && ok[f.key] === S[f.key]?.path) && !(f.key && f.path && S[f.key]?.path && f.path !== S[f.key].path))}; };
// 페이지별 검토에서 바로 만들어 넣기 (10-29 김현우) — 단추에 금액을 보이고 누르면 그 자리 하나만 승인해 힉스필드로 만든다
const needPx = (d, k) => { const b = d.build?.boxes?.[k]; return b ? Math.round(b.w / 914400 * 150) : 0; };
const lowRes = (w, h, need, ar) => need && w && h && (ar && w / h > ar ? h * ar : w) < need * 0.6;
async function asideHires(p, key) {
  const d = studio.list?.find(x => x.id === p.id)?.data || p.data, s = d.images.slots[key];
  const im = (d.build?.deck?.slides || []).flatMap(x => x.images || []).find(x => x.key === key) || {};
  await SB.from('pt_proposal').update({status: 'working'}).eq('id', p.id);
  await SB.from('pt_proposal_job').insert({proposal_id: p.id, kind: 'aside', input: {slots: [{key, kind: s.kind, what: s.what || '', ratio: s.ratio || '', search: im.search || '',
    min_px: needPx(d, key), have_px: s.w || 0}], ips: [p.ip_a_name, p.ip_b_name].filter(Boolean)}});
  await proposalEvent(p.id, `${s.slide}페이지 「${s.what || key}」 고해상도 원본을 Aside 로 다시 찾도록 요청했습니다`);
  studio.list = null; await loadStudio(); toast('Aside에 요청했습니다. 찾지 못하면 힉스필드로 보정할 수 있습니다.');
}
// Aside로 다른 이미지 검색 (10-30 김현우) — 공식 이미지·로고·참고 사례·캡처를 지금 것과 다른 실제 이미지로
async function asideOther(p, key) {
  const d = studio.list?.find(x => x.id === p.id)?.data || p.data, s = d.images.slots[key];
  const im = (d.build?.deck?.slides || []).flatMap(x => x.images || []).find(x => x.key === key) || {};
  const avoid = [s.source_page, s.image_url].filter(Boolean);
  await SB.from('pt_proposal').update({status: 'working'}).eq('id', p.id);
  const { data: nj } = await SB.from('pt_proposal_job').insert({proposal_id: p.id, kind: 'aside', input: {slots: [{key, kind: s.kind, what: s.what || '', ratio: s.ratio || '', search: im.search || '', avoid}], ips: [p.ip_a_name, p.ip_b_name].filter(Boolean)}}).select('id,proposal_id,ref_id,kind,status,at,error,result,input').single();
  if (nj) studio.jobs = [...studio.jobs, nj];
  await proposalEvent(p.id, `${s.slide}페이지 「${whatText(s.what) || key}」 다른 이미지를 Aside에 요청했습니다`);
  studio.list = null; await loadStudio(); toast('Aside에 요청했습니다. 찾으면 제안서에 자동 반영됩니다.');
}
const shapeOff = (w, h, ar) => ar && w && h && (w / h < ar / 1.3 || w / h > ar * 1.3);
// 메인 이미지 참고 (10-30) — 같은 페이지에 「메인」 이미지가 있거나 제품 페이지의 첫 이미지면, 나머지 컷은 그 이미지를 붙여 같은 인형·캐릭터로 만든다 (봇 hf.ref_of 와 같은 규칙)
const refOf = (d, key) => { const S = d.images?.slots || {};
  for (const sl of d.build?.deck?.slides || []) { const ims = (sl.images || []).filter(i => i.key); if (ims.length < 2 || !ims.some(i => i.key === key)) continue;
    const main = ims.find(i => (i.what || '').includes('메인')) || (sl.layout === 'product' ? ims[0] : null);
    if (main && main.key !== key && S[main.key]?.path) return main.key; }
  return ''; };
// 붙여 만드는 공식 로고·아티스트 사진 (10-30 굿즈 목업에 IP 로고) — 봇 hf.ref_paths 와 같은 규칙
const logoRefs = (d, key) => { const S = d.images?.slots || {}, s = S[key] || {};
  const r = (s.refs || []).filter(k => S[k]?.path).map(k => S[k].what || k);
  if (r.length || s.kind !== 'mockup' || refOf(d, key)) return r;
  const L = Object.values(S).filter(v => v.kind === 'logo' && v.path && !v.ref_only && !/ALMIGHTY|올마이티|[·×,&+/]|나란히|함께|와 |과 |및 /i.test(v.what || ''));
  const P = studio.list?.find(x => x.data === d) || {};
  return [...new Set([P.ip_a_name, P.ip_b_name].filter(Boolean).map(n => L.filter(v => (v.what || '').replace(/ /g, '').includes(n.replace(/ /g, ''))).sort((a, b) => (a.what || '').length - (b.what || '').length)[0]?.what).filter(Boolean))]; };
async function quickMake(p, key, mode, prompt, why) {
  const fresh = studio.list?.find(x => x.id === p.id)?.data || p.data, cur = fresh.images.slots[key];
  const ref = mode === 'ai' && (refOf(fresh, key) || logoRefs(fresh, key).length), usd = mode === 'ai' && !ref ? 0.02 : 0.1;
  const cost = mode === 'ai' && !ref ? '$0.01' : '$0.08';
  const what = mode === 'upscale' ? '이미지를 고해상도로 보정합니다. 인물 얼굴이 미세하게 달라질 수 있습니다.'
             : mode === 'widen' ? '이미지 외곽을 확장해 잘림 없이 전체가 표시되도록 합니다.'
             : mode === 'fit' ? '인물 얼굴과 핵심 요소가 모두 보이도록 영역 비율에 맞춰 다시 구성하고, 부족한 부분은 힉스필드로 자연스럽게 보완합니다. 자르기만으로 맞출 수 있으면 비용이 발생하지 않습니다.'
             : ref ? `메인 이미지(${esc(fresh.images.slots[ref]?.slide)}페이지 「${esc(whatText(fresh.images.slots[ref]?.what).slice(0, 20))}」)를 참고해 동일한 모델로 생성합니다.` : 'AI 이미지를 새로 생성합니다.';
  if (!(await confirmBox({title: `${cur.slide}페이지 이미지를 새로 생성할까요?`,
      body: `${what}<br>새 이미지는 바로 적용되지 않으며, 미리보기로 먼저 확인할 수 있습니다. 확인 후 확정해 주세요.<br><b>비용 약 ${cost}</b>가 회사 힉스필드 잔액에서 차감됩니다.`,
      ok: `${mode === 'upscale' ? '고해상도 보정' : mode === 'widen' ? '확장' : mode === 'fit' ? '영역에 맞춘 이미지 생성' : '새로 생성'} · 약 ${cost}`}))) return false;
  const prev = [...(cur.prev_paths || []), cur.path].filter(Boolean);
  const { before: _b, cand: _c, ...was } = cur;          // 새 이미지는 바로 넣지 않고 미리보기 → 사람이 확정 (10-30)
  const next0 = mode === 'upscale' ? {...cur, upscale: true, prev_paths: prev, note: '해상도 보정 중'}
              : mode === 'fit' ? {...cur, path: cur.orig_path || cur.path, widen: true, fit: true, widened: false, prev_paths: prev, pos: {}, note: '영역에 맞춘 이미지 생성 중'}
              : mode === 'widen' ? {...cur, path: cur.orig_path || cur.path, widen: true, widened: false, widen_extra: prompt || cur.widen_extra || '', prev_paths: prev, pos: {}, note: '확장 중'}
                                : {...cur, status: 'ai', prompt, prev_paths: prev, pos: {}, note: 'AI 이미지 생성 중'};
  const next = {...next0, before: was, cand: undefined};
  const log = mode === 'upscale' || mode === 'fit' || (mode === 'widen' && !prompt && !why) || (mode === 'ai' && prompt === (cur.prompt || '') && !why) ? [] :
    [{at: new Date().toISOString(), key, slide: cur.slide, kind: cur.kind, what: cur.what || '', mode, before: mode === 'widen' ? (cur.widen_extra || '') : (cur.prompt || ''), after: prompt, why, by: myName || ''}];
  const data = {...fresh, images: {...fresh.images, slots: {...fresh.images.slots, [key]: next}}, prompt_log: [...(fresh.prompt_log || []), ...log]};
  const { error } = await SB.from('pt_proposal').update({data, status: 'working'}).eq('id', p.id);
  if (error) { toast('저장하지 못했습니다: ' + error.message); return false; }
  await SB.from('pt_proposal_job').insert({proposal_id: p.id, kind: 'generate', input: {approved_usd: usd, keys: [key], preview: true}});
  await proposalEvent(p.id, `${cur.slide}페이지 ${mode === 'upscale' ? '고해상도 보정' : mode === 'widen' ? '이미지 확장' : mode === 'fit' ? '영역에 맞춘 이미지 생성' : (ref ? 'AI 이미지 생성(메인 이미지 참고)' : 'AI 이미지 생성')}를 승인했습니다 (예상 $${mode === 'ai' && !ref ? '0.01' : '0.08'})${why ? ' · ' + why : ''}`);
  studio.list = null; await loadStudio();
  toast('생성을 시작했습니다. 완료되면 「이 이미지로 미리보기」에서 제안서 적용 모습을 확인한 뒤 확정해 주세요.');
  return true;
}
// 새 이미지 미리보기·확정·취소 (10-30 김현우) — 봇이 그 페이지 하나만 새 이미지로 그려 둔 PDF(cand.preview)를 보여 준다
async function candApply(p, key, ok) {
  const { data: row, error: e0 } = await SB.from('pt_proposal').select('data').eq('id', p.id).single();
  if (e0) return toast('불러오지 못했습니다: ' + e0.message);
  const d = row.data, cur = d.images.slots[key]; if (!cur?.cand) return;
  const { cand, before, ...base } = cur;
  const slot = ok ? {...base, ...cand, preview: undefined, prev_paths: [...(base.prev_paths || []), base.path].filter(Boolean), pos: cand.pos || {}, note: ''} : base;
  delete slot.preview;
  // 확정하면 그 페이지만 미리보기로 그려 둔 것으로 갈아 끼우고 그 페이지만 검수 — 전체는 PDF·PPTX 를 받거나 완료할 때 한 번 (10-30 김현우 「그 부분만 다시 그리면 되잖아」)
  const at = d.build?.boxes?.[key]?.at || [], page = +(d.build?.boxes?.[key]?.page || cur.slide), one = ok && cand.preview && at.length <= 1;
  const build = one ? {...d.build, patches: {...(d.build.patches || {}), [page]: cand.preview}} : d.build;
  // 확정하면 옛 이미지에 대한 검수 지적은 지운다 — 새 이미지는 그 페이지 검수가 다시 본다 (10-30 김현우 「확정 후 오류 메시지 남아 있으니 된 건지 모르겠다」)
  const qa = ok && d.qa ? {...d.qa, flags: (d.qa.flags || []).filter(f => f.key !== key)} : d.qa;
  const { error } = await SB.from('pt_proposal').update({data: {...d, build, qa, images: {...d.images, slots: {...d.images.slots, [key]: slot}}}, ...(ok && !one ? {status: 'working'} : {})}).eq('id', p.id);
  if (error) return toast('저장하지 못했습니다: ' + error.message);
  if (one) await SB.from('pt_proposal_job').insert({proposal_id: p.id, kind: 'qa', input: {pdf: cand.preview, version: d.build.version, page}});
  else if (ok) await SB.from('pt_proposal_job').insert({proposal_id: p.id, kind: 'finalize', input: {keys: [key]}});      // 여러 페이지에 쓴 이미지 — 그 페이지들만
  await proposalEvent(p.id, `${page}페이지 새 이미지를 ${ok ? (one ? '확정했습니다 → 해당 페이지만 반영' : '확정했습니다 → 이 이미지가 포함된 페이지만 다시 생성합니다') : '취소했습니다 (원래 이미지 유지)'}`);
  studio.list = null; await loadStudio();
  // 되돌리기 — 확정은 원래 이미지·페이지·검수 결과로, 버리기는 새 이미지를 다시 후보로 (한 페이지 확정·버리기만)
  const undo = (one || !ok) ? {fn: async () => {
    const { data: r2 } = await SB.from('pt_proposal').select('data').eq('id', p.id).single(); const d2 = r2.data;
    const pt = {...(d2.build.patches || {})}; if (one) { if (d.build.patches?.[page]) pt[page] = d.build.patches[page]; else delete pt[page]; }
    await SB.from('pt_proposal').update({data: {...d2, build: {...d2.build, patches: pt}, qa: d.qa, images: {...d2.images, slots: {...d2.images.slots, [key]: cur}}}}).eq('id', p.id);
    await proposalEvent(p.id, `${page}페이지 새 이미지 ${ok ? '확정' : '버리기'}를 취소했습니다`);
    studio.list = null; await loadStudio(); toast('실행을 취소했습니다.'); window.dispatchEvent(new Event('pt-refresh'));
  }} : null;
  toast(ok ? (one ? `확정했습니다. ${page}페이지만 변경했으며, 해당 페이지만 다시 검수합니다.` : '확정했습니다. 이 이미지가 포함된 페이지만 다시 생성합니다.') : '새 이미지를 폐기했습니다. 기존 이미지를 그대로 사용합니다.', undo);
}
async function candPreview(p, key, after) {
  const d = studio.list?.find(x => x.id === p.id)?.data || p.data, s = d.images.slots[key], c = s?.cand; if (!c) return;
  modal(`<h2>${esc(s.slide)}페이지 미리보기 · 새 이미지</h2><div class="pv-box" id="pv-box"><p class="rv-load"><i class="spin" aria-hidden="true"></i><span>미리보기를 불러오는 중입니다</span></p></div>
    <div class="modal-actions"><button class="button" id="pv-again">다시 생성</button><button class="button" id="pv-no">새 이미지 폐기</button><button class="button primary" id="pv-ok">이 이미지로 확정</button></div>`);
  $('#modal').classList.add('wide'); $('#modal').addEventListener('close', () => $('#modal').classList.remove('wide'), {once: true});
  const done = async ok => { $('#pv-ok').disabled = $('#pv-no').disabled = true; await candApply(p, key, ok); $('#modal').close(); after?.(); };
  $('#pv-ok').onclick = () => done(true); $('#pv-no').onclick = () => done(false);
  $('#pv-again').onclick = () => { $('#modal').close(); const t = $(`#rv-side [data-mk-prompt="${CSS.escape(key)}"]`); t?.scrollIntoView({block: 'center'}); t?.focus(); };
  try {
    if (c.preview) {
      const { data: su } = await SB.storage.from('pt-studio').createSignedUrl(c.preview, 900);
      const pg = await (await (await loadPdfjs()).getDocument(su.signedUrl).promise).getPage(1);
      const box = $('#pv-box'), cv = document.createElement('canvas'), w = box.clientWidth;
      const vp = pg.getViewport({scale: w / pg.getViewport({scale: 1}).width * (window.devicePixelRatio || 1)});
      cv.width = vp.width; cv.height = vp.height; cv.style.width = '100%';
      await pg.render({canvasContext: cv.getContext('2d'), viewport: vp}).promise; box.innerHTML = ''; box.appendChild(cv);
    } else {
      const { data: su } = await SB.storage.from('pt-studio').createSignedUrl(c.path, 900);
      $('#pv-box').innerHTML = `<img src="${esc(su.signedUrl)}" alt="새 이미지" style="width:100%"><small>페이지 미리보기를 생성하지 못해 새 이미지만 표시합니다.</small>`;
    }
  } catch (e) { $('#pv-box').innerHTML = `<p>미리보기를 불러오지 못했습니다: ${esc(e?.message || '')}</p>`; }
}
window.addEventListener('pt-refresh', () => { if ($('#review')?.open) window.ptRefresh?.(); else if (String(activeDetail || '').startsWith('p:')) openProposal(activeDetail.slice(2), true); });
// 페이지 순서 변경 (11-05 김현우 「슬라이드 순서도 거기서 수정」) — 원고(deck.slides) 순서를 바꾸고 전체를 다시 생성. 내용·이미지·고친 텍스트는 그대로
function slideOrder(p, done) {
  if (p.status === 'working') return toast('진행 중인 작업이 끝난 뒤 순서를 바꿀 수 있습니다.');
  const sl = p.data?.build?.deck?.slides || [];
  let rows = sl.map((s, i) => ({i, s})), moving = null;
  const name = s => { const t = Array.isArray(s.title) ? s.title.join(' ') : String(s.title || ''); return (t || s.eyebrow || '').replace(/\s+/g, ' ').trim() || (olType(s.layout)?.name || s.layout || '페이지'); };
  const kind = s => olType(s.layout)?.name || s.layout || '';
  modal(`<div><h2>페이지 순서 변경</h2><p>⠿ 를 끌거나 ↑ ↓ 로 순서를 바꿔 주세요. 저장하면 바꾼 순서로 제안서를 다시 생성합니다. 기밀·면책 페이지는 표지 다음에 자동으로 들어갑니다.</p><ol class="ol-list so-list" id="so-list"></ol><div class="modal-actions"><button class="button" type="button" data-cancel>닫기</button><button class="button primary" type="button" id="so-save" disabled>이 순서로 저장</button></div></div>`);
  $('#modal').classList.add('wide'); $('#modal').addEventListener('close', () => $('#modal').classList.remove('wide'), {once: true});
  const L = $('#so-list');
  const changed = () => rows.some((r, j) => r.i !== j);
  const move = (from, to) => { if (to < 0 || to >= rows.length || from === to) return; const [r] = rows.splice(from, 1); rows.splice(to, 0, r); $('#modal').dataset.dirty = '1'; draw(); };
  function draw() {
    L.replaceChildren();
    rows.forEach((r, j) => {
      const li = document.createElement('li'); li.className = 'ol-row so-row' + (r.i !== j ? ' moved' : ''); li.draggable = true;
      li.innerHTML = `<span class="ol-handle" aria-hidden="true">⠿</span><span class="ol-no">${j + 1}</span><span class="ol-rt"><b></b><small></small></span><span class="ol-rbtn"><button type="button" class="ol-ib" data-up aria-label="위로">↑</button><button type="button" class="ol-ib" data-down aria-label="아래로">↓</button></span>`;
      li.querySelector('b').textContent = name(r.s);
      li.querySelector('small').textContent = kind(r.s) + (r.i !== j ? ` · 원래 ${r.i + 1}번째` : '');
      li.querySelector('[data-up]').onclick = () => move(j, j - 1);
      li.querySelector('[data-down]').onclick = () => move(j, j + 1);
      li.ondragstart = e => { moving = j; e.dataTransfer.setData('text/plain', String(j)); e.dataTransfer.effectAllowed = 'move'; li.classList.add('drag'); };
      li.ondragend = () => { li.classList.remove('drag'); moving = null; };
      li.ondragover = e => { e.preventDefault(); li.classList.add('over'); };
      li.ondragleave = () => li.classList.remove('over');
      li.ondrop = e => { e.preventDefault(); li.classList.remove('over'); if (moving !== null) move(moving, j); };
      // 폰·태블릿 — ⠿ 를 손가락으로 끌기
      const hd = li.querySelector('.ol-handle');
      hd.onpointerdown = e => { if (e.pointerType === 'mouse') return; e.preventDefault(); try { hd.setPointerCapture(e.pointerId); } catch {}
        let over = null; li.classList.add('drag');
        hd.onpointermove = ev => { const t = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('.so-row'); if (t !== over) { over?.classList.remove('over'); over = t; t?.classList.add('over'); } };
        hd.onpointerup = hd.onpointercancel = () => { hd.onpointermove = hd.onpointerup = hd.onpointercancel = null; over?.classList.remove('over'); li.classList.remove('drag');
          const to = over ? [...L.children].indexOf(over) : -1; if (to >= 0) move(j, to); }; };
      L.appendChild(li);
    });
    $('#so-save').disabled = !changed();
  }
  draw();
  $('#so-save').onclick = async () => {
    $('#so-save').disabled = true;
    const { data: row, error: e0 } = await SB.from('pt_proposal').select('status,data').eq('id', p.id).single();
    if (e0) { $('#so-save').disabled = false; return toast('불러오지 못했습니다: ' + e0.message); }
    if (row.status === 'working') { $('#so-save').disabled = false; return toast('진행 중인 작업이 끝난 뒤 저장해 주세요.'); }
    const f = row.data, deck0 = f.build.deck;
    if ((deck0.slides || []).length !== sl.length) { $('#modal').dataset.dirty = ''; $('#modal').close(); return toast('그사이 제안서가 바뀌었습니다. 다시 열어 주세요.'); }
    const order = rows.map(r => r.i), slides = order.map(i => deck0.slides[i]);
    const { error } = await SB.from('pt_proposal').update({data: {...f, build: {...f.build, deck: {...deck0, slides}}}, status: 'working'}).eq('id', p.id);
    if (error) { $('#so-save').disabled = false; return toast('저장하지 못했습니다: ' + error.message); }
    await SB.from('pt_proposal_job').insert({proposal_id: p.id, kind: 'finalize', input: {}});
    const mv = rows.filter((r, j) => r.i !== j).length;
    await proposalEvent(p.id, `페이지 순서를 바꿨습니다(${mv}개 페이지 이동) → 제안서를 다시 생성합니다`);
    $('#modal').dataset.dirty = ''; $('#modal').close(); done?.();
    toast('바꾼 순서로 제안서를 다시 생성하는 중입니다.', {fn: async () => {
      const { data: r2 } = await SB.from('pt_proposal').select('data').eq('id', p.id).single(); const d2 = r2.data, cur = d2.build.deck.slides;
      if (cur.length !== order.length) return toast('그사이 제안서가 바뀌어 되돌리지 못했습니다.');
      const back = []; order.forEach((i, j) => { back[i] = cur[j]; });
      await SB.from('pt_proposal').update({data: {...d2, build: {...d2.build, deck: {...d2.build.deck, slides: back}}}, status: 'working'}).eq('id', p.id);
      await SB.from('pt_proposal_job').insert({proposal_id: p.id, kind: 'finalize', input: {}});
      await proposalEvent(p.id, '페이지 순서 변경을 취소했습니다');
      studio.list = null; await loadStudio(); toast('원래 순서로 다시 생성하는 중입니다.'); window.dispatchEvent(new Event('pt-refresh')); }});
  };
}
async function pageReview(pid, start) {
  let p = studio.list?.find(x => x.id === pid); if (!p?.data?.build?.pdf) return toast('생성된 제안서가 없습니다.');
  let dlg = $('#review');
  if (!dlg) { dlg = document.createElement('dialog'); dlg.id = 'review'; dlg.className = 'review'; document.body.appendChild(dlg); }
  const b = p.data.build;
  dlg.innerHTML = `<div class="rv-head"><div><h2>${p.status === 'waiting' ? '이미지 확인·수정' : '페이지별 보기'} · v${b.version}</h2><small id="rv-qa"></small></div><div class="rv-nav"><button class="button" id="rv-prev">◀ 이전 페이지</button><b id="rv-n"></b><button class="button" id="rv-next">다음 페이지 ▶</button><button class="button" id="rv-close">닫기</button></div></div>
  <div class="rv-live" id="rv-live" hidden></div><div class="rv-strip" id="rv-strip"></div><div class="rv-body"><div class="rv-page"><div class="rv-canvas-wrap"><canvas id="rv-canvas"></canvas><div class="rv-hot" id="rv-hot"></div></div><div class="rv-tools" id="rv-tools"></div><p id="rv-load" class="rv-load"><i class="spin" aria-hidden="true"></i><span>제안서를 불러오는 중입니다 <b id="rv-load-pct">0%</b></span></p></div><div class="rv-side" id="rv-side"></div></div>`;
  if (!dlg.open) {           // 새 버전으로 다시 열 때는 이미 떠 있다
    dlg.showModal();
    dlg.addEventListener('close', () => { if (activeDetail === 'p:' + pid) openProposal(pid, true); }, {once: true});
  }
  dlg.dataset.dirty = '';
  dlg.oninput = ev => { if (ev.target.matches('[data-mk-prompt], [data-mk-why]')) dlg.dataset.dirty = '1'; };
  const closeRv = async () => { if (!dlg.dataset.dirty || await askLeave()) { dlg.dataset.dirty = ''; dlg.close(); } };
  $('#rv-close').onclick = closeRv;
  dlg.oncancel = ev => { if ($('#modal').open || $('#ask')?.open) return; if (dlg.dataset.dirty) { ev.preventDefault(); closeRv(); } };
  let doc, cur = 1;
  try {
    const { data: su } = await SB.storage.from('pt-studio').createSignedUrl(b.pdf, 1800);
    const task = (await loadPdfjs()).getDocument(su.signedUrl);
    task.onProgress = ev => { const el = $('#rv-load-pct'); if (el && ev.total) el.textContent = Math.min(100, Math.round(ev.loaded / ev.total * 100)) + '%'; };
    doc = await task.promise;
  } catch (e) { $('#rv-load').textContent = '제안서를 불러오지 못했습니다: ' + (e?.message || ''); return; }
  const N = doc.numPages;
  // 작업 중이면 3초마다 진행률을 다시 읽고, 끝나면(상태가 바뀌면) 새 버전으로 다시 연다 (10-30 김현우 「기다리는 곳은 무조건 동적으로」)
  let seen = '';
  const tick = async () => {
    if (!dlg.open) return;
    const [{ data: row }, { data: js }] = await Promise.all([SB.from('pt_proposal').select('status,data').eq('id', pid).single(),
      SB.from('pt_proposal_job').select('id,proposal_id,ref_id,kind,status,at,error,result,input').eq('proposal_id', pid).order('id', {ascending: false}).limit(6)]);
    if (!dlg.open || !row) return;
    studio.jobs = [...studio.jobs.filter(x => !(js || []).some(g => g.id === x.id)), ...(js || [])];
    const live = (js || []).filter(x => ['wait', 'work'].includes(x.status)).sort((a, b) => a.id - b.id);
    const box = $('#rv-live'); if (box) { box.hidden = !live.length; if (live.length) box.innerHTML = `<b>진행 중</b>${jobsProg(live)}`; }
    $$('#rv-side .rv-busy').forEach(el => { el.innerHTML = jobsProg(live.length ? live : [null]); });
    // 비교는 이 창이 연 버전·상태와 — 뒤의 상세 화면이 먼저 목록을 새로 읽어도 놓치지 않게
    if (row.data?.build?.version !== b.version) { studio.list = null; await loadStudio(); toast(`새 버전 v${row.data.build.version}이 생성되었습니다.`); return pageReview(pid, cur); }
    const snap = row.status + JSON.stringify(row.data?.images?.slots || {}) + JSON.stringify(row.data?.qa || {}) + JSON.stringify(row.data?.qa_ok || {}) + JSON.stringify(row.data?.build?.patches || {});
    if (seen && snap !== seen && !dlg.dataset.dirty) { studio.list = null; await loadStudio(); show(cur); }      // 프롬프트를 고치는 중이면 새로 고침을 미룬다
    if (!dlg.dataset.dirty) seen = snap;
    setTimeout(tick, 3000);
  };
  setTimeout(tick, 1500);
  const show = async n => {
    p = studio.list?.find(x => x.id === pid) || p;
    const d = p.data || {}, S = liveSlots(d), qa = qaOf(d), flags = qa?.flags || [];
    cur = Math.min(Math.max(1, n), N);
    $('#rv-n').textContent = `${cur} / ${N}페이지`; $('#rv-prev').disabled = cur <= 1; $('#rv-next').disabled = cur >= N;
    // 이미지가 몇 페이지 어디에 그려졌는지 — 렌더러가 남긴 위치(boxes)가 있으면 그것, 없으면 원고의 페이지 번호 (10-30)
    const B = d.build?.boxes || {}, pageOf = k => +(B[k]?.page || S[k].slide);
    const spots = k => B[k]?.at || (B[k]?.x !== undefined ? [B[k]] : []), onPage = (k, n) => spots(k).length ? spots(k).some(a => +a.page === n) : pageOf(k) === n;   // 한 이미지를 여러 페이지에 쓰면 그 페이지마다
    const fs = new Set(flags.map(f => +f.slide)), miss = new Set(Object.keys(S).filter(k => ['missing', 'ai'].includes(S[k].status)).flatMap(k => spots(k).length ? spots(k).map(a => +a.page) : [pageOf(k)]));
    $('#rv-qa').textContent = qa ? (flags.length ? `자동 검수 · 확인 필요 항목 ${flags.length}건 (빨간색 표시 페이지)` : '자동 검수 · 특이 사항 없음') : '자동 검수 전입니다';
    $('#rv-strip').innerHTML = Array.from({length: N}, (_, i) => i + 1).map(n => `<button type="button" class="${n === cur ? 'on ' : ''}${fs.has(n) ? 'flag' : miss.has(n) ? 'miss' : ''}" data-go="${n}" aria-label="${n}페이지">${n}</button>`).join('');
    $$('#rv-strip [data-go]').forEach(x => x.onclick = () => nav(+x.dataset.go));
    $('#rv-strip .on')?.scrollIntoView({block: 'nearest', inline: 'center'});
    // 페이지 그림은 기다리지 않고 그린다 — 그림이 늦어도 오른쪽 이미지 자리는 바로 보이게
    if ($('#rv-load')) { $('#rv-load').hidden = false; $('#rv-load span').textContent = `${cur}페이지를 그리는 중입니다`; }
    const patch = d.build?.patches?.[cur], ppath = typeof patch === 'string' ? patch : patch?.pdf, pn = typeof patch === 'object' && patch ? patch.n || 1 : 1;
    const pageDoc = ppath ? (PATCH_DOCS[ppath] ||= SB.storage.from('pt-studio').createSignedUrl(ppath, 1800).then(r => PDFJS.getDocument(r.data.signedUrl).promise)).then(x => x.getPage(pn)) : doc.getPage(cur);
    pageDoc.then(pg => { const c = $('#rv-canvas'); if (!c) return; const w = c.parentElement.clientWidth - 2;
      const vp = pg.getViewport({scale: w / pg.getViewport({scale: 1}).width * (window.devicePixelRatio || 1)});
      if (c._task) c._task.cancel();      // 앞 페이지를 그리는 중이면 멈춤 — 같이 그리면 페이지가 뒤집혀 섞였다 (10-30)
      c.width = vp.width; c.height = vp.height; c._task = pg.render({canvasContext: c.getContext('2d'), viewport: vp}); return c._task.promise; })
      .then(() => { if ($('#rv-load')) $('#rv-load').hidden = true; }).catch(() => {});
    const fl = flags.filter(f => +f.slide === cur), keys = Object.keys(S).filter(k => onPage(k, cur)).sort();
    const EW = 12192000, EH = 6858000;            // 960×540pt 페이지 (EMU)
    // 페이지 전체를 덮는 배경 이미지는 맨 아래에 깔아, 그 위 사진들을 먼저 누를 수 있게 (10-30)
    const big = b => b.w * b.h / (EW * EH) > 0.8;
    $('#rv-sizebar')?.remove(); $('#rv-txtbar')?.remove(); $('.rv-tlayer')?.remove();
    // 텍스트 위치 이동 (10-30 김현우 「텍스트도 선택해서 드래그로 위치 옮길 수 있게」) — 렌더러가 남긴 글상자 위치(boxes 「t:…」)
    const tOn = id => (B[id]?.at || [B[id]]).some(a => +a?.page === cur);
    const tids = Object.keys(B).filter(id => id.startsWith('t:') && tOn(id));
    $('#rv-tools').innerHTML = `<button class="button small" id="rv-tedit">텍스트 수정</button>${tids.length ? '<button class="button small" id="rv-txt">텍스트 위치 이동</button>' : ''}${(d.build?.deck?.slides || []).length > 1 ? '<button class="button small" id="rv-order">페이지 순서 변경</button>' : ''}`;
    if ($('#rv-txt')) $('#rv-txt').onclick = () => textMode(tids);
    $('#rv-tedit').onclick = () => tids.length ? textEdit(tids) : textOld();
    if ($('#rv-order')) $('#rv-order').onclick = () => slideOrder(p, () => { studio.list = null; loadStudio().then(() => show(cur)); });
    // 텍스트 위치 기록이 없는 예전 초안 (11-04 이전 생성) — 전체를 한 번 다시 생성하면 모든 페이지의 텍스트를 고칠 수 있다
    async function textOld() {
      if (p.status === 'working') return toast('진행 중인 작업이 끝난 뒤 수정할 수 있습니다.');
      if (!(await confirmBox({title: '텍스트를 수정하려면 제안서를 한 번 다시 생성해야 합니다', body: '이 초안은 텍스트 수정 기능이 생기기 전에 생성되었습니다. 내용과 이미지는 그대로 두고 다시 생성하며, 끝나면 모든 페이지의 텍스트를 수정할 수 있습니다.', ok: '다시 생성'}))) return;
      const { error } = await SB.from('pt_proposal_job').insert({proposal_id: p.id, kind: 'finalize', input: {}});
      if (error) return toast('요청하지 못했습니다: ' + error.message);
      await SB.from('pt_proposal').update({status: 'working'}).eq('id', p.id);
      await proposalEvent(p.id, '텍스트 수정을 위해 제안서를 다시 생성합니다');
      studio.list = null; await loadStudio(); show(cur); toast('제안서를 다시 생성하는 중입니다. 끝나면 텍스트를 수정할 수 있습니다.');
    }
    $('#rv-hot').innerHTML = keys.flatMap(k => spots(k).filter(a => +a.page === cur && a.w).map(b => [k, b])).sort((x, y) => big(y[1]) - big(x[1])).map(([k, b]) => { const bad = fl.some(f => f.key === k);
      return `<button type="button" class="${bad ? 'flag' : ''}${S[k].path ? '' : ' empty'}${big(b) ? ' bg' : ''}" data-hot="${esc(k)}" style="left:${b.x / EW * 100}%;top:${b.y / EH * 100}%;width:${b.w / EW * 100}%;height:${b.h / EH * 100}%" aria-label="${esc(KIND_KO_IMG[S[k].kind] || '')} ${esc(whatText(S[k].what))}"><span>${esc(KIND_KO_IMG[S[k].kind] || '')}</span></button>`; }).join('');
    const okd = k => !!S[k]?.path && (d.qa_ok || {})[k] === S[k].path;          // 사람이 확정한 이미지 (검수 목록에서 빠짐)
    const card = k => { const s = S[k], [cls, label] = SLOT_ST[s.status] || ['', s.status], bad = fl.filter(f => f.key === k);
      return `<div class="rv-slot${bad.length ? ' flag' : ''}"><div class="ithumb" data-thumb="${esc(s.path || '')}" data-rk="${esc(k)}">${s.path ? '' : `<span>${esc(KIND_KO_IMG[s.kind] || s.kind)}</span>`}</div><div class="rv-info"><div class="ihead"><b>${esc(KIND_KO_IMG[s.kind] || s.kind)}</b><span class="pill ${cls}">${label}</span></div><small>${esc(whatText(s.what))}</small>${(s.cand ? [] : bad).map(f => `<small class="warn">${esc(QA_KO[f.type] || '확인')} · ${esc(f.detail)}</small>${[...new Set([...String(f.detail).matchAll(/(\d{1,2})\s*페이지/g)].map(m => +m[1]).filter(n => n !== cur && n >= 1 && n <= N))].map(n => `<button class="text-btn go" data-go-page="${n}">${n}페이지 보기 ▶</button>`).join('')}`).join('')}${s.cand ? `<div class="rv-cand"><div class="ithumb" data-cand-thumb="${esc(s.cand.path)}"></div><div><b>새 이미지</b><small>아직 제안서에 반영되지 않았습니다</small><div class="ibtns"><button class="button small" data-cand-view="${esc(k)}">이 이미지로 미리보기</button><button class="button primary small" data-cand-ok="${esc(k)}">이 이미지로 확정</button><button class="text-btn" data-cand-no="${esc(k)}">새 이미지 폐기</button></div></div></div>` : ''}<div class="ibtns">${s.path && okd(k) ? `<span class="pill good">확정</span><button class="text-btn" data-rv-unok="${esc(k)}">확정 취소</button>` : bad.length && s.path && !s.cand ? `<button class="text-btn ok" data-rv-ok="${esc(k)}">이 이미지로 확정</button>` : ''}${s.path ? `<button class="text-btn" data-rv-open="${esc(k)}">크게 보기·수정</button>` : ''}<button class="text-btn" data-rv-arch="${esc(k)}">아카이브에서 선택</button><label class="text-btn up">내 이미지로 교체<input type="file" accept="image/png,image/jpeg,image/webp" data-rv-up="${esc(k)}" hidden></label></div>${makeBox(k, s)}</div></div>`; };
    const canAi = s => AI_KINDS.includes(s.kind) || (!s.path && !['official', 'logo', 'capture'].includes(s.kind));
    function makeBox(k, s) {
      if (p.status === 'working' && (s.widen || s.upscale || s.status === 'ai')) { const live = liveJobs(p.id); return `<div class="rv-busy">${jobsProg(live.length ? live : [null])}</div>`; }
      // 이 이미지를 Aside 가 찾는 중이면 단추 대신 진행 표시 — 두 번 눌러 같은 요청이 두 번 가는 것 막기 (10-30)
      const hunt = liveJobs(p.id).find(j => j.kind === 'aside' && (j.input?.slots || []).some(x => x.key === k));
      if (hunt) return `<div class="rv-busy">${jobsProg([hunt])}</div>`;
      const ai = canAi(s) && !s.widened;
      // 자동 검수가 고친 프롬프트·고칠 점이 있으면 미리 채운다 (10-30 김현우 「개선할 점에 자동으로 개선 프롬프트」)
      const fx = fl.find(f => f.key === k && f.prompt_fix);
      return `<div class="rv-make">${ai ? `${fx ? '<small class="rv-fix">자동 검수에서 수정한 프롬프트입니다. 확인 후 다시 생성해 주세요.</small>' : ''}<textarea data-mk-prompt="${esc(k)}" rows="${fx ? 5 : 3}" placeholder="생성 프롬프트(영문) — 피사체·장면·분위기">${esc(fx ? fx.prompt_fix : s.prompt || '')}</textarea>
        <input data-mk-why="${esc(k)}" maxlength="200" placeholder="개선할 점(재생성 시 반영)" value="${esc(fx ? (fx.why || fx.detail) : '')}">${refOf(d, k) ? `<small class="rv-fix">메인 이미지(「${esc(whatText(S[refOf(d, k)]?.what).slice(0, 20))}」)를 참고해 동일한 모델로 생성합니다</small>` : ''}${logoRefs(d, k).length ? `<small class="rv-fix">공식 자료를 첨부해 생성합니다: ${esc(logoRefs(d, k).join(' · '))}</small>` : ''}<button class="button primary small" data-mk-ai="${esc(k)}">${s.status === 'generated' ? 'AI로 다시 생성' : 'AI로 생성'} · 약 $${refOf(d, k) || logoRefs(d, k).length ? '0.08' : '0.01'}</button>` : ''}
        ${s.path && !['logo', 'texture'].includes(s.kind) ? `<button class="button small" data-mk-fit="${esc(k)}">힉스필드로 영역에 맞춘 이미지 생성 · 약 $0.08</button>` : ''}
        ${spots(k).length === 1 && +spots(k)[0].page === cur && !(spots(k)[0].w * spots(k)[0].h / (12192000 * 6858000) > 0.8) ? `<button class="button small" data-rv-size="${esc(k)}">이미지 영역 크기 조절</button>` : ''}
        ${['official', 'logo', 'reference', 'capture'].includes(s.kind) ? `<button class="button small" data-mk-other="${esc(k)}">Aside로 다른 이미지 검색</button>` : ''}
        ${s.path && !AI_KINDS.includes(s.kind) ? `<div class="rv-lowres" data-lr="${esc(k)}" hidden><small class="warn"></small><button class="button small" data-mk-hires="${esc(k)}">Aside로 고해상도 검색</button><button class="button small" data-mk-up="${esc(k)}">힉스필드로 고해상도 보정 · 약 $0.08</button></div>` : ''}</div>`;
    }
    function textMode(tids) {
      if ($('.rv-tlayer')) return;
      const wrap = $('.rv-canvas-wrap'), EW = 12192000, EH = 6858000, tp = d.build?.deck?.text_pos || {};
      $('#rv-hot').style.pointerEvents = 'none'; dlg.dataset.dirty = '1'; $('#rv-txt').disabled = true;
      wrap.insertAdjacentHTML('beforeend', `<div class="rv-tlayer">${tids.map(id => { const a = (B[id].at || [B[id]]).find(z => +z.page === cur);
        return `<div class="tbox${tp[id] ? ' moved' : ''}" data-t="${esc(id)}" title="${esc(B[id].t || '')}" style="left:${a.x / EW * 100}%;top:${a.y / EH * 100}%;width:${a.w / EW * 100}%;height:${a.h / EH * 100}%"></div>`; }).join('')}</div>`);
      const moved = {};
      $$('.rv-tlayer .tbox').forEach(t => {
        t.ontouchstart = ev => ev.stopPropagation();
        t.onpointerdown = ev => { ev.preventDefault(); ev.stopPropagation(); t.setPointerCapture(ev.pointerId);
          $$('.rv-tlayer .tbox.sel').forEach(o => o.classList.remove('sel')); t.classList.add('sel');
          const W = wrap.clientWidth, H = wrap.clientHeight, sx = ev.clientX, sy = ev.clientY, l = parseFloat(t.style.left), tt = parseFloat(t.style.top), w = parseFloat(t.style.width), h = parseFloat(t.style.height);
          t.onpointermove = e => { const L = Math.min(100 - w, Math.max(0, l + (e.clientX - sx) / W * 100)), T = Math.min(100 - h, Math.max(0, tt + (e.clientY - sy) / H * 100));
            t.style.left = L + '%'; t.style.top = T + '%'; if (Math.abs(L - l) + Math.abs(T - tt) > 0.2) { t.classList.add('moved'); moved[t.dataset.t] = [L, T]; } };
          t.onpointerup = () => { t.onpointermove = null; }; };
      });
      const had = tids.some(id => tp[id]);
      wrap.insertAdjacentHTML('afterend', `<div class="rv-sizebar" id="rv-txtbar"><small>점선 영역이 이 페이지의 텍스트입니다. 이동할 텍스트를 드래그해 주세요. 반영하면 이 페이지만 다시 생성합니다.</small><div class="ibtns"><button class="button primary small" id="tx-ok">이 위치로 반영</button>${had ? '<button class="button small" id="tx-reset">텍스트 원위치</button>' : ''}<button class="text-btn" id="tx-no">이동 취소</button></div></div>`);
      $('#tx-no').onclick = () => { dlg.dataset.dirty = ''; show(cur); };
      const save = async reset => {
        const ids = reset ? tids.filter(id => tp[id]) : Object.keys(moved);
        if (!ids.length) return toast('이동한 텍스트가 없습니다. 점선 영역을 드래그해 이동해 주세요.');
        $('#tx-ok').disabled = true;
        const { data: row, error: e0 } = await SB.from('pt_proposal').select('data').eq('id', p.id).single();
        if (e0) { $('#tx-ok').disabled = false; return toast('불러오지 못했습니다: ' + e0.message); }
        const f = row.data, deck0 = f.build.deck, pos = {...(deck0.text_pos || {})}, orig = {...(deck0.text_orig || {})}, boxes = {...f.build.boxes};
        ids.forEach(id => { const b = boxes[id]; if (!b) return; const a = (b.at || [b])[0];
          if (!orig[id]) orig[id] = {x: a.x, y: a.y};
          const xy = reset ? orig[id] : {x: Math.round(moved[id][0] / 100 * EW), y: Math.round(moved[id][1] / 100 * EH)};
          if (reset) { delete pos[id]; delete orig[id]; } else pos[id] = {x: +(xy.x / 12700).toFixed(1), y: +(xy.y / 12700).toFixed(1)};
          boxes[id] = {...b, ...xy, at: [{...a, ...xy}]}; });
        const { error } = await SB.from('pt_proposal').update({data: {...f, build: {...f.build, boxes, deck: {...deck0, text_pos: pos, text_orig: orig}}}, status: 'working'}).eq('id', p.id);
        if (error) { $('#tx-ok').disabled = false; return toast('저장하지 못했습니다: ' + error.message); }
        await SB.from('pt_proposal_job').insert({proposal_id: p.id, kind: 'finalize', input: {keys: ids}});
        await proposalEvent(p.id, `${cur}페이지 글 ${ids.length}개 위치를 ${reset ? '원래대로 복원했습니다' : '옮겼습니다'} → 이 페이지만 다시 생성합니다`);
        dlg.dataset.dirty = ''; studio.list = null; await loadStudio(); show(cur);
        toast(reset ? '텍스트를 원래 위치로 복원합니다. 이 페이지를 다시 생성하는 중입니다.' : '텍스트 위치를 반영합니다. 이 페이지를 다시 생성하는 중입니다.', {fn: async () => {
          const { data: r2 } = await SB.from('pt_proposal').select('data').eq('id', p.id).single(); const d2 = r2.data;
          await SB.from('pt_proposal').update({data: {...d2, build: {...d2.build, boxes: {...d2.build.boxes, ...Object.fromEntries(ids.map(id => [id, f.build.boxes[id]]))}, deck: {...d2.build.deck, text_pos: deck0.text_pos || {}, text_orig: deck0.text_orig || {}}}}, status: 'working'}).eq('id', p.id);
          await SB.from('pt_proposal_job').insert({proposal_id: p.id, kind: 'finalize', input: {keys: ids}});
          await proposalEvent(p.id, `${cur}페이지 텍스트 위치 변경을 취소했습니다`);
          studio.list = null; await loadStudio(); toast('실행을 취소했습니다. 이 페이지를 다시 생성하는 중입니다.'); window.dispatchEvent(new Event('pt-refresh')); }});
      };
      $('#tx-ok').onclick = () => save(false);
      if ($('#tx-reset')) $('#tx-reset').onclick = () => save(true);
    }
    // 텍스트 수정 (11-04 기획팀 시연 회의 「궁니르에서 텍스트 편집」) — 글상자를 눌러 문장을 고치면 deck.text_edit 에 남기고 이 페이지만 다시 생성
    function textEdit(tids) {
      if ($('.rv-tlayer')) return;
      const wrap = $('.rv-canvas-wrap'), EW = 12192000, EH = 6858000, te = d.build?.deck?.text_edit || {};
      const cur0 = id => (te[id] || B[id].full || [B[id].t || '']).join('\n');
      $('#rv-hot').style.pointerEvents = 'none'; dlg.dataset.dirty = '1'; $('#rv-tedit').disabled = true; if ($('#rv-txt')) $('#rv-txt').disabled = true;
      wrap.insertAdjacentHTML('beforeend', `<div class="rv-tlayer">${tids.map(id => { const a = (B[id].at || [B[id]]).find(z => +z.page === cur);
        return `<div class="tbox edit${te[id] ? ' moved' : ''}" data-t="${esc(id)}" title="${esc(B[id].t || '')}" style="left:${a.x / EW * 100}%;top:${a.y / EH * 100}%;width:${a.w / EW * 100}%;height:${a.h / EH * 100}%"></div>`; }).join('')}</div>`);
      const edits = {};
      let sel = null;
      wrap.insertAdjacentHTML('afterend', `<div class="rv-sizebar" id="rv-txtbar"><small>고칠 텍스트(점선 영역)를 눌러 문장을 수정해 주세요. 줄바꿈은 그대로 반영됩니다. 반영하면 이 페이지만 다시 생성합니다.</small>
        <select id="te-pick" aria-label="수정할 텍스트">${tids.map((id, i) => `<option value="${esc(id)}">${i + 1}. ${esc(cur0(id).replace(/\n/g, ' ').slice(0, 40))}</option>`).join('')}</select>
        <textarea id="te-text" rows="4" maxlength="2000" placeholder="먼저 페이지에서 텍스트를 선택해 주세요" disabled></textarea>${tids.some(id => te[id]) ? '<small class="muted">색이 칠해진 영역은 이미 수정한 텍스트입니다.</small>' : ''}
        <div class="ibtns"><button class="button primary small" id="te-ok">수정한 문장으로 반영</button>${tids.some(id => te[id]) ? '<button class="button small" id="te-reset">이 페이지 원래 문장으로</button>' : ''}<button class="button small" id="te-no">수정 취소</button></div></div>`);
      const keep = () => { if (sel) { const v = $('#te-text').value; if (v !== cur0(sel)) edits[sel] = v; else delete edits[sel]; } };
      $$('.rv-tlayer .tbox').forEach(t => { t.onclick = ev => { ev.stopPropagation(); keep();
        $$('.rv-tlayer .tbox.sel').forEach(o => o.classList.remove('sel')); t.classList.add('sel'); sel = t.dataset.t;
        const ta = $('#te-text');
        // 11-04 이전 초안은 글상자 문장을 앞 40자만 남겼다 — 그대로 고치면 뒷부분이 사라지므로 페이지를 한 번 다시 생성해 전체 문장을 받는다
        if (!te[sel] && !B[sel].full && (B[sel].t || '').length >= 40) { ta.disabled = true; ta.value = '';
          ta.placeholder = '이 초안은 전체 문장을 불러오려면 페이지를 한 번 다시 생성해야 합니다. 아래 「이 페이지 다시 생성」을 눌러 주세요.';
          if (!$('#te-refresh')) $('#te-ok').insertAdjacentHTML('beforebegin', '<button class="button small" id="te-refresh">이 페이지 다시 생성</button>');
          $('#te-refresh').onclick = async () => { $('#te-refresh').disabled = true;
            const { error } = await SB.from('pt_proposal_job').insert({proposal_id: p.id, kind: 'finalize', input: {keys: tids}});
            if (error) { $('#te-refresh').disabled = false; return toast('요청하지 못했습니다: ' + error.message); }
            await SB.from('pt_proposal').update({status: 'working'}).eq('id', p.id);
            await proposalEvent(p.id, `${cur}페이지 텍스트 수정을 위해 이 페이지를 다시 생성합니다`);
            dlg.dataset.dirty = ''; studio.list = null; await loadStudio(); show(cur); toast('이 페이지를 다시 생성하는 중입니다. 끝나면 텍스트를 수정할 수 있습니다.'); };
          return; }
        ta.disabled = false; ta.placeholder = ''; ta.value = edits[sel] ?? cur0(sel); $('#te-pick').value = sel; ta.focus(); }; });
      $('#te-pick').onchange = ev => $(`.rv-tlayer .tbox[data-t="${CSS.escape(ev.target.value)}"]`)?.click();
      $('.rv-tlayer .tbox')?.click();
      $('#te-no').onclick = () => { dlg.dataset.dirty = ''; show(cur); };
      const save = async reset => {
        keep();
        const ids = reset ? tids.filter(id => te[id]) : Object.keys(edits);
        if (!ids.length) return toast('수정한 텍스트가 없습니다. 페이지에서 텍스트를 선택해 문장을 고쳐 주세요.');
        $('#te-ok').disabled = true;
        const { data: row, error: e0 } = await SB.from('pt_proposal').select('data').eq('id', p.id).single();
        if (e0) { $('#te-ok').disabled = false; return toast('불러오지 못했습니다: ' + e0.message); }
        const f = row.data, deck0 = f.build.deck, ed = {...(deck0.text_edit || {})};
        ids.forEach(id => { if (reset) delete ed[id]; else { const ls = edits[id].split('\n').map(s => s.trimEnd()); ed[id] = ls.some(s => s.trim()) ? ls : undefined; if (!ed[id]) delete ed[id]; } });
        const { error } = await SB.from('pt_proposal').update({data: {...f, build: {...f.build, deck: {...deck0, text_edit: ed}}}, status: 'working'}).eq('id', p.id);
        if (error) { $('#te-ok').disabled = false; return toast('저장하지 못했습니다: ' + error.message); }
        await SB.from('pt_proposal_job').insert({proposal_id: p.id, kind: 'finalize', input: {keys: ids}});
        await proposalEvent(p.id, `${cur}페이지 텍스트 ${ids.length}개를 ${reset ? '원래 문장으로 복원했습니다' : '수정했습니다'} → 이 페이지만 다시 생성합니다`);
        dlg.dataset.dirty = ''; studio.list = null; await loadStudio(); show(cur);
        toast(reset ? '원래 문장으로 복원합니다. 이 페이지를 다시 생성하는 중입니다.' : '수정한 문장을 반영합니다. 이 페이지를 다시 생성하는 중입니다.', {fn: async () => {
          const { data: r2 } = await SB.from('pt_proposal').select('data').eq('id', p.id).single(); const d2 = r2.data;
          await SB.from('pt_proposal').update({data: {...d2, build: {...d2.build, deck: {...d2.build.deck, text_edit: deck0.text_edit || {}}}}, status: 'working'}).eq('id', p.id);
          await SB.from('pt_proposal_job').insert({proposal_id: p.id, kind: 'finalize', input: {keys: ids}});
          await proposalEvent(p.id, `${cur}페이지 텍스트 수정을 취소했습니다`);
          studio.list = null; await loadStudio(); toast('실행을 취소했습니다. 이 페이지를 다시 생성하는 중입니다.'); window.dispatchEvent(new Event('pt-refresh')); }});
      };
      $('#te-ok').onclick = () => save(false);
      if ($('#te-reset')) $('#te-reset').onclick = () => save(true);
    }
    // 이미지 영역 크기 조절 — 페이지 위 상자 가장자리·모서리를 끌어 늘리고 줄인다 → 그 페이지만 다시 그림 (10-30 김현우)
    function sizeBox(k) {
      const h = $(`#rv-hot [data-hot="${CSS.escape(k)}"]`), wrap = $('.rv-canvas-wrap'); if (!h) return;
      if (h.classList.contains('edit')) return h.scrollIntoView({block: 'center', behavior: 'smooth'});     // 이미 조절 중이면 끌어 둔 크기 그대로
      $$('#rv-hot [data-hot]').forEach(o => { if (o !== h) o.style.pointerEvents = 'none'; });
      h.classList.add('edit'); h.onclick = null; dlg.dataset.dirty = '1';
      h.insertAdjacentHTML('beforeend', ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].map(d => `<i class="hd ${d}" data-hd="${d}"></i>`).join(''));
      // 비교 기준은 저장된 상자 — 화면 상자(끌어 둔 뒤 다시 누르면 이미 바뀐 크기)가 아니라 (10-30 「늘려도 그대로라고 나온다」)
      const a0 = spots(k)[0], r0 = [a0.x / 12192000 * 100, a0.y / 6858000 * 100, a0.w / 12192000 * 100, a0.h / 6858000 * 100];
      h.querySelectorAll('[data-hd]').forEach(hd => {
        hd.ontouchstart = ev => ev.stopPropagation();
        hd.onpointerdown = ev => { ev.preventDefault(); ev.stopPropagation(); hd.setPointerCapture(ev.pointerId);
          const W = wrap.clientWidth, H = wrap.clientHeight, sx = ev.clientX, sy = ev.clientY, d = hd.dataset.hd;
          const [l, t, w, hh] = ['left', 'top', 'width', 'height'].map(z => parseFloat(h.style[z]));
          hd.onpointermove = e => { const dx = (e.clientX - sx) / W * 100, dy = (e.clientY - sy) / H * 100; let L = l, T = t, Wd = w, Ht = hh;
            if (d.includes('e')) Wd = Math.min(100 - l, Math.max(3, w + dx));
            if (d.includes('s')) Ht = Math.min(100 - t, Math.max(3, hh + dy));
            if (d.includes('w')) { L = Math.min(l + w - 3, Math.max(0, l + dx)); Wd = w + l - L; }
            if (d.includes('n')) { T = Math.min(t + hh - 3, Math.max(0, t + dy)); Ht = hh + t - T; }
            Object.assign(h.style, {left: L + '%', top: T + '%', width: Wd + '%', height: Ht + '%'}); };
          hd.onpointerup = () => { hd.onpointermove = null; }; };
      });
      const had = !!S[k].box;
      $('#rv-sizebar')?.remove();
      wrap.insertAdjacentHTML('afterend', `<div class="rv-sizebar" id="rv-sizebar"><small>영역의 가장자리나 모서리를 드래그해 크기를 조절해 주세요. 반영하면 이 페이지만 다시 생성합니다.</small><div class="ibtns"><button class="button primary small" id="sz-ok">이 크기로 반영</button>${had ? '<button class="button small" id="sz-reset">원래 크기로</button>' : ''}<button class="text-btn" id="sz-no">조절 취소</button></div></div>`);
      $('#sz-no').onclick = () => { dlg.dataset.dirty = ''; show(cur); };
      const save = async reset => {
        const v = ['left', 'top', 'width', 'height'].map(z => parseFloat(h.style[z]));
        if (!reset && v.every((x, i) => Math.abs(x - r0[i]) < 0.2)) return toast('영역 크기가 변경되지 않았습니다. 가장자리를 드래그해 조절해 주세요.');
        $('#sz-ok').disabled = true;
        const { data: row, error: e0 } = await SB.from('pt_proposal').select('data').eq('id', p.id).single();
        if (e0) { $('#sz-ok').disabled = false; return toast('불러오지 못했습니다: ' + e0.message); }
        const f = row.data, s0 = f.images.slots[k], b0 = f.build.boxes[k], at0 = (b0.at || [b0])[0];
        const orig = s0.box_orig || {x: at0.x, y: at0.y, w: at0.w, h: at0.h};
        const pt = reset ? null : {x: +(v[0] * 9.6).toFixed(1), y: +(v[1] * 5.4).toFixed(1), w: +(v[2] * 9.6).toFixed(1), h: +(v[3] * 5.4).toFixed(1)};
        const emu = reset ? orig : {x: Math.round(pt.x * 12700), y: Math.round(pt.y * 12700), w: Math.round(pt.w * 12700), h: Math.round(pt.h * 12700)};
        const { box: _x, box_orig: _o, ...rest } = s0, slot = reset ? rest : {...s0, box: pt, box_orig: orig};
        const boxes = {...f.build.boxes, [k]: {...b0, ...emu, at: [{...at0, ...emu}]}};
        const { error } = await SB.from('pt_proposal').update({data: {...f, build: {...f.build, boxes}, images: {...f.images, slots: {...f.images.slots, [k]: slot}}}, status: 'working'}).eq('id', p.id);
        if (error) { $('#sz-ok').disabled = false; return toast('저장하지 못했습니다: ' + error.message); }
        await SB.from('pt_proposal_job').insert({proposal_id: p.id, kind: 'finalize', input: {keys: [k]}});
        await proposalEvent(p.id, `${cur}페이지 「${whatText(s0.what) || k}」 이미지 영역을 ${reset ? '원래 크기로 복원했습니다' : '조절했습니다'} → 이 페이지만 다시 생성합니다`);
        dlg.dataset.dirty = ''; studio.list = null; await loadStudio(); show(cur);
        toast(reset ? '원래 크기로 복원합니다. 이 페이지를 다시 생성하는 중입니다.' : '영역 크기를 반영합니다. 이 페이지를 다시 생성하는 중입니다.', {fn: async () => {
          const { data: r2 } = await SB.from('pt_proposal').select('data').eq('id', p.id).single(); const d2 = r2.data;
          await SB.from('pt_proposal').update({data: {...d2, build: {...d2.build, boxes: {...d2.build.boxes, [k]: b0}}, images: {...d2.images, slots: {...d2.images.slots, [k]: s0}}}, status: 'working'}).eq('id', p.id);
          await SB.from('pt_proposal_job').insert({proposal_id: p.id, kind: 'finalize', input: {keys: [k]}});
          await proposalEvent(p.id, `${cur}페이지 이미지 영역 조절을 취소했습니다`);
          studio.list = null; await loadStudio(); toast('실행을 취소했습니다. 이 페이지를 다시 생성하는 중입니다.'); window.dispatchEvent(new Event('pt-refresh')); }});
      };
      $('#sz-ok').onclick = () => save(false);
      if ($('#sz-reset')) $('#sz-reset').onclick = () => save(true);
      h.scrollIntoView({block: 'center', behavior: 'smooth'});
    }
    const loose = fl.filter(f => !f.key || !keys.includes(f.key));
    $('#rv-side').innerHTML = `${loose.map(f => `<div class="rv-flag"><b>${esc(QA_KO[f.type] || '확인')}</b> ${esc(f.detail)}</div>`).join('')}${keys.length ? keys.map(card).join('') : '<p class="muted-box">이 페이지에는 이미지가 없습니다.</p>'}`;
    const paths = keys.map(k => S[k].path).filter(Boolean);
    if (paths.length) {
      const { data } = await SB.storage.from('pt-studio').createSignedUrls(paths, 900);
      (data || []).forEach(x => { if (!x.signedUrl) return; $$(`#rv-side [data-thumb="${CSS.escape(x.path)}"]`).forEach(el => { el.style.backgroundImage = `url("${x.signedUrl}")`; el.dataset.src = x.signedUrl; }); });
    }
    const open = k => { const s = S[k], el = $(`#rv-side [data-rk="${CSS.escape(k)}"]`); if (!el?.dataset.src) return;
      imgViewer({dataset: {src: el.dataset.src, key: k, ratio: s.ratio || '', label: `${s.slide}페이지 · ${KIND_KO_IMG[s.kind] || s.kind} · ${s.what || ''}`}}); };
    $$('#rv-side [data-rv-open]').forEach(x => x.onclick = () => open(x.dataset.rvOpen));
    // 이 이미지로 확정 / 확정 취소 (10-30 김현우) — 확정하면 검수 「확인할 곳」에서 빠지고, 같은 이미지인 동안 다음 검수에서도 다시 뜨지 않는다
    const setOk = async (k, on) => {
      const lp = studio.list?.find(z => z.id === p.id) || p, before = {...(lp.data?.qa_ok || {})}, path = S[k].path, page = cur;
      const flip = ok => { if (on) ok[k] = path; else delete ok[k]; return ok; };
      const done = await optimistic(
        () => { lp.data = {...lp.data, qa_ok: flip({...before})}; show(page); toast(on ? '이 이미지로 확정했습니다. 확인 필요 항목에서 제외됩니다.' : '확정을 취소했습니다.'); },
        async () => { const { data: row, error: e0 } = await SB.from('pt_proposal').select('data').eq('id', p.id).single(); if (e0) throw e0;
          return SB.from('pt_proposal').update({data: {...row.data, qa_ok: flip({...(row.data.qa_ok || {})})}}).eq('id', p.id); },
        () => { lp.data = {...lp.data, qa_ok: before}; show(page); }, '확정을 저장하지 못해 원래대로 복원했습니다');
      if (done) proposalEvent(p.id, `${page}페이지 「${whatText(S[k].what) || k}」 이미지를 ${on ? '확정했습니다' : '확정 취소했습니다'}`); };
    $$('#rv-side [data-rv-ok]').forEach(x => x.onclick = () => setOk(x.dataset.rvOk, true));
    $$('#rv-side [data-rv-unok]').forEach(x => x.onclick = () => setOk(x.dataset.rvUnok, false));
    $$('#rv-side .ithumb[data-rk]').forEach(x => x.onclick = () => open(x.dataset.rk));
    const card1 = k => $(`#rv-side [data-rk="${CSS.escape(k)}"]`)?.closest('.rv-slot');
    $$('#rv-hot [data-hot]').forEach(h => { const k = h.dataset.hot;
      h.onmouseenter = () => card1(k)?.classList.add('hl'); h.onmouseleave = () => card1(k)?.classList.remove('hl');
      h.onclick = () => { const c = card1(k); if (S[k].path && c?.querySelector('.ithumb')?.dataset.src) return open(k);
        c?.scrollIntoView({block: 'center', behavior: 'smooth'}); c?.classList.add('hl'); setTimeout(() => c?.classList.remove('hl'), 1600); }; });
    $$('#rv-side [data-rv-arch]').forEach(x => x.onclick = () => arPick(p, x.dataset.rvArch, () => show(cur)));
    $$('#rv-side [data-rv-up]').forEach(inp => inp.onchange = async () => { const f = inp.files[0]; if (f && await replaceSlotImage(p, inp.dataset.rvUp, f)) show(cur); });
    $$('#rv-side [data-mk-ai]').forEach(x => x.onclick = async () => { const k = x.dataset.mkAi, pr = $(`[data-mk-prompt="${CSS.escape(k)}"]`).value.trim();
      if (!pr) return toast('생성 프롬프트를 입력해 주세요.');
      x.disabled = true; if (await quickMake(p, k, 'ai', pr, $(`[data-mk-why="${CSS.escape(k)}"]`).value.trim())) { dlg.dataset.dirty = ''; show(cur); } else x.disabled = false; });
    $$('#rv-side [data-mk-fit]').forEach(x => x.onclick = async () => { x.disabled = true; if (await quickMake(p, x.dataset.mkFit, 'fit', '', '')) show(cur); else x.disabled = false; });
    $$('#rv-side [data-rv-size]').forEach(x => x.onclick = () => sizeBox(x.dataset.rvSize));
    $$('#rv-side [data-lr]').forEach(box => { const k = box.dataset.lr, b = d.build?.boxes?.[k], el = $(`#rv-side [data-rk="${CSS.escape(k)}"]`), need = needPx(d, k);
      if (!b || !el?.dataset.src) return;
      const im = new Image(); im.onload = () => { if (lowRes(im.naturalWidth, im.naturalHeight, need, b.w / b.h) || S[k].lowres) { box.hidden = false;
        box.querySelector('small').textContent = `해상도가 낮아 화질이 저하되어 보입니다 (현재 ${im.naturalWidth}px · 필요 약 ${need}px)`; } }; im.src = el.dataset.src; });
    $$('#rv-side [data-go-page]').forEach(x => x.onclick = () => nav(+x.dataset.goPage));
    const cps = keys.map(k => S[k].cand?.path).filter(Boolean);
    if (cps.length) SB.storage.from('pt-studio').createSignedUrls(cps, 900).then(({ data }) => (data || []).forEach(x => { if (x.signedUrl) $$(`#rv-side [data-cand-thumb="${CSS.escape(x.path)}"]`).forEach(el => { el.style.backgroundImage = `url("${x.signedUrl}")`; }); }));
    $$('#rv-side [data-cand-view]').forEach(x => x.onclick = () => candPreview(p, x.dataset.candView, () => show(cur)));
    $$('#rv-side [data-cand-ok]').forEach(x => x.onclick = async () => { x.disabled = true; await candApply(p, x.dataset.candOk, true); show(cur); });
    $$('#rv-side [data-cand-no]').forEach(x => x.onclick = async () => { x.disabled = true; await candApply(p, x.dataset.candNo, false); show(cur); });
    $$('#rv-side [data-mk-other]').forEach(x => x.onclick = async () => { x.disabled = true; await asideOther(p, x.dataset.mkOther); show(cur); });
    $$('#rv-side [data-mk-hires]').forEach(x => x.onclick = async () => { x.disabled = true; await asideHires(p, x.dataset.mkHires); show(cur); });
    $$('#rv-side [data-mk-up]').forEach(x => x.onclick = async () => { x.disabled = true; if (await quickMake(p, x.dataset.mkUp, 'upscale', '', '')) show(cur); else x.disabled = false; });
  };
  const nav = async n => { if (n !== cur && dlg.dataset.dirty && !(await askLeave())) return; dlg.dataset.dirty = ''; show(n); };
  window.ptRefresh = () => { dlg.dataset.dirty = ''; studio.list = null; loadStudio().then(() => show(cur)); };
  $('#rv-prev').onclick = () => nav(cur - 1); $('#rv-next').onclick = () => nav(cur + 1);
  dlg.onkeydown = ev => { if ($('#modal').open || $('#ask')?.open || ev.target.matches('input, textarea')) return; if (ev.key === 'ArrowLeft') nav(cur - 1); if (ev.key === 'ArrowRight') nav(cur + 1); };      // 글을 쓰는 중에는 화살표로 넘기지 않음
  // 폰에서는 페이지 그림을 옆으로 밀어 넘긴다 (10-30 모바일)
  const pg = dlg.querySelector('.rv-page'); let sx = null, sy = 0;
  pg.ontouchstart = ev => { sx = ev.touches[0].clientX; sy = ev.touches[0].clientY; };
  pg.ontouchend = ev => { if (sx === null) return; const dx = ev.changedTouches[0].clientX - sx, dy = ev.changedTouches[0].clientY - sy; sx = null; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) nav(cur + (dx < 0 ? 1 : -1)); };
  await show(start || 1);
}
// 낙관적 업데이트 (10-31 김현우 「누르는 순간 화면부터」) — 화면을 먼저 바꾸고 저장은 뒤에서. 실패하면 저장해 둔 값으로 되돌리고 알린다
async function optimistic(apply, save, revert, failMsg) {
  apply();
  try { const r = await save(); if (r?.error) throw r.error; return true; }
  catch (e) { revert(); toast(`${failMsg || '저장하지 못해 원래대로 복원했습니다'}${e?.message ? ' · ' + e.message : ''}`); return false; }
}
async function proposalEvent(id, message) { await SB.from('pt_proposal_event').insert({proposal_id: id, message}); }

// 마지막 작업이 「취소」로 끝났으면 다시 시작할 작업 — 리서치와 함께 돈 팬·SNS 조사(aside social)는 리서치로
const RESUME_STAGE = {partners: 3, research: 4, concepts: 5, build: 6};
function resumeOf(p) {
  const job = studio.cancelled?.[p.id];
  if (!job || p.status !== 'waiting' || studio.jobs.some(j => j.proposal_id === p.id) || !p.data?.cancel_req?.at || job.at > p.data.cancel_req.at) return null;      // 취소 요청 전에 넣은 작업만 · 다시 시작하면 cancel_req 를 지움
  const social = job.kind === 'aside' && job.input?.task === 'social', kind = social ? 'research' : job.kind;
  if (!RESUME_STAGE[kind]) return null;
  return {kind, stage: RESUME_STAGE[kind], input: social ? {} : (job.input || {})};
}
// 프로젝트 머리 로고 (11-04 김현우) — 봇이 data.logos 에 넣은 배경 없는 로고. 단독은 「로고」, 콜라보는 「로고 × 로고」, 아직 없으면 이름 두 글자
const logoUrl = {};
function pAvatar(p) {
  const L = p.data?.logos || {}, two = p.mode === 'collab' && !!p.ip_b_name;
  const pick = (k, nm) => L[k]?.path && L[k].name === nm ? L[k] : null, a = pick('a', p.ip_a_name), b = two ? pick('b', p.ip_b_name) : null;
  if (!a && !b) return `<span class="entity-avatar">${esc(p.ip_a_name.slice(0, 2))}</span>`;
  const one = (x, nm) => x ? `<span class="pv-logo-one${x.light ? ' light' : ''}"><img data-logo="${esc(x.path)}" ${logoUrl[x.path] ? `src="${esc(logoUrl[x.path])}"` : ''} alt="${esc(nm)} 로고"></span>` : `<span class="pv-logo-one"><b>${esc(nm.slice(0, 2))}</b></span>`;
  return `<span class="pv-logo">${one(a, p.ip_a_name)}${two ? `<i aria-hidden="true">×</i>${one(b, p.ip_b_name)}` : ''}</span>`;
}
async function loadLogos() {
  const els = $$('img[data-logo]:not([src])'); if (!els.length) return;
  const { data } = await SB.storage.from('pt-studio').createSignedUrls([...new Set(els.map(e => e.dataset.logo))], 3600);
  (data || []).forEach(d => { if (!d.signedUrl) return; logoUrl[d.path] = d.signedUrl; $$(`img[data-logo="${CSS.escape(d.path)}"]`).forEach(e => { e.src = d.signedUrl; }); });
}
async function openProposal(id, keep) {
  const p = studio.list?.find(x => x.id === id); if (!p) return;
  activeDetail = 'p:' + id; propShown = `${p.status}|${p.stage}`;
  if (!keep) setRoute(id);
  // 진행 단계는 맨 위 가로 막대로 (10-30 · 대표님 설계) — 사람이 결정하는 단계는 점으로 표시
  const stages = STAGES.map((s, i) => { const n = i + 1, skip = p.mode === 'single' && n === 3, cls = skip ? 'skip' : n < p.stage || p.status === 'done' ? 'done' : n === p.stage ? 'now' : ''; return `<li class="${cls}" title="${esc(s)}${GATES[n] && !skip ? ' · 결정: ' + esc(GATES[n]) : ''}${skip ? ' · 단독 제안은 생략' : ''}"><span>${n}</span><b>${esc(s)}</b>${GATES[n] && !skip ? '<i class="gate" aria-label="결정 단계"></i>' : ''}</li>`; }).join('');
  const job = studio.jobs.find(j => j.proposal_id === id);
  const ref = studio.refs?.find(r => r.id === p.ref_id);
  const ent = (eid, name) => eid && byId(eid) ? `<button class="ref" type="button" data-open="${eid}">${esc(name)}</button>` : esc(name || '—');
  const d = p.data || {};
  let action = '';
  if (p.status === 'waiting' && p.stage === 2) action = `<div class="detail-block"><h3>결정 · 기본 정보 확정</h3><p>아래 내용으로 시작합니다. 확정하면 ${p.mode === 'collab' && !p.ip_b_name ? '궁니르 봇이 파트너 IP 후보를 추천합니다.' : '궁니르 봇이 IP 리서치를 시작합니다.'}</p>${olSummary(p)}<div class="drawer-actions"><button class="button primary" id="intake-ok">기본 정보 확정</button><button class="button" id="intake-edit">내용 수정</button></div></div>`;
  else if (p.status === 'working' && p.stage >= 7 && job && !['image_plan', 'finalize', 'generate', 'aside', 'qa'].includes(job.kind)) action = `<div class="detail-block"><h3>진행 중 · ${esc(STAGES[p.stage - 1])}</h3><p>이 단계는 준비 중입니다. 완성되면 여기서 이어서 진행됩니다.</p></div>`;
  else if (p.status === 'working') { const live = liveJobs(id); action = `<div class="detail-block"><h3>진행 중 · ${esc(STAGES[p.stage - 1])}</h3>${jobsProg(live.length ? live : [job])}<p class="muted-box">화면을 벗어나거나 새로고침해도 작업은 계속 진행됩니다.</p><div class="drawer-actions"><button class="button danger" id="job-cancel">작업 취소</button></div></div>`; }
  else if (p.status === 'waiting' && resumeOf(p)) { const r = resumeOf(p); action = `<div class="detail-block pv-decide"><h3>작업을 취소했습니다 · ${esc(STAGES[r.stage - 1])}</h3><p>${esc(d.cancel_req?.by || '담당자')}님이 「${esc(STAGES[r.stage - 1])}」 작업을 취소했습니다. 이어서 진행하려면 다시 시작해 주세요. 이미 생성된 결과는 그대로 유지됩니다.</p><div class="drawer-actions"><button class="button primary" id="job-resume">${esc(STAGES[r.stage - 1])} 다시 시작</button></div></div>`; }
  else if (p.status === 'waiting' && d.paused?.next) action = `<div class="detail-block pv-decide"><h3>설정한 진행 범위에서 멈췄습니다 · ${esc(STAGES[(d.paused.stage || p.stage) - 1])}</h3><p>${d.paused.next === 'concepts' ? '리서치가 끝났습니다. 자료를 확인한 뒤 컨셉 설계를 이어서 진행해 주세요.' : '제안서 초안이 생성되었습니다. 초안을 확인한 뒤 이미지 수급을 이어서 진행해 주세요.'}</p><div class="drawer-actions"><button class="button primary" id="pause-go">${d.paused.next === 'concepts' ? '컨셉 설계 이어서 진행' : '이미지 수급 이어서 진행'}</button></div></div>`;
  else if (p.status === 'failed') action = `<div class="detail-block"><h3>작업 실패</h3><p>${esc(d.error || '궁니르 봇이 작업을 완료하지 못했습니다.')}</p><div class="drawer-actions"><button class="button primary" id="job-retry">다시 시도</button></div></div>`;
  else if (p.status === 'waiting' && p.stage === 3 && d.partners) action = partnersPanel(p);
  else if (p.status === 'waiting' && p.stage === 5 && d.concepts) action = conceptsPanel(p);
  else if (p.status === 'waiting' && p.stage >= 7 && d.images) action = imagesPanel(p);
  else if (p.status === 'waiting') action = `<div class="detail-block"><h3>결정 · ${esc(GATES[p.stage] || '확인')}</h3><p>궁니르 봇이 준비한 결과를 확인하고 결정해 주세요.</p></div>`;
  else if (p.status === 'done' && d.build) action = `<div class="detail-block pv-decide"><h3>완료 · v${d.build.version} · 수정 버전 생성</h3><p>수신사 피드백을 입력하면 원고를 수정해 다음 버전을 생성합니다. 추가로 필요한 이미지만 다시 수급합니다.</p><textarea id="rev-ins" rows="3" maxlength="1500" placeholder="예: Experience 2개 추가, Business 페이지에 금액 삽입, 심화 제안으로 전환"></textarea><div class="drawer-actions"><button class="button primary" id="rev-go">v${d.build.version + 1} 생성</button></div></div>`;
  const dlTip = '<p class="muted-box dl-tip">PPTX 파일은 <b>키노트</b>에서 바로 열립니다. <b>Figma</b>는 Figma Slides 파일 목록의 「가져오기」에서 PPTX를 올리면 편집할 수 있습니다. Figma에 Pretendard 글꼴이 없으면 기본 글꼴로 바뀝니다.</p>';
  const done = [d.build && `<div class="detail-block"><h3>제안서 초안 v${d.build.version}</h3>${Object.keys(d.build.patches || {}).length ? `<p class="muted-box">수정한 페이지 ${Object.keys(d.build.patches).map(Number).sort((a, b) => a - b).join('·')}은 화면에 바로 반영되어 있습니다. PDF·PPTX 다운로드 또는 완료 시 전체 파일에 일괄 반영합니다.</p>` : ''}<div class="detail-row"><span>분량</span><b>${d.build.slides}페이지 · 이미지 ${d.build.images}개</b></div>${d.images ? '' : '<p>이미지 위치는 회색 영역으로 표시해 두었습니다. 이미지 수급 단계에서 채워집니다.</p>'}<div class="detail-row"><span>강조색</span><b class="acc-row"><i class="swatch" style="background:${esc(d.build.deck?.theme?.accent || '#285541')}"></i>${esc(d.build.deck?.theme?.accent || '')} ${d.accent ? '(직접 선택)' : '(클로드 추천)'}${p.status === 'waiting' ? ` <input type="color" id="acc-new" value="${esc(d.build.deck?.theme?.accent || '#285541')}" aria-label="강조색 선택"> <button class="text-btn" id="acc-apply">이 색으로 적용</button>` : ''}</b></div><div class="drawer-actions">${d.build.pdf ? `<button class="button primary" data-file="${esc(d.build.pdf)}">PDF 보기</button>` : ''}<button class="button" data-file="${esc(d.build.pptx)}" data-dl="1" title="파워포인트·키노트에서 바로 열 수 있고, Figma Slides에서 가져오기로 편집할 수 있습니다">PPTX 다운로드</button>${d.build.pdf ? `<button class="button" data-review="1">${p.status === 'waiting' ? '이미지 확인·수정' : '페이지별 보기'}</button>` : ''}${p.status === 'waiting' && !d.build.deck?.redesigned ? '<button class="button" id="redesign">새 디자인 적용</button>' : ''}</div>${dlTip}${p.status === 'waiting' ? `<details class="pv-fold"><summary><b>원고 수정 요청</b> <small>문장·페이지 구성·순서를 수정할 때</small></summary><textarea id="mid-ins" rows="3" maxlength="1500" placeholder="예: 앞부분 팬 반응 페이지 삭제, 콜라보 명분 강화, 상품 페이지 2개 추가"></textarea><div class="drawer-actions"><button class="button" id="mid-go">v${d.build.version + 1} 생성</button></div></details>` : ''}${p.status === 'waiting' && p.stage >= 7 && d.images ? '' : qaBlock(p)}</div>`].filter(Boolean).join('');
  // 컨셉·리서치·팬·SNS 는 접어 둔 「자료」로 (10-30) — 결정할 것이 먼저 보이게
  const fold = (t, sub, body) => `<details class="pv-fold"><summary><b>${t}</b>${sub ? ` <small>${esc(sub)}</small>` : ''}</summary>${body}</details>`;
  const refs = [d.concept_selected && fold('확정한 컨셉', d.concept_selected.name, conceptCard(d.concept_selected)),
    d.research && fold('리서치', (d.research.ips || []).map(x => x.name).join(' · '), researchBlock(d.research)),
    d.social?.ips && fold('팬·SNS', `채널 ${d.social.ips.reduce((a, x) => a + x.channels.length, 0)}개`, socialBlock(d.social))].filter(Boolean).join('');
  showDrawer(`${pAvatar(p)}<h2>${esc(pTitle(p))}</h2><span class="detail-sub">${p.mode === 'single' ? '단독 제안' : '콜라보 제안'} · ${esc(p.recipient || '수신사 미정')}${propSub(p) ? ' · ' + esc(propSub(p)) : ''}</span>${d.concepts ? `<div class="drawer-actions"><button class="button" id="prop-more">${icon('plus')} 같은 IP로 다른 컨셉 제안서 생성</button></div>` : ''}
  <ol class="pv-steps" aria-label="진행 단계">${stages}</ol>
  <div class="pv-grid"><div class="pv-col">${action}${done}${refs ? `<div class="detail-block pv-refs"><h3>자료</h3>${refs}</div>` : ''}</div>
  <div class="pv-col pv-side"><div class="detail-block"><h3>기본 정보 <button class="text-btn" type="button" id="pv-info-edit">수정</button></h3><div class="detail-row"><span>IP</span><b>${ent(p.ip_a_id, p.ip_a_name)}</b></div>${p.mode === 'collab' ? `<div class="detail-row"><span>파트너 IP</span><b>${p.ip_b_name ? ent(p.ip_b_id, p.ip_b_name) : '궁니르 봇 추천 후 선택'}</b></div>` : ''}<div class="detail-row"><span>수신사</span><b>${esc(p.recipient || '—')}</b></div><div class="detail-row"><span>기안자</span><b>${esc(memberName(p.created_by) || '궁니르 봇')} · ${esc(ymd(p.created_at))}</b></div><div class="detail-row"><span>레퍼런스 포맷</span><b>${ref ? `${esc(refName(ref))} <button type="button" class="text-btn" data-ref-pdf="${ref.id}">확인하기</button>` : '—'}</b></div><div class="detail-row"><span>현재 상태</span><b>${pPill(p)}</b></div>${p.note ? `<p>${esc(p.note)}</p>` : ''}</div>
  <div class="detail-block"><h3>공개 범위</h3><div class="detail-row"><span>보기</span><b>${p.visibility === 'private' ? '<span class="pill">나만 보기</span>' : '궁니르 전체'}</b></div>${p.visibility === 'private' && me && p.created_by === me.id ? `<div class="drawer-actions"><button class="button" id="pv-share">궁니르 전체에 공유</button></div>` : ''}${me && (p.created_by === me.id || isAdmin) ? `<div class="drawer-actions"><button class="button danger" id="pv-delete">프로젝트 삭제</button></div>` : ''}</div>
  <div class="detail-block"><h3>활동 기록</h3><div id="proposal-events"><p>불러오는 중입니다<span class="dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></p></div></div></div></div>`, keep, 'PROPOSAL');
  loadLogos();
  const go = async (row, nextJob, msg, okMsg) => {
    const lp = studio.list?.find(z => z.id === p.id), before = lp && {...lp}, jobs0 = studio.jobs;
    const done = await optimistic(
      () => { if (!lp) return; Object.assign(lp, row);
        if (nextJob) studio.jobs = [...studio.jobs, {id: -Date.now(), proposal_id: p.id, kind: nextJob.kind, status: 'wait', input: nextJob.input || {}, at: new Date().toISOString()}];
        openProposal(p.id, true); if (okMsg) toast(okMsg); },
      async () => { const r = await SB.from('pt_proposal').update(row).eq('id', p.id); if (r.error) throw r.error;
        if (nextJob) { const j = await SB.from('pt_proposal_job').insert({proposal_id: p.id, ...nextJob}); if (j.error) throw j.error; } },
      () => { if (lp) { Object.keys(lp).forEach(x => delete lp[x]); Object.assign(lp, before); } studio.jobs = jobs0; openProposal(p.id, true); }, '저장하지 못해 원래대로 복원했습니다');
    if (!done) return;
    await proposalEvent(p.id, msg);
    studio.list = null; await loadStudio(); if (activeDetail === 'p:' + p.id) openProposal(p.id, true);
  };
  $('#intake-edit')?.addEventListener('click', () => studioProjectModal(p));
  $('#ol-edit')?.addEventListener('click', () => olEditor(p));
  // 취소한 작업 다시 시작 (11-02 홍석진 대표님 「취소 눌러 멈췄는데 다시 재개할 방법이 없음」) — 같은 작업을 같은 입력으로 다시 넣는다
  $('#job-resume')?.addEventListener('click', () => { const r = resumeOf(p); if (!r) return; const { cancel_req: _c, ...rest } = d;
    go({stage: r.stage, status: 'working', data: rest}, {kind: r.kind, input: r.input}, `취소했던 작업을 다시 시작했습니다 (${STAGES[r.stage - 1]})`, `${STAGES[r.stage - 1]}을(를) 다시 시작합니다.`); });
  $('#pv-info-edit')?.addEventListener('click', () => studioProjectModal(p));
  // 작업 취소 (10-30 김현우) — 8초 안에 「되돌리기」를 누르면 취소하지 않는다. 봇은 apply_at(8초 뒤)이 지나야 멈춘다 → 화면을 나가도 그대로 적용
  $('#job-cancel')?.addEventListener('click', async ev => {
    if (!(await confirmBox({title: '작업을 취소하시겠습니까?', body: '현재 진행 중인 작업을 중단하고 직전 결정 단계로 돌아갑니다. 이미 생성된 결과(원고·이미지)는 그대로 유지됩니다.', ok: '작업 취소', cancel: '계속 진행', danger: true}))) return;
    ev.target.disabled = true;
    const now = new Date(), req = {at: now.toISOString(), apply_at: new Date(now.getTime() + 8000).toISOString(), by: myName || ''};
    const { data: row, error: e0 } = await SB.from('pt_proposal').select('data').eq('id', p.id).single();
    if (e0) { ev.target.disabled = false; return toast('취소하지 못했습니다: ' + e0.message); }
    const { error } = await SB.from('pt_proposal').update({data: {...row.data, cancel_req: req}}).eq('id', p.id);
    if (error) { ev.target.disabled = false; return toast('취소하지 못했습니다: ' + error.message); }
    let undone = false;
    setTimeout(async () => { if (!undone) await proposalEvent(p.id, `진행 중인 작업을 취소했습니다 (${STAGES[p.stage - 1]})`); }, 8200);
    toast('취소되었습니다.', {fn: async () => {
      undone = true;
      const { data: r2 } = await SB.from('pt_proposal').select('data').eq('id', p.id).single();
      const { cancel_req: _c, ...rest } = r2.data || {};
      await SB.from('pt_proposal').update({data: rest}).eq('id', p.id);
      toast('작업 취소를 철회했습니다. 작업을 계속 진행합니다.'); studio.list = null; await loadStudio(); openProposal(p.id, true); }});
  });
  // 같은 IP 조합으로 제안서 하나 더 — 리서치·팬·SNS 조사·컨셉 후보를 이어받아 컨셉 고르기부터
  $('#prop-more')?.addEventListener('click', async ev => {
    const no = propNo(p);
    if (!(await confirmBox({title: '같은 IP로 제안서를 추가로 생성할까요?', body: `${esc(pTitle(p))}의 리서치와 컨셉 후보를 그대로 가져와 새 제안서를 생성하고, 컨셉 선택 단계부터 시작합니다. 기존 제안서는 그대로 유지됩니다.`, ok: '새 제안서 생성'}))) return;
    ev.target.disabled = true;
    const keep = Object.fromEntries(['research', 'social', 'concepts', 'accent', 'partners', 'partner_selected'].filter(k => d[k] !== undefined).map(k => [k, d[k]]));
    const row = {mode: p.mode, ip_a_name: p.ip_a_name, ip_a_id: p.ip_a_id, ip_b_name: p.ip_b_name, ip_b_id: p.ip_b_id, recipient: p.recipient, ref_id: p.ref_id,
                 note: p.note, data: {...keep, from_proposal: p.id}, stage: 5, status: 'waiting'};
    const { data: nw, error } = await SB.from('pt_proposal').insert(row).select().single();
    if (error) { ev.target.disabled = false; return toast('생성하지 못했습니다: ' + error.message); }
    await proposalEvent(nw.id, `제안서 ${no ? no.of + 1 : 2}을(를) 생성했습니다 · 리서치·컨셉 후보를 가져왔습니다`);
    studio.list = null; await loadStudio(); openProposal(nw.id); toast('새 제안서를 생성했습니다. 컨셉을 선택해 주세요.');
  });
  $('#intake-ok')?.addEventListener('click', () => {
    $('#intake-ok').disabled = true;
    const next = p.mode === 'collab' && !p.ip_b_name ? 3 : 4, ol = olOf(p);
    go({stage: next, status: 'working', data: {...d, outline: ol, outline_tpl: d.outline?.length ? (d.outline_tpl || '') : olDefault(p)}}, {kind: JOB_OF[next], input: {}}, `기본 정보를 확정했습니다 (제안서 구성 ${ol.length}페이지) → ${STAGES[next - 1]} 시작`, '기본 정보를 확정했습니다.');
  });
  $('#pause-go')?.addEventListener('click', () => {
    $('#pause-go').disabled = true;
    const kind = d.paused.next, {paused: _p, ...rest} = d;
    go({status: 'working', ...(kind === 'concepts' ? {stage: 5} : {}), data: rest}, {kind, input: {after: 'pause'}}, kind === 'concepts' ? '컨셉 설계를 이어서 진행합니다' : '이미지 수급을 이어서 진행합니다');
  });
  $('#pv-share')?.addEventListener('click', async ev => {
    if (!(await confirmBox({title: '궁니르 전체에 공유할까요?', body: '공유하면 모든 궁니르 사용자가 이 프로젝트를 보고 결정 단계에 참여할 수 있습니다. 공유한 뒤에는 다시 「나만 보기」로 되돌릴 수 없습니다.', ok: '공유'}))) return;
    ev.target.disabled = true;
    const { error } = await SB.from('pt_proposal').update({visibility: 'team'}).eq('id', p.id);
    if (error) { ev.target.disabled = false; return toast('공유하지 못했습니다: ' + error.message); }
    await proposalEvent(p.id, '궁니르 전체에 공유했습니다'); studio.list = null; await loadStudio(); openProposal(p.id, true); toast('궁니르 전체에 공유했습니다.');
  });
  $('#pv-delete')?.addEventListener('click', async ev => {
    if (!(await confirmBox({title: '프로젝트를 삭제할까요?', body: `「${esc(pTitle(p))}」 프로젝트를 목록에서 삭제합니다. 진행 중인 작업은 함께 중단됩니다. 힉스필드·Aside로 확보한 이미지는 이미지 아카이브에 보관되어 다른 제안서에서 다시 쓸 수 있습니다.`, ok: '삭제', danger: true}))) return;
    ev.target.disabled = true;
    const { error } = await SB.rpc('pt_proposal_delete', {p_id: p.id});
    if (error) { ev.target.disabled = false; return toast('삭제하지 못했습니다: ' + error.message); }
    closeDrawer(); studio.list = null; await loadStudio(); toast('프로젝트를 삭제했습니다. 이미지는 이미지 아카이브에 보관됩니다.');
  });
  $('#job-retry')?.addEventListener('click', () => {
    $('#job-retry').disabled = true;
    const kind = d.failed_kind || JOB_OF[p.stage] || 'research';
    go({status: 'working', data: {...d, error: null}}, {kind, input: kind === 'generate' ? {estimate_only: true} : {retry: true}}, `${STAGES[p.stage - 1]} 작업을 다시 요청했습니다`);
  });
  const patched = Object.keys(d.build?.patches || {}).length;
  $$('#drawer [data-file]').forEach(b => b.onclick = async () => {
    if (patched) {          // 페이지만 갈아 끼운 상태 — 파일을 받을 때 전체에 한 번 반영
      b.disabled = true;
      return go({status: 'working'}, {kind: 'finalize', input: {}}, `수정한 ${patched}개 페이지를 전체 파일에 반영합니다`, `수정한 ${patched}개 페이지를 전체 파일에 반영하는 중입니다. 완료 후 다시 클릭해 다운로드해 주세요.`);
    }
    const { data: u, error } = await SB.storage.from('pt-studio').createSignedUrl(b.dataset.file, 600, b.dataset.dl ? {download: `${pTitle(p)}_v${d.build.version}.pptx`} : undefined);
    if (error) return toast('파일을 열지 못했습니다.');
    window.open(u.signedUrl, '_blank', 'noopener');
  });
  $('#acc-apply')?.addEventListener('click', ev => {
    ev.target.disabled = true; const c = $('#acc-new').value.toUpperCase();
    go({status: 'working', data: {...d, accent: c}}, {kind: 'finalize', input: {accent: c}}, `강조색 ${c} 적용을 요청했습니다`);
  });
  // 7 이미지 — 내 이미지로 교체 · 다시 그리기 · 완료
  $$('#drawer [data-upimg]').forEach(inp => inp.onchange = async () => {
    const f = inp.files[0]; if (!f) return;
    if (await replaceSlotImage(p, inp.dataset.upimg, f)) openProposal(p.id, true);
  });
  $$('#drawer [data-review]').forEach(x => x.onclick = () => pageReview(p.id, +x.dataset.review || 1));
  $('#redesign')?.addEventListener('click', async ev => {
    if (!(await confirmBox({title: '새 디자인을 적용할까요?', body: '원고를 원본 제안서 디자인 레이아웃으로 다시 작성합니다. 이미지는 그대로 사용하지만 페이지 구성과 문장 배치가 변경될 수 있습니다. 현재 버전은 이력에 보관됩니다.', ok: '새 디자인 적용'}))) return;
    ev.target.disabled = true; go({status: 'working'}, {kind: 'finalize', input: {redesign: true}}, '원본 제안서 디자인 적용을 요청했습니다(이미지는 유지)', '새 디자인을 적용합니다. 진행률은 화면에서 확인할 수 있습니다.'); });
  $('#ai-est')?.addEventListener('click', ev => { ev.target.disabled = true; go({status: 'working'}, {kind: 'generate', input: {estimate_only: true}}, 'AI 이미지 견적을 요청했습니다'); });
  $('#ai-go')?.addEventListener('click', async ev => {
    const usd = +ev.target.dataset.usd, n = d.images.ai_estimate.count;
    if (!(await confirmBox({title: `이미지 ${n}장을 생성할까요?`, body: `<b>예상 비용 약 $${usd}</b>가 회사 힉스필드 잔액에서 차감됩니다. 실패하거나 부적절 판정된 이미지는 청구되지 않습니다. 생성된 이미지는 해당 페이지에만 반영됩니다.`, ok: `${n}장 생성 · 약 $${usd}`}))) return;
    ev.target.disabled = true;
    go({status: 'working'}, {kind: 'generate', input: {approved_usd: usd}}, `AI 이미지 ${n}장 생성을 승인했습니다 (예상 $${usd})`, '승인했습니다. 궁니르 봇이 생성을 시작합니다.');
  });
  $$('#drawer [data-aside]').forEach(b => b.onclick = () => {
    const k = b.dataset.aside, sl = d.images.slots[k];
    const im = (d.build?.deck?.slides || []).flatMap(x => x.images || []).find(x => x.key === k) || {};
    b.disabled = true;
    go({status: 'working'}, {kind: 'aside', input: {slots: [{key: k, kind: sl.kind, what: sl.what || '', ratio: sl.ratio || '', search: im.search || ''}], ips: [p.ip_a_name, p.ip_b_name].filter(Boolean)}},
       `${sl.slide}페이지 「${sl.what || k}」 이미지를 Aside 로 다시 찾도록 요청했습니다`, 'Aside에 요청했습니다. 진행률은 화면에서 확인할 수 있습니다.');
  });
  $('#rev-go')?.addEventListener('click', ev => {
    const t = $('#rev-ins').value.trim(); if (!t) { $('#rev-ins').focus(); return toast('수정할 내용을 입력해 주세요.'); }
    ev.target.disabled = true;
    const log = [...(d.revise_log || []), {at: new Date().toISOString(), stage: 'draft', instruction: t, version: d.build?.version, by: myName || ''}];
    go({status: 'working', data: {...d, revise_log: log}}, {kind: 'finalize', input: {instruction: t}}, `수정 버전을 요청했습니다 · ${t.slice(0, 120)}`, '수정 버전을 생성합니다. 진행률은 화면에서 확인할 수 있습니다.');
  });
  // 중간 과정에서도 원고 수정 요청 (10-30 대표님 「완성 혹은 중간 과정에 프롬프트로 넣으면 변경」)
  $('#mid-go')?.addEventListener('click', async ev => {
    const t = $('#mid-ins').value.trim(); if (!t) { $('#mid-ins').focus(); return toast('수정할 내용을 입력해 주세요.'); }
    if (!(await confirmBox({title: `원고를 수정해 v${d.build.version + 1}을 생성할까요?`,
        body: '요청한 부분만 수정하고 나머지 페이지와 이미지는 유지합니다. 추가로 필요한 이미지만 다시 수급합니다. 요청 내용은 다음 제안서 원고에도 반영되도록 저장됩니다.', ok: `v${d.build.version + 1} 생성`}))) return;
    ev.target.disabled = true;
    const log = [...(d.revise_log || []), {at: new Date().toISOString(), stage: 'draft', instruction: t, version: d.build?.version, by: myName || ''}];
    $('#mid-ins').value = '';
    go({status: 'working', data: {...d, revise_log: log}}, {kind: 'finalize', input: {instruction: t}}, `원고 수정을 요청했습니다 · ${t.slice(0, 120)}`, '원고를 수정해 다음 버전을 생성합니다. 진행률은 화면에서 확인할 수 있습니다.');
  });
  $('#img-rerender')?.addEventListener('click', async ev => {
    if (!(await confirmBox({title: '변경 사항을 제안서 전체에 반영할까요?', body: '교체한 이미지와 위치 조정 내용을 적용해 제안서 전체를 다시 생성하고, 자동 검수도 다시 진행합니다. 진행 중에는 수정할 수 없습니다.', ok: '전체에 반영'}))) return;
    ev.target.disabled = true; go({status: 'working'}, {kind: 'finalize', input: {}}, '변경 사항 반영을 요청했습니다'); });
  $('#img-done')?.addEventListener('click', async ev => {
    if (!(await confirmBox({title: `v${d.build.version}으로 제안서를 완료할까요?`,
        body: `완료하면 상태가 「완료」로 변경되고 이미지 수정 단계가 종료됩니다.${patched ? ` 수정한 ${patched}개 페이지를 전체 파일에 반영한 뒤 완료합니다.` : ''} 이후 수정이 필요하면 「수정 버전 생성」으로 다음 버전을 생성합니다.`,
        ok: `v${d.build.version}으로 완료`}))) return;
    ev.target.disabled = true;
    // 완료한 버전에 남은 AI 이미지·좌우 넓힌 이미지 = 사람이 통과시킨 것 → good_images (10-29 · 다음 원고가 이 수준을 따르게)
    const S = d.images?.slots || {}, at = new Date().toISOString();
    const good = Object.entries(S).filter(([, s]) => s.path && (s.status === 'generated' || s.widened))
      .map(([k, s]) => ({key: k, slide: s.slide, kind: s.kind, what: s.what || '', prompt: s.prompt || '', widen_extra: s.widen_extra || '', widened: !!s.widened,
                         retried: (s.prev_paths || []).length, path: s.path, version: d.build.version, at, by: myName || ''}));
    const keep = new Set(good.map(g => g.key));
    const log = (d.prompt_log || []).map(x => keep.has(x.key) ? {...x, kept: true} : x);
    if (patched) return go({status: 'working', data: {...d, good_images: good, prompt_log: log}}, {kind: 'finalize', input: {then_done: true}}, `수정한 ${patched}개 페이지를 전체에 반영한 뒤 완료합니다 (통과한 AI 이미지 ${good.length}장 기록)`, '수정한 페이지를 전체에 반영한 뒤 완료합니다.');
    go({status: 'done', data: {...d, good_images: good, prompt_log: log}}, null, `v${d.build.version} 으로 제안서를 완료했습니다 (통과한 AI 이미지 ${good.length}장 기록)`).then(() =>
      toast('제안서를 완료했습니다.', {fn: async () => { await SB.from('pt_proposal').update({status: 'waiting'}).eq('id', p.id); await proposalEvent(p.id, '완료를 취소했습니다'); studio.list = null; await loadStudio(); openProposal(p.id, true); toast('완료를 취소했습니다.'); }}));
  });
  if (d.images && $('#img-board')) loadImgThumbs(d.images.slots);
  if (d.social?.captures?.length) loadImgThumbs(Object.fromEntries(d.social.captures.map((c, i) => [i, c])));
  // 3 파트너 카드 고르기 · 다른 후보 · 카테고리 바꾸기
  $$('#drawer [data-pick]').forEach(b => b.onclick = () => {
    const c = d.partners.candidates[+b.dataset.pick], e = entityByName(c.ip);
    $$('#drawer [data-pick]').forEach(x => x.disabled = true);
    go({ip_b_name: e?.name || c.ip, ip_b_id: e?.id || null, stage: 4, status: 'working', data: {...d, partner_selected: c}}, {kind: 'research', input: {}}, `파트너 IP 「${c.ip}」를 선택했습니다 → 리서치 시작`, `${c.ip}을(를) 파트너로 선택했습니다.`);
  });
  // 추천 밖 IP 직접 입력 (10-28 홍석진 대표님)
  const own = $('#pb-own');
  if (own) {
    own.oninput = () => { const v = own.value.trim(), e = entityByName(v); $('#pb-own-note').innerHTML = v ? (e ? `<b>등록된 연락처 있음</b> · 이그드라실 엔티티 「${esc(e.name)}」(${esc(e.type)})와 연결됩니다${contactsOf(e).length ? ` · 등록된 담당자 ${contactsOf(e).length}명` : ''}` : '<span class="err">등록된 연락처 없음</span> · 이그드라실 엔티티에 등록되지 않은 IP입니다. 이름 그대로 진행합니다.') : ''; };
    $('#pb-own-go').onclick = () => {
      const v = own.value.trim(); if (!v) { own.focus(); return; }
      const e = entityByName(v), name = e?.name || v, { partner_selected, ...rest } = d;
      $$('#drawer [data-pick], #pb-own-go').forEach(x => x.disabled = true);
      go({ip_b_name: name, ip_b_id: e?.id || null, stage: 4, status: 'working', data: rest}, {kind: 'research', input: {}}, `파트너 IP 「${name}」를 직접 입력했습니다 → 리서치 시작`, `${name}을(를) 파트너로 선택했습니다.`);
    };
  }
  $$('#drawer [data-reroll]').forEach(b => b.onclick = () => {
    b.disabled = true;
    go({status: 'working'}, {kind: 'partners', input: {mode: 'reroll', category: b.dataset.reroll, exclude: d.partners.shown || []}}, `「${b.dataset.reroll}」 카테고리 후보를 다시 요청했습니다`);
  });
  $('#recategorize')?.addEventListener('click', ev => {
    ev.target.disabled = true;
    go({status: 'working'}, {kind: 'partners', input: {mode: 'recategorize', exclude: [...(d.partners.shown || []), ...(d.partners.categories || []).map(c => c.name)]}}, '카테고리를 변경해 재추천을 요청했습니다');
  });
  // 5 컨셉 확정
  $$('#drawer [data-concept]').forEach(b => b.onclick = () => {
    const c = d.concepts.candidates[+b.dataset.concept];
    $$('#drawer [data-concept]').forEach(x => x.disabled = true);
    const ds = readDeckStyle(p), ol = olOf(p);
    go({stage: 6, status: 'working', data: {...d, concept_selected: c, deck_style: ds, outline: ol, outline_tpl: d.outline?.length ? (d.outline_tpl || '') : olDefault(p)}}, {kind: 'build', input: {}}, `컨셉 「${c.name}」을(를) 확정했습니다 → 제안서 생성 (${ol.length}페이지 구성)`, '컨셉을 확정했습니다.');
  });
  $('#cc-go')?.addEventListener('click', async ev => {
    const t = $('#cc-ins').value.trim(); if (!t) { $('#cc-ins').focus(); return toast('수정 요청을 입력해 주세요.'); }
    if (!(await confirmBox({title: '이 요청으로 컨셉 후보를 다시 생성할까요?', body: '현재 후보가 요청을 반영한 새 후보로 변경됩니다. 요청 내용은 다음 제안서 컨셉에도 반영되도록 저장됩니다.', ok: '컨셉 재생성'}))) return;
    ev.target.disabled = true;
    const log = [...(d.revise_log || []), {at: new Date().toISOString(), stage: 'concept', instruction: t, by: myName || ''}];
    go({status: 'working', data: {...d, deck_style: readDeckStyle(p), revise_log: log}}, {kind: 'concepts', input: {instruction: t}}, `컨셉 수정을 요청했습니다 · ${t.slice(0, 120)}`, '컨셉을 다시 설계합니다. 진행률은 화면에서 확인할 수 있습니다.');
  });
  clearTimeout(propPoll);
  if (p.status === 'working') propPoll = setTimeout(() => pollProposal(p.id), 3000);      // 작업 중이면 단계와 상관없이 항상
  const { data } = await SB.from('pt_proposal_event').select('at,actor_name,message').eq('proposal_id', id).order('at', {ascending: false}).limit(50);
  const box = $('#proposal-events'); if (!box || activeDetail !== 'p:' + id) return;
  const li = e => `<li><time>${esc(kst(e.at))}</time><span>${esc(e.message)}<br><small>${esc((e.actor_name || '궁니르 봇').replace('판테온' + ' 봇', '궁니르 봇'))}</small></span></li>`;
  box.innerHTML = data?.length ? `<ol class="owner-hist">${data.slice(0, 6).map(li).join('')}</ol>${data.length > 6 ? `<details class="pv-more"><summary>이전 기록 ${data.length - 6}개</summary><ol class="owner-hist">${data.slice(6).map(li).join('')}</ol></details>` : ''}` : '<p>기록이 없습니다.</p>';
}

function studioProjectModal(p) {
  const refs = studio.refs || [], def = p?.ref_id || refs.find(r => r.is_default)?.id || refs[0]?.id || '';
  const names = entities().filter(e => !e.hidden).map(e => `<option value="${esc(e.name)}">`).join('');
  const lockIp = !!p && p.stage > 2, dis = lockIp ? 'disabled' : '';
  modal(`<form id="sp-form"><h2>${p ? '기본 정보 수정' : '새 제안서 프로젝트'}</h2><p>${lockIp ? '리서치가 시작된 후에는 IP와 제안 방식을 변경할 수 없습니다. 다른 IP로 진행하려면 새 프로젝트를 생성해 주세요.' : 'IP 하나로 시작합니다. 이그드라실에 등록된 엔티티를 선택하면 담당자·연락처도 함께 연결됩니다.'}</p><datalist id="sp-ents">${names}</datalist>
  <label>IP *<input id="sp-a" list="sp-ents" required maxlength="80" value="${esc(p?.ip_a_name || '')}" placeholder="예: 에스파" ${dis}></label><small class="atnote" id="sp-a-note"></small>
  <div class="field"><span class="flabel">제안 방식</span><div class="seg-pick"><label><input type="radio" name="sp-mode" value="collab" ${p?.mode !== 'single' ? 'checked' : ''} ${dis}> 콜라보 제안 <small>IP A × IP B</small></label><label><input type="radio" name="sp-mode" value="single" ${p?.mode === 'single' ? 'checked' : ''} ${dis}> 단독 제안 <small>IP 하나</small></label></div></div>
  <div id="sp-b-field"><label>파트너 IP<input id="sp-b" list="sp-ents" maxlength="80" value="${esc(p?.ip_b_name || '')}" placeholder="입력하지 않으면 궁니르 봇이 후보를 추천합니다" ${dis}></label><small class="atnote" id="sp-b-note"></small></div>
  <label>수신사<input id="sp-to" list="sp-ents" maxlength="80" value="${esc(p?.recipient || '')}" placeholder="예: SM엔터테인먼트"></label>
  <div class="field"><span class="flabel">레퍼런스 포맷</span>${refs.length ? `<div class="ref-pick" role="radiogroup" aria-label="레퍼런스 포맷">${refs.map(r => `<label class="ref-opt"><input type="radio" name="sp-ref" value="${r.id}" ${r.id === def ? 'checked' : ''}><span class="ref-opt-body"><b>${esc(refName(r))}${r.is_default ? ' <span class="pill good">기본</span>' : ''}</b><small>${esc([refType(r), r.recipient, r.profile?.page_count ? r.profile.page_count + '페이지' : ''].filter(Boolean).join(' · '))}</small><span class="ref-opt-fmt">${esc(refFormat(r))}</span><button type="button" class="text-btn" data-ref-pdf="${r.id}">레퍼런스 확인하기</button></span></label>`).join('')}</div>` : '<p class="muted-box">등록된 레퍼런스가 없습니다. 레퍼런스 탭에서 먼저 등록해 주세요.</p>'}</div>
  <div class="field"><span class="flabel">강조색</span><div class="accent-pick"><label><input type="radio" name="sp-acc" value="" ${p?.data?.accent ? '' : 'checked'}> 클로드 추천</label><label><input type="radio" name="sp-acc" value="pick" ${p?.data?.accent ? 'checked' : ''}> 직접 선택 <input type="color" id="sp-color" value="${esc(p?.data?.accent || '#E0245E')}"></label></div><small class="atnote">클로드 추천을 선택하면 컨셉과 두 IP의 분위기에 맞춰 궁니르 봇이 지정합니다. 초안 생성 후에도 변경할 수 있습니다.</small></div>
  <label>메모<input id="sp-note" maxlength="300" value="${esc(p?.note || '')}" placeholder="예: 최초 제안 · 팝업 중심"></label>
  ${p ? '' : `<div class="field"><span class="flabel">공개 범위</span><div class="seg-pick"><label><input type="radio" name="sp-vis" value="team" checked> 궁니르 전체 <small>모든 궁니르 사용자</small></label><label><input type="radio" name="sp-vis" value="private"> 나만 보기 <small>시험용 · 나중에 공유 가능</small></label></div></div>
  <label hidden>진행 범위<select id="sp-stop"><option value="">끝까지 진행 (결정 단계에서만 확인)</option><option value="research">리서치까지만</option><option value="draft">원고 초안까지 (이미지 수급 전)</option></select></label>
  <label>컨셉 후보 수<select id="sp-cc"><option value="">5~7개 (기본)</option><option value="10">10개</option></select></label>`}
  <div id="sp-error" style="color:#ba775e;margin-top:14px;font-size:12px" role="alert"></div><div class="modal-actions"><button class="button" type="button" data-cancel>취소</button><button class="button primary" type="submit">${p ? '변경 저장' : '프로젝트 생성'}</button></div></form>`);
  const sync = () => { const collab = $('input[name=sp-mode]:checked').value === 'collab'; $('#sp-b-field').hidden = !collab; };
  $$('input[name=sp-mode]').forEach(r => r.onchange = sync); sync();
  $('#sp-color').oninput = () => { $('input[name=sp-acc][value=pick]').checked = true; };
  const note = (inp, out) => { const e = entityByName($(inp).value); $(out).innerHTML = $(inp).value.trim() ? (e ? `<b>등록된 연락처 있음</b> · 이그드라실 엔티티 「${esc(e.name)}」(${esc(e.type)})와 연결됩니다${contactsOf(e).length ? ` · 등록된 담당자 ${contactsOf(e).length}명` : ''}` : '<span class="err">등록된 연락처 없음</span> · 이그드라실 엔티티에 등록되지 않은 IP입니다. 이름 그대로 진행합니다.') : ''; };
  if (!lockIp) ['#sp-a', '#sp-b'].forEach((s, i) => { $(s).oninput = () => note(s, i ? '#sp-b-note' : '#sp-a-note'); note(s, i ? '#sp-b-note' : '#sp-a-note'); });
  $('#sp-form').onsubmit = async ev => {
    ev.preventDefault();
    const a = $('#sp-a').value.trim(), mode = $('input[name=sp-mode]:checked').value, b = mode === 'collab' ? $('#sp-b').value.trim() : '';
    if (!a) { $('#sp-error').textContent = 'IP를 입력해 주세요.'; return; }
    const ea = entityByName(a), eb = b ? entityByName(b) : null;
    const btn = $('#sp-form [type=submit]'); btn.disabled = true;
    const cur = p ? (await SB.from('pt_proposal').select('data').eq('id', p.id).single()).data?.data || p.data : {};   // 봇이 그사이 쓴 data 를 덮지 않게 최신본에 강조색만 얹음
    const row = {...(lockIp ? {} : {mode, ip_a_name: ea?.name || a, ip_a_id: ea?.id || null, ip_b_name: eb?.name || b, ip_b_id: eb?.id || null}), recipient: $('#sp-to').value.trim(), ref_id: $('input[name="sp-ref"]:checked')?.value || null, note: $('#sp-note').value.trim(), data: {...(cur || {}), accent: $('input[name=sp-acc]:checked').value === 'pick' ? $('#sp-color').value.toUpperCase() : ''}};
    if (!p) { row.visibility = $('input[name=sp-vis]:checked')?.value || 'team'; row.data = {...row.data, stop_at: $('#sp-stop')?.value || '', concept_count: Number($('#sp-cc')?.value) || 0}; }   // 11-04 기획팀 회의
    const q = p ? SB.from('pt_proposal').update(row).eq('id', p.id).select().single() : SB.from('pt_proposal').insert({...row, stage: 2, status: 'waiting'}).select().single();
    const { data, error } = await q;
    if (error) { btn.disabled = false; $('#sp-error').textContent = '저장하지 못했습니다: ' + error.message; return; }
    await proposalEvent(data.id, p ? '기본 정보를 수정했습니다' : `프로젝트를 생성했습니다 (${mode === 'single' ? '단독' : '콜라보'} 제안)`);
    $('#modal').close(); studio.list = null; await loadStudio(); openProposal(data.id); toast(p ? '기본 정보를 수정했습니다.' : '프로젝트를 생성했습니다.');
  };
}

const refFile = async id => { const r = studio.refs.find(x => x.id === id); const { data, error } = await SB.storage.from('pt-studio').createSignedUrl(r.file_path, 600); if (error) return toast('파일을 열지 못했습니다.'); window.open(data.signedUrl, '_blank', 'noopener'); };
const studioRefModal = () => { studio.tab = 'ref-new'; studio.refNew = null; render(); window.scrollTo(0, 0); };

/* ---------- 시연 모드 · 기능 소개 (11-04 김현우 「궁니르 온보딩 미팅 — 시연 모드, 기능 소개」) ----------
   실제 화면 위에서 한 곳씩 밝혀 순서대로 소개한다. 데이터는 바꾸지 않는다(화면 이동·보기만).
   ← → · 스페이스로 넘기고 Esc 로 끝낸다. 오른쪽 위 「시연 모드」 단추 또는 주소 끝 #tour 로 시작 */
const tourStudio = tab => { closeDrawer(); if (page !== 'studio') { page = 'studio'; try { history.replaceState(null, '', '#studio'); } catch {} } studio.tab = tab; studio.refNew = null; if (tab === 'archive') studio.arch = studio.arch || null; render(); };
const tourSample = () => { const xs = studio.list || []; return xs.find(p => p.status === 'done') || xs.slice().sort((a, b) => b.stage - a.stage)[0]; };
const TOUR = [
  {t: '궁니르 기능 소개', d: '궁니르는 더올마이티의 IP 콜라보 제안서 스튜디오입니다. IP를 입력하면 파트너 추천부터 리서치, 컨셉, 제안서 초안, 이미지 작업까지 궁니르 봇이 진행하며, 담당자는 결정 단계에서만 확인합니다.', go: () => tourStudio('projects')},
  {el: '#add-btn', t: '새 프로젝트', d: 'IP와 수신사만 입력하면 프로젝트가 시작됩니다. 콜라보 상대 IP를 입력하지 않으면 궁니르 봇이 적합한 후보를 점수와 함께 추천합니다.', go: () => tourStudio('projects')},
  {el: '.todo-panel', t: '내가 할 일', d: '내가 기안한 프로젝트 중 결정이 필요한 건이 상단에 표시됩니다. 대기 기간이 긴 순서로 정렬되며, 결정 대기가 하루를 넘긴 건은 「처리 지연」으로 강조됩니다.', go: () => tourStudio('projects')},
  {el: '.stats', t: '전체 현황', d: '진행 중 · 결정 대기 · 궁니르 봇 처리 중 · 완료 건수를 표시합니다. 카드를 클릭하면 해당 프로젝트만 아래 목록에 표시됩니다.', go: () => tourStudio('projects')},
  {el: '.pf-bar', t: '검색·필터', d: '프로젝트·IP·수신사·기안자 이름으로 바로 검색할 수 있습니다. 단계·상태·기안자 조건을 추가할 수 있으며, 「조건 초기화」로 전체 목록을 다시 확인합니다.', go: () => tourStudio('projects')},
  {el: '#pj-body', t: '프로젝트 목록', d: '궁니르 봇이 작업 중인 프로젝트는 진행률과 현재 작업 내용이 실시간으로 표시됩니다. 열 제목을 클릭하면 정렬됩니다.', go: () => tourStudio('projects')},
  {el: '.pv-steps', t: '8단계 진행', d: 'IP 입력부터 생성·검수까지 총 8단계로 진행됩니다. 표시된 결정 단계에서만 담당자가 선택하며, 나머지 단계는 궁니르 봇이 진행합니다. 화면을 닫아도 작업은 계속 진행됩니다.', go: async () => { tourStudio('projects'); const p = tourSample(); if (p) await openProposal(p.id); }},
  {el: '#drawer', t: '프로젝트 화면', d: '「지금 할 일」 카드에서 필요한 결정을 진행합니다. 초안 확인·다운로드, 페이지별 이미지 수정, 원고 수정 요청을 모두 이 화면에서 처리합니다.', go: async () => { if ($('#drawer').hidden) { tourStudio('projects'); const p = tourSample(); if (p) await openProposal(p.id); } }},
  {el: '#ref-body', t: '레퍼런스 라이브러리', d: '팀에서 실제 발송한 완성 제안서 목록입니다. 콜라보 대상과 유형이 표시되며, 이름·유형으로 검색할 수 있습니다. 새 제안서는 선택한 레퍼런스를 기준으로 작성됩니다.', go: () => tourStudio('refs')},
  {el: '[data-ref-new]', t: '레퍼런스 등록', d: 'PDF를 업로드하면 궁니르 봇이 전체 내용을 분석해 디자인·페이지 구성·문어체·설득 흐름을 상세히 학습합니다. 학습 결과는 「학습 완료 보기」에서 확인할 수 있습니다.', go: () => tourStudio('refs')},
  {el: '#content', t: '이미지 아카이브', d: '공식 이미지·로고·AI 이미지 등 수급하거나 생성한 이미지가 유형별로 보관됩니다. 다른 제안서에서도 다시 활용할 수 있습니다.', go: () => tourStudio('archive')},
  {el: '[data-page="chart"]', t: '소싱 · IP 차트', d: '인기 상승 IP 순위와 IP 스코어, 조합 시뮬레이션을 확인합니다. 차트에 없는 IP도 이름을 입력하면 바로 분석합니다.', go: () => tourStudio('projects'), skip: () => !ipcCan},
  {el: '[data-page="manual"]', t: '사용 매뉴얼', d: '화면별 사용법과 자주 묻는 질문을 정리했습니다. 「매뉴얼에 물어보기」에 질문하면 매뉴얼 내용을 바탕으로 바로 답변합니다.', go: () => tourStudio('projects')},
  {t: '기능 소개를 마칩니다', d: '헤임달 계정 또는 「슬랙으로 로그인」으로 바로 이용할 수 있습니다. 문의 사항은 사용 매뉴얼 또는 AX팀으로 연락해 주세요.', go: () => tourStudio('projects'), end: true},
];
let tourAt = -1, tourTimer = 0;
const tourSteps = () => TOUR.filter(s => !s.skip?.());
async function tourWait(sel, ms = 5000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { const el = document.querySelector(sel); if (el && el.getBoundingClientRect().width) return el; await new Promise(r => setTimeout(r, 120)); } return null; }
function tourPlace() {
  const box = $('#tour'); if (!box) return;
  const s = tourSteps()[tourAt], hole = box.querySelector('.tour-hole'), card = box.querySelector('.tour-card');
  const el = s?.el && document.querySelector(s.el), phone = innerWidth < 600;
  if (!el) { hole.hidden = true; card.classList.add('mid'); card.style.cssText = ''; return; }
  const r = el.getBoundingClientRect(), pad = 6, top = Math.max(4, r.top - pad), h = Math.min(innerHeight - top - 4, r.height + pad * 2);
  hole.hidden = false; Object.assign(hole.style, {left: `${Math.max(4, r.left - pad)}px`, top: `${top}px`, width: `${Math.min(innerWidth - 8, r.width + pad * 2)}px`, height: `${h}px`});
  card.classList.remove('mid');
  if (phone) { card.style.cssText = ''; return; }
  const cw = card.offsetWidth, ch = card.offsetHeight, below = top + h + 14, above = top - ch - 14;
  const y = below + ch < innerHeight ? below : above > 8 ? above : Math.max(8, innerHeight - ch - 16);
  const x = Math.min(innerWidth - cw - 16, Math.max(16, r.left + r.width / 2 - cw / 2));
  card.style.cssText = `left:${x}px;top:${y}px`;
}
async function tourShow(i) {
  const steps = tourSteps(); tourAt = Math.max(0, Math.min(steps.length - 1, i));
  const s = steps[tourAt], box = $('#tour'), card = box.querySelector('.tour-card');
  card.classList.add('busy');
  if (!studio.list) await loadStudio();
  try { await s.go?.(); } catch (e) { console.warn('[시연 모드]', e); }
  const el = s.el ? await tourWait(s.el) : null;
  if (tourAt !== steps.indexOf(s) || !$('#tour')) return;
  el?.scrollIntoView({block: el.offsetHeight > innerHeight * .6 ? 'start' : 'center', behavior: 'instant'});
  card.innerHTML = `<div class="tour-top"><span class="tour-n">${tourAt + 1} / ${steps.length}</span><button class="icon-btn" data-tour="x" aria-label="시연 모드 종료">${icon('close')}</button></div><div class="tour-bar"><i style="width:${(tourAt + 1) / steps.length * 100}%"></i></div><h3>${esc(s.t)}</h3><p>${esc(s.d)}</p>
  <div class="tour-acts">${tourAt ? '<button class="button" data-tour="prev">← 이전</button>' : '<span></span>'}${s.end ? '<span class="tour-end"><button class="button" data-tour="0">처음부터</button><button class="button primary" data-tour="x">종료</button></span>' : '<button class="button primary" data-tour="next">다음 →</button>'}</div>`;
  card.classList.remove('busy');
  card.querySelectorAll('[data-tour]').forEach(b => b.onclick = () => { const v = b.dataset.tour; v === 'x' ? tourEnd() : tourShow(v === 'prev' ? tourAt - 1 : v === 'next' ? tourAt + 1 : 0); });
  requestAnimationFrame(tourPlace);
  card.querySelector('[data-tour="next"],[data-tour="x"]:last-child')?.focus({preventScroll: true});
}
function tourKey(e) {
  if (!$('#tour')) return;
  if (e.key === 'Escape') { e.preventDefault(); tourEnd(); }
  else if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); if (tourAt < tourSteps().length - 1) tourShow(tourAt + 1); }
  else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); tourShow(tourAt - 1); }
}
function tourStart() {
  if ($('#tour')) return;
  const box = document.createElement('div'); box.id = 'tour'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', '궁니르 기능 소개');
  box.innerHTML = '<div class="tour-hole" hidden></div><div class="tour-card mid busy"><p>준비 중<span class="dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></p></div>';
  document.body.appendChild(box); document.body.classList.add('touring');
  document.addEventListener('keydown', tourKey, true); addEventListener('resize', tourPlace); addEventListener('scroll', tourPlace, true);
  tourTimer = setInterval(tourPlace, 200);          // 목록이 늦게 그려지거나 다시 그려져도 밝힌 자리가 따라가게
  tourShow(0);
}
function tourEnd() {
  $('#tour')?.remove(); document.body.classList.remove('touring'); tourAt = -1; clearInterval(tourTimer);
  document.removeEventListener('keydown', tourKey, true); removeEventListener('resize', tourPlace); removeEventListener('scroll', tourPlace, true);
  closeDrawer(); tourStudio('projects'); window.scrollTo(0, 0);
}

/* ---------- 내보내기 · 이동 ---------- */
function download(name, rows) {
  const csv = rows.map(r => r.map(v => '"' + String(v ?? '').replace(/^[=+@-]/, "'").replace(/"/g, '""') + '"').join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['﻿', csv], {type: 'text/csv;charset=utf-8'}));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast(name + ' 파일을 내보냈습니다.');
}
async function exportCSV() {
  if (!isAdmin) return toast('내보내기는 DB 관리자만 할 수 있습니다.');
  const arr = page === 'contacts' ? contacts() : entities().filter(match);
  const { error } = await SB.from('pt_export_log').insert({member_id: me.id, what: page === 'contacts' ? 'contacts' : 'entities', row_count: arr.length});
  if (error) return toast('내보내기 기록을 남기지 못해 내보내지 않았습니다: ' + error.message);
  download(page === 'contacts' ? 'pantheon-contacts.csv' : 'pantheon-entities.csv', [['이름', '영문 이름', '유형', '소속 / 회사 연결', '직함', '관계 근거', '등록된 담당자', '내부 담당자', '연락처(업무)'], ...arr.map(e => [e.name, e.en, e.type, agencyOf(e), e.role, e.rel, contactsOf(e).map(c => c.name).join(' / '), e.owners.join(' / '), e.points.join(' / ')])]);
}
function go(p) { page = p; filter = '전체'; entState = '전체'; query = ''; $('#global-search').value = ''; try { history.replaceState(null, '', '#' + p); } catch {} render(); window.scrollTo(0, 0); }
/* ---------- IP 차트 (10-31) — 요즘 뜨는 신규 IP · 전체 IP 순위 (sql/012 · 봇 ipchart.py 가 매일 08시 갱신 — 11-06 하루 4번에서 줄임) ---------- */
const IPK = {kpop: 'K-POP', character: '캐릭터', animation: '애니메이션', movie: '영화', ott: 'OTT', influencer: '인플루언서', other: '기타'};
const IPP = [['rt', '실시간', '전일 대비'], ['day', '일간', '전일 대비'], ['week', '주간', '전주 대비'], ['month', '월간', '전월 대비'], ['year', '연간', '전년 대비'], ['range', '기간 설정', '직전 같은 기간 대비']];
const ipc = {chart: 'new', period: 'rt', kind: 'all', from: '', to: '', rows: null, ips: {}, run: null, err: '', key: '', poll: null, open: null, openChart: ''};
const ipKst = iso => { try { const d = new Date(new Date(iso).getTime() + 9 * 3600e3); return `${d.getUTCMonth() + 1}.${d.getUTCDate()} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`; } catch { return ''; } };
function ipRange() {
  const now = Date.now(), day = 864e5, len = {day: 1, week: 7, month: 30, year: 365}[ipc.period];
  if (len) return {p_from: new Date(now - len * day).toISOString(), p_to: new Date(now).toISOString()};
  if (ipc.period === 'range' && ipc.from && ipc.to) return {p_from: new Date(ipc.from + 'T00:00:00+09:00').toISOString(), p_to: new Date(new Date(ipc.to + 'T00:00:00+09:00').getTime() + day).toISOString()};
  return {};
}
const IP_RUN = 'id,at,status,progress,step,done_at';
// 순위 기준 — 봇 ipchart.py 의 score()·SEGS·POOL_HOURS·DECAY 와 같은 내용 (바꾸면 둘 다)
const IP_HOW = `<details class="ipc-how"><summary>순위 산정 기준</summary><div class="ipc-how-body">
  <h4>수집 대상</h4><p>매일 오전 8시에 웹에서 최근 7일 전후의 기사·음원 차트·OTT 순위·SNS 화제·조회수를 검색해 11개 분야(K-POP 신인 보이그룹·걸그룹 · K-POP · 국내 캐릭터 · 해외·게임 캐릭터 · 애니메이션 · 영화 · 드라마 · 예능 · 유튜버 · SNS 크리에이터)에서 IP 330여 개를 수집합니다. 최근 3일 이내에 수집된 IP도 후보로 유지하며, 이번 갱신에 다시 수집되지 않으면 갱신마다 점수가 15%씩 감소합니다.</p>
  <h4>점수 (100점 만점)</h4><table class="ipc-how-t"><thead><tr><th>항목</th><th>뜻</th><th>신규 IP</th><th>전체 IP</th></tr></thead><tbody>
  <tr><td>상승 속도</td><td>최근 7일간의 화제 상승 속도 (급상승할수록 높음)</td><td>40%</td><td>25%</td></tr>
  <tr><td>화제 크기</td><td>현재 기사·차트·SNS에서의 언급 규모</td><td>25%</td><td>50%</td></tr>
  <tr><td>네이버 검색 추이</td><td>네이버 데이터랩 최근 7일 평균 ÷ 그 앞 7일 평균 (같으면 50점, 4배면 100점)</td><td>20%</td><td>15%</td></tr>
  <tr><td>유튜브 구독자 증가</td><td>공식 채널 하루 구독자 증가율 (하루 +5%면 100점)</td><td>15%</td><td>10%</td></tr></tbody></table>
  <p>상승 속도와 화제 크기는 검색 근거를 바탕으로 0~100점으로 산정하고, 네이버·유튜브는 실제 수치로 계산합니다. 수치가 확인되지 않은 항목은 제외하고 나머지 비중으로 계산합니다. 네이버 검색 추이는 순위 산정 후 상위 IP부터 확인해 점수에 반영합니다.</p>
  <h4>두 차트</h4><p><b>신규 IP</b>는 최근 2년 이내에 데뷔·공개했거나 최근 급상승한 IP만 모아 상승 속도에 비중을 둡니다. <b>전체 IP</b>는 신규·기존 IP를 모두 포함하고 현재 화제 크기에 비중을 둡니다. 차트별로 1~200위까지 표시합니다.</p>
  <h4>기간과 변동</h4><p>실시간은 최근 갱신 순위이며, 하루 전 갱신과 비교해 ▲▼를 표시합니다. 일간(24시간)·주간(7일)·월간(30일)·연간(365일)·기간 설정은 해당 기간 갱신의 평균 점수로 다시 산정하며, 수집되지 않은 갱신은 0점으로 계산합니다. 변동은 직전 동일 기간과 비교합니다. NEW는 비교 기간에 순위에 없던 IP입니다.</p>
</div></details>`;
async function loadChart() {
  const key = [ipc.chart, ipc.period, ipc.from, ipc.to].join('|'); ipc.key = key;
  if (ipc.period === 'range' && !(ipc.from && ipc.to)) { ipc.rows = []; if (page === 'chart') render(); return; }
  const [ch, run] = await Promise.all([SB.rpc('pt_ip_chart', {p_chart: ipc.chart, ...ipRange()}), SB.from('pt_ip_run').select(IP_RUN).order('at', {ascending: false}).limit(1)]);
  if (key !== ipc.key) return;
  if (ch.error) { ipc.err = '차트를 불러오지 못했습니다: ' + ch.error.message; ipc.rows = []; if (page === 'chart') render(); return; }
  const ids = ch.data.map(r => r.ip).filter(id => !ipc.ips[id]);
  for (let i = 0; i < ids.length; i += 100) { const { data } = await SB.from('pt_ip').select('*').in('id', ids.slice(i, i + 100)); (data || []).forEach(x => ipc.ips[x.id] = x); }
  if (key !== ipc.key) return;
  ipc.rows = ch.data; ipc.run = run.data?.[0] || null; ipc.err = '';
  if (page === 'chart') render();
  ipPoll();
}
// 갱신 중이면 3초마다 진행 상황, 아니면 1분마다 새 갱신이 끝났는지 — 끝나면 차트와 열린 상세를 다시 읽는다
function ipPoll() {
  clearTimeout(ipc.poll);
  const busy = ['wait', 'work'].includes(ipc.run?.status);
  ipc.poll = setTimeout(async () => {
    if (page !== 'chart') return;
    const { data } = await SB.from('pt_ip_run').select(IP_RUN).order('at', {ascending: false}).limit(1);
    const r = data?.[0], o = ipc.run;
    ipc.run = r || null;
    if (r && r.status === 'done' && (!o || r.id !== o.id || o.status !== 'done')) { ipc.ips = {}; await loadChart(); if (ipc.open && !$('#drawer').hidden) openIp(ipc.open, true); return; }
    const el = $('#ipc-prog'), rb = $('#ipc-refresh');
    if (el) el.outerHTML = ipProg();
    if (rb) rb.disabled = ['wait', 'work'].includes(r?.status);
    ipPoll();
  }, busy ? 3000 : 60000);
}
function ipProg() {
  const r = ipc.run;
  if (!r || !['wait', 'work'].includes(r.status)) return '<div id="ipc-prog" hidden></div>';
  if (r.status === 'wait' || !r.progress) return `<div id="ipc-prog" class="ipc-prog"><span class="bar indet"><i></i></span><small>순위 갱신 준비 중<span class="dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></small></div>`;
  return `<div id="ipc-prog" class="ipc-prog"><span class="row"><span class="bar"><i style="width:${r.progress}%"></i></span><b>${r.progress}%</b></span><small>순위 갱신 중 · ${esc(r.step || '')}<span class="dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></small></div>`;
}
// 이미지가 없으면 종류 색 바탕에 이름 첫 글자
const ipArt = (ip, cls = '') => { const s = imgSrc(ip.img_path); return `<span class="ipc-art k-${esc(ip.kind || 'other')} ${cls}">${s ? `<img src="${s}" alt="" loading="lazy">` : `<b>${esc([...String(ip.name || '?').trim()][0] || '?')}</b>`}</span>`; };
const ipKind = ip => `<span class="ipc-kind k-${esc(ip.kind || 'other')}">${esc(IPK[ip.kind] || '기타')}</span>`;
// 트렌드에 섞여 나온 작업 이야기는 보이지 않게 (봇 ipchart.TREND_META 와 같은 기준)
const ipTrend = s => /검색 도구|검색 한도|사용 한도|도구 사용|확인하지 못|검증하지 못|찾지 못했|web_search|web_fetch/.test(s || '') ? '' : (s || '');
function ipChg(r) {
  if (r.prev_pos == null) return r.has_prev ? '<span class="ipc-chg new">NEW</span>' : '<span class="ipc-chg">–</span>';
  const d = r.prev_pos - r.pos;
  return d > 0 ? `<span class="ipc-chg up" aria-label="${d}단계 상승">▲${d}</span>` : d < 0 ? `<span class="ipc-chg down" aria-label="${-d}단계 하락">▼${-d}</span>` : '<span class="ipc-chg">–</span>';
}
function chartView() {
  if (!ipc.rows) { setTimeout(loadChart); return '<div class="empty"><p>불러오는 중입니다<span class="dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></p></div>'; }
  const per = IPP.find(p => p[0] === ipc.period);
  // 종류를 고르면 그 종류 안에서 1위부터 다시 매기고, ▲▼도 그 종류 안의 이전 순위와 비교 (11-02 김현우)
  const vis = ipc.rows.filter(r => ipc.ips[r.ip] && !ipc.ips[r.ip].hidden && (ipc.kind === 'all' || ipc.ips[r.ip].kind === ipc.kind)).sort((x, y) => x.pos - y.pos);
  const prevIn = ipc.kind === 'all' ? null : Object.fromEntries(vis.filter(r => r.prev_pos != null).sort((x, y) => x.prev_pos - y.prev_pos).map((r, i) => [r.ip, i + 1]));
  const rows = prevIn ? vis.map((r, i) => ({...r, pos: i + 1, prev_pos: r.prev_pos == null ? null : prevIn[r.ip]})) : vis;
  const kinds = ['all', ...Object.keys(IPK).filter(k => k !== 'other' && ipc.rows.some(r => ipc.ips[r.ip]?.kind === k))];
  const basis = ipc.rows[0]?.basis, busy = ['wait', 'work'].includes(ipc.run?.status);
  const seg = (items, cur, attr) => items.map(([k, t]) => `<button type="button" class="${cur === k ? 'on' : ''}" aria-pressed="${cur === k}" data-${attr}="${k}">${t}</button>`).join('');
  // 1줄: 차트 고르기 · 기준 시각 · 지금 갱신 / 2줄: 기간 · 종류 / 순위 기준 / 표 머리 / 목록
  const bar = `<div class="ipc-bar">
      <div class="ipc-seg big" role="group" aria-label="차트">${seg([['new', '신규 IP'], ['all', '전체 IP']], ipc.chart, 'ipc-chart')}</div>
      <div class="ipc-meta"><span>${basis ? `<b>${ipKst(basis)}</b> 기준` : ''}${rows.length ? ` · ${rows.length}위까지` : ''}</span><button class="button" id="ipc-refresh" ${busy ? 'disabled' : ''}>${icon('clock')} 즉시 갱신</button></div>
    </div>
    <div class="ipc-filters">
      <div class="ipc-fl"><span class="ipc-lab">기간</span><div class="ipc-seg" role="group" aria-label="기간">${seg(IPP, ipc.period, 'ipc-period')}</div>${ipc.period === 'range' ? `<div class="ipc-range"><input type="date" id="ipc-from" value="${esc(ipc.from)}" aria-label="시작일"><span>~</span><input type="date" id="ipc-to" value="${esc(ipc.to)}" aria-label="종료일"><button class="button primary" id="ipc-range-go">보기</button></div>` : ''}</div>
      <div class="ipc-fl"><span class="ipc-lab">종류</span><div class="ipc-chips">${kinds.map(k => `<button type="button" class="ar-chip ${ipc.kind === k ? 'on' : ''}" aria-pressed="${ipc.kind === k}" data-ipc-kind="${k}">${k === 'all' ? '전체' : IPK[k]}</button>`).join('')}</div></div>
    </div>${IP_HOW}`;
  const thead = `<div class="ipc-thead" aria-hidden="true"><span>순위</span><span></span><span>IP</span><span>종류</span><span>소유사</span><span>데뷔·공개</span><span></span></div>`;
  const list = rows.length ? `${thead}<ol class="ipc-list">${rows.map(r => { const ip = ipc.ips[r.ip]; return `<li class="ipc-row" data-ip="${ip.id}" tabindex="0" role="button" aria-label="${r.pos}위 ${esc(ip.name)} 상세보기">
      <div class="ipc-rank"><b>${r.pos}</b>${ipChg(r)}</div>${ipArt(ip)}
      <div class="ipc-main"><div class="ipc-name"><b>${esc(ip.name)}</b>${ipc.chart === 'all' && ip.is_new ? '<span class="ipc-new">신규</span>' : ''}</div><p>${esc(ip.summary || '')}</p><small class="ipc-sub">${ipKind(ip)} ${esc([ip.owner, ip.since].filter(Boolean).join(' · '))}</small></div>
      <div class="ipc-c">${ipKind(ip)}</div><div class="ipc-c ipc-own" title="${esc(ip.owner || '')}">${esc(ip.owner || '—')}</div><div class="ipc-c ipc-since">${esc(ip.since || '—')}</div>
      <span class="ipc-more">상세보기</span></li>`; }).join('')}</ol>`
    : `<div class="empty"><p>${ipc.period === 'range' && !(ipc.from && ipc.to) ? '시작일과 종료일을 선택한 뒤 「보기」를 클릭해 주세요.' : ipc.rows.length ? '이 종류의 IP가 아직 없습니다.' : busy ? '첫 순위를 산정하고 있습니다. 완료되면 자동으로 표시됩니다.' : '이 기간에 집계된 순위가 없습니다. 순위는 하루 4회 갱신되며, 기록이 누적될수록 장기간 순위를 확인할 수 있습니다.'}</p></div>`;
  return `${ipc.err ? `<div class="notice">${esc(ipc.err)}</div>` : ''}${ipProg()}<section class="panel ipc">${bar}${list}${rows.length ? `<p class="ipc-foot">순위 옆 ▲▼는 ${esc(per[2])} 변동입니다. NEW는 비교 기간에 순위에 없던 IP입니다.</p>` : ''}</section>`;
}
function bindChart() {
  $$('[data-ipc-chart]').forEach(b => b.onclick = () => { ipc.chart = b.dataset.ipcChart; ipc.rows = null; render(); });
  $$('[data-ipc-period]').forEach(b => b.onclick = () => { ipc.period = b.dataset.ipcPeriod; if (ipc.period === 'range' && !ipc.to) { ipc.to = today(); ipc.from = new Date(Date.now() + 9 * 3600e3 - 6 * 864e5).toISOString().slice(0, 10); } ipc.rows = null; render(); });
  $('#ipc-range-go')?.addEventListener('click', () => { const f = $('#ipc-from').value, t = $('#ipc-to').value; if (!f || !t || f > t) return toast('시작일은 종료일보다 이전 날짜로 선택해 주세요.'); ipc.from = f; ipc.to = t; ipc.rows = null; render(); });
  $$('[data-ipc-kind]').forEach(b => b.onclick = () => { ipc.kind = b.dataset.ipcKind; render(); });
  $$('[data-ip]').forEach(b => { b.onclick = () => openIp(b.dataset.ip); b.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openIp(b.dataset.ip); } }; });
  $('#ipc-refresh')?.addEventListener('click', async () => {
    const prev = ipc.run; ipc.run = {status: 'wait'}; render();
    const { error } = await SB.from('pt_ip_run').insert({status: 'wait'});
    if (error) { ipc.run = prev; render(); return toast('갱신을 요청하지 못했습니다: ' + error.message); }
    const { data } = await SB.from('pt_ip_run').select(IP_RUN).order('at', {ascending: false}).limit(1); ipc.run = data?.[0] || ipc.run;
    toast('순위 갱신을 요청했습니다. 궁니르 봇이 바로 시작합니다.'); ipPoll();
  });
}
/* ---------- 소싱 (11-01 · Phase 2 · sql/018 · 봇 sourcing.py) — IP 스코어 · 조합 · 워닝·감시. 공개 범위는 IP 차트와 같음 ---------- */
const SRC_TABS = [['chart', 'IP 차트'], ['ips', 'IP 스코어'], ['combos', '조합'], ['warn', '워닝·감시'], ['sources', '수집 소스']];
const CAL_KO = {comeback: '컴백', album: '앨범', anime: '애니 방영', movie: '영화 개봉', anniversary: '기념일', license_expiry: '라이선스 만료', enlist: '입대', discharge: '제대', renewal: '재계약', reunion: '완전체 복귀', sequel: '후속작', other: '기타'};
const CERT_KO = {confirmed: '확정', planned: '예정', rumor: '루머'};
const ALIAS_KO = {official: '공식', en: '영문', nickname: '애칭', slang: '팬덤 은어', typo: '오타', member: '멤버'};
const BR_KO = {execute: '실행 가능', monitor: '모니터링', dropped: '제외'};
const src = {tab: 'chart', d: null, open: '', poll: null, cf: 'all'};
async function loadSrc() {
  const q = (t, s, f = x => x) => f(SB.from(t).select(s));
  const r = await Promise.all([
    q('pt_ip_profile', '*'), q('pt_calendar_event', '*', x => x.eq('hidden', false).gte('starts_on', new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10)).order('starts_on')),
    q('pt_alias', '*', x => x.order('id')), q('pt_combination', '*', x => x.order('combo_score', {ascending: false, nullsFirst: false}).limit(500)),
    q('pt_combo_run', 'id,ip_entity_id,status,progress,step,note,at', x => x.order('at', {ascending: false}).limit(20)),
    q('pt_warning', '*', x => x.order('created_at', {ascending: false}).limit(100)), q('pt_watch', '*', x => x.order('created_at', {ascending: false}).limit(300)),
    q('pt_score_event', '*', x => x.order('occurred_at', {ascending: false}).limit(500)), q('pt_sourcing_config', '*'),
    q('pt_source', '*', x => x.order('id')), q('pt_signal', '*', x => x.in('source', ['community', 'x']).order('captured_at', {ascending: false}).limit(500)),
    q('pt_collect_log', '*', x => x.order('at', {ascending: false}).limit(300)), q('pt_collab_news', '*', x => x.order('happened_on', {ascending: false, nullsFirst: false}).limit(500))]);
  const bad = r.find(x => x.error);
  if (bad) { src.d = {err: bad.error.message}; return; }
  const [pf, cal, al, cb, runs, warn, watch, sev, conf, sources, sig, clog, collab] = r.map(x => x.data || []);
  src.d = {pf: Object.fromEntries(pf.map(p => [p.entity_id, p])), cal, al, cb, runs, warn, watch, sev, conf: conf[0] || {}, sources, sig, clog, collab};
}
const srcBadge = n => n ? ` <span class="nav-count">${n}</span>` : '';
function srcView() {
  const tabs = `<div class="ipc-seg big src-tabs" role="tablist" aria-label="소싱">${SRC_TABS.map(([k, t]) => `<button type="button" role="tab" class="${src.tab === k ? 'on' : ''}" aria-selected="${src.tab === k}" data-src-tab="${k}">${t}${k === 'warn' && src.d?.warn ? srcBadge(src.d.warn.filter(w => !w.acknowledged_at).length) : ''}</button>`).join('')}</div>`;
  if (src.tab === 'chart') return tabs + chartView();
  if (!src.d) { setTimeout(async () => { await loadSrc(); if (page === 'chart') render(); }); return tabs + '<div class="empty"><p>불러오는 중입니다<span class="dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></p></div>'; }
  if (src.d.err) return tabs + `<div class="notice">소싱 정보를 불러오지 못했습니다: ${esc(src.d.err)}</div>`;
  return tabs + (src.tab === 'ips' ? srcIps() : src.tab === 'combos' ? srcCombos() : src.tab === 'sources' ? srcSources() : srcWarn());
}
const srcScore = v => v == null ? '<span class="src-sc none">—</span>' : `<span class="src-sc ${v >= 70 ? 'hi' : v >= 40 ? 'mid' : 'lo'}">${v}</span>`;
const srcName = id => byId(id)?.name || '';
const srcNext = id => src.d.cal.find(e => e.entity_id === id && e.starts_on >= today());
const srcEv = e => `<time>${esc(dotDate(e.starts_on))}</time> ${esc(CAL_KO[e.type] || e.type)}${e.title ? ' · ' + esc(e.title) : ''} <span class="pill ${e.certainty === 'confirmed' ? 'good' : e.certainty === 'rumor' ? 'muted' : ''}">${CERT_KO[e.certainty]}</span>`;
function srcRun(r) {
  if (!r || !['wait', 'work'].includes(r.status)) return '';
  return r.status === 'wait' || !r.progress ? `<div class="ipc-prog" data-src-run="${r.id}"><span class="bar indet"><i></i></span><small>${esc(srcName(r.ip_entity_id))} 조합 시뮬레이션 준비 중<span class="dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></small></div>`
    : `<div class="ipc-prog" data-src-run="${r.id}"><span class="row"><span class="bar"><i style="width:${r.progress}%"></i></span><b>${r.progress}%</b></span><small>${esc(srcName(r.ip_entity_id))} 조합 시뮬레이션 · ${esc(r.step || '')}<span class="dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></small></div>`;
}
function srcIps() {
  const d = src.d, ids = Object.keys(d.pf).filter(id => byId(id)).sort((a, b) => (d.pf[b].ip_score ?? -1) - (d.pf[a].ip_score ?? -1));
  const pend = rel.review.filter(r => r.kind === 'ip_candidate').length;
  const list = ids.length ? `<div class="table-wrap"><table class="et src-t"><thead><tr><th>IP</th><th>IP 스코어</th><th>타이밍</th><th>팬덤 화력</th><th>권리구조</th><th>관계</th><th>다가오는 일정</th><th></th></tr></thead><tbody>${ids.map(id => {
    const p = d.pf[id], P = Object.fromEntries((p.ip_score_parts || []).map(x => [x.key, x])), nx = srcNext(id);
    return `<tr class="clickable${src.open === id ? ' on' : ''}" data-src-open="${id}" tabindex="0"><td><b>${esc(srcName(id))}</b>${byId(id)?.owned_ip ? ' <span class="pill good">당사 IP</span>' : ''}<small>${esc(IPK[p.ip_kind] || '')}${p.holder_entity_id ? ' · ' + esc(srcName(p.holder_entity_id)) : ''}</small></td><td>${srcScore(p.ip_score)}</td>${['timing', 'fandom', 'rights', 'relation'].map(k => `<td>${srcScore(P[k]?.score)}<small>${esc(P[k]?.basis || '')}</small></td>`).join('')}<td>${nx ? srcEv(nx) : '<small>—</small>'}</td><td><span class="ipc-more">${src.open === id ? '접기' : '자세히'}</span></td></tr>${src.open === id ? `<tr class="src-open"><td colspan="8">${srcDetail(id)}</td></tr>` : ''}`;
  }).join('')}</tbody></table></div>` : `<div class="empty"><p>연결된 IP가 없습니다. IP 차트 상위 IP가 「확인 대기」에 등록되면 엔티티로 등록해 주세요.</p></div>`;
  return `${pend ? `<div class="notice">IP 차트에 새로 진입한 IP ${pend}개가 확인 대기에 있습니다. <a href="${APP === 'gungnir' ? YGG_URL : ''}#review"${APP === 'gungnir' ? ' target="_blank" rel="noopener"' : ''}>확인 대기로 이동</a></div>` : ''}<section class="panel"><div class="panel-head"><div class="panel-title">IP 스코어 <small>${ids.length}개</small></div><button class="button primary" type="button" id="ip-add">${icon('plus')}IP 직접 추가</button></div>
    <details class="ipc-how"><summary>IP 스코어 산정 기준</summary><div class="ipc-how-body"><p>타이밍 ${d.conf.weights?.timing ?? 30} · 팬덤 화력 ${d.conf.weights?.fandom ?? 30} · 권리구조 단순성 ${d.conf.weights?.rights ?? 15} · 관계 점수 ${d.conf.weights?.relation ?? 25} 비중으로 계산하고, 값이 없는 항목은 제외하고 나머지 비중으로 계산합니다. 당사 귀속 IP는 100점입니다.</p>
    <p><b>타이밍</b>: ${d.conf.timing_days ?? 180}일 이내 일정 — 30~120일 남은 확정 일정 100점, 30일 이내 60점, 120일 이후 80점, 지난 1주일 이내 70점(예정 일정은 ×0.85). 루머는 반영하지 않습니다. <b>팬덤 화력</b>: 최근 3일간 IP 차트 점수입니다. <b>권리구조 단순성</b>: 담당자 또는 궁니르가 확인해 입력한 값만 사용합니다. <b>관계 점수</b>: 권리사·라이선싱 대행사와의 관계 점수입니다.</p><p>점수가 변경될 때마다 사유와 함께 기록됩니다.</p></div></details>${list}</section>`;
}
function srcDetail(id) {
  const d = src.d, p = d.pf[id], evs = d.cal.filter(e => e.entity_id === id), als = d.al.filter(a => a.entity_id === id), sev = d.sev.filter(s => s.target_type === 'ip' && s.target_id === id).slice(0, 8);
  const run = d.runs.find(r => r.ip_entity_id === id && ['wait', 'work'].includes(r.status)), nCb = d.cb.filter(c => c.ip_entity_id === id).length;
  return `<div class="src-detail">
    <section><h4>다가오는 일정 <small>${evs.length}건</small></h4>${evs.length ? `<ul class="src-ul">${evs.map(e => `<li>${srcEv(e)} <a href="${esc(e.source_url)}" target="_blank" rel="noopener">출처</a> <button class="text-btn" type="button" data-cal-hide="${e.id}">잘못된 일정 숨기기</button></li>`).join('')}</ul>` : `<p class="ipc-muted">${p.calendar_checked_at ? '찾은 일정이 없습니다.' : '하루 1회 웹에서 일정을 검색합니다. 곧 업데이트됩니다.'}</p>`}</section>
    <section><h4>별칭 <small>${als.length}개</small></h4><div class="ipc-chips">${als.map(a => `<span class="ar-chip">${esc(a.text)} <small>${ALIAS_KO[a.kind] || ''}</small><button type="button" class="src-x" data-alias-del="${a.id}" aria-label="${esc(a.text)} 삭제">✕</button></span>`).join('') || '<span class="ipc-muted">없음</span>'}</div>
      <div class="src-row"><input id="alias-in" placeholder="별칭 입력" aria-label="별칭"><select id="alias-kind" class="table-select" aria-label="종류">${Object.entries(ALIAS_KO).map(([k, t]) => `<option value="${k}" ${k === 'nickname' ? 'selected' : ''}>${t}</option>`).join('')}</select><button class="button" type="button" data-alias-add="${id}">추가</button></div></section>
    ${srcFandom(id)}
    ${srcCollab(id)}
    <section><h4>권리구조 단순성</h4><p class="ipc-muted">권리 보유사가 한 곳이고 승인 절차가 빠를수록 높게 입력합니다(0~100). 확인된 값만 입력해 주세요.</p><div class="src-row"><input id="rights-in" type="number" min="0" max="100" value="${p.rights_simplicity ?? ''}" placeholder="미입력" aria-label="권리구조 단순성"><input id="rights-src" value="${esc(p.rights_source || '')}" placeholder="근거 (예: 궁니르 검토, 권리사 회신)" aria-label="근거"><button class="button" type="button" data-rights="${id}">저장</button></div></section>
    <section><h4>스코어 기록</h4>${sev.length ? `<ul class="src-ul">${sev.map(s => `<li><time>${esc(ymd(s.occurred_at))}</time> ${s.before ?? '—'} → <b>${s.after}</b> <small>${esc(s.reason)}</small></li>`).join('')}</ul>` : '<p class="ipc-muted">아직 기록이 없습니다.</p>'}</section>
    <section><h4>조합 시뮬레이션 ${nCb ? `<small>지금까지 ${nCb}개</small>` : ''}</h4>${run ? srcRun(run) : `<div class="src-row"><input id="combo-ins" placeholder="요청 사항 (선택 · 예: 편의점 채널 위주, 2027 봄)" aria-label="요청 사항"><button class="button primary" type="button" data-combo-run="${id}">조합 생성</button></div>`}${nCb ? `<p><button class="text-btn" type="button" data-src-tab="combos" data-cf="${id}">이 IP 조합 보기 ↗</button></p>` : ''}</section>
  </div>`;
}
function srcCombos() {
  const d = src.d, f = src.cf, arr = d.cb.filter(c => (f === 'all' || c.ip_entity_id === f) && byId(c.ip_entity_id));
  const ipIds = [...new Set(d.cb.map(c => c.ip_entity_id))].filter(byId);
  const runs = d.runs.filter(r => ['wait', 'work'].includes(r.status)).map(srcRun).join('');
  const fails = d.runs.filter(r => r.status === 'fail').slice(0, 1).map(r => `<div class="notice">${esc(srcName(r.ip_entity_id))} 조합 시뮬레이션을 하지 못했습니다${r.note ? ': ' + esc(r.note) : ''}. 다시 시도해 주세요.</div>`).join('');
  const group = b => arr.filter(c => c.branch === b);
  const card = c => { const sp = c.score_parts || {}, need = sp.need_path || [], brand = c.brand_entity_id ? srcName(c.brand_entity_id) : c.brand_name;
    return `<li class="src-cb ${c.branch}"><div class="src-cb-head">${srcScore(c.combo_score)}<div><b>${esc(c.title || brand)}</b><small>${esc(srcName(c.ip_entity_id))} × ${esc(brand || '브랜드 미정')}${c.brand_entity_id ? '' : c.brand_name ? ' <span class="pill muted">미등록 브랜드</span>' : ''}</small></div><span class="pill ${c.branch === 'execute' ? 'good' : c.branch === 'dropped' ? 'muted' : ''}">${BR_KO[c.branch]}</span></div>
      <dl class="src-dl"><dt>포맷</dt><dd>${esc(c.format || '—')}</dd><dt>캐릭터</dt><dd>${esc(c.character || '—')}</dd><dt>플랫폼</dt><dd>${esc(c.platform || '—')}</dd><dt>시즌</dt><dd>${esc(c.season || '—')}</dd></dl>
      <p class="src-parts">IP 스코어 ${sp.ip_score ?? '미계산'} · 브랜드 적합도 ${sp.brand_fit ?? '—'} · 포맷 실행성 ${sp.format_feasibility ?? '—'} · 컨택 경로 ${sp.path_factor === 1 ? '양측 확보' : sp.path_factor ? '한쪽만' : '없음'}</p>
      ${(c.contact_path || []).length ? `<p class="src-path">${(c.contact_path || []).map(x => `<span class="ar-chip">${esc(x.name)} · ${esc(x.via)}</span>`).join('')}</p>` : ''}
      ${need.length ? `<p class="src-need">확보할 연락 경로: ${need.map(esc).join(' · ')}</p>` : ''}
      ${c.rationale ? `<p>${esc(c.rationale)}</p>` : ''}
      ${(sp.blockers || []).length ? `<p class="src-need">제약 사항: ${sp.blockers.map(esc).join(' · ')}</p>` : ''}
      ${(c.conditions || []).length && c.branch !== 'execute' ? `<p class="ipc-muted">실행 가능 조건: ${c.conditions.map(esc).join(' · ')}</p>` : ''}
      ${(c.sources || []).length ? `<details><summary>근거 ${c.sources.length}개</summary><ul class="src-ul">${c.sources.map(s => `<li>${esc(s.claim || '')} <a href="${esc(s.url)}" target="_blank" rel="noopener">출처</a></li>`).join('')}</ul></details>` : ''}
      <div class="rq-acts">${c.branch === 'dropped' ? `<button class="button" type="button" data-cb-branch="${c.id}|monitor">모니터링 재개</button>` : `<button class="button" type="button" data-cb-branch="${c.id}|dropped">이 조합 제외</button>`}</div></li>`; };
  const sec = (b, t, note) => { const g = group(b); return g.length ? `<h4 class="rq-kind">${t} <small>${g.length}개</small>${note ? ` · <small>${note}</small>` : ''}</h4><ul class="src-cbs">${g.map(card).join('')}</ul>` : ''; };
  return `${runs}${fails}<section class="panel"><div class="panel-head"><div class="panel-title">조합 <small>${arr.length}개</small></div>${ipIds.length > 1 ? `<select class="table-select" id="cf-sel" aria-label="IP">${[['all', '모든 IP'], ...ipIds.map(i => [i, srcName(i)])].map(([k, t]) => `<option value="${k}" ${f === k ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>` : ''}</div>
    <details class="ipc-how"><summary>조합 스코어 기준</summary><div class="ipc-how-body"><p>IP 스코어 × 브랜드 적합도 × 포맷 실행성을 곱해 100점 기준으로 맞추고(세제곱근), 컨택 경로를 곱합니다 — IP 측(권리사·대행사)과 브랜드 측 모두 등록된 담당자·관계 담당자·관계 단계가 있으면 그대로, 한쪽만 있으면 0.6배, <b>없으면 0점</b>입니다. ${d.conf.execute_threshold ?? 60}점 이상이고 제약 사항이 없으면 「실행 가능」, 나머지는 「모니터링」으로 분류하며 조건이 충족되면 다시 계산합니다. ${d.conf.warn_threshold ?? 70}점을 넘으면 워닝을 표시합니다. 채택 여부는 담당자가 결정합니다.</p></div></details>
    ${arr.length ? sec('execute', '실행 가능') + sec('monitor', '모니터링', '조건 충족 시 재계산') + sec('dropped', '제외') : '<div class="empty"><p>생성된 조합이 없습니다. 「IP 스코어」에서 IP를 선택하고 「조합 생성」을 클릭해 주세요.</p></div>'}</section>`;
}
function srcWarn() {
  const d = src.d, cb = id => d.cb.find(c => c.id === id), open = d.watch.filter(w => w.status === 'watching'), met = d.watch.filter(w => w.status === 'met').slice(0, 20);
  const wLabel = w => { const c = cb(Number(w.target_ref)); return c ? `${esc(c.title || '')} · ${esc(srcName(c.ip_entity_id))}` : ''; };
  return `<section class="panel"><div class="panel-head"><div class="panel-title">워닝 <small>${d.warn.length}건</small></div></div>${d.warn.length ? `<ul class="rq-list">${d.warn.map(w => `<li class="rq-item${w.acknowledged_at ? ' done' : ''}"><div><span class="pill ${w.kind === 'threshold' ? 'good' : ''}">${w.kind === 'threshold' ? '점수 도달' : w.kind === 'watch' ? '감시 조건 충족' : '부활 후보'}</span> <b>${esc(w.message)}</b>${(w.contact_path || []).length ? `<small>연락 경로: ${w.contact_path.map(x => esc(x.name + ' · ' + x.via)).join(' / ')}</small>` : ''}<time>${esc(ymd(w.created_at))}</time></div><span class="rq-acts"><button class="button" type="button" data-src-tab="combos" data-cf="${cb(w.combination_id)?.ip_entity_id || 'all'}">조합 보기</button>${w.acknowledged_at ? '<span class="pill muted">확인함</span>' : `<button class="button primary" type="button" data-warn-ack="${w.id}">확인</button>`}</span></li>`).join('')}</ul>` : '<div class="empty"><p>워닝이 없습니다. 조합 점수가 기준을 넘거나 감시 조건이 충족되면 이곳에 표시됩니다. 같은 조합은 7일 이내에 다시 알리지 않습니다.</p></div>'}</section>
    <section class="panel" style="margin-top:16px"><div class="panel-head"><div class="panel-title">감시 중 <small>${open.length}건</small></div></div>${open.length ? `<ul class="rq-list">${open.map(w => `<li class="rq-item"><div><b>${esc(w.label)}</b><small>${wLabel(w)}</small>${w.expires_on ? `<time>${esc(dotDate(w.expires_on))}까지</time>` : ''}</div></li>`).join('')}</ul>` : '<div class="empty"><p>감시 중인 조건이 없습니다.</p></div>'}
    ${met.length ? `<h4 class="rq-kind">충족된 조건</h4><ul class="rq-list">${met.map(w => `<li class="rq-item done"><div><b>${esc(w.label)}</b><small>${wLabel(w)} · ${esc(w.met_note || '')}</small><time>${esc(ymd(w.met_at))}</time></div></li>`).join('')}</ul>` : ''}</section>`;
}
function srcPoll() {
  clearTimeout(src.poll);
  if (!src.d?.runs?.some(r => ['wait', 'work'].includes(r.status))) return;
  src.poll = setTimeout(async () => {
    if (page !== 'chart' || src.tab === 'chart') return;
    const { data } = await SB.from('pt_combo_run').select('id,ip_entity_id,status,progress,step,note,at').order('at', {ascending: false}).limit(20);
    const was = src.d.runs.filter(r => ['wait', 'work'].includes(r.status)).map(r => r.id);
    src.d.runs = data || src.d.runs;
    const fin = src.d.runs.find(r => was.includes(r.id) && ['done', 'fail'].includes(r.status));
    if (fin) { await loadSrc(); render(); if (fin.status === 'done') toast(`${srcName(fin.ip_entity_id)} ${fin.step}를 생성했습니다.`); return; }
    $$('[data-src-run]').forEach(el => { const r = src.d.runs.find(x => String(x.id) === el.dataset.srcRun); if (r) el.outerHTML = srcRun(r); });
    srcPoll();
  }, 3000);
}
// IP 직접 추가 (11-02 홍석진 대표님 「제안하지 않은 IP 를 내가 넣어서 스코어 확인 · 내가 제안한 IP 로 진행」) — sql/028 pt_ip_add
function ipAddModal() {
  modal(`<form id="ipadd-form"><h2>IP 직접 추가</h2><p>IP 차트에 없는 IP도 입력하면 궁니르 봇이 일정을 검색해 IP 스코어를 산정하고, 조합 시뮬레이션도 바로 시작합니다. 이미 등록된 IP이면 기존 IP에 연결합니다.</p>
    <label>IP 이름<input id="ipa-name" required maxlength="100" placeholder="예: 리락쿠마"></label>
    <label>영문 이름 (선택)<input id="ipa-en" maxlength="100" placeholder="예: Rilakkuma"></label>
    <label>종류<select id="ipa-kind">${Object.entries(IPK).map(([k, t]) => `<option value="${k}" ${k === 'character' ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
    <label>권리사·소유사 (선택)<select id="ipa-holder"><option value="">선택 안 함</option>${companyOptions('')}</select></label>
    <label class="check"><input type="checkbox" id="ipa-combo" checked> 조합 시뮬레이션도 바로 시작</label>
    <label>조합 요청 사항 (선택)<input id="ipa-ins" maxlength="500" placeholder="예: 보이그룹 아티스트 콜라보, 2028 팝업 위주"></label>
    <div id="ipa-error" style="color:#ba775e;margin-top:8px;font-size:12px" role="alert"></div>
    <div class="modal-actions"><button class="button" type="button" data-cancel>취소</button><button class="button primary" type="submit">추가하고 스코어 계산</button></div></form>`);
  $('#ipadd-form').onsubmit = async ev => {
    ev.preventDefault(); const btn = ev.submitter; if (btn) btn.disabled = true;
    const name = $('#ipa-name').value.trim();
    const { data, error } = await SB.rpc('pt_ip_add', {p_name: name, p_en: $('#ipa-en').value.trim(), p_kind: $('#ipa-kind').value,
      p_holder: $('#ipa-holder').value || null, p_combo: $('#ipa-combo').checked, p_instruction: $('#ipa-ins').value.trim()});
    if (error) { if (btn) btn.disabled = false; $('#ipa-error').textContent = '추가하지 못했습니다: ' + error.message; return; }
    $('#modal').dataset.dirty = ''; $('#modal').close();
    await load(); src.d = null; src.open = data; src.tab = 'ips'; render();
    toast(`${name}을(를) 추가했습니다. 궁니르 봇이 몇 분 이내에 일정을 검색하고 IP 스코어를 산정합니다.`);
  };
}
function bindSrc() {
  $$('[data-src-tab]').forEach(b => b.onclick = () => { src.tab = b.dataset.srcTab; if (b.dataset.cf) src.cf = b.dataset.cf; render(); });
  if (src.tab === 'chart') return bindChart();
  if (src.tab === 'sources') bindSources();
  srcPoll();
  $$('[data-src-open]').forEach(b => { const go = () => { src.open = src.open === b.dataset.srcOpen ? '' : b.dataset.srcOpen; render(); }; b.onclick = go; b.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); go(); } }; });
  $('#cf-sel')?.addEventListener('change', e => { src.cf = e.target.value; render(); });
  const redo = async msg => { await loadSrc(); render(); if (msg) toast(msg); };
  $$('[data-cal-hide]').forEach(b => b.onclick = async () => {
    const id = Number(b.dataset.calHide); b.disabled = true;
    const { error } = await SB.from('pt_calendar_event').update({hidden: true}).eq('id', id);
    if (error) { b.disabled = false; return toast('숨기지 못했습니다: ' + error.message); }
    await redo(); toast('일정을 숨겼습니다. 다음 스코어 계산부터 제외됩니다.', {fn: async () => { await SB.from('pt_calendar_event').update({hidden: false}).eq('id', id); await redo('실행을 취소했습니다.'); }});
  });
  $$('[data-alias-add]').forEach(b => b.onclick = async () => {
    const t = $('#alias-in').value.trim(); if (!t) return toast('별칭을 입력해 주세요.');
    b.disabled = true;
    const { error } = await SB.from('pt_alias').insert({entity_id: b.dataset.aliasAdd, text: t, kind: $('#alias-kind').value});
    if (error) { b.disabled = false; return toast(/duplicate|23505/.test(error.message) ? '이미 등록된 별칭입니다.' : '추가하지 못했습니다: ' + error.message); }
    redo('별칭을 추가했습니다.');
  });
  $$('[data-alias-del]').forEach(b => b.onclick = async () => {
    const a = src.d.al.find(x => String(x.id) === b.dataset.aliasDel); if (!a) return;
    const { error } = await SB.from('pt_alias').delete().eq('id', a.id);
    if (error) return toast('삭제하지 못했습니다: ' + error.message);
    await redo(); toast(`「${a.text}」 별칭을 삭제했습니다.`, {fn: async () => { const r = await SB.from('pt_alias').insert({entity_id: a.entity_id, text: a.text, kind: a.kind, member_of: a.member_of, source_url: a.source_url}); if (r.error) throw r.error; await redo('실행을 취소했습니다.'); }});
  });
  $$('[data-rights]').forEach(b => b.onclick = async () => {
    const v = $('#rights-in').value.trim(), n = v === '' ? null : Number(v);
    if (n != null && !(n >= 0 && n <= 100)) return toast('0~100 사이로 입력해 주세요.');
    b.disabled = true;
    const { error } = await SB.rpc('pt_ip_rights', {p_entity: b.dataset.rights, p_value: n, p_source: $('#rights-src').value.trim()});
    if (error) { b.disabled = false; return toast('저장하지 못했습니다: ' + error.message); }
    redo(n == null ? '미입력으로 저장했습니다.' : '저장했습니다. 5분 이내에 스코어에 반영됩니다.');
  });
  $('#ip-add')?.addEventListener('click', ipAddModal);
  $$('[data-combo-run]').forEach(b => b.onclick = async () => {
    b.disabled = true;
    const { error } = await SB.from('pt_combo_run').insert({ip_entity_id: b.dataset.comboRun, instruction: $('#combo-ins')?.value.trim() || '', status: 'wait'});
    if (error) { b.disabled = false; return toast('요청하지 못했습니다: ' + error.message); }
    await redo('조합 시뮬레이션을 요청했습니다. 궁니르 봇이 곧 시작합니다.');
  });
  $$('[data-cb-branch]').forEach(b => b.onclick = async () => {
    const [id, br] = b.dataset.cbBranch.split('|'); b.disabled = true;
    const { error } = await SB.rpc('pt_combo_branch', {p_id: Number(id), p_branch: br});
    if (error) { b.disabled = false; return toast('처리하지 못했습니다: ' + error.message); }
    await redo(); toast(br === 'dropped' ? '조합을 제외했습니다. 모니터링도 중단됩니다.' : '모니터링을 재개합니다.', {fn: async () => { const r = await SB.rpc('pt_combo_branch', {p_id: Number(id), p_branch: br === 'dropped' ? 'monitor' : 'dropped'}); if (r.error) throw r.error; await redo('실행을 취소했습니다.'); }});
  });
  $$('[data-warn-ack]').forEach(b => b.onclick = async () => {
    b.disabled = true;
    const { error } = await SB.rpc('pt_warning_ack', {p_id: Number(b.dataset.warnAck)});
    if (error) { b.disabled = false; return toast('처리하지 못했습니다: ' + error.message); }
    redo('확인했습니다.');
  });
}
/* 팬덤 수집 (11-01 · Phase 4 · sql/020) — 수집 소스 목록(자동 점검 결과) · IP 별 팬덤 반응 */
const CHK = [['robots', 'robots.txt'], ['login', '로그인'], ['terms', '약관'], ['rate', '빈도']];
const srcSrcName = id => src.d.sources.find(x => x.id === id)?.name || '';
function srcCollab(id) {
  const cs = src.d.collab.filter(c => c.entity_id === id).slice(0, 8);
  return `<section><h4>최근 다른 콜라보 <small>${cs.length}건</small></h4>${cs.length ? `<ul class="src-ul">${cs.map(c => `<li><time>${esc(c.happened_on ? dotDate(c.happened_on) : '날짜 미상')}</time> ${c.partner_entity_id && byId(c.partner_entity_id) ? `<button class="ref" type="button" data-open="${esc(c.partner_entity_id)}">${esc(c.partner)}</button>` : `<b>${esc(c.partner)}</b>`}${c.title ? ' · ' + esc(c.title) : ''} <a href="${esc(c.url)}" target="_blank" rel="noopener">출처</a></li>`).join('')}</ul>` : `<p class="ipc-muted">${src.d.pf[id]?.collab_checked_at ? '최근 12개월 이내에 확인된 다른 콜라보가 없습니다.' : '주 1회 기사·공식 발표에서 검색합니다. 곧 업데이트됩니다.'}</p>`}</section>`;
}
function srcFandom(id) {
  const d = src.d, latest = {};
  d.sig.filter(x => x.entity_id === id && x.metric === 'mentions').forEach(x => { if (!latest[x.source_id]) latest[x.source_id] = x; });
  const temp = sid => d.sig.find(x => x.entity_id === id && x.metric === 'temperature' && x.source_id === sid)?.value;
  const qs = d.clog.find(l => l.kind === 'fandom' && (l.entity_ids || []).includes(id) && (l.queries || []).length)?.queries || [];
  const rows = Object.values(latest);
  return `<section><h4>팬덤 반응 <small>커뮤니티·X · 최근 수집</small></h4>${rows.length ? `<ul class="src-ul">${rows.map(x => { const t = temp(x.source_id);
      return `<li><time>${esc(ymd(x.captured_at))}</time> <b>${esc(srcSrcName(x.source_id) || x.source)}</b> 언급 ${Number(x.value) || 0}${t != null ? ` · 온도 <span class="pill ${t > 0 ? 'good' : t < 0 ? 'warn' : 'muted'}">${t > 0 ? '+' : ''}${t}</span>` : ''} <a href="${esc(x.source_url)}" target="_blank" rel="noopener">출처</a>${x.text_summary ? `<small>${esc(x.text_summary)}</small>` : ''}</li>`; }).join('')}</ul>`
    : `<p class="ipc-muted">${d.sources.some(x => x.enabled) ? '하루 1회 활성화된 수집 소스에서 반응을 수집합니다. 곧 업데이트됩니다.' : '활성화된 수집 소스가 없습니다. 「수집 소스」에서 점검 결과를 확인해 주세요.'}</p>`}
    ${qs.length ? `<p class="ipc-muted">검색어(별칭 포함): ${qs.map(q => `<span class="ar-chip">${esc(q)}</span>`).join(' ')}</p>` : ''}</section>`;
}
const chkPill = c => !c ? '<span class="pill muted">—</span>' : c.ok ? '<span class="pill good">통과</span>' : '<span class="pill warn">미통과</span>';
function srcSources() {
  const list = src.d.sources, open = src.srcOpen;
  const st = x => x.check_status === 'pending' || x.check_status === 'checking' ? `<span class="ipc-prog"><span class="bar indet"><i></i></span><small>자동 점검 ${x.check_status === 'checking' ? '진행 중' : '대기 중'}<span class="dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></small></span>`
    : x.enabled ? `<span class="pill good">수집 중</span>${x.method === 'search' ? ' <small>검색 결과 집계</small>' : ''}` : x.check_status === 'fail' ? '<span class="pill warn">수집 안 함</span>' : '<span class="pill muted">비활성</span>';
  const detail = x => { const r = x.check_result || {};
    return `<tr class="src-open"><td colspan="7"><div class="src-detail">${CHK.map(([k, t]) => `<section><h4>${t} ${chkPill(r[k])}</h4><p class="ipc-muted">${esc(r[k]?.detail || '아직 점검하지 않았습니다.')}</p>${k === 'terms' && r.terms?.quote ? `<blockquote class="src-quote">${esc(r.terms.quote)}</blockquote>` : ''}${k === 'terms' && safeUrl(r.terms?.url) ? `<a href="${esc(r.terms.url)}" target="_blank" rel="noopener">약관 보기</a>` : ''}</section>`).join('')}
      <section><h4>조치</h4>${x.check_status === 'fail' && x.alternative ? `<p class="ipc-muted">대체안: ${esc(x.alternative)}</p>` : ''}<div class="src-row">${x.check_status === 'fail' && x.method === 'crawl' ? `<button class="button primary" type="button" data-srcsrc="${x.id}|use_search">검색 결과 집계로 수집</button>` : ''}${x.enabled ? `<button class="button" type="button" data-srcsrc="${x.id}|off">수집 중지</button>` : x.check_status === 'pass' || (x.method !== 'crawl' && x.alt_by) ? `<button class="button" type="button" data-srcsrc="${x.id}|on">수집 시작</button>` : ''}${x.method === 'aside' ? '' : `<button class="button" type="button" data-srcsrc="${x.id}|recheck">다시 점검</button>`}</div></section></div></td></tr>`; };
  return `<div class="notice">소스를 추가하면 robots.txt·로그인·이용약관·수집 빈도를 자동으로 점검하고, 통과한 소스만 수집합니다. 통과하지 못한 소스는 대체안을 선택하면 검색 결과만 집계합니다. 인스타그램·틱톡은 로그인된 계정으로 IP별 하루 1회 열람만 합니다. 작성자·계정 정보는 저장하지 않습니다.</div>
  <section class="panel"><div class="panel-head"><div class="panel-title">수집 소스 <small>${list.length}곳</small></div></div><div class="table-wrap"><table class="src-t"><thead><tr><th>이름</th><th>방식</th><th>점검일</th><th>점검 결과</th><th>수집 범위</th><th>빈도</th><th>상태</th></tr></thead><tbody>
  ${list.map(x => `<tr class="${open === x.id ? 'on' : ''}" data-srcsrc-open="${x.id}" tabindex="0" style="cursor:pointer"><td><b>${esc(x.name)}</b><small>${esc(x.base_url.replace(/^https?:\/\//, ''))}</small></td><td>${x.method === 'search' ? '검색 결과 집계' : x.method === 'aside' ? '로그인 계정으로 열람 (Aside)' : '공개 페이지 읽기'}</td><td>${x.check_at ? esc(ymd(x.check_at)) : '—'}</td><td>${CHK.map(([k, t]) => `<small>${t} ${(x.check_result || {})[k] ? (x.check_result[k].ok ? '○' : '×') : '—'}</small>`).join('')}</td><td>${esc(x.scope || '—')}</td><td><small>${x.interval_s}초 간격 · 하루 ${x.daily_cap}회</small></td><td>${st(x)}</td></tr>${open === x.id ? detail(x) : ''}`).join('')}
  </tbody></table></div>
  <form id="srcsrc-add" class="src-row" style="margin-top:12px"><input id="ss-name" placeholder="이름 (예: 네이트판)" aria-label="이름" required><input id="ss-base" type="url" placeholder="사이트 주소 https://…" aria-label="사이트 주소" required><input id="ss-search" type="url" placeholder="검색 주소 (검색어 위치에 {q})" aria-label="검색 주소"><button class="button primary" type="submit">소스 추가</button></form></section>`;
}
function bindSources() {
  $$('[data-srcsrc-open]').forEach(b => { const go = () => { src.srcOpen = src.srcOpen === Number(b.dataset.srcsrcOpen) ? 0 : Number(b.dataset.srcsrcOpen); render(); }; b.onclick = go; b.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); go(); } }; });
  $$('[data-srcsrc]').forEach(b => b.onclick = async ev => {
    ev.stopPropagation(); const [id, act] = b.dataset.srcsrc.split('|'); b.disabled = true;
    const { error } = await SB.rpc('pt_source_set', {p_id: Number(id), p_action: act});
    if (error) { b.disabled = false; return toast('처리하지 못했습니다: ' + error.message); }
    await loadSrc(); render();
    toast({recheck: '다시 점검합니다. 몇 분 이내에 결과가 표시됩니다.', use_search: '검색 결과 집계 방식으로 수집을 시작했습니다.', off: '수집을 중지했습니다.', on: '수집을 시작했습니다.'}[act]);
  });
  $('#srcsrc-add')?.addEventListener('submit', async ev => {
    ev.preventDefault(); const btn = ev.submitter; if (btn) btn.disabled = true;
    const { error } = await SB.rpc('pt_source_add', {p_name: $('#ss-name').value.trim(), p_base: $('#ss-base').value.trim(), p_search: $('#ss-search').value.trim()});
    if (error) { if (btn) btn.disabled = false; return toast(/duplicate|unique/i.test(error.message) ? '같은 이름의 소스가 이미 있습니다.' : /check/i.test(error.message) ? '주소는 http로 시작해야 합니다.' : '추가하지 못했습니다: ' + error.message); }
    await loadSrc(); render(); toast('소스를 추가했습니다. 자동 점검이 완료되면 결과가 표시됩니다.');
  });
  clearTimeout(src.srcTimer);
  if (src.d?.sources?.some(x => ['pending', 'checking'].includes(x.check_status))) src.srcTimer = setTimeout(async () => { if (page === 'chart' && src.tab === 'sources') { await loadSrc(); render(); } }, 5000);
}

// 순위 기록 그래프 — 1위가 위 · 점에 마우스를 올리면 그때 순위
function ipRankSvg(log) {
  if (log.length < 2) return '<p class="ipc-muted">기록이 2회 이상 누적되면 순위 그래프가 표시됩니다.</p>';
  // 선은 늘어나는 SVG, 글자·점은 HTML — 창 너비가 달라도 글자 크기가 그대로
  const t0 = new Date(log[0].at).getTime(), t1 = new Date(log.at(-1).at).getTime();
  const maxR = Math.max(10, ...log.map(p => p.rank)), x = t => 100 * ((new Date(t).getTime() - t0) / Math.max(t1 - t0, 1)), y = r => 100 * ((r - 1) / (maxR - 1));
  const ticks = [...new Set([1, Math.ceil(maxR / 2), maxR])];
  const pts = log.map(p => `${x(p.at).toFixed(2)},${y(p.rank).toFixed(2)}`).join(' ');
  return `<div class="ipc-graph" role="img" aria-label="순위 기록 그래프 — 최근 ${log.at(-1).rank}위">
    <div class="ipc-gy">${ticks.map(r => `<span style="top:${y(r)}%">${r}위</span>`).join('')}</div>
    <div class="ipc-gp"><svg viewBox="0 0 100 100" preserveAspectRatio="none">${ticks.map(r => `<line x1="0" x2="100" y1="${y(r)}" y2="${y(r)}" class="g"/>`).join('')}<polyline points="${pts}" class="l"/></svg>
      ${log.map(p => `<i class="ipc-dot" style="left:${x(p.at)}%;top:${y(p.rank)}%" title="${ipKst(p.at)} · ${p.rank}위"></i>`).join('')}</div>
    <div class="ipc-gx"><span>${ipKst(log[0].at)}</span><span>${ipKst(log.at(-1).at)}</span></div></div>`;
}
const ipNorm = s => String(s || '').toLowerCase().replace(/\(주\)|주식회사|㈜|inc\.?|co\.?,?\s*ltd\.?|corp\.?|entertainment|엔터테인먼트|[\s\W_]+/g, '');
function ipEntities(ip) {
  const hay = [ip.owner, ip.manager].map(ipNorm).filter(x => x.length >= 2);
  if (!hay.length) return [];
  return entities().filter(e => !e.hidden && [e.name, e.en, ...e.aliases].map(ipNorm).some(n => n.length >= 2 && hay.some(h => h.includes(n) || n.includes(h)))).slice(0, 4);
}
async function openIp(id, keep) {
  ipc.open = id;
  if (!keep) setRoute(id);
  const ip = ipc.ips[id] || (await SB.from('pt_ip').select('*').eq('id', id).maybeSingle()).data;
  if (!ip) return toast('IP 정보를 찾지 못했습니다.');
  ipc.ips[id] = ip;
  const { data: log } = await SB.from('pt_ip_rank').select('at,rank,chart').eq('ip_id', id).gte('at', new Date(Date.now() - 30 * 864e5).toISOString()).order('at');
  if (ipc.open !== id) return;
  const by = k => (log || []).filter(x => x.chart === k), cur = k => by(k).at(-1);
  const tabC = [ipc.openChart, ipc.chart, 'new', 'all'].find(k => k && by(k).length) || 'new';
  const c = ip.contact || {}, L = ip.links || {}, s = ip.signals || {};
  const ents = ipEntities(ip), people = ents.flatMap(e => contactsOf(e).map(p => ({p, e})));
  const url = (u, base, at) => !u ? '' : /^https?:/.test(u) ? u : base ? base + (at ? '@' : '') + String(u).replace(/^@/, '') : 'https://' + u;
  const linkA = (u, t) => u ? `<a class="ar-chip" href="${esc(u)}" target="_blank" rel="noopener">${t}</a>` : '';
  const nv = Array.isArray(s.naver) ? s.naver : null;
  const lg = by(tabC), table = lg.slice().reverse().slice(0, 12).map((p, i, a) => { const o = a[i + 1], d = o ? o.rank - p.rank : 0; return `<tr><td>${ipKst(p.at)}</td><td><b>${p.rank}위</b></td><td>${!o || !d ? '–' : d > 0 ? `<span class="ipc-chg up">▲${d}</span>` : `<span class="ipc-chg down">▼${-d}</span>`}</td></tr>`; }).join('');
  const best = k => Math.min(...by(k).map(x => x.rank));
  const trend = ipTrend(ip.trend);
  const issues = (ip.issues || []).filter(x => x && (x.title || x.url));
  const stats = [s.buzz != null && ['화제 크기', s.buzz + '<small>/100</small>'], s.momentum != null && ['상승 속도', s.momentum + '<small>/100</small>'], s.yt_subs && ['유튜브 구독자', Number(s.yt_subs).toLocaleString('ko-KR')], s.naver_x && ['네이버 검색', s.naver_x + '<small>배 (지난주 대비)</small>']].filter(Boolean);
  const chans = [[url(L.site), '공식 사이트'], [url(L.youtube, 'https://www.youtube.com/', 1), '유튜브'], [url(L.instagram, 'https://www.instagram.com/'), '인스타그램'], [url(L.x, 'https://x.com/'), 'X'], [url(L.tiktok, 'https://www.tiktok.com/', 1), '틱톡']].filter(x => x[0]);
  const html = `<div class="ipc-detail">
    <header class="ipc-hero">${ipArt(ip, 'big')}
      <div class="ipc-hero-main"><div class="ipc-tags">${ipKind(ip)}${ip.is_new ? '<span class="ipc-new">신규</span>' : ''}</div>
        <h2>${esc(ip.name)}</h2><p class="ipc-hero-sub">${esc([ip.name_en !== ip.name && ip.name_en, ip.since && ip.since + ' 데뷔·공개', ip.owner].filter(Boolean).join(' · '))}</p>
        ${ip.summary ? `<p class="ipc-why">${esc(ip.summary)}</p>` : ''}</div>
      <div class="ipc-now">${[['new', '신규 IP'], ['all', '전체 IP']].map(([k, t]) => { const x = cur(k); return x ? `<div><small>${t}</small><b>${x.rank}<em>위</em></b><span>30일 최고 ${best(k)}위</span></div>` : ''; }).join('')}</div>
    </header>
    <div class="ipc-cols"><div class="ipc-col">
      <section><h3>현재 트렌드${trend && ip.updated_at ? ` <small>${ipKst(ip.updated_at)} 확인</small>` : ''}</h3>${trend ? `<p>${esc(trend)}</p>` : '<p class="ipc-muted">정리된 트렌드가 없습니다. 다음 갱신 시 업데이트됩니다.</p>'}</section>
      <section><div class="ipc-sec-head"><h3>순위 기록 <small>최근 30일</small></h3>${by('new').length && by('all').length ? `<div class="ipc-seg" role="group" aria-label="차트">${[['new', '신규 IP'], ['all', '전체 IP']].map(([k, t]) => `<button type="button" class="${tabC === k ? 'on' : ''}" aria-pressed="${tabC === k}" data-ipo-chart="${k}">${t}</button>`).join('')}</div>` : ''}</div>
        ${ipRankSvg(lg)}${table ? `<details class="ipc-loglist"><summary>갱신별 순위 보기</summary><table class="ipc-log"><thead><tr><th>갱신</th><th>순위</th><th>변동</th></tr></thead><tbody>${table}</tbody></table></details>` : ''}</section>
      ${issues.length ? `<section><h3>최근 이슈</h3><ul class="ipc-issues">${issues.map(x => `<li><time>${esc(x.date || '')}</time>${/^https?:/.test(x.url || '') ? `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title || x.url)}</a>` : `<span>${esc(x.title || '')}</span>`}</li>`).join('')}</ul></section>` : ''}
      ${stats.length ? `<section><h3>수치</h3><div class="ipc-stats">${stats.map(([t, v]) => `<div><small>${t}</small><b>${v}</b></div>`).join('')}</div>${nv ? `<div class="ipc-spark" role="img" aria-label="최근 14일 네이버 검색 추이">${nv.map(v => `<i style="height:${Math.max(3, v)}%" title="${v}"></i>`).join('')}</div><small class="ipc-muted">최근 14일 네이버 검색 추이</small>` : ''}</section>` : ''}
    </div><aside class="ipc-side">
      <section class="ipc-card"><h3>소유사·관리사</h3><dl class="ipc-dl"><dt>소유사</dt><dd>${esc(ip.owner || '—')}</dd>${ip.manager ? `<dt>관리사</dt><dd>${esc(ip.manager)}</dd>` : ''}</dl></section>
      <section class="ipc-card"><h3>공식 문의처</h3>${c.email || c.phone || /^https?:/.test(c.url || '') ? `<ul class="ipc-contact">${c.email ? `<li><small>이메일</small><span id="ipc-mail">${esc(c.email)}</span><span class="ipc-act"><a class="point-go" href="mailto:${esc(c.email)}">메일</a><button class="point-go" data-copy="ipc-mail" type="button">복사</button></span></li>` : ''}${c.phone ? `<li><small>전화</small><span>${esc(c.phone)}</span><span class="ipc-act"><a class="point-go" href="tel:${esc(String(c.phone).replace(/[^\d+]/g, ''))}">전화</a></span></li>` : ''}${/^https?:/.test(c.url || '') ? `<li><small>문의 페이지</small><a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.url.replace(/^https?:\/\/(www\.)?/, ''))}</a></li>` : ''}</ul>${c.note ? `<p class="ipc-muted">${esc(c.note)}</p>` : ''}${/^https?:/.test(c.source || '') ? `<p class="ipc-muted">출처 <a href="${esc(c.source)}" target="_blank" rel="noopener">${esc(c.source.replace(/^https?:\/\/(www\.)?/, '').slice(0, 60))}</a></p>` : ''}` : '<p class="ipc-muted">공개된 문의처를 아직 찾지 못했습니다.</p>'}</section>
      <section class="ipc-card"><h3>등록된 담당자</h3>${people.length ? linkList(people.map(x => ({id: x.p.id, name: x.p.name, role: [x.e.name, x.p.role, x.p.points[0]].filter(Boolean).join(' · ')}))) : ents.length ? `${linkList(ents)}<p class="ipc-muted">이 회사에 등록된 담당자가 없습니다.</p>` : '<p class="ipc-muted">이그드라실에 등록된 담당자가 없습니다.</p>'}</section>
      ${chans.length ? `<section class="ipc-card"><h3>공식 채널</h3><div class="ipc-chips">${chans.map(([u, t]) => linkA(u, t)).join('')}</div></section>` : ''}
    </aside></div>
  </div>`;
  showDrawer(html, keep, 'IP CHART');
  $$('#drawer [data-ipo-chart]').forEach(b => b.onclick = () => { ipc.openChart = b.dataset.ipoChart; openIp(id, true); });
  if (ip.img_path && !imgSrc(ip.img_path)) setTimeout(() => ipc.open === id && !$('#drawer').hidden && openIp(id, true), 900);
}

function bindContent() {
  if (page === 'graph') graphMount();
  if (page === 'manual') manualMount();
  $('#remember-btn')?.addEventListener('click', () => { cu.tab = 'remember'; cu.step = 'pick'; go('cards'); });
  $('#cards-btn')?.addEventListener('click', () => { cu.tab = 'photo'; go('cards'); });
  $$('[data-page]').forEach(b => b.onclick = ev => { ev.preventDefault(); go(b.dataset.page); });
  $$('[data-state]').forEach(b => b.onclick = () => { entState = b.dataset.state; render(); });
  $$('[data-state-go]').forEach(b => b.onclick = () => { go('entities'); entState = b.dataset.stateGo; render(); });
  $$('[data-view]').forEach(b => b.onclick = () => { entView = b.dataset.view; try { localStorage.setItem('pt-ent-view', entView); } catch {} render(); });
  $$('[data-sort]').forEach(b => b.onclick = ev => { ev.stopPropagation(); const k = b.dataset.sort; entSort = entSort.k === k ? {k, d: -entSort.d} : {k, d: ['contacts', 'updated'].includes(k) ? -1 : 1}; render(); });
  $$('[data-add]').forEach(b => b.onclick = () => $('#add-btn').click());
  $$('[data-open-ent]').forEach(b => b.onclick = ev => { ev.stopPropagation(); openDetail(b.dataset.openEnt); });
  $$('#content .point-go').forEach(a => a.addEventListener('click', ev => ev.stopPropagation()));
  { const lq = $('#local-q'); if (lq) { let comp = false, t;        // 입력하면 0.2초 뒤 바로 거름 · 한글 조합 중에는 기다림
    const run = () => { clearTimeout(t); t = setTimeout(() => { query = lq.value; $('#global-search').value = ''; render(); const n = $('#local-q'); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 200); };
    lq.addEventListener('compositionstart', () => { comp = true; clearTimeout(t); }); lq.addEventListener('compositionend', () => { comp = false; run(); });
    lq.addEventListener('input', e => { if (!comp && !e.isComposing) run(); }); } }
  $$('[data-filter]').forEach(b => b.onclick = () => { filter = b.dataset.filter; render(); });
  // 목록 안 검색 (엔티티 DB·연락처) — 키워드만, 지금 보는 목록에서 거름
  $('#local-form')?.addEventListener('submit', ev => { ev.preventDefault(); query = $('#local-q').value.trim(); render(); $('#local-q')?.focus(); });
  $$('.q-clear').forEach(b => b.onclick = () => { query = ''; $('#global-search').value = ''; render(); $('#local-q')?.focus(); });
  $$('[data-page-go]').forEach(b => b.onclick = () => go(b.dataset.pageGo));
  $$('[data-filter-go]').forEach(b => b.onclick = () => { go('entities'); filter = b.dataset.filterGo; render(); });
  $$('[data-stat]').forEach(b => { const open = () => { const v = b.dataset.stat; if (v === 'contacts') return go('contacts'); go('entities'); if (v === LINKED) entState = '담당자 있음'; else filter = v; render(); }; b.onclick = open; b.onkeydown = ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); open(); } }; });
  $$('[data-detail]').forEach(b => { b.onclick = () => openDetail(b.dataset.detail); b.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(b.dataset.detail); } }; });
  $('#admin-export')?.addEventListener('click', exportCSV);
  bindAsk(); if (page === 'admin') bindAdmin(); if (page === 'review') { bindReview(); bindAcc(); } if (page === 'cards') bindCards(); if (page === 'studio') bindStudio(); if (page === 'chart') bindSrc();
}

/* ---------- 명함 올리기 · 연락처 잠금 · 열람 승인 (11-08 · 홍석진 대표님 「이그드라실 명함 올리기 PRD v0.2」 · sql/032) ----------
   누가 누구를 아는지 · 이름·회사·직함은 전 구성원 공개 / 휴대폰·전화·이메일·주소·명함 사진·메모는 올린 사람(자기 것만) · 승인권자 · 승인받은 사람(90일)만.
   사진 여러 장 → 봇이 6장씩 함께 읽음(pt_ask ocr) → 한 장씩 보며 메모 / 바로 입력 → pt_card_save(서버가 사람·회사·명함·메모·아는 사람을 한 번에) */
icons.cards = '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="8.5" cy="12" r="2"/><path d="M13 10.5h5 M13 13.5h3.5"/>';
const CU_MAX = 50;
const CH_KO = {mobile: '휴대폰', office_phone: '전화', fax: '팩스', email: '이메일', address: '주소', web: '웹사이트'};
const CF_FIELDS = [['name', '이름', 1], ['name_en', '영문 이름'], ['company', '회사'], ['dept', '부서'], ['title', '직함'], ['mobile', '휴대폰'], ['phone', '전화'], ['email', '이메일'], ['fax', '팩스'], ['address', '주소', 2], ['web', '웹사이트', 2]];
const acc = {approvers: [], approver: false, owner: false, reqs: [], log: [], tab: 'req'};
const priv = {};
const cu = {tab: 'photo', mine: [], loaded: false, files: [], met: '', event: '', step: 'pick', idx: 0, list: [], res: null, busy: false, imp: null};

async function loadAcc() {
  const { data } = await SB.from('pt_contact_approver').select('member_id,is_owner');
  acc.approvers = data || []; const mine = acc.approvers.find(a => a.member_id === me.id);
  acc.approver = !!mine; acc.owner = !!mine?.is_owner;
  if (acc.approver) {
    const [r, l] = await Promise.all([SB.from('pt_contact_access_request').select('*').order('id', {ascending: false}).limit(200),
      SB.from('pt_contact_access_log').select('*').order('id', {ascending: false}).limit(200)]);
    acc.reqs = r.data || []; acc.log = l.data || [];
  }
}
const memName = id => (MEMBERS || []).find(m => m.id === id)?.name || '';
const approverNames = () => [...acc.approvers].sort((a, b) => b.is_owner - a.is_owner).map(a => memName(a.member_id)).filter(Boolean);
const pendingReqs = () => acc.reqs.filter(r => r.status === 'pending');
const fromOcr = r => { const v = k => String(r?.[k] || '').trim(); return {name: v('name') || v('name_en'), name_en: v('name') ? v('name_en') : '', company: v('company') || v('company_en'), dept: '', title: v('title'), mobile: v('mobile'), phone: v('phone'), email: v('email').toLowerCase(), fax: v('fax'), address: v('address'), web: v('website')}; };

/* ---- 사람 상세: 잠긴 것 ---- */
async function loadPriv(c) {
  const { data, error } = await SB.rpc('pt_contact_private', {p_contact: c.id});
  priv[c.id] = error ? {error: error.message} : data;
  if (activeDetail === c.id) { const box = $('#priv-box'); if (box) { box.innerHTML = privHtml(c); bindPriv(c); } }
}
function privHtml(c) {
  const p = priv[c.id], d = rel.dir[c.id] || {};
  const knowers = (d.knowers || []).map(k => k.name).filter(Boolean);
  const know = `<div class="detail-row"><span>알고 있는 사람</span><b>${knowers.length ? knowers.map(esc).join(', ') : '—'}</b></div>`;
  if (!p) return know + '<p>연락처를 확인하는 중입니다<span class="dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></p>';
  if (p.error) return know + `<p>연락처를 불러오지 못했습니다: ${esc(p.error)}</p>`;
  const cards = p.cards || [], notes = p.notes || [];
  let ch = [];
  if (p.can_see && p.channels) ch = Object.entries(CH_KO).map(([k, l]) => [l, p.channels[k]]).filter(([, v]) => v).concat((p.channels.other || []).map(v => ['기타', v]));
  else { const f = {}; cards.forEach(k => Object.entries(k.fields || {}).forEach(([key, v]) => { if (v && !f[key]) f[key] = v; })); ch = [['휴대폰', f.mobile], ['전화', f.phone || f.office_phone], ['팩스', f.fax], ['이메일', f.email], ['주소', f.address], ['웹사이트', f.web]].filter(([, v]) => v); }
  const chHtml = ch.length ? ch.map(([l, v], i) => `<div class="point"><code id="pv-${c.id}-${i}"><small>${esc(l)}</small> ${esc(v)}</code><span class="point-acts">${contactLink(v)}<button type="button" data-copy="pv-${c.id}-${i}">복사</button></span></div>`).join('') : '';
  const own = !p.can_see && (cards.length || notes.length);
  const otherCards = Math.max(0, (d.n_cards || 0) - cards.filter(k => k.image_path).length), otherNotes = Math.max(0, (d.n_notes || 0) - notes.length), otherCh = Math.max(0, (d.n_channels || 0) - ch.length);
  const locked = !p.can_see && (otherCards || otherNotes || otherCh) ? (() => {
    const parts = [d.n_channels ? `연락처 ${d.n_channels}개` : '', d.n_cards ? `명함 ${d.n_cards}장` : '', d.n_notes ? `메모 ${d.n_notes}개` : ''].filter(Boolean);
    const st = d.my_request, req = st === 'pending' ? `<span class="pill">열람 요청 대기 중</span> <button class="text-btn" type="button" id="acc-cancel">요청 취소</button>`
      : `<button class="button" type="button" id="acc-req">${st === 'rejected' ? '다시 열람 요청' : st === 'expired' ? '다시 열람 요청 (90일 지남)' : '열람 요청'}</button>${st === 'rejected' ? ' <small>지난 요청이 거절되었습니다.</small>' : ''}`;
    return parts.length ? `<div class="lock-box"><p>🔒 ${parts.join(' · ')}${knowers.length ? ` · ${esc(knowers.slice(0, 3).join(', '))}${knowers.length > 3 ? ` 외 ${knowers.length - 3}명` : ''} 님이 알고 있음` : ''}</p><p class="lock-note">${own ? '직접 올린 명함과 직접 쓴 메모만 보입니다. ' : ''}전체 명함·연락처·메모는 승인권자(${esc(approverNames().join(', ') || '대표님')})의 승인을 받으면 90일 동안 볼 수 있습니다.</p>${req}</div>` : '';
  })() : '';
  const cardHtml = cards.filter(k => k.image_path).length ? `<div class="pv-cards">${cards.filter(k => k.image_path).map(k => { const s = imgSrc(k.image_path); return `<figure>${s ? `<button type="button" data-pv-card="${esc(k.image_path)}"><img src="${s}" alt="명함"></button>` : '<div class="pv-ph">불러오는 중</div>'}<figcaption>${esc(dotDate(k.received_at) || '')}${k.received_where ? ' · ' + esc(k.received_where) : ''}${k.by ? ` · ${esc(k.by)}` : ''}</figcaption></figure>`; }).join('')}</div>` : '';
  const noteHtml = `<div class="pv-notes">${notes.map(n => `<div class="pv-note"><p>${esc(n.body)}</p><small>${esc(n.author || '')} · ${esc(ymd(n.at))}${n.source === 'remember' ? ' · 리멤버에서 가져옴' : n.source === 'card' ? ' · 명함 올리기' : ''}</small></div>`).join('')}<form id="pv-note-form" class="pv-note-form"><textarea id="pv-note" rows="2" maxlength="2000" placeholder="어디서 만났는지, 무슨 이야기를 했는지"></textarea><button class="button" type="submit">메모 남기기</button></form><p class="lock-note">메모는 직접 쓴 사람과 승인권자·승인받은 사람만 볼 수 있습니다.</p></div>`;
  return know + locked + (chHtml ? `<h4 class="pv-h">연락처${p.can_see ? '' : ' (직접 올린 명함)'}</h4>${chHtml}` : (p.can_see ? '<p>기록된 업무 연락처가 없습니다.</p>' : '')) + (cardHtml ? `<h4 class="pv-h">명함</h4>${cardHtml}` : '') + `<h4 class="pv-h">메모</h4>${noteHtml}`;
}
function bindPriv(c) {
  $('#acc-req')?.addEventListener('click', () => accRequestModal(c));
  $('#acc-cancel')?.addEventListener('click', async () => {
    const { data } = await SB.from('pt_contact_access_request').select('id').eq('contact_id', c.id).eq('requester', me.id).eq('status', 'pending').maybeSingle();
    if (!data) return; const { error } = await SB.rpc('pt_access_revoke', {p_id: data.id});
    if (error) return toast('요청을 취소하지 못했습니다: ' + error.message);
    await loadRel().catch(() => {}); openDetail(c.id, true); toast('열람 요청을 취소했습니다.');
  });
  $$('[data-pv-card]').forEach(b => b.onclick = () => modal(`<h2>${esc(c.name)} 명함</h2><img src="${imgSrc(b.dataset.pvCard)}" alt="${esc(c.name)} 명함" style="width:100%;border-radius:7px;margin-top:10px"><div class="modal-actions"><button class="button primary" data-cancel>닫기</button></div>`));
  $('#pv-note-form')?.addEventListener('submit', async ev => {
    ev.preventDefault(); const t = $('#pv-note').value.trim(); if (!t) return;
    const { error } = await SB.rpc('pt_note_add', {p_contact: c.id, p_body: t});
    if (error) return toast('메모를 저장하지 못했습니다: ' + error.message);
    await loadPriv(c); loadRel().catch(() => {}); toast('메모를 남겼습니다.');
  });
  $$('#priv-box [data-copy]').forEach(b => b.onclick = () => { const el = document.getElementById(b.dataset.copy); navigator.clipboard?.writeText(el.textContent.replace(/^\S+\s/, '')); toast('복사했습니다.'); });
}
function accRequestModal(c) {
  modal(`<form id="ar-form"><h2>연락처 열람 요청</h2><p><b>${esc(c.name)}</b>${agencyOf(c) ? ' · ' + esc(agencyOf(c)) : ''} 님의 명함·연락처·메모 열람을 요청합니다. 승인권자(${esc(approverNames().join(', ') || '대표님')})에게 슬랙으로 알림이 가고, 승인되면 이 사람의 것만 90일 동안 열립니다.</p><label>요청 사유 *<textarea id="ar-why" rows="3" maxlength="300" required placeholder="예: ○○ 콜라보 제안 연락"></textarea></label><div id="ar-err" style="color:#ba775e;font-size:12px;margin-top:8px" role="alert"></div><div class="modal-actions"><button class="button" type="button" data-cancel>취소</button><button class="button primary" type="submit">열람 요청 보내기</button></div></form>`);
  $('#ar-form').onsubmit = async ev => {
    ev.preventDefault(); const why = $('#ar-why').value.trim(); if (!why) { $('#ar-err').textContent = '요청 사유를 입력해 주세요.'; return; }
    const { error } = await SB.rpc('pt_access_request', {p_contact: c.id, p_reason: why});
    if (error) { $('#ar-err').textContent = '요청하지 못했습니다: ' + error.message; return; }
    $('#modal').dataset.dirty = ''; $('#modal').close(); await loadRel().catch(() => {}); openDetail(c.id, true); toast('열람 요청을 보냈습니다. 결과는 슬랙으로 알려 드립니다.');
  };
}

/* ---- 확인 대기: 연락처 열람 요청 (승인권자) ---- */
const ACC_ACT = {view: '열람', request: '요청', approve: '승인', reject: '거절', revoke: '승인 취소', expire: '기간 만료', cancel: '요청 취소', approver_add: '승인권자 추가', approver_remove: '승인권자 제외'};
const ACC_ST = {pending: '대기 중', approved: '승인', rejected: '거절', revoked: '승인 취소', expired: '기간 만료', cancelled: '요청 취소'};
function accPanel() {
  if (!acc.approver) return '';
  const nm = id => esc((rel.dir[id] || {}).name || byId(id)?.name || '삭제된 연락처');
  const pend = pendingReqs(), done = acc.reqs.filter(r => r.status !== 'pending').slice(0, 40);
  const tabs = [['req', `열람 요청 ${pend.length}`], ['hist', '처리한 요청'], ['log', '열람 기록'], ['who', '승인권자']];
  const body = acc.tab === 'req' ? (pend.length ? `<ul class="rq-list">${pend.map(r => `<li class="rq-item rq-wide"><div><b>${esc(memName(r.requester) || '직원')}</b> → <button class="text-btn" type="button" data-detail="${esc(r.contact_id)}">${nm(r.contact_id)}</button><small>사유: ${esc(r.reason)}</small><time>${esc(ymd(r.created_at))}</time></div><span class="rq-acts"><button class="button" type="button" data-acc-no="${r.id}">거절</button><button class="button primary" type="button" data-acc-ok="${r.id}">승인 (90일)</button></span></li>`).join('')}</ul>` : '<div class="empty"><p>기다리는 열람 요청이 없습니다.</p></div>')
    : acc.tab === 'hist' ? (done.length ? `<div class="table-wrap"><table class="ct"><thead><tr><th>요청자</th><th>대상</th><th>사유</th><th>결과</th><th>처리</th><th>만료</th><th></th></tr></thead><tbody>${done.map(r => `<tr><td data-label="요청자">${esc(memName(r.requester))}</td><td data-label="대상">${nm(r.contact_id)}</td><td data-label="사유">${esc(r.reason)}</td><td data-label="결과">${esc(ACC_ST[r.status] || r.status)}${r.reject_reason ? ` <small>${esc(r.reject_reason)}</small>` : ''}</td><td data-label="처리">${esc(memName(r.decided_by))} ${esc(ymd(r.decided_at))}</td><td data-label="만료">${r.status === 'approved' ? esc(ymd(r.expires_at)) : '—'}</td><td>${r.status === 'approved' ? `<button class="text-btn" type="button" data-acc-revoke="${r.id}">승인 취소</button>` : ''}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty"><p>처리한 요청이 없습니다.</p></div>')
    : acc.tab === 'log' ? (acc.log.length ? `<div class="table-wrap"><table class="ct"><thead><tr><th>시각</th><th>누가</th><th>무엇</th><th>대상</th><th>내용</th></tr></thead><tbody>${acc.log.map(l => `<tr><td data-label="시각">${esc(new Date(l.at).toLocaleString('ko-KR', {timeZone: 'Asia/Seoul'}))}</td><td data-label="누가">${esc(memName(l.member_id))}</td><td data-label="무엇">${esc(ACC_ACT[l.action] || l.action)}</td><td data-label="대상">${l.contact_id ? nm(l.contact_id) : '—'}</td><td data-label="내용">${esc(l.detail)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty"><p>기록이 없습니다.</p></div>')
    : `<ul class="rq-list">${acc.approvers.map(a => `<li class="rq-item"><div><b>${esc(memName(a.member_id) || '—')}</b>${a.is_owner ? ' <span class="pill good">대표</span>' : ''}</div><span class="rq-acts">${acc.owner && !a.is_owner ? `<button class="button" type="button" data-appr-off="${a.member_id}">목록에서 빼기</button>` : ''}</span></li>`).join('')}</ul>${acc.owner ? `<form id="appr-add" class="appr-add"><input id="appr-name" list="pt-mnames" placeholder="승인권자로 추가할 직원 이름" aria-label="추가할 직원 이름"><button class="button" type="submit">승인권자 추가</button></form>` : ''}<p class="lock-note">승인권자는 모든 명함·연락처·메모를 보고 열람 요청을 승인합니다. 목록은 대표님만 바꿀 수 있습니다. DB 관리자라도 승인권자가 아니면 연락처를 볼 수 없습니다.</p>`;
  return `<section class="panel" style="margin-bottom:16px"><div class="panel-head"><div class="panel-title">연락처 열람 요청 <small>승인권자</small></div></div><div class="rq-kinds" role="group" aria-label="열람 요청 보기">${tabs.map(([k, l]) => `<button type="button" class="tab ${acc.tab === k ? 'active' : ''}" data-acc-tab="${k}" aria-pressed="${acc.tab === k}">${esc(l)}</button>`).join('')}</div>${body}</section>`;
}
function bindAcc() {
  $$('[data-acc-tab]').forEach(b => b.onclick = () => { acc.tab = b.dataset.accTab; render(); });
  const decide = async (id, ok, why = '') => { const { error } = await SB.rpc('pt_access_decide', {p_id: id, p_approve: ok, p_reason: why}); if (error) return toast('처리하지 못했습니다: ' + error.message); await loadAcc(); render(); toast(ok ? '승인했습니다. 요청자에게 슬랙으로 알립니다.' : '거절했습니다. 요청자에게 슬랙으로 알립니다.'); };
  $$('[data-acc-ok]').forEach(b => b.onclick = () => decide(Number(b.dataset.accOk), true));
  $$('[data-acc-no]').forEach(b => b.onclick = () => {
    const REJ = ['업무 목적을 확인할 수 없음', '담당 직원을 통해 연락 바람', '지금은 공유하기 어려움', '기타'];
    modal(`<form id="rj-form"><h2>열람 요청 거절</h2><label>거절 사유<select id="rj-why">${REJ.map(x => `<option>${esc(x)}</option>`).join('')}</select></label><label>덧붙일 말<input id="rj-more" maxlength="200"></label><div class="modal-actions"><button class="button" type="button" data-cancel>취소</button><button class="button primary" type="submit">거절</button></div></form>`);
    $('#rj-form').onsubmit = ev => { ev.preventDefault(); const w = $('#rj-why').value + ($('#rj-more').value.trim() ? ' · ' + $('#rj-more').value.trim() : ''); $('#modal').dataset.dirty = ''; $('#modal').close(); decide(Number(b.dataset.accNo), false, w); };
  });
  $$('[data-acc-revoke]').forEach(b => b.onclick = async () => {
    if (await confirmBox({title: '승인을 취소할까요?', body: '요청자는 이 사람의 명함·연락처·메모를 바로 볼 수 없게 됩니다.', ok: '승인 취소', cancel: '닫기', danger: true}) !== true) return;
    const { error } = await SB.rpc('pt_access_revoke', {p_id: Number(b.dataset.accRevoke)}); if (error) return toast('취소하지 못했습니다: ' + error.message); await loadAcc(); render(); toast('승인을 취소했습니다.');
  });
  $$('[data-appr-off]').forEach(b => b.onclick = async () => { const { error } = await SB.rpc('pt_approver_set', {p_member: b.dataset.apprOff, p_on: false}); if (error) return toast(error.message); await loadAcc(); render(); toast('승인권자 목록에서 뺐습니다.'); });
  $('#appr-add')?.addEventListener('submit', async ev => { ev.preventDefault(); const m = findMember($('#appr-name').value); if (!m) return toast('직원을 찾지 못했습니다. 이름을 확인해 주세요.'); const { error } = await SB.rpc('pt_approver_set', {p_member: m.id, p_on: true}); if (error) return toast(error.message); await loadAcc(); render(); toast(`${m.name} 님을 승인권자로 추가했습니다.`); });
}

/* ---- 명함 올리기 화면 ---- */
async function loadMyCards() {
  const { data } = await SB.from('pt_card').select('id,image_path,fields,draft,review_status,batch_id,batch_order,received_at,received_where,source,created_at')
    .eq('received_by', me.id).in('review_status', ['reading', 'pending', 'needs_check']).order('created_at').order('batch_order').limit(500);
  cu.mine = data || []; cu.loaded = true;
}
const cuReading = () => cu.mine.filter(k => k.review_status === 'reading' && k.source === 'photo');
const cuPending = () => cu.mine.filter(k => k.review_status === 'pending');
const cuCheck = () => cu.mine.filter(k => k.review_status === 'needs_check');
function cardsView() {
  if (!cu.loaded) { loadMyCards().then(render); return '<section class="panel"><div class="empty"><p>불러오는 중입니다<span class="dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></p></div></section>'; }
  const tabs = [['photo', '사진 올리기'], ['remember', '리멤버 엑셀 가져오기'], ['check', `확인 필요 ${cuCheck().length}`]];
  const head = `<div class="notice">받은 명함 사진을 한 번에 최대 ${CU_MAX}장 올리면 이그드라실 봇이 글자를 읽습니다. 한 장씩 보며 어디서 만났는지 메모를 남기거나, 메모 없이 바로 저장할 수 있습니다. 이름·회사·직함은 전 직원이 보고, 연락처·명함 사진·메모는 올린 분과 승인권자(${esc(approverNames().join(', ') || '대표님')})만 봅니다.</div>
    <div class="rq-kinds cu-tabs" role="tablist" aria-label="명함 올리기">${tabs.map(([k, l]) => `<button type="button" class="tab ${cu.tab === k ? 'active' : ''}" data-cu-tab="${k}" aria-pressed="${cu.tab === k}">${esc(l)}</button>`).join('')}</div>`;
  if (cu.tab === 'remember') return head + rememberPanel();
  if (cu.tab === 'check' && cu.step !== 'review') return head + `<section class="panel"><div class="panel-head"><div class="panel-title">확인 필요 <small>${cuCheck().length}장</small></div>${cuCheck().length ? '<button class="button primary" type="button" id="cu-check-go">한 장씩 처리하기</button>' : ''}</div>${cuCheck().length ? `<p class="cu-sub">이름을 읽지 못했거나 같은 사람인지 애매한 명함입니다. 한 장씩 확인해 저장하거나 버려 주세요.</p><ul class="cu-thumbs">${cuCheck().map(k => `<li>${k.image_path ? `<img src="${imgSrc(k.image_path)}" alt="">` : '<span class="cu-noimg">리멤버</span>'}<b>${esc((k.draft || k.fields || {}).name || '이름 없음')}</b><small>${esc((k.draft || k.fields || {}).company || '')}</small></li>`).join('')}</ul>` : '<div class="empty"><p>확인이 필요한 명함이 없습니다.</p></div>'}</section>`;
  return head + photoPanel();
}
function photoPanel() {
  if (cu.step === 'review') return reviewCardPanel();
  if (cu.step === 'result') { const r = cu.res || {}; return `<section class="panel cu-result"><div class="panel-head"><div class="panel-title">저장 결과</div></div><p class="cu-big">새 사람 <b>${r.new || 0}</b> · 기존 사람에 붙음 <b>${r.attached || 0}</b> · 확인 필요 <b>${r.needs_check || 0}</b> · 버림 <b>${r.discarded || 0}</b></p>${(r.people || []).length ? `<ul class="cu-people">${r.people.map(p => `<li><button class="text-btn" type="button" data-detail="${esc(p.id)}">${esc(p.name)}</button> <span class="pill ${p.how === 'new' ? 'good' : ''}">${p.how === 'new' ? '새 사람' : '기존 사람'}</span></li>`).join('')}</ul>` : ''}<div class="modal-actions" style="justify-content:flex-start"><button class="button primary" type="button" id="cu-again">명함 더 올리기</button>${cuCheck().length ? `<button class="button" type="button" data-cu-tab="check">확인 필요 ${cuCheck().length}장 처리</button>` : ''}</div></section>`; }
  const reading = cuReading(), pend = cuPending();
  if (reading.length) { const tot = reading.length + pend.length, done = pend.length; const pc = tot ? Math.round(done / tot * 100) : 0;
    return `<section class="panel"><div class="panel-head"><div class="panel-title">글자 읽기</div></div><div class="ref-prog cu-prog"><span class="row"><span class="bar" role="progressbar" aria-valuenow="${pc}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pc}%"></i></span><b>${pc}%</b></span><small>${done} / ${tot}장 읽음 · 이그드라실 봇이 명함 글자를 읽는 중입니다<span class="dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span> 이 화면을 나가도 계속 읽습니다.</small></div><ul class="cu-thumbs">${[...pend, ...reading].map(k => `<li class="${k.review_status === 'reading' ? 'reading' : 'done'}"><img src="${imgSrc(k.image_path)}" alt=""><small>${k.review_status === 'reading' ? '읽는 중' : esc((k.fields || {}).name || '읽음')}</small></li>`).join('')}</ul></section>`; }
  if (pend.length) return `<section class="panel"><div class="panel-head"><div class="panel-title">${cu.justRead ? '다 읽었습니다' : `올리다 만 명함 ${pend.length}장이 있습니다`}</div></div><p class="cu-sub">명함 ${pend.length}장을 어떻게 저장할까요?</p><div class="cu-choose"><button type="button" class="cu-opt primary" id="cu-review"><b>한 장씩 보며 메모 달기</b><span>사진과 읽은 값을 확인하고, 어디서 만났는지 메모를 남깁니다.</span></button><button type="button" class="cu-opt" id="cu-quick"><b>바로 입력</b><span>메모 없이 읽은 값 그대로 저장합니다. 이름을 못 읽었거나 같은 사람인지 애매한 명함은 「확인 필요」로 남깁니다.</span></button></div><p class="cu-sub"><button class="text-btn" type="button" id="cu-drop-all">이 명함들 모두 버리기</button></p></section>`;
  return `<section class="panel"><div class="panel-head"><div class="panel-title">명함 사진 올리기</div></div>
    <label class="cu-drop" id="cu-drop"><input type="file" id="cu-files" accept="image/*,.heic,.heif" multiple hidden><b>명함 사진을 끌어다 놓거나 눌러서 선택</b><span>사진 한 장에 명함 한 장만 찍어 주세요 · JPG·PNG·HEIC · 한 번에 최대 ${CU_MAX}장</span></label>
    <div id="cu-picked">${cu.files.length ? `<p class="cu-sub">${cu.files.length}장 선택됨 <button class="text-btn" type="button" id="cu-clear">다시 선택</button></p><ul class="cu-thumbs">${cu.files.map(f => `<li><img src="${f.url}" alt=""></li>`).join('')}</ul>` : ''}</div>
    <div class="cu-meta"><label>만난 날짜 (선택)<input type="date" id="cu-met" value="${esc(cu.met)}"></label><label>행사·장소 (선택)<input id="cu-event" maxlength="200" value="${esc(cu.event)}" placeholder="예: 11/8 코엑스 라이선싱 쇼"></label></div>
    <p class="cu-sub">만난 날짜·행사를 입력하면 모든 장에 기본값으로 들어가고, 한 장씩 볼 때 고칠 수 있습니다.</p>
    <div id="cu-up"></div><div class="modal-actions" style="justify-content:flex-start"><button class="button primary" type="button" id="cu-go" ${cu.files.length && !cu.busy ? '' : 'disabled'}>${cu.files.length ? `${cu.files.length}장 올리고 읽기` : '올리고 읽기'}</button></div></section>`;
}
async function cuPick(files) {
  const arr = [...files].filter(f => /^image\//.test(f.type) || /\.(heic|heif)$/i.test(f.name));
  if (arr.length > CU_MAX) toast(`한 번에 ${CU_MAX}장까지 올릴 수 있습니다. 앞의 ${CU_MAX}장만 골랐습니다.`);
  const out = [];
  for (const f of arr.slice(0, CU_MAX)) { try { const r = await resize(f, 1600, .85); out.push({name: f.name, blob: r.blob, url: r.url}); } catch { toast(`${f.name} 사진을 열지 못했습니다. HEIC는 아이폰 사파리에서 올리거나 JPG로 바꿔 주세요.`); } }
  cu.files = out; render();
}
async function cuUpload() {
  if (!cu.files.length || cu.busy) return; cu.busy = true;
  cu.met = $('#cu-met')?.value || ''; cu.event = $('#cu-event')?.value.trim() || '';
  const { data: b, error: be } = await SB.from('pt_card_batch').insert({created_by: me.id, total: cu.files.length, met_at: cu.met || null, event: cu.event}).select('id').single();
  if (be) { cu.busy = false; return toast('올리지 못했습니다: ' + be.message); }
  const prog = (i, t) => { const w = $('#cu-up'); if (w) w.innerHTML = `<div class="ref-prog"><span class="row"><span class="bar"><i style="width:${Math.round(i / t * 100)}%"></i></span><b>${Math.round(i / t * 100)}%</b></span><small>${i} / ${t}장 업로드 중</small></div>`; };
  let n = 0; prog(0, cu.files.length);
  for (const [i, f] of cu.files.entries()) {
    try {
      const path = await upload(f.blob, 'cards');
      const { data: ask } = await SB.from('pt_ask').insert({kind: 'ocr', image_path: path}).select('id').single();
      await SB.from('pt_card').insert({received_by: me.id, image_path: path, batch_id: b.id, batch_order: i, review_status: 'reading', source: 'photo', received_at: cu.met || today(), received_where: cu.event, draft: {ask: ask?.id || null}});
      n++;
    } catch (e) { toast(`${f.name}을(를) 올리지 못했습니다.`); }
    prog(i + 1, cu.files.length);
  }
  cu.busy = false; cu.files = []; cu.justRead = true; await loadMyCards(); render(); cuPoll();
  toast(`명함 ${n}장을 올렸습니다. 이그드라실 봇이 읽는 중입니다.`);
}
let cuTimer = null;
async function cuPoll() {
  clearTimeout(cuTimer);
  const reading = cuReading(); if (!reading.length) return;
  const ids = reading.map(k => k.draft?.ask).filter(Boolean);
  if (ids.length) {
    const { data } = await SB.from('pt_ask').select('id,status,result').in('id', ids);
    for (const a of data || []) {
      if (!['done', 'fail'].includes(a.status)) continue;
      const k = reading.find(x => x.draft?.ask === a.id); if (!k) continue;
      const f = a.status === 'done' && a.result ? fromOcr(a.result) : {};
      const { error } = await SB.from('pt_card').update({fields: f, ocr_result: a.result || null, review_status: 'pending', draft: {failed: a.status !== 'done' || !a.result}}).eq('id', k.id);
      if (!error) Object.assign(k, {fields: f, review_status: 'pending', draft: {failed: a.status !== 'done' || !a.result}});
    }
  }
  reading.filter(k => !k.draft?.ask).forEach(k => { k.review_status = 'pending'; SB.from('pt_card').update({review_status: 'pending', draft: {failed: true}}).eq('id', k.id); });
  if (page === 'cards' && cu.tab === 'photo' && cu.step === 'pick') render();
  if (cuReading().length) cuTimer = setTimeout(cuPoll, 3000);
}
const cuMatch = async f => { const { data } = await SB.rpc('pt_card_match', {p_name: f.name || '', p_email: f.email || '', p_mobile: f.mobile || '', p_company: f.company || '', p_org: f.org || null}); return data || []; };
function cuOrgOf(f) { const m = (f.company && matchCompany(f.company)) || (f.email && matchByDomain(f.email)); return m ? m.id : ''; }
async function cuQuick(list) {
  const r = cu.res = {new: 0, attached: 0, needs_check: 0, discarded: 0, people: []};
  const w = $('#cu-quick-prog') || (() => { const d = document.createElement('div'); d.id = 'cu-quick-prog'; $('#content .panel')?.appendChild(d); return d; })();
  for (const [i, k] of list.entries()) {
    w.innerHTML = `<div class="ref-prog"><span class="row"><span class="bar"><i style="width:${Math.round(i / list.length * 100)}%"></i></span><b>${Math.round(i / list.length * 100)}%</b></span><small>${i} / ${list.length}장 저장 중</small></div>`;
    const f = {...(k.fields || {})}, org = cuOrgOf(f), ms = f.name ? await cuMatch({...f, org}) : [];
    const strong = ms.find(m => m.how !== 'name_company'), weak = !strong && ms.length;
    const { data, error } = await SB.rpc('pt_card_save', {p_card: k.id, f, p_memo: '', p_attach: strong?.contact_id || null, p_org: org || null, p_org_new: null,
      p_met: k.received_at || null, p_event: k.received_where || '', p_status: !f.name || weak ? 'needs_check' : 'saved'});
    if (error) { r.needs_check++; continue; }
    r[data.result === 'already' ? 'attached' : data.result] = (r[data.result === 'already' ? 'attached' : data.result] || 0) + 1;
    if (data.contact_id) r.people.push({id: data.contact_id, name: f.name, how: data.result});
  }
  await Promise.all([load(), loadMyCards()]); cu.step = 'result'; render();
}
/* 한 장씩 확인 */
function cuStartReview(list) { cu.justRead = false; cu.list = list.map(k => k.id); cu.idx = 0; cu.step = 'review'; cu.res = {new: 0, attached: 0, needs_check: 0, discarded: 0, people: []}; render(); }
const cuCur = () => cu.mine.find(k => k.id === cu.list[cu.idx]);
function reviewCardPanel() {
  const k = cuCur(); if (!k) { cu.step = cu.res ? 'result' : 'pick'; return photoPanel(); }
  const f = {...(k.fields || {}), ...(k.draft && k.draft.name !== undefined ? k.draft : {})}, img = k.image_path ? imgSrc(k.image_path) : '';
  const orgSel = f.org !== undefined ? f.org : cuOrgOf(f);
  return `<section class="panel cu-review" data-card="${k.id}"><div class="panel-head"><div class="panel-title">한 장씩 확인 <small>${cu.idx + 1} / ${cu.list.length}</small></div><button class="text-btn" type="button" id="cu-exit">나중에 이어서 하기</button></div>
    <ol class="cu-strip">${cu.list.map((id, i) => { const x = cu.mine.find(m => m.id === id); const st = !x ? 'done' : x.review_status === 'pending' || x.review_status === 'needs_check' ? (i === cu.idx ? 'cur' : 'todo') : 'done'; return `<li class="${st}">${x?.image_path ? `<img src="${imgSrc(x.image_path)}" alt="">` : '<span></span>'}</li>`; }).join('')}</ol>
    <div class="cu-grid"><div class="cu-photo">${k.image_path ? (img ? `<img id="cu-img" src="${img}" alt="명함 사진" style="transform:rotate(${Number(f.rot || 0)}deg)"><button class="button" type="button" id="cu-rot">돌리기</button>` : '<div class="pv-ph">사진을 불러오는 중</div>') : '<div class="pv-ph">리멤버에서 가져온 명함 (사진 없음)</div>'}${k.draft?.failed ? '<p class="cu-warn">글자를 읽지 못했습니다. 사진을 보고 직접 입력해 주세요.</p>' : ''}</div>
    <form id="cu-form" class="cu-form" autocomplete="off"><div id="cu-dup"></div><div class="cu-fields">${CF_FIELDS.map(([key, l, w]) => `<label class="${w === 2 ? 'wide' : ''}">${l}${w === 1 ? ' *' : ''}<input data-cf="${key}" value="${esc(f[key] || '')}" maxlength="200"></label>`).join('')}</div>
    <label>회사 연결<select id="cu-org"><option value="">${f.company ? '글자만 저장 (회사 엔티티 연결 안 함)' : '연결 안 함'}</option><option value="__new" ${orgSel === '__new' ? 'selected' : ''}>새 회사로 만들기 (입력한 회사명으로)</option>${companyOptions(orgSel && orgSel !== '__new' ? orgSel : '')}</select></label>
    <div class="cu-meta"><label>만난 날짜<input type="date" id="cu-k-met" value="${esc(f.met || k.received_at || '')}"></label><label>행사·장소<input id="cu-k-event" maxlength="200" value="${esc(f.event !== undefined ? f.event : k.received_where || '')}"></label></div>
    <label>메모<textarea id="cu-memo" rows="4" maxlength="2000" placeholder="어디서 만났는지, 무슨 이야기를 했는지">${esc(f.memo || '')}</textarea></label>
    <div class="cu-acts"><button class="button" type="button" id="cu-prev" ${cu.idx ? '' : 'disabled'}>이전</button><button class="button" type="button" id="cu-discard">이 명함 버리기</button><button class="button" type="button" id="cu-rest">남은 장은 바로 입력</button><button class="button primary" type="submit" id="cu-save">저장하고 다음</button></div>
    <p class="cu-sub">Enter: 저장하고 다음 · 메모 칸에서는 Ctrl(⌘)+Enter</p></form></div></section>`;
}
function cuReadForm() {
  const f = {}; $$('[data-cf]').forEach(i => { f[i.dataset.cf] = i.value.trim(); }); if (f.email) f.email = f.email.toLowerCase();
  return {f, org: $('#cu-org')?.value || '', met: $('#cu-k-met')?.value || '', event: $('#cu-k-event')?.value.trim() || '', memo: $('#cu-memo')?.value.trim() || '', rot: Number($('#cu-img')?.dataset.rot || 0)};
}
let cuDraftT = null, cuAttach = null;
function cuSaveDraft(k) { clearTimeout(cuDraftT); cuDraftT = setTimeout(() => { const v = cuReadForm(); const d = {...v.f, org: v.org, met: v.met, event: v.event, memo: v.memo, rot: v.rot, failed: k.draft?.failed || false}; k.draft = d; SB.from('pt_card').update({draft: d}).eq('id', k.id); }, 600); }
async function cuShowDup(k) {
  const v = cuReadForm(), box = $('#cu-dup'); if (!box) return;
  const ms = v.f.name || v.f.email || v.f.mobile ? await cuMatch({...v.f, org: v.org && v.org !== '__new' ? v.org : null}) : [];
  if (!ms.length) { cuAttach = null; box.innerHTML = ''; return; }
  const strong = ms.find(m => m.how !== 'name_company');
  if (cuAttach === undefined || cuAttach === null) cuAttach = strong ? strong.contact_id : null;
  box.innerHTML = `<div class="cu-dupbox"><b>이미 있는 사람</b>${ms.map(m => `<label><input type="radio" name="cu-att" value="${esc(m.contact_id)}" ${cuAttach === m.contact_id ? 'checked' : ''}> ${esc(m.name)}${m.entity_name ? ' · ' + esc(m.entity_name) : ''}${m.title ? ' · ' + esc(m.title) : ''}${m.card_date ? ` <small>(${esc(dotDate(m.card_date))} 명함)</small>` : ''} <small>${m.how === 'email' ? '이메일 같음' : m.how === 'mobile' ? '휴대폰 같음' : '이름·회사만 같음'}</small></label>`).join('')}<label><input type="radio" name="cu-att" value="" ${!cuAttach ? 'checked' : ''}> 다른 사람이다 (새 사람으로 저장)</label></div>`;
  $$('[name=cu-att]').forEach(r => r.onchange = () => { cuAttach = r.value || ''; });
}
async function cuSubmit(status = 'saved') {
  const k = cuCur(); if (!k || cu.busy) return; const v = cuReadForm();
  if (status === 'saved' && !v.f.name) { toast('이름을 입력해 주세요. 이름을 모르면 「이 명함 버리기」나 「나중에 이어서 하기」를 눌러 주세요.'); $('[data-cf=name]')?.focus(); return; }
  if (status === 'saved' && v.org === '__new' && !v.f.company) { toast('새 회사로 만들려면 회사명을 입력해 주세요.'); return; }
  cu.busy = true; $('#cu-save') && ($('#cu-save').disabled = true);
  const { data, error } = await SB.rpc('pt_card_save', {p_card: k.id, f: v.f, p_memo: v.memo, p_attach: status === 'saved' ? (cuAttach || null) : null,
    p_org: v.org && v.org !== '__new' ? v.org : null, p_org_new: v.org === '__new' ? v.f.company : null, p_met: v.met || null, p_event: v.event, p_status: status});
  cu.busy = false;
  if (error) { $('#cu-save') && ($('#cu-save').disabled = false); return toast('저장하지 못했습니다: ' + error.message); }
  const key = data.result === 'already' ? 'attached' : data.result; cu.res[key] = (cu.res[key] || 0) + 1;
  if (data.contact_id) cu.res.people.push({id: data.contact_id, name: v.f.name, how: data.result});
  k.review_status = data.result === 'discarded' ? 'discarded' : data.result === 'needs_check' ? 'needs_check' : 'saved';
  cuAttach = null; cu.idx++;
  if (cu.idx >= cu.list.length) { await Promise.all([load(), loadMyCards()]); cu.step = 'result'; }
  render();
}
function bindCards() {
  $$('[data-cu-tab]').forEach(b => b.onclick = () => { cu.tab = b.dataset.cuTab; if (cu.step === 'review' || cu.step === 'result') cu.step = 'pick'; render(); });
  const inp = $('#cu-files'), drop = $('#cu-drop');
  if (inp) inp.onchange = () => cuPick(inp.files);
  if (drop) { drop.ondragover = e => { e.preventDefault(); drop.classList.add('over'); }; drop.ondragleave = () => drop.classList.remove('over'); drop.ondrop = e => { e.preventDefault(); drop.classList.remove('over'); cuPick(e.dataTransfer.files); }; }
  $('#cu-clear')?.addEventListener('click', () => { cu.files = []; render(); });
  $('#cu-met')?.addEventListener('change', e => { cu.met = e.target.value; });
  $('#cu-event')?.addEventListener('input', e => { cu.event = e.target.value; });
  $('#cu-go')?.addEventListener('click', cuUpload);
  $('#cu-review')?.addEventListener('click', () => cuStartReview(cuPending()));
  $('#cu-quick')?.addEventListener('click', e => { e.target.closest('button').disabled = true; cuQuick(cuPending()); });
  $('#cu-check-go')?.addEventListener('click', () => cuStartReview(cuCheck()));
  $('#cu-again')?.addEventListener('click', () => { cu.step = 'pick'; cu.res = null; cu.tab = 'photo'; render(); });
  $('#cu-drop-all')?.addEventListener('click', async () => {
    const list = cuPending(); if (await confirmBox({title: `명함 ${list.length}장을 버릴까요?`, body: '저장하지 않은 명함이 목록에서 사라집니다. 사진은 기록으로만 남고 누구에게도 보이지 않습니다.', ok: `${list.length}장 버리기`, cancel: '닫기', danger: true}) !== true) return;
    for (const k of list) await SB.rpc('pt_card_save', {p_card: k.id, f: k.fields || {}, p_status: 'discarded'});
    await loadMyCards(); render(); toast('명함을 버렸습니다.');
  });
  if (page === 'cards' && cu.tab === 'photo' && cuReading().length && !cuTimer) cuPoll();
  if (cu.tab === 'remember') bindRemember();
  const k = cuCur(), form = $('#cu-form');
  if (cu.step === 'review' && k && form) {
    cuAttach = k.draft?.candidate ?? null; cuShowDup(k);
    $$('[data-cf]').forEach(i => i.addEventListener('input', () => cuSaveDraft(k)));
    ['email', 'mobile', 'name', 'company'].forEach(key => $(`[data-cf=${key}]`)?.addEventListener('change', () => cuShowDup(k)));
    $('#cu-org').addEventListener('change', () => { cuSaveDraft(k); cuShowDup(k); });
    ['cu-k-met', 'cu-k-event', 'cu-memo'].forEach(id => $('#' + id)?.addEventListener('input', () => cuSaveDraft(k)));
    $('#cu-rot')?.addEventListener('click', () => { const im = $('#cu-img'); const r = (Number(im.dataset.rot || k.draft?.rot || 0) + 90) % 360; im.dataset.rot = r; im.style.transform = `rotate(${r}deg)`; cuSaveDraft(k); });
    form.onsubmit = ev => { ev.preventDefault(); cuSubmit('saved'); };
    form.addEventListener('keydown', ev => { if (ev.key === 'Enter' && ev.target.tagName === 'TEXTAREA' && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); cuSubmit('saved'); } });
    $('#cu-prev').onclick = () => { if (cu.idx > 0) { cu.idx--; const p = cuCur(); if (p && p.review_status === 'saved') { toast('이미 저장한 명함은 사람 화면에서 고쳐 주세요.'); cu.idx++; return; } render(); } };
    $('#cu-discard').onclick = () => cuSubmit('discarded');
    $('#cu-rest').onclick = async () => { const rest = cu.list.slice(cu.idx).map(id => cu.mine.find(m => m.id === id)).filter(x => x && ['pending', 'needs_check'].includes(x.review_status)); const keep = cu.res; await cuQuick(rest); ['new', 'attached', 'needs_check', 'discarded'].forEach(x => { cu.res[x] = (cu.res[x] || 0) + (keep[x] || 0); }); cu.res.people = [...keep.people, ...cu.res.people]; render(); };
    $('#cu-exit').onclick = () => { cu.step = 'pick'; render(); toast('쓰던 값과 메모는 저장해 두었습니다. 다시 들어오면 이어서 할 수 있습니다.'); };
    setTimeout(() => { const n = $('[data-cf=name]'); if (n && !n.value) n.focus(); else $('#cu-memo')?.focus(); }, 30);
  }
}

/* ---- 리멤버 엑셀 가져오기 (서버가 같은 사람 찾기·중복 막기) ---- */
Object.assign(RM_COLS, {group: /^(그룹|group|태그|분류)/i, registered: /^(명함 ?등록일|등록일|registered|created)/i, registrar: /^(명함 ?등록자|등록자|registrant|owner)/i});
const RM_KO = {name: '이름', company: '회사', dept: '부서', title: '직책', mobile: '휴대폰', phone: '전화', fax: '팩스', email: '이메일', address: '주소', web: '홈페이지', memo: '메모', group: '그룹', registered: '명함 등록일', registrar: '명함 등록자'};
function rememberPanel() {
  const s = cu.imp;
  if (!s) return `<section class="panel"><div class="panel-head"><div class="panel-title">리멤버 엑셀 가져오기</div></div><p class="cu-sub">리멤버 앱 <b>명함첩 → 편집 → 전체 선택 → 더 보기 → 파일로 내보내기</b>(PC 웹은 명함첩에서 명함 선택 → 파일로 내보내기)로 메일로 받은 엑셀(XLS·XLSX·CSV)을 올려 주세요. 사진은 들어오지 않고 글자 정보만 가져옵니다. 같은 파일을 다시 올려도 사람이 두 번 생기지 않습니다.</p><label class="cu-drop"><input type="file" id="rm2-file" accept=".xls,.xlsx,.csv" hidden><b>엑셀 파일 선택</b><span>한 파일 최대 5,000줄</span></label><div id="rm2-err" class="cu-warn" role="alert"></div></section>`;
  const map = Object.keys(RM_KO).map(k => `<label>${RM_KO[k]}<select data-rm2-col="${k}"><option value="">없음</option>${s.head.map((h, i) => `<option value="${i}" ${s.col[k] === i ? 'selected' : ''}>${esc(h || `${i + 1}번째 열`)}</option>`).join('')}</select></label>`).join('');
  const pv = s.preview;
  return `<section class="panel"><div class="panel-head"><div class="panel-title">${esc(s.file)} <small>${s.rows.length}줄</small></div><button class="text-btn" type="button" id="rm2-reset">다른 파일</button></div>
    <h4 class="pv-h">열 맞추기</h4><p class="cu-sub">리멤버 열 이름을 자동으로 맞췄습니다. 맞지 않는 열만 골라 주세요.</p><div class="rm2-map">${map}</div>
    <h4 class="pv-h">미리 보기</h4>${pv ? (pv.loading ? `<div class="ref-prog"><span class="row"><span class="bar indet"><i></i></span></span><small>같은 사람을 찾는 중입니다<span class="dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></small></div>` : `<p class="cu-big">${s.rows.length}명 · 새 사람 <b>${pv.new}</b> · 기존 사람에 붙음 <b>${pv.attached}</b> · 확인 필요 <b>${pv.needs_check}</b>${pv.skipped ? ` · 이미 가져옴 <b>${pv.skipped}</b>` : ''}</p>`) : ''}
    <div class="table-wrap"><table class="ct"><thead><tr>${['name', 'company', 'title', 'email', 'mobile', 'memo'].map(k => `<th>${RM_KO[k]}</th>`).join('')}</tr></thead><tbody>${rm2Rows(s).slice(0, 8).map(r => `<tr>${['name', 'company', 'title', 'email', 'mobile', 'memo'].map(k => `<td data-label="${RM_KO[k]}">${esc(String(r[k] || '').slice(0, 40))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
    <div id="rm2-prog"></div><div class="modal-actions" style="justify-content:flex-start"><button class="button primary" type="button" id="rm2-go" ${pv && !pv.loading && !s.busy ? '' : 'disabled'}>가져오기</button></div><p class="cu-sub">연락처·메모는 올린 분과 승인권자만 봅니다. 엑셀의 그룹은 태그로, 메모는 메모로 들어갑니다. 「확인 필요」는 이 화면의 「확인 필요」 탭에서 한 장씩 처리합니다.</p></section>`;
}
function rm2Rows(s) { const v = (r, k) => s.col[k] === undefined || s.col[k] === '' ? '' : String(r[s.col[k]] ?? '').trim(); return s.rows.map(r => Object.fromEntries(Object.keys(RM_KO).map(k => [k, v(r, k)]))).filter(r => r.name || r.email || r.mobile); }
async function rm2Preview() {
  const s = cu.imp; s.preview = {loading: true}; render();
  const rows = rm2Rows(s), tot = {new: 0, attached: 0, needs_check: 0, skipped: 0};
  for (let i = 0; i < rows.length; i += 300) {
    const { data, error } = await SB.rpc('pt_remember_import', {p_import: null, p_rows: rows.slice(i, i + 300), p_dry: true});
    if (error) { s.preview = null; render(); return toast('미리 보기를 만들지 못했습니다: ' + error.message); }
    Object.keys(tot).forEach(k => { tot[k] += data[k] || 0; });
  }
  if (cu.imp === s) { s.preview = tot; render(); }
}
function bindRemember() {
  $('#rm2-file')?.addEventListener('change', async ev => {
    const f = ev.target.files[0]; if (!f) return;
    try {
      await loadXlsx();
      const wb = XLSX.read(await f.arrayBuffer(), {type: 'array'}), rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {header: 1, defval: '', raw: false});
      const hi = Math.max(0, rows.findIndex(r => r.filter(c => Object.values(RM_COLS).some(re => re.test(String(c).trim()))).length >= 2));
      const head = (rows[hi] || []).map(c => String(c).trim()), col = {};
      head.forEach((h, i) => { for (const [k, re] of Object.entries(RM_COLS)) if (col[k] === undefined && re.test(h)) col[k] = i; });
      const body = rows.slice(hi + 1).filter(r => r.some(c => String(c).trim()));
      if (body.length > 5000) { $('#rm2-err').textContent = '한 파일은 5,000줄까지 가져올 수 있습니다. 나눠서 올려 주세요.'; return; }
      cu.imp = {file: f.name, head, col, rows: body, preview: null}; render(); rm2Preview();
    } catch (e) { $('#rm2-err').textContent = '파일을 읽지 못했습니다: ' + (e?.message || ''); }
  });
  $('#rm2-reset')?.addEventListener('click', () => { cu.imp = null; render(); });
  $$('[data-rm2-col]').forEach(sl => sl.onchange = () => { const v = sl.value; cu.imp.col[sl.dataset.rm2Col] = v === '' ? undefined : Number(v); rm2Preview(); });
  $('#rm2-go')?.addEventListener('click', async () => {
    const s = cu.imp, rows = rm2Rows(s); s.busy = true; $('#rm2-go').disabled = true;
    const { data: imp, error: ie } = await SB.from('pt_contact_import').insert({created_by: me.id, file_name: s.file, mapping: s.col}).select('id').single();
    if (ie) { s.busy = false; return toast('가져오지 못했습니다: ' + ie.message); }
    const tot = {new: 0, attached: 0, needs_check: 0, skipped: 0};
    for (let i = 0; i < rows.length; i += 100) {
      const pc = Math.round(i / rows.length * 100); $('#rm2-prog').innerHTML = `<div class="ref-prog"><span class="row"><span class="bar"><i style="width:${pc}%"></i></span><b>${pc}%</b></span><small>${i} / ${rows.length}명 가져오는 중</small></div>`;
      const { data, error } = await SB.rpc('pt_remember_import', {p_import: imp.id, p_rows: rows.slice(i, i + 100), p_dry: false});
      if (error) { toast(`${i}번째 줄부터 가져오지 못했습니다: ${error.message}`); break; }
      Object.keys(tot).forEach(k => { tot[k] += data[k] || 0; });
    }
    cu.imp = null; await Promise.all([load(), loadMyCards()]);
    cu.res = {new: tot.new, attached: tot.attached, needs_check: tot.needs_check, discarded: 0, people: []}; cu.tab = 'photo'; cu.step = 'result'; render();
    toast(`리멤버에서 가져왔습니다 · 새 사람 ${tot.new} · 기존 사람 ${tot.attached} · 확인 필요 ${tot.needs_check}${tot.skipped ? ` · 이미 가져옴 ${tot.skipped}` : ''}`);
  });
}

/* ---------- 로그인 ---------- */
// 슬랙으로 로그인 (11-04) — 슬랙 앱 「Heimdall」 · Supabase Slack(OIDC). 헤임달 계정과 같은 계정으로 들어간다
const SLACK_SVG = '<svg width="16" height="16" viewBox="0 0 122.8 122.8" aria-hidden="true" style="stroke:none;flex-shrink:0"><path d="M25.8 77.6a12.9 12.9 0 1 1-12.9-12.9h12.9zm6.5 0a12.9 12.9 0 0 1 25.8 0v32.3a12.9 12.9 0 1 1-25.8 0z" fill="#e01e5a"/><path d="M45.2 25.8a12.9 12.9 0 1 1 12.9-12.9v12.9zm0 6.5a12.9 12.9 0 0 1 0 25.8H12.9a12.9 12.9 0 0 1 0-25.8z" fill="#36c5f0"/><path d="M97 45.2a12.9 12.9 0 1 1 12.9 12.9H97zm-6.5 0a12.9 12.9 0 0 1-25.8 0V12.9a12.9 12.9 0 1 1 25.8 0z" fill="#2eb67d"/><path d="M77.6 97a12.9 12.9 0 1 1-12.9 12.9V97zm0-6.5a12.9 12.9 0 0 1 0-25.8h32.3a12.9 12.9 0 0 1 0 25.8z" fill="#ecb22e"/></svg>';
const slackSignIn = () => SB.auth.signInWithOAuth({provider: 'slack_oidc', options: {redirectTo: location.origin + location.pathname}});
// 휴대폰은 슬랙 앱 로그인이 브라우저와 따로라 처음엔 브라우저에서 슬랙 로그인이 필요 — 휴대폰마다 한 번 미리 안내 (11-04 김현우)
const mobileDevice = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
const slackHintDue = () => { if (!mobileDevice()) return false; try { return localStorage.getItem('pt_slack_hint') !== '1'; } catch { return false; } };
const SLACK_HINT = '휴대폰에서는 슬랙 앱이 아니라 브라우저에서 슬랙 로그인 화면이 열립니다. 처음 한 번은 회사 슬랙 계정으로 로그인해 주세요(이메일로 받은 코드로도 로그인할 수 있습니다). 한 번 로그인하면 다음부터는 바로 들어옵니다.';
function loginScreen(msg) {
  $('#login').hidden = false;
  $('#login').innerHTML = `<form class="login-box" id="login-form"><div class="brand"><span class="brand-mark">${BRAND[0]}</span>${BRAND}<span class="brand-dot">®</span></div><p>헤임달 계정으로 로그인합니다.<br>헤임달에 가입 완료된 더올마이티 임직원만 로그인할 수 있습니다.</p><label>이메일<input id="lg-email" type="email" autocomplete="username" required></label><label>비밀번호<input id="lg-pw" type="password" autocomplete="current-password" required></label><div id="lg-err" role="alert" style="color:#ba775e;font-size:12px;margin-top:10px">${esc(msg || '')}</div><button class="button primary" type="submit" style="width:100%;justify-content:center;margin-top:16px">로그인</button><button class="button" type="button" id="lg-slack" style="width:100%;justify-content:center;gap:8px;margin-top:8px">${SLACK_SVG}<span>슬랙으로 로그인</span></button><p id="lg-hint" hidden style="margin:10px 0 0;padding:10px 12px;border-radius:8px;background:#f1f5f2;color:#3d4a43;font-size:13px;line-height:1.6;text-align:left">${SLACK_HINT}</p><a class="text-btn" id="lg-reset" href="https://axdx-dashboard.vercel.app/forgot-password" style="display:inline-block;margin-top:14px;font-size:12px">처음이거나 비밀번호를 잊었어요</a></form>`;
  $('#login-form').onsubmit = async ev => {
    ev.preventDefault(); $('#lg-err').textContent = ''; $('#lg-err').style.color = '#ba775e';
    const { error } = await SB.auth.signInWithPassword({email: $('#lg-email').value.trim(), password: $('#lg-pw').value});
    if (error) { $('#lg-err').textContent = '이메일 또는 비밀번호가 맞지 않습니다.'; return; }
    start();
  };
  $('#lg-slack').onclick = async () => {
    const b = $('#lg-slack');
    if (slackHintDue() && $('#lg-hint').hidden) { $('#lg-hint').hidden = false; b.lastChild.textContent = '확인했습니다 · 슬랙으로 이동'; return; }
    try { localStorage.setItem('pt_slack_hint', '1'); } catch {}
    b.disabled = true; b.lastChild.textContent = '슬랙으로 이동하는 중…';
    sessionStorage.setItem('pt_slack', '1');
    const { error } = await slackSignIn();
    if (error) { sessionStorage.removeItem('pt_slack'); b.disabled = false; b.lastChild.textContent = '슬랙으로 로그인'; $('#lg-err').textContent = '슬랙으로 로그인하지 못했습니다. 잠시 후 다시 시도해 주세요.'; }
  };
  // 비밀번호 찾기 창구는 노른 하나 (11-08 홍석진 대표님) — 링크만 둔다
}
// 메일 링크로 들어온 분 — 새 비밀번호. 헤임달과 같은 계정이라 헤임달 비밀번호도 이것으로 바뀐다
function recoveryScreen(msg) {
  $('#login').hidden = false;
  $('#login').innerHTML = `<form class="login-box" id="np-form"><div class="brand"><span class="brand-mark">${BRAND[0]}</span>${BRAND}<span class="brand-dot">®</span></div><p><b>새 비밀번호를 설정해 주세요.</b><br>헤임달과 같은 계정이므로, 여기서 변경하면 헤임달 비밀번호도 함께 변경됩니다.</p><label>새 비밀번호 (8자 이상)<input id="np1" type="password" autocomplete="new-password" required minlength="8"></label><label>새 비밀번호 확인<input id="np2" type="password" autocomplete="new-password" required minlength="8"></label><div id="np-err" role="alert" style="color:#ba775e;font-size:12px;margin-top:10px">${esc(msg || '')}</div><button class="button primary" type="submit" style="width:100%;justify-content:center;margin-top:16px">비밀번호 변경</button></form>`;
  $('#np1').focus();
  $('#np-form').onsubmit = async ev => {
    ev.preventDefault(); const a = $('#np1').value, b = $('#np2').value;
    if (a.length < 8) return recoveryScreen('비밀번호는 8자 이상으로 설정해 주세요.');
    if (a !== b) return recoveryScreen('입력한 두 비밀번호가 일치하지 않습니다.');
    const btn = $('#np-form [type=submit]'); btn.disabled = true; btn.textContent = '변경하는 중…';
    const { error } = await SB.auth.updateUser({password: a});
    if (error) return recoveryScreen(/same|different/i.test(error.message) ? '현재 비밀번호와 다른 비밀번호를 입력해 주세요.' : '비밀번호를 변경하지 못했습니다. 메일 링크가 만료되었을 수 있으니 로그인 화면의 「처음이거나 비밀번호를 잊었어요」에서 다시 요청해 주세요.');
    RECOVERY = false; try { history.replaceState(null, '', location.pathname); } catch {}
    toast('비밀번호를 변경했습니다. 헤임달에서도 새 비밀번호로 로그인해 주세요.'); start();
  };
}
async function start() {
  const { data: { session } } = await SB.auth.getSession();
  if (!session) return loginScreen(SLACK_ERR || LINK_ERR);
  if (RECOVERY) return recoveryScreen();
  const slackStep = sessionStorage.getItem('pt_slack');      // 슬랙 이메일이 헤임달 로그인 이메일과 다른 직원 — 원래 계정으로 옮긴 뒤 슬랙 로그인을 한 번 더
  if (slackStep) {
    sessionStorage.removeItem('pt_slack');
    const { data: r } = await SB.rpc('hd_slack_link');
    if (r === 'linked' && slackStep === '1') { await SB.auth.signOut({scope: 'local'}); sessionStorage.setItem('pt_slack', '2'); $('#login').hidden = false; $('#login').innerHTML = '<div class="login-box"><p>헤임달 계정에 슬랙을 연결했습니다. 다시 로그인하는 중…</p></div>'; return slackSignIn(); }
    const fail = {linked: '슬랙 계정을 연결하지 못했습니다. 관리자에게 문의해 주세요.', other_team: '더올마이티 슬랙 계정으로만 로그인할 수 있습니다. 회사 슬랙 계정으로 다시 시도해 주세요.', ambiguous: '이 슬랙 이메일과 연결된 헤임달 계정이 두 개 이상입니다. 관리자에게 문의해 주세요.', new: '헤임달에 등록되지 않은 계정입니다. 헤임달에서 이름·회사·부서를 입력하고 승인을 받은 후 이용할 수 있습니다.'}[r];
    if (fail) { await SB.auth.signOut({scope: 'local'}); return loginScreen(fail); }
  }
  me = session.user;
  const [can, adm, mem, sc, ic] = await Promise.all([SB.rpc('pt_can_use'), SB.rpc('pt_is_admin'), SB.from('hd_member').select('name,role,status').eq('id', me.id).maybeSingle(), SB.rpc('pt_studio_can'), SB.rpc('pt_ipchart_can')]);
  studioCan = !sc.error && !!sc.data; ipcCan = !ic.error && !!ic.data;            // 제안서 스튜디오 — 시험 기간 3명만 (함수가 없거나 거절이면 숨김)
  if (!can.data) { const left = mem.data?.status === 'left'; await SB.auth.signOut({scope: 'local'}); return loginScreen(left ? '퇴사 처리된 계정입니다. 더 이상 이용하실 수 없습니다.' : '헤임달에서 아직 승인되지 않은 계정입니다. 승인 후 다시 로그인해 주세요.'); }
  isAdmin = !!adm.data; myName = mem.data?.name || me.email;
  $('#login').hidden = true;
  $('#profile').innerHTML = `<span class="avatar">${esc(myName.slice(0, 1))}</span><span>${esc(myName)}<small>${isAdmin ? 'DB 관리자' : '구성원'}</small></span>${isAdmin ? '<span class="admin">ADMIN</span>' : ''}`;
  $('.top-avatar').textContent = myName.slice(0, 1);
  SB.from('pt_profile').select('slack_image').eq('member_id', me.id).maybeSingle().then(({data}) => {   // 궁니르 봇이 채운 슬랙 프로필 사진
    const u = data?.slack_image; if (!u) return;
    const img = `<img src="${esc(u)}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover">`;
    $('.top-avatar').innerHTML = img; const a = $('#profile .avatar'); if (a) { a.innerHTML = img; a.style.overflow = 'hidden'; }
  });
  try { await load(); } catch (e) { $('#content').innerHTML = `<div class="notice">이그드라실 DB를 불러오지 못했습니다: ${esc(e?.message || '')}</div>`; return; }
  if (HANDOFF.go) try { history.replaceState(null, '', location.pathname + location.search + '#' + HANDOFF.go); } catch {}     // 지도에서 고른 화면
  HANDOFF.go = '';
  const [h, id] = location.hash.slice(1).split('/'); page = h && !h.includes('=') ? h : APP === 'gungnir' ? 'studio' : 'home'; render();
  if (id) openRoute(page, id);
  if (APP === 'gungnir' && h === 'tour' && studioCan) setTimeout(tourStart, 300);     // 주소 끝 #tour 로 시연 모드 바로 시작
}

$('#search-icon').innerHTML = icon('search'); $('#bell-icon').innerHTML = icon('bell');
$('#global-search').oninput = e => {
  query = e.target.value;
  if (!query.trim()) { if (page === 'search') page = backPage; query = ''; return render(); }       // 지우면 원래 화면으로
  if (page !== 'search') { backPage = page; page = 'search'; }
  render();
};
function searchGo() {          // Enter — 결과가 하나(또는 이름이 정확히 같은 것이 하나)면 바로 상세, 없으면 안내
  const q = $('#global-search').value.trim(); if (!q) return;
  query = q; if (page !== 'search') { backPage = page; page = 'search'; } render();
  const hits = searchHits(q), exact = hits.filter(e => [e.name, e.en, ...e.aliases].some(x => x && normCo(x) === normCo(q)));
  const one = exact.length === 1 ? exact[0] : hits.length === 1 ? hits[0] : null;
  if (one) openDetail(one.id); else if (!hits.length) toast(NOT_FOUND);
}
{ let composing = false, want = false; const s = $('#global-search');      // 한글 조합 중 Enter 는 조합이 끝난 뒤에
  s.addEventListener('compositionstart', () => { composing = true; });
  s.addEventListener('compositionend', () => { composing = false; if (want) { want = false; searchGo(); } });
  s.addEventListener('keydown', e => { if (e.key !== 'Enter') return; e.preventDefault(); if (composing || e.isComposing || e.keyCode === 229) { want = true; return; } searchGo(); }); }
$('#add-btn').onclick = () => page === 'contacts' ? contactModal() : page === 'studio' ? (studio.tab === 'refs' ? studioRefModal() : studioProjectModal()) : entityModal();
$('#export-btn').onclick = exportCSV;
$('#notification').onclick = () => go('home');
$('.top-avatar').onclick = () => $('#profile').click();      // 폰에서는 왼쪽 메뉴가 아래 막대가 되어 프로필이 위 오른쪽 사진으로
$('#profile').onclick = async () => { if (!me) return; modal(`<h2>내 계정</h2><p><b>${esc(myName)}</b> · ${isAdmin ? 'DB 관리자' : '구성원'}<br>${esc(me.email || '')}</p><p>이 브라우저에서만 로그아웃됩니다. 다른 기기의 로그인은 그대로입니다.</p><div class="modal-actions"><button class="button" type="button" data-cancel>닫기</button><button class="button" type="button" id="logout-go">로그아웃</button></div>`); $('#logout-go').onclick = async () => { await SB.auth.signOut({scope: 'local'}); location.reload(); }; };
$('#overlay').onclick = closeDrawer;
$('#drawer').addEventListener('click', ev => { const b = ev.target.closest('[data-graph-go]'); if (b) location.hash = '#graph/' + b.dataset.graphGo; });   // 상세 「그래프에서 보기」 (11-03 · PRD E-07-11)
SB.auth.onAuthStateChange(e => { if (e === 'PASSWORD_RECOVERY') { RECOVERY = true; recoveryScreen(); } });
window.addEventListener('hashchange', () => {
  if (ignoreHash) { ignoreHash = false; return; }
  const [h, id] = location.hash.slice(1).split('/');
  if (!me || !h || h.includes('=')) return;
  if (!id && !$('#drawer').hidden) { routed = false; hideDrawer(); }
  if (h !== page) { page = h; filter = '전체'; render(); }
  if (id) openRoute(h, id);
});
// 창(이미지 크게 보기 등)이 떠 있으면 Esc 는 그 창만 닫고 상세로 돌아간다 (10-29)
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !document.querySelector('dialog[open]')) closeDrawer(); if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); $('#global-search').focus(); } });
start();
