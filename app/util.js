/* 工具函数：转义、日期格式化、阅读时长、本地存储读写，以及一个手写的极简 Markdown 渲染器 */

/* ==========================================================================
   以下一般不用动
   ========================================================================== */

/* ---------- 小工具 ---------- */
const $ = s => document.querySelector(s)

function esc(s){
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;')
}

/* ---------- 本地存储 ---------- */
/* 浏览器可能整个禁掉存储（无痕窗口、file:// 下的某些浏览器），碰一下就可能抛异常，
   所以全站一律走这四个函数，不要在外面直接写 localStorage。
   lsSet 返回成功与否：存图片、存文件超配额时要靠它给用户一句提示。 */
function lsGet(k){ try { return localStorage.getItem(k) } catch(e){ return null } }
function lsSet(k, v){ try { localStorage.setItem(k, v); return true } catch(e){ return false } }
function lsDel(k){ try { localStorage.removeItem(k) } catch(e){} }

/* 存 JSON 的版本：读不到、或内容坏掉解析不了，一律当成空对象 */
function lsGetJSON(k){ try { return JSON.parse(lsGet(k)) || {} } catch(e){ return {} } }
function lsSetJSON(k, o){ return lsSet(k, JSON.stringify(o)) }

/* ---------- 开发者模式换掉的那几张图 ---------- */
const IMG_SLOTS = [
  { key:'markImg',    label:'顶栏左上角的方块', max:512  },
  { key:'avatar',     label:'首页头像（正面）', max:512  },
  { key:'avatarBack', label:'首页头像（翻面）', max:512  },
  { key:'bgDay',      label:'白天背景图',       max:1920 },
  { key:'bgNight',    label:'夜间背景图',       max:1920 }
]

function imgOverride(key){
  return lsGet('kili.img.' + key)
}

function siteImg(key){
  const ov = imgOverride(key)
  if(ov) return ov
  return (typeof SITE !== 'undefined' && SITE && SITE[key]) || null
}

/* ---------- 页面上任意一张图片的替换表 ---------- */
const LS_IMGMAP = 'kili.imgmap'

/* ⚠️ 缓存一份，别去掉：表里存的是 data: URI，换过几张图之后这个 JSON 可能有几 MB，
   而渲染时每张卡片都要查一次表 —— 每次都 JSON.parse 一遍会肉眼可见地卡。
   所以下面每个「写」函数都要顺手把缓存清掉，否则改完看不到效果。 */
let IMG_MAP_CACHE = null
function readImgMap(){
  if(!IMG_MAP_CACHE) IMG_MAP_CACHE = lsGetJSON(LS_IMGMAP)
  return IMG_MAP_CACHE
}
function setImgMap(orig, dataUrl){
  const m = readImgMap()
  m[orig] = dataUrl
  const ok = lsSetJSON(LS_IMGMAP, m)
  IMG_MAP_CACHE = null
  return ok ? null : '存不下了，换张小点的图试试'
}
function dropImgMap(orig){
  const m = readImgMap()
  delete m[orig]
  IMG_MAP_CACHE = null
  lsSetJSON(LS_IMGMAP, m)
}

/* 卡片封面在替换表里的键。
   填了 cover 的文章，键就是那个地址本身；没填的文章，封面那一格渲染出来的是
   占位块（浅蓝渐变 + 标题首字），它**没有 <img>**、也就没有地址可用，
   于是按文章 id 编一个虚拟键 —— 以 # 开头，不可能是合法路径，不会和真地址撞上。 */
function coverKey(p){
  if(!p) return ''
  return p.cover || (p.id ? '#cover:' + p.id : '')
}

function applyImgMap(){
  const view = document.getElementById('view')
  if(!view) return
  const map = readImgMap()
  const imgs = view.querySelectorAll('img')
  for(let i = 0; i < imgs.length; i++){
    const im = imgs[i]
    if(im.closest && im.closest('.ha-face')) continue
    if(!im.dataset.orig) im.dataset.orig = im.getAttribute('src') || ''
    const to = map[im.dataset.orig]
    if(to && im.getAttribute('src') !== to) im.setAttribute('src', to)
  }
}
function dropImgOverride(key){
  lsDel('kili.img.' + key)
}

/* ---------- 渲染完之后要跟着做的事 ---------- */
const AFTER_PAINT = []
function afterPaint(fn){ AFTER_PAINT.push(fn) }
function runAfterPaint(){
  for(let i = 0; i < AFTER_PAINT.length; i++){
    try { AFTER_PAINT[i]() } catch(e){}
  }
}

