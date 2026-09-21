/* 路由：按地址栏 # 后面那截决定渲染哪个页面 */

/* ---------- 路由 ---------- */
let SEARCH_Q = ''
let SEARCH_KIND = 'all'

const STATUS_TEXT = {
  '#/':          '正在首页发呆中…',
  '#/posts':     '正在翻文章列表…',
  '#/sites':     '正在翻收藏夹…',
  '#/search':    '正在全站搜索…',
  '#/works':     '正在数作品…',
  '#/downloads': '正在翻文件…',
  '#/about':     '正在自我介绍…'
}

/* #/archive 复用文章页（导航高亮「文章」）；#/edit/xxx 也算文章那一摊 */
function resolve(){
  const hash = location.hash || '#/'
  let html, activeNav = hash

  if(hash === '#/' || hash === '#' || hash === '')       { html = viewHome();      activeNav = '#/' }
  else if(hash === '#/posts')                            { html = viewPosts() }
  else if(hash === '#/archive')                          { html = viewPosts({ view:'archive' }); activeNav = '#/posts' }
  else if(hash === '#/search')                           { html = viewSearch(SEARCH_Q, SEARCH_KIND) }
  else if(hash === '#/sites')                            { html = viewSites() }
  else if(hash === '#/works')                            { html = viewWorks() }
  else if(hash === '#/downloads')                        { html = viewDownloads() }
  else if(hash === '#/about')                            { html = viewAbout() }
  else if(hash.startsWith('#/edit/'))                    { html = viewEdit(safeDecode(hash.slice(7))); activeNav = '#/posts' }
  else if(hash.startsWith('#/post/'))                    { html = viewPost(safeDecode(hash.slice(7))); activeNav = '#/posts' }
  else if(hash.startsWith('#/tag/'))                     { html = viewPosts({ tag: safeDecode(hash.slice(6)) });  activeNav = '#/posts' }
  else if(hash.startsWith('#/cat/'))                     { html = viewPosts({ cat: safeDecode(hash.slice(6)) });  activeNav = '#/posts' }
  else { html = `<div class="view"><div class="empty"><div class="big">(・_・;)</div>页面不存在<br><br><a href="#/">回首页</a></div></div>` }

  return { html, activeNav, status: STATUS_TEXT[activeNav] || '' }
}

function paintView(keepScroll){
  const r = resolve()
  $('#view').innerHTML = r.html

  /* ⚠️ 视图是整块 innerHTML 换掉的：漏掉这两句，换过的图会打回原形、实时预览会失效 */
  applyImgMap()
  runAfterPaint()

  document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === r.activeNav))
  const st = $('#status')
  if(st) st.textContent = r.status
  if(!keepScroll) window.scrollTo(0, 0)
  updateProgress()
}

function render(){ paintView(false) }
