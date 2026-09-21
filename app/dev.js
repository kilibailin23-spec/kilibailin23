/* 开发者模式：顶栏方块的长按彩蛋，以及小窗口、换图、文件、文章/作品/网站的增删改、页面上的编辑控件 */
/* ==========================================================================
   顶栏方块：长按 3 秒的彩蛋
   ========================================================================== */

const DEV_KEY = 'kili.dev'

function devRelock(){
  lsDel(DEV_KEY)
  setDevMode(false)

  const mark = $('#brandMark'), btn = $('#markDev')
  if(btn) btn.hidden = true
  if(!mark) return

  mark.classList.remove('is-dev')
  mark.title = mark.getAttribute('data-lock-title') || '长按 3 秒…'
  mark.setAttribute('aria-label', mark.getAttribute('data-lock-label') || '白麟')

  mark.classList.remove('is-lock')
  void mark.offsetWidth
  mark.classList.add('is-lock')
  setTimeout(() => mark.classList.remove('is-lock'), 600)
}

function bootSecret(){
  const mark = $('#brandMark'), btn = $('#markDev'), boom = $('#markBoom')
  if(!mark || !btn || !boom) return

  if(SITE.dev === false || SITE.dev === null) return

  const HOLD  = 3000      // ⚠️ 必须和 aero.css 里进度环那个 3s 对齐，改一个记得改另一个
  const SPARK = ['#8fcbf1','#66b5ea','#a9c7f5','#d9b8e8','#7fd8d0','#ffffff']

  mark.setAttribute('data-lock-title', mark.title)
  mark.setAttribute('data-lock-label', mark.getAttribute('aria-label') || '')

  let timer = 0
  let fired = false

  const unlocked = () => lsGet(DEV_KEY) === '1'
  const unlock = () => {
    mark.classList.add('is-dev')
    btn.hidden = false
    mark.title = '齿轮 = 开发者模式开关；右键点方块 = 恢复'
    mark.setAttribute('aria-label', '开发者模式（右键点一下恢复）')
  }

  if(unlocked()) unlock()

  const stopPress = () => {
    if(timer){ clearTimeout(timer); timer = 0 }
    mark.classList.remove('is-press')
  }

  const boomNow = () => {
    timer = 0
    fired = true
    mark.classList.remove('is-press')
    mark.classList.add('is-boom')

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

    setTimeout(unlock, 620)
    setTimeout(() => {
      mark.classList.remove('is-boom')
      boom.classList.remove('go')
      boom.innerHTML = ''
    }, 1500)

    lsSet(DEV_KEY, '1')
  }

  mark.addEventListener('pointerdown', e => {
    if(mark.classList.contains('is-dev')) return
    if(e.button) return
    fired = false
    stopPress()
    mark.classList.add('is-press')
    timer = setTimeout(boomNow, HOLD)
  })
  mark.addEventListener('pointerup', stopPress)
  mark.addEventListener('pointercancel', stopPress)
  mark.addEventListener('pointerleave', stopPress)
  mark.addEventListener('contextmenu', e => {
    if(mark.classList.contains('is-press')){ e.preventDefault(); return }
    if(!mark.classList.contains('is-dev')) return
    e.preventDefault()
    devRelock()
  })

  mark.addEventListener('click', e => {
    if(e.target && e.target.closest && e.target.closest('#markDev')) return
    if(fired) return
    if(location.hash && location.hash !== '#/') location.hash = '#/'
  })
  mark.addEventListener('keydown', e => {
    if(e.key !== 'Enter' && e.key !== ' ') return
    if(e.target && e.target.closest && e.target.closest('#markDev')) return
    e.preventDefault()
    if(location.hash && location.hash !== '#/') location.hash = '#/'
  })
}

/* ---------- 把图片文件读成 data: URI ---------- */
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
   ========================================================================== */

function devOn(){
  return document.documentElement.classList.contains('dev-on')
}

function setDevMode(on){
  document.documentElement.classList.toggle('dev-on', on)
  devModeFlag(on)
  closeSheet()

  if(location.hash.indexOf('#/edit/') === 0){
    if(on) render()
    else location.hash = '#/posts'
  }
}

/* ---------- 小窗口 ---------- */
/* wide 不传就是默认那档（430px）；裁剪那一步需要宽一点，会传 true。
   ⚠️ 每次打开都显式设一遍，不然上一次放宽的窗口会留给下一个弹窗。 */
