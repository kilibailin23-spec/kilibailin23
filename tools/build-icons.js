/* ==========================================================================
   把 icons/ 里的图标转成 data: URI，写进 data/icons.js

   什么时候要跑：换了图标、加了图标、改了 data/site.js 里的 iconExt 之后。
   双击项目根目录的「更新图标.bat」就行，或者在项目根目录敲：
       node tools/build-icons.js

   ---------------------------------------------------------------------------
   为什么要多这一道手续，不能直接按文件名引用？

   图标是用 CSS 的 mask 画的（见 styles/aero.css 的 .ico-img）：
   取图片的形状，颜色交给 currentColor，所以一套图就能自动适配亮/暗主题。

   问题出在浏览器对 mask 的安全策略上：mask 引用的图片被当作**需要跨源许可**
   的资源。而双击打开时页面是 file:// 协议，file:// 下**每个文件都算一个独立的源**，
   于是 mask 引用的图标会被拦掉。被拦掉时的表现很有迷惑性 ——
   图标不是显示成裂图，而是整个元素变透明，看起来就像「图标根本没接上」。

   （背景图 <img> 不走 mask，所以它们一直好好的。同理，双击打开时没法用
     fetch 读本地文件，所以数据也都写成 .js 里的常量而不是 .json。）

   data: URI 是跟文档绑在一起的，不受这条限制，双击照样能显示。
   代价就是图标内容要内联进来，文件大了点（约 80KB），以及换图后要重跑本脚本。
   ========================================================================== */

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const ICON_DIR = path.join(ROOT, 'icons')
const SITE_JS = path.join(ROOT, 'data', 'site.js')
const OUT_JS = path.join(ROOT, 'data', 'icons.js')

/* 图标名只允许这些字符 —— 它会被拼进 CSS 类名（.ico-home），
   名字里带奇怪字符的话类名就废了。生成时挡一道，省得后面出玄学问题。 */
const SAFE = /^[A-Za-z0-9_-]+$/

/* 从 site.js 里读 iconExt，决定优先内联哪一套。
   先把注释剥掉再找，否则会匹配到注释里举的例子。 */
function readIconExt(){
  const src = fs.readFileSync(SITE_JS, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1')
  const m = /iconExt\s*:\s*'([^']+)'/.exec(src)
  return m ? m[1] : '.svg'
}

/* 收集 icons/ 里所有能用的图标，按扩展名分组 */
function collect(){
  const sets = {}
  for (const f of fs.readdirSync(ICON_DIR).sort()){
    const dot = f.lastIndexOf('.')
    if (dot <= 0) continue
    const name = f.slice(0, dot)
    const ext = f.slice(dot).toLowerCase()
    if (ext !== '.png' && ext !== '.svg') continue
    if (!SAFE.test(name)) {
      console.warn('  跳过（名字里有不安全的字符）：' + f)
      continue
    }
    const buf = fs.readFileSync(path.join(ICON_DIR, f))
    const mime = ext === '.png' ? 'image/png' : 'image/svg+xml'
    // 一律用 base64，省得去操心 SVG 里的引号、#、% 要不要转义
    ;(sets[ext] = sets[ext] || {})[name] = 'data:' + mime + ';base64,' + buf.toString('base64')
  }
  return sets
}

const sets = collect()
const exts = Object.keys(sets).sort()

if (!exts.length){
  console.error('icons/ 里没找到 .png 或 .svg，什么都没生成。')
  process.exit(1)
}

const preferred = readIconExt()
if (!sets[preferred]){
  console.warn('注意：site.js 里写的是 iconExt: \'' + preferred + '\'，' +
               '但 icons/ 里没有这一套，页面会退回用兜底路径引用。')
}

const body = exts.map(ext => {
  const entries = Object.keys(sets[ext]).sort()
    .map(n => "    '" + n + "':\n      '" + sets[ext][n] + "'")
    .join(',\n')
  return "  '" + ext + "': {\n" + entries + '\n  }'
}).join(',\n')

const out = `/* ==========================================================================
   图标数据 —— 【这个文件是自动生成的，别手改】

   要改图标：把新文件丢进 icons/ 覆盖同名的，然后双击项目根目录的
   「更新图标.bat」（或者敲 node tools/build-icons.js）重新生成一次。

   里面存的是 data: URI，不是文件路径。原因见 tools/build-icons.js 的说明 ——
   简单说：图标用 mask 渲染，而 mask 在 file:// 下会被浏览器当成跨源资源拦掉，
   只有内联成 data: URI 才能保证「双击打开」时也显示。

   两套都躺在这里，用哪套由 data/site.js 的 iconExt 决定：
     '.png' → Icons8 Fluent（Win11 风格）
     '.svg' → 手绘线条版
   换 iconExt 不用重新生成，两套都已经在里面了。
   ========================================================================== */

const ICONS = {
${body}
}
`

fs.writeFileSync(OUT_JS, out)

/* 报一下账，顺便确认 iconExt 指的那一套确实是全的 */
const size = (fs.statSync(OUT_JS).size / 1024).toFixed(1)
console.log('已生成 data/icons.js  ' + size + ' KB')
for (const ext of exts){
  const names = Object.keys(sets[ext])
  const mark = ext === preferred ? '  ← 当前 iconExt 用的就是这套' : ''
  console.log('  ' + ext.padEnd(5) + names.length + ' 个：' + names.join(' ')+ mark)
}
