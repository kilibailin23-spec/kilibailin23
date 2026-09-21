/* 启动序列：按固定顺序点火，顺序有依赖（图标在 render 前、粒子在主题后） */
/* ---------- 启动 ---------- */
/* ⚠️ 下面几行有顺序依赖：图标要在 render 之前、粒子要在主题之后，别随手调换 */
bootIcons()
bootChrome()
bootSecret()
bootRail()
bootBackground()
bootTheme()
bootParticles()
bootClock()
bootSearch()
bootDelegates()
bootAvatarFlip()
bootDev()
window.addEventListener('hashchange', render)
render()
bootSplash()
