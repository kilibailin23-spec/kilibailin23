/* ==========================================================================
   各页面模板

   每个页面一个 viewXxx()，返回一段 HTML 字符串。

   这个文件是从原来的单文件 index.html 里拆出来的，内容没动过。

   ---- 开发者模式那堆按钮是怎么回事 ----
   页面上到处能看到 class="dev-only" 的块（卡片右上角的「编辑 / 删除」、
   文章页顶上的「编辑」、页面末端的「删除」……）。它们**每次渲染都照常输出**，
   至于显不显示，全靠 styles/content.css 里那一条：
       html:not(.dev-on) .dev-only{display:none !important}
   也就是说，开关开发者模式只是往 <html> 上翻一个类名，不用重画页面。

   ⚠️ 用 html:not(.dev-on) 而不是 html.dev-on .dev-only{display:...}：
      后者要挨个写出每个元素**开着时**该是什么 display（按钮是 inline-flex、
      卡片浮层是 flex……），写漏一个就塌。反过来只描述「关着时藏起来」，
      开着时一条规则都不生效，元素各回各的自然形态。
   ========================================================================== */

/* ---------- 页面 ---------- */
const catName = k => (CATEGORIES.find(c => c.key === k) || {}).name || k

/* 日期排序用数字。字符串比较碰到 2026-9-1 这种单位数月份会排错 */
function dateNum(d){
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(d || '')
  return m ? +m[1] * 10000 + +m[2] * 100 + +m[3] : 0
}
const byDateDesc = (a, b) => dateNum(b.date) - dateNum(a.date)

/* 搜索命中词高亮。必须 esc 之后再插 <mark> —— 反过来的话，
   用户输一段 <img onerror=...> 就是现成的 XSS 口子 */
function hi(text, q){
  const s = esc(text == null ? '' : text)
  if(!q) return s
  return s.replace(new RegExp('(' + escapeRe(esc(q)) + ')', 'gi'), '<mark>$1</mark>')
}

/* 卡片上的标签。带链接的版本点进去就是标签筛选 */
function chipsHTML(tags, link){
  return (tags || []).map(t => link
    ? `<a class="chip" href="#/tag/${encodeURIComponent(t)}">${esc(t)}</a>`
    : `<span class="chip">${esc(t)}</span>`).join('')
}

/* 图标。NAV / CATEGORIES / 主题按钮里的 icon 字段写图标名（不带后缀），
   这里按 SITE.iconDir + SITE.iconExt 拼成 ./icons/home.png 这样的路径。
   渲染成 mask 而不是 <img>：mask 只取形状，颜色交给 currentColor 给的背景色，
   所以图标会跟着主题的文字色自动变亮变暗 —— 一套图就够，不用准备亮暗两份。
   （mask 看的是 alpha 通道，PNG 里填的颜色压根不参与，见 data/site.js 的说明。）
   —— 图标名不合法（比如还留着表情符号）就原样输出，方便新旧混用。

   图标内容走 data/icons.js 里内联的 data: URI（bootIcons() 会为每个图标
   生成一条 .ico-<名字> 的规则），这里只输出类名，不再往行内 style 里塞路径。
   为什么非得内联、不能按 icons/ 的文件名引用，见 tools/build-icons.js 开头的说明
   —— 一句话：mask 在 file:// 下会被当成跨源资源拦掉，双击打开图标就全没了。

   —— 名字不在 data/icons.js 里（刚加进来还没重新生成）就退回按文件路径引用，
      这条兜底在 http:// 下能用，file:// 下不显示，但至少不会连类名都对不上。 */
function icoHTML(name){
  if(!name) return ''
  if(!/^[A-Za-z0-9_-]+$/.test(name)) return esc(name)

  const ext = SITE.iconExt || '.svg'
  if(typeof ICONS !== 'undefined' && ICONS[ext] && ICONS[ext][name])
    return `<span class="ico-img ico-${name}" aria-hidden="true"></span>`

  const dir = SITE.iconDir
  if(!dir) return esc(name)
  let src = dir + name + ext
  /* 相对路径得转成绝对路径：消费 --ico 的是 styles/aero.css 里的 mask:var(--ico)，
     而 CSS 里的相对 URL 是相对**那份样式表**解析的，不是相对 index.html ——
     写 './icons/home.png' 会去找 styles/icons/home.png，直接 404。
     （背景图 --bg-day / --bg-night 是同一个坑，bootBackground() 里一起修了。） */
  try { src = new URL(src, document.baseURI).href } catch(e){}
  return `<span class="ico-img" style="--ico:url('${esc(src)}')" aria-hidden="true"></span>`
}

/* 能被选进下拉框的图标名。加新图标要双击「更新图标.bat」重新打包，
   所以这里只能列**已经打包进去**的那些 —— 让用户手打一个不存在的名字，
   结果就是图标位置空一块，不如直接给个下拉框。
   cur 不在列表里（老数据填了个已经删掉的图标名）就先塞到队首，
   否则 <select> 会自己跳到第一项，一点保存就把人家的图标名改掉了。 */
function iconOptions(cur){
  const ext = SITE.iconExt || '.svg'
  const set = (typeof ICONS !== 'undefined' && ICONS[ext]) ? ICONS[ext] : {}
  const list = Object.keys(set).filter(n => /^[A-Za-z0-9_-]+$/.test(n))
  if(cur && list.indexOf(cur) < 0) list.unshift(cur)
  return list.map(n =>
    `<option value="${esc(n)}"${n === cur ? ' selected' : ''}>${esc(n)}</option>`).join('')
}

