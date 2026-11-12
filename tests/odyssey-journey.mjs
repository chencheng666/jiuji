// 从空背包开始，所有材料经正常采集、合成、建造和运输获得，不修改等级、坐标或资源。
process.env.JIUJI_JOURNEY_CAMPAIGN='odyssey';
const {s,advance,walk,harvest,need,make,build,learn,plantMany,meditate,mark,notes,check}=await import('./survival-journey.mjs');
const G=await import('../dist/survival.js');
const {SITES,CONTACTS,SIGNAL_COST}=await import('../dist/odyssey-data.js');
const assert=(await import('node:assert/strict')).default;
const fs=await import('node:fs');
const camp=s.buildings.find(b=>b.type==='campfire');
const snapshot=name=>fs.writeFileSync('artifacts/odyssey-'+name+'.json',G.serialize(s));
function supplies(){need('berry',45);need('flower',20);need('twig',15);need('grass',25);for(let n=s.inventory.torch||0;n<5;n++)make('torch');if(!s.inventory.armor)make('armor');for(let n=s.inventory.salve||0;n<8;n++)make('salve');}
function travel(to){if(s.expedition.current===to)return;let portal=s.nodes.find(n=>n.type==='wormhole'&&n.destination===to);if(!portal){travel('home');portal=s.nodes.find(n=>n.destination===to);}walk(portal);while(s.expedition.cooldown>0)advance();check(G.enterWormhole(s,portal.id));s.request=null;}
function cost(cost){for(let pass=0;pass<8&&!G.craftAffordable(s,cost);pass++)for(const[id,n]of Object.entries(cost))need(id,n);}
function solve(){const map=s.expedition.current,def=SITES[map],p=s.odyssey.puzzles[map];if(p.solved)return;walk(s.nodes.find(n=>n.type==='conduit'));snapshot('realm-'+map+'-before');
 if(def.kind==='switch'){let solution=null;for(let mask=0;mask<2**p.values.length;mask++){const v=[...p.values];for(let i=0;i<v.length;i++)if(mask>>i&1){v[i]^=1;v[(i+1)%v.length]^=1;}if(v.every(Boolean)){solution=mask;break;}}assert.notEqual(solution,null);for(let i=0;i<p.values.length;i++)if(solution>>i&1)check(G.odysseyAction(s,'puzzle-toggle','',i));}
 else if(def.kind==='power'){for(let i=0;i<3;i++)if(p.values[i]!==[1,0,1][i])check(G.odysseyAction(s,'puzzle-toggle','',i));}
 else if(def.kind==='beam'){for(let i=0;i<4;i++)if(p.values[i]!==[0,0,1,1][i])check(G.odysseyAction(s,'puzzle-toggle','',i));}
 else for(const input of G.signalPattern(s))check(G.odysseyAction(s,'puzzle-input','',input));
 if(def.kind!=='memory')check(G.odysseyAction(s,'puzzle-check'));assert.ok(p.solved);snapshot('realm-'+map);mark('接续'+def.name);
}
function contact(){const id=s.expedition.current;if(s.odyssey.contacts[id])return;const o=CONTACTS[id].options[1];cost(o.cost);const target=s.nodes.find(n=>n.type==='wayfarer');walk(target);check(G.odysseyAction(s,'contact',target.id,o.id));}
function prepRelay(){cost(G.RECIPES.find(r=>r.id==='relay').cost);}
function relay(){return s.buildings.find(b=>b.type==='relay')||build('relay',{x:s.player.x,y:s.player.y});}
function trial(id){travel('home');const t=G.TRIALS.find(t=>t.id===id),o=t.options[0];cost(o.cost);walk(t);if(t.planted)plantMany(t.planted);// 遗迹调谐允许受击中断；真实准备诱饵后绕开野猪，不跳过规则。
 if(s.expedition.creatures.some(m=>m.hp>0&&G.distance(m,t)<350)){make('lure');walk({x:t.x+180,y:t.y+40});check(G.useItem(s,'lure'));walk({x:t.x,y:t.y-110});}
 for(let attempt=0;attempt<5&&!s.expansion.completed.includes(id);attempt++){if(G.distance(s.player,t)>140)walk({x:t.x,y:t.y-110});check(G.beginTrial(s,id,o.id));while(s.channel)advance();}assert.ok(s.expansion.completed.includes(id),'遗迹未完成：'+JSON.stringify(s.message));}