/* ---------- 开发者模式：文章 / 作品 / 文件的 localStorage 覆盖层 ---------- */
const LS_POSTS = 'kili.posts'
const LS_WORKS = 'kili.works'
const LS_FILES = 'kili.files'
const LS_SITES = 'kili.sites'

function readOverride(key){
  return lsGetJSON(key)
}
function writeOverride(key, data){
  lsSetJSON(key, data)
}

/* ⚠️ updated 要「默认数据」和「新增条目」两边都过一遍，只过默认那份的话，改自己新建的条目会石沉大海 */
function mergeOverride(base, key, pk){
  const ov = readOverride(key)
  const deleted = new Set(ov.deleted || [])
  const updated = ov.updated || {}
  const apply = x => updated[pk(x)] ? Object.assign({}, x, updated[pk(x)]) : x
  return base.filter(x => !deleted.has(pk(x))).map(apply)
             .concat((ov.added || []).filter(x => !deleted.has(pk(x))).map(apply))
}

function mergedPosts(){
  return typeof POSTS === 'undefined' ? [] : mergeOverride(POSTS, LS_POSTS, p => p.id)
}
function mergedWorks(){
  return typeof WORKS === 'undefined' ? [] : mergeOverride(WORKS, LS_WORKS, w => w.name)
}
function mergedFiles(){
  return typeof FILES === 'undefined' ? [] : mergeOverride(FILES, LS_FILES, f => f.name)
}
function mergedSites(){
  return typeof SITES === 'undefined' ? [] : mergeOverride(SITES, LS_SITES, s => s.key)
}

/* ⚠️ 主键要 id / name / key 各比各的：写成 (x.id||x.name||x.key) 会拿 'dev' 去比『开发资源』，永远匹配不上 */
function isAddedOverride(key, pk){
  return (readOverride(key).added || []).some(x => x.id === pk || x.name === pk || x.key === pk)
}

function devRemoveAdded(key, pk){
  const ov = readOverride(key)
  if(!ov.added) return false
  const i = ov.added.findIndex(x => x.id === pk || x.name === pk || x.key === pk)
  if(i < 0) return false
  ov.added.splice(i, 1)
  writeOverride(key, ov)
  return true
}

/* ---------- CRUD（只给开发者模式的 UI 用） ---------- */
/* ⚠️ 每个写函数都要自己读一遍、改完整体写回：readOverride() 每次返回新解析的对象，不这样改动会丢 */
function devAddPost(post){
  const ov = readOverride(LS_POSTS)
  if(!ov.added) ov.added = []
  ov.added.push(post)
  writeOverride(LS_POSTS, ov)
}
function devUpdatePost(id, fields){
  const ov = readOverride(LS_POSTS)
  if(!ov.updated) ov.updated = {}
  ov.updated[id] = Object.assign(ov.updated[id] || {}, fields)
  writeOverride(LS_POSTS, ov)
}
function devDeletePost(id){
  const ov = readOverride(LS_POSTS)
  if(ov.added){
    const i = ov.added.findIndex(p => p.id === id)
    if(i >= 0){ ov.added.splice(i, 1); writeOverride(LS_POSTS, ov); return }
  }
  if(!ov.deleted) ov.deleted = []
  if(ov.deleted.indexOf(id) < 0) ov.deleted.push(id)
  writeOverride(LS_POSTS, ov)
}

function devAddWork(w){
  const ov = readOverride(LS_WORKS)
  if(!ov.added) ov.added = []
  ov.added.push(w)
  writeOverride(LS_WORKS, ov)
}
function devUpdateWork(name, fields){
  const ov = readOverride(LS_WORKS)
  if(!ov.updated) ov.updated = {}
  ov.updated[name] = Object.assign(ov.updated[name] || {}, fields)
  writeOverride(LS_WORKS, ov)
}
function devDeleteWork(name){
  const ov = readOverride(LS_WORKS)
  if(ov.added){
    const i = ov.added.findIndex(w => w.name === name)
    if(i >= 0){ ov.added.splice(i, 1); writeOverride(LS_WORKS, ov); return }
  }
  if(!ov.deleted) ov.deleted = []
  if(ov.deleted.indexOf(name) < 0) ov.deleted.push(name)
  writeOverride(LS_WORKS, ov)
}

