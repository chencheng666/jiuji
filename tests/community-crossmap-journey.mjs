// 接续已有从一级至九级的真实资源主线，再完成六地前哨与两轮共建。
await import('./odyssey-journey.mjs');
const {s,advance,walk,need,build,make,check}=await import('./survival-journey.mjs');
const G=await import('../dist/survival.js');
const {COMMUNITY_REALMS,COMMUNITY_PROJECTS,postTravelReason}=await import('../dist/community.js');
const assert=(await import('node:assert/strict')).default,fs=await import('node:fs');
if(s.odyssey.creative)check(G.odysseyAction(s,'creative'));
assert.equal(s.odyssey.creative,false);
const dir='artifacts/community-v4-20261112';fs.mkdirSync(dir,{recursive:true});
const home=s.buildings.find(b=>b.type==='campfire');
const recipe=G.RECIPES.find(r=>r.id==='outpost');
cross('verdant');need('board',48);need('wood',100);need('stone',60);need('grass',60);need('crystal',30);need('flower',30);cross('home');
for(const[id,n]of Object.entries(recipe.cost))need(id,n*6+(COMMUNITY_PROJECTS.supply.cost[id]||0)*6);
need('berry',70);need('seed',40);for(let i=s.inventory.ration||0;i<16;i++)make('ration');
function cross(to){if(s.expedition.current===to)return;let n=s.nodes.find(n=>n.type==='wormhole'&&n.destination===to);if(!n){cross('home');n=s.nodes.find(n=>n.destination===to);}walk(n);while(s.expedition.cooldown)advance();check(G.enterWormhole(s,n.id));}
need('resonance',10);
for(const id of COMMUNITY_REALMS){cross(id);const post=build('outpost',id==='home'?home:{x:1330,y:1650});need('wood',3);walk(post);const result=G.communityAction(s,'project',post.id,'supply');assert.ok(result.ok,JSON.stringify({realm:id,inventory:s.inventory,reason:result.reason}));}
assert.equal(s.community.projects.supply.length,6);cross('home');
const sourcePost=s.buildings.find(b=>b.type==='outpost');walk(sourcePost);while(s.expedition.cooldown)advance();
const destination=COMMUNITY_REALMS.find(id=>id!=='home'&&!postTravelReason(s,sourcePost.id,id));assert.ok(destination,'至少一处已建前哨安全，危险地点仍用虫洞抵达');
const crystal=s.inventory.crystal,resonance=s.resonance;check(G.communityAction(s,'travel',sourcePost.id,destination));assert.equal(s.inventory.crystal,crystal-1);assert.equal(s.resonance,resonance-2);
const hpost=s.buildings.find(b=>b.type==='outpost');check(G.communityAction(s,'rest',hpost.id));cross('home');
for(const[id,n]of Object.entries(COMMUNITY_PROJECTS.beacon.cost))need(id,n*6);
for(const id of COMMUNITY_REALMS){cross(id);const post=s.buildings.find(b=>b.type==='outpost');walk(post);check(G.communityAction(s,'project',post.id,'beacon'));}
assert.equal(s.community.projects.beacon.length,6);const restored=G.parseSave(G.serialize(s));assert.equal(restored.community.projects.beacon.length,6);
fs.writeFileSync(dir+'/正常资源-六地前哨共建完成.json',G.serialize(s));
const result={passed:true,source:'完整一级至九级正常资源旅程后，关闭结局创造模式，六站建设与共建均真实扣料',creative:s.odyssey.creative,level:s.level,postRealms:COMMUNITY_REALMS,supply:s.community.projects.supply,monument:s.community.projects.beacon,teleportPaidCrystal:1,teleportPaidResonance:2};fs.writeFileSync(dir+'/六地共建旅程结果.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
