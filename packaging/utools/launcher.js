(() => {
  let gameWindow = null;
  let opening = false;
  const api = window.utools;
  const status = document.querySelector('#status');
  const launchButton = document.querySelector('#launch');
  const links = Object.freeze({ online: 'https://www.daguojueqi.site/jiuji/?from=utools', website: 'https://www.daguojueqi.site/', github: 'https://github.com/chencheng666/jiuji' });
  async function external(name) {
    if (!Object.hasOwn(links, name)) return;
    if (!api?.shellOpenExternal) { status.textContent = '请在 uTools 中使用在线试玩与源码入口。'; return; }
    try { await api.shellOpenExternal(links[name]); } catch { status.textContent = '系统浏览器未能打开，请稍后重试。'; }
  }
  function launch() {
    if (opening) return;
    if (!api?.createBrowserWindow) { status.textContent = '这是入口预览。在 uTools 开发者工具导入 plugin.json 后，可启动本地游戏。'; return; }
    try {
      if (gameWindow && !gameWindow.isDestroyed()) {
        if (gameWindow.isMinimized()) gameWindow.restore();
        gameWindow.show(); gameWindow.focus(); return;
      }
    } catch { gameWindow = null; }
    opening = true; launchButton.disabled = true; status.textContent = '正在展开本地荒野…';
    try {
      // 游戏窗口只运行本地前端，不开放 Node.js 或文件系统桥接。
      gameWindow = api.createBrowserWindow('game.html', {
        show: true, title: '饥荒升级版-九级 · 单人旅程', width: 1280, height: 850,
        minWidth: 800, minHeight: 620, backgroundColor: '#20362f',
        resizable: true, fullscreenable: true, autoHideMenuBar: true,
        webPreferences: { nodeIntegration: false, contextIsolation: true, webSecurity: true },
      });
      gameWindow.show(); gameWindow.focus();
      status.textContent = '荒野窗口已打开。再次点击可返回同一窗口；离开游戏前建议导出存档。';
    } catch {
      gameWindow = null;
      status.textContent = '游戏窗口未能打开，请检查 uTools Runtime 后重试。';
    } finally { opening = false; launchButton.disabled = false; }
  }
  launchButton.addEventListener('click', launch);
  for (const name of Object.keys(links)) document.querySelector('#' + name).addEventListener('click', () => external(name));
  document.querySelector('#privacy').addEventListener('click', () => {
    if (!api?.createBrowserWindow) { status.textContent = '目录中的 privacy.html 提供完整隐私说明。'; return; }
    api.createBrowserWindow('privacy.html', { width: 800, height: 720, title: '九级 · 隐私说明', webPreferences: { nodeIntegration: false, contextIsolation: true, webSecurity: true } });
  });
  // 入口退到后台时，保留仍在使用的独立游戏窗口。
  api?.onPluginEnter?.(() => api.setExpandHeight?.(540));
})();
