// 接续正常资源通关存档，实际步行与采集合成；不注入材料、等级或坐标。
import fs from 'node:fs';import assert from 'node:assert/strict';import * as G from '../dist/survival.js';
import {VILLAGES,VILLAGE_TECH,settlementAction as act} from '../dist/settlements.js';
await import('./coexist-journey.mjs');
let s=G.parseSave(fs.readFileSync('artifacts/jiuji-3.0/共建完成.json','utf8'));
if(s.odyssey.creative)assert.ok(G.odysseyAction(s,'creative').ok);
const check=r=>assert.ok(r.ok,r.reason),results=[];
function advance(){G.step(s,.1);assert.equal(s.status,'playing','远征途中死亡');if(s.player.hp<80){const food=['salve','bandage','mushroommeal','fishsoup','feast','ration','berry'].find(k=>s.inventory[k]&&(G.ITEMS[k].health||0)>0);if(food)G.useItem(s,food);}for(const m of s.expedition.creatures)if(m.warning&&Math.hypot(m.warning.x-s.player.x,m.warning.y-s.player.y)<m.warning.radius&&s.expedition.dodgeCooldown===0)G.dodgeRoll(s,1,0);}
function walk(n){check(G.goTo(s,n.x,n.y));for(let i=0;i<3000&&(s.path.length||G.distance(s.player,n)>80);i++){if(!s.path.length)check(G.goTo(s,n.x,n.y));advance();}assert.ok(G.distance(s.player,n)<95,'未能走到目标 '+n.id);}
function harvest(n){walk(n);for(let i=0;n.available&&i<1000;i++){if(!s.action){if(G.distance(s.player,n)>80)walk(n);check(G.interact(s,n.id));}advance();}assert.equal(n.available,false);}
function need(id,n){for(let i=0;(s.inventory[id]||0)<n&&i<300;i++){const node=s.nodes.filter(p=>p.available&&G.NODES[p.type]?.drop?.[id]&&G.walkable(s,p.x,p.y)).sort((a,b)=>G.distance(s.player,a)-G.distance(s.player,b))[0];if(node){const tool=G.NODES[node.type].tool;if(tool&&!(s.durability[tool]>0))make(tool);harvest(node);continue;}const stocked=s.buildings.find(b=>id==='ore'&&b.type==='drill'&&b.stored>0||['synthesizer','assembler'].includes(b.type)&&(b.inventory?.[id]||0)>0);if(stocked){walk(stocked);check(G.odysseyAction(s,'collect-machine',stocked.id));continue;}
 if(['wood','stone','ore','crystal','berry','grass','seed'].includes(id)&&s.buildings.some(b=>b.type==='forge')){while(s.resonance<3){need('flower',1);const b=camp();while(s.meditationCooldown>0)advance();check(G.stationAction(s,'meditate',b.id));}const f=s.buildings.find(b=>b.type==='forge');walk(f);while(s.expansion.manifestCooldown>0)advance();check(G.stationAction(s,'manifest:'+id,f.id));continue;}
 if(id==='silk'&&s.expedition.current==='home'){const portal=s.nodes.find(n=>n.destination==='verdant');walk(portal);while(s.expedition.cooldown>0)advance();check(G.enterWormhole(s,portal.id));const spider=s.expedition.creatures.find(m=>m.kind==='spider'&&m.hp>0);walk(spider);while(spider.hp>0){G.attack(s);advance();}const exit=s.nodes.find(n=>n.destination==='home');walk(exit);check(G.enterWormhole(s,exit.id));continue;}
 const recipe=G.RECIPES.find(r=>r.item===id);assert.ok(recipe,'当前地图缺少 '+id);make(recipe.id);}assert.ok((s.inventory[id]||0)>=n,'材料不足 '+id);}
function make(id){const r=G.RECIPES.find(r=>r.id===id);for(let pass=0;pass<12;pass++){for(const[k,n]of Object.entries(r.cost))need(k,n);if(r.station){const b=s.buildings.find(b=>b.type===r.station);assert.ok(b);walk(b);if(b.type==='campfire'&&b.fuel<=0)check(G.stationAction(s,'fuel',b.id));}if(G.craftAffordable(s,r.cost)){check(G.craft(s,id));return;}}assert.fail('制作前补给不足 '+id);}

function camp(){const b=s.buildings.find(b=>b.type==='campfire');walk(b);if(!b.fuel){need('wood',1);walk(b);check(G.stationAction(s,'fuel',b.id));}return b;}

for(const[id,d]of Object.entries(VILLAGES)){
 const target=()=>s.nodes.find(n=>n.id==='village-'+id);walk(target());while(s.settlements.lesson<3)check(act(s,'lesson',id));
 for(const t of VILLAGE_TECH)if(!s.settlements.tech.includes(t.id)){for(const[k,n]of Object.entries(t.cost))need(k,n);walk(target());check(act(s,'tech',id,t.id));}
 for(const[k,n]of Object.entries(d.want))need(k,n*3);walk(target());for(let i=0;i<3;i++)check(act(s,'trade',id));
 check(act(s,'accept',id));for(const[k,n]of Object.entries(d.quest.cost))need(k,n);walk(target());check(act(s,'deliver',id));
 need('berry',3);need('wood',3);walk(target());check(act(s,'supply',id));
 if(id==='ridge'){need('twig',2);need('berry',1);walk(target());check(act(s,'battle',id));s=G.parseSave(G.serialize(s));for(let i=0;i<60&&s.settlements.encounter;i++){const b=s.settlements.encounter;check(act(s,b.position===b.enemyLane&&b.position!==b.warning?'strike':'guard',id));}}
 else{for(const[k,n]of Object.entries(d.care))need(k,n);walk(target());check(act(s,'repair',id));}
 assert.equal(s.settlements.villages[id].outpost,true);results.push({id,population:s.settlements.villages[id].population,affinity:s.settlements.villages[id].affinity,quest:s.settlements.villages[id].quest,outpost:true});
 fs.writeFileSync('artifacts/fans-v3-20261109/正常资源-'+id+'聚落.json',G.serialize(s));
}
const before=G.day(s);while(G.day(s)===before)advance();assert.ok(Object.values(s.settlements.villages).some(v=>v.population>3));
s=G.parseSave(G.serialize(s));assert.equal(s.level,9);assert.equal(s.settlements.tech.length,6);
fs.writeFileSync('artifacts/fans-v3-20261109/正常资源聚落旅程结果.json',JSON.stringify({passed:true,results,tech:s.settlements.tech,population:s.settlements.villages,worldSeconds:s.time},null,2));
fs.writeFileSync('artifacts/fans-v3-20261109/聚落共建完成.json',G.serialize(s));console.log('三聚落真实步行、交换、委托、补给、和平修复及战术据点全部通过');
