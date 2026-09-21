/* 共用零件：转义高亮、图标、各种卡片、封面、列表项 —— 各个页面都用得到的那几块 */

/* ---------- 页面 ---------- */
const catName = k => (CATEGORIES.find(c => c.key === k) || {}).name || k

function dateNum(d){
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(d || '')
  return m ? +m[1] * 10000 + +m[2] * 100 + +m[3] : 0
}
const byDateDesc = (a, b) => dateNum(b.date) - dateNum(a.date)

/* ⚠️ 必须 esc 之后再插 <mark>，反过来写就是现成的 XSS 口子 */
function hi(text, q){
  const s = esc(text == null ? '' : text)
  if(!q) return s
  return s.replace(new RegExp('(' + escapeRe(esc(q)) + ')', 'gi'), '<mark>$1</mark>')
}

function chipsHTML(tags, link){
  return (tags || []).map(t => link
    ? `<a class="chip" href="#/tag/${encodeURIComponent(t)}">${esc(t)}</a>`
    : `<span class="chip">${esc(t)}</span>`).join('')
}

function icoHTML(name){
  if(!name) return ''
  if(!/^[A-Za-z0-9_-]+$/.test(name)) return esc(name)

  const ext = SITE.iconExt || '.svg'
  if(typeof ICONS !== 'undefined' && ICONS[ext] && ICONS[ext][name])
    return `<span class="ico-img ico-${name}" aria-hidden="true"></span>`

  const dir = SITE.iconDir
  if(!dir) return esc(name)
  let src = dir + name + ext
  try { src = new URL(src, document.baseURI).href } catch(e){}
  return `<span class="ico-img" style="--ico:url('${esc(src)}')" aria-hidden="true"></span>`
}

function iconOptions(cur){
  const ext = SITE.iconExt || '.svg'
  const set = (typeof ICONS !== 'undefined' && ICONS[ext]) ? ICONS[ext] : {}
  const list = Object.keys(set).filter(n => /^[A-Za-z0-9_-]+$/.test(n))
  if(cur && list.indexOf(cur) < 0) list.unshift(cur)
  return list.map(n =>
    `<option value="${esc(n)}"${n === cur ? ' selected' : ''}>${esc(n)}</option>`).join('')
}

/* ---------- 开发者模式的小控件（点击统一由 boot.js 的 bootDevUI() 委托） ---------- */
function devCardActs(kind, id){
  const k = esc(kind), v = esc(id)
  return `<div class="dev-card-act dev-only">
    <button class="dev-btn sm" type="button" data-dev-edit="${k}" data-dev-id="${v}">编辑</button>
    <button class="dev-btn sm danger" type="button" data-dev-del="${k}" data-dev-id="${v}">删除</button>
  </div>`
}

function devAddBtn(kind, label){
  const k = esc(kind)
  return `<div class="dev-bar dev-only">
    <button class="dev-btn" type="button" data-dev-new="${k}">${esc(label)}</button>
  </div>`
}

/* ---------- 整框可点：拉伸链接 ---------- */
/* ⚠️ .stretch 的 ::after 盖在整张卡片上，卡片里可点的东西都要抬 z-index（标签 2、开发者按钮 3） */
function stretchLink(href, inner, blank){
  const t = blank ? ' target="_blank" rel="noopener"' : ''
  return `<a class="stretch" href="${esc(href)}"${t}>${inner}</a>`
}

function bannerHTML(){
  const st = []
  if(SITE.bannerFont) st.push('--banner-font:' + SITE.bannerFont)
  if(SITE.bannerSize) st.push('--banner-size:' + SITE.bannerSize)
  const attr = st.length ? ` style="${esc(st.join(';'))}"` : ''
  return `
      <div class="hero home-banner">
        <h1${attr}>${esc(SITE.banner || SITE.name)}</h1>
      </div>`
}

/* 封面。⚠️ 没填 cover 的文章渲染的是**占位块**（浅蓝渐变 + 标题首字），
   里面没有 <img> —— 开发者模式要能点它换图，靠的就是 data-cover-key 这个键，
   见 app/util.js 的 coverKey()。 */
function coverHTML(p){
  const key = coverKey(p)
  const src = (key && readImgMap()[key]) || p.cover || ''
  if(src) return `<div class="cover" data-cover-key="${esc(key)}"><img src="${esc(src)}" alt="" loading="lazy" data-orig="${esc(key)}"></div>`
  return `<div class="cover ph" data-cover-key="${esc(key)}"><span>${esc(String(p.title || '?').slice(0,1))}</span></div>`
}

function postCard(p, q){
  return `
  <article class="card">
    ${devCardActs('post', p.id)}
    ${coverHTML(p)}
    <div class="meta"><span>${fmtDate(p.date)}</span><span>·</span><span>${readTime(p.body)}</span></div>
    <h3>${stretchLink('#/post/' + encodeURIComponent(p.id), hi(p.title, q))}</h3>
    <p>${hi(p.summary, q)}</p>
    <div class="chips">${chipsHTML(p.tags, true)}</div>
  </article>`
}

/* ⚠️ 传搜索词时必须写成 w => workCard(w, q)：直接 .map(workCard) 会把下标当成 q */
function workCard(w, q){
  return `
  <article class="card">
    ${devCardActs('work', w.name)}
    <h3>${stretchLink(w.link || '#', hi(w.name, q) + ' ↗', true)}</h3>
    <p>${hi(w.desc, q)}</p>
    <div class="chips">${chipsHTML(w.tags, false)}</div>
  </article>`
}