/* ---------- 开发者模式的小控件 ----------
   真正的点击处理统一在 boot.js 的 bootDevUI() 里委托，
   这儿只负责把带 data-dev-* 的按钮画出来。 */

/* 卡片右上角浮出来的「编辑 / 删除」。文章卡片和作品卡片共用。
   kind 是 data-dev-edit / data-dev-del 上那个类型
   （post / work / file / site / link），id 是这条的主键。 */
function devCardActs(kind, id){
  const k = esc(kind), v = esc(id)
  return `<div class="dev-card-act dev-only">
    <button class="dev-btn sm" type="button" data-dev-edit="${k}" data-dev-id="${v}">编辑</button>
    <button class="dev-btn sm danger" type="button" data-dev-del="${k}" data-dev-id="${v}">删除</button>
  </div>`
}

/* 页面顶部那排「+ 添加 xxx」。kind 同上 */
function devAddBtn(kind, label){
  const k = esc(kind)
  return `<div class="dev-bar dev-only">
    <button class="dev-btn" type="button" data-dev-new="${k}">${esc(label)}</button>
  </div>`
}

/* ---------- 整框可点：拉伸链接 ----------
   卡片里有标签链接，所以**不能**给整张卡片套一个 <a>（<a> 套 <a> 是非法
   HTML，浏览器会把它们拆开，点哪儿都可能跳错）。

   用的是「拉伸链接」：标题那个 <a> 挂 .stretch，它的 ::after 铺满整张卡片
   （.card 本来就是 position:relative）。于是卡片空白处、封面、摘要点到，
   冒泡上去都是这个 <a>，等于整框可点。

   ⚠️ 代价是这层 ::after 盖在所有东西上面，所以：
      · 标签 .chip 要抬到 z-index:2 才点得到（见 layout.css）；
      · 开发者模式那两个按钮要抬到 z-index:3。
      以后往卡片里加任何可点的东西，都得记着抬这一层。 */
function stretchLink(href, inner, blank){
  const t = blank ? ' target="_blank" rel="noopener"' : ''
  return `<a class="stretch" href="${esc(href)}"${t}>${inner}</a>`
}

/* 首页面板最上面那行大字。
   字体和字号走行内 CSS 变量，不写死在 layout.css 里 —— 这样 SITE 里改一下
   刷新就生效，不用去翻样式表。（esc() 会把单引号转成 &#39;，浏览器解码回来
   还是单引号，所以写在 font-family 里安全。） */
function bannerHTML(){
  const st = []
  if(SITE.bannerFont) st.push('--banner-font:' + SITE.bannerFont)
  if(SITE.bannerSize) st.push('--banner-size:' + SITE.bannerSize)
  const attr = st.length ? ` style="${esc(st.join(';'))}"` : ''
  return `
      <!-- 抬头：面板最上面那行大字。仍然挂着 .hero —— 图的是它背后
           那层彩虹镀膜和光晕，字号排版由 .home-banner 自己的规则接管。 -->
      <div class="hero home-banner">
        <h1${attr}>${esc(SITE.banner || SITE.name)}</h1>
      </div>`
}

/* 卡片封面：配了 cover 就放图，没配就用浅蓝渐变 + 标题首字占位。
   图挂了不走这里的兜底 —— bootChrome() 里有个捕获阶段的 error 监听，
   会把整个 .cover 换成一张「图片」图标，那条比这里更管用（error 事件
   不冒泡，得在捕获阶段收），所以别在这儿再加 onerror，两边会打架。 */
function coverHTML(p){
  if(p.cover) return `<div class="cover"><img src="${esc(p.cover)}" alt="" loading="lazy"></div>`
  return `<div class="cover ph"><span>${esc(String(p.title || '?').slice(0,1))}</span></div>`
}

/* 文章卡片。首页、文章列表、标签/分类筛选、搜索都用它 */
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

/* 作品卡片。和文章卡片同一套：整框可点 + 开发者模式的编辑删除。
   区别是它跳的是站外，所以 stretchLink 要带 target */
/* 作品卡片。第二个参数是搜索词，只在搜索页传 —— 传了就把命中的词高亮出来。
   ⚠️ 传参时**必须**写成 w => workCard(w, q)，不能直接 .map(workCard) ——
      map 会把下标当第二个参数塞进来，q 变成 0/1/2，整张卡片的文字会被当成搜索词处理。 */
function workCard(w, q){
  return `
  <article class="card">
    ${devCardActs('work', w.name)}
    <h3>${stretchLink(w.link || '#', hi(w.name, q) + ' ↗', true)}</h3>
    <p>${hi(w.desc, q)}</p>
    <div class="chips">${chipsHTML(w.tags, false)}</div>
  </article>`
}

/* 首页。布局照参考站来：抬头大字 → 关于我 → 联系方式 → 最新动态 → 快捷导航 → 作品。
   但外面那一个 .home-panel 大面板是本来的，没动 —— 参考站是把这些拆成好几张
   卡片浮在页面上，我们保持「一整块面板」，靠细线分节。 */
