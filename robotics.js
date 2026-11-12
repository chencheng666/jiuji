import {roadMultiplier} from './community.js';
import * as G from './survival.js';
import {payCraft,CROPS} from './homestead.js';
import {findLandPath,pathLength} from './navigation.js';
import {ROBOT_MODELS,ROBOT_UPGRADES,ROBOT_TYPES,ROBOT_CAPACITY,ROBOT_STATES} from './robotics-data.js';
export * from './robotics-data.js';
const stock=(bag,id)=>bag?.[id]||0,dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const cargoSize=r=>Object.values(r.cargo).reduce((a,b)=>a+b,0);
export const robotCapacity=r=>ROBOT_CAPACITY+(r.upgrade==='cargo'?8:0);
export const robotRadius=r=>r.radius+(r.upgrade==='range'?240:0);
export const robotModel=r=>ROBOT_MODELS[r.model||'gather'];
export const robotStores=s=>s.buildings.filter(b=>['chest','robotdock','relay','assembler','nursery','dryingrack','outpost','steamworks'].includes(b.type));
const mapOf=(s,id)=>id===s.expedition.current?s:s.expedition.worlds[id];
const atDock=(r,d)=>dist(r,d)<3,fail=reason=>({ok:false,reason});
function tell(s,text){s.message={id:++s.messageSeq,text};return{ok:true,reason:text};}
export function initRobotics(s){
 s.robotics??={version:1,nextId:1,robots:[]};
 for(const r of s.robotics.robots){r.model??='gather';r.upgrade??=null;r.crop??='root';r.haulItem??='wood';r.sourceId??=null;r.destinationId??=null;r.reserve??=5;r.batch??=5;r.job??=null;}
}
export function robotAt(s,dockId,botId){return s.robotics?.robots.find(r=>r.realm===s.expedition.current&&r.dockId===dockId&&(!botId||r.id===botId));}
export function robotStatus(s,r){if(r.realm!==s.expedition.current)return'外地图待机 · 回到当地继续';return ROBOT_STATES[r.state]+(r.reason?' · '+r.reason:'');}
function materials(r){const cost={...robotModel(r).cost};if(r.upgrade)for(const[id,n]of Object.entries(ROBOT_UPGRADES[r.upgrade].cost))cost[id]=(cost[id]||0)+n;return cost;}
export function roboticsAction(s,action,id,value,botId){
 initRobotics(s);if(s.status!=='playing')return fail('当前旅程已结束');
 const d=s.buildings.find(b=>b.id===id&&b.type==='robotdock');if(!d)return fail('这座工作站不在当前地图');
 const near=dist(s.player,d)<=180,r=robotAt(s,id,botId);
 if(action==='assemble'){
  const model=value||'gather',def=Object.hasOwn(ROBOT_MODELS,model)?ROBOT_MODELS[model]:null;if(!def)return fail('未知机器人型号');
  if(!near)return fail('走近工作站后组装');if(s.robotics.robots.some(b=>b.realm===s.expedition.current&&b.model===model))return fail('每张地图每种型号只需一台');
  if(!s.tech.includes('robotics')||s.level<def.level||def.tech&&!s.tech.includes(def.tech))return fail('先研究营地机械助手；园丁还需共生实践，搬运需三级');
  if(s.robotics.robots.length>=18)return fail('六张常驻地图各容纳三种机器人');
  if(['tide','fungus'].includes(s.expedition.current))return fail('临时裂隙不建设长期机器人营地');
  if(!G.craftAffordable(s,def.cost))return fail('组装材料不足（可用附近储物设施）');
  const initial=Object.keys(ROBOT_TYPES).find(type=>s.nodes.some(n=>n.type===type&&n.available&&!n.sapling&&known(s,n)&&dist(n,d)<=240))||'twig';
  payCraft(s,def.cost);s.robotics.robots.push({id:'robot-'+s.robotics.nextId++,model,upgrade:null,dockId:id,realm:s.expedition.current,x:d.x,y:d.y,battery:0,cargo:{},enabled:false,state:'idle',reason:'先补充工作站晶能，再开启作业',resource:initial,radius:240,target:20,path:[],nodeId:null,work:0,wakeAt:0,returnReason:'',trips:0,delivered:0,crop:'root',haulItem:'wood',sourceId:null,destinationId:null,reserve:5,batch:5,job:null});
  return tell(s,def.name+'组装完成。投入原晶充能，配置任务后开启独立作业。');
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
 if(!r)return fail('先在这座工作站组装机器人');
 if(action==='pack'){
  if(!near||!atDock(r,d)||r.enabled||cargoSize(r))return fail('先召回并卸空机器人，再走近工作站回收');
  const cost=materials(r);if(Object.entries(cost).some(([id,n])=>stock(s.inventory,id)+n>9999))return fail('行囊空间不足，回收材料不会丢失');
  for(const[id,n]of Object.entries(cost))s.inventory[id]=stock(s.inventory,id)+n;
  s.robotics.robots=s.robotics.robots.filter(bot=>bot.id!==r.id);return tell(s,'已回收机器人，组装和改装材料完整返还；机内电量不折回原晶。');
 }
 if(action==='upgrade'){
  const u=Object.hasOwn(ROBOT_UPGRADES,value)?ROBOT_UPGRADES[value]:null;if(!u)return fail('未知改装');if(!near||r.enabled||!atDock(r,d)||cargoSize(r))return fail('先召回、卸空并停机，走近工作站后改装');
  if(r.upgrade)return fail('每台只装一块模块；回收重组可重新选择');if(!G.craftAffordable(s,u.cost))return fail('改装材料不足');payCraft(s,u.cost);r.upgrade=value;return tell(s,'已安装'+u.name+'。');
 }
 if(action==='return'){r.enabled=false;startReturn(s,r,d,'手动召回');return tell(s,'已召回'+robotModel(r).name+'；货物会随机器人返回工作站。');}
 if(action==='toggle'){r.enabled=!r.enabled;r.wakeAt=0;if(!r.enabled)startReturn(s,r,d,'暂停作业');else r.reason='已安排作业，关闭面板后开始';return tell(s,r.enabled?'已启用：装满、低电或遇险自动返回；缺料会等待，不凭空生产。':'已暂停作业，正在返程。');}
 const valid={resource:()=>Object.hasOwn(ROBOT_TYPES,value),radius:()=>[240,400,560].includes(Number(value)),target:()=>[20,40,80].includes(Number(value)),crop:()=>Object.hasOwn(CROPS,value),haulItem:()=>!!G.ITEMS[value]&&!G.ITEMS[value].unique&&!G.ITEMS[value].durability,sourceId:()=>!value||robotStores(s).some(b=>b.id===value),destinationId:()=>!value||robotStores(s).some(b=>b.id===value),reserve:()=>[0,5,10,20].includes(Number(value)),batch:()=>[1,5,10,16].includes(Number(value))};
 if(!valid[action]||!valid[action]())return fail('未知或无效机器人设置');
 if(value&&(action==='sourceId'&&value===r.destinationId||action==='destinationId'&&value===r.sourceId))return fail('起点和终点需要不同设施');
 r[action]=['radius','target','reserve','batch'].includes(action)?Number(value):['sourceId','destinationId'].includes(action)&&!value?null:value;r.wakeAt=0;
 if(!atDock(r,d)||cargoSize(r))startReturn(s,r,d,'任务变更，先卸下已有货物');
 else{r.path=[];r.nodeId=null;r.job=null;r.work=0;r.state='idle';r.reason='任务已更新';}
 return tell(s,'任务已更新；已携带的物资会先返站，不会丢失。');
}
function route(s,a,b){return findLandPath(a,b,(x,y)=>G.walkable(s,x,y));}
function startReturn(s,r,d,reason){
 r.state='returning';r.reason=reason;r.returnReason=reason;r.nodeId=null;r.job=null;r.work=0;r.wakeAt=0;
 r.path=route(s,r,d)||[];
 if(!r.path.length&&!atDock(r,d)){r.state='waiting';r.reason='返程通路受阻，保留货物，稍后重试';r.wakeAt=s.time+3;}
}
function threats(s){return[...s.enemies,...s.expedition.creatures.filter(c=>c.hp>0)];}
function unsafe(list,p,radius=190){return list.some(e=>dist(e,p)<radius);}
function known(s,p){return s.explored.includes(Math.floor(p.x/160)+','+Math.floor(p.y/160));}
function safeRoute(s,r,d,to,danger,from=r){return findLandPath(from,to,(x,y)=>G.walkable(s,x,y)&&known(s,{x,y})&&dist(d,{x,y})<=robotRadius(r)&&!unsafe(danger,{x,y}));}
function chooseResource(s,r,d,danger){
 const nodes=s.nodes.filter(n=>n.available&&!n.sapling&&n.type===r.resource&&known(s,n)&&dist(n,d)<=robotRadius(r)&&!unsafe(danger,n)).sort((a,b)=>dist(r,a)-dist(r,b));
 // 仅安排任务时寻路，并限制候选数，避免手机逐帧遍历。
 for(const n of nodes.slice(0,16)){const path=safeRoute(s,r,d,n,danger),home=route(s,n,d);if(!path||!home)continue;
  if(r.battery<(pathLength(r,path)+pathLength(n,home))*.025+8)continue;return{n,path};}
 return null;
}
function move(s,r,dt){
 let remaining=105*roadMultiplier(s,r)*dt;
 while(remaining>0&&r.path.length){const p=r.path[0],length=dist(r,p),amount=Math.min(length,remaining),x=length?r.x+(p.x-r.x)*amount/length:p.x,y=length?r.y+(p.y-r.y)*amount/length:p.y;
  if(!G.walkable(s,x,y)){r.path=[];return false;}
  r.x=x;r.y=y;r.battery=Math.max(0,r.battery-amount*.025);remaining-=amount;if(length<=amount+.001)r.path.shift();else break;
 }return true;
}
function transfer(from,to,id,count){const n=Math.max(0,Math.min(count,stock(from,id),9999-stock(to,id)));if(n){from[id]-=n;to[id]=stock(to,id)+n;}return n;}
function unload(s,r,d){
 const hadHarvest=r.model==='gardener'&&Object.entries(r.cargo).some(([id,n])=>['root','grain','flower'].includes(id)&&n>0)&&r.returnReason==='收成装箱，返程卸货';
 d.inventory??={};for(const[id,count]of Object.entries(r.cargo)){const n=transfer(r.cargo,d.inventory,id,count);r.delivered+=n;}
 if(!cargoSize(r)){if(r.returnReason)r.trips++;if(hadHarvest&&s.community)s.community.gardens++;r.returnReason='';return true;}
 r.state='waiting';r.reason='工作站物资已满，请取出；货物仍保留在机器人上';r.wakeAt=s.time+2;return false;
}
function chooseWork(s,r,d,danger){
 if(r.model==='gardener'){
  const crop=CROPS[r.crop],output=Object.keys(crop.drop).find(id=>id!=='seed');
  const beds=s.buildings.filter(b=>b.type==='nursery'&&known(s,b)&&dist(d,b)<=robotRadius(r)).sort((a,b)=>dist(a,r)-dist(b,r));
  for(const b of beds.slice(0,16)){
   const ready=Object.values(b.inventory||{}).some(n=>n>0),plant=!b.crop&&!ready;
   if(!ready&&(!plant||stock(d.inventory,output)>=r.target||!Object.entries(crop.cost).every(([id,n])=>stock(d.inventory,id)>=n)))continue;
   const path=safeRoute(s,r,d,b,danger),home=route(s,b,d);if(!path||!home||r.battery<(pathLength(r,path)+pathLength(b,home))*.025+8)continue;
   if(plant)for(const[id,n]of Object.entries(crop.cost))transfer(d.inventory,r.cargo,id,n);
   r.job={kind:ready?'harvest':'plant',targetId:b.id,crop:r.crop};r.path=path;return true;
  }
  r.reason=beds.length?'等待成熟、种料或目标库存下降（种料只从工作站领取）':'范围内没有已发现的林海育苗床';return false;
 }
 const source=robotStores(s).find(b=>b.id===r.sourceId),dest=robotStores(s).find(b=>b.id===r.destinationId);
 if(!source||!dest||source===dest){r.reason='先设置两个不同的本地设施作为起点和终点';return false;}
 const room=r.target-stock(dest.inventory,r.haulItem),count=Math.min(r.batch,robotCapacity(r),stock(source.inventory,r.haulItem)-r.reserve,room);
 if(count<=0){r.reason=room<=0?'目的地已达到目标库存':'源仓需保留储备，等待可用货物';return false;}
 const path=safeRoute(s,r,d,source,danger),next=safeRoute(s,r,d,dest,danger,source),home=route(s,dest,d);
 if(!path||!next||!home||r.battery<(pathLength(r,path||[])+pathLength(source,next||[])+pathLength(dest,home||[]))*.025+10){r.reason='路线超出安全范围、尚未探索或电量不足';return false;}
 r.job={kind:'load',targetId:source.id,destId:dest.id,item:r.haulItem};r.path=path;return true;
}
function stepWork(s,r,d,danger,dt){
 const job=r.job,b=s.buildings.find(b=>b.id===job?.targetId);
 if(!job||!b){startReturn(s,r,d,'目标设施已移除，保留物资返站');return;}
 if(r.state==='outbound'||r.state==='delivering'){
  if(!move(s,r,dt)){startReturn(s,r,d,'前方通路受阻');return;}
  if(!r.path.length){r.state='gathering';r.work=0;r.reason=job.kind==='plant'?'播种'+CROPS[job.crop].name:job.kind==='harvest'?'装载育苗床收成':job.kind==='load'?'从源仓领取货物':'向目的地卸货';}return;
 }
 if(r.state!=='gathering')return;
 if(dist(r,b)>4){startReturn(s,r,d,'设施位置变化，返回检查');return;}
 r.work+=dt;if(r.work<2)return;r.work=0;
 if(job.kind==='plant'){
  const crop=CROPS[job.crop];if(!b.crop&&!Object.values(b.inventory||{}).some(n=>n>0)&&Object.entries(crop.cost).every(([id,n])=>stock(r.cargo,id)>=n)){
   for(const[id,n]of Object.entries(crop.cost))r.cargo[id]-=n;
   b.crop={kind:job.crop,readyAt:s.time+crop.seconds*(G.season(s).index===crop.season?1:1.5)*(b.improved?.8:1)};
  }startReturn(s,r,d,'播种流程结束，返站充能');return;
 }
 if(job.kind==='harvest'){
  let room=robotCapacity(r)-cargoSize(r);b.inventory??={};
  for(const[id,n]of Object.entries(b.inventory)){const take=transfer(b.inventory,r.cargo,id,Math.min(n,room));room-=take;}
  startReturn(s,r,d,'收成装箱，返程卸货');return;
 }
 if(job.kind==='load'){
  const dest=robotStores(s).find(b=>b.id===job.destId);if(!dest){startReturn(s,r,d,'目的地已拆除，未领取货物');return;}
  const path=safeRoute(s,r,d,dest,danger);if(!path){startReturn(s,r,d,'运输通路不安全，未领取货物');return;}
  const n=transfer(b.inventory||{},r.cargo,job.item,Math.min(r.batch,robotCapacity(r)-cargoSize(r),stock(b.inventory,job.item)-r.reserve,r.target-stock(dest.inventory,job.item)));
  if(!n){startReturn(s,r,d,'货物已被取走或目的地已满足，返回等待');return;}
  r.job={kind:'deliver',targetId:dest.id,item:job.item};r.path=path;r.state='delivering';r.reason='携带真实货物运往目的地';r.battery=Math.max(0,r.battery-2);return;
 }
 b.inventory??={};r.delivered+=transfer(r.cargo,b.inventory,job.item,Math.min(stock(r.cargo,job.item),r.target-stock(b.inventory,job.item)));
 startReturn(s,r,d,cargoSize(r)?'目的地已满，多余货物随车返站':'运输完成，返站充能');
}
export function stepRobotics(s,dt){
 if(!s.robotics?.robots.length||s.status!=='playing')return;
 const danger=threats(s);
 for(const r of s.robotics.robots){
  // 地图不在场时冻结作业；与旧版本一样不补算离线时间。
  if(r.realm!==s.expedition.current)continue;
  const d=s.buildings.find(b=>b.id===r.dockId&&b.type==='robotdock');if(!d||r.wakeAt>s.time)continue;
  if(atDock(r,d)&&!['outbound','gathering','delivering'].includes(r.state)){
   r.x=d.x;r.y=d.y;r.path=[];if(!unload(s,r,d))continue;
   if(r.battery<99.999){const added=Math.min(100-r.battery,dt*6,d.robotEnergy||0);r.battery+=added;d.robotEnergy=Math.max(0,(d.robotEnergy||0)-added);
    if(added){r.state='charging';r.reason='使用工作站晶能';continue;}
    if(r.battery<30){r.state='waiting';r.reason='充能不足，请向工作站投入原晶';r.wakeAt=s.time+2;continue;}
   }
   if(!r.enabled){r.state='idle';r.reason='可开启独立作业';continue;}
   if(unsafe(danger,d,220)){r.state='waiting';r.reason='营地附近有危险，暂不出发';r.wakeAt=s.time+3;continue;}
   if((r.model||'gather')!=='gather'){
    if(!chooseWork(s,r,d,danger)){r.state='waiting';r.wakeAt=s.time+4;continue;}r.state='outbound';r.reason='沿已探索安全路线作业';
   }else{
    const item=ROBOT_TYPES[r.resource].item;if(stock(d.inventory,item)>=r.target){r.state='idle';r.reason='目标库存已完成';r.wakeAt=s.time+3;continue;}
    const task=chooseResource(s,r,d,danger);if(!task){r.state='waiting';r.reason='范围内暂无安全可采资源；可探索后扩大范围或更换目标';r.wakeAt=s.time+5;continue;}
    r.nodeId=task.n.id;r.path=task.path;r.state='outbound';r.reason='只采已探索区域';
   }
  }
  if(r.state==='returning'){
   if(!r.path.length){r.path=route(s,r,d)||[];if(!r.path.length){r.state='waiting';r.reason='返程通路受阻，保留货物';r.wakeAt=s.time+3;continue;}}
   if(!move(s,r,dt)){r.state='waiting';r.reason='返程通路受阻，保留货物';r.wakeAt=s.time+3;}continue;
  }
  if(r.state==='waiting'){startReturn(s,r,d,r.reason);continue;}
  if(unsafe(danger,r)||r.path.some(p=>unsafe(danger,p,160))){startReturn(s,r,d,'遇险返回，保留已采物资');continue;}
  if(!r.enabled||r.battery<=20){startReturn(s,r,d,!r.enabled?'暂停作业':'电量不足，返站充能');continue;}
  if((r.model||'gather')!=='gather'){stepWork(s,r,d,danger,dt);continue;}
  if(cargoSize(r)>=robotCapacity(r)){startReturn(s,r,d,'货箱已满');continue;}
  const n=s.nodes.find(n=>n.id===r.nodeId&&n.available&&n.type===r.resource&&!n.sapling);
  if(!n){startReturn(s,r,d,'目标已被采集，返回重新安排');continue;}
  if(r.state==='outbound'){if(!move(s,r,dt)){startReturn(s,r,d,'前方通路受阻');continue;}if(!r.path.length){r.state='gathering';r.work=0;r.reason='拾取'+ROBOT_TYPES[r.resource].name;}continue;}
  if(r.state==='gathering'){
   if(dist(r,n)>4){startReturn(s,r,d,'目标位置已变化，返回检查');continue;}
   r.work+=dt;if(r.work<2)continue;const drop=G.NODES[n.type].drop;
   if(cargoSize(r)+Object.values(drop).reduce((a,b)=>a+b,0)>robotCapacity(r)){startReturn(s,r,d,'预留空间不足，先卸货');continue;}
   n.available=false;n.hp=0;n.felledAt=s.time;n.respawnAt=G.NODES[n.type].regrow?s.time+G.NODES[n.type].regrow:0;
   for(const[id,count]of Object.entries(drop))r.cargo[id]=stock(r.cargo,id)+count;
   r.battery=Math.max(0,r.battery-2);r.nodeId=null;r.work=0;
   const item=ROBOT_TYPES[r.resource].item;
   if(stock(d.inventory,item)+stock(r.cargo,item)>=r.target||cargoSize(r)>=robotCapacity(r)-4){startReturn(s,r,d,'采集完成，返程卸货');continue;}
   const task=chooseResource(s,r,d,danger);
   if(task&&cargoSize(r)+Object.values(G.NODES[task.n.type].drop).reduce((a,b)=>a+b,0)<=robotCapacity(r)){r.nodeId=task.n.id;r.path=task.path;r.state='outbound';}else startReturn(s,r,d,'本轮采集完成');
  }
 }
}
export function validateRobotics(s,num){
 for(const map of[s,...Object.values(s.expedition.worlds)]){
  if(map.buildings.filter(b=>b.type==='robotdock').length>1)throw Error('机器人工作站重复');
  for(const d of map.buildings.filter(b=>b.type==='robotdock'))if(d.robotEnergy!==undefined&&!num(d.robotEnergy,0,120))throw Error('工作站晶能无效');
 }
 const e=s.robotics;if(e===undefined)return;
 const point=p=>p&&num(p.x,0,3600)&&num(p.y,0,2800),ids=new Set(),docks=new Set();
 if(!e||e.version!==1||!Number.isSafeInteger(e.nextId)||e.nextId<1||!Array.isArray(e.robots)||e.robots.length>18)throw Error('机器人存档无效');
 for(const r of e.robots){
  const model=r.model||'gather',map=Object.hasOwn(G.REALMS,r.realm)?mapOf(s,r.realm):null,d=map?.buildings?.find(b=>b.type==='robotdock'&&b.id===r.dockId),dockKey=r.realm+':'+r.dockId+':'+model;
  const bag=r.cargo,capacity=robotCapacity(r),validBag=bag&&typeof bag==='object'&&!Array.isArray(bag)&&Object.entries(bag).every(([id,n])=>Object.hasOwn(G.ITEMS,id)&&!G.ITEMS[id].unique&&!G.ITEMS[id].durability&&Number.isInteger(n)&&num(n,0,capacity));
  const nullableId=x=>x===undefined||x===null||typeof x==='string'&&x.length<100;
  if(!d||!Object.hasOwn(ROBOT_MODELS,model)||r.upgrade!=null&&!Object.hasOwn(ROBOT_UPGRADES,r.upgrade)||typeof r.id!=='string'||!/^robot-\d+$/.test(r.id)||Number(r.id.slice(6))>=e.nextId||ids.has(r.id)||docks.has(dockKey)||!point(r)||!num(r.battery,0,100)||typeof r.enabled!=='boolean'||!Object.hasOwn(ROBOT_STATES,r.state)||!Object.hasOwn(ROBOT_TYPES,r.resource)||![240,400,560].includes(r.radius)||![20,40,80].includes(r.target)||!validBag||cargoSize(r)>capacity||!Array.isArray(r.path)||r.path.length>256||r.path.some(p=>!point(p))||!nullableId(r.nodeId)||!num(r.work,0,3)||!num(r.wakeAt)||!Number.isSafeInteger(r.trips)||r.trips<0||!Number.isSafeInteger(r.delivered)||r.delivered<0||typeof r.reason!=='string'||r.reason.length>100||typeof r.returnReason!=='string'||r.returnReason.length>100)throw Error('机器人作业数据无效');
  if(r.crop!==undefined&&!Object.hasOwn(CROPS,r.crop)||r.haulItem!==undefined&&(!G.ITEMS[r.haulItem]||G.ITEMS[r.haulItem].unique||G.ITEMS[r.haulItem].durability)||![r.sourceId,r.destinationId].every(nullableId)||r.sourceId&&r.sourceId===r.destinationId||r.reserve!==undefined&&![0,5,10,20].includes(r.reserve)||r.batch!==undefined&&![1,5,10,16].includes(r.batch))throw Error('机器人任务设置无效');
  if(r.job!=null){const j=r.job;if(!j||model==='gather'||!['plant','harvest','load','deliver'].includes(j.kind)||model==='gardener'&&!['plant','harvest'].includes(j.kind)||model==='hauler'&&!['load','deliver'].includes(j.kind)||typeof j.targetId!=='string'||j.targetId.length>100||j.kind==='plant'&&!Object.hasOwn(CROPS,j.crop)||['load','deliver'].includes(j.kind)&&(!G.ITEMS[j.item]||G.ITEMS[j.item].unique||G.ITEMS[j.item].durability)||j.kind==='load'&&typeof j.destId!=='string')throw Error('机器人在途任务无效');}
  ids.add(r.id);docks.add(dockKey);
 }
}
