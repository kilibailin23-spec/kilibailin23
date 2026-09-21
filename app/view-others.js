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

/* 文件那一行。下载页和搜索页共用（同上，别直接 map） */
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
