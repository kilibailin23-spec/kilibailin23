/* ==========================================================================
   工具函数与极简 Markdown

   转义、日期格式化、阅读时长、以及那个手写的 Markdown 渲染器。

   这个文件是从原来的单文件 index.html 里拆出来的，内容没动过。
   ========================================================================== */

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

/* ---------- 开发者模式换掉的那几张图 ----------
   放在 util.js 里是因为 views.js（渲染头像）和 boot.js（渲染方块、背景）
   都要读它，而 util.js 是 app/ 里第一个加载的，谁都不会比它早。

   ⚠️ 这些图只存在**你自己这台电脑的浏览器里**（localStorage，键 kili.img.<字段>）。
      换台电脑、换个浏览器、清掉「站点数据」，就都没有了。
      它改的是「你这儿显示成什么样」，不是磁盘上的文件 ——
      别人访问你的站，看到的还是 data/site.js 里原来那张。 */
const IMG_SLOTS = [
  { key:'markImg',    label:'顶栏左上角的方块', max:512  },
  { key:'avatar',     label:'首页头像（正面）', max:512  },
  { key:'avatarBack', label:'首页头像（翻面）', max:512  },
  { key:'bgDay',      label:'白天背景图',       max:1920 },
  { key:'bgNight',    label:'夜间背景图',       max:1920 }
]

function imgOverride(key){
  try { return localStorage.getItem('kili.img.' + key) || null } catch(e){ return null }
}

/* 读图片字段统一走这个：先看有没有开发者模式换过的，没有才用 site.js 里的。
   SITE 可能还没就绪（理论上不会，但多一层不亏）。 */
function siteImg(key){
  const ov = imgOverride(key)
  if(ov) return ov
  return (typeof SITE !== 'undefined' && SITE && SITE[key]) || null
}

/* ---------- 页面上任意一张图片的替换表 ----------
   上面 IMG_SLOTS 那五个是**站点自己**的图（顶栏方块、头像正反面、两张背景），
   它们有固定的位置和字段名，单独一套。

   这里管的是**剩下的所有图片** —— 文章封面、正文里的插图、以后加的随便什么图。
   这类图没法提前知道有哪些，所以反过来记：拿「原来那张图的地址」当键，
   存「换成的那张」。渲染完之后扫一遍页面，命中就替换掉。

     键 = 图片原本的 src（原样，相对路径也照原样，不去解析成绝对路径 ——
          data/posts.js 里写 './photo/a.jpg'，键就是 './photo/a.jpg'）

   ⚠️ 为什么不干脆改文章正文、把新图写回 Markdown 里：
      换完的图是一串 data: URI，几百 KB 的 base64 塞进正文，那个 .js 文件
      就没法读也没法改了。这个替换表和上面那几种一样，是「显示层」的覆盖，
      和开发者模式其它改动一个性质，都只存在你这台电脑的浏览器里。

   ⚠️ 元素上另存了一份 data-orig：换过之后 src 就是 data: URI 了，
      再按 src 去查表永远查不到自己是谁，所以第一眼看到时先把原始地址记下来。 */
const LS_IMGMAP = 'kili.imgmap'

function readImgMap(){
  try { return JSON.parse(localStorage.getItem(LS_IMGMAP)) || {} } catch(e){ return {} }
}
function setImgMap(orig, dataUrl){
  const m = readImgMap()
  m[orig] = dataUrl
  try { localStorage.setItem(LS_IMGMAP, JSON.stringify(m)); return null }
  catch(e){ return '存不下了，换张小点的图试试' }
}
function dropImgMap(orig){
  const m = readImgMap()
  delete m[orig]
  try { localStorage.setItem(LS_IMGMAP, JSON.stringify(m)) } catch(e){}
}

/* 渲染完之后扫一遍，把换过的图换上去。
   paintView() 末尾调它（见 app/router.js）—— 视图是整块 innerHTML 换掉的，
   不扫这一遍，换过的图一刷新就打回原形。

   只扫 #view 里头的：顶栏方块和首页头像那几张走 IMG_SLOTS，各有各的入口，
   在这儿一起处理的话，两边会互相覆盖。 */
function applyImgMap(){
  const view = document.getElementById('view')
  if(!view) return
  const map = readImgMap()
  const imgs = view.querySelectorAll('img')
  for(let i = 0; i < imgs.length; i++){
    const im = imgs[i]
    /* 头像那两张是 IMG_SLOTS 管的，跳过 —— 它们也带 data-orig 的话，
       点开小窗口会分不清该改哪一个 */
    if(im.closest && im.closest('.ha-face')) continue
    if(!im.dataset.orig) im.dataset.orig = im.getAttribute('src') || ''
    const to = map[im.dataset.orig]
    if(to && im.getAttribute('src') !== to) im.setAttribute('src', to)
  }
}
function dropImgOverride(key){
  try { localStorage.removeItem('kili.img.' + key) } catch(e){}
}

