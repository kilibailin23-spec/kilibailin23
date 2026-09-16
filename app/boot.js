/* ==========================================================================
   启动与各类效果

   侧边栏、时钟、搜索、剪贴板、背景图、粒子、主题三态、阅读进度、开场动画，
   以及最底下那段启动序列。

   这个文件是从原来的单文件 index.html 里拆出来的，内容没动过。
   ========================================================================== */

/* ---------- 侧边栏 / 顶栏 / 页脚 ---------- */
function bootChrome(){
  $('#brandName').textContent = SITE.name
  paintMark()
  document.title = SITE.name + ' · 技术博客'
  // 图标和文字分两个 span：折叠时把 .rail-txt 收到 0 宽，展开时再放出来
  $('#nav').innerHTML = NAV.map(n =>
    `<a class="rail-link" href="${n.hash}" title="${esc(n.label)}" aria-label="${esc(n.label)}">` +
      `<span class="rail-ico">${icoHTML(n.icon)}</span><span class="rail-txt">${esc(n.label)}</span></a>`
  ).join('')
  syncBarH()
  $('#footText').innerHTML = SITE.footer
  const fl = []
  if(SITE.github) fl.push(`<a href="${esc(SITE.github)}" target="_blank" rel="noopener">GitHub</a>`)
  if(SITE.email)  fl.push(`<a href="mailto:${esc(SITE.email)}">邮箱</a>`)
  fl.push('<a href="#/sites">网站导航</a>')
  fl.push('<a href="#/about">关于</a>')
  $('#footLinks').innerHTML = fl.join('')
}

/* 顶栏左上角那个方块里的内容。
   配了图（site.js 里的 markImg，或者开发者模式换过的）就放图，没配就显示 mark 那个字。
   字始终渲染出来当底，图盖在上面 —— 图挂了（路径写错、文件不存在）就把它自己藏起来，
   露出底下的字，不会变成一个裂开的图片图标。

   单独拎出来是因为开发者模式换完图要能只重刷这一小块，不必整个 bootChrome()。
   ⚠️ 只写 #markFace，**不能**写 #brandMark —— 方块里还住着长按进度环、爆炸层和
      开发者模式按钮，整块 innerHTML 一覆盖，那些全没了（长按彩蛋会直接失效）。 */
function paintMark(){
  const face = $('#markFace'); if(!face) return
  const txt = esc(SITE.mark || String(SITE.name || '?').slice(0, 1))
  const img = siteImg('markImg')
  face.innerHTML = img
    ? `<img src="${esc(img)}" alt="" onerror="this.hidden=true"><span aria-hidden="true">${txt}</span>`
    : `<span aria-hidden="true">${txt}</span>`
}

/* 量一下顶栏的真实高度写进 --bar-h。侧边栏从它下面开始，
   写死数字的话，以后改 .bar 的 padding 侧边栏就会错位。 */
function syncBarH(){
  const h = document.querySelector('header')
  if(!h) return
  const px = h.getBoundingClientRect().height
  if(px > 0) document.documentElement.style.setProperty('--bar-h', px + 'px')
}

/* ---------- 侧边栏展开 / 收起 ---------- */
function bootRail(){
  const root = document.documentElement
  const btn = $('#railToggle'); if(!btn) return

  let open = false
  try { open = localStorage.getItem('rail') === 'open' } catch(e){}
  // 默认折叠：平时只露图标（用户要的就是「点展开才显示文字」）
  const paint = () => {
    root.setAttribute('data-rail', open ? 'open' : 'closed')
    btn.textContent = open ? '«' : '»'
    btn.setAttribute('aria-expanded', String(open))
    btn.title = open ? '收起侧边栏' : '展开侧边栏'
  }
  paint()
  btn.addEventListener('click', () => {
    open = !open
    try { localStorage.setItem('rail', open ? 'open' : 'closed') } catch(e){}
    paint()
  })

  // 字体加载完顶栏高度可能变一点，跟着重量一次
  window.addEventListener('resize', syncBarH)
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(syncBarH).catch(() => {})
}

/* ---------- 实时时钟 ---------- */
function bootClock(){
  const el = $('#clock'); if(!el) return
  const W = ['日','一','二','三','四','五','六']
  const p2 = n => String(n).padStart(2, '0')
  const tick = () => {
    const d = new Date()
    el.innerHTML =
      '<b class="t">' + p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds()) + '</b>' +
      '<span class="sep">／</span>' +
      '<span class="d">' + (d.getMonth() + 1) + '月' + d.getDate() + '日 星期' + W[d.getDay()] + '</span>'
    // 顺手看一眼跨没跨过夜间分界线。时钟本来就每秒跑，不用再开一个定时器。
    if(THEME_TICK) THEME_TICK()
  }
  tick()
  setInterval(tick, 1000)
}

/* ---------- 搜索 ---------- */
function bootSearch(){
  const q = $('#q'); if(!q) return
  let timer = 0

  const go = () => {
    /* 换了词就把类别拉回「全部」—— 不然上次选了「文件」，
       这次搜个文章里的词，屏幕上还是只有文件那一块，像没搜到 */
    if(SEARCH_Q !== q.value) SEARCH_KIND = 'all'
    SEARCH_Q = q.value
    if(location.hash !== '#/search'){
      if(!SEARCH_Q.trim()) return          // 还没输东西就别跳走
      location.hash = '#/search'           // 交给 hashchange → render()
    } else {
      paintView(true)                      // 已经在搜索页，原地重画，别滚回顶部
    }
  }

  q.addEventListener('input', e => {
    // 中文输入法拼字途中 input 会连着触发。不过滤的话，
    // 每敲一个拼音字母列表就重画一次，闪得没法看
    if(e.isComposing) return
    clearTimeout(timer)
    timer = setTimeout(go, 180)
  })
  q.addEventListener('keydown', e => {
    if(e.key !== 'Enter' || e.isComposing) return
    e.preventDefault()
    clearTimeout(timer)
    go()
  })

  /* 搜索页顶上那排标签（全部 / 文章 / 作品 / 文件）。
     它们是 <button> 不是链接：点一下改全局 SEARCH_KIND 再原地重画，
     地址栏不动、滚动位置也保住 —— 和上面 go() 一个路子。
     ⚠️ 委托挂在 document 上，不能挂到按钮上：视图是整块 innerHTML 换掉的，
        按钮每次都是新造的，挂按钮上等于每次重画都得重绑一遍。 */
  document.addEventListener('click', e => {
    const btn = e.target && e.target.closest ? e.target.closest('[data-skind]') : null
    if(!btn) return
    const k = btn.getAttribute('data-skind')
    if(k === SEARCH_KIND) return
    SEARCH_KIND = k
    paintView(true)
  })
}

/* ---------- 剪贴板 ---------- */
function legacyCopy(text){
  const ta = document.createElement('textarea')
  ta.value = text
  ta.setAttribute('readonly', '')
  ta.style.cssText = 'position:fixed;top:-1000px;left:0;opacity:0'
  document.body.appendChild(ta)
  ta.select()
  ta.setSelectionRange(0, ta.value.length)
  let ok = false
  try { ok = document.execCommand('copy') } catch(e){ ok = false }
  ta.remove()
  return ok
}
/* navigator.clipboard 只在安全上下文（https / localhost）里可用。
   用户很可能是直接双击本地文件打开的，file:// 下它不存在，得退回 execCommand */
function copyText(text){
  return new Promise(resolve => {
    if(navigator.clipboard && window.isSecureContext){
      navigator.clipboard.writeText(text).then(
        () => resolve(true),
        () => resolve(legacyCopy(text))
      )
      return
    }
    resolve(legacyCopy(text))
  })
}

/* ---------- 内容区的事件委托 ----------
   视图是整块 innerHTML 换掉的，绑到具体按钮上立刻就会失效，
   所以统一挂在 #view 上，靠事件冒泡认目标 */
function bootDelegates(){
  const view = $('#view')

  view.addEventListener('click', e => {
    if(!e.target || !e.target.closest) return

    // 目录跳转。必须 preventDefault —— href="#h-xxx" 会被当成路由，
    // 一点就跳到 404 页去了
    const t = e.target.closest('[data-toc]')
    if(t){
      e.preventDefault()
      const el = document.getElementById(t.getAttribute('data-toc'))
      if(el) el.scrollIntoView({ behavior:'smooth', block:'start' })
      return
    }

    const btn = e.target.closest('[data-copy]')
    if(!btn) return
    const code = btn.parentElement.querySelector('code')
    if(!code) return
    copyText(code.textContent).then(okDone => {
      btn.textContent = okDone ? '已复制' : '复制失败'
      btn.classList.toggle('ok', okDone)
      setTimeout(() => { btn.textContent = '复制'; btn.classList.remove('ok') }, 1600)
    })
  })

  // 封面图挂了（路径写错、或者传给 Linux 静态托管后大小写对不上）就退回占位块。
  // error 事件不冒泡，第三个参数必须给 true 走捕获阶段，否则根本收不到
  view.addEventListener('error', e => {
    const img = e.target
    if(!img || img.tagName !== 'IMG' || !img.closest) return
    const box = img.closest('.cover')
    if(!box) return
    box.classList.add('ph')
    box.innerHTML = icoHTML('image')
  }, true)
}

