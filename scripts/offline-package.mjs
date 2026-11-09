// 离线发行包直接排除联网实现；关闭开关不能代替移除联网代码。
export const offlineTelemetry = `export function browserTelemetry(){return {consent:false,enabledHost:false,update(){},setConsent(){},flush(){return false;}};}`;
export const offlinePolicy = "default-src 'self' data: blob:; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'; worker-src 'none'";
function replaceOnce(code, pattern, replacement, description) {
 const matches = code.match(new RegExp(pattern.source, 'g')) || [];
 if (matches.length !== 1) throw Error(`${description}应命中一处，实际 ${matches.length} 处；停止打包，请复核入口变化`);
 return code.replace(pattern, replacement);
}
export function offlineEntry(source) {
 let code = replaceOnce(source, /匿名玩法统计默认关闭，可在菜单随时选择。/, 'TapTap 离线单机版，进度仅保存在当前设备。', '首屏隐私说明');
 code = replaceOnce(code, / if\(panel==='privacy'\)[^\n]*/, ` if(panel==='privacy')html=dialog('本地进度与隐私','TAPTAP 离线单机版','<p class="subtle">本发行包没有联网统计、外链、账号、广告或在线服务。不采集或上传存档、设备信息及游玩时长。进度仅保存在当前设备，导入备份也只在本机处理。更新或清理数据前，请先从暂停菜单导出存档。</p><p>联系开发者：公众号「数字机器莱西奥」。</p><button class="primary" data-do="close">返回旅程</button>');`, '隐私面板');
 code = replaceOnce(code, /<p class="download-note">[^\n]*?<\/p>/, '<p class="download-note">TapTap 离线单机版 · 无需账号与联网服务。更新前建议导出本地存档。</p>', '外链区域');
 code = replaceOnce(code, /setInterval\(\(\)=>telemetry\.flush\(\),15000\);/, '', '统计定时器');
 code = replaceOnce(code, / if\(action==='consent-on'\|\|action==='consent-off'\)\{[^\n]*?\}if\(action==='privacy'\)/, " if(action==='privacy')", '统计开关');
 return code.replaceAll('隐私与统计', '离线隐私说明');
}
export function offlineHtml(source) {
 let html = source.replace(/<link\b[^>]+rel="modulepreload"[^>]*>/g, '');
 html = replaceOnce(html, /<script type="module" src="\.\/play\.js"><\/script>/, '<script src="./game.js"></script>', '脚本入口');
 html = replaceOnce(html, /<head>/, `<head><meta http-equiv="Content-Security-Policy" content="${offlinePolicy}">`, '离线内容策略');
 if (/type="module"|modulepreload/.test(html)) throw Error('离线包仍依赖模块加载');
 return html;
}
export const offlinePrivacy = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${offlinePolicy}"><title>九级 · 离线版隐私说明</title><style>body{max-width:760px;margin:40px auto;padding:24px;background:#20362f;color:#e4e1c9;font:16px/1.9 system-ui}a{color:#b9d8cd}h1,h2{color:#ead29e}</style></head><body><h1>《九级》TapTap 离线版隐私说明</h1><p>开发者：陈成。本游戏包为离线单机发行版本，无账号、内购、广告、网络统计或在线生成服务。</p><h2>本地进度</h2><p>营地、背包、科技、地图和设置保存在当前设备，不上传服务器。存档导入和导出只在本机处理。卸载应用或清除浏览器数据可能丢失进度，请提前导出备份。</p><h2>数据与权限</h2><p>本游戏包不采集或上传个人信息，不请求摄像头、麦克风、定位、通讯录权限，不包含外部网页跳转。宿主平台自己的账号及服务由平台的隐私说明约束。</p><h2>联系开发者</h2><p>公众号：数字机器莱西奥。反馈时请勿发送包含个人敏感信息的存档。</p><p><a href="./index.html">返回游戏</a></p></body></html>`;
// 检查实际交付文件；SVG 命名空间是格式标识，不是网络资源。
export function auditOfflineFiles(files) {
 const findings = [];
 const api = /\b(?:fetch|XMLHttpRequest|WebSocket|WebTransport|sendBeacon|EventSource|RTCPeerConnection|importScripts|serviceWorker)\b/g;
 const remote = /(?:https?:|wss?:)?\/\/[^\s"'<>`\\)]+/g;
 for (const {name, text} of files) {
  if (!/\.(?:js|html|css|svg)$/i.test(name)) continue;
  const cleaned = text.replace(/xmlns(?::\w+)?\s*=\s*(["'])http:\/\/www\.w3\.org\/(?:2000\/svg|1999\/xlink)\1/g, '');
  for (const value of new Set(cleaned.match(api) || [])) findings.push({file:name, rule:'联网接口', value});
  for (const value of new Set(cleaned.match(remote) || [])) findings.push({file:name, rule:'外部地址', value});
  if (/<(?:iframe|form)\b|\bwindow\.open\s*\(/i.test(cleaned)) findings.push({file:name, rule:'外部导航能力'});
 }
 return findings;
}