/* 快捷导航那排多出来的那张卡：网站导航。
   它不是文章分类，只是借了 .cat-card 的皮（一个图标 + 名字 + 一句小字）——
   那排卡片现在是 4 张，`.grid.cats` 在 1360px 视口下每行正好 5 个，
   4 张右边会空一格；补上这张凑成 5 张，整行排满。
   顺带把「网站导航」的入口从区块标题右边那个小链接挪到和分类平级的位置。

   ⚠️ 不能直接塞进 CATEGORIES：那是文章分类的数据源，站内的 #/cat/<key> 靠 key
      对上，混进去一个没有对应文章的分类，别的页面（分类列表、标签页）会串味。
   ⚠️ 一个网站分类都没有时不渲染 —— 点进去是个空页，不如不给这个入口。 */
function sitesCardHTML(){
  const cats = mergedSites()
  if(!cats.length) return ''
  const n = cats.reduce((sum, c) => sum + ((c.links || []).length), 0)
  return `
    <a class="cat-card" href="#/sites">
      <span class="ico">${icoHTML('compass')}</span>
      <b>网站导航</b>
      <small>${n ? n + ' 个常去的站' : '还没收站点'}</small>
    </a>`
}

function viewHome(){
  const recent = mergedPosts().sort(byDateDesc).slice(0, 3)

  /* 头像：配了 avatar 就用图片，没配就退回 mark 那个字（默认「白」）。
     和顶栏那个方块一样，字永远渲染出来当底、图盖上去，图挂了就藏起图
     露出字 —— 比留一个裂图好看。

     这圈现在是个「硬币」：点一下绕竖轴翻 180°，露出背面的图。
     正面用 avatar，背面用 avatarBack（没配就退回正面的图，翻过去还是同一张，
     看着像卡住了，所以 SITE 默认给背面留了另一个字段）。
     两面各是一个 .ha-face：背面那个预先 rotateY(180deg) 转到对面去，
     翻的时候连容器一起转，正好转回正面 —— 这就是硬币两面轮流朝外的做法。
     点击由 boot.js 的 bootAvatarFlip() 委托处理（视图整块 innerHTML 会换，
     绑在元素上的监听会跟着没，所以统一挂在 #view 上）。 */
  const avatarTxt = esc(SITE.mark || String(SITE.name || '?').slice(0, 1))
  const face = (src, back) =>
    `<div class="ha-face${back ? ' ha-back' : ''}">` +
      (src ? `<img src="${esc(src)}" alt="${esc(SITE.name)} 的头像" loading="lazy" onerror="this.hidden=true">` : '') +
      `<span aria-hidden="true">${avatarTxt}</span>` +
    `</div>`
  const avatar =
    face(siteImg('avatar'), false) +
    face(siteImg('avatarBack') || siteImg('avatar'), true)

  /* 中间那栏的自我介绍，一行一条 */
  const lines = (SITE.hashtags || []).map(t =>
    `<p class="ha-line">${esc(t)}</p>`).join('')

  /* 社交按钮。只放已经填了东西的，不用特判空链接 */
  const socials = []
  if(SITE.github) socials.push(
    `<a class="ha-social" href="${esc(SITE.github)}" target="_blank" rel="noopener">${icoHTML('tech')}GitHub</a>`)
  if(SITE.email) socials.push(
    `<a class="ha-social" href="mailto:${esc(SITE.email)}">${icoHTML('mail')}邮箱</a>`)
  socials.push(`<a class="ha-social" href="#/posts">${icoHTML('posts')}读文章</a>`)
  socials.push(`<a class="ha-social" href="#/works">${icoHTML('works')}看作品</a>`)

  return `
  <div class="view">
    <div class="home-panel">
${bannerHTML()}

      <section>
        <div class="home-about">
          <div class="ha-figure">
            <div class="ha-avatar" id="haAvatar" role="button" tabindex="0"
                 title="点一下翻面" aria-label="头像，点一下翻面">
              <div class="ha-flip">${avatar}</div>
            </div>
            ${SITE.avatarName ? `<p class="ha-name">${esc(SITE.avatarName)}</p>` : ''}
          </div>
          <div class="ha-body">
            <h2 class="ha-headline">${esc(SITE.greeting || ('你好，我是 ' + SITE.name))}</h2>
            ${lines}
            <div class="ha-socials">${socials.join('')}</div>
          </div>
          <div class="ha-side">${SITE.signature ? `
            <p class="ha-sign">${esc(SITE.signature)}${
              SITE.signatureTo ? `<span class="ha-sign-to">${esc(SITE.signatureTo)}</span>` : ''
            }</p>` : ''}</div>
        </div>

        <!-- 联系方式横条。参考站是在「关于」和「最新动态」之间横一条窄玻璃条当分隔 -->
        <div class="home-contact">
          <span class="hc-title">联系我</span>
          ${SITE.email ? `<a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a>` : ''}
          ${SITE.github ? `<a href="${esc(SITE.github)}" target="_blank" rel="noopener">GitHub</a>` : ''}
          <span class="hc-note">${esc(SITE.tagline || '')}</span>
        </div>
      </section>

      <section>
        <div class="sec-head"><h2><span class="sec-ico">${icoHTML('bolt')}</span>最新动态</h2><a class="more" href="#/posts">全部文章 →</a></div>
        <div class="grid">${recent.map(p => postCard(p)).join('')}</div>
      </section>

      <section>
        <div class="sec-head"><h2><span class="sec-ico">${icoHTML('compass')}</span>快捷导航</h2><a class="more" href="#/sites">网站导航 →</a></div>
        <div class="grid cats">
          ${CATEGORIES.map(c => `
            <a class="cat-card" href="#/cat/${encodeURIComponent(c.key)}">
              <span class="ico">${icoHTML(c.icon)}</span>
              <b>${esc(c.name)}</b>
              <small>${esc(c.desc)}</small>
            </a>`).join('')}
          ${sitesCardHTML()}
        </div>
      </section>

      <section>
        <div class="sec-head"><h2><span class="sec-ico">${icoHTML('works')}</span>作品</h2><a class="more" href="#/works">全部 →</a></div>
        <div class="grid">${mergedWorks().slice(0,3).map(w => workCard(w)).join('')}</div>
      </section>
    </div>
  </div>`
}