/* ---------- 渲染完之后要跟着做的事 ----------
   paintView()（app/router.js）每次画完视图会挨个叫一遍。

   用注册制，而不是在 router.js 里写死「画完调 applyImgMap、再调实时预览」——
   router 那一层的职责就是「按地址栏决定画哪一页」，不该知道开发者模式、
   文章预览这些事。要加新钩子就在 boot.js 里 afterPaint(fn) 一句，
   不用回头动路由。

   钩子里抛异常不影响别的钩子，也不影响页面 —— 一个附加效果崩了，
   不该把整页拖下水。 */
const AFTER_PAINT = []
function afterPaint(fn){ AFTER_PAINT.push(fn) }
function runAfterPaint(){
  for(let i = 0; i < AFTER_PAINT.length; i++){
    try { AFTER_PAINT[i]() } catch(e){}
  }
}

/* ---------- 开发者模式：文章 / 作品 / 文件的 localStorage 覆盖层 ----------
   和上面的换图一样：默认数据来自 data/*.js，开发者模式里的修改存在
   localStorage 里，覆盖默认值。换了浏览器、清了站点数据就没了，
   想永久改还是得动了 data/*.js 再重新部署。

   结构（每种类型一个键）：
     kili.posts → { added:[], updated:{}, deleted:[] }
     kili.works → { added:[], updated:{}, deleted:[] }
     kili.files → { added:[], updated:{}, deleted:[] }

   - added:    通过开发者模式新增的条目（完整对象）
   - updated:  对已有条目的字段覆盖（{ id: { field: newVal, ... } }）
   - deleted:  被「删除」的条目主键列表
   —— 文章用 id 做主键，作品和文件用 name 做主键。 */
const LS_POSTS = 'kili.posts'
const LS_WORKS = 'kili.works'
const LS_FILES = 'kili.files'
const LS_SITES = 'kili.sites'

function readOverride(key){
  try { return JSON.parse(localStorage.getItem(key)) || {} } catch(e){ return {} }
}
function writeOverride(key, data){
  try { localStorage.setItem(key, JSON.stringify(data)) } catch(e){}
}

/* 合并：默认列表 → 去掉删掉的 → 叠加改过的 → 接上新增的。
   pk 取主键（文章用 id，作品和文件用 name）。

   ⚠️ updated 要**两边都过一遍**，不能只过默认那份 —— 自己新建的条目
      也是能改的（比如改完标题再改回去），只认默认那份的话，改动会石沉大海。 */
function mergeOverride(base, key, pk){
  const ov = readOverride(key)
  const deleted = new Set(ov.deleted || [])
  const updated = ov.updated || {}
  const apply = x => updated[pk(x)] ? Object.assign({}, x, updated[pk(x)]) : x
  return base.filter(x => !deleted.has(pk(x))).map(apply)
             .concat((ov.added || []).filter(x => !deleted.has(pk(x))).map(apply))
}

/* 合并后的文章列表 */
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

/* 这条是不是开发者模式新增的（在 added 里）。
   新增的能真删掉；来自 data/*.js 的只能软删除（标记 deleted 不再显示），
   因为浏览器写不了磁盘上的 .js 文件。 */
/* 主键字段：文章用 id，作品和文件用 name，网站分类用 key。
   ⚠️ 这里不能用 (x.id || x.name || x.key) 那种「取第一个有值的」写法 ——
      网站分类同时有 name（显示名「开发资源」）和 key（主键 'dev'），
      name 先被取到，于是拿 'dev' 去比 '开发资源'，永远比不中。
      三个字段各比各的，只要有一个等于 pk 就算命中。 */
function isAddedOverride(key, pk){
  return (readOverride(key).added || []).some(x => x.id === pk || x.name === pk || x.key === pk)
}

/* 把新增的条目从 added 里摘掉（改主键时先摘旧的，再按新主键加回去）。
   返回是否真的摘到了 —— 没摘到说明它是默认数据里的，调用方得走软删除。 */
function devRemoveAdded(key, pk){
  const ov = readOverride(key)
  if(!ov.added) return false
  const i = ov.added.findIndex(x => x.id === pk || x.name === pk || x.key === pk)
  if(i < 0) return false
  ov.added.splice(i, 1)
  writeOverride(key, ov)
  return true
}

/* ---------- CRUD ----------
   只给 boot.js 里的开发者模式 UI 用。
   ⚠️ 每个写函数都会自己读一遍、改完再整体写回 —— 因为 readOverride()
      每次都是新解析出来的对象，不这么做的话改动会丢。 */
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


