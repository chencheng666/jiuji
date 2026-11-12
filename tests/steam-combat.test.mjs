import test from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../dist/survival.js';
import {steamState,steamAction,stepSteam,steamStatus} from '../dist/steam.js';
import {stepNightCreatures} from '../dist/night-creatures.js';
import {robotStores} from '../dist/robotics.js';
const setup=()=>{const s=G.createOdysseyGame(44);s.level=3;s.tech.push('steamcraft');s.enemies=[];s.expedition.creatures=[];return s;};
const workshop=s=>{const b={id:'steam-test',type:'steamworks',x:s.player.x,y:s.player.y,fuel:0,stored:0,productionAt:0,readyAt:0,inventory:{wood:10,ore:3,seed:2,grass:4}};s.buildings.push(b);return b;};
const tick=(s,seconds)=>{for(let i=0;i<seconds*10;i++){s.time+=.1;stepSteam(s,.1);}};
const arm=(s,id='spear')=>{s.inventory[id]=1;s.durability[id]=G.ITEMS[id].durability;s.expedition.equipped=id;};
test('翻滚近战一次突进为双倍伤害，正常扣耐久，不刷新无敌或冷却',()=>{
 const s=setup();arm(s);const x=s.player.x;assert.ok(G.dodgeRoll(s,1,0).ok);s.enemies=[{id:'target',x:x+200,y:s.player.y,hp:100,cooldown:0}];assert.ok(G.attack(s).ok);assert.equal(s.enemies[0].hp,60);assert.equal(s.player.x,x+180);assert.equal(s.durability.spear,119);assert.equal(s.expedition.dodgeCooldown,3);assert.equal(s.expedition.invulnerable,.65);assert.equal(s.expedition.rollCombo,null);s.attackCooldown=0;G.attack(s);assert.equal(s.enemies[0].hp,40);
});
test('连招窗口到期、远程、空挥均不保留额外突进或翻倍',()=>{
 const s=setup();arm(s);G.dodgeRoll(s,1,0);s.time+=.6;s.enemies=[{id:'a',x:s.player.x+30,y:s.player.y,hp:100,cooldown:0}];G.attack(s);assert.equal(s.enemies[0].hp,80);
 s.attackCooldown=0;s.expedition.dodgeCooldown=0;arm(s,'bow');s.inventory.arrow=4;G.dodgeRoll(s,1,0);const x=s.player.x;s.enemies[0].x=x+150;G.attack(s);assert.equal(s.player.x,x);assert.equal(s.enemies[0].hp,61);
 s.attackCooldown=0;s.expedition.dodgeCooldown=0;arm(s);s.enemies=[];G.dodgeRoll(s,1,0);assert.equal(G.attack(s).ok,false);assert.equal(s.expedition.rollCombo,null);
});
test('安全突进不会穿入水域，临时连招状态读档清除',()=>{
 const s=setup();arm(s);s.player.x=3240;s.player.y=1640;G.dodgeRoll(s,1,0);G.attack(s);assert.ok(G.walkable(s,s.player.x,s.player.y));s.expedition.rollCombo={dx:1,dy:0,until:999};assert.equal(G.parseSave(G.serialize(s)).expedition.rollCombo,null);
});
test('蒸汽开单、木柴、余热与产物守恒，20件目标后不再扣料',()=>{
 const s=setup(),b=workshop(s),m=steamState(b);steamAction(s,'toggle',b.id);tick(s,24);assert.equal(b.inventory.board,2);assert.equal(b.inventory.wood,3);assert.equal(m.batches,2);assert.ok(m.heat<.001);m.enabled=false;const old=G.serialize(b);tick(s,10);assert.equal(G.serialize(b),old);b.inventory.board=20;m.enabled=true;tick(s,2);assert.equal(b.inventory.wood,3);assert.equal(m.job,null);
});
test('无燃料不开空单；中途燃料耗尽、满仓、停机和读档均保留在制品',()=>{
 const s=setup(),b=workshop(s),m=steamState(b);m.recipe='ingot';m.enabled=true;b.inventory={ore:3,wood:1};tick(s,1);assert.equal(m.job,null);assert.equal(b.inventory.ore,3);b.inventory.wood=2;m.heat=.5;tick(s,1);assert.equal(b.inventory.ore,0);m.enabled=false;const saved=G.parseSave(G.serialize(s)),mb=saved.buildings.find(x=>x.id===b.id).steam;assert.deepEqual(mb,m);m.enabled=true;m.job.remaining=0;b.inventory.ingot=9999;tick(s,1);assert.ok(m.job);assert.match(steamStatus(b),/出仓/);b.inventory.ingot=9998;tick(s,.1);assert.equal(b.inventory.ingot,9999);assert.equal(m.job,null);
});
test('蒸汽切配方、取放、拆除与搬运端点保持真实边界',()=>{
 const s=setup(),b=workshop(s),m=steamState(b);assert.ok(robotStores(s).includes(b));s.inventory.seed=2;assert.ok(G.transfer(s,b.id,'seed','in',1).ok);assert.equal(b.inventory.seed,3);assert.ok(steamAction(s,'recipe',b.id,'feed').ok);m.enabled=true;tick(s,10);assert.equal(b.inventory.feed,2);assert.equal(b.inventory.seed,1);assert.equal(b.inventory.grass,0);assert.match(G.dismantle(s,b.id).reason,/取空/);m.job={recipe:'feed',remaining:3};assert.equal(steamAction(s,'recipe',b.id,'board').ok,false);assert.equal(steamAction(s,'cool',b.id).ok,false);s.player.x+=500;assert.equal(steamAction(s,'toggle',b.id).ok,false);
});
test('旅程停止时蒸汽不生产，非法热量、订单、配方存档被拒绝',()=>{
 const s=setup(),b=workshop(s);steamState(b).enabled=true;for(const field of ['heat','recipe','job']){const bad=structuredClone(s),m=bad.buildings.find(x=>x.id===b.id).steam;m[field]=field==='heat'?999:field==='recipe'?'bad':{recipe:'board',remaining:-1};assert.throws(()=>G.parseSave(G.serialize(bad)),/蒸汽/);}
 const before=G.serialize(b);s.status="dead";G.step(s,1,{});assert.equal(G.serialize(b),before);
});
test('夜影锁定落点，侧移可避开；光圈和残血优先撤退',()=>{
 const s=setup(),p=s.player,e={id:'a',kind:'lancer',x:p.x-150,y:p.y,hp:35,cooldown:0};s.enemies=[e];const rules={walkable:()=>true,lightAt:()=>false};stepNightCreatures(s,.1,rules);assert.ok(e.warning);const target=e.warning.y;p.y+=100;stepNightCreatures(s,1,rules);assert.equal(e.y,target);assert.equal(p.hp,100);e.hp=10;e.cooldown=0;const d=Math.hypot(e.x-p.x,e.y-p.y);stepNightCreatures(s,.1,rules);assert.equal(e.state,'retreat');assert.ok(Math.hypot(e.x-p.x,e.y-p.y)>d);e.hp=35;stepNightCreatures(s,.1,{...rules,lightAt:()=>true});assert.equal(e.warning,null);assert.equal(p.hp,100);
});
test('野猪冲撞命中击退，闪避无敌或不通行落点不强推',async()=>{
 const {stepExpedition}=await import('../dist/expeditions.js');const s=setup(),p=s.player,m={id:'boar-test',kind:'boar',x:p.x-70,y:p.y,homeX:p.x-70,homeY:p.y,hp:70,cooldown:0,slow:0,stun:0,respawnAt:0,warning:{kind:'charge',damage:10,ox:p.x-70,oy:p.y,x:p.x,y:p.y,radius:58,left:.01,total:.8}};s.expedition.creatures=[m];const x=p.x;stepExpedition(s,.1,()=>true);assert.equal(p.x,x+72);assert.ok(p.hp<100);
 m.warning={kind:'charge',damage:10,ox:p.x-70,oy:p.y,x:p.x,y:p.y,radius:58,left:.01,total:.8};s.expedition.invulnerable=1;const x2=p.x,hp=p.hp;stepExpedition(s,.1,()=>true);assert.equal(p.x,x2);assert.equal(p.hp,hp);
});