/* ---------- 文章列表 / 归档 ----------
   这俩现在是**同一个页面**的两种视图，靠顶部那排「列表 / 归档」切。
   归档原来单独占一个导航项，可它和文章列表看的是同一批数据，
   两个入口点进去内容差不多 —— 现在归档收进文章模块，
   空出来的导航位给了「网站导航」。

   #/archive 这条路由还在（老链接、前进后退、别人收藏的地址都还能用），
   只是渲染成文章页的归档视图：viewPosts({ view:'archive' })。 */
/* ---------- 搜索 ----------
   搜索本来是「文章页的一种筛选」：#/search 走的是 viewPosts({q})，过滤只扫 POSTS。
   可顶栏那个框写着「搜索…」—— 搜作品名、搜文件名什么都搜不到，人会以为站里没这东西。

   现在三类各搜各的，顶上一排标签分开看：
     · 「全部」→ 三块分区展示，没命中的块不渲染（免得一屏的「0 条」）
     · 选中某一类 → 只出那一块
   标签上直接写条数，哪类有货一眼看得出来。
   当前选中哪一类记在全局 SEARCH_KIND 里（和 SEARCH_Q 一个路子，见 router.js / boot.js）。

   结果里命中的词用 <mark> 亮出来，靠 hi() —— 它先 esc 再插标签，
   反过来写（先插标签再 esc）就是现成的 XSS 口子。 */

const SEARCH_KINDS = [
  { key: 'all',  name: '全部' },
  { key: 'post', name: '文章', bucket: 'posts', ico: 'posts' },
  { key: 'work', name: '作品', bucket: 'works', ico: 'works' },
  { key: 'file', name: '文件', bucket: 'files', ico: 'folder' }
]

/* 三类各搜各的。规则和原来搜文章那套一样：小写化 + 子串包含，
   不搞分词也不搞模糊 —— 搜「abc」能命中「xxABCxx」就够了。 */
function searchAll(q){
  const n = q.toLowerCase()
  const hit = fields => fields.join(' ').toLowerCase().indexOf(n) >= 0
  return {
    /* ⚠️ 正文取纯文本要用 plain()，**不能**用 md() —— md() 会把全局 MD_TOC
       重置掉（文章详情页的目录靠它），在搜索页上跑一遍会让那边目录错乱。 */
    posts: mergedPosts().sort(byDateDesc).filter(p =>
      hit([p.title, p.summary, (p.tags || []).join(' '), plain(p.body)])),
    works: mergedWorks().filter(w =>
      hit([w.name, w.desc, (w.tags || []).join(' ')])),
    /* ⚠️ 不搜 f.file —— 那是磁盘上的路径，不是给人搜的词 */
    files: mergedFiles().filter(f => hit([f.name, f.desc]))
  }
}

function viewSearch(q, kind){
  const query = (q || '').trim()
  /* kind 来自全局变量，正常只会是上面那四个之一；万一存了个旧值，这里兜一下，
     不然四块一个都不满足条件、页面会整个空掉 */
  const k0 = SEARCH_KINDS.some(k => k.key === kind) ? kind : 'all'
  const K  = key => SEARCH_KINDS.find(k => k.key === key)

  if(!query){
    return `
    <div class="view">
      <div class="sec-head"><h2>搜索</h2></div>
      <div class="empty">
        <div class="big">(・_・;)</div>
        在顶栏的搜索框里打字就能搜 —— 文章、作品、文件一起搜。
        <br><br><a href="#/posts">← 先去翻翻文章</a>
      </div>
    </div>`
  }

  const r = searchAll(query)
  const total = r.posts.length + r.works.length + r.files.length
  const on = k => k0 === 'all' || k0 === k

  /* 一块结果。这一类没命中、或者当前没选中它，整块就不渲染 */
  const sec = (k, n, html) => (on(k.key) && n) ? `
    <section class="search-block">
      <div class="sec-head">
        <h2><span class="sec-ico">${icoHTML(k.ico)}</span>${k.name}</h2>
        <span class="more">${n} 条</span>
      </div>
      ${html}
    </section>` : ''

  /* ⚠️ 三处都是显式箭头 —— 直接写 .map(postCard) 的话，下标会被当成 q，
     整张卡片的文字都会变成「搜索词」而不停被高亮 */
  const body = [
    sec(K('post'), r.posts.length,
      `<div class="grid">${r.posts.map(p => postCard(p, query)).join('')}</div>`),
    sec(K('work'), r.works.length,
      `<div class="grid">${r.works.map(w => workCard(w, query)).join('')}</div>`),
    sec(K('file'), r.files.length,
      `<div class="grid files">${r.files.map(f => fileRow(f, query)).join('')}</div>`)
  ].join('')

  /* ⚠️ 判断「有没有东西可看」要用 shownCount，**不能**用 total ——
     选中某一类时，其它类的命中数不该算数：不然会出现
     「选了「文件」、文件里一条没中，标签上写着共 2 条，屏幕上却一片空白」。
     用 shownCount 的话，这种情况会正常显示空状态。 */
  const shownCount = k0 === 'all' ? total : r[K(k0).bucket].length

  const emptyHTML = `
    <div class="empty">
      <div class="big">(・_・;)</div>
      ${k0 === 'all'
        ? `没搜到「${esc(query)}」相关的东西。`
        : `${K(k0).name}里没有「${esc(query)}」相关的东西。`}
      <br>
      换个词试试${k0 === 'all' ? '' : '，或者切回「全部」看看别处'}，
      也可以直接去 <a href="#/posts">文章</a> / <a href="#/works">作品</a> /
      <a href="#/downloads">文件</a> 里翻翻。
    </div>`

  return `
  <div class="view">
    <div class="sec-head">
      <h2>搜索</h2>
      <span class="more">「${esc(query)}」 · 共 ${total} 条</span>
    </div>
    <div class="posts-bar">
      <div class="posts-switch search-switch">
        ${SEARCH_KINDS.map(k => `
          <button class="ps-btn${k0 === k.key ? ' on' : ''}" type="button"
                  data-skind="${k.key}">${k.name}<i>${k.bucket ? r[k.bucket].length : total}</i></button>`).join('')}
      </div>
    </div>
    ${shownCount ? body : emptyHTML}
  </div>`
}

