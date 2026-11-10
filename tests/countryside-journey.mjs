// 从一级正常采集接续养殖、聚落共同事务与机械喂料，不注入资源或时钟。
process.env.JIUJI_JOURNEY_CAMPAIGN='odyssey';
const {s,advance,walk,need,make,build,learn,check}=await import('./survival-journey.mjs');
const G=await import('../dist/survival.js');
const {visitRoom,stepVillageInterior}=await import('../dist/countryside.js');
const assert=(await import('node:assert/strict')).default;
const fs=await import('node:fs');
learn('animalcare');learn('robotics');
const camp=s.buildings.find(b=>b.type==='campfire');
const chicken=build('chickencoop',camp),rabbit=build('rabbitpen',camp);
for(const b of[chicken,rabbit]){need('board',2);need('grass',6);walk(b);check(G.countrysideAction(s,'roof',b.id));}
for(const[species,bait,pen]of[['chicken','seed',chicken],['rabbit','berry',rabbit]]){
 need(bait,4);let animal;
 for(let i=0;i<4000;i++){animal=s.nodes.filter(n=>n.species===species&&n.available&&!n.followPen).sort((a,b)=>G.distance(a,pen)-G.distance(b,pen))[0];if(animal)break;advance();}
 assert.ok(animal,'等待日间动物出现');walk(animal,animal.id);check(G.countrysideAction(s,'observe',animal.id));check(G.countrysideAction(s,'lead',animal.id));
 walk(pen);for(let i=0;i<2000&&!pen.pen.animals;i++)advance();assert.equal(pen.pen.animals,1,'动物应实际走回圈舍');
 for(let i=0;i<4;i++){need('feed',1);walk(pen);check(G.countrysideAction(s,'feed',pen.id));}
}
walk(camp);
for(let i=0;i<6500&&(rabbit.inventory.rabbitwool||0)<5;i++)advance();
assert.ok(chicken.inventory.egg>=2);assert.ok(rabbit.inventory.rabbitwool>=5);
for(const b of[chicken,rabbit]){walk(b);check(G.countrysideAction(s,'collect',b.id));}
make('omelet');make('woolcoat');assert.ok(s.inventory.omelet);assert.ok(s.inventory.coat);
need('wood',4);need('flint',3);const village=s.nodes.find(n=>n.id==='village-bay');walk(village);check(G.countrysideAction(s,'visit','bay'));check(visitRoom(s,'workshop'));
let arrived=false;for(let i=0;i<200;i++)if(stepVillageInterior(s,.1)?.panel){arrived=true;break;}assert.ok(arrived);const outsideTime=s.time;
check(G.countrysideAction(s,'house-help','workshop'));assert.ok(s.rural.houseTasks.includes('bay:workshop'));G.step(s,.1);assert.equal(s.time,outsideTime);check(G.countrysideAction(s,'leave'));
for(const[id,n]of Object.entries({ingot:3,board:2,crystal:3,feed:1}))need(id,n);
walk(chicken);check(G.countrysideAction(s,'auto',chicken.id));check(G.countrysideAction(s,'reserve',chicken.id));check(G.countrysideAction(s,'charge',chicken.id));
for(let i=0;i<7000&&chicken.pen.reserve;i++)advance();assert.equal(chicken.pen.reserve,0);assert.equal(chicken.pen.energy,19);assert.ok(chicken.pen.food>0);
const restored=G.parseSave(G.serialize(s));assert.deepEqual(restored.buildings.find(b=>b.id===chicken.id).pen,chicken.pen);
const dir='artifacts/countryside-20261110';fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(dir+'/正常资源养殖旅程存档.json',G.serialize(s));
const result={passed:true,source:'一级起步正常采集、合成、研究与晋升，无资源、位置或时间注入',level:s.level,day:G.day(s),observed:Object.keys(s.rural.seen),egg:s.inventory.egg,rabbitwool:s.inventory.rabbitwool,omelet:s.inventory.omelet,coat:s.inventory.coat,workshop:true,automaticFeed:true,remainingEnergy:chicken.pen.energy};
fs.writeFileSync(dir+'/正常资源养殖旅程结果.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
