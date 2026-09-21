/* ==========================================================================
   扫描 files/ 文件夹，把所有文件写进 data/files.js 的 FILES 清单

   什么时候要跑：往 files/ 里丢了新文件、删了文件、换了文件之后。
   双击项目根目录的「更新下载列表.bat」就行，或者在项目根目录敲：
       node tools/build-files.js

   ---------------------------------------------------------------------------
   文件夹是怎么分的？

   目录结构本身就是答案 —— files/plus/弹球.zip 归到「plus」，直接躺在
   files/ 根下的算「未分类」。下载页第一层列的就是这些文件夹名，靠的是
   app/util.js 里的 folderOf() 从路径里读。

   所以这个脚本**不写** folder 字段：路径已经说明了一切，写了反而多一处
   可能对不上的地方。

   ---------------------------------------------------------------------------
   什么会被保住、什么会被覆盖？

   脚本按 file 路径认人。认出来的老条目，**显示名（name）和说明（desc）
   原样留着**，只有 size 会被重算 —— 文件换了大小就不对了，自动算的比手填准。

   自己手写的**外链条目**（file 直接写 https://…，没有本地路径）不归脚本管，
   不会被删也不会被改。

   ⚠️ `const FILES` **上面**那段注释是你的地盘，脚本一个字都不动；
   数组本身每次都会整个重新生成，别在数组里面写注释，会没。
   ========================================================================== */

const fs = require('fs')
const path = require('path')
const readline = require('readline')
const { execSync } = require('child_process')

const ROOT = path.join(__dirname, '..')
const FILES_DIR = path.join(ROOT, 'files')
const OUT_JS = path.join(ROOT, 'data', 'files.js')

/* 这些不是给人下载的，扫描时跳过（说明文件、系统缩略图之类） */
const SKIP = new Set(['把文件放这里.txt', '.gitkeep', 'Thumbs.db', 'desktop.ini'])

/* 跟开发者模式小窗口里那个 humanSize() 一个口径（app/dev.js），
   这样手填的和自动算的看起来是一回事 */
function humanSize(n){
  if(n < 1024) return n + ' B'
  if(n < 1048576){
    const kb = n / 1024
    return (kb < 10 ? kb.toFixed(1) : Math.round(kb)) + ' KB'
  }
  if(n < 1073741824) return (n / 1048576).toFixed(1) + ' MB'
  return (n / 1073741824).toFixed(2) + ' GB'
}

/* 文件时间，格式化成 'YYYY-MM-DD HH:MM' —— 下载页按时间排序靠它。
   ⚠️ 得跟 app/util.js 里那个 stamp() 一模一样：定长同格式，字符串比大小
   就是比时间，改了格式排序就废了。 */
function stamp(d){
  const p = n => (n < 10 ? '0' : '') + n
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
         ' ' + p(d.getHours()) + ':' + p(d.getMinutes())
}

/* 递归收文件。点和下划线开头的、SKIP 里列的一律跳过 */
function walk(dir, out){
  let items
  try { items = fs.readdirSync(dir, { withFileTypes: true }) }
  catch(e){ return out }
  for(const it of items){
    if(it.name.startsWith('.')) continue
    if(SKIP.has(it.name)) continue
    const full = path.join(dir, it.name)
    if(it.isDirectory()) walk(full, out)
    else if(it.isFile()) out.push(full)
  }
  return out
}

/* data/files.js 是个 `const FILES = [...]` 的普通脚本，直接当函数体跑一遍拿结果。
   ⚠️ 不能用 require()：那个文件里没有 module.exports，require 回来是空的。 */
function loadOld(src){
  try {
    return new Function(src + '\n;return typeof FILES === "undefined" ? [] : FILES')() || []
  } catch(e){
    console.log('  ⚠️ 原来的 data/files.js 读不懂（' + e.message + '）')
    console.log('     这次当成空的重新生成，你手写的条目会没 —— 想保住就先 Ctrl+C 退出，')
    console.log('     把那个文件修复到能跑再说。')
    return []
  }
}