function viewPosts(opts){
  opts = opts || {}
  const isArchive = opts.view === 'archive'
  /* 筛过（按分类 / 按标签）之后就没有「切换视图」这回事了 ——
     那排按钮只在看全部文章时出现。
     ⚠️ 搜索**不**走这里：它挪去 viewSearch() 了，搜的是全站三类东西，
        不再是文章页的一种筛选（见上面那一节）。 */
  const filtered = !!(opts.tag || opts.cat)

  let list = mergedPosts().sort(byDateDesc)
  let head = isArchive ? '归档' : '全部文章', sub = ''

  if(opts.cat){
    list = list.filter(p => p.cat === opts.cat)
    head = catName(opts.cat); sub = '分类'
  }
  if(opts.tag){
    list = list.filter(p => (p.tags || []).indexOf(opts.tag) >= 0)
    head = '#' + opts.tag; sub = '标签'
  }

  const bar = filtered ? '' : `
    <div class="posts-bar">
      <div class="posts-switch">
        <a class="ps-btn${isArchive ? '' : ' on'}" href="#/posts">列表</a>
        <a class="ps-btn${isArchive ? ' on' : ''}" href="#/archive">归档</a>
      </div>
      <a class="dev-btn dev-only" href="#/edit/new">+ 写新文章</a>
    </div>`

  return `
  <div class="view">
    <div class="sec-head">
      <h2>${esc(head)}</h2>
      <span class="more">${list.length} 篇${sub ? ' · ' + esc(sub) : ''}</span>
    </div>
    ${bar}
    ${isArchive ? archiveHTML(list) : listHTML(list)}
  </div>`
}

/* 列表视图：一格一张卡片 */
/* 列表视图：一格一张卡片。搜索那一摊走 viewSearch()，这里只服务分类 / 标签筛选 */
function listHTML(list){
  if(!list.length){
    return `<div class="empty"><div class="big">(・_・;)</div>
      这里还什么都没有。<br><br><a href="#/posts">← 看全部文章</a></div>`
  }
  return `<div class="grid">${list.map(p => postCard(p)).join('')}</div>`
}

/* 归档视图：按年月分组的时间线。
   ⚠️ 这里的「编辑 / 删除」按钮是塞在 .post-row 那个 <a> **里面**的 ——
      和别处不一样。因为 .post-row 本来就是一个整行的链接，而归档里一行就一条，
      没必要再套一层拉伸链接。按钮套在 <a> 里严格说是非法 HTML（交互内容
      不能嵌套），浏览器解析时不会拆开这两个，点击也照常冒泡，
      所以能这么写；但如果你以后要在这一行里再加别的东西，请改成
      「行是普通 div + 拉伸链接」那套（见 .site-link 的做法）。 */
function archiveHTML(list){
  if(!list.length){
    return `<div class="empty"><div class="big">${icoHTML('archive')}</div>还没有文章</div>`
  }
  const groups = []
  list.forEach(p => {
    const m = /^(\d{4})-(\d{1,2})/.exec(p.date || '')
    const key = m ? m[1] + '-' + m[2] : String(p.date || '未知')
    let g = groups[groups.length - 1]
    if(!g || g.key !== key){
      g = { key, label: m ? m[1] + ' 年 ' + (+m[2]) + ' 月' : key, items: [] }
      groups.push(g)
    }
    g.items.push(p)
  })
  return groups.map(g => `
      <div class="tl-group">
        <div class="tl-head">${esc(g.label)}</div>
        <div class="post-list">
          ${g.items.map(p => `
            <a class="post-row" href="#/post/${encodeURIComponent(p.id)}">
              <span class="t">${esc(p.title)}</span>
              <span class="d">${fmtDate(p.date)}</span>
              <span class="dev-row-act dev-only">
                <button class="dev-btn sm" type="button" data-dev-edit="post" data-dev-id="${esc(p.id)}">编辑</button>
                <button class="dev-btn sm danger" type="button" data-dev-del="post" data-dev-id="${esc(p.id)}">删除</button>
              </span>
            </a>`).join('')}
        </div>
      </div>`).join('')
}

