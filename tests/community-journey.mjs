// 一级开始正常采集、晋升、远征取构件，再建两种机器人；不注入资源、位置、时间或电量。
process.env.JIUJI_JOURNEY_CAMPAIGN='odyssey';
const {s,advance,walk,need,build,learn,make,check}=await import('./survival-journey.mjs');
const G=await import('../dist/survival.js');
const {ROBOT_MODELS}=await import('../dist/robotics.js');
const {SITE_TYPES}=await import('../dist/homestead.js');
const assert=(await import('node:assert/strict')).default,fs=await import('node:fs');
const dir='artifacts/community-v4-20261112';fs.mkdirSync(dir,{recursive:true});
const snapshot=name=>fs.writeFileSync(dir+'/'+name+'.json',G.serialize(s));
const camp=s.buildings.find(b=>b.type==='campfire');
need('wood',70);need('grass',50);need('berry',70);need('seed',20);need('flower',10);make('armor');make('lure');make('lure');
const desk=build('fielddesk',camp);walk(desk);check(G.acceptContract(s,'verdant-well'));
function cross(to){const p=s.nodes.find(n=>n.type==='wormhole'&&n.destination===to);walk(p);while(s.expedition.cooldown)advance();check(G.enterWormhole(s,p.id));}
cross('verdant');const well=s.nodes.find(n=>n.siteType==='well');walk(well);check(G.useItem(s,'lure'));check(G.beginSite(s,well.id,'restore'));let retry=0;
while(!s.homestead.sites.includes(well.id)){advance();if(!s.homestead.channel&&!s.homestead.sites.includes(well.id)){check(G.beginSite(s,well.id,'restore'));assert.ok(++retry<8);}}
cross('home');walk(desk);check(G.claimContract(s));assert.equal(s.inventory.relicpart,2);const bed=build('nursery',camp);
learn('robotics');const dock=build('robotdock',bed),chest=build('chest',dock);for(const model of['gardener','hauler']){for(const[id,n]of Object.entries(ROBOT_MODELS[model].cost))need(id,n);walk(dock);check(G.roboticsAction(s,'assemble',dock.id,model));}
const gardener=s.robotics.robots.find(r=>r.model==='gardener'),hauler=s.robotics.robots.find(r=>r.model==='hauler');
need('crystal',8);need('seed',12);need('berry',60);need('wood',30);make('torch');make('torch');make('torch');walk(bed);walk(chest);walk(dock);
check(G.transfer(s,dock.id,'seed','in',10));
for(const r of[gardener,hauler])check(G.roboticsAction(s,'radius',dock.id,560,r.id));
for(const[k,v]of Object.entries({sourceId:dock.id,destinationId:chest.id,haulItem:'root',reserve:0,batch:1}))check(G.roboticsAction(s,k,dock.id,v,hauler.id));
check(G.roboticsAction(s,'fuel',dock.id));check(G.roboticsAction(s,'fuel',dock.id));for(const r of[gardener,hauler])check(G.roboticsAction(s,'toggle',dock.id,'',r.id));snapshot('正常资源-机器人开工前');
let sawPlant=false,sawCarry=false,sawCharge=false;for(let i=0;i<4200&&(chest.inventory.root||0)<3;i++){
 if(dock.robotEnergy<30&&s.inventory.crystal)check(G.roboticsAction(s,'fuel',dock.id));
 advance();sawPlant||=!!bed.crop;sawCarry||=(hauler.cargo.root||0)>0;sawCharge||=gardener.state==='charging'||hauler.state==='charging';
}
assert.ok(sawPlant&&sawCarry&&sawCharge);assert.ok(chest.inventory.root>=3);assert.ok(s.community.gardens>=1);assert.equal(s.inventory.root||0,0);snapshot('正常资源-播种收成搬运完成');
for(const r of[gardener,hauler])check(G.roboticsAction(s,'return',dock.id,'',r.id));for(let i=0;i<200&&(G.distance(gardener,dock)>3||G.distance(hauler,dock)>3);i++)advance();
const post=build('outpost',camp);walk(post);need('wood',12);walk(post);check(G.transfer(s,post.id,'wood','in',5));
const bay=s.nodes.find(n=>n.id==='village-bay');need('wood',5);need('grass',4);walk(bay);check(G.communityAction(s,'request','bay'));
need('berry',4);need('wood',2);walk(bay);check(G.communityAction(s,'request','bay'));
const ridge=s.nodes.find(n=>n.id==='village-ridge');need('board',2);need('ingot',1);walk(ridge);check(G.communityAction(s,'request','ridge'));need('board',3);walk(ridge);check(G.communityAction(s,'request','ridge'));
assert.equal(s.inventory.carebasket,0);const restored=G.parseSave(G.serialize(s));assert.equal(restored.community.requests.ridge,2);assert.equal(restored.robotics.robots.length,2);snapshot('正常资源-共同体旅程完成');
const result={passed:true,source:'从一级正常采集与真实晋升接续，没有注入物资、科技、位置、时间或电量',level:s.level,day:G.day(s),gardenerTrips:gardener.trips,gardens:s.community.gardens,haulerDelivered:hauler.delivered,chestRoot:chest.inventory.root,communityRequests:s.community.requests,postStock:post.inventory,sawPlant,sawCarry,sawCharge};fs.writeFileSync(dir+'/正常资源旅程结果.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
