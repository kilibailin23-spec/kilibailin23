/* ==========================================================================
   下载文件

   指向 files/ 文件夹里你放的东西。

   这个文件是从原来的单文件 index.html 里拆出来的，内容没动过。
   ========================================================================== */

/* ==========================================================================
   ⑤ 下载文件
   ⚠️ 这个数组由 tools/build-files.js 自动生成，不用手改数组本身 ——
   把文件丢进 files/ 文件夹，双击根目录的「更新下载列表.bat」就行。

   手写只在这两种时候用得上：要挂网盘外链，或者想给某个文件起个跟
   文件名不一样的显示名。脚本认路径，认出来的条目会保住你写的 name
   和 desc，只重算 size；file 直接写 https://… 的外链条目它完全不碰。
   但数组里面别写注释，每次重新生成会被冲掉（上面这段是安全的）。

   file 字段写相对路径，把文件放进同级的 files/ 文件夹里。

   分文件夹：把文件丢进 files/ 的**子文件夹**里，路径写成
   './files/子文件夹名/文件名'，下载页会自动按它分层 —— 第一层列出所有
   文件夹，点进去才看到里面的文件，标题右边显示「文件下载 / 子文件夹名」。

   也可以另写一个 folder 字段显式指定；留空的话就从 file 路径里读，
   所以多数时候不用写。（只有 file 直接写网盘外链、没有路径可推时才需要）
   ========================================================================== */
