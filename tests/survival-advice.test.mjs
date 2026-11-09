import test from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../dist/survival.js';
import {survivalAdvice,seasonTrend,hungerWindow} from '../dist/survival-advice.js';
import {journeySettings} from '../dist/journey-ui.js';
import {recoveryPoints} from '../dist/storage.js';
test('饱食40提前软预警、20加强提示，查询不更改角色能力或世界状态',()=>{
 const s=G.createOdysseyGame();assert.equal(survivalAdvice(s).some(a=>a.id==='hunger'),false);s.player.hunger=40;const before=G.serialize(s),a=survivalAdvice(s).find(a=>a.id==='hunger');assert.equal(a.severity,1);assert.ok(a.food);assert.match(a.detail,/游戏日|持续奔跑/);assert.equal(G.serialize(s),before);s.player.hunger=20;assert.equal(survivalAdvice(s).find(a=>a.id==='hunger').severity,2);s.level=9;assert.equal(hungerWindow(s),null);assert.equal(survivalAdvice(s).some(a=>a.id==='hunger'),false);
});
test('无食物时只指向已探索的浆果丛，不暴露迷雾资源',()=>{
 const s=G.createOdysseyGame();s.player.hunger=30;s.inventory={};s.explored=[];assert.equal(survivalAdvice(s).find(a=>a.id==='hunger').node,null);const n=s.nodes.find(n=>n.type==='bush');s.explored=[Math.floor(n.x/160)+','+Math.floor(n.y/160)];const target=survivalAdvice(s).find(a=>a.id==='hunger').node;assert.ok(target);assert.equal(target.type,'bush');
});
test('季节仅最后一天提示趋势，四季边界、冬前降温与春季回暖正确',()=>{
 const s=G.createOdysseyGame();s.time=899;assert.equal(seasonTrend(s),null);s.time=900;assert.deepEqual([seasonTrend(s).next,seasonTrend(s).direction,seasonTrend(s).seconds],['长昼夏','升温',300]);s.time=3300;assert.equal(seasonTrend(s).next,'静雪冬');assert.equal(seasonTrend(s).direction,'降温');s.time=4799;assert.equal(seasonTrend(s).next,'新芽春');assert.equal(seasonTrend(s).seconds,1);s.time=4800;assert.equal(seasonTrend(s),null);
});
test('严寒预警在受寒前出现，保温措施改变建议；雨前与天黑前有准备提示',()=>{
 const s=G.createOdysseyGame();s.time=3600;s.living.temperature=20;const cold=survivalAdvice(s).find(a=>a.id==='cold');assert.ok(cold);assert.equal(cold.severity,1);s.buildings.push({type:'shelter',x:s.player.x,y:s.player.y});assert.equal(survivalAdvice(s).some(a=>a.id==='cold'),false);s.buildings=[];s.time=330;assert.ok(survivalAdvice(s).find(a=>a.id==='rain'));s.time=185;assert.ok(survivalAdvice(s).find(a=>a.id==='night'));s.time=235;assert.equal(survivalAdvice(s).find(a=>a.id==='dark').severity,2);
});
test('营火续航按昼夜和雨天估算，不把燃料刻度误当秒数',()=>{
 const s=G.createOdysseyGame();s.buildings.push({type:'campfire',x:s.player.x,y:s.player.y,fuel:28});s.time=50;assert.equal(survivalAdvice(s).some(a=>a.id==='fuel'),false);s.time=240;assert.match(survivalAdvice(s).find(a=>a.id==='fuel').detail,/28 秒/);s.time=360;assert.match(survivalAdvice(s).find(a=>a.id==='fuel').detail,/75 秒/);
});
test('首次开局细项默认收起、默认完整与探索模式，种子转义',()=>{
 const html=journeySettings({seed:'<script>"'});assert.match(html,/<details class="journey-settings" id="journey-settings" >/);assert.doesNotMatch(html,/<details[^>]*\bopen\b/);assert.match(html,/data-difficulty="explore" class="selected" aria-pressed="true"/);assert.match(html,/data-campaign="odyssey" class="selected" aria-pressed="true"/);assert.doesNotMatch(html,/<script>/);assert.match(html,/&lt;script&gt;&quot;/);assert.match(journeySettings({open:true}),/<details[^>]* open>/);
});
test('重新开局的上一段旅程独立可读，不与即时备份混淆',()=>{
 const s=G.createOdysseyGame(),raw=G.serialize(s),store={getItem:k=>k==='save.previous-journey'?raw:null};const points=recoveryPoints(store,'save',G.parseSave);assert.equal(points.length,1);assert.equal(points[0].key,'save.previous-journey');assert.equal(points[0].raw,raw);
});
