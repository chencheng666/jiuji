// 接续正常采集获得的营地，不注入物资、等级、位置或机器人电量。
process.env.JIUJI_JOURNEY_CAMPAIGN='odyssey';
const {s,advance,walk,need,build,learn,check}=await import('./survival-journey.mjs');
const G=await import('../dist/survival.js');
const {ROBOT_COST}=await import('../dist/robotics-data.js');
const assert=(await import('node:assert/strict')).default,fs=await import('node:fs');
learn('robotics');
const recipe=G.RECIPES.find(r=>r.id==='robotdock'),total={...recipe.cost};for(const[id,n]of Object.entries(ROBOT_COST))total[id]=(total[id]||0)+n;total.crystal+=2;
for(const[id,n]of Object.entries(total))need(id,n);
const camp=s.buildings.find(b=>b.type==='campfire');
const resource=s.nodes.filter(n=>n.type==='grass'&&n.available&&G.walkable(s,n.x,n.y)).sort((a,b)=>G.distance(a,camp)-G.distance(b,camp))[0];assert.ok(resource);
walk(resource);const dock=build('robotdock',resource);walk(dock);
check(G.roboticsAction(s,'assemble',dock.id));check(G.roboticsAction(s,'fuel',dock.id));check(G.roboticsAction(s,'fuel',dock.id));check(G.roboticsAction(s,'resource',dock.id,'grass'));check(G.roboticsAction(s,'toggle',dock.id));
const robot=s.robotics.robots[0],grass=s.inventory.grass;let sawCargo=false,sawCharging=false;
for(let i=0;i<2200&&robot.delivered<4;i++){advance();sawCargo ||= (robot.cargo.grass||0)>0;sawCharging ||= robot.state==='charging';}
assert.ok(sawCargo&&sawCharging);assert.ok(robot.delivered>=4);assert.equal(s.inventory.grass,grass);assert.ok(dock.inventory.grass>=4);
check(G.roboticsAction(s,'return',dock.id));for(let i=0;i<200&&G.distance(robot,dock)>3;i++)advance();assert.ok(G.distance(robot,dock)<3);
const delivered=dock.inventory.grass;walk(dock);check(G.roboticsAction(s,'collect',dock.id));assert.equal(s.inventory.grass,grass+delivered);
const restored=G.parseSave(G.serialize(s));assert.equal(restored.robotics.robots[0].delivered,robot.delivered);
fs.mkdirSync('artifacts/camp-assistant-20261109',{recursive:true});fs.writeFileSync('artifacts/camp-assistant-20261109/正常资源机器人旅程存档.json',G.serialize(s));
const result={passed:true,level:s.level,source:'从一级正常采集与晋升接续，未注入资源',trips:robot.trips,delivered:robot.delivered,sawCargo,sawCharging,playerGrass:s.inventory.grass};fs.writeFileSync('artifacts/camp-assistant-20261109/正常资源机器人旅程结果.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
