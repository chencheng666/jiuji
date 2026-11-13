import test from 'node:test';
import assert from 'node:assert/strict';
import {NightModels,nightBudget,nightPose,drawNightModel,drawNightLinks} from '../dist/night-models.js';
import {solveJoint,travelerPose} from '../dist/character-view.js';
import {createOdysseyGame,serialize} from '../dist/survival.js';
import {NIGHT_ROSTER,stepNightCreatures} from '../dist/night-creatures.js';
const context=()=>new Proxy({calls:[]},{get(o,k){if(k in o)return o[k];return(...a)=>o.calls.push([k,...a]);}});
function freeze(o){if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;}
const state=()=>{const s=createOdysseyGame(410);s.time=1750;s.nodes=[];s.buildings=[];s.enemies=[];return s;};
test('五类程序模型在两遍夜色绘制、狂暴与技能状态下不改存档，关节坐标均为有限数',()=>{
 const s=state();for(const kind of Object.keys(NIGHT_ROSTER))for(const reducedMotion of[false,true])for(const warning of[null,{kind:'blink',left:.1,total:1.1},{kind:'snuff',left:.3,total:1.8,x:170,y:100}]){
  const e={id:kind,kind,x:100,y:100,hp:10,state:'stalk',warning,visualEvent:{kind:'impact',at:s.time-.2}};
  s.enemies=[e];const frozen=freeze(structuredClone(s)),before=serialize(frozen),c=context(),view={mobile:true,reducedMotion,nightModels:new NightModels()};
  assert.ok(drawNightModel(c,frozen,frozen.enemies[0],view));assert.ok(drawNightModel(c,frozen,frozen.enemies[0],view,true));drawNightLinks(c,frozen,view);assert.equal(serialize(frozen),before);
  for(const[name,...args]of c.calls)for(const arg of args)if(typeof arg==='number')assert.ok(Number.isFinite(arg),name+'不得出现无效坐标');
 }
});
test('模型和余迹有硬上限，停表不重复写入、瞬移不连线、换图与回退时间清空旧轨迹',()=>{
 const s=state(),m=new NightModels(),view={mobile:true};s.enemies=[{id:'s',kind:'scorpion',x:0,y:0}];
 for(let i=0;i<400;i++){s.time+=.15;s.enemies[0].x+=4;m.sync(s,view);m.rig({id:i,kind:Object.keys(NIGHT_ROSTER)[i%5]});}
 assert.ok(m.rigs.size<=20);assert.ok(m.tracks.get('s').points.length<=12);const n=m.tracks.get('s').points.length;for(let i=0;i<40;i++)m.sync(s,view);assert.equal(m.tracks.get('s').points.length,n);
 s.enemies[0].x+=250;s.time+=.2;m.sync(s,view);assert.equal(m.tracks.get('s').points.length,1);
 s.expedition.current='copper';s.enemies=[];m.sync(s,view);assert.equal(m.tracks.size,0);s.time-=500;m.sync(s,view);assert.equal(m.tracks.size,0);
 s.enemies=[{id:'s',kind:'scorpion',x:0,y:0}];m.sync(s,{reducedMotion:true});assert.equal(m.tracks.size,0);
});
test('减少动态保留固定形态、技能进度与核光，关闭粒子限制电弧和余迹',()=>{
 assert.equal(nightBudget({reducedMotion:true}).particles,0);assert.equal(nightBudget({particles:false}).trails,0);assert.ok(nightBudget({mobile:true}).bats<nightBudget({}).bats);
 const s=state(),e={kind:'devourer',hp:10,state:'stalk',x:10,y:10,warning:{kind:'blink',left:.1,total:1}};
 const a=nightPose(s,e,{reducedMotion:true});s.time+=20;const b=nightPose(s,e,{reducedMotion:true});assert.equal(a.t,b.t);assert.equal(a.blinkOut,0);assert.equal(a.moving,false);assert.ok(a.scale>1);
});
test('瞬移事件只在落点复核通过后产生，吞火外形增长只来自实际消耗',()=>{
 const s=state(),p=s.player,e={id:'a',kind:'howler',hp:48,x:p.x-100,y:p.y,cooldown:0,warning:{kind:'blink',x:p.x+220,y:p.y,left:0,total:1}};s.enemies=[e];
 stepNightCreatures(s,.05,{walkable:()=>false,lightAt:()=>false});assert.equal(e.visualEvent,undefined);e.warning={kind:'blink',x:p.x+220,y:p.y,left:0,total:1};stepNightCreatures(s,.05,{walkable:()=>true,lightAt:()=>false});assert.equal(e.visualEvent.kind,'blink');assert.equal(e.visualEvent.ox,p.x-100);
 e.kind='devourer';e.hp=82;s.buildings=[{id:'f',type:'campfire',x:e.x,y:e.y,fuel:8}];e.warning={kind:'snuff',fireId:'f',left:0,total:1};stepNightCreatures(s,.05,{walkable:()=>true,lightAt:()=>false});assert.equal(e.firesConsumed,undefined);
 s.buildings[0].fuel=20;e.warning={kind:'snuff',fireId:'f',left:0,total:1};stepNightCreatures(s,.05,{walkable:()=>true,lightAt:()=>false});assert.equal(e.firesConsumed,1);assert.equal(e.visualEvent.kind,'snuff');assert.equal(s.buildings[0].fuel,12);
});
test('人物两段关节保持骨长，左右脚交替抬起；减少动态不冻结真实攻击反馈',()=>{
 const a={x:0,y:0},b={x:12,y:13},joint=solveJoint(a,b,12,12);assert.ok(Math.abs(Math.hypot(joint.x,joint.y)-12)<1e-8);assert.ok(Math.abs(Math.hypot(joint.x-b.x,joint.y-b.y)-12)<1e-8);
 for(const b of[{x:0,y:0},{x:100,y:0}])assert.ok(Number.isFinite(solveJoint(a,b,12,12).x));
 const s=state();s.player.walk=.2;const first=travelerPose(s);s.player.walk+=Math.PI/2;const second=travelerPose(s);assert.ok(first.leftFoot.y<0);assert.ok(second.rightFoot.y<0);
 s.expedition.shot={at:s.time-.1,until:s.time+.2,duration:.3};assert.equal(travelerPose(s,true).strike,.5);assert.equal(travelerPose(s,true).bob,0);
});