/* 网站导航的分类。结构和作品那套一模一样，连字段名都是照搬的
   （key 当主键），所以直接复用上面那个通用的 mergeOverride。

   ⚠️ 一个分类里的**网站条目**（links 数组）没有单独一套增删改 ——
      它是分类的一个字段。加一条网站 = 把整个 links 数组改掉、
      调一次 devUpdateSite(catKey, { links: 新数组 })。就一层，不值得再拆。 */
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

/* key 从分类名推。中文会被整段压掉，所以压完太短就退回时间戳 ——
   不然两个中文分类名会撞成同一个 key，路由和存储全串台。
   （makePostId 干的是同一件事，但那个前缀和后缀的说法不一样，不共用。） */
function makeSiteKey(name){
  const t = String(name || '').toLowerCase()
    .replace(/[^\w一-龥]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32)
  if(!/[a-z0-9]/.test(t)) return 'site-' + Date.now().toString(36)
  return t
}
/* ---------- 上传的文件本体 ----------
   文件要么放在 files/ 文件夹里、条目里写路径，要么在开发者模式里直接上传 ——
   上传的本体走这里，以 data: URI 存进 localStorage（键 kili.file.<显示名>），
   和换图共用那 5MB 左右的额度。

   为什么不塞进 kili.files 那个 JSON 里：文件本体动辄几 MB，混进元数据里
   每次读写都要整体序列化一遍，又慢又容易在别处撑爆配额。分开放，坏也只坏一个。 */
function fileData(name){
  try { return localStorage.getItem('kili.file.' + name) || null } catch(e){ return null }
}
function setFileData(name, dataUrl){
  try { localStorage.setItem('kili.file.' + name, dataUrl); return null }
  catch(e){ return '存不下了，换个小点的文件试试' }
}
function dropFileData(name){
  try { localStorage.removeItem('kili.file.' + name) } catch(e){}
}
/* 下载链接统一走这个：上传过就用上传的那份，否则用条目里写的路径 */
function fileHref(f){
  const d = f && f.name ? fileData(f.name) : null
  return d || (f && f.file) || '#'
}

/* 把任意文件读成 data: URI。图片先缩到 max 以内（省空间，和换图一致），
   其他类型原样读 —— 二进制转 base64 会胖约 1/3，这是这条路绕不开的代价。 */
