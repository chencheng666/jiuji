// 兼容手机内置浏览器；失败时保留重试入口，不清理玩家存档。
(function () {
  if (!Object.hasOwn) Object.defineProperty(Object, 'hasOwn', {value: function (object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
  }, configurable: true, writable: true});
  if (!Array.prototype.at) Object.defineProperty(Array.prototype, 'at', {value: function (index) {
    index = Math.trunc(Number(index) || 0);
    return this[index < 0 ? this.length + index : index];
  }, configurable: true, writable: true});

  var boot = document.querySelector('#boot'), ready = false, frame = 0, lastHeight = 0, lastWidth = 0, lastRatio = 0;
  function syncViewport() {
    frame = 0;
    var viewport = window.visualViewport;
    // 放大阅读时不缩小游戏，只跟随横竖屏切换和宿主可用区域变化。
    var height = viewport && viewport.scale === 1 ? viewport.height : window.innerHeight;
    var rounded = Math.round(height), width = window.innerWidth || 0, ratio = window.devicePixelRatio || 1;
    if (!(height > 0) || rounded === lastHeight && width === lastWidth && ratio === lastRatio) return;
    lastHeight = rounded; lastWidth = width; lastRatio = ratio;
    document.documentElement.style.setProperty('--game-height', rounded + 'px');
    window.dispatchEvent(new Event('jiuji:viewport'));
  }
  function resize() { if (!frame) frame = requestAnimationFrame(syncViewport); }
  syncViewport();
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);

  function failed() {
    if (!boot) return;
    boot.hidden = false;
    boot.querySelector('p').textContent = ready ? '游戏暂时暂停，请重新加载继续。' : '游戏暂时没能启动，请重新加载重试。';
    boot.querySelector('small').textContent = '重新加载不会清除存档。若仍无法进入，请反馈设备型号与系统版本。';
  }
  window.addEventListener('error', function (event) {
    if (event.error || event.target && event.target.tagName === 'SCRIPT') failed();
  }, true);
  window.addEventListener('unhandledrejection', failed);
  var timeout = setTimeout(function () {
    if (!ready && boot) boot.querySelector('small').textContent = '加载时间较长，可以点重新加载重试。存档不会被清除。';
  }, 20000);
  window.addEventListener('jiuji:ready', function () {
    ready = true;
    clearTimeout(timeout);
    if (boot) boot.hidden = true;
  }, {once: true});
  document.querySelector('#reload-game').addEventListener('click', function () { location.reload(); });
}());
