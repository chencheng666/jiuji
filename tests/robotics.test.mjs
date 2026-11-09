import test from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../dist/survival.js';
import {stepRobotics,roboticsAction,robotAt,ROBOT_TYPES,ROBOT_COST} from '../dist/robotics.js';
import {findLandPath,pathLength} from '../dist/navigation.js';
const key=p=>Math.floor(p.x/160)+','+Math.floor(p.y/160);
function setup(){
 const s=G.createOdysseyGame(52);s.level=2;s.tech.push('stonework','smelting','drilling','observe','robotics');
 Object.assign(s.inventory,{wood:100,stone:100,ingot:100,crystal:100,board:100,grass:100});
 s.nodes=s.nodes.filter(n=>!Object.hasOwn(ROBOT_TYPES,n.type));s.expedition.creatures=[];
 const position=G.placementNearPlayer(s,'robotdock');assert.ok(G.place(s,'robotdock',position.x,position.y).ok);const d=s.buildings.at(-1);
 assert.ok(roboticsAction(s,'assemble',d.id).ok);const r=robotAt(s,d.id);
 return{s,d,r};
}
function node(s,d,type='twig',dx=110,dy=0){const n={id:'robot-test-'+s.nodes.length,type,x:d.x+dx,y:d.y+dy,hp:1,available:true,respawnAt:0};s.nodes.push(n);s.explored.push(key(n));return n;}
function tick(s,seconds,check=()=>{}){for(let i=0;i<seconds*10;i++){s.time+=.1;stepRobotics(s,.1);check();}}
function start(s,d){roboticsAction(s,'fuel',d.id);roboticsAction(s,'fuel',d.id);roboticsAction(s,'toggle',d.id);}
test('工作站与组装受等级、科技、距离和材料约束，真实扣料且不能重复组装',()=>{
 const s=G.createOdysseyGame();assert.match(G.recipeReason(s,G.RECIPES.find(r=>r.id==='robotdock')),/2级/);
 const {s:a,d,r}=setup();assert.equal(a.inventory.ingot,100-2-ROBOT_COST.ingot);assert.equal(r.battery,0);assert.equal(roboticsAction(a,'assemble',d.id).ok,false);
 const crystal=a.inventory.crystal;assert.ok(roboticsAction(a,'fuel',d.id).ok);assert.equal(a.inventory.crystal,crystal-1);assert.equal(d.robotEnergy,60);roboticsAction(a,'fuel',d.id);assert.equal(d.robotEnergy,120);assert.equal(roboticsAction(a,'fuel',d.id).ok,false);
 a.player.x=2500;assert.equal(roboticsAction(a,'fuel',d.id).ok,false);assert.equal(roboticsAction(a,'collect',d.id).ok,false);
});
test('独立外出、真实采集、返程卸货、扣能充电；玩家站在远处仍运转',()=>{
 const{s,d,r}=setup(),n=node(s,d);const before=s.inventory.twig||0;start(s,d);s.player.x+=550;
 const positions=[];let sawCargo=false,sawReturning=false,sawCharging=false;
 tick(s,40,()=>{positions.push({x:r.x,y:r.y});sawCargo ||= (r.cargo.twig||0)>0;sawReturning ||= r.state==='returning';sawCharging ||= r.state==='charging';});
 assert.equal(n.available,false);assert.equal(s.inventory.twig||0,before);assert.equal(d.inventory.twig,3);assert.equal(r.delivered,3);assert.ok(r.trips>=1);assert.ok(sawCargo&&sawReturning&&sawCharging);assert.ok(positions.some(p=>G.distance(p,d)>70));assert.ok(G.distance(r,d)<3);assert.ok(d.robotEnergy<120);assert.ok(r.battery>90);
 s.player.x=d.x;s.player.y=d.y;assert.ok(roboticsAction(s,'collect',d.id).ok);assert.equal(s.inventory.twig,before+3);assert.equal(d.inventory.twig,0);assert.equal(roboticsAction(s,'collect',d.id).ok,false);
});
test('只采指定已探索范围，满目标停工，不采幼树、遗迹或任务资源',()=>{
 const{s,d,r}=setup(),unknown=node(s,d,'twig',190);s.explored=s.explored.filter(k=>k!==key(unknown));
 const far=node(s,d,'twig',330),other=node(s,d,'grass',50);d.inventory.twig=20;start(s,d);tick(s,25);assert.equal(r.reason,'目标库存已完成');assert.ok(unknown.available&&far.available&&other.available);
 d.inventory.twig=0;tick(s,10);assert.ok(unknown.available&&far.available&&other.available);assert.match(r.reason,/暂无安全/);
 s.explored.push(key(unknown));r.wakeAt=0;tick(s,12);assert.equal(unknown.available,false);assert.equal(far.available,true);assert.equal(other.available,true);
});
test('货箱不超载、资源不复制，目标库存达到后停止出发',()=>{
 const{s,d,r}=setup();for(let i=0;i<12;i++)node(s,d,'twig',50+i*8,20);
 start(s,d);let max=0;tick(s,150,()=>{max=Math.max(max,Object.values(r.cargo).reduce((a,b)=>a+b,0));});
 assert.ok(max<=16);assert.ok(d.inventory.twig>=20&&d.inventory.twig<=22);assert.equal(r.reason,'目标库存已完成');assert.ok(s.nodes.filter(n=>n.id.startsWith('robot-test')&&n.available).length>0);
 const harvested=s.nodes.filter(n=>n.id.startsWith('robot-test')&&!n.available).length;assert.equal(harvested*3,d.inventory.twig);
});
test('途中遇险立即返程，保留货物；营地附近有怪时不再次出发',()=>{
 const{s,d,r}=setup();node(s,d);start(s,d);tick(s,19);assert.ok(G.distance(r,d)>5);
 r.cargo.twig=2;s.enemies.push({id:'danger',x:r.x+20,y:r.y,hp:30});tick(s,.2);assert.equal(r.state,'returning');assert.match(r.reason,/遇险/);
 tick(s,5);assert.equal(d.inventory.twig,2);assert.match(r.reason,/危险/);assert.ok(G.distance(r,d)<3);
});
test('手动召回和中途变更任务先回站，不丢弃货物',()=>{
 const{s,d,r}=setup();node(s,d,'twig',180);start(s,d);tick(s,18);r.cargo.twig=2;
 assert.ok(roboticsAction(s,'resource',d.id,'grass').ok);assert.equal(r.state,'returning');assert.equal(r.cargo.twig,2);tick(s,5);assert.equal(d.inventory.twig,2);
 roboticsAction(s,'return',d.id);tick(s,4);assert.equal(r.enabled,false);assert.ok(G.distance(r,d)<3);
});
test('无电不出发，低电返站，满仓保留货物，不凭空消失',()=>{
 const{s,d,r}=setup();node(s,d);roboticsAction(s,'toggle',d.id);tick(s,5);assert.ok(G.distance(r,d)<3);assert.match(r.reason,/充能不足/);
 r.battery=60;r.wakeAt=0;tick(s,.5);assert.equal(r.state,'outbound');r.battery=19;tick(s,.1);assert.equal(r.state,'returning');tick(s,3);assert.ok(G.distance(r,d)<3);
 d.inventory.twig=9999;r.cargo.twig=3;r.wakeAt=0;tick(s,2);assert.equal(r.cargo.twig,3);assert.equal(d.inventory.twig,9999);assert.match(r.reason,/已满/);
 d.inventory.twig=9997;tick(s,3);assert.equal(d.inventory.twig,9999);assert.equal(r.cargo.twig,1);
});
test('存档中途恢复不重复采集；旧档补空机器人系统，恶意数据拒绝',()=>{
 let{s,d,r}=setup();node(s,d);start(s,d);tick(s,19);const before=r.battery;s=G.parseSave(G.serialize(s));r=s.robotics.robots[0];d=s.buildings.find(b=>b.id===r.dockId);assert.equal(r.battery,before);tick(s,25);assert.equal(d.inventory.twig,3);assert.equal(r.delivered,3);
 const legacy=G.createOdysseyGame();delete legacy.robotics;assert.deepEqual(G.parseSave(G.serialize(legacy)).robotics.robots,[]);
 for(const mutate of [s=>s.robotics.robots[0].battery=NaN,s=>s.robotics.robots[0].cargo.twig=17,s=>s.robotics.robots[0].dockId='missing',s=>s.robotics.robots.push(s.robotics.robots[0]),s=>s.buildings.find(b=>b.type==='robotdock').robotEnergy=121]){const bad=G.parseSave(G.serialize(s));mutate(bad);assert.throws(()=>G.parseSave(G.serialize(bad)),/机器人|晶能/);}
});
test('切图后机器人位置、货物与电量暂停，暂停和离线不推进',()=>{
 const{s,d,r}=setup();node(s,d);start(s,d);tick(s,19);const before=JSON.stringify(r),home={nodes:s.nodes,buildings:s.buildings};s.expedition.worlds.home=home;s.expedition.current='verdant';s.nodes=[];s.buildings=[];tick(s,120);assert.equal(JSON.stringify(r),before);
 s.expedition.current='home';s.nodes=home.nodes;s.buildings=home.buildings;delete s.expedition.worlds.home;tick(s,30);assert.equal(d.inventory.twig,3);
 const raw=G.serialize(s),loaded=G.parseSave(raw);assert.equal(loaded.robotics.robots[0].battery,r.battery);
});
test('工作站有机器人不可拆除；收回材料可用于合成而不远程取料',()=>{
 const{s,d}=setup();assert.match(G.dismantle(s,d.id).reason,/机器人/);d.inventory.twig=9;s.inventory.twig=0;assert.equal(G.craftAmount(s,'twig'),9);s.player.x+=500;assert.equal(G.craftAmount(s,'twig'),0);
});
test('陆地寻路绕开水面，机器人与玩家共用且无路时不穿水',()=>{
 const pass=(x,y)=>x>=0&&x<700&&y>=0&&y<700&&!(x>200&&x<400&&y<490),from={x:100,y:100},to={x:550,y:100};const path=findLandPath(from,to,pass);assert.ok(path);assert.ok(pathLength(from,path)>700);let previous=from;for(const p of path){for(let i=1;i<=20;i++)assert.ok(pass(previous.x+(p.x-previous.x)*i/20,previous.y+(p.y-previous.y)*i/20));previous=p;}assert.equal(findLandPath(from,to,(x,y)=>pass(x,y)&&y<490),null);
});
test('真实虫洞切图与离开时存档可恢复，工作站和机器人一一对应',()=>{
 let{s,d,r}=setup();node(s,d);start(s,d);tick(s,19);const old=JSON.stringify(r),portal=s.nodes.find(n=>n.type==='wormhole'&&n.destination==='verdant');s.player.x=portal.x;s.player.y=portal.y;assert.ok(G.enterWormhole(s,portal.id).ok);s=G.parseSave(G.serialize(s));assert.equal(JSON.stringify(s.robotics.robots[0]),old);tick(s,20);assert.equal(JSON.stringify(s.robotics.robots[0]),old);
 const back=s.nodes.find(n=>n.type==='wormhole'&&n.destination==='home');s.expedition.cooldown=0;s.player.x=back.x;s.player.y=back.y;assert.ok(G.enterWormhole(s,back.id).ok);s=G.parseSave(G.serialize(s));tick(s,25);d=s.buildings.find(b=>b.id===d.id);assert.equal(d.inventory.twig,3);assert.equal(s.robotics.robots[0].delivered,3);
});
test('玩家抢先采走同一资源时，机器人不重复获得材料',()=>{
 const{s,d,r}=setup(),n=node(s,d);start(s,d);tick(s,17);n.available=false;n.hp=0;tick(s,15);assert.equal(d.inventory.twig||0,0);assert.equal(r.delivered,0);assert.equal(r.cargo.twig||0,0);
});
test('召回卸空后可回收搬迁，材料只返还一次；满行囊不丢机体',()=>{
 const{s,d,r}=setup();r.enabled=true;assert.equal(roboticsAction(s,'pack',d.id).ok,false);r.enabled=false;s.inventory.ingot=9999;assert.equal(roboticsAction(s,'pack',d.id).ok,false);assert.equal(s.robotics.robots.length,1);s.inventory.ingot=10;assert.ok(roboticsAction(s,'pack',d.id).ok);assert.equal(s.inventory.ingot,13);assert.equal(s.robotics.robots.length,0);assert.equal(roboticsAction(s,'pack',d.id).ok,false);assert.ok(G.dismantle(s,d.id).ok);
});