function openSheet(title, bodyHTML, buttons, wide){
  const s = $('#devSheet'); if(!s) return
  $('#sheetTitle').textContent = title
  $('#sheetBody').innerHTML = bodyHTML

  const box = s.querySelector('.modal-box')
  if(box) box.classList.toggle('small', !wide)

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
  imgSheetTarget = null
  imgSheetSlot = null
  imgSheetBack = null
  cropState = null
  filePending = null
  document.documentElement.classList.remove('modal-open')
}

function sheetError(msg){
  const el = $('#sheetErr')
  if(el){ el.textContent = msg; el.hidden = false }
  else alert(msg)
  return false
}

function fieldError(id, msg){
  const el = document.getElementById(id)
  if(el){ el.textContent = msg; el.hidden = false }
  return false
}

/* ---------- 换图 ---------- */
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
    `<p class="dev-hint">这几张是<b>站点自己</b>的图（页面上其它图片 —— 文章封面、
      正文插图这些 —— 直接在页面上点它就能换）。选完会让你先裁一下：
      框里看到的就是它在页面上的样子。</p>`, [])
}

function openSlotSheet(key){
  const s = IMG_SLOTS.find(x => x.key === key) || IMG_SLOTS[0]
  const cur = siteImg(s.key)
  const ov  = !!imgOverride(s.key)
  openSheet(s.label,
    `<div class="dev-preview">${cur ? `<img src="${esc(cur)}" alt="">` : '<span>还没配</span>'}</div>` +
    `<p class="dev-hint">${ov ? '现在用的是你上传的那张。' : '现在用的是 data/site.js 里那张。'}` +
      `选完先裁一下，框里看到的就是它在页面上的样子。</p>` +
    `<div class="dev-upload">
       <label class="dev-btn dev-up">选新图<input type="file" accept="image/*" data-slot-up="${esc(s.key)}"></label>
     </div>
     <p class="dev-err" id="sheetErr" hidden></p>`,
    ov ? [{ label: '还原成 site.js 里那张', ghost: true, on: () => {
      dropImgOverride(s.key); refreshImages(); closeSheet()
    }}] : [])
}

let imgSheetOrig = null
let imgSheetTarget = null      // 被点的那张图 / 封面块，选完图进裁剪时还要用
let imgSheetRatio = 16 / 9     // 裁剪框的比例 = 被点那块在页面上的显示比例
let imgSheetSlot = null        // 非空 = 这次换的是站点图片位（值是 markImg 这种字段名）
let imgSheetMax  = 1600        // 裁剪输出的长边上限，站点图片位按各自的 max 走
let imgSheetBack = null        // 裁剪完回哪个视图：'slots' = 图片位列表页，null = 直接关掉

/* 站点图片位在页面上显示成什么比例。
   方块（42×42）和头像（172×172）的 CSS 尺寸就是正方形，图是 object-fit:cover；
   背景图铺满整屏（.bg-layer 是 position:fixed;inset:0 + background-size:cover），
   所以它的比例跟着当前窗口走 —— 窗口比例变了它还会自己再裁一点，这里只能定「当前这一屏」。 */
function slotRatio(key){
  if(key === 'bgDay' || key === 'bgNight')
    return Math.max(0.4, Math.min(3, window.innerWidth / Math.max(1, window.innerHeight)))
  return 1
}

/* 被点那块「现在显示成什么比例」。
   卡片封面是 CSS 的 aspect-ratio:16/9，正文插图是它自己的比例 —— 按这个比例开裁剪框，
   框里看到的才等于页面上显示的（封面本来就是 object-fit:cover，不裁的话浏览器
   也会自己居中裁一刀，这里只是把那一刀交给用户）。 */
function displayRatio(target, img){
  const r = target.getBoundingClientRect ? target.getBoundingClientRect() : null
  let v = (r && r.width > 1 && r.height > 1) ? r.width / r.height : 0
  if(!v && img && img.naturalWidth && img.naturalHeight) v = img.naturalWidth / img.naturalHeight
  if(!v) v = 16 / 9
  /* 卡片窄得只剩一条、或者图特别细长时别让框跟着疯掉 */
  return Math.max(0.4, Math.min(3, v))
}