/* ---------- 头像：点一下像硬币一样翻面 ----------
   翻面本身只是加/去掉 .is-flipped，怎么转是 CSS 的事（见 layout.css 的 .ha-flip）。

   照旧走事件委托挂在 #view 上：视图整块 innerHTML 一换，绑在头像上的监听
   就跟着没了，委托则一直活着。 */
function bootAvatarFlip(){
  const view = $('#view'); if(!view) return

  view.addEventListener('click', e => {
    const box = e.target && e.target.closest && e.target.closest('#haAvatar')
    if(box) box.classList.toggle('is-flipped')
  })
  // 这圈挂了 role="button" tabindex="0"，回车和空格也得能用
  view.addEventListener('keydown', e => {
    if(e.key !== 'Enter' && e.key !== ' ') return
    const box = e.target && e.target.closest && e.target.closest('#haAvatar')
    if(!box) return
    e.preventDefault()          // 空格默认会把页面往下滚
    box.classList.toggle('is-flipped')
  })
}

/* ==========================================================================
   顶栏方块：长按 3 秒的彩蛋
   ==========================================================================
   按住 3 秒 → 方块抖 + 进度环走满 → 爆炸 → 露出齿轮按钮。
   不到 3 秒就松手，当成普通点击：回首页（那个方块本来就是回首页的入口）。

   炸出来的那个齿轮**点一下就是开发者模式的开关**（见 setDevMode）：
     开 → 页面上直接长出编辑按钮（写新文章、卡片上的编辑/删除、图片点一下就换……），
          所见即所得，不用再钻进一个弹窗里填表单；
     关 → 再点一下，控件全收起来。

   解锁状态记在 localStorage（kili.dev=1）：解锁过就一直解锁，下次打开直接显示
   齿轮，不用每次重按。想退出去有三条路，最后都走同一个 devRelock()：
     · 右键点一下方块 —— 不用进开发者模式就能撤，这条才是「点开了想反悔」的路
     · 右下角工具条上的「退出」
     · 再点一下齿轮（这个只关开发者模式，齿轮还留着）

   ⚠️ 这只是「藏起来」，不是「锁上」—— 真想进来的人 F12 看一眼就知道怎么触发。
      而且**没有密码**了，原因见 data/site.js 里 dev 那段。 */

/* 方块解锁后写进 localStorage 的键。bootSecret / devRelock 都读它，
   所以拎到外面来，别在哪个函数里各写一份字面量。
   （开发者模式**当前开着没有**是另一个键 kili.devmode，在 app/util.js 里。） */
const DEV_KEY = 'kili.dev'

/* 从「开发者模式」按回「要长按 3 秒」的普通方块。
   右键方块和工具条上那个「退出」都走这里，免得两边各写一份、改一头忘一头。
   ⚠️ 顺带也要把开发者模式关掉 —— 齿轮都藏起来了，页面上的编辑控件还留着，
      就没地方关它了。 */
function devRelock(){
  try { localStorage.removeItem(DEV_KEY) } catch(e){}
  setDevMode(false)

  const mark = $('#brandMark'), btn = $('#markDev')
  if(btn) btn.hidden = true
  if(!mark) return

  mark.classList.remove('is-dev')
  mark.title = mark.getAttribute('data-lock-title') || '长按 3 秒…'
  mark.setAttribute('aria-label', mark.getAttribute('data-lock-label') || '白麟')

  // 先摘再强制重排再加，否则连点两下第二次不播动画（类名没变，浏览器不重启它）
  mark.classList.remove('is-lock')
  void mark.offsetWidth
  mark.classList.add('is-lock')
  setTimeout(() => mark.classList.remove('is-lock'), 600)
}

function bootSecret(){
  const mark = $('#brandMark'), btn = $('#markDev'), boom = $('#markBoom')
  if(!mark || !btn || !boom) return

  // SITE.dev 写 false 就彻底不要这个彩蛋，方块退化成普通的「回首页」按钮
  if(SITE.dev === false || SITE.dev === null) return

  const HOLD  = 3000      // ⚠️ 必须和 aero.css 里进度环那个 3s 对齐，改一个记得改另一个
  const SPARK = ['#8fcbf1','#66b5ea','#a9c7f5','#d9b8e8','#7fd8d0','#ffffff']

  // 解锁前那套提示先记下来，devRelock() 要拿它还原
  mark.setAttribute('data-lock-title', mark.title)
  mark.setAttribute('data-lock-label', mark.getAttribute('aria-label') || '')

  let timer = 0
  let fired = false       // 刚炸过，用来吞掉紧跟着的那次 click

  const unlocked = () => {
    try { return localStorage.getItem(DEV_KEY) === '1' } catch(e){ return false }
  }
  const unlock = () => {
    mark.classList.add('is-dev')
    btn.hidden = false
    // 右键能恢复这事没有任何视觉线索，只能挂在悬停提示上
    mark.title = '齿轮 = 开发者模式开关；右键点方块 = 恢复'
    mark.setAttribute('aria-label', '开发者模式（右键点一下恢复）')
  }

  if(unlocked()) unlock()   // 上次解锁过，这次直接亮出来（不演动画）

  const stopPress = () => {
    if(timer){ clearTimeout(timer); timer = 0 }
    mark.classList.remove('is-press')
  }

  const boomNow = () => {
    timer = 0
    fired = true
    mark.classList.remove('is-press')
    mark.classList.add('is-boom')

    // 碎片：18 片，角度均分一圈再各自抖一点，全等分的话看着像个规规矩矩的圆
    boom.innerHTML = ''
    for(let i = 0; i < 18; i++){
      const p = document.createElement('i')
      const a = Math.PI * 2 * i / 18 + Math.random() * .34
      const d = 26 + Math.random() * 24
      p.style.setProperty('--dx', (Math.cos(a) * d).toFixed(1) + 'px')
      p.style.setProperty('--dy', (Math.sin(a) * d).toFixed(1) + 'px')
      p.style.background = SPARK[i % SPARK.length]
      boom.appendChild(p)
    }
    boom.classList.add('go')

    setTimeout(unlock, 620)                 // 碎片散开了再把按钮放出来
    setTimeout(() => {                      // 收拾现场，免得碎片一直挂在 DOM 里
      mark.classList.remove('is-boom')
      boom.classList.remove('go')
      boom.innerHTML = ''
    }, 1500)

    try { localStorage.setItem(DEV_KEY, '1') } catch(e){}
  }

  mark.addEventListener('pointerdown', e => {
    if(mark.classList.contains('is-dev')) return   // 已解锁：方块退化成普通的回首页按钮
    if(e.button) return                            // 只认左键，右键不触发
    fired = false
    stopPress()
    mark.classList.add('is-press')
    timer = setTimeout(boomNow, HOLD)
  })
  // 松手、指针划出方块、被系统打断（来电、切窗口），一律取消
  mark.addEventListener('pointerup', stopPress)
  mark.addEventListener('pointercancel', stopPress)
  mark.addEventListener('pointerleave', stopPress)
  // 右键：长按途中摁掉菜单（弹出菜单会打断手感）；已经解锁的方块则是「恢复」。
  // 没解锁的方块保持系统菜单不动 —— 那儿右键本来就该是普通的浏览器菜单。
  mark.addEventListener('contextmenu', e => {
    if(mark.classList.contains('is-press')){ e.preventDefault(); return }
    if(!mark.classList.contains('is-dev')) return
    e.preventDefault()
    devRelock()
  })

  mark.addEventListener('click', e => {
    if(e.target && e.target.closest && e.target.closest('#markDev')) return
    if(fired) return            // 刚炸完那一下的 click，别再顺手跳回首页
    if(location.hash && location.hash !== '#/') location.hash = '#/'
  })
  mark.addEventListener('keydown', e => {
    if(e.key !== 'Enter' && e.key !== ' ') return
    if(e.target && e.target.closest && e.target.closest('#markDev')) return
    e.preventDefault()
    if(location.hash && location.hash !== '#/') location.hash = '#/'
  })
}

