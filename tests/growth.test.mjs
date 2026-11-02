import test from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../dist/survival.js';
import {growthStatus} from '../dist/growth.js';
const tick=(s,seconds)=>{for(let i=0;i<Math.ceil(seconds*10);i++)G.step(s,.1);};
const harvest=(s,type)=>{const n=s.nodes.find(n=>n.type===type&&n.available&&G.walkable(s,n.x,n.y));assert.ok(n,'存在可采集的'+type);Object.assign(s.player,{x:n.x,y:n.y});for(let i=0;i<G.NODES[type].hp;i++){assert.ok(G.interact(s,n.id).ok);tick(s,G.NODES[type].time+.1);}return n;};
const build=(s,type)=>{const p=G.placementNearPlayer(s,type);assert.ok(p);assert.ok(G.place(s,type,p.x,p.y).ok);return s.buildings.at(-1);};

test('新旅程只用采集、制作与播种打通共生研究，不需预先解锁农圃',()=>{
 const s=G.createGame();
 harvest(s,'twig');harvest(s,'twig');harvest(s,'flint');harvest(s,'flint');
 assert.ok(G.craft(s,'axe').ok);assert.ok(G.craft(s,'pickaxe').ok);
 for(let i=0;i<4;i++)harvest(s,'tree');
 harvest(s,'rock');harvest(s,'rock');harvest(s,'grass');harvest(s,'flower');
 const table=build(s,'table');Object.assign(s.player,{x:table.x,y:table.y});
 assert.ok(G.research(s,'observe').ok);assert.match(G.research(s,'steward').reason,/播种/);
 const camp=build(s,'campfire');Object.assign(s.player,{x:camp.x,y:camp.y});
 assert.ok(G.stationAction(s,'meditate',camp.id).ok);assert.equal(s.resonance,4);
 for(let i=0;i<3;i++){const p=G.plantingNearPlayer(s);assert.ok(p);assert.equal(G.plantingReason(s,p.x,p.y),'');assert.ok(G.plant(s,p.x,p.y).ok);}
 assert.equal(s.tech.includes('steward'),false);assert.equal(s.stats.planted,3);
 const before=s.resonance;tick(s,86);assert.equal(s.resonance,before+3);
 Object.assign(s.player,{x:table.x,y:table.y});assert.ok(G.research(s,'steward').ok);
 assert.equal(s.resonance,3);assert.equal(s.stats.planted,3);
 const loaded=G.parseSave(G.serialize(s));assert.equal(loaded.tech.includes('steward'),true);assert.equal(loaded.stats.planted,3);
});

test('播种遇到占用点可换空地，显式无效位置不扣种子、不增加进度',()=>{
 const s=G.createGame();s.inventory.seed=4;
 s.buildings.push({id:'test-camp',type:'campfire',x:s.player.x+35,y:s.player.y+35,fuel:150});
 assert.notEqual(G.plantingReason(s,s.player.x+35,s.player.y+35),'');
 assert.ok(G.useItem(s,'seed').ok);const planted=s.nodes.at(-1);assert.ok(G.distance(planted,s.buildings[0])>=55);
 assert.equal(s.inventory.seed,3);const before=s.ecology;
 for(const p of[{x:planted.x,y:planted.y},{x:NaN,y:s.player.y},{x:0,y:0},{x:s.player.x+200,y:s.player.y}]){
  assert.equal(G.plant(s,p.x,p.y).ok,false);assert.equal(s.inventory.seed,3);assert.equal(s.stats.planted,1);assert.equal(s.ecology,before);
 }
 s.status='dead';assert.equal(G.plant(s).ok,false);assert.equal(s.inventory.seed,3);
});

test('补种修复生态，树苗成长奖励只结算一次，旧存档接续不重复发放',()=>{
 const s=G.createGame();s.inventory.seed=3;s.ecology=50;
 for(let i=0;i<3;i++)assert.ok(G.plant(s).ok);
 assert.equal(s.ecology,59);assert.equal(s.resonance,0);
 const loaded=G.parseSave(G.serialize(s));tick(loaded,86);assert.equal(loaded.resonance,3);assert.equal(loaded.stats.planted,3);
 const again=G.parseSave(G.serialize(loaded));tick(again,10);assert.equal(again.resonance,3);
 s.inventory.seed=1;s.ecology=99;assert.ok(G.plant(s).ok);assert.equal(s.ecology,100);
});

test('成长指引与营火实际规则一致，远程、熄火、冷却都不能冥想',()=>{
 const s=G.createGame();const camp={id:'camp',type:'campfire',x:s.player.x+80,y:s.player.y,fuel:0};s.buildings=[camp];
 const blocked=()=>{assert.notEqual(growthStatus(s).meditationReason,'');assert.equal(G.stationAction(s,'meditate',camp.id).ok,false);};
 blocked();camp.fuel=150;blocked();s.tech.push('observe');blocked();s.inventory.flower=2;
 assert.equal(growthStatus(s).meditationReason,'');assert.ok(G.stationAction(s,'meditate',camp.id).ok);assert.equal(s.resonance,4);assert.equal(s.inventory.flower,1);
 blocked();tick(s,12.1);assert.equal(growthStatus(s).meditationReason,'');camp.x+=500;blocked();assert.equal(s.inventory.flower,1);
});

test('成长指引读取当前地图树苗与当前等级条件，查询不修改存档',()=>{
 const s=G.createGame();s.inventory.seed=1;G.plant(s);const before=G.serialize(s),g=growthStatus(s);
 assert.equal(g.saplings,1);assert.equal(g.nextGrowth,85);assert.equal(g.planted,1);assert.equal(g.requirements.length,6);assert.equal(G.serialize(s),before);
 s.level=2;const next=growthStatus(s);assert.ok(next.requirements.some(r=>r.text.includes('星火信标')));assert.ok(next.requirements.every(r=>!r.text.includes('意识共振')));
 s.level=3;assert.deepEqual(growthStatus(s).requirements,G.chapterRequirements(s));
});