/* 换一张图片。target 要么是 <img>，要么是封面的那一格 .cover。
   ⚠️ 封面必须单独支持：没填 cover 的文章渲染出来的是占位块（渐变 + 标题首字），
      **里面没有 <img>** —— 只认 <img> 的话，点它等于什么都没发生，点击还会冒泡到
      整框可点的拉伸链接上，直接跳进文章。
   键的取法：封面的 data-cover-key → 图片的 data-orig → 图片当前的 src，
   和 app/views.js 的 coverHTML()、app/util.js 的 coverKey() 是同一套。 */
function openImageSheet(target){
  const img = target.tagName === 'IMG' ? target : target.querySelector('img')
  const key = target.getAttribute('data-cover-key') ||
              (img ? (img.dataset.orig || img.getAttribute('src') || '') : '')
  imgSheetOrig = key
  imgSheetTarget = target
  imgSheetRatio = displayRatio(target, img)
  imgSheetSlot = null        // 走的是「页面任意图」那条通道，不是站点图片位
  imgSheetMax = 1600
  imgSheetBack = null

  const replaced = !!readImgMap()[key]
  const isCover  = !!(target.classList && target.classList.contains('cover'))
  /* ⚠️ 以 # 开头的键是 coverKey() 编出来的虚拟键（文章还没配封面），不是真地址，别当路径显示 */
  const virtual  = key.charAt(0) === '#'
  const short    = key.length > 70 ? key.slice(0, 70) + '…' : key

  const where = virtual
    ? `这张卡片还没配封面图，现在显示的是标题首字。<br>
       想让别人也看到你换的图，得在 <code>data/posts.js</code> 里给这篇文章加一行
       <code>cover: './图片路径'</code>。`
    : `原图地址：<code>${esc(short)}</code><br>
       想让别人也看到，直接把新图覆盖到那个路径上，或者在 <code>data/</code> 里改路径。`

  openSheet(isCover ? '换一张封面图' : '换一张图片',
    (img ? `<div class="dev-preview"><img src="${esc(img.getAttribute('src') || '')}" alt=""></div>` : '') +
    `<p class="dev-hint">${where}<br>
      改完只在你这个浏览器里生效，磁盘上的文件没动。</p>` +
    `<div class="dev-upload">
       <label class="dev-btn dev-up">选新图片<input type="file" accept="image/*" data-img-up="1"></label>
     </div>
     <p class="dev-err" id="sheetErr" hidden></p>`,
    replaced ? [{ label: (isCover && virtual) ? '去掉这张封面' : '还原成原来那张', ghost: true, on: () => {
      dropImgMap(key); closeSheet(); repaint()
    }}] : [])
}

/* ---------- 选完图之后的裁剪 ----------
   「所见即所得」的那一步：先别急着存，让用户看一眼页面上会显示成什么样再定。
   裁剪框的比例 = 被点那块的显示比例（见 displayRatio），所以框里看到什么，
   页面上最终就显示什么。

   下面是几组量的意思，后面对着代码看：
     natW/natH  原图的像素尺寸
     fw/fh      裁剪框的显示尺寸（CSS 像素）
     scale      图片的显示缩放（图片显示宽度 = natW * scale）
     x/y        图片左上角相对裁剪框左上角的偏移，必定 ≤ 0
   导出时反算回原图坐标：框住的是原图上从 (-x/scale, -y/scale) 起、宽 fw/scale 的一块。 */
let cropState = null

/* 把图片卡在框里（偏移量只在 [框-图, 0] 之间取值，图比框小的话就贴着 0）。
   抽成纯函数是为了能在 smoke-test 里直接验算 —— 改这里等于改了摆图规则。 */
function clampCrop(st){
  st.x = Math.max(Math.min(0, st.fw - st.natW * st.scale), Math.min(0, st.x))
  st.y = Math.max(Math.min(0, st.fh - st.natH * st.scale), Math.min(0, st.y))
}

/* 把「图在框里怎么摆」翻译成「原图上被框住的是哪一块」（纯函数，不碰 DOM）。
   ⚠️ x/y 是负的（图比框大），所以取负号之后才是正的起始坐标。 */
function cropRect(st){
  return {
    sx: -st.x / st.scale,
    sy: -st.y / st.scale,
    sw:  st.fw / st.scale,
    sh:  st.fh / st.scale
  }
}

/* 最终会存下来的像素尺寸：长边封顶 max（和 readImageFile 一个尺度，省 localStorage）。
   ⚠️ 框旁边显示的那个数字、和真存下来的图，必须走同一个算法 —— 别各算各的。 */
