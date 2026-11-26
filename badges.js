// ENERGY LAB – badges, kåringer, profiler og konfetti. Brukes av forsiden og «Legg inn test».
(function (root) {
  const K = s => root.EDParse.drinkKey(s);
  const nk = s => String(s || '').trim().toLowerCase();
  const avg = a => { const x = a.filter(v => v != null); return x.length ? x.reduce((s, v) => s + v, 0) / x.length : null; };
  const tot = r => avg([r.taste, r.value]);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const f1 = v => v == null ? '–' : (Math.round(v * 10) / 10).toFixed(1).replace('.', ',');
  const MND = ['januar', 'februar', 'mars', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'desember'];
  const ZERO = /zero|ultra|sugar ?free|sukkerfri|uten sukker|0 ?sukker|light|lite\b/i;
  const ym = t => String(t || '').slice(0, 7);
  const parseT = t => { const m = /^(\d{4})-(\d{2})-(\d{2})(?: (\d{2}):(\d{2}))?/.exec(t || ''); return m ? {y: +m[1], mo: +m[2], d: +m[3], h: m[4] != null ? +m[4] : null} : null; };
  const isoWeekIndex = p => { const t = new Date(Date.UTC(p.y, p.mo - 1, p.d)); const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day); return Math.floor(t / 6048e5); };
  const weekday = p => new Date(Date.UTC(p.y, p.mo - 1, p.d)).getUTCDay();
  let LIKES = new Map(); // kommentar-ID -> Set(navn i små bokstaver)
  const likesOf = r => r.note ? [...(LIKES.get(root.EDParse.cid(r)) || [])].filter(f => f !== nk(r.name)).length : 0;
  const initials = n => String(n).split(/\s+/).map(w => w[0] || '').join('').slice(0, 2).toUpperCase() || '?';

  // ---------- badges ----------
  const BADGES = [
    ['Antall tester', [
      ['forste', '🥤', 'Første slurk', 'Din første test', p => p.n, 1],
      ['stamkunde', '🔥', 'Stamkunde', 'Legg inn 5 tester', p => p.n, 5],
      ['veteran', '🏅', 'Boksveteran', 'Legg inn 25 tester', p => p.n, 25],
      ['konge', '👑', 'Koffeinkonge', 'Legg inn 50 tester', p => p.n, 50],
      ['hjertebank', '💓', 'Hjertebank', 'Legg inn 100 tester', p => p.n, 100]]],
    ['Utforsking', [
      ['pioner', '🧭', 'Pioner', 'Vær den første som tester en ny drikk', p => p.pioneer, 1],
      ['merkehopper', '🗺️', 'Merkehopper', 'Test 5 ulike merker', p => p.brands, 5],
      ['samleren', '🎨', 'Samleren', 'Test 10 ulike typer fra samme merke', p => p.maxBrandTypes, 10],
      ['lojal', '🔁', 'Lojal', 'Test samme drikk 3 ganger', p => p.maxSame, 3],
      ['nullsukker', '🧊', 'Null sukker', 'Test 5 ulike Zero-, Ultra- eller sukkerfrie varianter', p => p.zero, 5]]],
    ['Tidspunkt', [
      ['morgenfugl', '🌅', 'Morgenfugl', 'Legg inn en test før kl. 07', p => p.early, 1],
      ['nattugle', '🦉', 'Nattugle', 'Legg inn en test etter kl. 23', p => p.late, 1],
      ['mandag', '😵', 'Mandagsmedisin', 'Legg inn en test på en mandag før kl. 10', p => p.monday, 1],
      ['streak', '📆', 'Streak', 'Test minst én gang i uka, 4 uker på rad', p => p.streak, 4]]],
    ['Pris og størrelse', [
      ['gnier', '💸', 'Gnieren', 'Test en drikk som kostet under 20 kr', p => p.cheap, 1],
      ['luksus', '💎', 'Luksusdyret', 'Test en drikk som kostet over 40 kr', p => p.pricey, 1],
      ['liter', '🛢️', 'Literkongen', 'Test en boks på minst 750 ml', p => p.big, 1]]],
    ['Score', [
      ['fullthus', '💯', 'Fullt hus', 'Gi 10 i smak', p => p.ten, 1],
      ['aerlig', '🤢', 'Ærlig talt', 'Gi 3 eller lavere i smak', p => p.low, 1],
      ['rebell', '😈', 'Rebellen', 'Gi en score minst 4 unna snittet til de andre', p => p.rebel, 1],
      ['dommer', '🎯', 'Smaksdommeren', 'Treff snittet til de andre (±0,5) på 5 drikker', p => p.judge, 5]]],
    ['Folket', [
      ['fotograf', '📸', 'Fotografen', 'Legg inn 5 tester med bilde', p => p.photos, 5],
      ['ordsmed', '💬', 'Ordsmed', 'Skriv 10 kommentarer', p => p.notes, 10],
      ['likt', '👍', 'Likt', 'Få din første like på en kommentar', p => p.likes, 1],
      ['folkefavoritt', '⭐', 'Folkefavoritt', 'Få 25 likes til sammen', p => p.likes, 25],
      ['panel', '👥', 'Smakspanelet', 'Legg inn en test sammen med minst 3 andre', p => p.panel, 1]]]
  ];
  const ALL = BADGES.flatMap(([, l]) => l);
  const badgesOf = p => ALL.map(([key, icon, name, how, f, goal]) => { const v = f(p) || 0; return {key, icon, name, how, goal, have: Math.min(v, goal), done: v >= goal}; });

  // ---------- statistikk per person ----------
  function peopleStats(ratings) {
    const rs = ratings.filter(r => r.name && r.name !== 'Anonym');
    const byDrink = new Map(), firstTime = new Map(), groupSize = new Map();
    for (const r of rs) {
      const dk = K(r.drink);
      if (!byDrink.has(dk)) byDrink.set(dk, []);
      byDrink.get(dk).push(r);
      if (!firstTime.has(dk) || r.time < firstTime.get(dk)) firstTime.set(dk, r.time);
      const g = r.time + '|' + dk; groupSize.set(g, (groupSize.get(g) || 0) + 1);
    }
    const people = new Map();
    for (const r of rs) {
      const k = nk(r.name);
      if (!people.has(k)) people.set(k, {key: k, name: r.name, entries: []});
      people.get(k).entries.push(r);
    }
    return [...people.values()].map(p => {
      const e = p.entries, dks = new Set(e.map(r => K(r.drink)));
      const perBrand = new Map(), same = new Map(), weeks = new Set();
      let pioneer = 0, early = 0, late = 0, monday = 0, rebel = 0, judge = 0;
      const pioneerDrinks = new Set(), zero = new Set();
      for (const r of e) {
        const dk = K(r.drink), b = K(r.brand) || dk.slice(0, 5);
        if (!perBrand.has(b)) perBrand.set(b, new Set());
        perBrand.get(b).add(dk);
        same.set(dk, (same.get(dk) || 0) + 1);
        if (r.time && r.time === firstTime.get(dk)) pioneerDrinks.add(dk);
        if (ZERO.test(r.drink)) zero.add(dk);
        const t = parseT(r.time);
        if (t) {
          weeks.add(isoWeekIndex(t));
          if (t.h != null) { if (t.h < 7) early++; if (t.h >= 23) late++; if (weekday(t) === 1 && t.h < 10) monday++; }
        }
        const mine = tot(r), others = byDrink.get(dk).filter(o => nk(o.name) !== p.key).map(tot).filter(v => v != null);
        if (mine != null && others.length) {
          const diff = Math.abs(mine - avg(others));
          if (diff >= 4) rebel++;
          if (others.length >= 3 && diff <= 0.5) judge++;
        }
      }
      pioneer = pioneerDrinks.size;
      const wk = [...weeks].sort((a, b) => a - b);
      let streak = wk.length ? 1 : 0, run = 1;
      for (let i = 1; i < wk.length; i++) { run = wk[i] === wk[i - 1] + 1 ? run + 1 : 1; streak = Math.max(streak, run); }
      const given = e.flatMap(r => [r.taste, r.value]);
      return {
        ...p, n: e.length, drinks: dks.size, brands: perBrand.size,
        maxBrandTypes: Math.max(0, ...[...perBrand.values()].map(s => s.size)),
        maxSame: Math.max(0, ...same.values()), zero: zero.size, pioneer, pioneerDrinks,
        early, late, monday, streak,
        cheap: e.filter(r => r.price != null && r.price < 20).length,
        pricey: e.filter(r => r.price != null && r.price > 40).length,
        big: e.filter(r => r.ml != null && r.ml >= 750).length,
        ten: e.filter(r => r.taste === 10).length, low: e.filter(r => r.taste != null && r.taste <= 3).length,
        likes: e.reduce((s, r) => s + likesOf(r), 0),
        rebel, judge, photos: e.filter(r => r.photo).length, notes: e.filter(r => r.note).length,
        panel: e.filter(r => (groupSize.get(r.time + '|' + K(r.drink)) || 0) >= 4).length,
        avg: avg(given), points: e.length * 3 + e.filter(r => r.note).length,
        fav: [...e].sort((a, b) => (tot(b) ?? -1) - (tot(a) ?? -1))[0]?.drink || ''
      };
    });
  }

  // ---------- kåringer ----------
  const leaders = (list, f, min = 1) => {
    const vals = list.map(p => ({p, v: f(p)})).filter(x => x.v != null && x.v >= min);
    if (!vals.length) return [];
    const best = Math.max(...vals.map(x => x.v));
    return vals.filter(x => x.v === best).map(x => x.p);
  };
  function pointsIn(ratings, prefix) {
    const m = new Map();
    for (const r of ratings) if (r.name && r.name !== 'Anonym' && String(r.time).startsWith(prefix)) {
      const k = nk(r.name), c = m.get(k) || {name: r.name, pts: 0};
      c.pts += 3 + (r.note ? 1 : 0); m.set(k, c);
    }
    const l = [...m.values()]; if (!l.length) return [];
    const best = Math.max(...l.map(x => x.pts));
    return l.filter(x => x.pts === best);
  }
  const prevMonth = (d = new Date()) => { const x = new Date(d.getFullYear(), d.getMonth() - 1, 1); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`; };
  const monthName = ymStr => { const [y, m] = ymStr.split('-').map(Number); return `${MND[m - 1]} ${y}`; };
  function yearWinners(ratings) {
    const now = new Date().getFullYear();
    const years = [...new Set(ratings.map(r => +String(r.time).slice(0, 4)).filter(y => y && y < now))].sort((a, b) => b - a);
    return years.map(y => ({year: y, people: pointsIn(ratings, String(y))})).filter(x => x.people.length);
  }
  function titles(ratings, ps) {
    const out = [];
    const add = (icon, title, people, sub) => { if (people.length) out.push({icon, title, people, sub}); };
    add('🚜', 'Boksmaskinen', leaders(ps, p => p.n), p => `${p.n} tester`);
    add('🧭', 'Oppdageren', leaders(ps, p => p.pioneer), p => `Først ute på ${p.pioneer} ${p.pioneer === 1 ? 'drikk' : 'drikker'}`);
    add('👍', 'Folkets stemme', leaders(ps, p => p.likes), p => `${p.likes} likes på kommentarene sine`);
    const rated = ps.filter(p => p.n >= 3);
    if (rated.length > 1) {
      add('😇', 'Snillest', leaders(rated, p => p.avg, -Infinity), p => `Gir ${f1(p.avg)} i snitt`);
      add('🧐', 'Strengest', leaders(rated, p => -p.avg, -Infinity), p => `Gir ${f1(p.avg)} i snitt`);
    }
    // Merkeambassadør: flest tester av ett merke, for de tre mest testede merkene
    const brandCount = new Map();
    ratings.forEach(r => { const b = K(r.brand); if (b) brandCount.set(b, {name: r.brand, n: ((brandCount.get(b) || {}).n || 0) + 1}); });
    [...brandCount.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 3).forEach(([bk, b]) => {
      const cnt = p => p.entries.filter(r => K(r.brand) === bk).length;
      add('🏷️', `${b.name}-ambassadør`, leaders(ps, cnt, 2), p => `${cnt(p)} tester av ${b.name}`);
    });
    return out;
  }

  // ---------- stil ----------
  const css = `
.bdg{display:flex;gap:12px;align-items:center;background:var(--panel2);border:1px solid var(--line);border-radius:14px;padding:10px 12px;opacity:.55}
.bdg.on{opacity:1;border-color:rgba(226,201,143,.45)}
.bdg .bi{font-size:26px;width:40px;height:40px;flex:none;display:grid;place-items:center;border-radius:12px;background:rgba(226,201,143,.1);filter:grayscale(1)}
.bdg.on .bi{filter:none}
.bdg b{display:block;font-size:15px}.bdg small{display:block;color:var(--muted);font-size:13px;line-height:1.35}
.bdg .pr{height:5px;border-radius:9px;background:var(--line2);margin-top:6px;overflow:hidden}.bdg .pr i{display:block;height:100%;background:var(--gold)}
.blist{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(240px,100%),1fr));gap:8px}
.ed-ov{position:fixed;inset:0;z-index:60;background:rgba(3,8,20,.75);display:flex;align-items:flex-end;justify-content:center;padding:0}
.ed-sheet{position:relative;background:var(--bg);border:1px solid var(--line);border-radius:24px 24px 0 0;width:100%;max-width:720px;max-height:92vh;overflow:auto;padding:22px 18px 40px}
@media(min-width:760px){.ed-ov{align-items:center;padding:24px}.ed-sheet{border-radius:24px}}
.ed-sheet .x{position:absolute;right:14px;top:14px;width:44px;height:44px;border-radius:50%;border:1px solid var(--line);background:var(--panel);color:var(--ink);font-size:22px;cursor:pointer}
.ed-sheet h3{font-family:Anton,Impact,sans-serif;font-weight:400;text-transform:uppercase;font-size:28px;margin:0 0 6px;letter-spacing:.3px}
.ed-sheet .ksub{color:var(--muted);font-size:14px}
.ed-sheet .lbl2{font-size:12px;font-weight:800;letter-spacing:1.2px;color:var(--gold);text-transform:uppercase;margin:18px 0 8px}
.ed-ph{display:flex;gap:14px;align-items:center;margin-bottom:12px;padding-right:50px}
.ed-ph .av{width:64px;height:64px;font-size:24px}
.ed-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}
.ed-stats div{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:10px;text-align:center}
.ed-stats b{display:block;font-family:Anton,sans-serif;font-size:24px;color:var(--gold)}.ed-stats span{font-size:12px;color:var(--muted)}
.ed-hist{display:flex;flex-direction:column;gap:6px}
.ed-hist div{display:flex;justify-content:space-between;gap:10px;background:var(--panel);border-radius:12px;padding:10px 12px;font-size:14px}
.ed-hist small{color:var(--muted)}
.ed-big{text-align:center;padding:10px 0}.ed-big .e{font-size:64px;line-height:1.1}
.ed-big .nm{font-family:Anton,sans-serif;font-size:36px;text-transform:uppercase;margin:6px 0}
.ed-confetti{position:fixed;inset:0;pointer-events:none;z-index:80}
.ib{display:inline-grid;place-items:center;width:20px;height:20px;margin-left:6px;border-radius:50%;border:1.5px solid var(--gold);background:transparent;color:var(--gold);font:italic 700 12px/1 Georgia,serif;cursor:pointer;padding:0;vertical-align:middle;position:relative}
.ib::after{content:'';position:absolute;inset:-12px}
.vt{display:grid;grid-template-columns:auto 1fr;gap:6px 12px;align-items:center;margin:10px 0}
.vt b{font-family:Anton,sans-serif;font-size:22px;color:var(--gold);text-align:right}
.a2hs{position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:55;max-width:520px;margin:0 auto;display:flex;gap:12px;align-items:center;background:var(--panel);border:1px solid var(--gold);border-radius:18px;padding:12px 12px 12px 14px;box-shadow:0 12px 40px rgba(0,0,0,.55);font-size:14px}
.a2hs .e{font-size:28px}.a2hs b{display:block;font-size:15px}.a2hs small{color:var(--muted)}
.a2hs .go{flex:none;border:0;border-radius:999px;background:var(--gold);color:#1a1408;font:inherit;font-weight:800;padding:10px 14px;cursor:pointer}
.a2hs .no{flex:none;width:36px;height:36px;border-radius:50%;border:0;background:none;color:var(--muted);font-size:22px;cursor:pointer}
.steps{margin:8px 0 0;padding-left:22px}.steps li{margin:8px 0}
.ed-hero{font-size:44px;text-align:center;letter-spacing:6px;margin:4px 0 6px}
.ed-intro h3{text-align:center;font-size:28px;line-height:1.05;padding:0 30px}
.ed-btns{display:flex;flex-direction:column;align-items:center;gap:10px;margin-top:18px}
.ed-cta{width:100%;min-height:52px;border:0;border-radius:16px;background:var(--gold);color:#1a1408;font:800 17px Inter,system-ui,sans-serif;cursor:pointer;box-shadow:0 4px 0 #9c844f}
.ed-cta:active{transform:translateY(2px);box-shadow:0 2px 0 #9c844f}
.ed-link{background:none;border:0;color:var(--gold);font:inherit;font-weight:700;cursor:pointer;padding:8px;text-decoration:underline;text-underline-offset:4px}
.av.yr{position:relative}.av .tro{position:absolute;right:-6px;bottom:-4px;background:var(--gold);color:#1a1408;font-family:Anton,sans-serif;font-size:11px;border-radius:8px;padding:1px 5px;box-shadow:0 0 0 2px var(--bg)}
`;
  const st = document.createElement('style'); st.textContent = css; document.head.append(st);

  // ---------- dialog og konfetti ----------
  function sheet(html, onReady) {
    const ov = document.createElement('div');
    ov.className = 'ed-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
    ov.innerHTML = `<div class="ed-sheet"><button type="button" class="x" aria-label="Lukk">×</button>${html}</div>`;
    const close = () => { ov.remove(); document.removeEventListener('keydown', key); };
    const key = e => { if (e.key === 'Escape') close(); };
    ov.addEventListener('click', e => { if (e.target === ov || e.target.closest('.x')) close(); });
    document.addEventListener('keydown', key);
    document.body.append(ov);
    ov.querySelector('.x').focus();
    if (onReady) onReady(ov, close);
    return close;
  }
  function confetti() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const c = document.createElement('canvas'); c.className = 'ed-confetti'; document.body.append(c);
    const dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight;
    c.width = W * dpr; c.height = H * dpr;
    const x = c.getContext('2d'); x.scale(dpr, dpr);
    const COLORS = ['#e2c98f', '#f1dcaa', '#4aa3ff', '#ffffff', '#8fe08a', '#1d3d82'];
    const bits = [];
    const burst = (ox, dir) => { for (let i = 0; i < 90; i++) { const a = -Math.PI / 2 + dir * (0.2 + Math.random() * 0.6), v = 9 + Math.random() * 9; bits.push({x: ox, y: H, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: Math.random() * 6.28, vr: (Math.random() - .5) * .3, w: 6 + Math.random() * 6, h: 4 + Math.random() * 4, c: COLORS[i % COLORS.length]}); } };
    burst(0, 1); burst(W, -1);
    const t0 = performance.now();
    (function step(now) {
      x.clearRect(0, 0, W, H);
      for (const b of bits) { b.vy += 0.28; b.vx *= 0.99; b.x += b.vx; b.y += b.vy; b.r += b.vr; x.save(); x.translate(b.x, b.y); x.rotate(b.r); x.fillStyle = b.c; x.fillRect(-b.w / 2, -b.h / 2, b.w, b.h); x.restore(); }
      if (now - t0 < 3200) requestAnimationFrame(step); else c.remove();
    })(t0);
  }

  const badgeHtml = (b, showProgress) => `<div class="bdg${b.done ? ' on' : ''}" title="${esc(b.how)}"><span class="bi" aria-hidden="true">${b.icon}</span><span style="flex:1;min-width:0"><b>${esc(b.name)}</b><small>${esc(b.how)}${showProgress && !b.done ? ` · ${b.have} av ${b.goal}` : ''}</small>${showProgress && !b.done && b.goal > 1 ? `<div class="pr"><i style="width:${Math.round(b.have / b.goal * 100)}%"></i></div>` : ''}</span></div>`;

  function avatarHtml(name, ratings, cls = '') {
    const wins = yearWinners(ratings).filter(w => w.people.some(p => nk(p.name) === nk(name)));
    const yr = wins.length ? `<span class="tro">’${String(wins[0].year).slice(2)}</span>` : '';
    return `<span class="av${yr ? ' yr' : ''} ${cls}">${esc(initials(name))}${yr}</span>`;
  }

  function openProfile(name, ratings) {
    const ps = peopleStats(ratings), p = ps.find(x => x.key === nk(name));
    if (!p) return;
    const bs = badgesOf(p), done = bs.filter(b => b.done);
    const hist = [...p.entries].sort((a, b) => String(b.time).localeCompare(String(a.time))).slice(0, 12);
    sheet(`<div class="ed-ph">${avatarHtml(p.name, ratings)}<div><h3 style="margin:0">${esc(p.name)}</h3><div class="ksub">${done.length} av ${bs.length} badges${p.fav ? ' · favoritt: ' + esc(p.fav) : ''}</div></div></div>
      <div class="ed-stats"><div><b>${p.n}</b><span>tester</span></div><div><b>${p.drinks}</b><span>drikker</span></div><div><b>${p.brands}</b><span>merker</span></div><div><b>${f1(p.avg)}</b><span>snitt gitt</span></div></div>
      ${BADGES.map(([g, list]) => `<div class="lbl2">${esc(g)}</div><div class="blist">${list.map(([key]) => badgeHtml(bs.find(b => b.key === key), true)).join('')}</div>`).join('')}
      <div class="lbl2">Siste tester</div><div class="ed-hist">${hist.map(r => `<div><span>${esc(r.drink)}<br><small>${esc(String(r.time).slice(0, 10))}</small></span><b>${f1(tot(r))}</b></div>`).join('')}</div>`);
  }

  function openInfo(ratings) {
    const ps = peopleStats(ratings);
    const count = key => ps.filter(p => badgesOf(p).find(b => b.key === key).done).length;
    const yw = yearWinners(ratings);
    sheet(`<h3>Badges</h3><p class="ksub" style="margin:0">Badges samler du selv, og de forsvinner aldri. Alle kan få alle. Trykk på et navn for å se profilen og hvor langt du har igjen.</p>
      ${BADGES.map(([g, list]) => `<div class="lbl2">${esc(g)}</div><div class="blist">${list.map(([key, icon, name, how]) => { const n = count(key); return badgeHtml({icon, name, how: how + (n ? ` · ${n} har den` : ' · ingen ennå'), done: true}); }).join('')}</div>`).join('')}
      <h3 style="margin-top:26px">Kåringer</h3><p class="ksub" style="margin:0 0 10px">Kåringene går til den som leder akkurat nå, og kan tas fra deg. Står det likt, deles tittelen.</p>
      <div class="blist">${[
        ['🤠', 'Månedens koffeinkonge / -dronning', 'Flest poeng forrige måned. En test gir 3 poeng og en kommentar 1 poeng. Kåres den 1. hver måned'],
        ['🏆', 'Årets koffeinkonge / -dronning', 'Flest poeng gjennom hele året, med samme poeng. Kåres 1. januar'],
        ['🚜', 'Boksmaskinen', 'Flest tester'], ['🧭', 'Oppdageren', 'Først ute på flest nye drikker'],
        ['👍', 'Folkets stemme', 'Flest likes på kommentarene sine'],
        ['🏷️', 'Merkeambassadør', 'Flest tester av et merke, for de tre mest testede merkene'],
        ['😇', 'Snillest', 'Gir høyest score i snitt (minst 3 tester)'], ['🧐', 'Strengest', 'Gir lavest score i snitt (minst 3 tester)']
      ].map(([icon, name, how]) => badgeHtml({icon, name, how, done: true})).join('')}</div>
      <h3 style="margin-top:26px">Æreshallen</h3><p class="ksub" style="margin:0 0 10px">Årets koffeinkonge/-dronning får årstallet på profilbildet sitt for alltid.</p>
      ${yw.length ? `<div class="blist">${yw.map(w => badgeHtml({icon: '’' + String(w.year).slice(2), name: w.people.map(p => p.name).join(' og '), how: `Årets ${w.year} · ${w.people[0].pts} poeng`, done: true})).join('')}</div>`
        : `<div class="ksub">Første vinner kåres 1. januar ${new Date().getFullYear() + 1}.</div>`}`);
  }

  // Velkomst første gang man er inne: forklarer badges og kåringer (som på Kebabtesten)
  function welcome(force, after) {
    try { if (!force && localStorage.getItem('ed-intro-v1')) return false; localStorage.setItem('ed-intro-v1', '1'); } catch { if (!force) return false; }
    // Første besøk: ikke vis månedens vinner i tillegg
    try { localStorage.setItem('ed-month-seen', prevMonth()); } catch {}
    const row = (icon, name, how) => badgeHtml({icon, name, how, done: true});
    let done = false;
    sheet(`<div class="ed-intro"><div class="ed-hero" aria-hidden="true">⚡🏅🤠</div>
      <h3>Velkommen til ENERGY LAB!</h3>
      <p class="ksub" style="text-align:center;margin:0 0 14px">Her tester vi energidrikker, gir batterier og samler badges. Slik funker det:</p>
      <div class="blist">
        ${row('🥤', 'Legg inn tester', 'Hver gang du drikker en: gi smak og smak vs. pris 1–10 batterier')}
        ${row('🏅', 'Samle badges', `${ALL.length} badges å jakte på, fra «Første slurk» til «Hjertebank». De er dine for alltid`)}
        ${row('👍', 'Gi cred', 'Lik kommentarer du er enig i. Flest likes blir «Folkets stemme»')}
        ${row('🤠', 'Bli månedens koffeinkonge/-dronning', 'Mest bidrag i måneden vinner. En test gir 3 poeng og en kommentar 1')}
        ${row('🏆', 'Bli årets', 'Årets vinner får et merke med årstallet (som ’26) på profilbildet for alltid')}
        ${row('📲', 'Lagre som app', 'På iPhone: trykk Del-knappen i Safari og velg «Legg til på Hjem-skjerm»')}
      </div>
      <div class="ed-btns"><button type="button" class="ed-cta" data-wgo>Kom i gang</button><button type="button" class="ed-link" data-winfo>Se alle badges</button></div></div>`,
      (ov, close) => {
        const fin = () => { if (done) return; done = true; if (after) setTimeout(after, 400); };
        ov.querySelector('[data-wgo]').addEventListener('click', () => { close(); fin(); });
        ov.querySelector('[data-winfo]').addEventListener('click', () => { done = true; close(); openInfo(root.__edRatings || []); });
        new MutationObserver((_, mo) => { if (!ov.isConnected) { mo.disconnect(); fin(); } }).observe(document.body, {childList: true});
        ov.querySelector('[data-wgo]').focus();
      });
    return true;
  }

  // «i» for smak vs. pris
  function valueInfo() {
    sheet(`<h3 style="padding-right:50px">Smak vs. pris</h3>
      <p class="ksub" style="font-size:16px;color:var(--ink)">Hvor mye smak får du for pengene? Tenk på hva du betalte, og hvor stor boksen var, og spør deg selv: <b>var den verdt det?</b></p>
      <div class="vt"><b>10</b><span>Verdt hver krone. Kjøper gjerne igjen til den prisen</span><b>7</b><span>God handel</span><b>5</b><span>Helt greit for prisen</span><b>3</b><span>Litt dyr for det du får</span><b>1</b><span>Altfor dyr for smaken</span></div>
      <p class="ksub">En billig boks som smaker greit kan fint få høyere smak vs. pris enn en dyr boks som smaker litt bedre. Vil du se bare prisen, sorter topplista på «Kr per liter».</p>
      <p class="ksub">Totalscoren er snittet av <b>smak</b> og <b>smak vs. pris</b>.</p>`);
  }

  // «Legg til på Hjem-skjerm»
  const ua = navigator.userAgent || '';
  const isIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  let deferred = null;
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; });
  function installInfo() {
    const share = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px" aria-label="Del"><path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 12v8h14v-8"/></svg>';
    sheet(`<h3 style="padding-right:50px">Lagre som app</h3>
      <p class="ksub" style="font-size:16px;color:var(--ink)">Legg siden på hjemskjermen, så åpner den seg som en egen app uten adresselinje.</p>
      <div class="lbl2">iPhone og iPad (Safari)</div>
      <ol class="steps"><li>Åpne siden i <b>Safari</b></li><li>Trykk på Del-knappen ${share} nederst</li><li>Bla ned og velg <b>«Legg til på Hjem-skjerm»</b></li><li>Trykk <b>Legg til</b></li></ol>
      <div class="lbl2">Android (Chrome)</div>
      <ol class="steps"><li>Trykk på menyen <b>⋮</b> øverst til høyre</li><li>Velg <b>«Legg til på startskjermen»</b> eller <b>«Installer app»</b></li></ol>
      ${deferred ? '<button type="button" class="ed-cta" data-inst style="margin-top:16px">Installer nå</button>' : ''}`,
      (ov, close) => { const b = ov.querySelector('[data-inst]'); if (b) b.addEventListener('click', async () => { close(); deferred.prompt(); deferred = null; }); });
  }
  function installBanner() {
    if (isStandalone()) return;
    try { if (localStorage.getItem('ed-a2hs-off')) return; } catch { return; }
    if (!isIOS && !deferred) return;
    if (document.querySelector('.a2hs')) return;
    const d = document.createElement('div'); d.className = 'a2hs'; d.setAttribute('role', 'status');
    d.innerHTML = `<span class="e" aria-hidden="true">📲</span><span style="flex:1"><b>Lagre som app</b><small>${isIOS ? 'Del-knappen i Safari → «Legg til på Hjem-skjerm»' : 'Legg siden på startskjermen'}</small></span><button type="button" class="go">Vis meg</button><button type="button" class="no" aria-label="Ikke vis igjen">×</button>`;
    const off = () => { try { localStorage.setItem('ed-a2hs-off', '1'); } catch {} d.remove(); };
    d.querySelector('.go').addEventListener('click', () => { off(); if (deferred && !isIOS) { deferred.prompt(); deferred = null; } else installInfo(); });
    d.querySelector('.no').addEventListener('click', off);
    document.body.append(d);
  }
  document.addEventListener('click', e => {
    if (e.target.closest('[data-vinfo]')) { e.preventDefault(); valueInfo(); }
    else if (e.target.closest('[data-a2hs]')) { e.preventDefault(); installInfo(); }
  });
  const IB = '<button type="button" class="ib" data-vinfo aria-label="Hva betyr smak vs. pris?">i</button>';

  // Feiring når du har låst opp noe nytt siden sist du var innom
  function celebrateNew(ratings) {
    let me = ''; try { me = localStorage.getItem('ed-me') || ''; } catch {}
    if (!me) return;
    const p = peopleStats(ratings).find(x => x.key === nk(me)); if (!p) return;
    const got = badgesOf(p).filter(b => b.done), k = 'ed-badges-' + nk(me);
    let seen; try { seen = JSON.parse(localStorage.getItem(k) || 'null'); } catch { seen = null; }
    try { localStorage.setItem(k, JSON.stringify(got.map(b => b.key))); } catch {}
    const fresh = seen ? got.filter(b => !seen.includes(b.key)) : got;
    if (!fresh.length) return;
    sheet(`<div class="ed-big"><div class="e">${fresh.slice(0, 4).map(b => b.icon).join(' ')}</div><div class="nm">${fresh.length === 1 ? 'Ny badge!' : fresh.length + ' nye badges!'}</div></div>
      <div class="blist">${fresh.map(b => badgeHtml(b)).join('')}</div>
      <div class="ed-btns"><button type="button" class="ed-link" data-wme>Se profilen din</button></div>`,
      (ov, close) => ov.querySelector('[data-wme]').addEventListener('click', () => { close(); openProfile(me, ratings); }));
    confetti();
  }

  // Vises én gang per måned når forrige måned har en vinner
  function monthReveal(ratings) {
    const pm = prevMonth(), w = pointsIn(ratings, pm);
    if (!w.length) return false;
    try { if (localStorage.getItem('ed-month-seen') === pm) return false; localStorage.setItem('ed-month-seen', pm); } catch { return false; }
    sheet(`<div class="ed-big"><div class="e">🤠</div><div class="lbl2" style="margin:6px 0 0">Månedens koffeinkonge / -dronning · ${esc(monthName(pm))}</div>
      <div class="nm">${esc(w.map(p => p.name).join(' og '))}</div><div class="ksub">${w[0].pts} poeng${w.length > 1 ? ' hver' : ''}. Ny måned, nye muligheter. Legg inn testene dine!</div></div>`);
    confetti();
    return true;
  }

  // ---------- batterimåler (1–10) ----------
  const BAT_E = '<svg viewBox="0 0 14 24" aria-hidden="true"><rect x="4.5" y=".5" width="5" height="2.6" rx="1" fill="#2a3f73"/><rect x="1.2" y="2.8" width="11.6" height="20.4" rx="2.6" fill="#0b1834" stroke="#2a3f73" stroke-width="1.4"/><path d="M7.8 7.6l-2.6 5.2h2.2l-1 4.6 3.2-6h-2.2z" fill="#2a3f73"/></svg>';
  const BAT_F = '<svg class="f" viewBox="0 0 14 24" aria-hidden="true"><rect x="4.5" y=".5" width="5" height="2.6" rx="1" fill="#f1dcaa"/><rect x="1.2" y="2.8" width="11.6" height="20.4" rx="2.6" fill="#0b1834" stroke="#f1dcaa" stroke-width="1.4"/><rect x="3.2" y="4.8" width="7.6" height="16.4" rx="1.4" fill="#e2c98f"/><path d="M7.8 7.6l-2.6 5.2h2.2l-1 4.6 3.2-6h-2.2z" fill="#1a1408" opacity=".75"/></svg>';
  // Delvis fylt batteri: hel gullkontur, og bare innmaten fylles nedenfra
  const BAT_O = '<svg viewBox="0 0 14 24" aria-hidden="true"><rect x="4.5" y=".5" width="5" height="2.6" rx="1" fill="#f1dcaa"/><rect x="1.2" y="2.8" width="11.6" height="20.4" rx="2.6" fill="#0b1834" stroke="#f1dcaa" stroke-width="1.4"/><path d="M7.8 7.6l-2.6 5.2h2.2l-1 4.6 3.2-6h-2.2z" fill="#2a3f73"/></svg>';
  const BAT_P = '<svg class="f" viewBox="0 0 14 24" aria-hidden="true"><rect x="3.2" y="4.8" width="7.6" height="16.4" rx="1.4" fill="#e2c98f"/><path d="M7.8 7.6l-2.6 5.2h2.2l-1 4.6 3.2-6h-2.2z" fill="#1a1408" opacity=".75"/></svg>';
  const bmCss = document.createElement('style');
  bmCss.textContent = `.bm{display:inline-flex;align-items:center;gap:3px;vertical-align:middle}.bm .bc{position:relative;display:inline-block;width:12px;height:21px}.bm.sm .bc{width:9px;height:16px}.bm.lg .bc{width:19px;height:33px;gap:4px}.bm .bc svg{position:absolute;inset:0;width:100%;height:100%}.bm .num{margin-left:6px;font-family:Anton,sans-serif;color:var(--gold)}@keyframes bmup{from{clip-path:inset(100% 0 0 0)}}.bm .bc .f{animation:bmup .6s ease-out both;animation-delay:calc(var(--k) * 60ms)}@media(prefers-reduced-motion:reduce){.bm .bc .f{animation:none}}.bm.still .bc .f{animation:none}`;
  document.head.append(bmCss);
  function meter(v, size = '', showNum = false) {
    let h = '';
    for (let i = 0; i < 10; i++) {
      const fr = v == null ? 0 : Math.max(0, Math.min(1, v - i));
      // innmaten går fra y=4.8 til 21.2 av 24: klipp slik at prosenten gjelder selve innmaten
      const top = (4.8 + (1 - fr) * 16.4) / 24 * 100;
      h += `<span class="bc" style="--k:${i}">${fr >= 1 ? BAT_F : fr > 0 ? BAT_O + BAT_P.replace('class="f"', `class="f" style="clip-path:inset(${top.toFixed(1)}% 0 0 0)"`) : BAT_E}</span>`;
    }
    return `<span class="bm ${size}" role="img" aria-label="${v == null ? 'Ingen score' : f1(v) + ' av 10 batterier'}">${h}${showNum ? `<span class="num">${f1(v)}</span>` : ''}</span>`;
  }

  root.EDBadges = { IB, valueInfo, installInfo, installBanner, isStandalone, welcome, celebrateNew, meter, setLikes: m => { LIKES = m || new Map(); }, likesOf, BADGES, badgesOf, peopleStats, titles, pointsIn, prevMonth, monthName, yearWinners, openProfile, openInfo, monthReveal, confetti, sheet, badgeHtml, avatarHtml, nk };
})(typeof self !== 'undefined' ? self : this);
