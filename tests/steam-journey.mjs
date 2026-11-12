// 复用一级正常采集与晋升流程，研究并建成蒸汽工坊，再实际供料生产与接驳搬运。
process.env.JIUJI_JOURNEY_CAMPAIGN='odyssey';
const {s,advance,walk,need,build,learn,check}=await import('./survival-journey.mjs');
const G=await import('../dist/survival.js');
const {steamAction,steamState}=await import('../dist/steam.js');
const assert=(await import('node:assert/strict')).default,fs=await import('node:fs');
const dir='artifacts/feedback-v40-20261112';fs.mkdirSync(dir,{recursive:true});
learn('steamcraft');const camp=s.buildings.find(b=>b.type==='campfire'),work=build('steamworks',camp);
need('wood',12);walk(work);check(G.transfer(s,work.id,'wood','in',8));check(steamAction(s,'toggle',work.id));
for(let i=0;i<400&&(work.inventory.board||0)<2;i++)advance();assert.equal(work.inventory.board,2);assert.equal(work.inventory.wood,1);check(steamAction(s,'toggle',work.id));
learn('robotics');const dock=build('robotdock',work),chest=build('chest',work);for(const[k,n]of Object.entries({ingot:4,board:4,crystal:3}))need(k,n);walk(dock);check(G.roboticsAction(s,'assemble',dock.id,'hauler'));const r=s.robotics.robots.find(r=>r.model==='hauler');for(const[k,v]of Object.entries({sourceId:work.id,destinationId:chest.id,haulItem:'board',reserve:0,batch:1,radius:560}))check(G.roboticsAction(s,k,dock.id,v,r.id));need('crystal',4);walk(dock);check(G.roboticsAction(s,'fuel',dock.id));check(G.roboticsAction(s,'toggle',dock.id,'',r.id));
for(let i=0;i<1800&&(chest.inventory.board||0)<2;i++)advance();assert.equal(chest.inventory.board,2);assert.equal(work.inventory.board,0);const restored=G.parseSave(G.serialize(s));assert.equal(restored.buildings.find(b=>b.id===work.id).steam.batches,2);
fs.writeFileSync(dir+'/正常资源-蒸汽生产搬运.json',G.serialize(s));const result={passed:true,source:'从一级正常采集、研究与晋升，没有注入资源、位置、电量或时间',level:s.level,day:G.day(s),batches:steamState(work).batches,woodRemaining:work.inventory.wood,chestBoards:chest.inventory.board,haulerTrips:r.trips};fs.writeFileSync(dir+'/蒸汽真实流程结果.json',JSON.stringify(result,null,2));console.log(result);