function cropOutSize(st, max){
  const sw = st.fw / st.scale, sh = st.fh / st.scale
  const k = Math.min(1, (max || 1600) / Math.max(sw, sh))
  return { w: Math.max(1, Math.round(sw * k)), h: Math.max(1, Math.round(sh * k)) }
}

function openCropSheet(dataUrl){
  const slot = imgSheetSlot
  const target = imgSheetTarget
  if(!slot && !target) return

  const isCover = !!(target && target.classList && target.classList.contains('cover'))
  const ratio = imgSheetRatio || 16 / 9
  const info = slot ? (IMG_SLOTS.find(x => x.key === slot) || {}) : null

  /* 每种图「框里是什么」的说法都不一样，因为它们在页面上呈现的方式不一样 */
  const what = slot
    ? (slot === 'bgDay' || slot === 'bgNight'
        ? '<b>框里是背景在当前窗口比例下露出来的那一块</b>。背景要铺满整屏，' +
          '窗口比例一变它还会自己再裁一点，所以这里定的是「现在这一屏」。'
        : slot === 'markImg'
          ? '<b>框里就是顶栏那个方块里显示的那一块</b> —— 方块是 42×42 的正方，框外会被裁掉。'
          : '<b>框里就是头像里显示的那一块</b> —— 头像是圆的，四个角会被切掉。')
    : isCover
      ? '<b>框里就是卡片封面上显示的那一块</b>，框外会被裁掉。'
      : '<b>框里就是正文里显示的那一块</b>，框外会被裁掉。'

  /* 头像是圆的、顶栏方块是圆角的 —— 这一刀也得画出来，
     不然「框里就是页面上的样子」在这两张身上是假的 */
  const mask = (slot === 'avatar' || slot === 'avatarBack') ? '<i class="dev-crop-mask round"></i>'
             : slot === 'markImg' ? '<i class="dev-crop-mask squircle"></i>'
             : ''

  openSheet(info ? info.label : (isCover ? '换一张封面图' : '换一张图片'),
    `<div class="dev-crop" data-crop-frame><img src="${esc(dataUrl)}" alt="" data-crop-img>${mask}</div>` +
    `<div class="dev-crop-bar">
       <span class="dev-crop-lab">缩放</span>
       <input type="range" min="0" max="100" step="1" value="0" data-crop-zoom aria-label="缩放">
       <span class="dev-crop-size" data-crop-size></span>
     </div>` +
    `<p class="dev-hint">拖动图片挪位置，滚轮或上面这条滑块缩放。${what}</p>` +
    `<div class="dev-upload">
       <label class="dev-btn dev-up">换一张<input type="file" accept="image/*" ${slot ? 'data-slot-up="' + esc(slot) + '"' : 'data-img-up="1"'}></label>
       <button class="dev-btn ghost" type="button" data-crop-cancel>取消</button>
       <button class="dev-btn" type="button" data-crop-ok>就用这一块</button>
     </div>
     <p class="dev-err" id="sheetErr" hidden></p>`,
    [], true)

  const body = $('#sheetBody')
  const frame = body && body.querySelector('[data-crop-frame]')
  const img   = frame && frame.querySelector('[data-crop-img]')
  const zoom  = body && body.querySelector('[data-crop-zoom]')
  const sizeEl = body && body.querySelector('[data-crop-size]')
  if(!frame || !img || !zoom) return

  const st = { frame, img, zoom, sizeEl, ratio,
               natW: 1, natH: 1, fw: 320, fh: 180, min: 1, scale: 1, x: 0, y: 0 }
  cropState = st

  /* 图不能被拖出框外（会露出一块空白），所以偏移量卡在 [框宽-图宽, 0] 之间 */
  const clamp = () => clampCrop(st)
  const paint = () => {
    img.style.width  = (st.natW * st.scale) + 'px'
    img.style.height = (st.natH * st.scale) + 'px'
    img.style.transform = 'translate(' + st.x + 'px,' + st.y + 'px)'
    if(sizeEl){
      const o = cropOutSize(st, imgSheetMax)
      sizeEl.textContent = o.w + '×' + o.h
    }
  }

  /* 缩放时让「锚点」（框中心，或滚轮指着的那个点）在图上的位置待着不动 */
  const zoomTo = (v, px, py) => {
    const cx = (px - st.x) / st.scale, cy = (py - st.y) / st.scale
    st.scale = v
    st.x = px - cx * v
    st.y = py - cy * v
    clamp(); paint()
  }
  const syncZoom = () => {
    const z = st.min > 0 ? Math.log(st.scale / st.min) / Math.log(4) : 0
    zoom.value = String(Math.max(0, Math.min(100, Math.round(z * 100))))
  }

  /* ⚠️ 框的尺寸要等图片 onload 之后再量：那会儿弹窗已经显示出来了，量得到真实宽度
     （写死不行，窄屏上 520px 的弹窗会缩水）。 */
  const ready = () => {
    st.natW = img.naturalWidth || 1
    st.natH = img.naturalHeight || 1

    st.fw = frame.clientWidth || 320
    st.fh = Math.round(st.fw / st.ratio)
    const cap = Math.max(140, Math.min(300, window.innerHeight * 0.4))
    if(st.fh > cap){ st.fh = Math.round(cap); st.fw = Math.round(st.fh * st.ratio) }
    frame.style.height = st.fh + 'px'
    /* 高度被屏幕高度限制住时，宽度也跟着收窄，否则框的比例就不对了 */
    if(st.fw < frame.clientWidth) frame.style.width = st.fw + 'px'

    /* 初始 = 刚好铺满框 + 居中，跟 object-fit:cover 的默认表现一致：
       不拖不缩直接点确定，裁下来的就是浏览器本来会显示的那一块 */
    st.min = Math.max(st.fw / st.natW, st.fh / st.natH)
    st.scale = st.min
    st.x = (st.fw - st.natW * st.scale) / 2
    st.y = (st.fh - st.natH * st.scale) / 2
    clamp(); paint(); syncZoom()
  }
  if(img.complete && img.naturalWidth) ready()
  else {
    img.onload = ready
    img.onerror = () => sheetError('这张图读不出来，换一张试试')
  }

  /* ---- 拖动 ---- */
  let drag = null
  frame.addEventListener('pointerdown', e => {
    if(e.button) return
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, ox: st.x, oy: st.y }
    frame.classList.add('dragging')
    try { frame.setPointerCapture(e.pointerId) } catch(err){}
    e.preventDefault()
  })
  frame.addEventListener('pointermove', e => {
    if(!drag || e.pointerId !== drag.id) return
    st.x = drag.ox + (e.clientX - drag.x)
    st.y = drag.oy + (e.clientY - drag.y)
    clamp(); paint()
  })
  const endDrag = e => {
    if(!drag || (e && e.pointerId !== drag.id)) return
    drag = null
    frame.classList.remove('dragging')
  }
  frame.addEventListener('pointerup', endDrag)
  frame.addEventListener('pointercancel', endDrag)

  /* ---- 滚轮缩放 ----
     ⚠️ 必须是 passive:false：不然 preventDefault 不生效，滚图片会连带把弹窗滚走 */
  frame.addEventListener('wheel', e => {
    e.preventDefault()
    const r = frame.getBoundingClientRect()
    const v = Math.max(st.min, Math.min(st.min * 4, st.scale * Math.exp(-e.deltaY * 0.0015)))
    zoomTo(v, e.clientX - r.left, e.clientY - r.top)
    syncZoom()
  }, { passive: false })

  /* ---- 滑块：0～100 映射成 1～4 倍。取对数，不然小倍率那一段全挤在开头 ---- */
  zoom.addEventListener('input', () => {
    zoomTo(st.min * Math.pow(4, (+zoom.value) / 100), st.fw / 2, st.fh / 2)
  })
}