/* ---------- 把图片文件读成 data: URI，顺便缩到 max 以内 ----------
   缩这一步不是可选的：localStorage 一个站点通常只有 5MB 上下，
   手机随手拍的一张照片原样塞进去直接就爆仓了。
   统一转 JPEG —— 代价是带透明通道的图（背景透明的那种头像）会被填成黑底，
   但换来的是体积小一大截，对「塞进 localStorage」这件事来说是值的。

   不缩的话也不用 FileReader 那一套：直接把 objectURL 存进去看似更省事，
   但 objectURL 只在当前这个页面的生命周期里有效，一刷新就废了。 */
function readImageFile(file, max, done){
  const fr = new FileReader()
  fr.onerror = () => done('读文件失败')
  fr.onload = () => {
    const im = new Image()
    im.onerror = () => done('这个文件不是浏览器认得的图片格式')
    im.onload = () => {
      const w = im.naturalWidth, h = im.naturalHeight
      if(!w || !h) return done('图片尺寸读不出来')
      const k = Math.min(1, max / Math.max(w, h))
      const cv = document.createElement('canvas')
      cv.width  = Math.max(1, Math.round(w * k))
      cv.height = Math.max(1, Math.round(h * k))
      const ctx = cv.getContext('2d')
      if(!ctx) return done('canvas 起不来')
      ctx.drawImage(im, 0, 0, cv.width, cv.height)
      try { done(null, cv.toDataURL('image/jpeg', .86)) }
      catch(e){ done('转码失败（图片可能来自受限来源）') }
    }
    im.src = fr.result
  }
  fr.readAsDataURL(file)
}

/* ==========================================================================
   开发者模式
   ==========================================================================
   长按方块炸出齿轮 → 点齿轮开关 → 页面上直接长出编辑控件。
   不再是「弹窗里选标签、填表单、点保存」那一套 —— 改哪儿就点哪儿。

   ⚠️ 没有密码了。原来那对账号密码明文写在 data/site.js 里，而那个文件是
      要一起部署上去的，按 F12 就能看到。静态站压根没有「服务器」这一环，
      「验证」只能发生在访问者自己的浏览器里，也就必然能被绕过 ——
      与其摆一道假门，不如说清楚：这里能改的全都只存在**你这台电脑的
      浏览器里**（localStorage），改的是「你眼前显示成什么样」，
      不是磁盘上的文件，别人访问你的站看到的还是 data/*.js 里那份。

   改了什么都存在哪儿：
     · 换的图（站点图片位）  kili.img.<字段>
     · 换的图（其它任意图）  kili.imgmap，键是图片原本的 src
     · 文章                 kili.posts
     · 作品                 kili.works
     · 文件                 kili.files
     · 上传的文件本体        kili.file.<显示名>
     · 网站导航              kili.sites
     · 开关状态             kili.dev（方块解锁没有）/ kili.devmode（模式开着没有）

   ⚠️ 来自 data/*.js 的条目只能「改」和「软删除」（标记一下、不再显示），
      没法从 .js 文件里真正抹掉 —— 浏览器写不了磁盘。只有你自己新建的条目
      才整个存在 localStorage 里，也才能真删掉。删除确认框会提醒这一点。
   ========================================================================== */

/* 开发者模式现在开着没有。
   直接读 <html> 上的类名，而不是再查一遍 localStorage —— 那种「两个地方
   各存一份状态」的写法，早晚会有一处忘了同步。类名由 setDevMode() 独家维护，
   这里只是看一眼。 */
function devOn(){
  return document.documentElement.classList.contains('dev-on')
}

/* 开关。只翻一个类名 + 存一下状态，**不重画页面** ——
   所有编辑控件都是渲染时就带着 .dev-only 的，CSS 一藏一露就够了。 */
function setDevMode(on){
  document.documentElement.classList.toggle('dev-on', on)
  devModeFlag(on)
  closeSheet()

  /* 编辑页是「只有开发者模式才存在」的页面：
       · 关掉时还站在上面 —— 得离开，不然留着一屏没用的表单；
       · 打开时正站在上面（不太可能，但从地址栏直接进来会）—— 重画一下。 */
  if(location.hash.indexOf('#/edit/') === 0){
    if(on) render()
    else location.hash = '#/posts'
  }
}

/* ---------- 小窗口 ----------
   换图、加文件、编辑网站条目都往里塞内容，共用 #devSheet 一个壳。
   壳在 index.html 里，挂在 <body> 下（不能放进 #view：main 上有 transform，
   会把它变成 position:fixed 的包含块，窗口就困在里面了）。

   buttons 是 [{ label, ghost, danger, on }]，点完由 on 自己决定关不关。
   里面所有东西都是现拼的 HTML，所以真正的交互（文件选择、还原按钮……）
   走 #devSheet 上的事件委托，见 bootDev()。 */
function openSheet(title, bodyHTML, buttons){
  const s = $('#devSheet'); if(!s) return
  $('#sheetTitle').textContent = title
  $('#sheetBody').innerHTML = bodyHTML

  const bar = $('#sheetActions')
  bar.innerHTML = ''
  ;(buttons || []).forEach(b => {
    const el = document.createElement('button')
    el.type = 'button'
    el.className = 'dev-btn' + (b.ghost ? ' ghost' : '') + (b.danger ? ' danger' : '')
    el.textContent = b.label
    el.addEventListener('click', () => { if(b.on) b.on() })
    bar.appendChild(el)
  })

  s.hidden = false
  document.documentElement.classList.add('modal-open')
}

function closeSheet(){
  const s = $('#devSheet'); if(!s || s.hidden) return
  s.hidden = true
  $('#sheetBody').innerHTML = ''
  $('#sheetActions').innerHTML = ''
  imgSheetOrig = null
  filePending = null
  document.documentElement.classList.remove('modal-open')
}

/* 小窗口里的红字错误。每条内容都自己带一个 #sheetErr */
function sheetError(msg){
  const el = $('#sheetErr')
  if(el){ el.textContent = msg; el.hidden = false }
  else alert(msg)
  return false
}

/* 表单里的红字错误（内容自带的那些 .dev-err） */
function fieldError(id, msg){
  const el = document.getElementById(id)
  if(el){ el.textContent = msg; el.hidden = false }
  return false
}

/* ---------- 换图 ---------- */

/* 站点自己的那几张图（顶栏方块 / 头像正反面 / 两张背景）。
   背景图不是 <img>、点不到，所以这一摊只能从右下角工具条的「站点图片」进去。 */
function slotsSheetHTML(){
  return IMG_SLOTS.map(s => {
    const cur = siteImg(s.key)
    const ov  = !!imgOverride(s.key)
    const how = ov ? '已换成你上传的图'
              : cur ? '用的是 site.js 里的默认图'
                    : '还没配，页面显示的是占位'
    return `<div class="dev-row">
      <div class="dev-thumb">${cur ? `<img src="${esc(cur)}" alt="">` : '<span>∅</span>'}</div>
      <div class="dev-info"><b>${esc(s.label)}</b><small>${how}</small></div>
      <label class="dev-btn sm dev-up">上传<input type="file" accept="image/*" data-slot-up="${esc(s.key)}"></label>
      <button class="dev-btn sm ghost" type="button" data-slot-reset="${esc(s.key)}"${ov ? '' : ' disabled'}>还原</button>
    </div>`
  }).join('')
}

function openSlotsSheet(){
  openSheet('站点图片', slotsSheetHTML() +
    `<p class="dev-hint">这几张是**站点自己**的图。页面上其它图片（文章封面、正文插图……）
      直接在页面上点它就能换。</p>`, [])
}

/* 单独一个图片位的小窗口。点顶栏方块或者头像时走这条 */
function openSlotSheet(key){
  const s = IMG_SLOTS.find(x => x.key === key) || IMG_SLOTS[0]
  const cur = siteImg(s.key)
  const ov  = !!imgOverride(s.key)
  openSheet(s.label,
    `<div class="dev-preview">${cur ? `<img src="${esc(cur)}" alt="">` : '<span>还没配</span>'}</div>` +
    `<p class="dev-hint">${ov ? '现在用的是你上传的那张。' : '现在用的是 data/site.js 里那张。'}</p>` +
    `<div class="dev-upload">
       <label class="dev-btn dev-up">选新图<input type="file" accept="image/*" data-slot-up="${esc(s.key)}"></label>
     </div>
     <p class="dev-err" id="sheetErr" hidden></p>`,
    ov ? [{ label: '还原成 site.js 里那张', ghost: true, on: () => {
      dropImgOverride(s.key); refreshImages(); closeSheet()
    }}] : [])
}

