/* 外壳：顶栏、侧边栏、实时时钟、搜索、剪贴板、内容区事件委托、头像翻面 */

/* ---------- 侧边栏 / 顶栏 / 页脚 ---------- */
function bootChrome(){
  $('#brandName').textContent = SITE.name
  paintMark()
  document.title = SITE.name + ' · 技术博客'
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

/* ⚠️ 只写 #markFace，别覆盖 #brandMark —— 方块里还住着长按进度环、爆炸层和齿轮按钮 */
function paintMark(){
  const face = $('#markFace'); if(!face) return
  const txt = esc(SITE.mark || String(SITE.name || '?').slice(0, 1))
  const img = siteImg('markImg')
  face.innerHTML = img
    ? `<img src="${esc(img)}" alt="" onerror="this.hidden=true"><span aria-hidden="true">${txt}</span>`
    : `<span aria-hidden="true">${txt}</span>`
}

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

  let open = lsGet('rail') === 'open'
  const paint = () => {
    root.setAttribute('data-rail', open ? 'open' : 'closed')
    btn.textContent = open ? '«' : '»'
    btn.setAttribute('aria-expanded', String(open))
    btn.title = open ? '收起侧边栏' : '展开侧边栏'
  }
  paint()
  btn.addEventListener('click', () => {
    open = !open
    lsSet('rail', open ? 'open' : 'closed')
    paint()
  })

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
    if(SEARCH_Q !== q.value) SEARCH_KIND = 'all'
    SEARCH_Q = q.value
    if(location.hash !== '#/search'){
      if(!SEARCH_Q.trim()) return
      location.hash = '#/search'
    } else {
      paintView(true)
    }
  }

  q.addEventListener('input', e => {
    if(e.isComposing) return    // ⚠️ 中文输入法拼字途中会连着触发，不过滤会一直重画
    clearTimeout(timer)
    timer = setTimeout(go, 180)
  })
  q.addEventListener('keydown', e => {
    if(e.key !== 'Enter' || e.isComposing) return
    e.preventDefault()
    clearTimeout(timer)
    go()
  })

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

/* ---------- 内容区的事件委托 ---------- */
function bootDelegates(){
  const view = $('#view')

  view.addEventListener('click', e => {
    if(!e.target || !e.target.closest) return

    /* 下载页：进出文件夹、切视图、翻页、改排序。都是查看态的交互，跟开发者模式无关，
       所以挂在这儿而不是 dev.js 那摊里。状态变量在 view-others.js 顶上。
       ⚠️ 重画必须用 paintView(true) 保留滚动 —— render() 会 scrollTo(0,0)，
       翻页时把用户一路甩回页面最顶上。改成滚到列表标题那儿就够了。 */
    const dl = e.target.closest('[data-dl-root],[data-dl-folder],[data-dl-view],[data-dl-page],[data-dl-sort]')
    if(dl){
      if(dl.hasAttribute('data-dl-root')){
        DL_FOLDER = null; DL_PAGE = 1
      } else if(dl.hasAttribute('data-dl-folder')){
        /* 值是空串时表示「未分类」，照样是个合法文件夹，别拿 if(x) 判 */
        DL_FOLDER = dl.getAttribute('data-dl-folder'); DL_PAGE = 1
      } else if(dl.hasAttribute('data-dl-view')){
        DL_VIEW = dl.getAttribute('data-dl-view') === 'grid' ? 'grid' : 'list'
        lsSet('kili.dl.view', DL_VIEW)
        DL_PAGE = 1        /* 每页容量从 10 变 30，页码没法对应，回第一页 */
      } else if(dl.hasAttribute('data-dl-sort')){
        DL_SORT = dl.getAttribute('data-dl-sort') === 'name' ? 'name' : 'time'
        lsSet('kili.dl.sort', DL_SORT)
        DL_PAGE = 1        /* 整个顺序都变了，还停在第 3 页没有意义 */
      } else {
        const p = parseInt(dl.getAttribute('data-dl-page'), 10)
        if(!isNaN(p)) DL_PAGE = p
      }
      paintView(true)
      const top = document.getElementById('dlTop')
      if(top) top.scrollIntoView({ block:'start' })
      return
    }

    /* ⚠️ 目录跳转必须 preventDefault：href="#h-xxx" 会被 hashchange 当成路由跳走 */
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

  view.addEventListener('error', e => {
    const img = e.target
    if(!img || img.tagName !== 'IMG' || !img.closest) return
    const box = img.closest('.cover')
    if(!box) return
    box.classList.add('ph')
    box.innerHTML = icoHTML('image')
  }, true)
}

/* ---------- 头像：点一下像硬币一样翻面 ---------- */
function bootAvatarFlip(){
  const view = $('#view'); if(!view) return

  view.addEventListener('click', e => {
    const box = e.target && e.target.closest && e.target.closest('#haAvatar')
    if(box) box.classList.toggle('is-flipped')
  })
  view.addEventListener('keydown', e => {
    if(e.key !== 'Enter' && e.key !== ' ') return
    const box = e.target && e.target.closest && e.target.closest('#haAvatar')
    if(!box) return
    e.preventDefault()
    box.classList.toggle('is-flipped')
  })
}
