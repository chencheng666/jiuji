import test from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../dist/survival.js';
import {stepVillageLife} from '../dist/village-life.js';
import {villageLifeObjects} from '../dist/village-life-view.js';
import {beginnerAdvice} from '../dist/beginner-advice.js';
const setup=()=>{const s=G.createOdysseyGame(81),n=s.nodes.find(n=>n.id==='village-bay');s.player.x=n.x+100;s.player.y=n.y+60;s.expedition.creatures=[];s.enemies=[];return{s,n};};
function tick(s,n){for(let i=0;i<n*10;i++){s.time+=.1;stepVillageLife(s,.1);}}
test('居民白天自主移动且不凭空产生物资，人数与公共人口相符',()=>{
 const{s,n}=setup(),res=s.settlements.life.people.bay,bag=JSON.stringify(s.inventory),food=s.settlements.villages.bay.food,positions=res.map(r=>({x:r.x,y:r.y}));tick(s,30);assert.ok(res.some((r,i)=>G.distance(r,positions[i])>12));assert.equal(res.length,3);assert.equal(JSON.stringify(s.inventory),bag);assert.equal(s.settlements.villages.bay.food,food);assert.ok(res.every(r=>G.walkable(s,r.x,r.y)&&G.distance(r,n)<220));
});
test('居民下雨和夜晚回屋，白天重新出门；减少动态不改变日程',()=>{
 const{s}=setup();tick(s,12);s.time=360;tick(s,20);assert.ok(s.settlements.life.people.bay.every(r=>r.state==='rain'&&r.inside));assert.equal(villageLifeObjects(s).filter(r=>r.village==='bay').length,0);s.time=480;tick(s,20);assert.ok(s.settlements.life.people.bay.some(r=>!r.inside));s.time=540;tick(s,20);assert.ok(s.settlements.life.people.bay.every(r=>r.state==='home'&&r.inside));
});
test('附近有危险先回屋，不对战、不扣资源；离开原岛暂停行动',()=>{
 const{s,n}=setup();tick(s,10);s.enemies=[{x:n.x+20,y:n.y,hp:30}];tick(s,20);assert.ok(s.settlements.life.people.bay.every(r=>r.state==='danger'&&r.inside));const before=JSON.stringify(s.settlements.life);s.expedition.current='verdant';tick(s,30);assert.equal(JSON.stringify(s.settlements.life),before);
});
test('居民路径和生活状态存档可续接，旧存档迁移不重复生成',()=>{
 const{s}=setup();tick(s,9);const restored=G.parseSave(G.serialize(s));assert.deepEqual(restored.settlements.life,s.settlements.life);delete s.settlements.life;const old=G.parseSave(G.serialize(s));assert.equal(old.settlements.life.people.bay.length,3);assert.equal(G.parseSave(G.serialize(old)).settlements.life.people.bay.length,3);old.settlements.life.people.bay[0].path=[{x:-1,y:20}];assert.throws(()=>G.parseSave(G.serialize(old)),/居民行动/);
});
test('人口增长生成新居民；远处聚落不每帧寻路，屏幕上最多一个对话气泡',()=>{
 const{s}=setup();s.settlements.villages.bay.population=4;tick(s,2);assert.equal(s.settlements.life.people.bay.length,4);assert.ok(villageLifeObjects(s).filter(r=>r.showSpeech).length<=1);s.player.x=350;s.player.y=1000;const far=JSON.stringify(s.settlements.life.people.reed);tick(s,10);assert.equal(JSON.stringify(s.settlements.life.people.reed),far);
});
test('新手建议按进度调整，每次最多三条，不增加常驻界面',()=>{
 const{s}=setup();const first=beginnerAdvice(s);assert.equal(first.length,3);assert.match(first[0].title,/石斧/);s.crafted.push('axe');s.buildings.push({type:'campfire'});s.settlements.villages.bay.met=true;s.level=2;s.player.hunger=30;const next=beginnerAdvice(s);assert.equal(next[0].action,'safety');assert.ok(next.some(t=>t.action==='robots'));assert.ok(next.length<=3);
});
