// 接续一级正常采集旅程，验证取料组合、资源记忆与两地实际交付。
process.env.JIUJI_JOURNEY_CAMPAIGN='odyssey';
const {s,advance,walk,need,build,check}=await import('./survival-journey.mjs');
const G=await import('../dist/survival.js');
const {buildingLinks}=await import('../dist/camp-layout.js');
const {rememberedResources}=await import('../dist/camp-living.js');
const assert=(await import('node:assert/strict')).default,fs=await import('node:fs');
assert.ok(rememberedResources(s).length>0);
const camp=s.buildings.find(b=>b.type==='campfire');const desk=build('fielddesk',camp),chest=build('chest',desk);
assert.ok(buildingLinks(s,chest).some(l=>l.id==='storage'));
need('wood',8);walk(chest);check(G.transfer(s,chest.id,'wood','in',6));
const before=chest.inventory.wood;const bay=s.nodes.find(n=>n.id==='village-bay'),ridge=s.nodes.find(n=>n.id==='village-ridge');
need('wood',6);need('grass',6);walk(bay);check(G.campLivingAction(s,'joint','bay'));assert.equal(s.inventory.jointcrate,1);
need('stone',6);need('flint',2);walk(ridge);check(G.campLivingAction(s,'joint','ridge'));assert.equal(s.campLiving.joint,2);assert.equal(s.inventory.jointcrate,0);
need('wood',20);need('grass',24);const shelter=build('shelter',camp);
if(!buildingLinks(s,shelter).some(l=>l.id==='sheltered')){
 need('wood',5);need('stone',4);need('grass',2);walk(shelter);let point;
 for(const radius of[90,120,145]){for(let a=0;a<Math.PI*2;a+=Math.PI/12){const p={x:shelter.x+Math.cos(a)*radius,y:shelter.y+Math.sin(a)*radius};if(!G.placementReason(s,'campfire',p.x,p.y)){point=p;break;}}if(point)break;}
 assert.ok(point,'为庇护所规划一处相邻营火');check(G.place(s,'campfire',point.x,point.y));
}
assert.ok(buildingLinks(s,shelter).some(l=>l.id==='sheltered'));walk(camp);if(camp.fuel<100)check(G.stationAction(s,'fuel',camp.id));
const target=s.nodes.find(n=>n.type==='ore'&&s.explored.includes(Math.floor(n.x/160)+','+Math.floor(n.y/160)));assert.ok(target);check(G.campLivingAction(s,'track',target.id));
const restored=G.parseSave(G.serialize(s));assert.equal(restored.campLiving.tracked.id,target.id);assert.equal(restored.campLiving.joint,2);
const dir='artifacts/camp-living-20261110';fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(dir+'/正常资源协作旅程存档.json',G.serialize(s));
const result={passed:true,source:'一级正常采集接续，未注入资源、等级、位置或时间',level:s.level,day:G.day(s),remembered:rememberedResources(s).length,storageCombo:true,jointComplete:true,tracked:target.id,storedWoodInitially:before};fs.writeFileSync(dir+'/正常资源协作旅程结果.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