/* 把框住的那一块导出成 data: URI：反算回原图坐标，再画进一块新 canvas。
   尺寸交给 cropOutSize()（长边封顶 imgSheetMax，跟 readImageFile 一个道理：
   localStorage 只有 5MB 左右）。 */
function cropResult(){
  const st = cropState
  if(!st || !st.natW || !st.fw) return null

  const r = cropRect(st)
  const out = cropOutSize(st, imgSheetMax)

  const cv = document.createElement('canvas')
  cv.width = out.w; cv.height = out.h
  const ctx = cv.getContext('2d')
  if(!ctx) return null
  ctx.drawImage(st.img, r.sx, r.sy, r.sw, r.sh, 0, 0, out.w, out.h)
  try { return cv.toDataURL('image/jpeg', .86) } catch(e){ return null }
}

/* 从「站点图片位」那条通道进裁剪（顶栏方块 / 头像正反面 / 背景图）。
   back = 'slots' 表示是从列表页点进来的，裁完回列表页；否则退回详情页。 */
function cropSlotImage(key, dataUrl, back){
  const s = IMG_SLOTS.find(x => x.key === key) || IMG_SLOTS[0]
  imgSheetSlot  = s.key
  imgSheetMax   = s.max
  imgSheetRatio = slotRatio(s.key)
  imgSheetBack  = back || null
  imgSheetTarget = null
  imgSheetOrig = null
  openCropSheet(dataUrl)
}