function devAddFile(f){
  const ov = readOverride(LS_FILES)
  if(!ov.added) ov.added = []
  ov.added.push(f)
  writeOverride(LS_FILES, ov)
}
function devUpdateFile(name, fields){
  const ov = readOverride(LS_FILES)
  if(!ov.updated) ov.updated = {}
  ov.updated[name] = Object.assign(ov.updated[name] || {}, fields)
  writeOverride(LS_FILES, ov)
}
function devDeleteFile(name){
  const ov = readOverride(LS_FILES)
  if(ov.added){
    const i = ov.added.findIndex(f => f.name === name)
    if(i >= 0){ ov.added.splice(i, 1); writeOverride(LS_FILES, ov); return }
  }
  if(!ov.deleted) ov.deleted = []
  if(ov.deleted.indexOf(name) < 0) ov.deleted.push(name)
  writeOverride(LS_FILES, ov)
}

function devAddSite(site){
  const ov = readOverride(LS_SITES)
  if(!ov.added) ov.added = []
  ov.added.push(site)
  writeOverride(LS_SITES, ov)
}
function devUpdateSite(key, fields){
  const ov = readOverride(LS_SITES)
  if(!ov.updated) ov.updated = {}
  ov.updated[key] = Object.assign(ov.updated[key] || {}, fields)
  writeOverride(LS_SITES, ov)
}
function devDeleteSite(key){
  const ov = readOverride(LS_SITES)
  if(ov.added){
    const i = ov.added.findIndex(s => s.key === key)
    if(i >= 0){ ov.added.splice(i, 1); writeOverride(LS_SITES, ov); return }
  }
  if(!ov.deleted) ov.deleted = []
  if(ov.deleted.indexOf(key) < 0) ov.deleted.push(key)
  writeOverride(LS_SITES, ov)
}

function makeSiteKey(name){
  const t = String(name || '').toLowerCase()
    .replace(/[^\w一-龥]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32)
  if(!/[a-z0-9]/.test(t)) return 'site-' + Date.now().toString(36)
  return t
}

/* ---------- 上传的文件本体 ---------- */
function fileData(name){
  return lsGet('kili.file.' + name)
}
function setFileData(name, dataUrl){
  return lsSet('kili.file.' + name, dataUrl) ? null : '存不下了，换个小点的文件试试'
}
function dropFileData(name){
  lsDel('kili.file.' + name)
}
function fileHref(f){
  const d = f && f.name ? fileData(f.name) : null
  return d || (f && f.file) || '#'
}

/* ⚠️ localStorage 一个站点通常只有 5MB：图和文件都占这份额度，存不下时会返回提示 */
function readAnyFile(file, max, done){
  const isImg = /^image\//.test(file.type || '')
  const fr = new FileReader()
  fr.onerror = () => done('读文件失败')
  fr.onload = () => {
    if(!isImg) return done(null, fr.result)
    const im = new Image()
    im.onerror = () => done(null, fr.result)
    im.onload = () => {
      const w = im.naturalWidth, h = im.naturalHeight
      if(!w || !h) return done(null, fr.result)
      const k = Math.min(1, max / Math.max(w, h))
      if(k >= 1) return done(null, fr.result)
      const cv = document.createElement('canvas')
      cv.width  = Math.max(1, Math.round(w * k))
      cv.height = Math.max(1, Math.round(h * k))
      const ctx = cv.getContext('2d')
      if(!ctx) return done(null, fr.result)
      ctx.drawImage(im, 0, 0, cv.width, cv.height)
      try { done(null, cv.toDataURL('image/jpeg', .86)) }
      catch(e){ done(null, fr.result) }
    }
    im.src = fr.result
  }
  fr.readAsDataURL(file)
}

function humanSize(n){
  if(!n && n !== 0) return ''
  if(n < 1024) return n + ' B'
  if(n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
  return (n / 1024 / 1024).toFixed(2) + ' MB'
}

/* ---------- 开发者模式开着没有 ---------- */
/* ⚠️ kili.dev = 方块解锁过没有；kili.devmode = 当前开着没有。两个键别搞混 */
const DEV_MODE_KEY = 'kili.devmode'

function devModeOn(){
  return lsGet(DEV_MODE_KEY) === '1'
}
function devModeFlag(on){
  if(on) lsSet(DEV_MODE_KEY, '1')
  else   lsDel(DEV_MODE_KEY)
}

/* ---------- 开发者模式的小工具 ---------- */
function splitTags(s){
  return String(s || '').split(/[,，]/).map(t => t.trim()).filter(Boolean)
}

function today(){
  const d = new Date()
  const p = n => (n < 10 ? '0' : '') + n
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate())
}