const FILES = [
  {
    name: '布丁提姆鱼.zip',
    file: './files/布丁提姆鱼.zip',
    size: '39.1 MB',
    time: '2026-08-13 00:53',
    desc: ''
  },
  {
    name: '艾尔登法环 黑夜君临.zip',
    file: './files/芝士大米/艾尔登法环 黑夜君临.zip',
    size: '932 KB',
    time: '2026-07-30 23:04',
    desc: ''
  },
  {
    name: '艾尔登法环.zip',
    file: './files/芝士大米/艾尔登法环.zip',
    size: '2.4 MB',
    time: '2026-07-30 23:19',
    desc: ''
  },
  {
    name: '暗黑地牢2.zip',
    file: './files/芝士大米/暗黑地牢2.zip',
    size: '724 KB',
    time: '2026-08-18 16:09',
    desc: ''
  },
  {
    name: '孢子.zip',
    file: './files/芝士大米/孢子.zip',
    size: '213 KB',
    time: '2026-08-11 00:29',
    desc: ''
  },
  {
    name: '博德之门3.zip',
    file: './files/芝士大米/博德之门3.zip',
    size: '25.0 MB',
    time: '2026-07-30 23:14',
    desc: ''
  },
  {
    name: '仓鼠球.zip',
    file: './files/芝士大米/仓鼠球.zip',
    size: '32 KB',
    time: '2026-08-28 00:45',
    desc: ''
  },
  {
    name: '茶杯头.zip',
    file: './files/芝士大米/茶杯头.zip',
    size: '481 KB',
    time: '2026-08-03 20:49',
    desc: ''
  },
  {
    name: '超级兔子人.zip',
    file: './files/芝士大米/超级兔子人.zip',
    size: '217 KB',
    time: '2026-08-03 20:43',
    desc: ''
  },
  {
    name: '超英派遣中心.zip',
    file: './files/芝士大米/超英派遣中心.zip',
    size: '455 KB',
    time: '2026-08-11 00:24',
    desc: ''
  },
  {
    name: '城市天际线2.zip',
    file: './files/芝士大米/城市天际线2.zip',
    size: '3.4 MB',
    time: '2026-08-05 22:26',
    desc: ''
  },
  {
    name: '冲就完事模拟器.zip',
    file: './files/芝士大米/冲就完事模拟器.zip',
    size: '399 KB',
    time: '2026-08-03 20:58',
    desc: ''
  },
  {
    name: '刺客信条 奥德赛.zip',
    file: './files/芝士大米/刺客信条 奥德赛.zip',
    size: '4.1 MB',
    time: '2026-08-26 22:19',
    desc: ''
  },
  {
    name: '刺客信条 大革命.zip',
    file: './files/芝士大米/刺客信条 大革命.zip',
    size: '1.9 MB',
    time: '2026-08-26 22:21',
    desc: ''
  },
  {
    name: '刺客信条 黑旗.zip',
    file: './files/芝士大米/刺客信条 黑旗.zip',
    size: '2.3 MB',
    time: '2026-08-26 22:23',
    desc: ''
  },
  {
    name: '刺客信条 幻景.zip',
    file: './files/芝士大米/刺客信条 幻景.zip',
    size: '2.1 MB',
    time: '2026-08-26 22:21',
    desc: ''
  },
  {
    name: '刺客信条 解放.zip',
    file: './files/芝士大米/刺客信条 解放.zip',
    size: '2.3 MB',
    time: '2026-08-26 22:22',
    desc: ''
  },
  {
    name: '刺客信条 起源.zip',
    file: './files/芝士大米/刺客信条 起源.zip',
    size: '2.5 MB',
    time: '2026-08-26 22:19',
    desc: ''
  },
  {
    name: '刺客信条 枭雄.zip',
    file: './files/芝士大米/刺客信条 枭雄.zip',
    size: '130 KB',
    time: '2026-08-26 22:22',
    desc: ''
  },
  {
    name: '刺客信条 英灵殿.zip',
    file: './files/芝士大米/刺客信条 英灵殿.zip',
    size: '5.4 MB',
    time: '2026-08-26 22:20',
    desc: ''
  },
  {
    name: '刺客信条1.zip',
    file: './files/芝士大米/刺客信条1.zip',
    size: '256 KB',
    time: '2026-08-26 22:19',
    desc: ''
  },
  {
    name: '刺客信条2.zip',
    file: './files/芝士大米/刺客信条2.zip',
    size: '580 KB',
    time: '2026-08-26 22:19',
    desc: ''
  },
  {
    name: '刺客信条3.zip',
    file: './files/芝士大米/刺客信条3.zip',
    size: '1.2 MB',
    time: '2026-08-26 22:19',
    desc: ''
  },
  {
    name: '大鹅模拟器.zip',
    file: './files/芝士大米/大鹅模拟器.zip',
    size: '19 KB',
    time: '2026-08-03 20:46',
    desc: ''
  },
  {
    name: '弹球.zip',
    file: './files/芝士大米/弹球.zip',
    size: '4.5 KB',
    time: '2026-08-28 00:46',
    desc: ''
  },
  {
    name: '地平线4.zip',
    file: './files/芝士大米/地平线4.zip',
    size: '3.3 MB',
    time: '2026-07-23 13:39',
    desc: ''
  },
  {
    name: '地平线5.zip',
    file: './files/芝士大米/地平线5.zip',
    size: '7.3 MB',
    time: '2026-07-23 13:39',
    desc: ''
  },
  {
    name: '地平线6.zip',
    file: './files/芝士大米/地平线6.zip',
    size: '6.2 MB',
    time: '2026-07-23 13:31',
    desc: ''
  },
  {
    name: '点下这个按钮.zip',
    file: './files/芝士大米/点下这个按钮.zip',
    size: '6.2 KB',
    time: '2026-08-28 00:58',
    desc: ''
  },
  {
    name: '东方夜雀食堂.zip',
    file: './files/芝士大米/东方夜雀食堂.zip',
    size: '1.7 MB',
    time: '2026-08-13 21:04',
    desc: ''
  },
  {
    name: '堆叠大陆.zip',
    file: './files/芝士大米/堆叠大陆.zip',
    size: '76 KB',
    time: '2026-07-12 16:53',
    desc: ''
  },
  {
    name: '恶魔弹球.zip',
    file: './files/芝士大米/恶魔弹球.zip',
    size: '48 KB',
    time: '2026-08-28 00:48',
    desc: ''
  },
  {
    name: '房产达人2.zip',
    file: './files/芝士大米/房产达人2.zip',
    size: '1.5 MB',
    time: '2026-08-05 22:27',
    desc: ''
  },
  {
    name: '疯狂的鹿.zip',
    file: './files/芝士大米/疯狂的鹿.zip',
    size: '43 KB',
    time: '2026-08-03 20:45',
    desc: ''
  },
  {
    name: '疯狂农场4.zip',
    file: './files/芝士大米/疯狂农场4.zip',
    size: '2.8 MB',
    time: '2026-08-13 21:08',
    desc: ''
  },
  {
    name: '刮刮乐.zip',
    file: './files/芝士大米/刮刮乐.zip',
    size: '45 KB',
    time: '2026-08-28 00:58',
    desc: ''
  },
  {
    name: '光与影33号远征队.zip',
    file: './files/芝士大米/光与影33号远征队.zip',
    size: '1.5 MB',
    time: '2026-07-30 23:19',
    desc: ''
  },
  {
    name: '鬼谷八荒.zip',
    file: './files/芝士大米/鬼谷八荒.zip',
    size: '1.9 MB',
    time: '2026-08-11 00:26',
    desc: ''
  },
  {
    name: '哈迪斯.zip',
    file: './files/芝士大米/哈迪斯.zip',
    size: '1.3 MB',
    time: '2026-07-12 17:50',
    desc: ''
  },
  {
    name: '哈迪斯2.zip',
    file: './files/芝士大米/哈迪斯2.zip',
    size: '1.5 MB',
    time: '2026-07-12 17:50',
    desc: ''
  },
  {
    name: '合金装备△.zip',
    file: './files/芝士大米/合金装备△.zip',
    size: '287 KB',
    time: '2026-08-26 22:16',
    desc: ''
  },
  {
    name: '合金装备5 幻痛.zip',
    file: './files/芝士大米/合金装备5 幻痛.zip',
    size: '3.7 MB',
    time: '2026-08-26 22:16',
    desc: ''
  },
  {
    name: '合金装备5 奇点.zip',
    file: './files/芝士大米/合金装备5 奇点.zip',
    size: '1.9 MB',
    time: '2026-08-26 22:16',
    desc: ''
  },
  {
    name: '红色沙漠.zip',
    file: './files/芝士大米/红色沙漠.zip',
    size: '9.3 MB',
    time: '2026-07-17 13:17',
    desc: ''
  },
  {
    name: '滑滑史莱姆.zip',
    file: './files/芝士大米/滑滑史莱姆.zip',
    size: '149 KB',
    time: '2026-08-28 00:27',
    desc: ''
  },
  {
    name: '霍格沃兹之遗.zip',
    file: './files/芝士大米/霍格沃兹之遗.zip',
    size: '3.0 MB',
    time: '2026-08-10 23:45',
    desc: ''
  },
  {
    name: '机械狂欢.zip',
    file: './files/芝士大米/机械狂欢.zip',
    size: '52 KB',
    time: '2026-08-05 23:21',
    desc: ''
  },
  {
    name: '极限国度.zip',
    file: './files/芝士大米/极限国度.zip',
    size: '1.0 MB',
    time: '2026-08-28 00:41',
    desc: ''
  },
  {
    name: '几何冲刺.zip',
    file: './files/芝士大米/几何冲刺.zip',
    size: '1.1 MB',
    time: '2026-09-11 15:50',
    desc: ''
  },
  {
    name: '剑星.zip',
    file: './files/芝士大米/剑星.zip',
    size: '2.0 MB',
    time: '2026-08-05 22:59',
    desc: ''
  },
  {
    name: '僵尸世界大战.zip',
    file: './files/芝士大米/僵尸世界大战.zip',
    size: '2.5 MB',
    time: '2026-06-14 21:45',
    desc: ''
  },
  {
    name: '街霸6.zip',
    file: './files/芝士大米/街霸6.zip',
    size: '3.4 MB',
    time: '2026-09-04 18:12',
    desc: ''
  },
  {
    name: '老虎机.zip',
    file: './files/芝士大米/老虎机.zip',
    size: '30 KB',
    time: '2026-08-28 00:59',
    desc: ''
  },
  {
    name: '轮回之兽.zip',
    file: './files/芝士大米/轮回之兽.zip',
    size: '1.1 MB',
    time: '2026-08-18 17:16',
    desc: ''
  },
  {
    name: '毛线小精灵.zip',
    file: './files/芝士大米/毛线小精灵.zip',
    size: '125 KB',
    time: '2026-08-03 20:42',
    desc: ''
  },
  {
    name: '毛线小精灵2.zip',
    file: './files/芝士大米/毛线小精灵2.zip',
    size: '269 KB',
    time: '2026-08-03 20:42',
    desc: ''
  },
  {
    name: '梅尔沃放置.zip',
    file: './files/芝士大米/梅尔沃放置.zip',
    size: '1.3 MB',
    time: '2026-08-28 00:36',
    desc: ''
  },
  {
    name: '咩咩启示录.zip',
    file: './files/芝士大米/咩咩启示录.zip',
    size: '884 KB',
    time: '2026-08-11 00:08',
    desc: ''
  },
  {
    name: '魔斧小女巫.zip',
    file: './files/芝士大米/魔斧小女巫.zip',
    size: '11 KB',
    time: '2026-08-28 00:33',
    desc: ''
  },
  {
    name: '脑叶公司.zip',
    file: './files/芝士大米/脑叶公司.zip',
    size: '367 KB',
    time: '2026-08-11 00:28',
    desc: ''
  },
  {
    name: '女神异闻录3.zip',
    file: './files/芝士大米/女神异闻录3.zip',
    size: '709 KB',
    time: '2026-07-30 23:07',
    desc: ''
  },
  {
    name: '女神异闻录4.zip',
    file: './files/芝士大米/女神异闻录4.zip',
    size: '366 KB',
    time: '2026-07-30 23:07',
    desc: ''
  },
  {
    name: '女神异闻录5.zip',
    file: './files/芝士大米/女神异闻录5.zip',
    size: '1.5 MB',
    time: '2026-07-30 23:07',
    desc: ''
  },
  {
    name: '平衡球.zip',
    file: './files/芝士大米/平衡球.zip',
    size: '48 KB',
    time: '2026-08-28 00:44',
    desc: ''
  },
  {
    name: '歧路旅人.zip',
    file: './files/芝士大米/歧路旅人.zip',
    size: '156 KB',
    time: '2026-07-30 23:02',
    desc: ''
  },
  {
    name: '歧路旅人0.zip',
    file: './files/芝士大米/歧路旅人0.zip',
    size: '256 KB',
    time: '2026-07-30 23:02',
    desc: ''
  },
  {
    name: '歧路旅人2.zip',
    file: './files/芝士大米/歧路旅人2.zip',
    size: '285 KB',
    time: '2026-07-30 23:02',
    desc: ''
  },
  {
    name: '潜水员戴夫.zip',
    file: './files/芝士大米/潜水员戴夫.zip',
    size: '1.2 MB',
    time: '2026-07-01 19:14',
    desc: ''
  },
  {
    name: '仁王3.zip',
    file: './files/芝士大米/仁王3.zip',
    size: '4.2 MB',
    time: '2026-08-10 23:40',
    desc: ''
  },
  {
    name: '忍者龙剑传4.zip',
    file: './files/芝士大米/忍者龙剑传4.zip',
    size: '2.2 MB',
    time: '2026-08-07 18:09',
    desc: ''
  },
  {
    name: '赛博朋克2077.zip',
    file: './files/芝士大米/赛博朋克2077.zip',
    size: '10.2 MB',
    time: '2026-07-30 23:12',
    desc: ''
  },
  {
    name: '三国无双9.zip',
    file: './files/芝士大米/三国无双9.zip',
    size: '3.0 MB',
    time: '2026-08-10 23:43',
    desc: ''
  },
  {
    name: '三国无双起源.zip',
    file: './files/芝士大米/三国无双起源.zip',
    size: '1.9 MB',
    time: '2026-08-10 23:43',
    desc: ''
  },
  {
    name: '山羊模拟器.zip',
    file: './files/芝士大米/山羊模拟器.zip',
    size: '512 KB',
    time: '2026-08-03 20:46',
    desc: ''
  },
  {
    name: '深渊之潮.zip',
    file: './files/芝士大米/深渊之潮.zip',
    size: '213 KB',
    time: '2026-08-07 18:02',
    desc: ''
  },
  {
    name: '神秘水世界2.zip',
    file: './files/芝士大米/神秘水世界2.zip',
    size: '527 KB',
    time: '2026-08-27 05:48',
    desc: ''
  },
  {
    name: '生化危机2.zip',
    file: './files/芝士大米/生化危机2.zip',
    size: '1.7 MB',
    time: '2026-07-30 23:09',
    desc: ''
  },
  {
    name: '生化危机3.zip',
    file: './files/芝士大米/生化危机3.zip',
    size: '875 KB',
    time: '2026-08-18 16:32',
    desc: ''
  },
  {
    name: '生化危机4.zip',
    file: './files/芝士大米/生化危机4.zip',
    size: '2.3 MB',
    time: '2026-07-30 23:09',
    desc: ''
  },
  {
    name: '生化危机5.zip',
    file: './files/芝士大米/生化危机5.zip',
    size: '1.1 MB',
    time: '2026-07-30 23:09',
    desc: ''
  },
  {
    name: '生化危机6.zip',
    file: './files/芝士大米/生化危机6.zip',
    size: '8.4 MB',
    time: '2026-07-30 23:10',
    desc: ''
  },
  {
    name: '生化危机7.zip',
    file: './files/芝士大米/生化危机7.zip',
    size: '4.8 MB',
    time: '2026-07-30 23:10',
    desc: ''
  },
  {
    name: '生化危机9.zip',
    file: './files/芝士大米/生化危机9.zip',
    size: '2.5 MB',
    time: '2026-08-18 16:32',
    desc: ''
  },
  {
    name: '生化危机村庄.zip',
    file: './files/芝士大米/生化危机村庄.zip',
    size: '1.3 MB',
    time: '2026-08-18 16:32',
    desc: ''
  },
  {
    name: '生或死6.zip',
    file: './files/芝士大米/生或死6.zip',
    size: '1.9 MB',
    time: '2026-08-10 23:41',
    desc: ''
  },
  {
    name: '丝之歌.zip',
    file: './files/芝士大米/丝之歌.zip',
    size: '1.3 MB',
    time: '2026-07-12 17:45',
    desc: ''
  },
  {
    name: '死亡搁浅.zip',
    file: './files/芝士大米/死亡搁浅.zip',
    size: '2.0 MB',
    time: '2026-08-26 22:24',
    desc: ''
  },
  {
    name: '死亡搁浅2.zip',
    file: './files/芝士大米/死亡搁浅2.zip',
    size: '4.2 MB',
    time: '2026-08-26 22:24',
    desc: ''
  },
  {
    name: '死亡细胞.zip',
    file: './files/芝士大米/死亡细胞.zip',
    size: '233 KB',
    time: '2026-07-30 23:20',
    desc: ''
  },
  {
    name: '苏丹的游戏.zip',
    file: './files/芝士大米/苏丹的游戏.zip',
    size: '1.0 MB',
    time: '2026-08-03 20:51',
    desc: ''
  },
  {
    name: '所有都是蟹.zip',
    file: './files/芝士大米/所有都是蟹.zip',
    size: '44 KB',
    time: '2026-08-05 22:22',
    desc: ''
  },
  {
    name: '逃出生天.zip',
    file: './files/芝士大米/逃出生天.zip',
    size: '739 KB',
    time: '2026-08-03 20:43',
    desc: ''
  },
  {
    name: '逃脱监狱.zip',
    file: './files/芝士大米/逃脱监狱.zip',
    size: '502 KB',
    time: '2026-08-28 00:38',
    desc: ''
  },
  {
    name: '伪人模拟器.zip',
    file: './files/芝士大米/伪人模拟器.zip',
    size: '59 KB',
    time: '2026-08-13 21:02',
    desc: ''
  },
  {
    name: '瘟疫公司.zip',
    file: './files/芝士大米/瘟疫公司.zip',
    size: '84 KB',
    time: '2026-08-27 05:50',
    desc: ''
  },
  {
    name: '文明六.zip',
    file: './files/芝士大米/文明六.zip',
    size: '13.8 MB',
    time: '2026-06-14 21:37',
    desc: ''
  },
  {
    name: '文字游戏.zip',
    file: './files/芝士大米/文字游戏.zip',
    size: '211 KB',
    time: '2026-08-28 00:29',
    desc: ''
  },
  {
    name: '吸吸吸有限公司.zip',
    file: './files/芝士大米/吸吸吸有限公司.zip',
    size: '106 KB',
    time: '2026-08-28 00:30',
    desc: ''
  },
  {
    name: '消光.zip',
    file: './files/芝士大米/消光.zip',
    size: '6.6 MB',
    time: '2026-08-26 22:28',
    desc: ''
  },
  {
    name: '消光2.zip',
    file: './files/芝士大米/消光2.zip',
    size: '4.2 MB',
    time: '2026-08-27 05:31',
    desc: ''
  },
  {
    name: '小丑牌.zip',
    file: './files/芝士大米/小丑牌.zip',
    size: '22 KB',
    time: '2026-08-28 00:49',
    desc: ''
  },
  {
    name: '小偷模拟器2.zip',
    file: './files/芝士大米/小偷模拟器2.zip',
    size: '506 KB',
    time: '2026-08-05 23:04',
    desc: ''
  },
  {
    name: '小小梦魇.zip',
    file: './files/芝士大米/小小梦魇.zip',
    size: '357 KB',
    time: '2026-08-03 21:05',
    desc: ''
  },
  {
    name: '小小梦魇2.zip',
    file: './files/芝士大米/小小梦魇2.zip',
    size: '743 KB',
    time: '2026-08-03 21:05',
    desc: ''
  },
  {
    name: '小小梦魇3.zip',
    file: './files/芝士大米/小小梦魇3.zip',
    size: '679 KB',
    time: '2026-08-03 21:05',
    desc: ''
  },
  {
    name: '凶案清洁员.zip',
    file: './files/芝士大米/凶案清洁员.zip',
    size: '2.0 MB',
    time: '2026-08-03 20:56',
    desc: ''
  },
  {
    name: '野餐大冒险.zip',
    file: './files/芝士大米/野餐大冒险.zip',
    size: '124 KB',
    time: '2026-08-03 20:47',
    desc: ''
  },
  {
    name: '以撒.zip',
    file: './files/芝士大米/以撒.zip',
    size: '594 KB',
    time: '2026-07-01 19:16',
    desc: ''
  },
  {
    name: '异星水域2.zip',
    file: './files/芝士大米/异星水域2.zip',
    size: '496 KB',
    time: '2026-08-10 23:49',
    desc: ''
  },
  {
    name: '幽灵行者.zip',
    file: './files/芝士大米/幽灵行者.zip',
    size: '1.2 MB',
    time: '2026-07-30 23:13',
    desc: ''
  },
  {
    name: '幽灵行者2.zip',
    file: './files/芝士大米/幽灵行者2.zip',
    size: '2.4 MB',
    time: '2026-07-30 23:13',
    desc: ''
  },
  {
    name: '鱼.zip',
    file: './files/芝士大米/鱼.zip',
    size: '401 KB',
    time: '2026-08-03 20:50',
    desc: ''
  },
  {
    name: '雨中冒险.zip',
    file: './files/芝士大米/雨中冒险.zip',
    size: '318 KB',
    time: '2026-06-14 21:44',
    desc: ''
  },
  {
    name: '原子之心.zip',
    file: './files/芝士大米/原子之心.zip',
    size: '5.5 MB',
    time: '2026-07-30 23:11',
    desc: ''
  },
  {
    name: '战车撞僵尸.zip',
    file: './files/芝士大米/战车撞僵尸.zip',
    size: '11 KB',
    time: '2026-08-11 00:19',
    desc: ''
  },
  {
    name: '战神3.zip',
    file: './files/芝士大米/战神3.zip',
    size: '6.6 MB',
    time: '2026-08-26 22:27',
    desc: ''
  },
  {
    name: '蜘蛛侠2.zip',
    file: './files/芝士大米/蜘蛛侠2.zip',
    size: '4.5 MB',
    time: '2026-07-30 23:21',
    desc: ''
  },
  {
    name: '蜘蛛侠迈尔斯.zip',
    file: './files/芝士大米/蜘蛛侠迈尔斯.zip',
    size: '2.0 MB',
    time: '2026-07-30 23:21',
    desc: ''
  },
  {
    name: '最终幻想7重生.zip',
    file: './files/芝士大米/最终幻想7重生.zip',
    size: '6.0 MB',
    time: '2026-08-10 23:46',
    desc: ''
  },
  {
    name: '最终幻想7重置版.zip',
    file: './files/芝士大米/最终幻想7重置版.zip',
    size: '3.1 MB',
    time: '2026-08-10 23:46',
    desc: ''
  },
  {
    name: '最终幻想XV.zip',
    file: './files/芝士大米/最终幻想XV.zip',
    size: '5.0 MB',
    time: '2026-08-10 23:47',
    desc: ''
  },
  {
    name: 'GTA5E.zip',
    file: './files/芝士大米/GTA5E.zip',
    size: '3.1 MB',
    time: '2026-08-07 16:59',
    desc: ''
  },
  {
    name: 'GTA5L.zip',
    file: './files/芝士大米/GTA5L.zip',
    size: '3.9 MB',
    time: '2026-08-07 16:59',
    desc: ''
  },
  {
    name: 'inzoi.zip',
    file: './files/芝士大米/inzoi.zip',
    size: '2.9 MB',
    time: '2026-08-18 17:05',
    desc: ''
  },
  {
    name: 'pico park.zip',
    file: './files/芝士大米/pico park.zip',
    size: '18 KB',
    time: '2026-08-27 05:50',
    desc: ''
  },
  {
    name: 'pico park2.zip',
    file: './files/芝士大米/pico park2.zip',
    size: '49 KB',
    time: '2026-08-27 05:50',
    desc: ''
  },
  {
    name: 'Pragmata.zip',
    file: './files/芝士大米/Pragmata.zip',
    size: '1.1 MB',
    time: '2026-08-27 05:49',
    desc: ''
  },
  {
    name: 'RAFT.zip',
    file: './files/芝士大米/RAFT.zip',
    size: '316 KB',
    time: '2026-08-11 00:23',
    desc: ''
  },
  {
    name: '机械狂潮补丁.zip',
    file: './files/link布丁/机械狂潮补丁.zip',
    size: '22.1 MB',
    time: '2026-08-07 18:31',
    desc: ''
  },
  {
    name: '深渊之潮补丁.zip',
    file: './files/link布丁/深渊之潮补丁.zip',
    size: '26.1 MB',
    time: '2026-08-07 18:36',
    desc: ''
  },
  {
    name: 'dotnet-runtime-9.0.9-win-x64.exe',
    file: './files/link布丁/dotnet-runtime-9.0.9-win-x64.exe',
    size: '28.5 MB',
    time: '2026-08-07 17:03',
    desc: ''
  }
]
