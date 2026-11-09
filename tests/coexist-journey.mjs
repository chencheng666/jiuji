// 从真实九级通关存档接续，不注入坐标、等级或材料；走路、采集、配方与消耗使用正式规则。
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as G from '../dist/survival.js';
import {COMPANIONS,MODULES,puzzleTarget,symbiosisAction as act} from '../dist/symbiosis.js';
// 每次从本轮生成的主线结果接续，新克隆仓库也可独立运行此验收。
await import('./odyssey-journey.mjs');
let s=G.parseSave(fs.readFileSync('artifacts/odyssey-complete.json','utf8'));
const check=r=>assert.ok(r.ok,r.reason),notes=[];
if(s.odyssey.creative)check(G.odysseyAction(s,'creative'));
function advance(){G.step(s,.1);assert.equal(s.status,'playing','远征途中死亡');if(s.player.hp<80){const food=['salve','bandage','mushroommeal','fishsoup','feast','ration','berry'].find(k=>s.inventory[k]&&(G.ITEMS[k].health||0)>0);if(food)G.useItem(s,food);}for(const m of s.expedition.creatures)if(m.warning&&Math.hypot(m.warning.x-s.player.x,m.warning.y-s.player.y)<m.warning.radius&&s.expedition.dodgeCooldown===0)G.dodgeRoll(s,1,0);}
function walk(n){check(G.goTo(s,n.x,n.y));for(let i=0;i<3000&&(s.path.length||G.distance(s.player,n)>80);i++){if(!s.path.length)check(G.goTo(s,n.x,n.y));advance();}assert.ok(G.distance(s.player,n)<95,'未能走到目标 '+n.id);}
function harvest(n){walk(n);for(let i=0;n.available&&i<1000;i++){if(!s.action){if(G.distance(s.player,n)>80)walk(n);check(G.interact(s,n.id));}advance();}assert.equal(n.available,false);}
function need(id,n){for(let i=0;(s.inventory[id]||0)<n&&i<300;i++){const node=s.nodes.filter(p=>p.available&&G.NODES[p.type]?.drop?.[id]&&G.walkable(s,p.x,p.y)).sort((a,b)=>G.distance(s.player,a)-G.distance(s.player,b))[0];if(node){const tool=G.NODES[node.type].tool;if(tool&&!(s.durability[tool]>0))make(tool);harvest(node);continue;}const stocked=s.buildings.find(b=>id==='ore'&&b.type==='drill'&&b.stored>0||['synthesizer','assembler'].includes(b.type)&&(b.inventory?.[id]||0)>0);if(stocked){walk(stocked);check(G.odysseyAction(s,'collect-machine',stocked.id));continue;}
 if(['wood','stone','ore','crystal','berry','grass','seed'].includes(id)&&s.buildings.some(b=>b.type==='forge')){while(s.resonance<3){need('flower',1);const b=camp();while(s.meditationCooldown>0)advance();check(G.stationAction(s,'meditate',b.id));}const f=s.buildings.find(b=>b.type==='forge');walk(f);while(s.expansion.manifestCooldown>0)advance();check(G.stationAction(s,'manifest:'+id,f.id));continue;}
 if(id==='silk'&&s.expedition.current==='home'){const portal=s.nodes.find(n=>n.destination==='verdant');walk(portal);while(s.expedition.cooldown>0)advance();check(G.enterWormhole(s,portal.id));const spider=s.expedition.creatures.find(m=>m.kind==='spider'&&m.hp>0);walk(spider);while(spider.hp>0){G.attack(s);advance();}const exit=s.nodes.find(n=>n.destination==='home');walk(exit);check(G.enterWormhole(s,exit.id));continue;}
 const recipe=G.RECIPES.find(r=>r.item===id);assert.ok(recipe,'当前地图缺少 '+id);make(recipe.id);}assert.ok((s.inventory[id]||0)>=n,'材料不足 '+id);}
function make(id){const r=G.RECIPES.find(r=>r.id===id);for(let pass=0;pass<12;pass++){for(const[k,n]of Object.entries(r.cost))need(k,n);if(r.station){const b=s.buildings.find(b=>b.type===r.station);assert.ok(b);walk(b);if(b.type==='campfire'&&b.fuel<=0)check(G.stationAction(s,'fuel',b.id));}if(G.craftAffordable(s,r.cost)){check(G.craft(s,id));return;}}assert.fail('制作前补给不足 '+id);}