function viewPost(id){
  const p = mergedPosts().find(x => x.id === id)
  if(!p){
    return `<div class="view"><div class="empty"><div class="big">(・_・;)</div>
      找不到这篇文章，可能链接写错了。<br><br><a href="#/posts">← 回到文章列表</a></div></div>`
  }
  // 注意顺序：md() 调完之后 MD_TOC 才是这篇文章的目录
  const body = md(p.body)
  const toc = MD_TOC.slice()
  const tocHTML = toc.length >= 2 ? `
    <details class="toc" open>
      <summary>本页目录</summary>
      <ol>${toc.map(t =>
        `<li class="${t.lv === 3 ? 'lv3' : ''}"><a href="#${t.id}" data-toc="${t.id}">${esc(t.text)}</a></li>`
      ).join('')}</ol>
    </details>` : ''

  return `
  <div class="view article">
    <a class="back" href="#/posts">← 返回列表</a>
    <div class="meta">
      <span>${fmtDate(p.date)}</span><span>·</span><span>${readTime(p.body)}</span>
      ${p.cat ? `<span>·</span><a href="#/cat/${encodeURIComponent(p.cat)}">${esc(catName(p.cat))}</a>` : ''}
      <a class="dev-btn sm dev-only" href="#/edit/${encodeURIComponent(p.id)}">编辑</a>
    </div>
    <h1>${esc(p.title)}</h1>
    <div class="chips">${chipsHTML(p.tags, true)}</div>
    ${tocHTML}
    <div class="body">${body}</div>
    <!-- 页面末端的删除键。文章长的时候得滚到底才想起来要删，这儿最顺手 -->
    <div class="dev-page-act dev-only">
      <button class="dev-btn danger" type="button" data-dev-del="post" data-dev-id="${esc(p.id)}">
        删除这篇文章
      </button>
    </div>
  </div>`
}

/* ---------- 文章编辑页 ----------
   #/edit/new    写新的
   #/edit/<id>   改已有的

   这是**整页**，不是弹窗 —— 写文章要一大片地方，塞进小窗口里光文本框就剩两行高。
   上面填、下面实时预览，所见即所得。

   ⚠️ 没有「ID」这个输入框。主键从标题推（makePostId），已有的文章 ID 定死不动 ——
      让人手改主键，改完还得处理「旧的那条要不要删、收藏的链接会不会断」，
      得不偿失，而且写文章的人根本不该关心这个。
      标题推出来的 ID 撞车时由 boot.js 的 savePost() 补 -2、-3。 */
function viewEdit(id){
  /* 直接拿地址栏里那条链接进来的（不是从页面上点「编辑」过来的）。
     开发者模式没开的话给个提示就好 —— 省得看到一屏表单却不知道是干什么的 */
  if(!devModeOn()){
    return `<div class="view"><div class="empty"><div class="big">${icoHTML('about')}</div>
      开发者模式没开，编辑页进不来。<br><br>
      长按顶栏左上角那个方块 3 秒，点露出来的齿轮，再回来看。<br><br>
      <a href="#/posts">← 回文章列表</a></div></div>`
  }

  const isNew = id === 'new'
  const p = isNew ? null : mergedPosts().find(x => x.id === id)
  if(!isNew && !p){
    return `<div class="view"><div class="empty"><div class="big">(・_・;)</div>
      找不到这篇文章，可能已经被删了。<br><br><a href="#/posts">← 回文章列表</a></div></div>`
  }

  const v = p || { title:'', date: today(), cat:'', tags:[], cover:'', summary:'', body:'' }
  const back = isNew ? '#/posts' : '#/post/' + encodeURIComponent(id)
  const catOpts = '<option value="">（不分类）</option>' + CATEGORIES.map(c =>
    `<option value="${esc(c.key)}"${c.key === v.cat ? ' selected' : ''}>${esc(c.name)}</option>`).join('')

  return `
  <div class="view article edit">
    <a class="back" href="${back}">← 返回</a>
    <div class="sec-head">
      <h2>${isNew ? '写新文章' : '编辑文章'}</h2>
      <span class="more">${isNew ? '还没保存' : 'ID：' + esc(id)}</span>
    </div>

    <div class="dev-editor" id="postEditor">
      <div class="dev-grid">
        <label class="dev-field"><span>标题</span>
          <input id="edTitle" type="text" placeholder="文章标题" value="${esc(v.title)}" /></label>
        <label class="dev-field"><span>日期</span>
          <input id="edDate" type="date" value="${esc(v.date || today())}" /></label>
        <label class="dev-field"><span>分类</span>
          <select id="edCat">${catOpts}</select></label>
        <label class="dev-field"><span>标签</span>
          <input id="edTags" type="text" placeholder="逗号分隔，如 前端,CSS"
                 value="${esc((v.tags || []).join(','))}" /></label>
        <label class="dev-field"><span>封面</span>
          <input id="edCover" type="text" placeholder="可留空，如 ./photo/a.jpg"
                 value="${esc(v.cover || '')}" /></label>
        <label class="dev-field"><span>摘要</span>
          <input id="edSummary" type="text" placeholder="列表卡片上显示的一句话"
                 value="${esc(v.summary || '')}" /></label>
      </div>
      <!-- 正文框里的 &#96; 是反引号（&#96;），&#10; 是换行 ——
           这一段整个是 JS 模板字符串里的内容，直接写三个反引号会把这个
           模板字符串**提前结束**掉，所以一律写成 HTML 实体，由浏览器解码。
           （别改成真的反引号，除非你同时把它们反斜杠转义。） -->
      <label class="dev-field col"><span>正文（Markdown）</span>
        <textarea id="edBody" rows="16" spellcheck="false"
          placeholder="## 小标题&#10;&#10;正文段落。&#10;&#10;- 列表项&#10;&#10;![插图](./photo/x.jpg)&#10;&#10;&#96;&#96;&#96;js&#10;code()&#10;&#96;&#96;&#96;">${esc(v.body || '')}</textarea></label>
      <p class="dev-err" id="edErr" hidden></p>
      <div class="dev-actions">
        <button class="dev-btn" type="button" id="edSave">保存</button>
        <a class="dev-btn ghost" href="${back}">取消</a>
        ${isNew ? '' : `<button class="dev-btn danger" type="button" id="edDel"
          data-dev-del="post" data-dev-id="${esc(id)}">删除这篇文章</button>`}
      </div>
      <p class="dev-hint">保存后只存在你这台电脑的浏览器里。想让别人也看到，
        得把内容抄进 <code>data/posts.js</code> 再重新部署。</p>
    </div>

    <!-- 实时预览：边打字边看渲染成什么样。用的就是文章页那个 md() 渲染器，
         所以这儿长什么样，发出来就长什么样 -->
    <div class="edit-preview">
      <div class="ep-head">实时预览</div>
      <h1 id="epTitle"></h1>
      <div class="chips" id="epChips"></div>
      <div class="body" id="epBody"></div>
    </div>
  </div>`
}

