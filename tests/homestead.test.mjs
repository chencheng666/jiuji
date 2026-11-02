import test from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../dist/survival.js';
import {CONTRACTS,SITE_TYPES,contractProgress,initHomestead,siteReason,chooseSpecialty} from '../dist/homestead.js';
const tick=(s,n,input={})=>{for(let i=0;i<Math.ceil(n*10);i++)G.step(s,.1,input);};
const cross=(s,to)=>{const n=s.nodes.find(n=>n.type==='wormhole'&&n.destination===to);assert.ok(n);Object.assign(s.player,{x:n.x,y:n.y});s.expedition.cooldown=0;assert.ok(G.enterWormhole(s,n.id).ok);};
const supplies=s=>{Object.assign(s.inventory,Object.fromEntries(Object.keys(G.ITEMS).map(id=>[id,100])));s.insight=100;s.resonance=30;};
const build=(s,type)=>{const p=G.placementNearPlayer(s,type);assert.ok(p,type);assert.ok(G.place(s,type,p.x,p.y).ok);return s.buildings.at(-1);};
const site=(s,type,choice)=>{const n=s.nodes.find(n=>n.type==='fieldsite'&&n.siteType===type);assert.ok(n);Object.assign(s.player,{x:n.x,y:n.y});assert.ok(G.beginSite(s,n.id,choice||SITE_TYPES[type].options[0].id).ok);return n;};
test('九项委托接受、跨图探索、回营交付形成闭环，读档不能重复奖励',()=>{
 const s=G.createGame();supplies(s);const desk=build(s,'fielddesk');Object.assign(s.player,desk);assert.ok(G.acceptContract(s,'verdant-well').ok);assert.equal(G.acceptContract(s,'verdant-pod').ok,false);
 cross(s,'verdant');s.expedition.creatures=[];const n=site(s,'well','restore'),seed=s.inventory.seed,part=s.inventory.relicpart;tick(s,14.2);
 assert.equal(s.inventory.seed,seed-4);assert.equal(s.inventory.relicpart,part+1);assert.ok(contractProgress(s,CONTRACTS[0]));assert.equal(G.claimContract(s).ok,false);assert.equal(G.beginSite(s,n.id,'repair').ok,false);
 const loaded=G.parseSave(G.serialize(s));cross(loaded,'home');Object.assign(loaded.player,{x:desk.x,y:desk.y});assert.ok(G.claimContract(loaded).ok);assert.equal(loaded.homestead.completed.length,1);assert.equal(loaded.inventory.relicpart,part+2);assert.equal(G.claimContract(loaded).ok,false);assert.equal(G.acceptContract(loaded,'verdant-well').ok,false);
 cross(loaded,'verdant');assert.equal(loaded.nodes.find(x=>x.id===n.id).available,false);assert.equal(loaded.nodes.filter(x=>x.type==='fieldsite').length,6);
});
test('探索中移动、攻击或受伤会中断，不提前扣料，不能远程或越界取奖励',()=>{
 const s=G.createGame();cross(s,'verdant');supplies(s);s.expedition.creatures=[];const n=site(s,'well','repair'),before=s.inventory.ingot;
 tick(s,1);G.step(s,.1,{x:1});assert.equal(s.homestead.channel,null);assert.equal(s.inventory.ingot,before);
 site(s,'well','repair');G.step(s,.1,{attack:true});assert.equal(s.homestead.channel,null);assert.equal(s.inventory.ingot,before);
 site(s,'well','repair');s.player.hp-=1;tick(s,.1);assert.equal(s.homestead.channel,null);assert.equal(s.inventory.ingot,before);
 s.player.x+=500;assert.notEqual(siteReason(s,n.id,'repair'),'');assert.equal(G.beginSite(s,n.id,'repair').ok,false);assert.equal(s.inventory.ingot,before);
});
test('背包满时探索和委托均不扣材料、不标记完成',()=>{
 const s=G.createGame();supplies(s);const desk=build(s,'fielddesk');Object.assign(s.player,{x:desk.x,y:desk.y});G.acceptContract(s,'verdant-well');cross(s,'verdant');s.expedition.creatures=[];s.inventory.relicpart=9999;
 const n=s.nodes.find(n=>n.siteType==='well');Object.assign(s.player,{x:n.x,y:n.y});assert.equal(G.beginSite(s,n.id,'restore').ok,false);s.inventory.relicpart=9998;site(s,'well','restore');tick(s,14.2);assert.equal(s.inventory.relicpart,9999);
 cross(s,'home');Object.assign(s.player,{x:desk.x,y:desk.y});assert.equal(G.claimContract(s).ok,false);assert.equal(s.homestead.completed.length,0);assert.equal(s.homestead.active,'verdant-well');
});
test('附近储物箱供料先背包后箱子，批量与建造扣料守恒，不使用远方地图箱子',()=>{
 const s=G.createGame();s.inventory={twig:1,flint:2};s.buildings=[{id:'box',type:'chest',...s.player,inventory:{twig:5,flint:5}}];
 assert.equal(G.craftAmount(s,'twig'),6);assert.ok(G.craft(s,'axe').ok);assert.equal(s.inventory.twig,0);assert.equal(s.buildings[0].inventory.twig,4);assert.equal(s.inventory.axe,1);
 s.inventory.twig=0;s.inventory.flint=0;s.buildings[0].inventory.twig=10;s.buildings[0].inventory.flint=5;assert.ok(G.craftBatch(s,'arrow',5).ok);assert.equal(s.inventory.arrow,40);assert.equal(s.buildings[0].inventory.twig,0);assert.equal(s.buildings[0].inventory.flint,0);
 s.buildings[0].inventory={wood:6,stone:4,grass:2};s.inventory.wood=1;const p={x:s.player.x+100,y:s.player.y};assert.ok(G.place(s,'campfire',p.x,p.y).ok);assert.equal(s.inventory.wood,0);assert.equal(s.buildings[0].inventory.wood,2);
 s.buildings[0].x+=500;assert.equal(G.craftAmount(s,'wood'),0);assert.equal(G.craft(s,'board').ok,false);cross(s,'verdant');assert.equal(G.craftAmount(s,'wood'),0);
});
test('研究与种子播种不挪用箱子材料，装备与独特物品不能作为供料',()=>{
 const s=G.createGame();s.buildings=[{id:'box',type:'chest',...s.player,inventory:{seed:5,insight:99,flower:3,axe:1,coat:1}}];
 assert.equal(G.craftAmount(s,'axe'),0);assert.equal(G.craftAmount(s,'coat'),0);assert.equal(G.craftAmount(s,'insight'),0);assert.equal(G.plant(s).ok,false);assert.equal(s.inventory.seed,undefined);
});
test('两项升级争用首轮构件，育苗床季节计时与收获不重复，晾晒产生真实行粮',()=>{
 const s=G.createGame();supplies(s);s.homestead.completed=['verdant-well'];s.inventory.relicpart=2;const bed=build(s,'nursery');assert.equal(s.inventory.relicpart,0);assert.equal(G.craft(s,'dryingrack').ok,false);Object.assign(s.player,{x:bed.x,y:bed.y});
 const before=s.inventory.seed;assert.ok(G.stationAction(s,'sow:root',bed.id).ok);assert.equal(s.inventory.seed,before-2);assert.equal(bed.crop.readyAt-s.time,90);assert.equal(G.stationAction(s,'sow:grain',bed.id).ok,false);assert.equal(G.dismantle(s,bed.id).ok,false);
 tick(s,90.2);const root=s.inventory.root;assert.ok(G.stationAction(s,'home-collect',bed.id).ok);assert.equal(s.inventory.root,root+3);assert.equal(G.stationAction(s,'home-collect',bed.id).ok,false);
 s.inventory.relicpart=2;const rack=build(s,'dryingrack');Object.assign(s.player,{x:rack.x,y:rack.y});const meat=s.inventory.meat;assert.ok(G.stationAction(s,'dry',rack.id).ok);assert.equal(s.inventory.meat,meat-1);tick(s,70.2);assert.ok(G.stationAction(s,'home-collect',rack.id).ok);assert.ok(G.useItem(s,'trailmeal').ok);assert.equal(s.homestead.satiety,120);
});
test('作物跨图暂停与读档接续，不通过往返刷收成',()=>{
 const s=G.createGame();supplies(s);s.homestead.completed=['verdant-well'];const bed=build(s,'nursery');Object.assign(s.player,{x:bed.x,y:bed.y});G.stationAction(s,'sow:grain',bed.id);const left=bed.crop.readyAt-s.time;
 cross(s,'verdant');tick(s,15);const loaded=G.parseSave(G.serialize(s));cross(loaded,'home');const copy=loaded.buildings.find(b=>b.id===bed.id);assert.equal(Math.round(copy.crop.readyAt-loaded.time),Math.round(left));assert.equal(Object.keys(copy.inventory).length,0);
});
test('武器专长有消耗与取舍，连射准确扣箭，稳准射程生效',()=>{
 const s=G.createGame();supplies(s);const desk=build(s,'fielddesk');Object.assign(s.player,{x:desk.x,y:desk.y});G.craft(s,'bow');const part=s.inventory.relicpart;assert.ok(chooseSpecialty(s,'bow','steady').ok);assert.equal(s.inventory.relicpart,part-1);assert.equal(chooseSpecialty(s,'bow','steady').ok,false);assert.equal(G.effectiveWeapon(s,'bow').range,410);
 assert.ok(chooseSpecialty(s,'bow','rapid').ok);const before=s.inventory.arrow;s.enemies=[{id:'e',x:s.player.x+200,y:s.player.y,hp:60,cooldown:0}];assert.ok(G.attack(s).ok);assert.equal(s.enemies[0].hp,45);assert.equal(s.inventory.arrow,before-1);assert.equal(s.attackCooldown,.5);
 s.player.x+=500;assert.equal(chooseSpecialty(s,'hammer','crack').ok,false);
});
test('诱饵吸引普通野怪，守卫保持威胁；没有食物或超上限不能放置',()=>{
 const s=G.createGame();cross(s,'verdant');supplies(s);const boar=s.expedition.creatures.find(m=>m.kind==='boar');s.expedition.creatures=[boar];Object.assign(s.player,{x:boar.x+100,y:boar.y});s.expedition.invulnerable=0;boar.cooldown=0;assert.ok(G.useItem(s,'lure').ok);tick(s,.1);assert.equal(boar.warning,null);
 assert.ok(G.useItem(s,'lure').ok);assert.ok(G.useItem(s,'lure').ok);const before=s.inventory.lure;assert.equal(G.useItem(s,'lure').ok,false);assert.equal(s.inventory.lure,before);tick(s,30.2);assert.equal(s.homestead.lures.length,0);
});
test('探索死亡回营保留装备和食物，跨图遗落包守恒且只能取回一次',()=>{
 const s=G.createGame(20261022,'explore');supplies(s);const camp=build(s,'campfire');const wood=s.inventory.wood,food=s.inventory.berry,axe=s.inventory.axe;cross(s,'verdant');s.status='dead';s.player.hp=0;assert.ok(G.recoverAtCamp(s).ok);assert.equal(s.status,'playing');assert.equal(s.expedition.current,'home');assert.equal(s.inventory.wood,Math.ceil(wood/2));assert.equal(s.inventory.berry,food);assert.equal(s.inventory.axe,axe);assert.equal(G.recoverAtCamp(s).ok,false);
 const loaded=G.parseSave(G.serialize(s));cross(loaded,'verdant');const pack=loaded.nodes.find(n=>n.type==='lostpack');assert.ok(pack);Object.assign(loaded.player,{x:pack.x,y:pack.y});assert.ok(G.interact(loaded,pack.id).ok);assert.equal(loaded.inventory.wood,wood);assert.equal(loaded.homestead.graves.length,0);assert.equal(G.interact(loaded,pack.id).ok,false);assert.equal(loaded.inventory.wood,wood);
 assert.ok(camp.fuel>=90);
});
test('求生模式与无营火不会出现免费复活，旧版迁移默认求生',()=>{
 const s=G.createGame();s.status='dead';assert.equal(G.recoverAtCamp(s).ok,false);s.homestead.mode='explore';assert.equal(G.recoverAtCamp(s).ok,false);
 const old=G.createGame();old.version=5;delete old.homestead;const loaded=G.parseSave(G.serialize(old));assert.equal(loaded.version,G.VERSION);assert.equal(loaded.homestead.mode,'survival');assert.equal(G.parseSave(G.serialize(loaded)).nodes.length,loaded.nodes.length);
});
test('拒绝篡改委托、专长、作物和遗落包，不能导入未知奖励',()=>{
 const s=G.createGame();cross(s,'verdant');const raw=G.serialize(s);
 for(const change of [x=>x.homestead.completed=['unknown'],x=>x.homestead.sites=['site-verdant-well'],x=>x.homestead.specialty={bow:'god'},x=>x.homestead.graves=[{id:'lostpack-1',realm:'verdant',inventory:{unknown:99}}],x=>x.nodes.find(n=>n.type==='fieldsite').realm='home',x=>delete x.homestead]){const v=JSON.parse(raw);change(v);assert.throws(()=>G.parseSave(JSON.stringify(v)));}
});

