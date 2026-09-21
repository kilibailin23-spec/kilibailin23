/* 其它页面：作品、下载、网站导航、关于 */
function viewWorks(){
  const works = mergedWorks()
  return `
  <div class="view">
    <div class="sec-head"><h2>作品</h2><span class="more">${works.length} 个</span></div>
    ${devAddBtn('work', '+ 添加作品')}
    ${works.length ? `<div class="grid">${works.map(w => workCard(w)).join('')}</div>`
      : `<div class="empty"><div class="big">${icoHTML('works')}</div>还没有作品</div>`}

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

/* 文件名底下那行小字：大小 · 登记时间 · 说明。列表和网格共用这一份 ——
   两处各写一遍拼接，加字段时必然漏掉一处。
   ⚠️ 空的那几项要整个跳过，不能写成 `${esc(f.size || '')}${f.time ? ' · ' …}`：
   size 空着（手写条目、网盘外链）而 time 有值时，会留下一个光秃秃的「· 」开头。 */
function fileMeta(f, q){
  const bits = []
  if(f.size) bits.push(esc(f.size))
  if(f.time) bits.push(esc(f.time))
  if(f.desc) bits.push(hi(f.desc, q))
  return bits.join(' · ')
}

/* 文件那一行。下载页和搜索页共用（同上，别直接 map） */
function fileRow(f, q){
  return `
    <div class="dl">
      <div class="ico">${icoHTML('file')}</div>
      <div class="info">
        <b>${hi(f.name, q)}</b>
        <small>${fileMeta(f, q)}</small>
      </div>
      <span class="dev-row-act dev-only">
        <button class="dev-btn sm" type="button" data-dev-edit="file" data-dev-id="${esc(f.name)}">编辑</button>
        <button class="dev-btn sm danger" type="button" data-dev-del="file" data-dev-id="${esc(f.name)}">删除</button>
      </span>
      <a class="get" href="${esc(fileHref(f))}" download="${esc(f.name)}">下载</a>
    </div>`
}

/* ==========================================================================
   文件下载页：两层结构
   ==========================================================================
   第一层看文件夹，点进去看文件。文件夹不是另存一份的数据，而是从文件的归属
   （app/util.js 的 folderOf）里归集出来的 —— 有文件才有文件夹，传文件时填的
   文件夹名就是新建文件夹的方式。

   状态：DL_FOLDER 用 null 表示「根层（文件夹列表）」，跟 ''（未分类文件夹内）
   区分开，判断一律写 === null；DL_PAGE 从 1 起；视图偏好记在 localStorage。
   三个交互（进出文件夹 / 切视图 / 翻页）的点击都委托在 app/boot.js 里。 */
let DL_FOLDER = null
let DL_PAGE = 1
let DL_VIEW = lsGet('kili.dl.view') || 'list'
let DL_SORT = lsGet('kili.dl.sort') || 'time'
const DL_PER = { list: 10, grid: 30 }

/* 文件排序。time = 最近登记的排前面（刚传完的就在最上面）；name = 中文拼音序。
   ⚠️ 没有 time 的老条目（手写的、或者 time 字段还没有的时候留下的）会沉到时间序末尾 ——
   空串跟谁比都小，倒序自然垫底，不用特意把它们挑出来单放。 */
function sortFiles(list, mode){
  const arr = list.slice()
  if(mode === 'name')
    arr.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'zh'))
  else
    arr.sort((a, b) => String(b.time || '').localeCompare(String(a.time || '')))
  return arr
}

/* 文件夹按同一套规则排。只有 name 序里「未分类」固定垫底 —— 它不算一个真的
   文件夹名，夹在 game 和联机补丁中间没人找得到；时间序里它就是个普通项。 */
function sortFolders(list, mode){
  const arr = list.slice()
  if(mode === 'name'){
    arr.sort((a, b) => {
      if(a.name === '') return 1
      if(b.name === '') return -1
      return a.name.localeCompare(b.name, 'zh')
    })
  } else {
    arr.sort((a, b) => String(b.time || '').localeCompare(String(a.time || '')))
  }
  return arr
}

/* 网格视图的一张卡片。⚠️ 不复用 fileRow：那条的 .dl .info b 是写死的
   nowrap + ellipsis（见 layout.css），格子比整行窄得多，文件名会被截断而不是换行。 */
function fileCard(f, q){
  return `
    <div class="dl-card">
      <div class="ico">${icoHTML('file')}</div>
      <b>${hi(f.name, q)}</b>
      <small>${fileMeta(f, q)}</small>
      <span class="dev-row-act dev-only">
        <button class="dev-btn sm" type="button" data-dev-edit="file" data-dev-id="${esc(f.name)}">编辑</button>
        <button class="dev-btn sm danger" type="button" data-dev-del="file" data-dev-id="${esc(f.name)}">删除</button>
      </span>
      <a class="get" href="${esc(fileHref(f))}" download="${esc(f.name)}">下载</a>
    </div>`
}

/* 翻页控件。只有一页时干脆不画 —— 没占满的文件夹底下挂个「1 / 1」纯属碍眼 */
function dlPager(total, page){
  if(total <= 1) return ''
  return `
    <div class="dl-pager">
      <button class="ps-btn" type="button" data-dl-page="${page - 1}"${page <= 1 ? ' disabled' : ''}>‹ 上一页</button>
      <span class="dl-page-num">${page} / ${total}</span>
      <button class="ps-btn" type="button" data-dl-page="${page + 1}"${page >= total ? ' disabled' : ''}>下一页 ›</button>
    </div>`
}

function viewDownloads(){
  const all = mergedFiles()
  const folders = sortFolders(mergedFolders(), DL_SORT)
  const named = folders.filter(c => c.name !== '')

  /* 一个子文件夹都没有 → 没必要多一层，直接把文件平铺在这儿。
     在某个文件夹里把文件删光了也会落到这条分支，顺手把状态复位。 */
  if(!named.length) DL_FOLDER = null
  else if(DL_FOLDER !== null && !folders.some(c => c.name === DL_FOLDER)) DL_FOLDER = null

  const inFolder = DL_FOLDER !== null
  const files = inFolder ? sortFiles(all.filter(f => folderOf(f) === DL_FOLDER), DL_SORT)
                         : (named.length ? [] : sortFiles(all, DL_SORT))

  const per = DL_PER[DL_VIEW] || DL_PER.list
  const pages = Math.max(1, Math.ceil(files.length / per))
  DL_PAGE = Math.min(Math.max(1, DL_PAGE), pages)   /* 夹回有效范围，别停在空页上 */
  const page = DL_PAGE
  const slice = files.slice((page - 1) * per, page * per)

  /* 进了文件夹就是面包屑，「文件下载」那一截可点，退回文件夹列表。
     ⚠️ 这一行别折行：模板里的换行会渲染成一个空格，跟 .dl-sep 的 margin 叠起来，
     斜杠左右间距就不对称了。 */
  const head = inFolder
    ? `<button class="dl-crumb" type="button" data-dl-root title="返回文件夹列表">文件下载</button><span class="dl-sep">/</span><span class="dl-cur">${esc(DL_FOLDER || '未分类')}</span>`
    : '文件下载'
  /* 计数里的文件夹数用 folders 不是 named：列表上「未分类」也占一条，
     只数具名的那几个会跟眼睛看到的条数对不上 */
  const count = inFolder ? `共 ${files.length} 个`
              : named.length ? `${folders.length} 个文件夹` : `${files.length} 个`

  /* ⚠️ 上传入口是常驻的（不带 dev-only）—— 谁都能看见。每个条目右边的
     「编辑 / 删除」仍旧只有开发者模式才露脸。
     排序开关跟着上传按钮（用 all 判断：根层只有文件夹的时候也该能排序）；
     视图开关挂在最右边 —— .dl-switch 上有 margin-left:auto。 */
  const bar = `
    <div class="posts-bar dl-bar">
      <button class="dev-btn" type="button" data-dev-new="file">+ 上传文件</button>
      ${all.length ? `<div class="posts-switch dl-sort">
        <button class="ps-btn${DL_SORT === 'time' ? ' on' : ''}" type="button" data-dl-sort="time" title="最近登记的排前面">◷ 时间</button>
        <button class="ps-btn${DL_SORT === 'name' ? ' on' : ''}" type="button" data-dl-sort="name" title="按名字排">A 首字母</button>
      </div>` : ''}
      ${files.length ? `<div class="posts-switch dl-switch">
        <button class="ps-btn${DL_VIEW === 'list' ? ' on' : ''}" type="button" data-dl-view="list">☰ 列表</button>
        <button class="ps-btn${DL_VIEW === 'grid' ? ' on' : ''}" type="button" data-dl-view="grid">▦ 网格</button>
      </div>` : ''}
    </div>`

  const body = named.length && !inFolder
    ? folders.map(c => `
      <button class="dl-folder" type="button" data-dl-folder="${esc(c.name)}">
        <span class="ico">${icoHTML('folder')}</span>
        <b>${esc(c.name || '未分类')}</b>
        <small title="里面最近一次登记的时间">${c.count} 个${c.time ? ' · ' + esc(c.time) : ''}</small>
        <span class="go" aria-hidden="true">›</span>
      </button>`).join('')
    : (slice.length
        ? (DL_VIEW === 'grid'
            ? `<div class="dl-grid">${slice.map(f => fileCard(f)).join('')}</div>`
            : `<div class="grid files">${slice.map(f => fileRow(f)).join('')}</div>`)
        : `<div class="empty"><div class="big">${icoHTML('folder')}</div>还没有文件</div>`)

  return `
  <div class="view">
    <div class="sec-head" id="dlTop"><h2>${head}</h2><span class="more">${count}</span></div>
    ${bar}
    ${body}
    ${dlPager(pages, page)}
  </div>`
}

/* ---------- 网站导航 ---------- */
/* ⚠️ 网站条目用「普通行 + 拉伸链接」，没有把整行做成 <a>：行里还有开发者模式那两个按钮 */
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
