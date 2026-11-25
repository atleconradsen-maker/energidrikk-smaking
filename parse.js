// Energidrikk Smaking – leser regnearket (én rad per testperson) og samler alt per drikk.
(function (root) {
  const avg = a => { const x = a.filter(v => v != null); return x.length ? x.reduce((s, v) => s + v, 0) / x.length : null; };
  const toNum = v => {
    if (v == null || v === '') return null;
    if (typeof v === 'number') return isFinite(v) ? v : null;
    const n = parseFloat(String(v).replace(/\s|kr/gi, '').replace(',', '.'));
    return isFinite(n) ? n : null;
  };
  const score = v => { const n = toNum(v); return n == null ? null : Math.min(10, Math.max(1, Math.round(n))); };

  // Samme drikk uansett store/små bokstaver, mellomrom, bindestrek og aksenter
  function drinkKey(name) {
    return String(name || '').toLowerCase().replace(/æ/g, 'ae').replace(/ø/g, 'o').replace(/å/g, 'a')
      .normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  }
  function lev(a, b) {
    const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
    let prev = Array.from({length: n + 1}, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[n];
  }
  // true når to navn trolig er samme drikk skrevet litt ulikt
  function similarDrink(a, b) {
    const x = drinkKey(a), y = drinkKey(b);
    if (!x || !y) return false;
    if (x === y) return true;
    if (Math.min(x.length, y.length) >= 6 && (x.includes(y) || y.includes(x))) return true;
    return lev(x, y) <= Math.max(1, Math.floor(Math.max(x.length, y.length) / 6));
  }

  function imageUrl(v) {
    const s = String(v || '').trim();
    if (!/^https?:\/\//i.test(s)) return /^[\w\-./]+\.(jpe?g|png|webp)$/i.test(s) && !s.includes('..') ? s : null;
    const m = /drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=|thumbnail\?id=)([\w-]{20,})/i.exec(s) || /[?&]id=([\w-]{20,})/.exec(s);
    if (m && /google\./i.test(s)) return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w1200`;
    return null;
  }

  // Google Visualization-tabell -> rader (overskrift først)
  function gvizToRows(table) {
    const head = (table.cols || []).map(c => c.label || '');
    const body = (table.rows || []).map(r => (r.c || []).map(c => (!c || c.v == null) ? '' : (typeof c.v === 'number' ? c.v : String(c.v))));
    return [head, ...body];
  }

  const norm = s => String(s || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9æøå]+/g, ' ').trim();
  const FIELDS = {
    time: ['tid'], week: ['uke'], drink: ['drikk', 'navn pa drikk'], brand: ['merke'],
    price: ['pris kr', 'pris'], ml: ['storrelse ml', 'størrelse ml', 'ml'], tester: ['testperson', 'navn'],
    taste: ['smak'], value: ['smak vs pris', 'verdi'], notes: ['kommentar'], photo: ['bilde']
  };

  // rader fra regnearket -> én rad per vurdering
  function rowsToRatings(rows) {
    if (!rows.length) return [];
    const head = rows[0].map(norm), idx = {}, used = new Set();
    for (const [k, names] of Object.entries(FIELDS)) {
      const i = head.findIndex((h, j) => !used.has(j) && names.map(norm).includes(h));
      if (i >= 0) { idx[k] = i; used.add(i); }
    }
    const get = (r, k) => idx[k] != null ? r[idx[k]] : '';
    return rows.slice(1).map(r => ({
      time: String(get(r, 'time') || '').trim(), week: String(get(r, 'week') || '').trim(),
      drink: String(get(r, 'drink') || '').trim().slice(0, 80), brand: String(get(r, 'brand') || '').trim().slice(0, 60),
      price: toNum(get(r, 'price')), ml: toNum(get(r, 'ml')), name: String(get(r, 'tester') || '').trim().slice(0, 40) || 'Anonym',
      taste: score(get(r, 'taste')), value: score(get(r, 'value')), note: String(get(r, 'notes') || '').trim().slice(0, 300),
      photo: imageUrl(get(r, 'photo'))
    })).filter(x => x.drink && (x.taste != null || x.value != null));
  }

  // eksempel.json (én post per drikk med scores-liste) -> vurderinger
  function jsonToRatings(list) {
    return (Array.isArray(list) ? list : []).flatMap((d, i) => (d.scores || []).map(s => ({
      time: String(d.date || '') + ' ' + String(99 - i).padStart(2, '0'), week: String(d.week || ''), drink: String(d.drink || ''), brand: String(d.brand || ''),
      price: toNum(d.price), ml: toNum(d.ml), name: String(s.name || 'Anonym'), taste: score(s.taste), value: score(s.value),
      note: s.name === (d.scores[0] || {}).name ? String(d.notes || '') : '', photo: imageUrl(d.photo)
    })));
  }

  // vurderinger -> én post per drikk
  function toDrinks(ratings) {
    const map = new Map();
    for (const r of ratings) {
      const k = drinkKey(r.drink);
      if (!map.has(k)) map.set(k, {key: k, drink: r.drink, ratings: []});
      map.get(k).ratings.push(r);
    }
    return [...map.values()].map(d => {
      const rs = d.ratings.sort((a, b) => b.time.localeCompare(a.time));
      const latest = rs[0];
      const pick = f => (rs.find(r => r[f] != null && r[f] !== '') || {})[f] ?? null;
      const taste = avg(rs.map(r => r.taste)), value = avg(rs.map(r => r.value));
      const price = pick('price'), ml = pick('ml');
      return {
        id: d.key, key: d.key, drink: rs[rs.length - 1].drink, brand: pick('brand') || '', week: latest.week, time: latest.time,
        price, ml, perL: price != null && ml ? price / ml * 1000 : null, photo: pick('photo') || '',
        notes: rs.filter(r => r.note).slice(0, 6).map(r => ({name: r.name, text: r.note})),
        scores: rs.map(r => ({name: r.name, taste: r.taste, value: r.value})),
        taste, value, total: taste != null && value != null ? (taste + value) / 2 : (taste ?? value)
      };
    });
  }

  // Stabil ID for en kommentar (brukes til likes)
  function cid(r) {
    const s = String(r.time) + '|' + drinkKey(r.drink) + '|' + String(r.name).trim().toLowerCase();
    let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return 'k' + h.toString(36);
  }

  const api = { cid, drinkKey, similarDrink, imageUrl, gvizToRows, rowsToRatings, jsonToRatings, toDrinks };
  root.EDParse = api;
})(typeof self !== 'undefined' ? self : this);
