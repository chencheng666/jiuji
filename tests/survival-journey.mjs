// 通过公开游戏操作完成全流程，不注入资源、坐标、科技或时间。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as G from '../dist/survival.js';
const odyssey=process.env.JIUJI_JOURNEY_CAMPAIGN==='odyssey';
const s=odyssey?G.createOdysseyGame(20261022,'explore'):G.createGame(20261022,process.env.JIUJI_JOURNEY_MODE||'survival');let frames=0,nightSaved=false;const notes=[];fs.mkdirSync('artifacts',{recursive:true});
const check=r=>{assert.ok(r.ok,r.reason);return r;};
function advance(){
  if(odyssey&&s.player.hp<65&&s.inventory.salve)G.useItem(s,'salve');
  if(s.player.hunger<60){for(const id of ['ration','cooked','berry'])if(s.inventory[id]){G.useItem(s,id);break;}}
  if(G.phase(s)==='night'&&!G.lightAt(s,s.player.x,s.player.y)){if(s.inventory.torch)G.useItem(s,'torch');else check(G.craft(s,'torch'));}
  if(G.phase(s)==='day'&&s.torchOn)G.useItem(s,'torch');
  G.step(s,.1);frames++;if(!nightSaved&&G.phase(s)==='night'&&s.time%300>238){fs.writeFileSync('artifacts/survival-night.json',G.serialize(s));nightSaved=true;}assert.equal(s.status,'playing','途中死亡：'+JSON.stringify({time:s.time,player:s.player,inventory:s.inventory}));
  if(frames>200000)throw Error('流程超时');
}
function walk(p,id=null){check(G.goTo(s,p.x,p.y,id));let i=0;while(s.path.length||s.target||s.action){advance();if(++i>1500)throw Error('寻路或采集卡住 '+id);} }
function harvest(type){
  const tool=G.NODES[type].tool;if(tool&&(!s.inventory[tool]||s.durability[tool]<G.NODES[type].hp))make(tool);
  let node=s.nodes.filter(n=>n.type===type&&n.available&&G.walkable(s,n.x,n.y)).sort((a,b)=>G.distance(a,s.player)-G.distance(b,s.player))[0];if(!node){const forge=s.buildings.find(b=>b.type==='forge'),item={tree:'wood',rock:'stone',ore:'ore',crystal:'crystal',bush:'berry',grass:'grass'}[type];if(forge&&item){need('resonance',3);walk(forge);while(s.expansion.manifestCooldown>0)advance();check(G.stationAction(s,'manifest:'+item,forge.id));return;}}if(!node&&type==='ore'){const producer=s.buildings.find(b=>b.type==='drill');if(producer){walk(producer);while(!producer.stored)advance();check(odyssey?G.odysseyAction(s,'collect-machine',producer.id):G.interact(s,producer.id));return;}}if(!node){const renewable=s.nodes.filter(n=>n.type===type&&n.respawnAt&&G.walkable(s,n.x,n.y)).sort((a,b)=>a.respawnAt-b.respawnAt)[0];if(renewable){while(!renewable.available)advance();node=renewable;}}assert.ok(node,'找不到 '+type);walk(node,node.id);
}
const source={star:'meteor',essence:'lumen',wood:'tree',twig:'twig',stone:'rock',flint:'flint',grass:'grass',berry:'bush',seed:'tree',flower:'flower',ore:'ore',crystal:'crystal',mirrorsand:'mirrorsand',starfiber:'starroot'};
function need(id,n){if(id==='resonance'){if(s.resonance<n)meditate(Math.ceil((n-s.resonance)/4));return;}let i=0;while(G.amount(s,id)<n){if(source[id])harvest(source[id]);else make(id);if(++i>200)throw Error('资源无法满足 '+id);}}
function make(id){const r=G.RECIPES.find(r=>r.id===id);for(let pass=0;pass<8&&!G.craftAffordable(s,r.cost);pass++)for(const[k,n]of Object.entries(r.cost))need(k,n);if(r.station){const b=s.buildings.find(b=>b.type===r.station);assert.ok(b);walk(b);if(b.type==='campfire'&&b.fuel<=0){need('wood',1);walk(b);check(G.stationAction(s,'fuel',b.id));}}check(G.craft(s,id));}
function build(id,anchor={x:s.player.x,y:s.player.y}){const r=G.RECIPES.find(r=>r.id===id);for(let pass=0;pass<8&&!G.craftAffordable(s,r.cost);pass++)for(const[k,n]of Object.entries(r.cost))need(k,n);if(anchor)walk(anchor);let p=G.placementNearPlayer(s,id);if(!p&&odyssey){for(const d of[230,360,480]){if(p)break;walk({x:anchor.x+d,y:anchor.y+110});p=G.placementNearPlayer(s,id);}}assert.ok(p,'没有建造空地 '+id);check(G.place(s,id,p.x,p.y));return s.buildings.at(-1);}
function learn(id){const t=G.TECHS.find(t=>t.id===id);for(let pass=0;pass<8&&!G.craftAffordable(s,t.cost);pass++)for(const[k,n]of Object.entries(t.cost))need(k,n);walk(s.buildings.find(b=>b.type==='table'));check(G.research(s,id));}
function plantMany(n){for(let i=0;i<n;i++){need('seed',1);let done=false;for(let d=65;d<=145&&!done;d+=40)for(let a=0;a<Math.PI*2&&!done;a+=.4){const p={x:s.player.x+Math.cos(a)*d,y:s.player.y+Math.sin(a)*d};if(G.plant(s,p.x,p.y).ok)done=true;}if(!done){walk({x:s.player.x+200,y:s.player.y+100});i--;}}}
function meditate(n){const b=s.buildings.find(b=>b.type==='campfire');need('flower',n);need('wood',2);walk(b);if(b.fuel<150)check(G.stationAction(s,'fuel',b.id));for(let i=0;i<n;i++){while(s.meditationCooldown>0)advance();if(b.fuel<20)check(G.stationAction(s,'fuel',b.id));check(G.stationAction(s,'meditate',b.id));}}
function mark(text){notes.push({text,day:G.day(s),seconds:Math.round(s.time),hp:Math.round(s.player.hp),hunger:Math.round(s.player.hunger),insight:s.insight,resonance:s.resonance,ecology:Math.round(s.ecology)});}
need('twig',12);need('flint',14);need('grass',20);make('axe');make('pickaxe');need('berry',30);make('torch');make('torch');make('torch');make('bedroll');
need('wood',35);need('stone',30);fs.writeFileSync('artifacts/survival-before-camp.json',G.serialize(s));const camp=build('campfire',G.WORLD.spawn);const table=build('table',camp);mark('建立营地');
learn('stonework');learn('observe');build('furnace',camp);plantMany(10);need('flower',15);meditate(4);learn('steward');
for(let i=0;i<3;i++)harvest('ruin');need('ore',85);learn('smelting');need('crystal',20);need('ingot',24);mark('金属与晶体准备完成');
learn('crystal');learn('resonate');plantMany(8);if(s.resonance<14)meditate(Math.ceil((14-s.resonance)/4));const resonator=build('resonator',camp);
walk(camp);while(G.phase(s)==='day')advance();while(camp.fuel<100)check(G.stationAction(s,'fuel',camp.id));check(G.stationAction(s,'sleep',camp.id));
if(s.resonance<8)meditate(2);walk(resonator);fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/survival-before-promotion.json',G.serialize(s));check(G.stationAction(s,'promote',resonator.id));mark('晋升二级');
learn('drilling');if(s.resonance<16)meditate(4);learn('ward');const ore=s.nodes.find(n=>n.type==='ore'&&G.walkable(s,n.x,n.y));build('drill',ore);need('board',5);need('ingot',7);if(s.resonance<10)meditate(3);
if(odyssey){
  learn('powergrid');const power=build('windmill',camp);walk({x:power.x+250,y:power.y});
  while(s.odyssey.stats.drilled<3)advance();
  const site=s.nodes.find(n=>n.type==='conduit');walk(site);
  const values=s.odyssey.puzzles.home.values;
  for(let mask=0;mask<8;mask++){const v=[...values];for(let i=0;i<3;i++)if(mask>>i&1){v[i]^=1;v[(i+1)%3]^=1;}if(v.every(Boolean)){for(let i=0;i<3;i++)if(mask>>i&1)check(G.odysseyAction(s,'puzzle-toggle','',i));break;}}
  check(G.odysseyAction(s,'puzzle-check'));check(G.odysseyAction(s,'focus','','care'));
}
walk(odyssey?{x:2830,y:750}:{x:2700,y:900});const beacon=build('beacon');walk(beacon);fs.writeFileSync('artifacts/survival-before-beacon.json',G.serialize(s));check(G.stationAction(s,'beacon',beacon.id));assert.equal(s.status,'playing');assert.equal(s.level,3);mark('点亮信标，晋升三级');
fs.writeFileSync('artifacts/survival-complete.json',G.serialize(s));console.log(JSON.stringify({passed:true,frames,notes,buildings:s.buildings.map(b=>b.type),tech:s.tech},null,2));

export {s,advance,walk,harvest,need,make,build,learn,plantMany,meditate,mark,notes,check};
