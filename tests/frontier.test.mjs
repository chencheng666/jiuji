import test from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../dist/survival.js';
import {ENCOUNTERS,JOBS,initFrontier,chooseEncounter,claimDelivery,frontierAction,stepFrontier} from '../dist/frontier.js';
const tick=(s,n)=>{for(let i=0;i<Math.ceil(n*10);i++)G.step(s,.1);};
const ready=(level=7)=>{const s=G.createGame();s.level=level;s.inventory=Object.fromEntries(Object.keys(G.ITEMS).map(k=>[k,100]));s.resonance=60;s.tech=G.TECHS.map(t=>t.id);return s;};
const cross=(s,to)=>{const n=s.nodes.find(n=>n.destination===to);assert.ok(n);s.player.x=n.x;s.player.y=n.y;s.expedition.cooldown=0;assert.ok(G.enterWormhole(s,n.id).ok);};
const build=(s,type)=>{const p=G.placementNearPlayer(s,type);assert.ok(p);assert.ok(G.place(s,type,p.x,p.y).ok);const b=s.buildings.at(-1);s.player.x=b.x;s.player.y=b.y;return b;};
const choose=(s,id,choice)=>{const n=s.nodes.find(n=>n.eventId===id);assert.ok(n);s.player.x=n.x;s.player.y=n.y;return chooseEncounter(s,id,choice);};
test('遭遇有材料取舍和有效游玩后的回信，必须回原岛手记台领取且只能一次',()=>{
 const s=ready(),desk=build(s,'fielddesk');cross(s,'verdant');const before=s.inventory.seed;assert.ok(choose(s,'verdant-grove','plant').ok);assert.equal(s.inventory.seed,before-3);assert.equal(choose(s,'verdant-grove','bridge').ok,false);assert.equal(s.frontier.deliveries.length,1);
 stepFrontier(s,59);assert.equal(claimDelivery(s,'verdant-grove').ok,false);stepFrontier(s,1);assert.equal(claimDelivery(s,'verdant-grove').ok,false);
 const saved=G.parseSave(G.serialize(s));cross(saved,'home');saved.player.x=desk.x;saved.player.y=desk.y;const wood=saved.inventory.wood;assert.ok(claimDelivery(saved,'verdant-grove').ok);assert.equal(saved.inventory.wood,wood+6);assert.equal(claimDelivery(saved,'verdant-grove').ok,false);cross(saved,'verdant');assert.equal(saved.nodes.find(n=>n.eventId==='verdant-grove').available,false);
});
test('远程、缺料、满包与重复选择均不扣料；即时路线不偷偷产生回信',()=>{
 const s=ready();cross(s,'verdant');const n=s.nodes.find(n=>n.eventId==='verdant-grove'),before=s.inventory.seed;assert.equal(chooseEncounter(s,n.eventId,'plant').ok,false);assert.equal(s.inventory.seed,before);
 s.player.x=n.x;s.player.y=n.y;s.inventory.seed=2;assert.equal(chooseEncounter(s,n.eventId,'plant').ok,false);s.inventory.seed=10;s.inventory.wildpod=9999;assert.equal(chooseEncounter(s,n.eventId,'plant').ok,false);assert.equal(s.inventory.seed,10);
 assert.ok(chooseEncounter(s,n.eventId,'bridge').ok);assert.equal(s.frontier.deliveries.length,0);assert.equal(s.inventory.wood,94);
});
test('回信满包时保留，腾出位置后才能完整领取',()=>{
 const s=ready(),d=build(s,'fielddesk');cross(s,'verdant');choose(s,'verdant-grove','plant');stepFrontier(s,60);cross(s,'home');s.player.x=d.x;s.player.y=d.y;s.inventory.wood=9998;assert.equal(claimDelivery(s,'verdant-grove').ok,false);assert.equal(s.frontier.deliveries.length,1);s.inventory.wood=9993;assert.ok(claimDelivery(s,'verdant-grove').ok);assert.equal(s.inventory.wood,9999);
});
test('三批订单一次扣足，当前地图完成并限额领取，刷新不重复产出',()=>{
 const s=ready(4),b=build(s,'relaywork');const flower=s.inventory.flower,res=s.resonance;assert.ok(frontierAction(s,b,'job:stardew:3').ok);assert.equal(s.inventory.flower,flower-9);assert.equal(s.resonance,res-9);assert.equal(frontierAction(s,b,'job:stardew:1').ok,false);tick(s,10);const remaining=b.project.remaining;
 cross(s,'verdant');tick(s,5);cross(s,'home');assert.equal(s.buildings.find(x=>x.id===b.id).project.remaining,remaining);s.player.x=b.x;s.player.y=b.y;
 stepFrontier(s,200);assert.equal(b.inventory.stardew,3);assert.equal(s.frontier.orders,3);s.inventory.stardew=9998;assert.ok(frontierAction(s,b,'frontier-collect').ok);assert.equal(b.inventory.stardew,2);s.inventory.stardew=9999;assert.equal(frontierAction(s,b,'frontier-collect').ok,false);
 const saved=G.parseSave(G.serialize(s));stepFrontier(saved,200);assert.equal(saved.buildings.find(x=>x.id===b.id).inventory.stardew,2);
});
test('订单等级、设施、批次与容量受约束，缺料不会部分扣除',()=>{
 const s=ready(4),b=build(s,'relaywork'),stock=JSON.stringify(s.inventory);assert.equal(frontierAction(s,b,'job:restore:1').ok,false);assert.equal(frontierAction(s,b,'job:stardew:2').ok,false);assert.equal(frontierAction(s,b,'job:compost:1').ok,false);assert.equal(frontierAction(s,b,'job:constructor:1').ok,false);assert.equal(JSON.stringify(s.inventory),stock);s.resonance=2;assert.equal(frontierAction(s,b,'job:stardew:1').ok,false);assert.equal(JSON.stringify(s.inventory),stock);
});
test('堆肥追肥每轮一次，设施改良永久生效且不改写在制品',()=>{
 const s=ready();s.homestead.completed=['verdant-well'];const bed=build(s,'nursery');assert.ok(frontierAction(s,bed,'improve').ok);assert.equal(frontierAction(s,bed,'improve').ok,false);assert.ok(G.stationAction(s,'sow:root',bed.id).ok);assert.equal(Math.round(bed.crop.readyAt-s.time),72);const c=s.inventory.compost;assert.ok(frontierAction(s,bed,'fertilize').ok);assert.equal(s.inventory.compost,c-1);assert.equal(Math.round((bed.crop.readyAt-s.time)*10),432);assert.equal(frontierAction(s,bed,'fertilize').ok,false);assert.equal(frontierAction(s,bed,'improve').ok,false);
 const loaded=G.parseSave(G.serialize(s));assert.equal(loaded.buildings.find(x=>x.id===bed.id).crop.fertilized,true);
});
test('改良工坊缩短订单，二级堆肥可供养土地且生态满时不消费',()=>{
 const s=ready(),b=build(s,'composter');assert.ok(frontierAction(s,b,'improve').ok);assert.ok(frontierAction(s,b,'job:compost:1').ok);assert.equal(b.project.remaining,33.75);stepFrontier(s,34);assert.equal(b.inventory.compost,2);s.ecology=99;assert.ok(frontierAction(s,b,'soil').ok);assert.equal(s.ecology,100);const before=s.inventory.compost;assert.equal(frontierAction(s,b,'soil').ok,false);assert.equal(s.inventory.compost,before);
});
test('六级织造使营地补给可循环，但仍消耗星露与共鸣',()=>{
 const s=ready(6),b=build(s,'matterloom'),r=s.resonance,wood=s.inventory.wood;assert.ok(frontierAction(s,b,'job:timber:1').ok);assert.equal(s.resonance,r-4);stepFrontier(s,50);assert.ok(frontierAction(s,b,'frontier-collect').ok);assert.equal(s.inventory.wood,wood+20);assert.ok(frontierAction(s,b,'job:flora:3').ok);assert.equal(s.resonance,r-16);
});
test('守护需要先接触当地，完成后限制重复派送并保留回赠',()=>{
 const s=ready(),b=build(s,'aidbeacon');assert.equal(frontierAction(s,b,'aid:verdant:seed').ok,false);cross(s,'verdant');assert.ok(choose(s,'verdant-bank','record').ok);cross(s,'home');s.player.x=b.x;s.player.y=b.y;const seed=s.inventory.seed;assert.ok(frontierAction(s,b,'aid:verdant:seed').ok);assert.equal(s.inventory.seed,seed-8);assert.equal(frontierAction(s,b,'aid:verdant:seed').ok,false);stepFrontier(s,100);assert.equal(s.frontier.aidDone.verdant,1);assert.equal(b.inventory.seal,1);assert.ok(frontierAction(s,b,'frontier-collect').ok);assert.equal(frontierAction(s,b,'aid:verdant:seed').ok,false);stepFrontier(s,180);assert.ok(frontierAction(s,b,'aid:verdant:crop').ok);
});
test('旧版六级存档迁移，九处事件都在陆地且反复初始化不增加节点',()=>{
 const s=ready();cross(s,'verdant');const old=JSON.parse(G.serialize(s));old.version=6;delete old.frontier;old.nodes=old.nodes.filter(n=>n.type!=='encounter');const migrated=G.parseSave(JSON.stringify(old));assert.equal(migrated.version,G.VERSION);const length=migrated.nodes.length;initFrontier(migrated);assert.equal(migrated.nodes.length,length);for(const map of ['verdant','cinder','frost']){if(migrated.expedition.current!==map){if(map==='verdant')cross(migrated,'home');cross(migrated,map);}const events=migrated.nodes.filter(n=>n.type==='encounter');assert.equal(events.length,3);assert.ok(events.every(n=>G.isLand(n.x,n.y)));}assert.equal(ENCOUNTERS.length,9);
});
test('拒绝不受支持的事件、回信、生产与追肥存档字段',()=>{
 const s=ready(),b=build(s,'relaywork');frontierAction(s,b,'job:stardew:1');const raw=G.serialize(s);
 for(const modify of [x=>delete x.frontier,x=>x.frontier.choices={unknown:'foo'},x=>x.frontier.deliveries=[{id:'verdant-grove',remaining:0}],x=>x.frontier.aidDone={unknown:1},x=>x.buildings[0].project.id='constructor',x=>x.buildings[0].project.count=100,x=>x.buildings[0].project.remaining=-1,x=>x.frontier.orders=NaN]){const obj=JSON.parse(raw);modify(obj);assert.throws(()=>G.parseSave(JSON.stringify(obj)));}
});