/* 页面上任意一张普通图片的替换窗口（文章封面、正文插图……）。
   imgSheetOrig 记着这张图**原本**的地址 —— 换过之后 src 就变成 data: URI 了，
   再按 src 查表就认不出自己是谁。 */
let imgSheetOrig = null

function openImageSheet(img){
  const orig = img.dataset.orig || img.getAttribute('src') || ''
  imgSheetOrig = orig
  const replaced = !!readImgMap()[orig]
  const short = orig.length > 70 ? orig.slice(0, 70) + '…' : orig

  openSheet('换一张图片',
    `<div class="dev-preview"><img src="${esc(img.getAttribute('src') || '')}" alt=""></div>` +
    `<p class="dev-hint">原图地址：<code>${esc(short)}</code><br>
      改完只在你这个浏览器里生效，磁盘上的文件没动 —— 想让别人也看到，
      直接把新图覆盖到那个路径上，或者在 <code>data/</code> 里改路径。</p>` +
    `<div class="dev-upload">
       <label class="dev-btn dev-up">选新图片<input type="file" accept="image/*" data-img-up="1"></label>
     </div>
     <p class="dev-err" id="sheetErr" hidden></p>`,
    replaced ? [{ label: '还原成原来那张', ghost: true, on: () => {
      dropImgMap(orig); closeSheet(); repaint()
    }}] : [])
}

/* ---------- 文件下载：小窗口（元数据 + 传本体） ----------
   filePending 暂存刚选好、还没保存的文件本体。
   先只读进内存，按保存才真写 localStorage —— 中途取消的话，配额一点没动。 */
let filePending = null
let fileEditing = null    // 正在编辑哪一条（原名），null = 新增

function openFileSheet(name){
  const f = name ? mergedFiles().find(x => x.name === name) : null
  fileEditing = f ? f.name : null
  filePending = null

  openSheet(f ? '编辑文件' : '添加文件',
    `<label class="dev-field col"><span>显示名称</span>
       <input id="flName" type="text" placeholder="下载页上显示的名字" value="${esc(f ? f.name : '')}"></label>
     <!-- ⚠️ 这里的四个字段**全部**独占一行（.col），一个都不能并排。
          这个弹窗只有 430px 宽，而 .dev-grid 的两列是 1fr 1fr ——
          1fr 的**下限是内容的最小宽度**，.dev-field 的最小宽度又是
          「标签 68px + 间距 + 输入框的固有宽度（约 200px）」≈ 277px，
          两列加起来 568px 塞不进 428px 的弹窗：整块会顶破右边、
          弹窗底下多出一条横向滚动条，输入框只看得见一小截。
          （.dev-grid 自己也因此加了 minmax(0,1fr)，见 content.css。） -->
     <label class="dev-field col"><span>路径</span>
       <input id="flHref" type="text" placeholder="./files/xxx.pdf" value="${esc(f ? (f.file || '') : '')}"></label>
     <label class="dev-field col"><span>大小</span>
       <input id="flSize" type="text" placeholder="如 1.2 MB，可留空" value="${esc(f ? (f.size || '') : '')}"></label>
     <label class="dev-field col"><span>说明</span>
       <input id="flDesc" type="text" placeholder="一句话说明这个文件是什么" value="${esc(f ? (f.desc || '') : '')}"></label>
     <div class="dev-upload">
       <label class="dev-btn dev-up">上传文件本体<input type="file" data-file-up="1"></label>
       <span class="dev-hint" id="flHint">不上传也行 —— 只填路径的话，
         文件还是得自己放进 <code>files/</code> 文件夹。</span>
     </div>
     <p class="dev-err" id="flErr" hidden></p>`,
    [{ label: '保存', on: saveFile }, { label: '取消', ghost: true, on: closeSheet }])
}

/* ---------- 文章编辑 ----------
   编辑页是整页（#/edit/new 或 #/edit/<id>），表单就在页面里，不用小窗口。 */

/* 保存。新建的话主键从标题推（makePostId），撞车了补 -2、-3。
   ID 不给用户改 —— 见 views.js 里 viewEdit() 顶部那段说明。 */
function savePost(){
  if(!$('#postEditor')) return
  const title = ($('#edTitle').value || '').trim()
  if(!title) return fieldError('edErr', '标题不能空着。')

  const body = $('#edBody').value || ''
  let summary = ($('#edSummary').value || '').trim()
  /* 摘要留空就自动从正文里抓一句。不然列表卡片上那块是空的，很突兀 */
  if(!summary) summary = plain(body).trim().slice(0, 60)

  const fields = {
    title,
    date:    $('#edDate').value || today(),
    cat:     $('#edCat').value || '',
    tags:    splitTags($('#edTags').value),
    cover:   ($('#edCover').value || '').trim(),
    summary,
    body
  }

  const delBtn = $('#edDel')
  if(delBtn){
    // 改已有的。⚠️ 主键不动 —— 收藏的链接、别人的书签才不会断
    const id = delBtn.getAttribute('data-dev-id')
    devUpdatePost(id, fields)
    location.hash = '#/post/' + encodeURIComponent(id)
  } else {
    let id = makePostId(title)
    const used = new Set(mergedPosts().map(p => p.id))
    const base = id
    let n = 2
    while(used.has(id)) id = base + '-' + (n++)
    devAddPost(Object.assign({ id }, fields))
    location.hash = '#/post/' + encodeURIComponent(id)
  }
  /* 保存目标页和当前页一定不同（#/edit/… → #/post/…），所以 hashchange 一定
     会触发、一定会重画。不用在这儿再补一次 render()。 */
}

/* 实时预览。md() 和文章页用的是同一个渲染器，所以这儿长什么样，发出来就什么样。
   打字时 120ms 防抖 —— 每敲一个字都整篇重渲染，长文章会卡。 */
let previewTimer = 0
function paintPreview(){
  const t = $('#epTitle'), c = $('#epChips'), b = $('#epBody')
  if(!t || !b) return
  const title = ($('#edTitle') ? $('#edTitle').value : '').trim()
  t.textContent = title || '（还没写标题）'
  c.innerHTML = chipsHTML(splitTags($('#edTags') ? $('#edTags').value : ''), false)
  b.innerHTML = md($('#edBody') ? $('#edBody').value : '')
  applyImgMap()
}

/* ---------- 作品编辑 ----------
   编辑表单只有一份（#workEditor），谁的「编辑」被点了就把它搬到谁下面 ——
   比给每张卡片都渲染一个隐藏表单省事，DOM 也干净。
   workEditing 记着正在编辑哪一条（原名），null 表示在新增。 */
let workEditing = null

/* 按 kind + 主键找那张卡片。不用拼 CSS 选择器 —— 作品名里可能有引号、
   空格、中括号，拼进去选择器就废了。挨个比属性最稳。 */
function cardFor(kind, id){
  const acts = document.querySelectorAll('#view [data-dev-edit="' + kind + '"]')
  for(let i = 0; i < acts.length; i++){
    if(acts[i].getAttribute('data-dev-id') === id){
      const c = acts[i].closest('.card')
      if(c) return c
    }
  }
  return null
}

function openWorkEditor(name){
  const ed = $('#workEditor'); if(!ed) return
  const w = name ? mergedWorks().find(x => x.name === name) : null
  workEditing = w ? w.name : null

  $('#workEditorTitle').textContent = w ? '编辑作品' : '添加作品'
  $('#wkName').value = w ? w.name : ''
  $('#wkTags').value = w ? (w.tags || []).join(',') : ''
  $('#wkLink').value = w ? (w.link || '') : ''
  $('#wkDesc').value = w ? (w.desc || '') : ''
  $('#wkErr').hidden = true
  ed.hidden = false

  const anchor = w ? cardFor('work', w.name) : $('#view .dev-bar')
  if(anchor) anchor.insertAdjacentElement('afterend', ed)
  $('#wkName').focus()
}

function hideWorkEditor(){
  const ed = $('#workEditor'); if(ed) ed.hidden = true
  workEditing = null
}

function saveWork(){
  const name = ($('#wkName').value || '').trim()
  if(!name) return fieldError('wkErr', '名称不能空着。')

  const fields = {
    name,
    tags: splitTags($('#wkTags').value),
    link: ($('#wkLink').value || '').trim() || '#',
    desc: ($('#wkDesc').value || '').trim()
  }
  const all = mergedWorks()
  const old = workEditing

  if(all.some(x => x.name === name && x.name !== old))
    return fieldError('wkErr', '已经有一个同名的作品了，换个名字。')

  if(!old){
    devAddWork(fields)
  } else if(old === name){
    devUpdateWork(old, fields)
  } else {
    /* 改了名字。作品的主键就是名字，所以「改名」= 删旧的 + 加新的。
       自己加的能真删；来自 data/works.js 的删不掉，只能软删（标记不再显示），
       再补一条新的上去 —— 结果一样，只是 data/ 里那条还留着。 */
    if(isAddedOverride(LS_WORKS, old)) devRemoveAdded(LS_WORKS, old)
    else devDeleteWork(old)
    devAddWork(fields)
  }
  hideWorkEditor()
  repaint()
}