function ascend(){const chapter=G.CHAPTERS[s.level];travel('home');trial(chapter.trial);const station=s.buildings.find(b=>b.type===chapter.station)||build(chapter.station,camp);if(s.level===8)build('archive',camp);if(s.ecology<chapter.eco){walk(camp);plantMany(Math.ceil((chapter.eco-s.ecology)/3)+1);}need('resonance',chapter.cost);walk(station);if(s.player.clarity<60){meditate(3);walk(station);}snapshot('before-'+(s.level+1));check(G.stationAction(s,'ascend',station.id));mark('晋升'+s.level+'级');assert.equal(G.parseSave(G.serialize(s)).level,s.level);}
function learnChapter(){for(const id of G.CHAPTERS[s.level].tech)if(!s.tech.includes(id))learn(id);}
supplies();contact();learnChapter();
for(const map of ['verdant','cinder']){cost(CONTACTS[map].options[1].cost);travel(map);solve();contact();travel('home');}
ascend();assert.equal(s.level,4);learnChapter();learn('relaynetwork');build('gate',camp);prepRelay();const homeRelay=relay();
cost(CONTACTS.mirror.options[1].cost);prepRelay();travel('mirror');solve();contact();relay();need('mirrorsand',180);check(G.returnHome(s));assert.equal(s.expedition.current,'home');mark('镜沙与归途传送');ascend();
assert.equal(s.level,5);learnChapter();learn('automation');const assembler=build('assembler',camp);build('windmill',assembler);need('wood',12);walk(assembler);check(G.odysseyAction(s,'store-in',assembler.id,'wood',9));walk(homeRelay);need('wood',8);walk(homeRelay);check(G.odysseyAction(s,'store-in',homeRelay.id,'wood',5));check(G.odysseyAction(s,'route-add','mirror','wood',5));while(s.odyssey.stats.manufactured<3||s.odyssey.stats.shipments<1)advance();assert.equal(assembler.inventory.board,3);mark('真实装配与跨图货运');snapshot('industry');ascend();
assert.equal(s.level,6);learnChapter();supplies();cost(CONTACTS.orbit.options[1].cost);travel('orbit');solve();contact();need('starfiber',65);travel('home');learn('projection');make('arcblade');make('prismBow');make('gravityHammer');make('pulsebolt');need('powercell',4);if(s.odyssey.power<20)check(G.useItem(s,'powercell'));check(G.odysseyAction(s,'projection'));
while(s.odyssey.stats.projectionHits<6){const node=s.nodes.find(n=>n.available&&['tree','rock','ore'].includes(n.type)&&G.walkable(s,n.x,n.y));walk({x:node.x+45,y:node.y+45});for(let i=0;i<20;i++)advance();}
check(G.odysseyAction(s,'projection'));cost({mirrorsand:6,prism:2,flower:4});travel('mirror');walk(s.nodes.find(n=>n.type==='conduit'));check(G.odysseyAction(s,'treaty'));travel('home');snapshot('projection');ascend();
assert.equal(s.level,7);learnChapter();learn('ecolink');build('garden',camp);cost(CONTACTS.frost.options[1].cost);cost(G.RECIPES.find(r=>r.id==='garden').cost);travel('frost');solve();contact();build('garden');travel('home');cost(G.RECIPES.find(r=>r.id==='garden').cost);travel('verdant');build('garden');while(s.odyssey.health.frost<60)advance();travel('home');mark('三地生态织网');ascend();
assert.equal(s.level,8);learnChapter();learn('signalweb');supplies();cost({starfiber:6,alloy:2,resonance:6});travel('orbit');walk(s.nodes.find(n=>n.type==='conduit'));check(G.odysseyAction(s,'treaty'));travel('home');
for(const map of Object.keys(SITES)){const bundle={...SIGNAL_COST[map]};if(!G.worldState(s,map)?.buildings.some(b=>b.type==='relay'))for(const[k,v]of Object.entries(G.RECIPES.find(r=>r.id==='relay').cost))bundle[k]=(bundle[k]||0)+v;need('powercell',1);cost(bundle);travel(map);const station=relay();walk(station);if(s.odyssey.grids[map].charge<30)check(G.odysseyAction(s,'charge-grid',station.id));const target=s.nodes.find(n=>n.type==='wayfarer');walk(target);check(G.odysseyAction(s,'signal',target.id));mark('接续'+G.REALMS[map].name+'信号');travel('home');}
ascend();assert.equal(s.level,9);snapshot('before-ending');const other=G.parseSave(G.serialize(s));check(G.chooseEnding(other,'return'));check(G.chooseEnding(s,'stay'));s.status='playing';check(G.odysseyAction(s,'creative'));assert.ok(s.odyssey.creative);assert.ok(G.parseSave(G.serialize(s)).odyssey.creative);snapshot('complete');
console.log(JSON.stringify({passed:true,campaign:s.odyssey.campaign,level:s.level,seconds:Math.round(s.time),visited:s.expedition.visited,signals:s.odyssey.signals,treaties:s.odyssey.treaties,stats:s.odyssey.stats,notes},null,2));
