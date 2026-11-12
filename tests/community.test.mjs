import test from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../dist/survival.js';
import {CROPS,stepHomestead} from '../dist/homestead.js';
import {roboticsAction,robotAt,stepRobotics,robotCapacity,ROBOT_MODELS} from '../dist/robotics.js';
import {communityAction,stepCommunity,roadMultiplier,COMMUNITY_REQUESTS,requestReason} from '../dist/community.js';
const key=p=>Math.floor(p.x/160)+','+Math.floor(p.y/160);
function facility(s,type,x,y,inventory={}){const b={id:'test-'+s.buildings.length,type,x,y,inventory,fuel:0,readyAt:s.time+75,stored:0,productionAt:s.time};s.buildings.push(b);s.explored.push(key(b));return b;}
function setup(model){const s=G.createOdysseyGame(1212);s.level=4;s.tech.push('robotics','steward','spatial');Object.assign(s.inventory,{ingot:30,board:30,crystal:30,seed:30,wood:30,grass:30,stone:30,flower:10});s.expedition.creatures=[];s.nodes=s.nodes.filter(n=>n.type==='settlement'||n.type==='wormhole');
 const d=facility(s,'robotdock',1260,1640);for(let x=6;x<=10;x++)for(let y=8;y<=12;y++)s.explored.push(x+','+y);
 assert.ok(roboticsAction(s,'assemble',d.id,model).ok);const r=robotAt(s,d.id);r.battery=100;return{s,d,r};}