/* 归一化一条记录，顺手把字段顺序摆成下载页表单里的那个顺序。
   time 空着就整个不写这个字段 —— 老条目没有它照样能用，只是排时间序时沉底。 */
function norm(f){
  const o = { name: String(f.name || '') }
  if(f.folder) o.folder = String(f.folder)
  o.file = String(f.file || '')
  o.size = String(f.size || '')
  if(f.time) o.time = String(f.time)
  o.desc = String(f.desc || '')
  return o
}

/* 生成一个字符串字面量。项目里通篇单引号（data/*.js 都是），所以要把
   JSON.stringify 给的双引号换回来 —— 除非内容里本来就有单引号，
   那就让双引号留着，省得再去转义。该转义的 JSON.stringify 已经转好了。 */
function js(v){
  const q = JSON.stringify(String(v))
  const body = q.slice(1, -1)
  return body.includes("'") ? q : "'" + body + "'"
}

function render(entries){
  if(!entries.length) return 'const FILES = []\n'
  const body = entries.map(e => {
    const lines = Object.keys(e).map(k => '    ' + k + ': ' + js(e[k]))
    return '  {\n' + lines.join(',\n') + '\n  }'
  }).join(',\n')
  return 'const FILES = [\n' + body + '\n]\n'
}

function ask(q){
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(res => rl.question(q, a => { rl.close(); res(a.trim()) }))
}

/* git 命令在仓库根目录跑。stdout 收进管道，失败时把 stderr 一起带出来 */
function git(cmd){
  try {
    return execSync('git ' + cmd, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] }).toString()
  } catch(e){
    const msg = [e.stdout, e.stderr].filter(Boolean).map(String).join('').trim()
    throw new Error(msg || e.message)
  }
}