function viewWorks(){
  const works = mergedWorks()
  return `
  <div class="view">
    <div class="sec-head"><h2>作品</h2><span class="more">${works.length} 个</span></div>
    ${devAddBtn('work', '+ 添加作品')}
    ${works.length ? `<div class="grid">${works.map(w => workCard(w)).join('')}</div>`
      : `<div class="empty"><div class="big">${icoHTML('works')}</div>还没有作品</div>`}

    <!-- 编辑表单只有一份，谁要编辑就被 JS「搬」到谁下面去（insertAdjacentElement）。
         比给每张卡片都渲染一个隐藏表单省事得多，DOM 也干净 -->
    <div class="dev-editor" id="workEditor" hidden>
      <h3 id="workEditorTitle">编辑作品</h3>
      <label class="dev-field col"><span>名称</span>
        <input id="wkName" type="text" placeholder="项目名" /></label>
      <div class="dev-grid">
        <label class="dev-field"><span>标签</span>
          <input id="wkTags" type="text" placeholder="逗号分隔，如 Vue,TS" /></label>
        <label class="dev-field"><span>链接</span>
          <input id="wkLink" type="text" placeholder="https://… 或 #" /></label>
      </div>
      <label class="dev-field col"><span>简介</span>
        <textarea id="wkDesc" rows="3" spellcheck="false"
          placeholder="一句话说清它是干什么的、解决了什么问题。"></textarea></label>
      <p class="dev-err" id="wkErr" hidden></p>
      <div class="dev-actions">
        <button class="dev-btn" type="button" id="wkSave">保存</button>
        <button class="dev-btn ghost" type="button" id="wkCancel">取消</button>
      </div>
    </div>
  </div>`
}

/* 文件那一行。下载页和搜索页共用；q 有值时把命中的词高亮出来（同上，别直接 map） */
function fileRow(f, q){
  return `
    <div class="dl">
      <div class="ico">${icoHTML('file')}</div>
      <div class="info">
        <b>${hi(f.name, q)}</b>
        <small>${esc(f.size || '')}${f.desc ? ' · ' + hi(f.desc, q) : ''}</small>
      </div>
      <span class="dev-row-act dev-only">
        <button class="dev-btn sm" type="button" data-dev-edit="file" data-dev-id="${esc(f.name)}">编辑</button>
        <button class="dev-btn sm danger" type="button" data-dev-del="file" data-dev-id="${esc(f.name)}">删除</button>
      </span>
      <a class="get" href="${esc(fileHref(f))}" download="${esc(f.name)}">下载</a>
    </div>`
}

/* 文件下载页。`.grid.files` 是单列 —— 文件名可能很长，并排两列会挤断（见 content.css） */
function viewDownloads(){
  const files = mergedFiles()
  return `
  <div class="view">
    <div class="sec-head"><h2>文件下载</h2><span class="more">${files.length} 个</span></div>
    ${devAddBtn('file', '+ 添加文件')}
    ${files.length ? `<div class="grid files">${files.map(f => fileRow(f)).join('')}</div>`
      : `<div class="empty"><div class="big">${icoHTML('folder')}</div>还没有文件</div>`}
  </div>`
}

/* ---------- 网站导航 ----------
   侧边栏那一项。按分类收着一堆外部网站，点一下跳过去。
   数据在 data/sites.js，开发者模式里的增删改存在 localStorage（键 kili.sites）。

   分类的编辑表单只有一份（#siteEditor），谁的「编辑分类」被点了就被 JS 搬到谁下面 ——
   和作品页一个路子。网站条目（links）那条也同理，共用一个 #linkEditor，
   塞在对应的 .site-link 那一行**后面**展开。

   ⚠️ 网站条目这里用的是「普通行 + 拉伸链接」，没有把整行做成 <a>：
      行里还有开发者模式那两个按钮，<button> 套在 <a> 里是非法 HTML。 */
