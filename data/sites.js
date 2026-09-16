/* ==========================================================================
   网站导航

   左侧边栏「网站导航」那一页的内容：按分类收着的一堆外部网站，
   点一下就跳过去。和「文章」不是一回事 —— 那边是你自己写的，
   这边是你常去的别人的站。

   改这里有两个办法：
     · 直接编辑这个文件（就是下面这个 SITES 数组），改完重新部署；
     · 打开开发者模式（顶栏方块长按 3 秒 → 点齿轮），在页面上直接加分类、
       加网站、改、删 —— 那种改法只存在你自己这台电脑的浏览器里。
        见 app/util.js 顶上那段说明。

   ---- 每条的结构 ----
     key    分类的英文短名，当主键用，别和别的分类重（改了等于删了重加）
     name   分类名，页面上那个大标题
     icon   图标名，写 icons/ 文件夹里某个文件的名字（不带后缀）。
            ⚠️ 只能用**已经打包进去**的图标 —— 加新图标要双击「更新图标.bat」
               重新打包一次。开发者模式里那个下拉框列的就是能用的全部。
     desc   分类下面那行小字，可以不写
     links  这个分类里的网站。每条：
              name  网站上显示的名字
              url   点过去跳的地址，写全 https:// 开头
              desc  一句话说明，可以不写

   —— 只想留几个分类就删掉几段；一条都没有的话，那页会显示一个空状态。
   ========================================================================== */
const SITES = [
  {
    key: 'dev',
    name: '开发资源',
    icon: 'tech',
    desc: '写代码天天要开的那些',
    links: [
      { name: 'GitHub',        url: 'https://github.com',                        desc: '代码托管，我的东西也在这儿' },
      { name: 'MDN',           url: 'https://developer.mozilla.org/zh-CN/',      desc: 'Web 文档，查 API 最快的一处' },
      { name: 'Can I use',     url: 'https://caniuse.com',                       desc: '这个 CSS 到底能不能用' },
      { name: 'Stack Overflow',url: 'https://stackoverflow.com',                 desc: '你遇到的问题，大概率有人问过' }
    ]
  },
  {
    key: 'tool',
    name: '在线工具',
    icon: 'bolt',
    desc: '开个网页就能用，不用装东西',
    links: [
      { name: 'CodePen',    url: 'https://codepen.io',        desc: '写个 demo 试试效果' },
      { name: 'TinyPNG',    url: 'https://tinypng.com',       desc: '压图，放博客里能小一半' },
      { name: 'Carbon',     url: 'https://carbon.now.sh',     desc: '把代码截成好看的图' },
      { name: 'Squoosh',    url: 'https://squoosh.app',       desc: 'Google 的图片压缩，能转 WebP' }
    ]
  },
  {
    key: 'learn',
    name: '学习去处',
    icon: 'notes',
    desc: '慢慢看的那种',
    links: [
      { name: '阮一峰的网络日志', url: 'https://www.ruanyifeng.com/blog/', desc: '每周分享值得一读' },
      { name: 'MDN 学习区',       url: 'https://developer.mozilla.org/zh-CN/docs/Learn', desc: '从零开始的 Web 教程' },
      { name: '菜鸟教程',         url: 'https://www.runoob.com',           desc: '查语法用，快' }
    ]
  },
  {
    key: 'fun',
    name: '摸鱼专区',
    icon: 'life',
    desc: '写不出来的时候',
    links: [
      { name: 'Bilibili', url: 'https://www.bilibili.com', desc: '就…看一下' },
      { name: '知乎',     url: 'https://www.zhihu.com',    desc: '看别人怎么答' }
    ]
  }
]
