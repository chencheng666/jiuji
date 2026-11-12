import test from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../dist/survival.js';
import {NIGHT_ROSTER,selectNightKind,stepNightCreatures} from '../dist/night-creatures.js';
import {terrainPush,boarKnockback,fellImpactTree} from '../dist/terrain-impact.js';
import {steamAction,steamState,stepSteam} from '../dist/steam.js';
import {nightBestiary} from '../dist/night-view.js';
const setup=()=>{const s=G.createOdysseyGame(410);s.time=250;s.nodes=[];s.buildings=[];s.expedition.creatures=[];s.enemies=[];return s;};
const mob=(s,kind,x=s.player.x-170,y=s.player.y)=>{const m={id:'night-'+s.enemies.length,kind,x,y,hp:NIGHT_ROSTER[kind].hp,cooldown:0};s.enemies.push(m);return m;};
const rules={walkable:()=>true,lightAt:()=>false};
const tick=(s,seconds,opts=rules)=>{for(let i=0;i<Math.round(seconds*20);i++){s.time+=.05;stepNightCreatures(s,.05,opts);}};
const tree=(s,x,y)=>{const n={id:'t'+s.nodes.length,type:'tree',x,y,hp:3,available:true,respawnAt:0};s.nodes.push(n);return n;};
test('夜怪按等级与天数逐步出现，支援与吞火怪不会重复成群',()=>{
 const s=setup();for(const roll of[0,.2,.8,.999])assert.equal(selectNightKind(s,roll),'scorpion');s.level=4;s.time=1750;const all=new Set(Array.from({length:100},(_,i)=>selectNightKind(s,i/100)));assert.equal(all.size,5);mob(s,'howler');mob(s,'devourer');for(let i=0;i<100;i++)assert.ok(!['howler','devourer'].includes(selectNightKind(s,i/100)));
});
test('影蝎先锁定毒液落点，侧移避开，不追踪玩家实时坐标',()=>{
 const s=setup(),m=mob(s,'scorpion');tick(s,.05);assert.equal(m.warning.kind,'poison');const locked=m.warning.y;s.player.y+=140;tick(s,1.3);assert.equal(s.nightEncounter.hazards[0].y,locked);assert.equal(s.player.hp,100);s.player.y=locked;const hp=s.player.hp;tick(s,.5);assert.ok(s.player.hp<hp);const hp2=s.player.hp;tick(s,.5,{...rules,lightAt:()=>true});assert.equal(s.player.hp,hp2);
});
test('同类毒液和蝠雾不叠加，蝠雾仅自身意识损耗火外为火内两倍',()=>{
 const one=setup(),two=setup();const zone=(s,kind)=>({kind,x:s.player.x,y:s.player.y,radius:100,until:s.time+10});for(const s of[one,two])s.nightEncounter={realm:'home',hazards:[zone(s,'poison'),zone(s,'poison'),zone(s,'bats'),zone(s,'bats')],fogUntil:0};tick(one,1);tick(two,1,{...rules,lightAt:()=>true});assert.ok(Math.abs(one.player.hp-98.5)<1e-6);assert.ok(Math.abs(one.player.clarity-99)<1e-6);assert.ok(Math.abs(two.player.clarity-99.5)<1e-6);assert.equal(two.player.hp,100);
});
test('夜嚎者光环不叠加，击倒支援者或将其逼入光中就失效',()=>{
 const s=setup(),a=mob(s,'howler',s.player.x-240),b=mob(s,'howler',s.player.x-250),c=mob(s,'boneboar',s.player.x-220);tick(s,.05);assert.equal(c.boosted,true);a.hp=0;b.hp=0;tick(s,.05);assert.equal(c.boosted,false);a.hp=48;b.hp=48;tick(s,.05,{...rules,lightAt:(s,x)=>x<=s.player.x-230});assert.equal(c.boosted,false);
});
test('瞬移先展示落点，结束时复核地形与火光，不直接造成伤害',()=>{
 const s=setup(),m=mob(s,'howler',s.player.x-100);tick(s,.05);assert.equal(m.warning.kind,'blink');const start={x:m.x,y:m.y};tick(s,1.15,{...rules,walkable:()=>false});assert.deepEqual({x:m.x,y:m.y},start);assert.equal(s.player.hp,100);
});
test('蚀者吞火有1.8秒预警，攻击打断，单次限额与余火保证有效',()=>{
 const s=setup(),p=s.player,m=mob(s,'devourer',p.x-240);const fire={id:'f',type:'campfire',x:p.x,y:p.y,fuel:30};s.buildings.push(fire);tick(s,.05);assert.equal(m.warning.kind,'snuff');assert.equal(fire.fuel,30);
 s.inventory.bow=1;s.inventory.arrow=2;s.durability.bow=100;s.expedition.equipped='bow';assert.ok(G.attack(s).ok);assert.equal(m.warning,null);tick(s,2);assert.equal(fire.fuel,30);
 m.cooldown=0;m.snuffUntil=0;tick(s,.05);tick(s,1.8);assert.equal(fire.fuel,22);m.cooldown=0;m.snuffUntil=0;fire.fuel=13;tick(s,.05);tick(s,1.8);assert.equal(fire.fuel,8);
});
test('蚀者不能吞火炬和长明灯；残血狂暴仍畏光',()=>{
 const s=setup(),m=mob(s,'devourer');s.torchOn=true;s.torchFuel=90;s.buildings.push({id:'light',type:'lantern',x:s.player.x,y:s.player.y,fuel:0});m.hp=15;tick(s,.05);assert.notEqual(m.state,'retreat');assert.equal(s.torchFuel,90);tick(s,.05,{...rules,lightAt:()=>true});assert.equal(m.state,'retreat');assert.equal(m.warning,null);
});
test('冲锋被成树阻挡，掉落留在地面且只能结算一次，不生成背包奖励',()=>{
 const s=setup(),a={x:1100,y:1640},t=tree(s,1160,1640),before=s.inventory.wood||0,eco=s.ecology;const r=terrainPush(s,a,{x:1300,y:1640},rules.walkable);assert.equal(r.tree,t);assert.ok(a.x<1160);assert.equal(t.available,false);assert.equal(s.nodes.filter(n=>n.type==='brokenwood').length,1);assert.equal(s.inventory.wood||0,before);assert.ok(s.ecology<eco);assert.equal(fellImpactTree(s,t),false);assert.equal(s.nodes.filter(n=>n.type==='brokenwood').length,1);assert.ok(G.parseSave(G.serialize(s)));
});
test('野猪把玩家撞到树上会额外损失生命与意识，受阻时不穿树或穿海',()=>{
 const s=setup(),p=s.player,t=tree(s,p.x+50,p.y),before=p.x;boarKnockback(s,{x:p.x-50,y:p.y},rules.walkable);assert.ok(p.x>before&&p.x<t.x);assert.equal(p.hp,96);assert.equal(p.clarity,94);const x=p.x;boarKnockback(s,{x:p.x-50,y:p.y},()=>false);assert.equal(p.x,x);
});
test('碎骨野猪撞树硬直，不越过树继续远程命中玩家',()=>{
 const s=setup(),p=s.player,m=mob(s,'boneboar',p.x-200);tree(s,p.x-100,p.y);tick(s,.05);assert.equal(m.warning.kind,'charge');tick(s,1.1);assert.equal(p.hp,100);assert.equal(m.state,'recover');assert.ok(m.cooldown>1.5);assert.ok(m.x<p.x-100);
});
test('遭遇才点亮夜间图鉴；临时区域与警告不跨读档或白昼继续',()=>{
 const s=setup(),m=mob(s,'bloodbats');assert.match(nightBestiary(s),/0\/5/);tick(s,.05);assert.ok(s.discoveries.includes('night:bloodbats'));assert.match(nightBestiary(s),/1\/5/);const loaded=G.parseSave(G.serialize(s));assert.equal(loaded.nightEncounter,null);assert.equal(loaded.enemies.length,0);s.time=10;G.step(s,.1);assert.equal(s.nightEncounter,null);
});
test('蒸汽工坊先科技解锁，创造模式也不能绕过；未研究的存量工坊停止生产',()=>{
 const s=setup();s.level=9;s.odyssey.creative=true;const r=G.RECIPES.find(r=>r.id==='steamworks');assert.match(G.recipeReason(s,r),/蒸汽传动/);const b={id:'steam',type:'steamworks',x:s.player.x,y:s.player.y,inventory:{wood:10}};s.buildings.push(b);steamState(b).enabled=true;stepSteam(s,12);assert.equal(b.inventory.wood,10);assert.equal(steamAction(s,'toggle',b.id).ok,false);s.tech.push('steamcraft');assert.equal(G.recipeReason(s,r),'');assert.ok(steamAction(s,'toggle',b.id).ok);
});