function delWork(name){
  if(!confirmDelete('作品「' + name + '」', !isAddedOverride(LS_WORKS, name))) return
  devDeleteWork(name)
  hideWorkEditor()
  repaint()
}

/* ---------- 文件下载 ---------- */

function saveFile(){
  const name = ($('#flName').value || '').trim()
  if(!name) return fieldError('flErr', '名称不能空着。')

  const all = mergedFiles()
  const old = fileEditing
  if(all.some(f => f.name === name && f.name !== old))
    return fieldError('flErr', '已经有一个同名的文件了，换个名字。')

  const fields = {
    name,
    size: ($('#flSize').value || '').trim(),
    file: ($('#flHref').value || '').trim(),
    desc: ($('#flDesc').value || '').trim()
  }
  // 传了本体又没填大小，就按本体算一个，省得作者自己估
  if(filePending && !fields.size) fields.size = humanSize(filePending.bytes)

  /* 本体先写。写不进去（配额满了）就直接报错走人，元数据一个字都别动 ——
     不然列表里会多出一条点开是空的下载项。 */
  if(filePending){
    const bad = setFileData(name, filePending.dataUrl)
    if(bad) return fieldError('flErr', bad)
  }

  if(!old){
    devAddFile(fields)
  } else if(old === name){
    devUpdateFile(old, fields)
  } else {
    // 改名 = 删旧的 + 加新的（文件的主键就是显示名，同作品）
    if(isAddedOverride(LS_FILES, old)) devRemoveAdded(LS_FILES, old)
    else devDeleteFile(old)
    devAddFile(fields)
    // 上传过的本体也跟着搬家，不然改个名文件就"丢"了
    const d = fileData(old)
    if(d){ setFileData(name, d); dropFileData(old) }
  }
  closeSheet()
  repaint()
}

function delFile(name){
  if(!confirmDelete('文件「' + name + '」', !isAddedOverride(LS_FILES, name))) return
  devDeleteFile(name)
  dropFileData(name)      // 本体也一起清掉，不然会一直占着配额
  repaint()
}

/* ---------- 网站导航：分类 + 分类里的网站 ----------
   分类的编辑表单只有一份（#siteEditor），搬到对应那个 <section> 后面；
   网站条目的（#linkEditor）同理，搬到对应那一行后面。 */

let siteEditingKey = null    // 正在编辑的分类 key，null = 新增
let linkCat = null           // 正在编辑的网站属于哪个分类
let linkIndex = -1           // 网站在那 个 links 数组里的下标，-1 = 新增

function siteSection(key){
  const secs = document.querySelectorAll('#view .site-cat')
  for(let i = 0; i < secs.length; i++){
    if(secs[i].getAttribute('data-site-key') === key) return secs[i]
  }
  return null
}
function linkRow(catKey, i){
  const rows = document.querySelectorAll('#view .site-link')
  for(let k = 0; k < rows.length; k++){
    if(rows[k].getAttribute('data-cat') === catKey && +rows[k].getAttribute('data-i') === i) return rows[k]
  }
  return null
}

function openSiteEditor(key){
  const ed = $('#siteEditor'); if(!ed) return
  const c = key ? mergedSites().find(x => x.key === key) : null
  siteEditingKey = c ? c.key : null

  $('#siteEditorTitle').textContent = c ? '编辑分类' : '添加分类'
  $('#stName').value = c ? c.name : ''
  $('#stDesc').value = c ? (c.desc || '') : ''
  /* 图标只能从已经打包进 data/icons.js 的那些里挑 —— 加新图标要重跑
     一次「更新图标.bat」，手打一个不存在的名字只会让图标位置空一块 */
  $('#stIcon').innerHTML = iconOptions(c ? c.icon : 'compass')
  $('#stErr').hidden = true
  ed.hidden = false

  const anchor = c ? siteSection(c.key) : $('#view .dev-bar')
  if(anchor) anchor.insertAdjacentElement('afterend', ed)
  $('#stName').focus()
}

function hideSiteEditor(){
  const ed = $('#siteEditor'); if(ed) ed.hidden = true
  siteEditingKey = null
}

function saveSite(){
  const name = ($('#stName').value || '').trim()
  if(!name) return fieldError('stErr', '名称不能空着。')

  const fields = {
    name,
    icon: $('#stIcon').value || 'compass',
    desc: ($('#stDesc').value || '').trim()
  }

  if(siteEditingKey){
    /* ⚠️ 改名字不动 key。key 是主键，也是分类里那些网站挂靠的地方 ——
       动它等于把整个分类连里面的网站一起换了个身份。 */
    devUpdateSite(siteEditingKey, fields)
  } else {
    let key = makeSiteKey(name)
    const used = new Set(mergedSites().map(s => s.key))
    const base = key
    let n = 2
    while(used.has(key)) key = base + '-' + (n++)
    devAddSite(Object.assign({ key, links: [] }, fields))
  }
  hideSiteEditor()
  repaint()
}

function delSite(key){
  const c = mergedSites().find(x => x.key === key); if(!c) return
  const n = (c.links || []).length
  let msg = '删除分类「' + c.name + '」？'
  if(n) msg += '\n\n里面的 ' + n + ' 个网站也会一起没了。'
  if(!isAddedOverride(LS_SITES, key))
    msg += '\n\n⚠️ 这个分类来自 data/sites.js，浏览器删不掉磁盘上的文件 —— 它只会「不再显示」，data/ 里那条还在。'
  if(!confirm(msg)) return
  devDeleteSite(key)
  hideSiteEditor()
  repaint()
}

function openLinkEditor(catKey, i){
  const ed = $('#linkEditor'); if(!ed) return
  const c = mergedSites().find(x => x.key === catKey); if(!c) return
  const idx = (typeof i === 'number' && i >= 0) ? i : -1
  const l = idx >= 0 ? (c.links || [])[idx] : null

  linkCat = catKey
  linkIndex = l ? idx : -1
  $('#linkEditorTitle').textContent = l ? '编辑网站' : ('往「' + c.name + '」里加网站')
  $('#lkName').value = l ? l.name : ''
  $('#lkUrl').value = l ? l.url : ''
  $('#lkDesc').value = l ? (l.desc || '') : ''
  $('#lkErr').hidden = true
  ed.hidden = false

  const row = l ? linkRow(catKey, idx) : null
  if(row){
    row.insertAdjacentElement('afterend', ed)
  } else {
    // 新增：挂到那个分类的 .site-links 最后面
    const box = siteSection(catKey) && siteSection(catKey).querySelector('.site-links')
    if(box) box.appendChild(ed)
  }
  $('#lkName').focus()
}

function hideLinkEditor(){
  const ed = $('#linkEditor'); if(ed) ed.hidden = true
  linkCat = null
  linkIndex = -1
}

function saveLink(){
  const c = mergedSites().find(x => x.key === linkCat); if(!c) return
  const name = ($('#lkName').value || '').trim()
  let url = ($('#lkUrl').value || '').trim()
  if(!name) return fieldError('lkErr', '名称不能空着。')
  if(!url)  return fieldError('lkErr', '网址不能空着。')
  /* 光写个 github.com 点过去会变成当前站下的相对路径（file:// 下直接打不开），
     没写协议就补一个 https:// */
  if(!/^[a-z][a-z0-9+.-]*:/i.test(url) && url.charAt(0) !== '#' && url.charAt(0) !== '/')
    url = 'https://' + url

  const links = (c.links || []).slice()
  const item = { name, url, desc: ($('#lkDesc').value || '').trim() }
  if(linkIndex >= 0) links[linkIndex] = item
  else links.push(item)

  /* ⚠️ 网站条目没有单独一套增删改 —— 它是分类的一个字段（links 数组）。
     加一条 = 把整个数组改掉、更新一次分类。就一层，不值得再拆。 */
  devUpdateSite(linkCat, { links })
  hideLinkEditor()
  repaint()
}

function delLink(catKey, i){
  const c = mergedSites().find(x => x.key === catKey); if(!c) return
  const l = (c.links || [])[i]; if(!l) return
  if(!confirm('从「' + c.name + '」里删掉「' + l.name + '」？')) return
  const links = (c.links || []).slice()
  links.splice(i, 1)
  devUpdateSite(catKey, { links })
  hideLinkEditor()
  repaint()
}