function camp(){const b=s.buildings.find(b=>b.type==='campfire');walk(b);if(!b.fuel){need('wood',1);walk(b);check(G.stationAction(s,'fuel',b.id));}return b;}
function build(id){const recipe=G.RECIPES.find(r=>r.id===id);for(const[k,n]of Object.entries(recipe.cost))need(k,n);const origin=camp();let p=G.placementNearPlayer(s,id);for(let i=0;!p&&i<24;i++){const radius=220+Math.floor(i/8)*180,spot={x:origin.x+Math.cos(i*Math.PI/4)*radius,y:origin.y+Math.sin(i*Math.PI/4)*radius};if(!G.walkable(s,spot.x,spot.y))continue;walk(spot);p=G.placementNearPlayer(s,id);}assert.ok(p,'没有可建造空地 '+id);check(G.place(s,id,p.x,p.y));return s.buildings.at(-1);}
fs.mkdirSync('artifacts/jiuji-3.0',{recursive:true});const snap=name=>{const raw=G.serialize(s);G.parseSave(raw);fs.writeFileSync('artifacts/jiuji-3.0/'+name+'.json',raw);};
// 同时验证解锁等级的普通角色，避免只在九级装备下验证新地图。
const completedCampaign=s,early=[];
for(const [file,realm]of [['before-4','tide'],['before-5','fungus']]){
 s=G.parseSave(fs.readFileSync('artifacts/odyssey-'+file+'.json','utf8'));const level=s.level;
 need('wood',3);need('ration',1);need('stone',3);need('flower',3);camp();check(act(s,'depart',realm,'20261109'));
 for(const n of s.nodes.filter(n=>n.type===(realm==='tide'?'tidereed':'glowfungus')).slice(0,4))harvest(n);
 for(let i=0;i<3;i++){const n=s.nodes.find(n=>n.type==='riftanchor'&&n.anchor===i);walk(n);for(let k=0;k<3;k++)if(s.symbiosis.run.switches[i][k]!==puzzleTarget(s.symbiosis.run,i)[k])check(act(s,'anchor-toggle',n.id,String(k)));check(act(s,'anchor-check',n.id));}
 check(act(s,'pacify',s.nodes.find(n=>n.anchor===2).id));const exit=s.nodes.find(n=>n.type==='wormhole');walk(exit);while(s.expedition.cooldown>0)advance();check(G.enterWormhole(s,exit.id));camp();check(act(s,'claim'));assert.equal(s.level,level);G.parseSave(G.serialize(s));early.push({level,realm,hp:s.player.hp,anchors:s.symbiosis.history[0].anchors,blueprints:s.inventory.blueprint});
}
fs.writeFileSync('artifacts/jiuji-3.0/解锁等级远征结果.json',JSON.stringify({passed:true,runs:early},null,2));s=completedCampaign;
for(const[id,d]of Object.entries(COMPANIONS)){for(const[k,n]of Object.entries(d.cost))need(k,n);camp();check(act(s,'recruit',id));}camp();check(act(s,'follow','botanist'));notes.push('四名伙伴通过真实物资招募，植物学者随行');
for(const [index,realm]of ['tide','fungus','tide','fungus','tide','fungus'].entries()){
 need('wood',3);need('ration',1);camp();check(act(s,'depart',realm,String(20261106+index)));snap('远征-'+realm+'-'+index+'-入口');
 for(const n of s.nodes.filter(n=>n.type===(realm==='tide'?'tidereed':'glowfungus')))harvest(n);
 for(let i=0;i<3;i++){const n=s.nodes.find(n=>n.type==='riftanchor'&&n.anchor===i);walk(n);for(let k=0;k<3;k++)if(s.symbiosis.run.switches[i][k]!==puzzleTarget(s.symbiosis.run,i)[k])check(act(s,'anchor-toggle',n.id,String(k)));check(act(s,'anchor-check',n.id));if(i===0)s=G.parseSave(G.serialize(s));}
 let n=s.nodes.find(n=>n.type==='riftanchor'&&n.anchor===2);walk(n);check(act(s,'pacify',n.id));snap('远征-'+realm+'-'+index+'-完成');const exit=s.nodes.find(n=>n.type==='wormhole');walk(exit);while(s.expedition.cooldown>0)advance();check(G.enterWormhole(s,exit.id));camp();check(act(s,'claim'));notes.push(realm+' 三处观测、和平修复、真实步行返程及邮袋领取');
}
for(const[id,m]of Object.entries(MODULES)){for(const[k,n]of Object.entries(m.cost))need(k,n);camp();check(act(s,'module-unlock',id));}
for(const id of ['scanner','partner','precision','capacitor','cooler','efficiency'])check(act(s,'module-equip',id));
for(const id of ['seedbed','repairbench','trailpost','fieldkitchen','purifier','tidewell'])build(id);
camp();check(act(s,'follow','botanist'));
for(const id of Object.keys(COMPANIONS)){const d=COMPANIONS[id];for(const[k,n]of Object.entries(d.storyCost))need(k,n);camp();check(act(s,'story',id));check(act(s,'job',id));const b=s.buildings.find(b=>b.type===d.station);walk(b);for(const[k,n]of Object.entries(d.input))need(k,n);walk(b);check(act(s,'supply',b.id));}
for(let i=0;i<800;i++)advance();snap('营地伙伴');
for(const [id,cost]of [['water',{tideglass:8,watercrop:4}],['spores',{sporepod:8,seed:4}]]){for(const[k,n]of Object.entries(cost))need(k,n);camp();check(act(s,'project',id));}
for(const id of ['home','verdant','cinder','frost','mirror','orbit']){need('tideglass',2);need('board',2);camp();check(act(s,'signal',id,'craft'));}camp();check(act(s,'claim'));build('coexistmonument');camp();snap('共建完成');
assert.equal(s.symbiosis.unlocked.length,12);assert.equal(s.symbiosis.projects.length,2);assert.equal(s.symbiosis.signals.length,6);assert.ok(Object.values(s.symbiosis.companions).every(c=>c.story));
fs.writeFileSync('artifacts/jiuji-3.0/正常资源旅程结果.json',JSON.stringify({passed:true,level:s.level,worldSeconds:s.time,history:s.symbiosis.history.length,modules:s.symbiosis.unlocked.length,projects:s.symbiosis.projects,signals:s.symbiosis.signals,companions:s.symbiosis.companions,notes},null,2));console.log('共生远征正常资源旅程通过');
