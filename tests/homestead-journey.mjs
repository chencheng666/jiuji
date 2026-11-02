// 在真实采集、制作、一级至三级晋升之后继续远征，不注入物资、坐标或科技。
import {s,make,need,walk,build,advance,check} from './survival-journey.mjs';
import * as G from '../dist/survival.js';
import {SITE_TYPES} from '../dist/homestead.js';
import assert from 'node:assert/strict';
import fs from 'node:fs';
fs.mkdirSync('artifacts/v1.2-qa',{recursive:true});
const camp=s.buildings.find(b=>b.type==='campfire');need('twig',30);need('grass',40);need('berry',65);need('wood',50);need('stone',30);need('flint',20);need('seed',18);need('flower',15);
make('armor');for(let i=0;i<5;i++)make('lure');const desk=build('fielddesk',camp);walk(desk);check(G.acceptContract(s,'verdant-well'));
fs.writeFileSync('artifacts/v1.2-qa/委托出发前.json',G.serialize(s));
let frames=0;
function step(input={}){if(s.player.hunger<60&&s.inventory.berry)G.useItem(s,'berry');if(s.player.hp<95&&s.inventory.salve)G.useItem(s,'salve');if(G.phase(s)==='night'&&!G.lightAt(s,s.player.x,s.player.y)){if(!s.inventory.torch)make('torch');else if(!s.torchOn)G.useItem(s,'torch');}G.step(s,.1,input);assert.equal(s.status,'playing','远征途中死亡');assert.ok(++frames<25000,'新玩法超时');}
function move(point){check(G.goTo(s,point.x,point.y));let watchdog=0;while(s.path.length){const threat=s.expedition.creatures.find(m=>m.hp>0&&m.warning&&G.distance(s.player,m.warning)<m.warning.radius+30);if(threat&&!s.expedition.dodgeCooldown)G.dodgeRoll(s,s.player.x-threat.warning.x||1,s.player.y-threat.warning.y||1);step();if(!s.path.length&&G.distance(s.player,point)>12)check(G.goTo(s,point.x,point.y));assert.ok(++watchdog<3000,'寻路卡住');}}
function cross(to){const n=s.nodes.find(n=>n.type==='wormhole'&&n.destination===to);assert.ok(n);move(n);while(s.expedition.cooldown)step();check(G.enterWormhole(s,n.id));}
function explore(type,choice){const n=s.nodes.find(n=>n.siteType===type);move(n);check(G.useItem(s,'lure'));const o=SITE_TYPES[type].options.find(o=>o.id===choice)||SITE_TYPES[type].options[0];check(G.beginSite(s,n.id,o.id));fs.writeFileSync('artifacts/v1.2-qa/探索-'+type+'.json',G.serialize(s));let attempts=0;while(!s.homestead.sites.includes(n.id)){step();if(!s.homestead.channel&&!s.homestead.sites.includes(n.id)){check(G.beginSite(s,n.id,o.id));assert.ok(++attempts<6,'探索反复被打断');}}}
cross('verdant');fs.writeFileSync('artifacts/v1.2-qa/林海入口.json',G.serialize(s));explore('well','restore');cross('home');move(desk);check(G.claimContract(s));assert.equal(s.inventory.relicpart,2);
const bed=build('nursery',camp);assert.equal(s.inventory.relicpart,0);move(desk);check(G.acceptContract(s,'verdant-pod'));cross('verdant');explore('pod');explore('cache');cross('home');move(desk);check(G.claimContract(s));assert.ok(s.inventory.relicpart>=2);
move(bed);check(G.stationAction(s,'sow:grain',bed.id));const rack=build('dryingrack',camp);
// 诱捕补足晾晒原料，不依赖击杀区域野怪。
const den=s.nodes.filter(n=>n.type==='burrow').sort((a,b)=>G.distance(a,camp)-G.distance(b,camp))[0],trap=build('trap',den);move(trap);check(G.stationAction(s,'bait',trap.id));move(camp);while(trap.baitAt)step();move(trap);check(G.stationAction(s,'collect',trap.id));move(rack);check(G.stationAction(s,'dry',rack.id));
while(bed.crop||rack.crop){if(G.nearby(s,'campfire',180)&&s.buildings.find(b=>b.type==='campfire').fuel<40)G.quickFuel(s);step();}
move(bed);fs.writeFileSync('artifacts/v1.2-qa/育苗床收获前.json',G.serialize(s));check(G.stationAction(s,'home-collect',bed.id));move(rack);fs.writeFileSync('artifacts/v1.2-qa/晾晒架收获前.json',G.serialize(s));check(G.stationAction(s,'home-collect',rack.id));check(G.useItem(s,'trailmeal'));assert.ok(s.homestead.satiety>0);assert.ok(s.inventory.grain>=3);
make('graincake');make('lure');make('bow');move(desk);check(G.acceptContract(s,'verdant-den'));cross('verdant');explore('den');cross('home');move(desk);check(G.claimContract(s));check(G.chooseSpecialty(s,'bow','steady'));assert.equal(G.effectiveWeapon(s,'bow').range,410);
const restored=G.parseSave(G.serialize(s));assert.equal(restored.homestead.completed.length,3);assert.ok(restored.buildings.some(b=>b.type==='nursery'));assert.ok(restored.buildings.some(b=>b.type==='dryingrack'));
fs.writeFileSync('artifacts/v1.2-qa/营地升级完成.json',G.serialize(s));
console.log(JSON.stringify({passed:true,frames,level:s.level,day:G.day(s),contracts:s.homestead.completed,sites:s.homestead.sites,upgrades:s.buildings.filter(b=>['nursery','dryingrack'].includes(b.type)).map(b=>b.type),specialty:s.homestead.specialty,noncombatWildlife:s.expedition.kills},null,2));

// 探索难度另产出合法死亡与回营检查点，供浏览器验证复活按钮与遗落包。
if(s.homestead.mode==='explore'){
 if(s.torchOn)check(G.useItem(s,'torch'));
 check(G.goTo(s,1300,2150));
 let ticks=0;while(s.status==='playing'){G.step(s,.1);assert.ok(++ticks<10000);}
 assert.equal(s.status,'dead');fs.writeFileSync('artifacts/v1.2-qa/探索模式倒下.json',G.serialize(s));check(G.recoverAtCamp(s));fs.writeFileSync('artifacts/v1.2-qa/探索模式回营.json',G.serialize(s));assert.ok(s.homestead.graves.length);
}