test('批量成品容量不足时整体拒绝，不发生部分制作和扣料',()=>{
 const s=G.createGame();s.inventory.arrow=9994;s.inventory.twig=20;s.inventory.flint=10;
 assert.equal(G.craft(s,'arrow').ok,false);assert.equal(G.craftBatch(s,'arrow',5).ok,false);assert.equal(s.inventory.twig,20);assert.equal(s.inventory.flint,10);assert.equal(s.inventory.arrow,9994);
});
test('原型键不能作为专长、作物或探索点导入',()=>{
 const s=G.createGame();supplies(s);const desk=build(s,'fielddesk');Object.assign(s.player,{x:desk.x,y:desk.y});assert.equal(G.chooseSpecialty(s,'bow','toString').ok,false);
 s.homestead.completed=['verdant-well'];const bed=build(s,'nursery');Object.assign(s.player,{x:bed.x,y:bed.y});assert.equal(G.stationAction(s,'sow:constructor',bed.id).ok,false);assert.equal(bed.crop,undefined);
 cross(s,'verdant');const raw=G.serialize(s);for(const modify of [x=>x.homestead.specialty={bow:'toString'},x=>{const n=x.nodes.find(n=>n.type==='fieldsite');n.siteType='constructor';n.id='site-verdant-constructor';}]){const v=JSON.parse(raw);modify(v);assert.throws(()=>G.parseSave(JSON.stringify(v)));}
});