/* ---------- 文件下载：小窗口（元数据 + 传本体） ---------- */
let filePending = null
let fileEditing = null

function openFileSheet(name){
  const f = name ? mergedFiles().find(x => x.name === name) : null
  fileEditing = f ? f.name : null
  filePending = null

  openSheet(f ? '编辑文件' : '添加文件',
    `<label class="dev-field col"><span>显示名称</span>
       <input id="flName" type="text" placeholder="下载页上显示的名字" value="${esc(f ? f.name : '')}"></label>
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

/* ---------- 文章编辑 ---------- */
function savePost(){
  if(!$('#postEditor')) return
  const title = ($('#edTitle').value || '').trim()
  if(!title) return fieldError('edErr', '标题不能空着。')

  const body = $('#edBody').value || ''
  let summary = ($('#edSummary').value || '').trim()
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
}

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

/* ---------- 作品编辑 ---------- */
let workEditing = null

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
  if(filePending && !fields.size) fields.size = humanSize(filePending.bytes)

  if(filePending){
    const bad = setFileData(name, filePending.dataUrl)
    if(bad) return fieldError('flErr', bad)
  }

  if(!old){
    devAddFile(fields)
  } else if(old === name){
    devUpdateFile(old, fields)
  } else {
    if(isAddedOverride(LS_FILES, old)) devRemoveAdded(LS_FILES, old)
    else devDeleteFile(old)
    devAddFile(fields)
    const d = fileData(old)
    if(d){ setFileData(name, d); dropFileData(old) }
  }
  closeSheet()
  repaint()
}

function delFile(name){
  if(!confirmDelete('文件「' + name + '」', !isAddedOverride(LS_FILES, name))) return
  devDeleteFile(name)
  dropFileData(name)
  repaint()
}

/* ---------- 网站导航：分类 + 分类里的网站 ---------- */
let siteEditingKey = null
let linkCat = null
let linkIndex = -1

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
  if(!/^[a-z][a-z0-9+.-]*:/i.test(url) && url.charAt(0) !== '#' && url.charAt(0) !== '/')
    url = 'https://' + url

  const links = (c.links || []).slice()
  const item = { name, url, desc: ($('#lkDesc').value || '').trim() }
  if(linkIndex >= 0) links[linkIndex] = item
  else links.push(item)

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

/* ---------- 删除确认 ---------- */
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
const refreshImages = () => { paintMark(); bootBackground(); repaint() }

/* ==========================================================================
   把上面这些接起来
   ========================================================================== */
function bootDev(){
  const view = $('#view')
  const sheet = $('#devSheet')

  /* ⚠️ 必须排在 render() 之前，否则第一屏会先闪一下没有编辑控件的样子 */
  document.documentElement.classList.toggle('dev-on', devModeOn())

  const gear = $('#markDev')
  if(gear) gear.addEventListener('click', e => {
    e.stopPropagation()
    const on = !devOn()
    setDevMode(on)
  })

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

      /* ---- 裁剪那一步的两个按钮 ---- */
      if(t.closest('[data-crop-ok]')){
        const url = cropResult()
        if(!url) return sheetError('这块裁不出来，换个位置再试试')

        /* 站点图片位：存的还是原来那个 kili.img.<字段>，只是内容换成了裁好的那一块 */
        if(imgSheetSlot){
          const key = imgSheetSlot, back = imgSheetBack
          if(!lsSet('kili.img.' + key, url)) return sheetError('存不下了，换张小点的图试试')
          refreshImages()
          if(back === 'slots') return openSlotsSheet()
          return closeSheet()
        }

        const err = setImgMap(imgSheetOrig, url)
        if(err) return sheetError(err)
        closeSheet()
        repaint()
        return
      }
      if(t.closest('[data-crop-cancel]')){
        /* 退回「还没选图」那一步，而不是整个关掉 —— 多半只是想重选一张 */
        if(imgSheetSlot) return imgSheetBack === 'slots' ? openSlotsSheet() : openSlotSheet(imgSheetSlot)
        if(imgSheetTarget) return openImageSheet(imgSheetTarget)
        return closeSheet()
      }

      const r = t.closest('[data-slot-reset]')
      if(r && !r.disabled){
        dropImgOverride(r.getAttribute('data-slot-reset'))
        refreshImages()
        openSlotsSheet()
      }
    })

    sheet.addEventListener('change', e => {
      const t = e.target
      if(!t.files || !t.files[0]) return
      const f = t.files[0]

      const su = t.closest('[data-slot-up]')
      if(su){
        const key = su.getAttribute('data-slot-up')
        const s = IMG_SLOTS.find(x => x.key === key) || IMG_SLOTS[0]
        /* 从列表页点进来的裁完回列表页，从详情页进来的退回详情页。
           已经在裁剪视图里又点了一次「换一张」的话（imgSheetSlot 还在），沿用上一次的去向。 */
        const back = imgSheetSlot ? imgSheetBack
                   : ($('#sheetBody').querySelector('[data-slot-reset]') ? 'slots' : null)
        /* 源图放宽到 max 的两倍（封顶 2560）再进裁剪：裁的是其中一块，
           源太小一放大就糊。真存下来的仍由 imgSheetMax 封顶，不多占空间。 */
        readImageFile(f, Math.min(2560, s.max * 2), (bad, url) => {
          if(bad) return sheetError(bad)
          cropSlotImage(s.key, url, back)
        })
        return
      }

      if(t.closest('[data-img-up]')){
        /* 选完不直接存：先进裁剪那一步，让人看一眼页面上会显示成什么样 */
        readImageFile(f, 1600, (bad, url) => {
          if(bad) return sheetError(bad)
          openCropSheet(url)
        })
        return
      }

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

  document.addEventListener('keydown', e => {
    if(e.key === 'Escape') closeSheet()
  })

  /* ---------- 页面上点了图片 = 换图 ----------
     ⚠️ 必须挂在 document 的**捕获阶段**（第三个参数 true）：
        文章卡片是整框可点的，点击冒泡到链接上会直接跳走。 */
  document.addEventListener('click', e => {
    if(!devOn()) return
    const t = e.target
    if(!t || !t.closest) return

    const im = t.closest('img')
    if(im){
      if(im.closest('#markFace')){
        e.preventDefault(); e.stopPropagation()
        return openSlotSheet('markImg')
      }
      const face = im.closest('.ha-face')
      if(face){
        e.preventDefault(); e.stopPropagation()
        return openSlotSheet(face.classList.contains('ha-back') ? 'avatarBack' : 'avatar')
      }
    }

    /* ⚠️ 封面得单独认一次：没配 cover 的文章渲染的是占位块，
       里面**没有 <img>**，上面那段认不出它 —— 不在这里拦住，点击就会冒泡到
       整框可点的拉伸链接上，人就被带进文章里去了（这正是之前那个 bug）。 */
    const cov = t.closest('.cover[data-cover-key]')
    if(cov && cov.closest('#view')){
      e.preventDefault(); e.stopPropagation()
      return openImageSheet(cov)
    }

    if(!im || !im.closest('#view')) return
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

    if(t.closest('#wkSave'))   return saveWork()
    if(t.closest('#wkCancel')) return hideWorkEditor()
    if(t.closest('#stSave'))   return saveSite()
    if(t.closest('#stCancel')) return hideSiteEditor()
    if(t.closest('#lkSave'))   return saveLink()
    if(t.closest('#lkCancel')) return hideLinkEditor()
    if(t.closest('#edSave'))   return savePost()
  })

  view.addEventListener('input', e => {
    if(!e.target || !e.target.closest || !e.target.closest('#postEditor')) return
    clearTimeout(previewTimer)
    previewTimer = setTimeout(paintPreview, 120)
  })

  afterPaint(paintPreview)
}

function delPost(id, title){
  if(!confirmDelete('文章「' + title + '」', !isAddedOverride(LS_POSTS, id))) return
  devDeletePost(id)
  if(location.hash.indexOf('#/post/') === 0 || location.hash.indexOf('#/edit/') === 0)
    location.hash = '#/posts'
  else
    repaint()
}
