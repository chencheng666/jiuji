import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {offlineEntry,offlineTelemetry,offlineHtml,offlinePrivacy,auditOfflineFiles} from '../scripts/offline-package.mjs';
test('离线发行移除统计开关和外链，网页原文件保持联网功能',()=>{
 const source=readFileSync(new URL('../dist/play.js',import.meta.url),'utf8');
 const converted=offlineEntry(source);
 assert.match(source,/consent-on/);assert.match(source,/https:\/\//);
 assert.doesNotMatch(converted,/consent-on|consent-off|https:\/\/|setInterval\(\(\)=>telemetry/);
 assert.match(converted,/导出存档/);assert.match(converted,/导入存档/);assert.match(converted,/data-do="start"/);
 assert.match(converted,/TapTap 离线单机版/);
 assert.deepEqual(auditOfflineFiles([{name:'play.js',text:converted}]),[]);
});
test('入口结构漂移时停止打包，不能静默遗留统计或外链',()=>{
 const source=readFileSync(new URL('../dist/play.js',import.meta.url),'utf8');
 assert.throws(()=>offlineEntry(source.replace('class="download-note"','class="new-links"')),/外链区域应命中/);
 assert.throws(()=>offlineEntry(source.replace('setInterval(()=>telemetry.flush(),15000);','setInterval(()=>telemetry.flush(),30000);')),/统计定时器应命中/);
});
test('离线统计适配不读取存储、不创建匿名会话、不发送请求',async()=>{
 const module=await import('data:text/javascript,'+encodeURIComponent(offlineTelemetry));
 const telemetry=module.browserTelemetry();telemetry.setConsent(true);telemetry.update({},true,true);
 assert.equal(telemetry.consent,false);assert.equal(await telemetry.flush(),false);
 assert.doesNotMatch(offlineTelemetry,/localStorage|fetch|session|uuid|token/);
});
test('离线入口包含网络阻断策略，隐私说明与发行内容一致',()=>{
 const html=offlineHtml(readFileSync(new URL('../dist/index.html',import.meta.url),'utf8'));
 assert.match(html,/connect-src 'none'/);assert.match(html,/<script src="\.\/game.js"><\/script>/);
 assert.doesNotMatch(html,/modulepreload|type="module"/);
 assert.match(offlinePrivacy,/不采集或上传个人信息/);
 assert.deepEqual(auditOfflineFiles([{name:'index.html',text:html},{name:'privacy.html',text:offlinePrivacy}]),[]);
});
test('实际发行文件检查能拦截休眠请求、相对请求、外链和远程图像',()=>{
 for(const text of ['if(false)fetch("/api")','new XMLHttpRequest()','navigator.sendBeacon("/collect",data)','new WebSocket("wss://server")','<a href="https://example.com">官网</a>','body{background:url(//example.com/a.png)}','<svg xmlns="http://www.w3.org/2000/svg"><image href="https://example.com/x.png"/></svg>']){
  assert.ok(auditOfflineFiles([{name:'game.js',text}]).length>0,text);
 }
 assert.deepEqual(auditOfflineFiles([{name:'icon.svg',text:'<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>'}]),[]);
});
