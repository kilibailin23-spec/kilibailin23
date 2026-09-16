/* ==========================================================================
   路由

   按地址栏 # 后面那截决定渲染哪个页面。

   这个文件是从原来的单文件 index.html 里拆出来的，内容没动过。

   ---- 两条不太直观的 ----
   · #/archive 渲染的是「文章页的归档视图」，不是单独一个页面。归档和文章
     看的是同一批数据，做成一个页面里的两种视图就够了，导航里也就不再单占一项。
     它故意还留着：老链接、浏览器前进后退、别人收藏过的地址都还能用。
   · #/edit/xxx 是开发者模式才有的页面（写文章 / 改文章）。开发者模式没开时
     进去会看到一句提示，见 views.js 的 viewEdit()。
   ========================================================================== */

/* ---------- 路由 ---------- */
let SEARCH_Q = ''
/* 搜索页当前看的是哪一类：all / post / work / file。
   和 SEARCH_Q 一样是个全局变量 —— 搜索页那排标签点是 <button> 不是链接，
   改完这个再 paintView() 原地重画（见 boot.js 的 bootSearch）。 */
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

/* 只把 hash 翻译成 HTML，不碰 DOM。
   拆出来是为了搜索时能原地重画，而不用重走一遍路由、也不用动地址栏 */
function resolve(){
  const hash = location.hash || '#/'
  let html, activeNav = hash

  if(hash === '#/' || hash === '#' || hash === '')       { html = viewHome();      activeNav = '#/' }
  else if(hash === '#/posts')                            { html = viewPosts() }
  /* 归档 = 文章页的另一种视图，所以左侧导航高亮的是「文章」 */
  else if(hash === '#/archive')                          { html = viewPosts({ view:'archive' }); activeNav = '#/posts' }
  /* 搜索串起全站三类东西（文章 / 作品 / 文件），所以是自己的一个页面，
     不是文章页的一种筛选。词和类别都在全局变量里，改完原地重画，不动地址栏 */
  else if(hash === '#/search')                           { html = viewSearch(SEARCH_Q, SEARCH_KIND) }
  else if(hash === '#/sites')                            { html = viewSites() }
  else if(hash === '#/works')                            { html = viewWorks() }
  else if(hash === '#/downloads')                        { html = viewDownloads() }
  else if(hash === '#/about')                            { html = viewAbout() }
  /* 编辑页也算「文章」这一摊：导航高亮文章，免得点进去左侧一个都不亮 */
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

  /* 两件「画完了还得顺手做一下」的事：
     · applyImgMap —— 把开发者模式换过的图替换上去。视图是整块 innerHTML
       换掉的，不扫这一遍，换过的图一刷新就打回原形；
     · runAfterPaint —— boot.js 注册的钩子（比如文章编辑页的实时预览初稿）。 */
  applyImgMap()
  runAfterPaint()

  document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === r.activeNav))
  const st = $('#status')
  if(st) st.textContent = r.status
  if(!keepScroll) window.scrollTo(0, 0)
  updateProgress()
}

function render(){ paintView(false) }