function tick(s,t,fn=()=>{}){for(let i=0;i<t*10;i++){s.time+=.1;stepHomestead(s,.1,false);stepRobotics(s,.1);fn();}}
function enable(s,d,r){assert.ok(roboticsAction(s,'toggle',d.id,'',r.id).ok);}
const count=(s,id)=>s.buildings.reduce((n,b)=>n+(b.inventory?.[id]||0),0)+s.robotics.robots.reduce((n,r)=>n+(r.cargo[id]||0),0)+(s.inventory[id]||0);
test('园丁从工作站取真实种料，播种、等待、收获返站，无料不偷用背包',()=>{
 const{s,d,r}=setup('gardener'),bed=facility(s,'nursery',1390,1640),seed=s.inventory.seed;enable(s,d,r);tick(s,8);assert.equal(bed.crop,undefined);assert.equal(s.inventory.seed,seed);assert.match(r.reason,/种料/);
 assert.ok(G.transfer(s,d.id,'seed','in',4).ok);assert.equal(s.inventory.seed,seed-4);tick(s,10);assert.equal(bed.crop.kind,'root');assert.equal(d.inventory.seed,2);assert.equal(r.cargo.seed,0);const ready=bed.crop.readyAt;assert.ok(ready>s.time);
 tick(s,100);assert.ok(d.inventory.root>=3);assert.equal(s.inventory.root||0,0);assert.ok(s.community.gardens>=1);assert.ok(r.trips>=1);assert.equal(s.inventory.seed,seed-4);
});
test('园丁出发后被玩家抢先播种，未用种料随车返站，不重复消耗',()=>{
 const{s,d,r}=setup('gardener'),bed=facility(s,'nursery',1450,1640);d.inventory.seed=2;enable(s,d,r);tick(s,.1);assert.equal(r.cargo.seed,2);bed.crop={kind:'flower',readyAt:s.time+100};tick(s,10);assert.equal(d.inventory.seed,2);assert.equal(bed.crop.kind,'flower');assert.equal(r.cargo.seed,0);
});
test('园丁中途召回、任务改作物和满仓均不丢种子或收成',()=>{
 const{s,d,r}=setup('gardener');facility(s,'nursery',1450,1640);d.inventory.seed=6;enable(s,d,r);tick(s,.2);roboticsAction(s,'crop',d.id,'flower',r.id);tick(s,5);assert.equal(d.inventory.seed,6);assert.equal(r.cargo.seed,0);
 r.enabled=false;d.inventory.root=9999;r.cargo={root:3};r.returnReason='收成装箱，返程卸货';r.x=d.x;r.y=d.y;r.state='returning';tick(s,2);assert.equal(r.cargo.root,3);assert.equal(d.inventory.root,9999);d.inventory.root=9996;tick(s,3);assert.equal(r.cargo.root,0);assert.equal(d.inventory.root,9999);
});
test('三种型号同站共存，等级前置、互斥改装和完整回收真实扣还',()=>{
 const{s,d,r}=setup('gather');const ingot=s.inventory.ingot;assert.ok(roboticsAction(s,'assemble',d.id,'gardener').ok);assert.ok(roboticsAction(s,'assemble',d.id,'hauler').ok);assert.equal(s.robotics.robots.length,3);assert.equal(s.inventory.ingot,ingot-7);assert.equal(roboticsAction(s,'assemble',d.id,'hauler').ok,false);
 assert.ok(roboticsAction(s,'upgrade',d.id,'cargo',r.id).ok);assert.equal(robotCapacity(r),24);assert.equal(roboticsAction(s,'upgrade',d.id,'range',r.id).ok,false);const before=s.inventory.ingot;assert.ok(roboticsAction(s,'pack',d.id,'',r.id).ok);assert.equal(s.inventory.ingot,before+5);
 const other=setup('gather');other.s.level=2;assert.equal(roboticsAction(other.s,'assemble',other.d.id,'hauler').ok,false);other.s.tech=other.s.tech.filter(t=>t!=='steward');assert.equal(roboticsAction(other.s,'assemble',other.d.id,'gardener').ok,false);
});
function hauling(){const x=setup('hauler'),{s,d,r}=x,source=facility(s,'chest',1350,1640,{wood:30}),dest=facility(s,'relay',1440,1640,{});for(const[k,v]of Object.entries({sourceId:source.id,destinationId:dest.id,haulItem:'wood',radius:400,reserve:5}))assert.ok(roboticsAction(s,k,d.id,v,r.id).ok);return{...x,source,dest};}
test('搬运真实仓库货物，源仓保留储备，终点达标停运，循环返站扣能',()=>{
 const{s,d,r,source,dest}=hauling(),total=count(s,'wood');d.robotEnergy=120;enable(s,d,r);tick(s,80);assert.equal(dest.inventory.wood,20);assert.equal(source.inventory.wood,10);assert.equal(count(s,'wood'),total);assert.equal(r.cargo.wood,0);assert.ok(r.battery<100||d.robotEnergy<120);assert.match(r.reason,/目标库存/);assert.ok(r.trips>=4);
});
test('搬运途中召回、切换终点、源仓被取走、目的地填满仍守恒',()=>{
 const{s,d,r,source,dest}=hauling(),total=count(s,'wood');enable(s,d,r);tick(s,3.5);assert.ok(r.cargo.wood>0);roboticsAction(s,'return',d.id,'',r.id);tick(s,6);assert.equal(dest.inventory.wood||0,0);assert.equal(count(s,'wood'),total);assert.equal(d.inventory.wood,5);
 r.battery=100;enable(s,d,r);tick(s,3.5);dest.inventory.wood=20;const added=count(s,'wood');tick(s,10);assert.equal(count(s,'wood'),added);assert.equal(r.cargo.wood,0);assert.equal(d.inventory.wood,10);
 source.inventory.wood=5;r.wakeAt=0;dest.inventory.wood=0;tick(s,8);assert.equal(source.inventory.wood,5);assert.equal(dest.inventory.wood,0);
});
test('搬运危险、未探索、路线受阻、同仓配置和拆除保护',()=>{
 const{s,d,r,source,dest}=hauling();assert.equal(roboticsAction(s,'destinationId',d.id,source.id,r.id).ok,false);assert.match(G.dismantle(s,source.id).reason,/搬运机/);s.enemies=[{x:d.x+50,y:d.y,hp:30}];enable(s,d,r);tick(s,4);assert.equal(source.inventory.wood,30);assert.match(r.reason,/危险/);
 s.enemies=[];s.explored=[];r.wakeAt=0;tick(s,5);assert.equal(source.inventory.wood,30);assert.match(r.reason,/安全范围/);
});
test('在途机器人存档与旧拾荒档迁移保留货物；非法型号、模块、任务拒绝',()=>{
 const{s,d,r}=hauling();enable(s,d,r);tick(s,3.5);const raw=G.serialize(s),loaded=G.parseSave(raw);assert.equal(loaded.robotics.robots[0].cargo.wood,r.cargo.wood);tick(loaded,12);assert.ok(loaded.buildings.find(b=>b.type==='relay').inventory.wood>=5);
 const old=setup('gather');for(const k of ['model','upgrade','crop','haulItem','sourceId','destinationId','reserve','batch','job'])delete old.r[k];delete old.s.community;const migrated=G.parseSave(G.serialize(old.s));assert.equal(migrated.robotics.robots[0].model,'gather');assert.equal(migrated.community.gardens,0);
 for(const mutate of[x=>x.robotics.robots[0].model='__proto__',x=>x.robotics.robots[0].upgrade='bad',x=>x.robotics.robots[0].cargo.wood=25,x=>x.robotics.robots[0].job={kind:'load',targetId:'x',item:'unknown',destId:'y'}]){const bad=G.parseSave(raw);mutate(bad);assert.throws(()=>G.parseSave(G.serialize(bad)),/机器人/);}
 assert.equal(roboticsAction(s,'assemble',d.id,'__proto__').ok,false);
});
test('机器人离开地图冻结在途作业，返回后只交付一次',()=>{
 const{s,d,r,dest}=hauling();enable(s,d,r);tick(s,3.5);const snapshot=JSON.stringify(r);const portal=s.nodes.find(n=>n.destination==='verdant');Object.assign(s.player,portal);assert.ok(G.enterWormhole(s,portal.id).ok);tick(s,100);assert.equal(JSON.stringify(r),snapshot);s.expedition.cooldown=0;const back=s.nodes.find(n=>n.destination==='home');Object.assign(s.player,{x:back.x,y:back.y});assert.ok(G.enterWormhole(s,back.id).ok);tick(s,12);assert.ok(dest.inventory.wood>=5);assert.equal(count(s,'wood'),60);
});
test('聚落主动来信只提示一次，不倒计时；真实付料，饭篮两地交付防重复',()=>{
 const{s}=setup('gather');s.settlements.villages.bay.met=true;stepCommunity(s);const seq=s.messageSeq;stepCommunity(s);assert.equal(s.messageSeq,seq);s.time+=1200;assert.equal(s.community.requests.bay,0);
 function deliver(id){const n=s.nodes.find(n=>n.id==='village-'+id);Object.assign(s.player,{x:n.x,y:n.y});const d=COMMUNITY_REQUESTS[id][s.community.requests[id]];for(const[k,n]of Object.entries(d.cost))s.inventory[k]=Math.max(s.inventory[k]||0,n);assert.ok(communityAction(s,'request',id).ok);}
 deliver('bay');deliver('bay');assert.equal(s.inventory.carebasket,1);deliver('ridge');deliver('ridge');assert.equal(s.inventory.carebasket,0);assert.equal(s.community.requests.ridge,2);assert.equal(communityAction(s,'request','ridge').ok,false);assert.equal(requestReason(s,'reed'),'');deliver('reed');assert.match(requestReason(s,'reed'),/园丁/);
 const loaded=G.parseSave(G.serialize(s));assert.equal(loaded.community.requests.bay,2);assert.ok(loaded.community.log.length>0);
});
test('小路连续铺设真实扣石，倍率不叠加，不能跨水或挤入建筑',()=>{
 const{s,d}=setup('gather');s.player.x=1460;s.player.y=1640;const before=s.inventory.stone;assert.ok(G.place(s,'trail',1500,1640).ok);assert.ok(G.place(s,'trail',1530,1640).ok);assert.equal(s.inventory.stone,before-4);assert.equal(roadMultiplier(s,{x:1515,y:1640}),1.15);assert.equal(roadMultiplier(s,d),1);assert.equal(G.place(s,'trail',1531,1640).ok,false);assert.equal(G.place(s,'trail',0,0).ok,false);
 const loaded=G.parseSave(G.serialize(s));assert.equal(loaded.buildings.filter(b=>b.type==='trail').length,2);
});
test('前哨只连已建地点，折跃扣原晶共鸣、安全与等级约束，库存不跨图',()=>{
 const{s}=setup('gather'),a=facility(s,'outpost',1340,1740,{wood:9});const portal=s.nodes.find(n=>n.destination==='verdant');Object.assign(s.player,{x:portal.x,y:portal.y});assert.ok(G.enterWormhole(s,portal.id).ok);s.expedition.creatures=[];const b=facility(s,'outpost',1340,1740,{wood:7});Object.assign(s.player,{x:b.x,y:b.y});s.resonance=10;s.expedition.cooldown=0;const crystal=s.inventory.crystal;
 const r=communityAction(s,'travel',b.id,'home');assert.ok(r.ok);assert.equal(s.inventory.crystal,crystal-1);assert.equal(s.resonance,8);assert.equal(s.expedition.current,'home');assert.equal(a.inventory.wood,9);assert.equal(s.expedition.worlds.verdant.buildings.find(n=>n.id===b.id).inventory.wood,7);assert.equal(communityAction(s,'travel',a.id,'frost').ok,false);s.level=3;s.expedition.cooldown=0;assert.equal(communityAction(s,'travel',a.id,'verdant').ok,false);s.level=4;s.expedition.worlds.verdant.creatures=[{x:b.x,y:b.y,hp:50}];assert.equal(communityAction(s,'travel',a.id,'verdant').ok,false);
});
test('前哨休整每日一次，不跳时间、不远程取料；共建每地只扣一次',()=>{
 const{s}=setup('gather'),p=facility(s,'outpost',1260,1780);Object.assign(s.player,{x:p.x,y:p.y});s.inventory.ration=4;s.player.hp=30;s.player.clarity=30;const time=s.time,wood=s.inventory.wood;assert.ok(communityAction(s,'rest',p.id).ok);assert.equal(s.time,time);assert.equal(s.inventory.wood,wood-2);assert.equal(s.player.hp,55);assert.equal(communityAction(s,'rest',p.id).ok,false);
 assert.ok(communityAction(s,'project',p.id,'supply').ok);const after=G.serialize(s);assert.equal(communityAction(s,'project',p.id,'supply').ok,false);assert.equal(G.serialize(s),after);assert.deepEqual(G.parseSave(after).community.projects.supply,['home']);assert.equal(communityAction(s,'project',p.id,'beacon').ok,false);
});
test('共同体旧档补全，伪造重复共建、非法地点、无限日志被拒绝',()=>{
 const{s}=setup('gather');for(const mutate of [x=>x.community.projects.supply=['home','home'],x=>x.community.rests.bad=2,x=>x.community.requests.bay=3,x=>x.community.gardens=-1,x=>x.community.log=Array(61).fill({})]){const bad=G.parseSave(G.serialize(s));mutate(bad);assert.throws(()=>G.parseSave(G.serialize(bad)),/共同体|聚落|前哨|共建/);}
});

test('新旅程与旧存档的共同体页面均可渲染，图鉴先锁定，交互按真实条件禁用',async()=>{
 const {communityPanel,requestCard,outpostPanel}=await import('../dist/community-ui.js');
 const fresh=G.createGame();assert.match(communityPanel(fresh),/未发现/);assert.match(requestCard(fresh,'bay'),/disabled/);
 const {s}=setup('gardener'),p=facility(s,'outpost',1260,1780);assert.match(communityPanel(s),/管理三种机器人/);assert.match(outpostPanel(s,p),/旅行口粮/);
});

test('前哨附近可直接使用本站库存休整，远处库存不跨图消费',()=>{
 const{s}=setup('gather'),p=facility(s,'outpost',1260,1740,{wood:2,ration:1});s.inventory.wood=0;s.inventory.ration=0;Object.assign(s.player,{x:p.x,y:p.y,hunger:20});assert.ok(communityAction(s,'rest',p.id).ok);assert.equal(p.inventory.ration,0);assert.equal(p.inventory.wood,0);assert.equal(s.player.hunger,50);assert.equal(communityAction(s,'travel',p.id,'__proto__').ok,false);
});
