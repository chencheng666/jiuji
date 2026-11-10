import * as G from './survival.js';
import {payCraft} from './homestead.js';
import {findLandPath,pathLength} from './navigation.js';
import {ROBOT_COST,ROBOT_TYPES,ROBOT_CAPACITY,ROBOT_STATES} from './robotics-data.js';
export * from './robotics-data.js';
const stock=(bag,id)=>bag?.[id]||0,dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const cargoSize=r=>Object.values(r.cargo).reduce((a,b)=>a+b,0);
const mapOf=(s,id)=>id===s.expedition.current?s:s.expedition.worlds[id];
const atDock=(r,d)=>dist(r,d)<3;
function tell(s,text){s.message={id:++s.messageSeq,text};return{ok:true,reason:text};}
const fail=reason=>({ok:false,reason});
export function initRobotics(s){s.robotics??={version:1,nextId:1,robots:[]};}
export function robotAt(s,dockId){return s.robotics?.robots.find(r=>r.realm===s.expedition.current&&r.dockId===dockId);}
export function robotStatus(s,r){if(r.realm!==s.expedition.current)return'外地图待机 · 回到当地继续';return ROBOT_STATES[r.state]+(r.reason?' · '+r.reason:'');}
export function roboticsAction(s,action,id,value){
 initRobotics(s);if(s.status!=='playing')return fail('当前旅程已结束');
 const d=s.buildings.find(b=>b.id===id&&b.type==='robotdock');if(!d)return fail('这座工作站不在当前地图');
 const near=dist(s.player,d)<=180,r=robotAt(s,id);
 if(action==='assemble'){
  if(!near)return fail('走近工作站后组装');if(r)return fail('这座工作站已有拾荒机');
  if(!s.tech.includes('robotics')||s.level<2)return fail('先研究二级营地机械助手');
  if(s.robotics.robots.length>=6)return fail('当前最多组装六台，每张常驻地图一台');
  if(!G.craftAffordable(s,ROBOT_COST))return fail('组装材料不足（可用附近储物设施）');
  const initial=Object.keys(ROBOT_TYPES).find(type=>s.nodes.some(n=>n.type===type&&n.available&&!n.sapling&&known(s,n)&&dist(n,d)<=240))||'twig';
  payCraft(s,ROBOT_COST);s.robotics.robots.push({id:'robot-'+s.robotics.nextId++,dockId:id,realm:s.expedition.current,x:d.x,y:d.y,battery:0,cargo:{},enabled:false,state:'idle',reason:'先补充工作站晶能，再开启作业',resource:initial,radius:240,target:20,path:[],nodeId:null,work:0,wakeAt:0,returnReason:'',trips:0,delivered:0});
  return tell(s,'拾荒机组装完成，已选择'+ROBOT_TYPES[initial].name+'。投入原晶充能后，可独立外出。');
 }
 if(action==='fuel'){
  if(!near)return fail('走近工作站后投入原晶');if((d.robotEnergy||0)>60)return fail('晶能仓已接近上限，暂不消耗原晶');
  if(!G.craftAffordable(s,{crystal:1}))return fail('需要 1 原晶');payCraft(s,{crystal:1});d.robotEnergy=(d.robotEnergy||0)+60;return tell(s,'投入 1 原晶，工作站晶能 +60。机器人会自行返站充电。');
 }
 if(action==='collect'){
  if(!near)return fail('走近工作站后取出物资');let total=0;
  for(const[item,count]of Object.entries(d.inventory||{})){const n=Math.min(count,9999-stock(s.inventory,item));s.inventory[item]=stock(s.inventory,item)+n;d.inventory[item]-=n;total+=n;}
  return total?tell(s,'已从工作站取出 '+total+' 份物资。'):fail('暂无可取物资，或行囊已满');
 }
 if(!r)return fail('先在这座工作站组装拾荒机');
 if(action==='pack'){
  if(!near||!atDock(r,d)||r.enabled||cargoSize(r))return fail('先召回并卸空机器人，再走近工作站回收');
  if(Object.entries(ROBOT_COST).some(([id,n])=>stock(s.inventory,id)+n>9999))return fail('行囊空间不足，回收材料不会丢失');
  for(const[id,n]of Object.entries(ROBOT_COST))s.inventory[id]=stock(s.inventory,id)+n;
  s.robotics.robots=s.robotics.robots.filter(bot=>bot.id!==r.id);return tell(s,'已回收机器人，组装材料完整返还；机内电量不折回原晶。可清空工作站后拆除重建。');
 }
 if(action==='return'){r.enabled=false;startReturn(s,r,d,'手动召回');return tell(s,'已召回拾荒机；货物会随机器人返回工作站。');}
 if(action==='toggle'){r.enabled=!r.enabled;r.wakeAt=0;if(!r.enabled)startReturn(s,r,d,'暂停作业');else r.reason='已安排作业，关闭面板后开始';return tell(s,r.enabled?'拾荒机已启用：只在已探索区域收集，装满、低电或遇险自动返回。':'已暂停作业，拾荒机正在返程。');}
 if(action==='resource'&&!Object.hasOwn(ROBOT_TYPES,value))return fail('未知采集目标');
 if(action==='radius'&&![240,400,560].includes(Number(value)))return fail('未知作业范围');
 if(action==='target'&&![20,40,80].includes(Number(value)))return fail('未知目标库存');
 if(!['resource','radius','target'].includes(action))return fail('未知机器人操作');
 r[action]=action==='resource'?value:Number(value);r.wakeAt=0;
 if(!atDock(r,d))startReturn(s,r,d,'任务变更，先卸下已有货物');
 else{r.path=[];r.nodeId=null;r.work=0;r.state='idle';r.reason='任务已更新';}
 return tell(s,'机器人任务已更新，达到工作站目标库存会停止采集。');
}
function route(s,a,b){return findLandPath(a,b,(x,y)=>G.walkable(s,x,y));}
function startReturn(s,r,d,reason){
 r.state='returning';r.reason=reason;r.returnReason=reason;r.nodeId=null;r.work=0;
 r.path=route(s,r,d)||[];
 if(!r.path.length&&!atDock(r,d)){r.state='waiting';r.reason='返程通路受阻，保留货物，稍后重试';r.wakeAt=s.time+3;}
}
function threats(s){return[...s.enemies,...s.expedition.creatures.filter(c=>c.hp>0)];}
function unsafe(list,p,radius=190){return list.some(e=>dist(e,p)<radius);}
function known(s,p){return s.explored.includes(Math.floor(p.x/160)+','+Math.floor(p.y/160));}
function chooseResource(s,r,d,danger){
 const nodes=s.nodes.filter(n=>n.available&&!n.sapling&&n.type===r.resource&&known(s,n)&&dist(n,d)<=r.radius&&!unsafe(danger,n)).sort((a,b)=>dist(r,a)-dist(r,b));
 // 搜索只在安排下一次工作时发生，限制候选数，避免手机每帧遍历寻路。
 for(const n of nodes.slice(0,16)){
  const path=findLandPath(r,n,(x,y)=>G.walkable(s,x,y)&&known(s,{x,y})&&dist(d,{x,y})<=r.radius&&!unsafe(danger,{x,y}));if(!path)continue;
  const home=route(s,n,d);if(!home)continue;
  const need=(pathLength(r,path)+pathLength(n,home))*.025+8;
  if(r.battery<need)continue;
  return{n,path};
 }
 return null;
}
function move(s,r,dt){
 let remaining=105*dt;
 while(remaining>0&&r.path.length){const p=r.path[0],length=dist(r,p),amount=Math.min(length,remaining),x=length?r.x+(p.x-r.x)*amount/length:p.x,y=length?r.y+(p.y-r.y)*amount/length:p.y;
  if(!G.walkable(s,x,y)){r.path=[];return false;}
  r.x=x;r.y=y;r.battery=Math.max(0,r.battery-amount*.025);remaining-=amount;if(length<=amount+.001)r.path.shift();else break;
 }
 return true;
}
function unload(s,r,d){
 d.inventory??={};
 for(const[id,count]of Object.entries(r.cargo)){const n=Math.min(count,9999-stock(d.inventory,id));d.inventory[id]=stock(d.inventory,id)+n;r.cargo[id]-=n;r.delivered+=n;}
 if(!cargoSize(r)){if(r.returnReason)r.trips++;r.returnReason='';return true;}
 r.state='waiting';r.reason='工作站物资已满，请取出；货物仍保留在机器人上';r.wakeAt=s.time+2;return false;
}
export function stepRobotics(s,dt){
 if(!s.robotics?.robots.length)return;
 const danger=threats(s);
 for(const r of s.robotics.robots){
  // 远处地图保持原状，不补算离线时间；返回当地后从原位置继续。
  if(r.realm!==s.expedition.current)continue;
  const d=s.buildings.find(b=>b.id===r.dockId&&b.type==='robotdock');if(!d)continue;
  if(r.wakeAt>s.time)continue;
  if(atDock(r,d)&&!['outbound','gathering'].includes(r.state)){
   r.x=d.x;r.y=d.y;r.path=[];
   if(!unload(s,r,d))continue;
   if(r.battery<99.999){const added=Math.min(100-r.battery,dt*6,d.robotEnergy||0);r.battery+=added;d.robotEnergy=Math.max(0,(d.robotEnergy||0)-added);
    if(added){r.state='charging';r.reason='使用工作站晶能';continue;}
    if(r.battery<30){r.state='waiting';r.reason='充能不足，请向工作站投入原晶';r.wakeAt=s.time+2;continue;}
   }
   if(!r.enabled){r.state='idle';r.reason='可开启独立作业';continue;}
   if(unsafe(danger,d,220)){r.state='waiting';r.reason='营地附近有危险，暂不出发';r.wakeAt=s.time+3;continue;}
   const item=ROBOT_TYPES[r.resource].item;
   if(stock(d.inventory,item)>=r.target){r.state='idle';r.reason='目标库存已完成';r.wakeAt=s.time+3;continue;}
   const task=chooseResource(s,r,d,danger);
   if(!task){r.state='waiting';r.reason='范围内暂无安全可采资源；可探索后扩大范围或更换目标';r.wakeAt=s.time+5;continue;}
   r.nodeId=task.n.id;r.path=task.path;r.state='outbound';r.reason='只采已探索区域';
  }
  if(r.state==='returning'){
   if(!r.path.length){r.path=route(s,r,d)||[];if(!r.path.length){r.state='waiting';r.reason='返程通路受阻，保留货物';r.wakeAt=s.time+3;continue;}}
   if(!move(s,r,dt)){r.state='waiting';r.reason='返程通路受阻，保留货物';r.wakeAt=s.time+3;}
   continue;
  }
  if(r.state==='waiting'){startReturn(s,r,d,r.reason);continue;}
  if(unsafe(danger,r)||r.path.some(p=>unsafe(danger,p,160))){startReturn(s,r,d,'遇险返回，保留已采物资');continue;}
  if(!r.enabled||r.battery<=20||cargoSize(r)>=ROBOT_CAPACITY){startReturn(s,r,d,!r.enabled?'暂停作业':cargoSize(r)>=ROBOT_CAPACITY?'货箱已满':'电量不足，返站充能');continue;}
  const n=s.nodes.find(n=>n.id===r.nodeId&&n.available&&n.type===r.resource&&!n.sapling);
  if(!n){startReturn(s,r,d,'目标已被采集，返回重新安排');continue;}
  if(r.state==='outbound'){
   if(!move(s,r,dt)){startReturn(s,r,d,'前方通路受阻');continue;}
   if(!r.path.length){r.state='gathering';r.work=0;r.reason='拾取'+ROBOT_TYPES[r.resource].name;}
   continue;
  }
  if(r.state==='gathering'){
   if(dist(r,n)>4){startReturn(s,r,d,'目标位置已变化，返回检查');continue;}
   r.work+=dt;if(r.work<2)continue;
   const drop=G.NODES[n.type].drop;
   if(cargoSize(r)+Object.values(drop).reduce((a,b)=>a+b,0)>ROBOT_CAPACITY){startReturn(s,r,d,'预留空间不足，先卸货');continue;}
   // 与玩家竞争同一个资源节点；完成时才消耗节点，不调用玩家背包采集逻辑。
   n.available=false;n.hp=0;n.felledAt=s.time;n.respawnAt=G.NODES[n.type].regrow?s.time+G.NODES[n.type].regrow:0;
   for(const[id,count]of Object.entries(drop))r.cargo[id]=stock(r.cargo,id)+count;
   r.battery=Math.max(0,r.battery-2);r.nodeId=null;r.work=0;
   const item=ROBOT_TYPES[r.resource].item;
   if(stock(d.inventory,item)+stock(r.cargo,item)>=r.target||cargoSize(r)>=12){startReturn(s,r,d,'采集完成，返程卸货');continue;}
   const task=chooseResource(s,r,d,danger);
   if(task&&cargoSize(r)+Object.values(G.NODES[task.n.type].drop).reduce((a,b)=>a+b,0)<=ROBOT_CAPACITY){r.nodeId=task.n.id;r.path=task.path;r.state='outbound';}
   else startReturn(s,r,d,'本轮采集完成');
  }
 }
}
export function validateRobotics(s,num){
 for(const map of[s,...Object.values(s.expedition.worlds)]){
  if(map.buildings.filter(b=>b.type==='robotdock').length>1)throw Error('机器人工作站重复');
  for(const d of map.buildings.filter(b=>b.type==='robotdock'))if(d.robotEnergy!==undefined&&!num(d.robotEnergy,0,120))throw Error('工作站晶能无效');
 }
 const e=s.robotics;if(e===undefined)return;
 const validBag=bag=>bag&&typeof bag==='object'&&!Array.isArray(bag)&&Object.entries(bag).every(([id,n])=>['twig','stone','flint','grass','berry','seed'].includes(id)&&Number.isInteger(n)&&num(n,0,ROBOT_CAPACITY));
 const point=p=>p&&num(p.x,0,3600)&&num(p.y,0,2800);
 if(!e||e.version!==1||!Number.isSafeInteger(e.nextId)||e.nextId<1||!Array.isArray(e.robots)||e.robots.length>6)throw Error('机器人存档无效');
 const ids=new Set(),docks=new Set();
 for(const r of e.robots){
  const map=Object.hasOwn(G.REALMS,r.realm)?mapOf(s,r.realm):null,d=map?.buildings?.find(b=>b.type==='robotdock'&&b.id===r.dockId),dockKey=r.realm+':'+r.dockId;
  if(!d||typeof r.id!=='string'||!/^robot-\d+$/.test(r.id)||Number(r.id.slice(6))>=e.nextId||ids.has(r.id)||docks.has(dockKey)||!point(r)||!num(r.battery,0,100)||typeof r.enabled!=='boolean'||!Object.hasOwn(ROBOT_STATES,r.state)||!Object.hasOwn(ROBOT_TYPES,r.resource)||![240,400,560].includes(r.radius)||![20,40,80].includes(r.target)||!validBag(r.cargo)||cargoSize(r)>ROBOT_CAPACITY||!Array.isArray(r.path)||r.path.length>256||r.path.some(p=>!point(p))||!(r.nodeId===null||typeof r.nodeId==='string'&&r.nodeId.length<100)||!num(r.work,0,3)||!num(r.wakeAt)||!Number.isSafeInteger(r.trips)||r.trips<0||!Number.isSafeInteger(r.delivered)||r.delivered<0||typeof r.reason!=='string'||r.reason.length>100||typeof r.returnReason!=='string'||r.returnReason.length>100)throw Error('机器人作业数据无效');
  ids.add(r.id);docks.add(dockKey);
 }

}