function makePostId(title){
  const t = String(title || '').toLowerCase()
    .replace(/[^\w一-龥]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  if(!/[a-z0-9]/.test(t)) return t ? 'post-' + Date.now().toString(36) : 'post-' + Date.now().toString(36)
  return t
}

const MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']
function fmtDate(d){
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d)
  if(!m) return d
  return m[1] + '年' + MONTHS[+m[2]-1] + (+m[3]) + '日'
}
function readTime(body){
  const n = String(body).replace(/\s/g,'').length
  return Math.max(1, Math.round(n/400)) + ' 分钟'
}

/* ⚠️ hash 是地址栏随手能改的：decodeURIComponent 撞上坏的百分号转义会抛 URIError，这里要兜住 */
function safeDecode(s){
  try { return decodeURIComponent(s) } catch(e){ return s }
}

function slugify(s){
  const t = String(s).toLowerCase()
    .replace(/<[^>]+>/g,'')
    .replace(/[^\w一-龥]+/g,'-')
    .replace(/^-+|-+$/g,'')
    .slice(0,40)
  return 'h-' + (t || 'sec')
}

function plain(s){
  return String(s)
    .replace(/```[\s\S]*?```/g,' ')
    .replace(/`[^`\n]*`/g,' ')
    .replace(/^\s{0,3}#{1,6}\s+/gm,'')
    .replace(/[*_>~\-]+/g,' ')
    .replace(/\s+/g,' ')
}

function escapeRe(s){ return String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&') }

/* ---------- 极简 Markdown ---------- */
const MD_MARK = '@@MD'
const BLOCK_TAG = /^<(?:h2|h3|ul|ol|blockquote|pre)/
let MD_TOC = []
function md(src){
  const hold = []
  const toc = []
  const used = Object.create(null)
  /* ⚠️ 占位符用纯 ASCII：写成 \u0000 会往文件里写进真空字节 */
  const stash = html => MD_MARK + (hold.push(html) - 1) + '@@'

  let s = esc(String(src).replace(/^\n+|\n+$/g,''))

  s = s.replace(/```(\w*)\n([\s\S]*?)```/g, (m, lang, code) =>
    stash('<div class="code-wrap">' +
          '<button class="copy-btn" type="button" data-copy>复制</button>' +
          '<pre><code>' + code.replace(/\n$/,'') + '</code></pre></div>'))

  const head = lv => (m, text) => {
    const base = slugify(text)
    let id = base, n = 2
    while (used[id]) id = base + '-' + (n++)
    used[id] = 1
    toc.push({ id, text: text.replace(/[*`]/g,''), lv })
    return '<h' + lv + ' id="' + id + '">' + text + '</h' + lv + '>'
  }
  s = s.replace(/^###\s+(.*)$/gm, head(3))
       .replace(/^##\s+(.*)$/gm,  head(2))
       .replace(/^#\s+(.*)$/gm,   head(2))
       .replace(/^&gt;\s?(.*)$/gm, '<blockquote>$1</blockquote>')

  const out = []
  let inList = false
  for (const line of s.split('\n')) {
    const li = /^(?:[-*]|\d+\.)\s+(.+)$/.exec(line)
    if (li) {
      if (!inList) { out.push('<ul>'); inList = true }
      out.push('<li>' + li[1] + '</li>')
    } else {
      if (inList) { out.push('</ul>'); inList = false }
      out.push(line)
    }
  }
  if (inList) out.push('</ul>')
  s = out.join('\n')

  s = s.split(/\n{2,}/).map(block => {
    const t = block.trim()
    if (!t) return ''
    if (BLOCK_TAG.test(t)) return t
    if (t.slice(0, MD_MARK.length) === MD_MARK) return t
    const m = /^([\s\S]*?)((?:<(?:h2|h3|ul|ol|blockquote|pre)|@@MD)[\s\S]*)$/.exec(t)
    if (m) {
      const head = m[1].trim()
      return (head ? '<p>' + head.replace(/\n/g,'<br>') + '</p>' : '') + m[2]
    }
    return '<p>' + t.replace(/\n/g,'<br>') + '</p>'
  }).join('\n')

  s = s.replace(/`([^`\n]+)`/g, (m,c) => stash('<code>' + c + '</code>'))
  s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
  /* ⚠️ 图片必须排在链接前面：![a](b) 里的 [a](b) 也会命中链接规则，顺序反了图就没了 */
  s = s.replace(/!\[([^\]\n]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
  s = s.replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')

  s = s.replace(/@@MD(\d+)@@/g, (m,i) => hold[+i])

  MD_TOC = toc
  return s
}