function readAnyFile(file, max, done){
  const isImg = /^image\//.test(file.type || '')
  const fr = new FileReader()
  fr.onerror = () => done('读文件失败')
  fr.onload = () => {
    if(!isImg) return done(null, fr.result)
    const im = new Image()
    im.onerror = () => done(null, fr.result)     // 图读不出来就存原样，别整个失败
    im.onload = () => {
      const w = im.naturalWidth, h = im.naturalHeight
      if(!w || !h) return done(null, fr.result)
      const k = Math.min(1, max / Math.max(w, h))
      if(k >= 1) return done(null, fr.result)     // 本来就不大，不用转
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

/* 人看的体积：1024 → 1.0 KB。上传完填进条目的 size 字段，
   省得作者自己估一个数填进去 */
function humanSize(n){
  if(!n && n !== 0) return ''
  if(n < 1024) return n + ' B'
  if(n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
  return (n / 1024 / 1024).toFixed(2) + ' MB'
}

/* ---------- 开发者模式开着没有 ----------
   两个键别搞混：
     kili.dev      —— 方块**解锁**过没有（长按炸出来了）。解锁过就一直解锁，
                      下次打开页面直接显示齿轮，不用每次重按。bootSecret() 管。
     kili.devmode  —— 开发者模式**当前开着**没有（齿轮点没点下去）。
                      开着的时候页面上才长出那些编辑控件。这里管。

   开着的时候根元素上挂 html.dev-on，所有编辑控件（.dev-only）靠它显隐 ——
   切换只翻一个类名，不用重画页面。 */
const DEV_MODE_KEY = 'kili.devmode'

function devModeOn(){
  try { return localStorage.getItem(DEV_MODE_KEY) === '1' } catch(e){ return false }
}
function devModeFlag(on){
  try {
    if(on) localStorage.setItem(DEV_MODE_KEY, '1')
    else   localStorage.removeItem(DEV_MODE_KEY)
  } catch(e){}
}

/* ---------- 开发者模式的小工具 ---------- */

/* 「前端,CSS」→ ['前端','CSS']。中英文逗号都认 */
function splitTags(s){
  return String(s || '').split(/[,，]/).map(t => t.trim()).filter(Boolean)
}

/* 今天是哪天，YYYY-MM-DD。日期输入框的默认值 */
function today(){
  const d = new Date()
  const p = n => (n < 10 ? '0' : '') + n
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate())
}

/* 标题 → id。中文会整段被压掉，所以压完太短就退回时间戳 ——
   不然两篇中文标题的文章会撞成同一个 id，路由直接串台。
   （slugify 是给标题锚点用的，前缀 h-、还砍到 40 字，不适合当主键。） */
function makePostId(title){
  const t = String(title || '').toLowerCase()
    .replace(/[^\w一-龥]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  // 纯中文 / 空标题的兜底：用时间戳，重复不了
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

/* decodeURIComponent 撞上坏的百分号转义会抛 URIError，而 hash 是地址栏里
   随手就能改的。包一层，坏链接退化成原文，总好过整个页面白屏 */
function safeDecode(s){
  try { return decodeURIComponent(s) } catch(e){ return s }
}

/* 标题 → 锚点 id。中文原样留着，其余非字母数字的全部压成连字符 */
function slugify(s){
  const t = String(s).toLowerCase()
    .replace(/<[^>]+>/g,'')
    .replace(/[^\w一-龥]+/g,'-')
    .replace(/^-+|-+$/g,'')
    .slice(0,40)
  return 'h-' + (t || 'sec')
}

/* 搜正文前先把 Markdown 标记剥掉，不然搜个 "#" 能命中一大片 */
function plain(s){
  return String(s)
    .replace(/```[\s\S]*?```/g,' ')    // 代码块整块丢掉：里面的变量名命中率低、还很吵
    .replace(/`[^`\n]*`/g,' ')
    .replace(/^\s{0,3}#{1,6}\s+/gm,'')
    .replace(/[*_>~\-]+/g,' ')
    .replace(/\s+/g,' ')
}

/* 用户输入要拼进 RegExp，特殊字符不转义的话，输个 "(" 就能把正则搞崩 */
function escapeRe(s){ return String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&') }

/* ---------- 极简 Markdown ---------- */
const MD_MARK = '@@MD'
const BLOCK_TAG = /^<(?:h2|h3|ul|ol|blockquote|pre)/
/* 最近一次 md() 调用收集到的标题大纲，viewPost 拿它渲染目录 */
let MD_TOC = []
function md(src){
  const hold = []
  const toc = []
  const used = Object.create(null)
  // 占位符用纯 ASCII，别用 \u0000 —— 那会往文件里写真空字节
  const stash = html => MD_MARK + (hold.push(html) - 1) + '@@'

  let s = esc(String(src).replace(/^\n+|\n+$/g,''))

  // 1. 代码块先挖走，内容已经过 esc。顺手包一层容器，右上角挂复制按钮。
  //    整块是丢进 hold 的，所以下面的段落判定看到的是 @@MDn@@ 而不是 <div>，
  //    不会被误包进 <p> 里。
  s = s.replace(/```(\w*)\n([\s\S]*?)```/g, (m, lang, code) =>
    stash('<div class="code-wrap">' +
          '<button class="copy-btn" type="button" data-copy>复制</button>' +
          '<pre><code>' + code.replace(/\n$/,'') + '</code></pre></div>'))

  // 2. 标题 / 引用。标题要生成唯一锚点，目录靠它跳转
  const head = lv => (m, text) => {
    const base = slugify(text)
    let id = base, n = 2
    while (used[id]) id = base + '-' + (n++)   // 同名标题加序号，不然锚点会撞
    used[id] = 1
    toc.push({ id, text: text.replace(/[*`]/g,''), lv })
    return '<h' + lv + ' id="' + id + '">' + text + '</h' + lv + '>'
  }
  s = s.replace(/^###\s+(.*)$/gm, head(3))
       .replace(/^##\s+(.*)$/gm,  head(2))
       .replace(/^#\s+(.*)$/gm,   head(2))
       .replace(/^&gt;\s?(.*)$/gm, '<blockquote>$1</blockquote>')

  // 3. 列表：逐行扫描，比正则堆叠稳
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

  // 4. 段落：块级元素和占位符都不能被包进 <p>
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

  // 5. 行内标记
  s = s.replace(/`([^`\n]+)`/g, (m,c) => stash('<code>' + c + '</code>'))
  s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
  /* 图片必须排在链接前面：![a](b) 里的 [a](b) 正好也满足下面那条链接规则，
     顺序反了会先被吃成 !<a ...>，图就没了。 */
  s = s.replace(/!\[([^\]\n]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
  s = s.replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')

  // 6. 还原占位符
  s = s.replace(/@@MD(\d+)@@/g, (m,i) => hold[+i])

  // 目录留给 viewPost 用
  MD_TOC = toc
  return s
}

