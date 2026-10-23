// 通过公开游戏操作完成全流程，不注入资源、坐标、科技或时间。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as G from '../dist/survival.js';
const s=G.createGame();let frames=0,nightSaved=false;const notes=[];fs.mkdirSync('artifacts',{recursive:true});
const check=r=>{assert.ok(r.ok,r.reason);return r;};
function advance(){
  if(s.player.hunger<60){for(const id of ['stew','feast','roast','ration','cooked','berry'])if(s.inventory[id]){G.useItem(s,id);break;}}
  if(G.phase(s)==='night'&&!G.lightAt(s,s.player.x,s.player.y)){if(s.inventory.torch)G.useItem(s,'torch');else check(G.craft(s,'torch'));}
  if(G.phase(s)==='day'&&s.torchOn)G.useItem(s,'torch');
  G.step(s,.1);frames++;if(!nightSaved&&G.phase(s)==='night'&&s.time%300>238){fs.writeFileSync('artifacts/survival-night.json',G.serialize(s));nightSaved=true;}assert.equal(s.status,'playing','途中死亡：'+JSON.stringify({time:s.time,player:s.player,inventory:s.inventory}));
  if(frames>50000)throw Error('流程超时');
}
function walk(p,id=null){check(G.goTo(s,p.x,p.y,id));let i=0;while(s.path.length||s.target||s.action){advance();if(++i>1500)throw Error('寻路或采集卡住 '+id);} }
function harvest(type){
  const tool=G.NODES[type].tool;if(tool&&(!s.inventory[tool]||s.durability[tool]<G.NODES[type].hp))make(tool);
  let node=s.nodes.filter(n=>n.type===type&&n.available&&G.walkable(s,n.x,n.y)).sort((a,b)=>G.distance(a,s.player)-G.distance(b,s.player))[0];if(!node){const forge=s.buildings.find(b=>b.type==='forge'),item={tree:'wood',rock:'stone',ore:'ore',crystal:'crystal',bush:'berry',grass:'grass'}[type];if(forge&&item){need('resonance',3);walk(forge);while(s.expansion.manifestCooldown>0)advance();check(G.stationAction(s,'manifest:'+item,forge.id));return;}}if(!node&&type==='ore'){const producer=s.buildings.find(b=>b.type==='drill');if(producer){walk(producer);while(!producer.stored)advance();check(G.interact(s,producer.id));return;}}if(!node){const renewable=s.nodes.filter(n=>n.type===type&&n.respawnAt&&G.walkable(s,n.x,n.y)).sort((a,b)=>a.respawnAt-b.respawnAt)[0];if(renewable){while(!renewable.available)advance();node=renewable;}}assert.ok(node,'找不到 '+type);walk(node,node.id);
}
const source={mushroom:'mushroom',star:'meteor',essence:'lumen',wood:'tree',twig:'twig',stone:'rock',flint:'flint',grass:'grass',berry:'bush',seed:'tree',flower:'flower',ore:'ore',crystal:'crystal'};
function need(id,n){if(id==='resonance'){if(s.resonance<n)meditate(Math.ceil((n-s.resonance)/4));return;}let i=0;while(G.amount(s,id)<n){if(source[id])harvest(source[id]);else make(id);if(++i>200)throw Error('资源无法满足 '+id);}}
function make(id){const r=G.RECIPES.find(r=>r.id===id);for(const[k,n]of Object.entries(r.cost))need(k,n);if(r.station){const b=s.buildings.find(b=>b.type===r.station);assert.ok(b);walk(b);if(b.type==='campfire'&&b.fuel<=0)check(G.stationAction(s,'fuel',b.id));}check(G.craft(s,id));}
function build(id,anchor){const r=G.RECIPES.find(r=>r.id===id);for(const[k,n]of Object.entries(r.cost))need(k,n);if(anchor)walk(anchor);const p=G.placementNearPlayer(s,id);assert.ok(p,'没有建造空地 '+id);check(G.place(s,id,p.x,p.y));return s.buildings.at(-1);}
function learn(id){const t=G.TECHS.find(t=>t.id===id);for(const[k,n]of Object.entries(t.cost))need(k,n);walk(s.buildings.find(b=>b.type==='table'));check(G.research(s,id));}
function plantMany(n){for(let i=0;i<n;i++){need('seed',1);let done=false;for(let d=65;d<=145&&!done;d+=40)for(let a=0;a<Math.PI*2&&!done;a+=.4){const p={x:s.player.x+Math.cos(a)*d,y:s.player.y+Math.sin(a)*d};if(G.plant(s,p.x,p.y).ok)done=true;}if(!done){walk({x:s.player.x+200,y:s.player.y+100});i--;}}}
function meditate(n){const b=s.buildings.find(b=>b.type==='campfire');need('flower',n);need('wood',2);walk(b);if(b.fuel<150)check(G.stationAction(s,'fuel',b.id));for(let i=0;i<n;i++){while(s.meditationCooldown>0)advance();if(b.fuel<20)check(G.stationAction(s,'fuel',b.id));check(G.stationAction(s,'meditate',b.id));}}
function mark(text){notes.push({text,day:G.day(s),seconds:Math.round(s.time),hp:Math.round(s.player.hp),hunger:Math.round(s.player.hunger),insight:s.insight,resonance:s.resonance,ecology:Math.round(s.ecology)});}

// 完整执行新增生存循环，每份检查点都由行走、采集、制作与计时产生。
need('twig',24);need('flint',8);need('grass',40);make('axe');make('pickaxe');need('berry',30);make('torch');make('torch');
need('wood',45);need('stone',26);
const camp=build('campfire',G.WORLD.spawn);build('table',camp);learn('stonework');
const shelter=build('shelter',camp),pot=build('cookpot',camp);
need('mushroom',9);need('berry',20);need('grass',20);need('twig',12);need('wood',30);
const den=s.nodes.filter(n=>n.type==='burrow').sort((a,b)=>G.distance(a,camp)-G.distance(b,camp))[0];
const trap=build('trap',den);walk(trap);
fs.writeFileSync('artifacts/wild-before-bait.json',G.serialize(s));
for(let i=0;i<3;i++){
  check(G.stationAction(s,'bait',trap.id));walk(camp);
  while(s.time<trap.baitAt){if(camp.fuel<40)check(G.stationAction(s,'fuel',camp.id));advance();}
  walk(trap);check(G.stationAction(s,'collect',trap.id));
}
assert.equal(s.inventory.meat,6);assert.equal(s.inventory.fur,3);make('coat');make('roast');
walk(pot);fs.writeFileSync('artifacts/wild-before-cooking.json',G.serialize(s));
check(G.stationAction(s,'cook:stew',pot.id));while(pot.kitchen)advance();check(G.stationAction(s,'collect',pot.id));check(G.useItem(s,'stew'));
check(G.stationAction(s,'cook:feast',pot.id));while(pot.kitchen)advance();check(G.stationAction(s,'collect',pot.id));
need('berry',25);need('wood',30);need('grass',20);walk(camp);
while(!G.weather(s).raining){if(camp.fuel<40)check(G.stationAction(s,'fuel',camp.id));advance();}
if(camp.fuel<150)check(G.stationAction(s,'fuel',camp.id));
fs.writeFileSync('artifacts/wild-rain-camp.json',G.serialize(s));
assert.equal(s.inventory.coat,1);assert.equal(s.inventory.feast,1);assert.equal(s.level,1);
console.log(JSON.stringify({passed:true,frames,day:G.day(s),seconds:s.time,buildings:s.buildings.map(b=>b.type),crafted:s.crafted,inventory:s.inventory},null,2));
