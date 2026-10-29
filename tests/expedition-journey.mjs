// 在已有合法主线旅程上继续远征；不注入坐标、背包、科技和时间。
import {s,make,need,walk} from './survival-journey.mjs';
import * as G from '../dist/survival.js';
import assert from 'node:assert/strict';import fs from 'node:fs';
need('twig',80);need('flint',50);need('grass',40);need('wood',35);need('berry',65);need('flower',45);
make('bow');make('armor');for(let i=0;i<18;i++)make('arrow');for(let i=0;i<12;i++)make('salve');
fs.mkdirSync('artifacts/v1.1-qa',{recursive:true});
let frames=0;
function advance(input={}){
 if(s.player.hunger<65&&s.inventory.berry)G.useItem(s,'berry');
 if(s.player.hp<85&&s.inventory.salve)G.useItem(s,'salve');
 if(G.phase(s)==='night'&&!G.lightAt(s,s.player.x,s.player.y)){if(s.inventory.torch)G.useItem(s,'torch');else assert.ok(G.craft(s,'torch').ok);}
 if(G.phase(s)==='day'&&s.torchOn)G.useItem(s,'torch');
 G.step(s,.1,input);frames++;assert.equal(s.status,'playing','远征途中死亡');assert.ok(frames<25000,'远征超时');
}
function move(point){assert.ok(G.goTo(s,point.x,point.y).ok);while(s.path.length)advance({attack:true});}
function cross(to){const n=s.nodes.find(n=>n.type==='wormhole'&&n.destination===to);assert.ok(n);move(n);while(s.expedition.cooldown)advance();assert.ok(G.enterWormhole(s,n.id).ok);}
function fight(m){
 let count=0, captured=false;
 while(m.hp>0){const d=G.distance(m,s.player),w=G.WEAPONS[G.equippedWeapon(s)];let dx=0,dy=0;
  if(m.warning&&G.distance(s.player,m.warning)<m.warning.radius+45){dx=s.player.x-m.warning.x;dy=s.player.y-m.warning.y;if(Math.hypot(dx,dy)<1){dx=1;dy=1;}if(!s.expedition.dodgeCooldown)G.dodgeRoll(s,dx,dy);}
  else if(d>w.range-35){dx=m.x-s.player.x;dy=m.y-s.player.y;}
  else if(d<170&&w.range>200){dx=s.player.x-m.x;dy=s.player.y-m.y;}
  if(!captured&&d<250){fs.writeFileSync('artifacts/v1.1-qa/combat-'+m.kind+'.json',G.serialize(s));captured=true;}
  const length=Math.hypot(dx,dy)||1;advance({x:dx/length,y:dy/length,attack:true});
  if(++count>4000)throw Error('战斗无法完成 '+m.kind+' '+JSON.stringify({hp:s.player.hp,arrow:s.inventory.arrow,durability:s.durability.bow}));
 }
}
for(const map of ['verdant','cinder','frost']){
 if(s.expedition.current!=='home')cross('home');
 if(!s.inventory.bow||s.durability.bow<50){move(s.buildings.find(b=>b.type==='table'));assert.ok(G.repair(s,'bow').ok);}
 G.useItem(s,'bow');cross(map);fs.writeFileSync('artifacts/v1.1-qa/'+map+'-entry.json',G.serialize(s));
 const kinds=[...new Set(s.expedition.creatures.map(m=>m.kind))];
 for(const kind of kinds){const m=s.expedition.creatures.filter(m=>m.kind===kind&&m.hp>0).sort((a,b)=>G.distance(a,s.player)-G.distance(b,s.player))[0];if(!m)continue;
  if(kind==='rockling'||kind==='icecrab'){if(!s.inventory.hammer)make('hammer');G.useItem(s,'hammer');}else G.useItem(s,'bow');
  fight(m);assert.ok(s.expedition.kills[kind]>0);
 }
 fs.writeFileSync('artifacts/v1.1-qa/'+map+'-cleared.json',G.serialize(s));
 cross('home');
}
const restored=G.parseSave(G.serialize(s));assert.equal(restored.expedition.visited.length,4);assert.equal(restored.expedition.bosses.length,3);assert.equal(Object.keys(restored.expedition.kills).length,9);
fs.writeFileSync('artifacts/v1.1-qa/expedition-complete.json',G.serialize(s));
console.log(JSON.stringify({passed:true,frames,day:G.day(s),hp:s.player.hp,visited:s.expedition.visited,kills:s.expedition.kills,bosses:s.expedition.bosses,arrows:s.inventory.arrow},null,2));