/* ---------- 删除确认 ----------
   来自 data/*.js 的和自己加的，说法不一样 —— 前者只能「不再显示」，
   浏览器改不了磁盘上的文件。不提醒的话，人会以为删干净了，
   结果重新部署一次又全回来了。 */
function confirmDelete(what, fromFile){
  return confirm(fromFile
    ? '删除' + what + '？\n\n' +
      '⚠️ 这条来自 data/ 里的 .js 文件。浏览器改不了磁盘上的文件，' +
      '所以只能「不再显示」—— 它会从这个列表里消失，但 data/ 里那条还在，' +
      '重新部署或者清掉站点数据就会回来。'
    : '删除' + what + '？\n\n这条是你自己加的，删了就真没了。')
}

/* ---------- 页面重画 ---------- */
const repaint = () => { if(typeof render === 'function') render() }
/* 换完站点图片要把读这几张图的地方都重画一遍。没做「只重画变化的那一处」——
   paintMark / bootBackground / render 都是重写 innerHTML，很便宜，
   整体来一遍能保证没有漏网的读取点。 */
const refreshImages = () => { paintMark(); bootBackground(); repaint() }

/* ==========================================================================
   把上面这些接起来
   ========================================================================== */
function bootDev(){
  const view = $('#view')
  const sheet = $('#devSheet')

  /* 上次退出时开发者模式是开着的，这次进来就还开着（对作者省一步）。
     ⚠️ 必须排在 render() 之前 —— 编辑控件是渲染时就带着 .dev-only 的，
        类名得先挂上去，不然第一屏会先闪一下没有按钮的样子。 */
  document.documentElement.classList.toggle('dev-on', devModeOn())

  /* 齿轮：点一下开关 */
  const gear = $('#markDev')
  if(gear) gear.addEventListener('click', e => {
    e.stopPropagation()
    const on = !devOn()
    setDevMode(on)
  })

  /* 右下角工具条 */
  const bImgs = $('#devBarImgs')
  if(bImgs) bImgs.addEventListener('click', openSlotsSheet)
  const bOff = $('#devBarOff')
  if(bOff) bOff.addEventListener('click', devRelock)

  /* ---------- 小窗口里的交互（委托，因为里面是现拼的 HTML） ---------- */
  if(sheet){
    sheet.addEventListener('click', e => {
      const t = e.target
      if(!t.closest) return
      if(t.closest('[data-sheet-close]')) return closeSheet()

      const r = t.closest('[data-slot-reset]')
      if(r && !r.disabled){
        dropImgOverride(r.getAttribute('data-slot-reset'))
        refreshImages()
        openSlotsSheet()          // 列表还在的话原地刷新一下状态
      }
    })

    sheet.addEventListener('change', e => {
      const t = e.target
      if(!t.files || !t.files[0]) return
      const f = t.files[0]

      // 站点图片位（顶栏方块 / 头像 / 背景）
      const su = t.closest('[data-slot-up]')
      if(su){
        const key = su.getAttribute('data-slot-up')
        const max = (IMG_SLOTS.find(x => x.key === key) || {}).max || 1600
        readImageFile(f, max, (bad, url) => {
          if(bad) return sheetError(bad)
          try { localStorage.setItem('kili.img.' + key, url) }
          catch(err){ return sheetError('存不下了，换张小点的图试试') }
          refreshImages()
          // 从列表里点的就留在列表（刷新一下状态），从单张的小窗口点的就关掉
          if($('#sheetBody').querySelector('[data-slot-reset]')) openSlotsSheet()
          else closeSheet()
        })
        return
      }

      // 页面上任意一张普通图片
      if(t.closest('[data-img-up]')){
        readImageFile(f, 1600, (bad, url) => {
          if(bad) return sheetError(bad)
          const err = setImgMap(imgSheetOrig, url)
          if(err) return sheetError(err)
          closeSheet()
          repaint()
        })
        return
      }

      // 下载文件的本体。先只读进内存，按保存才真写进去
      if(t.closest('[data-file-up]')){
        readAnyFile(f, 1920, (bad, url) => {
          if(bad) return sheetError(bad)
          filePending = { dataUrl: url, bytes: f.size }
          const h = $('#flHint')
          if(h) h.innerHTML = '已选好 <b>' + esc(f.name) + '</b>（' + humanSize(f.size) +
            '）—— 点「保存」才会真的存进来。'
          const n = $('#flName')
          if(n && !n.value.trim()) n.value = f.name
        })
      }
    })
  }

  /* Esc 关小窗口 */
  document.addEventListener('keydown', e => {
    if(e.key === 'Escape') closeSheet()
  })

  /* ---------- 页面上点了图片 = 换图 ----------
     ⚠️ 挂在 document 的**捕获阶段**（第三个参数 true）。
        文章卡片是整框可点的（拉伸链接那层 ::after 铺满卡片），封面图的点击
        会冒泡到链接上、直接跳走。捕获阶段拦下来，preventDefault + stopPropagation，
        链接就收不到这一下了。
        同理适用于顶栏方块和头像 —— 它们各自有别的点击行为。 */
  document.addEventListener('click', e => {
    if(!devOn()) return
    const t = e.target
    if(!t || !t.closest) return
    const im = t.closest('img')
    if(!im) return

    // 顶栏方块里的图 = markImg 那个图片位
    if(im.closest('#markFace')){
      e.preventDefault(); e.stopPropagation()
      return openSlotSheet('markImg')
    }
    // 首页头像（正面/背面各是一个 .ha-face；背面那个带 .ha-back）
    const face = im.closest('.ha-face')
    if(face){
      e.preventDefault(); e.stopPropagation()
      return openSlotSheet(face.classList.contains('ha-back') ? 'avatarBack' : 'avatar')
    }
    // 剩下的只在主内容区里管 —— 页眉页脚这些地方的图不掺和
    if(!im.closest('#view')) return
    e.preventDefault(); e.stopPropagation()
    openImageSheet(im)
  }, true)

  /* ---------- 页面上那些编辑按钮（委托，因为 #view 整块会重画） ---------- */
  view.addEventListener('click', e => {
    const t = e.target
    if(!t || !t.closest) return

    const nw = t.closest('[data-dev-new]')
    if(nw){
      const kind = nw.getAttribute('data-dev-new')
      if(kind === 'post') location.hash = '#/edit/new'
      else if(kind === 'work') openWorkEditor(null)
      else if(kind === 'file') openFileSheet(null)
      else if(kind === 'site') openSiteEditor(null)
      else if(kind === 'link') openLinkEditor(nw.getAttribute('data-dev-id'), -1)
      return
    }

    const ed = t.closest('[data-dev-edit]')
    if(ed){
      const kind = ed.getAttribute('data-dev-edit')
      const id   = ed.getAttribute('data-dev-id')
      const i    = ed.getAttribute('data-dev-i')
      if(kind === 'post')      location.hash = '#/edit/' + encodeURIComponent(id)
      else if(kind === 'work') openWorkEditor(id)
      else if(kind === 'file') openFileSheet(id)
      else if(kind === 'site') openSiteEditor(id)
      else if(kind === 'link') openLinkEditor(id, i === null ? -1 : +i)
      return
    }

    const dl = t.closest('[data-dev-del]')
    if(dl){
      const kind = dl.getAttribute('data-dev-del')
      const id   = dl.getAttribute('data-dev-id')
      const i    = dl.getAttribute('data-dev-i')
      if(kind === 'post'){
        const p = mergedPosts().find(x => x.id === id)
        delPost(id, p ? p.title : id)
      }
      else if(kind === 'work') delWork(id)
      else if(kind === 'file') delFile(id)
      else if(kind === 'site') delSite(id)
      else if(kind === 'link') delLink(id, i === null ? -1 : +i)
      return
    }

    /* 就地编辑器上那几个按钮 */
    if(t.closest('#wkSave'))   return saveWork()
    if(t.closest('#wkCancel')) return hideWorkEditor()
    if(t.closest('#stSave'))   return saveSite()
    if(t.closest('#stCancel')) return hideSiteEditor()
    if(t.closest('#lkSave'))   return saveLink()
    if(t.closest('#lkCancel')) return hideLinkEditor()
    if(t.closest('#edSave'))   return savePost()
  })

  /* 正文边打字边预览。120ms 防抖 —— 每敲一个字整篇重渲染，长文会卡 */
  view.addEventListener('input', e => {
    if(!e.target || !e.target.closest || !e.target.closest('#postEditor')) return
    clearTimeout(previewTimer)
    previewTimer = setTimeout(paintPreview, 120)
  })

  /* 画完页面之后：编辑页要先把预览填出来（不然那一块空着）。
     走注册制，见 app/util.js 的 afterPaint / runAfterPaint。 */
  afterPaint(paintPreview)
}

