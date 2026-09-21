/* 首页、搜索结果 */
function viewHome(){
  const recent = mergedPosts().sort(byDateDesc).slice(0, 3)

  const avatarTxt = esc(SITE.mark || String(SITE.name || '?').slice(0, 1))
  const face = (src, back) =>
    `<div class="ha-face${back ? ' ha-back' : ''}">` +
      (src ? `<img src="${esc(src)}" alt="${esc(SITE.name)} 的头像" loading="lazy" onerror="this.hidden=true">` : '') +
      `<span aria-hidden="true">${avatarTxt}</span>` +
    `</div>`
  const avatar =
    face(siteImg('avatar'), false) +
    face(siteImg('avatarBack') || siteImg('avatar'), true)

  const lines = (SITE.hashtags || []).map(t =>
    `<p class="ha-line">${esc(t)}</p>`).join('')

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
        <div class="sec-head"><h2><span class="sec-ico">${icoHTML('works')}</span>作品</h2><a class="more" href="#/works">全部 →</a></div>
        <div class="grid">${mergedWorks().slice(0,3).map(w => workCard(w)).join('')}</div>
      </section>
    </div>
  </div>`
}

/* ---------- 文章列表 / 归档（同一个页面的两种视图） ---------- */
/* ---------- 搜索 ---------- */

const SEARCH_KINDS = [
  { key: 'all',  name: '全部' },
  { key: 'post', name: '文章', bucket: 'posts', ico: 'posts' },
  { key: 'work', name: '作品', bucket: 'works', ico: 'works' },
  { key: 'file', name: '文件', bucket: 'files', ico: 'folder' }
]

function searchAll(q){
  const n = q.toLowerCase()
  const hit = fields => fields.join(' ').toLowerCase().indexOf(n) >= 0
  return {
    /* ⚠️ 正文取纯文本要用 plain()，**不能**用 md() —— md() 会把全局 MD_TOC 重置掉 */
    posts: mergedPosts().sort(byDateDesc).filter(p =>
      hit([p.title, p.summary, (p.tags || []).join(' '), plain(p.body)])),
    works: mergedWorks().filter(w =>
      hit([w.name, w.desc, (w.tags || []).join(' ')])),
    files: mergedFiles().filter(f => hit([f.name, f.desc]))
  }
}

function viewSearch(q, kind){
  const query = (q || '').trim()
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

  const sec = (k, n, html) => (on(k.key) && n) ? `
    <section class="search-block">
      <div class="sec-head">
        <h2><span class="sec-ico">${icoHTML(k.ico)}</span>${k.name}</h2>
        <span class="more">${n} 条</span>
      </div>
      ${html}
    </section>` : ''

  /* ⚠️ 三处都是显式箭头 —— 直接写 .map(postCard) 的话，下标会被当成搜索词 q */
  const body = [
    sec(K('post'), r.posts.length,
      `<div class="grid">${r.posts.map(p => postCard(p, query)).join('')}</div>`),
    sec(K('work'), r.works.length,
      `<div class="grid">${r.works.map(w => workCard(w, query)).join('')}</div>`),
    sec(K('file'), r.files.length,
      `<div class="grid files">${r.files.map(f => fileRow(f, query)).join('')}</div>`)
  ].join('')

  /* ⚠️ 判断「有没有东西可看」要用 shownCount，不能用 total（选中某一类时别的类不该算数） */
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
