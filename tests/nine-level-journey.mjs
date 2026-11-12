// 从上一段真实操作继续到九级；所有资源都通过采集、生产和配方获得。
import {s,advance,walk,need,make,build,learn,plantMany,meditate,mark,notes,check} from './survival-journey.mjs';
import * as G from '../dist/survival.js';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const camp=s.buildings.find(b=>b.type==='campfire');
function ensureFieldKit(){need('twig',12);need('grass',18);need('berry',20);if(s.inventory.torch<3)for(let i=s.inventory.torch||0;i<3;i++)make('torch');}
function trial(id){
 const t=G.TRIALS.find(t=>t.id===id),o=t.options[0];for(const[k,n]of Object.entries(o.cost))need(k,n);walk(t);if(t.planted)plantMany(t.planted);
 // 林地野猪会撞断调谐。先真实制作并投放诱饵，再绕到遗迹另一侧，不能假定站着一定安全。
 if(s.expedition.creatures.some(m=>m.hp>0&&G.distance(m,t)<350)){make('lure');walk({x:t.x+180,y:t.y+40});check(G.useItem(s,'lure'));walk({x:t.x,y:t.y-110});}
 fs.writeFileSync('artifacts/nine-trial-'+id+'.json',G.serialize(s));
 for(let attempt=0;attempt<5&&!s.expansion.completed.includes(id);attempt++){
  if(G.distance(s.player,t)>140)walk({x:t.x,y:t.y-110});check(G.beginTrial(s,id,o.id));while(s.channel)advance();
 }
 assert.ok(s.expansion.completed.includes(id),JSON.stringify({id,message:s.message,time:s.time}));
}
for(let level=3;level<=8;level++){
  assert.equal(s.level,level);ensureFieldKit();const c=G.CHAPTERS[level];for(const id of c.tech)learn(id);trial(c.trial);
  const station=build(c.station,camp);
  if(level===7){build('garden',{x:1100,y:1050});build('garden',{x:1700,y:2120});}
  if(level===8)build('archive',camp);
  if(s.ecology<c.eco){walk(camp);plantMany(Math.ceil((c.eco-s.ecology)/3)+1);}
  need('resonance',c.cost);walk(station);if(s.player.clarity<60){meditate(3);walk(station);}
  fs.writeFileSync('artifacts/nine-before-'+(level+1)+'.json',G.serialize(s));check(G.stationAction(s,'ascend',station.id));mark('晋升'+s.level+'级');
  assert.equal(s.level,level+1);assert.equal(G.parseSave(G.serialize(s)).level,s.level);
}
assert.equal(s.expansion.completed.length,6);fs.writeFileSync('artifacts/nine-before-ending.json',G.serialize(s));
const returnRoute=G.parseSave(G.serialize(s));check(G.chooseEnding(returnRoute,'return'));assert.equal(returnRoute.status,'won');assert.equal(returnRoute.expansion.ending,'return');
check(G.chooseEnding(s,'stay'));assert.equal(s.status,'won');assert.equal(s.expansion.ending,'stay');fs.writeFileSync('artifacts/nine-complete.json',G.serialize(s));
console.log(JSON.stringify({passed:true,level:s.level,days:G.day(s),tech:s.tech.length,trials:s.expansion.completed,buildings:s.buildings.length,bothEndings:true,notes},null,2));
