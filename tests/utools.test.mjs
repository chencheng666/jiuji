import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const launcher = await readFile(new URL('../packaging/utools/launcher.js', import.meta.url), 'utf8');
function environment(api) {
  const elements = new Map();
  for (const id of ['status','launch','online','website','github','privacy']) elements.set('#'+id, {textContent:'', disabled:false, handlers:{}, addEventListener(type, fn){this.handlers[type]=fn;}});
  vm.runInNewContext(launcher, {window:{utools:api}, document:{querySelector:id=>elements.get(id)}});
  return {elements, click:id=>elements.get('#'+id).handlers.click()};
}

test('uTools 游戏窗口复用、最小化恢复和关闭后重开，不扩展 Node 权限', () => {
  const calls = []; let restored=0,shown=0,focused=0,closed=false;
  const game = {isDestroyed:()=>closed,isMinimized:()=>true,restore:()=>restored++,show:()=>shown++,focus:()=>focused++};
  const api = {createBrowserWindow:(file,options)=>{calls.push({file,options}); return game;},onPluginEnter:fn=>fn(),setExpandHeight:height=>assert.equal(height,540)};
  const {click} = environment(api);
  click('launch'); click('launch');
  assert.equal(calls.length,1); assert.equal(restored,1); assert.equal(shown,2); assert.equal(focused,2);
  assert.equal(calls[0].file,'game.html');
  assert.deepEqual(JSON.parse(JSON.stringify(calls[0].options.webPreferences)),{nodeIntegration:false,contextIsolation:true,webSecurity:true});
  closed=true; click('launch'); assert.equal(calls.length,2);
});

test('uTools 打开失败可重试；浏览器预览说明清楚', () => {
  const {click,elements} = environment({createBrowserWindow:()=>{throw Error('窗口不可用');}});
  click('launch'); assert.match(elements.get('#status').textContent,/未能打开/); assert.equal(elements.get('#launch').disabled,false);
  click('launch'); assert.equal(elements.get('#launch').disabled,false);
  const preview=environment(undefined); preview.click('launch'); assert.match(preview.elements.get('#status').textContent,/入口预览/);
});

test('在线试玩和源码仅通过主动点击打开固定地址', async () => {
  const opened=[]; const {click}=environment({shellOpenExternal:async url=>opened.push(url)});
  assert.equal(opened.length,0);
  await click('online'); await click('github'); await click('website');
  assert.deepEqual(opened,['https://www.daguojueqi.site/jiuji/?from=utools','https://github.com/chencheng666/jiuji','https://www.daguojueqi.site/jiuji/official/']);
});