/* 删文章。删除按钮上只有 id，标题得现查 —— 确认框里写标题比写 id 好认。 */
function delPost(id, title){
  if(!confirmDelete('文章「' + title + '」', !isAddedOverride(LS_POSTS, id))) return
  devDeletePost(id)
  /* 正站在这个文章的详情页或者编辑页上，就得先离开 —— 不然重画出来的
     还是那篇文章，或者更糟：编辑页的保存按钮指向一条已经不存在的记录。 */
  if(location.hash.indexOf('#/post/') === 0 || location.hash.indexOf('#/edit/') === 0)
    location.hash = '#/posts'
  else
    repaint()
}

/* ---------- 背景图 ---------- */
/* 背景图。两张分别写给两个图层，谁显示由 html[data-theme] 决定（见 CSS），
   所以这里不用管当前是白天还是夜里，也不用跟着主题重算。
   没配夜间图就让它跟白天一样 —— 交叉淡化变成「同一张图淡入同一张图」，
   等于没有效果，但代码路径只有一条，不用到处特判。

   ⚠️ 这里必须把相对路径拼成绝对路径再用，别直接 'url("' + p + '")'。
   因为 --bg-day 是在 styles/variables.css 里被 background-image 消费的，
   而 CSS 里的相对 URL 是**相对那份样式表**解析的，不是相对 index.html ——
   写 './bg.svg' 会去找 styles/bg.svg，于是两张背景图全都 404，
   页面上就只剩纯色底 + 遮罩，看着像「背景图没生效」。
   （改成内联 <style> 时是对的，拆成外部 css 之后路径基准就变了。
     图标没踩到这个坑，因为 --ico 是写在元素的行内 style 上的，
     行内样式的基准是文档本身。）
   用 new URL(p, document.baseURI) 定死成绝对路径，放哪个样式表里都一样。 */
function bootBackground(){
  const r = document.documentElement.style
  const url = p => {
    if(!p) return 'none'
    let abs = p
    try { abs = new URL(p, document.baseURI).href } catch(e){}
    return 'url("' + abs + '")'
  }
  // 走 siteImg：开发者模式换过就用换过的那张，否则回落到 site.js 里的
  const day = siteImg('bgDay') || SITE.bgImage || null
  r.setProperty('--bg-day',   url(day))
  r.setProperty('--bg-night', url(siteImg('bgNight') || day))
  r.setProperty('--bg-veil', String(SITE.bgVeil))
}

/* ---------- 背景粒子（那层飘着的小几何图形） ----------
   参考站在面板背后、背景之上飘了一层小图形，我们原来没有，这次补上。
   亮色：彩色的三角/碎片/菱形/六边形/方块，颜色直接读 --reflection-*，
         和首屏标题的彩虹镀膜是同一套色 —— 改那七个变量，两边一起变。
   暗色：换成会呼吸的白色小圆点和星星，叠加模式用 lighter，叠出一点发光感。

   纯装饰：外层 .particle-layer 已经关掉 pointer-events 并标了 aria-hidden，
   系统开了「减少动态效果」就整个不启动。 */
