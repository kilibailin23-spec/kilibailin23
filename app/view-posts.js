/* 文章：列表 / 归档 / 正文 / 编辑器 */
function viewPosts(opts){
  opts = opts || {}
  const isArchive = opts.view === 'archive'
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
function listHTML(list){
  if(!list.length){
    return `<div class="empty"><div class="big">(・_・;)</div>
      这里还什么都没有。<br><br><a href="#/posts">← 看全部文章</a></div>`
  }
  return `<div class="grid">${list.map(p => postCard(p)).join('')}</div>`
}

/* 归档视图：按年月分组的时间线 */
/* ⚠️ 归档行的「编辑 / 删除」是塞在 .post-row 那个 <a> 里的（和别处不一样）；
      以后要往这一行再加东西，请改成「普通 div + 拉伸链接」那套 */
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
    <div class="dev-page-act dev-only">
      <button class="dev-btn danger" type="button" data-dev-del="post" data-dev-id="${esc(p.id)}">
        删除这篇文章
      </button>
    </div>
  </div>`
}

/* ---------- 文章编辑页（#/edit/new 写新的 / #/edit/<id> 改已有的） ---------- */
function viewEdit(id){
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
      <!-- ⚠️ 这个框里的 &#96; 是反引号、&#10; 是换行：直接写会把这个模板字符串提前结束掉 -->
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

    <div class="edit-preview">
      <div class="ep-head">实时预览</div>
      <h1 id="epTitle"></h1>
      <div class="chips" id="epChips"></div>
      <div class="body" id="epBody"></div>
    </div>
  </div>`
}
