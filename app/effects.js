/* 视觉效果：背景图、背景粒子、主题三态、阅读进度、开场动画、顶栏图标 */
/* ---------- 背景图 ---------- */
/* ⚠️ 背景图相对路径必须用 new URL(p, document.baseURI) 拼成绝对路径再用：
   --bg-day 是在 styles/variables.css 里被 background-image 消费的，
   而 CSS 里的相对 URL 是**相对那份样式表**解析的，写 './bg.svg' 会去找
   styles/bg.svg，两张背景图全 404，页面上只剩纯色底。 */
function bootBackground(){
  const r = document.documentElement.style
  const url = p => {
    if(!p) return 'none'
    let abs = p
    try { abs = new URL(p, document.baseURI).href } catch(e){}
    return 'url("' + abs + '")'
  }
  const day = siteImg('bgDay') || SITE.bgImage || null
  r.setProperty('--bg-day',   url(day))
  r.setProperty('--bg-night', url(siteImg('bgNight') || day))
  r.setProperty('--bg-veil', String(SITE.bgVeil))
}

/* ---------- 背景粒子（那层飘着的小几何图形） ---------- */
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
  const MARGIN = 50
  const SHAPES_LIGHT = ['triangle', 'shard', 'diamond', 'hexagon', 'square']
  const SHAPES_DARK  = ['circle', 'star']

  let resizeTimer = 0, themeTimer = 0
  let W = 0, H = 0, parts = []

  const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark'

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
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    W = window.innerWidth
    H = window.innerHeight
    cv.width = Math.round(W * dpr)
    cv.height = Math.round(H * dpr)
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
    resizeTimer = setTimeout(resize, 150)
  })
  if(window.MutationObserver){
    new MutationObserver(() => {
      clearTimeout(themeTimer)
      themeTimer = setTimeout(make, 120)
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  }
}

/* ---------- 主题（跟随时间 / 亮色 / 暗色 三态） ---------- */
let THEME_MODE = 'auto'
let THEME_TICK = null

function isNight(d){
  const h = d.getHours(), f = SITE.nightFrom, t = SITE.nightTo
  return f > t ? (h >= f || h < t) : (h >= f && h < t)
}

function bootTheme(){
  const btn = $('#themeBtn')
  const metaTc = document.querySelector('meta[name="theme-color"]')
  const root = document.documentElement

  if(SITE.allowDark === false){
    root.setAttribute('data-theme', 'light')
    if(btn) btn.hidden = true
    if(metaTc) metaTc.setAttribute('content', '#f2faff')
    return
  }

  const saved = lsGet('theme')
  THEME_MODE = (saved === 'light' || saved === 'dark') ? saved : 'auto'

  const dark = () => THEME_MODE === 'dark' ||
    (THEME_MODE === 'auto' && isNight(new Date()))

  const LABEL = { auto:['theme-auto','跟随时间'], light:['theme-light','亮色主题'], dark:['theme-dark','暗色主题'] }
  let painted = null

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
    lsSet('theme', THEME_MODE)
    painted = null
    apply(); paintBtn()
  })
}

/* ---------- 阅读进度 ---------- */
/* ⚠️ 页面高度缓存在 PROG_MAX 里，别改回「每次现读 scrollHeight」：读它会让浏览器
   立刻把布局整个算完（强制同步布局 / forced reflow），而这函数挂在 scroll 上 ——
   等于滚动时每一帧都强制重排一次，正是滚动卡顿的来源之一。
   页面高度变了（画完一页、窗口缩放、字体加载完）再调 measureProgress() 重算。 */
let PROG_MAX = 0
function measureProgress(){
  PROG_MAX = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
}
function updateProgress(){
  const bar = $('#progress')
  if(!bar) return
  bar.style.width = PROG_MAX > 0 ? Math.min(100, window.scrollY / PROG_MAX * 100) + '%' : '0%'
}
afterPaint(() => { measureProgress(); updateProgress() })
window.addEventListener('scroll', updateProgress, { passive: true })
window.addEventListener('resize', () => { measureProgress(); updateProgress() })
if(document.fonts && document.fonts.ready) document.fonts.ready.then(measureProgress).catch(() => {})

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

/* ---------- 图标样式 ---------- */
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