async function main(){
  if(!fs.existsSync(FILES_DIR)){
    console.log('  ✗ 找不到 files/ 文件夹。先把它建回来再跑这个脚本。')
    process.exit(1)
  }

  const src = fs.readFileSync(OUT_JS, 'utf8')

  /* `const FILES` 上面那段（文件头注释）原样留着，只换数组本身 */
  const headEnd = src.indexOf('const FILES')
  if(headEnd < 0){
    console.log('  ✗ data/files.js 里找不到 `const FILES`，它可能被改坏了。')
    console.log('     先把它修回原样再跑这个脚本。')
    process.exit(1)
  }
  const head = src.slice(0, headEnd)

  const old = loadOld(src)

  /* 老条目分两堆：./files/ 下的归脚本管，其余（网盘外链、自定义路径）原样留着 */
  const oldByPath = Object.create(null)
  const kept = []
  for(const f of old){
    if(!f || typeof f !== 'object') continue
    const file = String(f.file || '')
    if(/^\.\/files\//i.test(file)) oldByPath[file] = f
    else kept.push(norm(f))
  }

  const found = walk(FILES_DIR, [])
    .map(abs => './' + path.relative(ROOT, abs).split(path.sep).join('/'))
    .filter(rel => /^\.\/files\//i.test(rel))
    .sort((a, b) => a.localeCompare(b, 'zh'))

  if(!found.length && Object.keys(oldByPath).length){
    console.log('  ⚠️ files/ 里一个文件都没扫到，但清单里原有 ' + Object.keys(oldByPath).length + ' 条。')
    console.log('     继续的话清单会被清空。')
    const ans = await ask('  确定要清空吗？(y/N) ')
    if(!/^y/i.test(ans)){ console.log('  已取消，什么都没改。'); return }
  }

  const next = found.map(rel => {
    const prev = oldByPath[rel]
    let st = null
    try { st = fs.statSync(path.join(ROOT, rel)) } catch(e){}
    /* 时间只给**新条目**盖一次，认出来的老条目沿用清单里那个 ——
       不然每跑一次就把整张表的时间刷成今天，下载页的时间排序就全乱了。
       也不能每次都从文件系统现读：别人 clone 下来，mtime 全是 checkout 那一刻。 */
    return norm({
      name: (prev && prev.name) || rel.split('/').pop(),
      folder: prev && prev.folder,
      file: rel,
      size: st ? humanSize(st.size) : '',
      time: (prev && prev.time) || (st ? stamp(st.mtime) : ''),
      desc: (prev && prev.desc) || ''
    })
  })

  const all = next.concat(kept)
  const nextPaths = new Set(next.map(e => e.file))

  const added = next.filter(e => !oldByPath[e.file])
  const removed = Object.keys(oldByPath).filter(p => !nextPaths.has(p))
  const resized = next.filter(e => oldByPath[e.file] && oldByPath[e.file].size && oldByPath[e.file].size !== e.size)
  const renamed = next.filter(e => oldByPath[e.file] && oldByPath[e.file].name && oldByPath[e.file].name !== e.name)

  /* 报变化 */
  if(added.length){
    console.log('  新扫到 ' + added.length + ' 个文件：')
    added.forEach(e => console.log('    + ' + e.file))
  }
  if(removed.length){
    console.log('  清单里少了 ' + removed.length + ' 个（files/ 里已经没有了）：')
    removed.forEach(p => console.log('    - ' + p))
  }
  if(resized.length || renamed.length){
    console.log('  改动的条目：')
    resized.forEach(e => console.log('    ~ ' + e.file + '  大小 ' + oldByPath[e.file].size + ' → ' + e.size))
    renamed.forEach(e => console.log('    ~ ' + e.file + '  显示名 ' + oldByPath[e.file].name + ' → ' + e.name))
  }
  if(kept.length) console.log('  ' + kept.length + ' 条手写的外链条目原样保留。')

  if(!added.length && !removed.length && !resized.length && !renamed.length){
    console.log('  清单内容没有变化。')
  }

  fs.writeFileSync(OUT_JS, head + render(all), 'utf8')
  console.log('')
  console.log('  ✓ 已写入 data/files.js（共 ' + all.length + ' 条）')

  /* 清单没变，files/ 里也可能有新文件没提交，所以查的是 git 而不是上面那几个数组 */
  let dirty = []
  try {
    dirty = git('status --porcelain -- files data/files.js').split('\n').filter(l => l.trim())
  } catch(e){
    console.log('  ⚠️ 这不是个 git 仓库（或者 git 没装），跳过提交这一步。')
    console.log('     清单已经更新好了，你自己把 files/ 和 data/files.js 传上去就行。')
    return
  }

  if(!dirty.length){
    console.log('  files/ 和 data/files.js 都没有未提交的改动，不用提交。')
    return
  }

  console.log('')
  console.log('  这些改动还没提交：')
  dirty.forEach(l => console.log('    ' + l))

  const ans = await ask('\n  现在提交并推送到 GitHub 吗？（推上去 Netlify 会自动重新部署）(y/N) ')
  if(!/^y/i.test(ans)){
    console.log('  好，清单已经更新好了，你想自己提交也行。')
    return
  }

  try {
    git('add -A files data/files.js')
    git('commit -m "更新下载文件清单"')
    console.log('  ✓ 已提交')
    console.log('  正在推送…')
    git('push')
    console.log('  ✓ 推送成功。Netlify 那边等一两分钟就会重新部署好。')
  } catch(e){
    console.log('')
    console.log('  ✗ 提交或推送失败：')
    console.log('    ' + String(e.message).split('\n').join('\n    '))
    console.log('')
    console.log('  常见原因：')
    console.log('    1. 没配 GitHub 凭据 —— 在这个文件夹的终端里敲一次 git push，')
    console.log('       按提示登录一遍，之后就记住不再问了')
    console.log('    2. 网络不通')
    console.log('    3. 远程有别人推的新提交 —— 先 git pull 再重跑这个脚本')
  }
}

main().catch(e => {
  console.log('')
  console.log('  ✗ 出错了：' + e.message)
  process.exit(1)
})