function bootParticles(){
  const cfg = SITE.particles || {}
  const cv = $('#particles')
  if(!cv || cfg.enabled === false) return
  const ctx = cv.getContext('2d')
  if(!ctx) return
  const rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)')
  if(rm && rm.matches) return

  const COUNT  = Math.max(0, cfg.count == null ? 80 : cfg.count)
  const SPEED  = cfg.speed == null ? 0.5 : cfg.speed
  const MARGIN = 50          // 飘出边界这么远才回绕，免得粒子贴着边一闪就没
  const SHAPES_LIGHT = ['triangle', 'shard', 'diamond', 'hexagon', 'square']
  const SHAPES_DARK  = ['circle', 'star']

  let resizeTimer = 0, themeTimer = 0
  let W = 0, H = 0, parts = []

  const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark'

  /* 颜色不在 JS 里另抄一份，直接从 CSS 变量读。
     注意要把透明度重写一遍：--reflection-* 是给「大片色带」用的极淡色
     （.17 上下），原样拿来画小粒子根本看不见。 */
  function palette(){
    const cs = getComputedStyle(document.documentElement)
    const out = []
    for(let i = 1; i <= 7; i++){
      const v = cs.getPropertyValue('--reflection-' + i).trim()
      if(!v) continue
      const a = isDark() ? '.85' : '.45'
      out.push(/,[\s\d.]+\)$/.test(v) ? v.replace(/,[\s\d.]+\)$/, ',' + a + ')') : v)
    }
    if(!out.length) out.push(isDark() ? 'rgba(255,255,255,.85)' : 'rgba(102,181,234,.45)')
    return out
  }

  /* 正多边形，第一个顶点朝上（-90°）。
     参考站里 triangle / square / hexagon 都走这一条，
     所以「square」是个菱形朝向的正方形，不是正的 —— 照抄。 */
  function poly(c, n, r){
    const step = Math.PI * 2 / n, start = -Math.PI / 2
    c.moveTo(Math.cos(start) * r, Math.sin(start) * r)
    for(let i = 1; i < n; i++){
      const a = start + step * i
      c.lineTo(Math.cos(a) * r, Math.sin(a) * r)
    }
    c.closePath()
  }

  class Particle{
    constructor(dark, cols){
      this.x = Math.random() * W
      this.y = Math.random() * H
      this.size = dark ? Math.random() * 4 + 3 : Math.random() * 6 + 4
      const sp = dark ? SPEED * 0.6 : SPEED
      const ang = Math.random() * Math.PI * 2
      this.vx = Math.cos(ang) * sp
      this.vy = Math.sin(ang) * sp
      this.color = dark ? 'rgba(255,255,255,.85)' : cols[Math.floor(Math.random() * cols.length)]
      const pool = dark ? SHAPES_DARK : SHAPES_LIGHT
      this.shape = pool[Math.floor(Math.random() * pool.length)]
      this.rot = Math.random() * Math.PI * 2
      this.spin = (Math.random() - 0.5) * 0.02
      // 暗色才呼吸；亮色是死的不透明度，跟参考站一致
      this.alpha = dark ? Math.random() * 0.4 + 0.6 : 1
      this.pulse = dark ? (Math.random() - 0.5) * 0.02 : 0
    }
    update(){
      this.x += this.vx
      this.y += this.vy
      this.rot += this.spin
      if(this.x < -MARGIN) this.x = W + MARGIN
      if(this.x > W + MARGIN) this.x = -MARGIN
      if(this.y < -MARGIN) this.y = H + MARGIN
      if(this.y > H + MARGIN) this.y = -MARGIN
      if(this.pulse){
        this.alpha += this.pulse
        if(this.alpha > 1 || this.alpha < 0.4) this.pulse = -this.pulse
      }
    }
    path(c){
      const s = this.size
      switch(this.shape){
        case 'circle': c.arc(0, 0, s / 2, 0, Math.PI * 2); break
        case 'star': {
          const w = s * 0.3
          c.moveTo(0, -s)
          c.quadraticCurveTo(0, -w, s, 0)
          c.quadraticCurveTo(0, w, 0, s)
          c.quadraticCurveTo(0, w, -s, 0)
          c.quadraticCurveTo(0, -w, 0, -s)
          c.closePath()
          break
        }
        case 'diamond':
          c.moveTo(0, -s * 1.5); c.lineTo(s, 0); c.lineTo(0, s * 1.5); c.lineTo(-s, 0)
          c.closePath(); break
        case 'shard':
          c.moveTo(0, -s); c.lineTo(s, s); c.lineTo(-s * 0.8, s * 0.6)
          c.closePath(); break
        case 'hexagon': poly(c, 6, s); break
        case 'square':  poly(c, 4, s); break
        default:        poly(c, 3, s)
      }
    }
    draw(){
      const c = ctx
      c.save()
      c.translate(this.x, this.y)
      c.rotate(this.rot)
      c.globalAlpha = this.alpha
      c.fillStyle = this.color
      // 圆和星星用 lighter 叠，重叠处更亮，暗色下才有「发光」的意思。
      // restore() 会把这个状态一起还原，不会漏给下一个粒子。
      c.globalCompositeOperation =
        (this.shape === 'circle' || this.shape === 'star') ? 'lighter' : 'source-over'
      c.beginPath()
      this.path(c)
      c.fill()
      c.restore()
    }
  }

  function make(){
    const dark = isDark(), cols = palette()
    parts = []
    for(let i = 0; i < COUNT; i++) parts.push(new Particle(dark, cols))
  }

  function resize(){
    // 按设备像素比放大画布，再用 setTransform 把绘制坐标换算回 CSS 像素，
    // 否则高分屏上粒子会糊、还会小一圈。
    // 上限 2：再高的倍率纯属白烧 GPU，看不出区别。
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    W = window.innerWidth
    H = window.innerHeight
    cv.width = Math.round(W * dpr)
    cv.height = Math.round(H * dpr)
    // canvas 一改尺寸，上下文状态就被重置了，setTransform 必须放在这之后
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    make()
  }

  function frame(){
    ctx.clearRect(0, 0, W, H)
    for(let i = 0; i < parts.length; i++){
      parts[i].update()
      parts[i].draw()
    }
    requestAnimationFrame(frame)
  }

  resize()
  frame()

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(resize, 150)   // 拖窗口时别每一帧都重建粒子
  })
  // 主题一换，颜色和形状整套都不同（彩色多边形 ↔ 白色圆/星），粒子得重做一批。
  // 用 MutationObserver 盯着 data-theme，而不是让 bootTheme 反过来调这里 ——
  // 这样即使以后主题是从别处改的，粒子也跟得上。
  if(window.MutationObserver){
    new MutationObserver(() => {
      clearTimeout(themeTimer)
      themeTimer = setTimeout(make, 120)   // 等一下，让 CSS 变量的新值先落定
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  }
  // 页面藏到后台时 requestAnimationFrame 本来就会自动停，不用自己再管一次
}

/* ---------- 主题（跟随时间 / 亮色 / 暗色 三态） ---------- */
let THEME_MODE = 'auto'    // 'auto' | 'light' | 'dark'
let THEME_TICK = null      // 时钟每秒调它一次，跨过夜间分界线就自动切

function isNight(d){
  const h = d.getHours(), f = SITE.nightFrom, t = SITE.nightTo
  // f > t 才是跨午夜的区间（18 点 → 次日 6 点）。
  // 写成不跨的区间（比如 9 → 17）也支持，免得以后改配置踩坑。
  return f > t ? (h >= f || h < t) : (h >= f && h < t)
}

function bootTheme(){
  const btn = $('#themeBtn')
  const metaTc = document.querySelector('meta[name="theme-color"]')
  const root = document.documentElement

  // 逃生口：allowDark:false 就锁死亮色，主题按钮也藏起来
  if(SITE.allowDark === false){
    root.setAttribute('data-theme', 'light')
    if(btn) btn.hidden = true
    if(metaTc) metaTc.setAttribute('content', '#f2faff')
    return
  }

  let saved = null
  try { saved = localStorage.getItem('theme') } catch(e){}
  // 没记录过 = 跟随时间
  THEME_MODE = (saved === 'light' || saved === 'dark') ? saved : 'auto'

  const dark = () => THEME_MODE === 'dark' ||
    (THEME_MODE === 'auto' && isNight(new Date()))

  const LABEL = { auto:['theme-auto','跟随时间'], light:['theme-light','亮色主题'], dark:['theme-dark','暗色主题'] }
  let painted = null

  // 这个每秒都会被时钟调到，所以先比一下；没变就直接返回，别每秒刷 DOM
  const apply = () => {
    const d = dark()
    if(d === painted) return
    painted = d
    root.setAttribute('data-theme', d ? 'dark' : 'light')
    if(metaTc) metaTc.setAttribute('content', d ? '#0b1622' : '#f2faff')
  }
  const paintBtn = () => {
    if(!btn) return
    const [ico, txt] = LABEL[THEME_MODE]
    btn.innerHTML = `<span class="rail-ico">${icoHTML(ico)}</span><span class="rail-txt">${esc(txt)}</span>`
    btn.title = THEME_MODE === 'auto'
      ? `跟随时间（${SITE.nightFrom} 点～${SITE.nightTo} 点夜间）· 点击切换`
      : txt + ' · 点击切换'
    btn.setAttribute('aria-label', txt)
  }

  apply(); paintBtn()
  THEME_TICK = apply

  if(btn) btn.addEventListener('click', () => {
    const order = ['auto', 'light', 'dark']
    THEME_MODE = order[(order.indexOf(THEME_MODE) + 1) % 3]
    try { localStorage.setItem('theme', THEME_MODE) } catch(e){}
    painted = null          // 强制重刷一次
    apply(); paintBtn()
  })
}

/* ---------- 阅读进度 ---------- */
function updateProgress(){
  const bar = $('#progress')
  const h = document.documentElement.scrollHeight - window.innerHeight
  bar.style.width = h > 0 ? Math.min(100, window.scrollY / h * 100) + '%' : '0%'
}
window.addEventListener('scroll', updateProgress, { passive: true })
window.addEventListener('resize', updateProgress)

/* ---------- 开场动画 ---------- */
function bootSplash(){
  const eggs = [
    ['( ˘ω˘ )',      '编译中，请勿断电'],
    ['(・ω・)ノ',     '正在把咖啡因转换成代码'],
    ['(╯°□°)╯',      '刚刚那个 bug 不是我写的'],
    ['(๑•̀ㅂ•́)و✧',   '这次一定能跑起来'],
    ['( ⌐■_■)',      '正在检查有没有漏掉分号'],
    ['(˘･_･˘)',      '文档说这样写就行……大概'],
    ['(＠_＠)',       '这个报错我从来没见过'],
    ['( ˶‾᷄ ⁻̫ ‾᷅˵)','正在假装看懂了源码'],
    ['(•_•) ( •_•)>⌐■-■','正在戴上墨镜，准备重构'],
    ['(눈_눈)',       '又是没有测试的一天'],
    ['ᕕ( ᐛ )ᕗ',     '部署成功，祈祷不要回滚'],
    ['( ˙灬˙ )',     '正在加载，也许吧'],
    ['(´･ω･`)',      '这个功能昨晚还好的'],
    ['(≧∇≦)ﾉ',      '上线了！'],
    ['(￣▽￣)ノ',     '正在删除注释掉的代码'],
    ['( •̀ ω •́ )✧',  '正在写最后一行，真的'],
    ['(´-ω-`)',      '本地跑得起来，那就没问题'],
    ['(๑¯ω¯๑)',      '正在等 CI 转圈'],
  ]
  const pick = eggs[Math.floor(Math.random()*eggs.length)]
  $('#sf').textContent = pick[0]
  $('#sq').textContent = pick[1]

  const splash = $('#splash')
  let seen = false
  try { seen = sessionStorage.getItem('splashSeen') === '1' } catch(e){}
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const wait = (seen || reduce) ? 0 : 1500

  setTimeout(() => {
    splash.classList.add('gone')
    setTimeout(() => splash.remove(), 850)
    try { sessionStorage.setItem('splashSeen','1') } catch(e){}
  }, wait)
}

/* ---------- 图标样式 ----------
   data/icons.js 里存的是每个图标的 data: URI。这里一次性把它们摊成
   .ico-home{--ico:url('data:...')} 这样的规则塞进一个 <style>，
   而不是把那一长串 base64 写进每个图标的行内 style ——
   首页有十几个图标，行内的话同样的内容要在 DOM 里重复十几遍，白白撑大页面。

   必须在 render() 之前跑：icoHTML() 输出的是 .ico-<名字> 这个类名，
   规则还没注入的话，第一屏的图标会是没有 --ico 的空壳。 */
function bootIcons(){
  if(typeof ICONS === 'undefined') return
  const set = ICONS[SITE.iconExt || '.svg']
  if(!set) return
  const css = Object.keys(set)
    .filter(n => /^[A-Za-z0-9_-]+$/.test(n))
    .map(n => `.ico-${n}{--ico:url('${set[n]}')}`)
    .join('')
  const el = document.createElement('style')
  el.id = 'icoCss'
  el.textContent = css
  document.head.appendChild(el)
}

/* ---------- 启动 ---------- */
bootIcons()       // 要在 render() 之前：render 出来的图标只有类名，等着这套规则
bootChrome()
bootSecret()      // 得排在 bootChrome 后面：方块是刚填好内容的
bootRail()
bootBackground()
bootTheme()
bootParticles()   // 放在 bootTheme 后面：粒子要先读到主题定下来的 CSS 变量
bootClock()
bootSearch()
bootDelegates()
bootAvatarFlip()  // 和 bootDelegates 一样挂在 #view 上，也得赶在 render() 之前挂好
bootDev()
window.addEventListener('hashchange', render)
render()
bootSplash()