function viewSites(){
  const cats = mergedSites()
  const total = cats.reduce((n, c) => n + (c.links || []).length, 0)

  return `
  <div class="view">
    <div class="sec-head">
      <h2><span class="sec-ico">${icoHTML('compass')}</span>网站导航</h2>
      <span class="more">${cats.length} 个分类 · ${total} 个网站</span>
    </div>
    ${devAddBtn('site', '+ 添加分类')}

    ${cats.length ? cats.map(c => `
      <section class="site-cat" data-site-key="${esc(c.key)}">
        <div class="sc-head">
          <span class="sc-ico">${icoHTML(c.icon)}</span>
          <b>${esc(c.name)}</b>
          ${c.desc ? `<small>${esc(c.desc)}</small>` : ''}
          <span class="dev-row-act dev-only">
            <button class="dev-btn sm" type="button" data-dev-new="link" data-dev-id="${esc(c.key)}">+ 网站</button>
            <button class="dev-btn sm" type="button" data-dev-edit="site" data-dev-id="${esc(c.key)}">编辑分类</button>
            <button class="dev-btn sm danger" type="button" data-dev-del="site" data-dev-id="${esc(c.key)}">删除分类</button>
          </span>
        </div>
        <div class="site-links">
          ${(c.links || []).length ? (c.links || []).map((l, i) => `
            <div class="site-link" data-cat="${esc(c.key)}" data-i="${i}">
              <a class="stretch" href="${esc(l.url)}" target="_blank" rel="noopener">
                <b>${esc(l.name)}</b>${l.desc ? `<small>${esc(l.desc)}</small>` : ''}
              </a>
              <span class="go" aria-hidden="true">↗</span>
              <span class="dev-row-act dev-only">
                <button class="dev-btn sm" type="button" data-dev-edit="link"
                        data-dev-id="${esc(c.key)}" data-dev-i="${i}">改</button>
                <button class="dev-btn sm danger" type="button" data-dev-del="link"
                        data-dev-id="${esc(c.key)}" data-dev-i="${i}">×</button>
              </span>
            </div>`).join('')
          : `<p class="sl-empty">这个分类下还没有网站。</p>`}
        </div>
      </section>`).join('')
      : `<div class="empty"><div class="big">${icoHTML('compass')}</div>还没有分类。<br>
         开发者模式下点上面的「+ 添加分类」加一个。</div>`}

    <!-- 分类编辑表单。谁的「编辑分类」被点了就搬到谁下面去 -->
    <div class="dev-editor" id="siteEditor" hidden>
      <h3 id="siteEditorTitle">编辑分类</h3>
      <div class="dev-grid">
        <label class="dev-field"><span>名称</span>
          <input id="stName" type="text" placeholder="比如：开发资源" /></label>
        <label class="dev-field"><span>图标</span>
          <select id="stIcon"></select></label>
      </div>
      <label class="dev-field col"><span>说明</span>
        <input id="stDesc" type="text" placeholder="分类标题后面那行小字，可留空" /></label>
      <p class="dev-err" id="stErr" hidden></p>
      <div class="dev-actions">
        <button class="dev-btn" type="button" id="stSave">保存</button>
        <button class="dev-btn ghost" type="button" id="stCancel">取消</button>
      </div>
    </div>

    <!-- 网站条目编辑表单。同样只有一份，搬到对应那一行后面展开 -->
    <div class="dev-editor" id="linkEditor" hidden>
      <h3 id="linkEditorTitle">添加网站</h3>
      <div class="dev-grid">
        <label class="dev-field"><span>名称</span>
          <input id="lkName" type="text" placeholder="比如：GitHub" /></label>
        <label class="dev-field"><span>网址</span>
          <input id="lkUrl" type="text" placeholder="https://…" /></label>
      </div>
      <label class="dev-field col"><span>说明</span>
        <input id="lkDesc" type="text" placeholder="一句话，可留空" /></label>
      <p class="dev-err" id="lkErr" hidden></p>
      <div class="dev-actions">
        <button class="dev-btn" type="button" id="lkSave">保存</button>
        <button class="dev-btn ghost" type="button" id="lkCancel">取消</button>
      </div>
    </div>
  </div>`
}

function viewAbout(){
  const links = []
  if(SITE.email)  links.push(`<a class="btn ghost" href="mailto:${esc(SITE.email)}">${icoHTML('mail')}邮箱</a>`)
  if(SITE.github) links.push(`<a class="btn ghost" href="${esc(SITE.github)}" target="_blank" rel="noopener">GitHub</a>`)
  return `
  <div class="view article">
    <h1>关于</h1>
    <div class="body">
      <p>${esc(SITE.intro)}</p>
      <h2>这个站点</h2>
      <p>单文件 HTML，没有构建步骤，不依赖任何外部资源。想加文章，长按顶栏左上角
      那个方块 3 秒，点露出来的齿轮进入开发者模式 —— 进去之后页面上会直接长出
      各种编辑按钮：文章列表顶部有「写新文章」，每张卡片上有「编辑 / 删除」，
      点页面上的图片就能换一张，作品、文件、网站导航也一样，都在页面上直接改。</p>
      <p>也可以打开 <code>data/posts.js</code>，在 <code>POSTS</code> 数组里照着格式
      加一条再重新部署 —— 开发者模式里的改动只存在你自己这台电脑的浏览器里，
      想让别人也看到，还是得落到 <code>data/</code> 里的文件上。</p>
      <h2>联系我</h2>
      <div class="btn-row">${links.join('') || '<span class="chip">还没填联系方式</span>'}</div>
    </div>
  </div>`
}
