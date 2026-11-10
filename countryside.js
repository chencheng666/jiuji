import {ANIMALS,PEN_TYPES,ROOMS} from './countryside-data.js';
import {findLandPath} from './navigation.js';
let G;
export function bindCountryside(rules){G=rules;}
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const fail=reason=>({ok:false,reason});
function tell(s,text){s.message={id:++s.messageSeq,text};return{ok:true,reason:text};}
export function newPen(){return{animals:0,food:0,progress:0,roof:false,auto:false,reserve:0,energy:0,breeding:false,breedLeft:0};}
const home=s=>G.inHome(s)?{nodes:s.nodes,buildings:s.buildings,creatures:s.expedition.creatures}:s.expedition.worlds.home;
function animalNode(id,species,x,y){return{id,type:'animal',species,x,y,homeX:x,homeY:y,hp:1,available:false,respawnAt:0,restUntil:0,followPen:null,animalPath:[],animalState:'rest'};}
export function initCountryside(s){
 s.rural??={version:1,nextId:1,seeded:false,seen:{},houseTasks:[],visit:null,lastRainAt:0,lastNoticeAt:0};
 const h=home(s);if(!h)return;
 for(const b of h.buildings)if(PEN_TYPES[b.type]){b.pen??=newPen();b.inventory??={};}
 if(s.rural.seeded)return;
 const positions={chicken:[[1420,1790],[1790,1750],[1880,1880]],rabbit:[[1480,1880],[1570,2100],[1160,1900]],squirrel:[[920,1100],[1130,1150],[830,1290]],butterfly:[[1100,2020],[1850,2130],[1580,1840]],frog:[[1710,1760],[2140,2030]],firefly:[[1710,1770],[2140,2035]],hedgehog:[[860,1290],[1960,2200]],deer:[[880,1030],[960,1090],[2090,1970]]};
 const ponds=h.nodes.filter(n=>n.type==='pond');
 for(const[species,points]of Object.entries(positions))for(const[i,base]of points.entries()){
  let[x,y]=['frog','firefly'].includes(species)&&ponds[i]?[ponds[i].x+65,ponds[i].y+35]:base;
  x+=(s.seed%31)-15;y+=(s.seed%23)-11;
  if(!G.isLand(x,y))continue;
  const id='fauna-'+species+'-'+i;if(!h.nodes.some(n=>n.id===id))h.nodes.push(animalNode(id,species,x,y));
 }
 // 领地远离出生点、聚落和虫洞，不把第一夜变成突然袭击。
 for(const[i,p]of [[0,{x:790,y:1010}],[1,{x:2390,y:1840}]]){
  const id='home-boar-'+i;if(!h.creatures.some(m=>m.id===id))h.creatures.push({id,kind:'boar',...p,homeX:p.x,homeY:p.y,hp:G.CREATURES.boar.hp,cooldown:2,slow:0,stun:0,respawnAt:0,warning:null});
 }
 s.rural.seeded=true;
 for(const n of h.nodes.filter(n=>n.type==='animal'))n.available=animalPresent(s,n);
}
export function animalPresent(s,n){
 const a=ANIMALS[n.species];if(!a||n.restUntil>s.time)return false;if(n.followPen)return true;
 const season=G.season(s),hour=s.time%300;
 return a.seasons.includes(season.index)&&hour>=a.hours[0]&&hour<a.hours[1]&&(!a.transition||season.day===1||season.day===4)&&(!a.rain||G.weather(s).raining||(s.rural.lastRainAt>0&&s.time-s.rural.lastRainAt<45));
}
export function animalDestinations(s,n){return s.buildings.filter(b=>b.type===ANIMALS[n.species]?.domestic&&b.pen&&b.pen.animals+(b.pen.breeding?1:0)+s.nodes.filter(a=>a.followPen===b.id).length<(b.pen.roof?4:2)).sort((a,b)=>dist(a,n)-dist(b,n));}
function moveAlong(n,path,dt,speed){if(!path.length)return;const p=path[0],d=dist(n,p),step=Math.min(d,dt*speed);if(d){n.x+=(p.x-n.x)*step/d;n.y+=(p.y-n.y)*step/d;}if(d<=step+.01)path.shift();}
export function stepCountryside(s,dt,input={}){
 if(!G.inHome(s))return;
 if(G.weather(s).raining)s.rural.lastRainAt=s.time;
 for(const n of s.nodes.filter(n=>n.type==='animal')){
  const was=n.available;n.available=animalPresent(s,n);if(!n.available){n.animalState='rest';continue;}
  if(n.followPen){const b=s.buildings.find(b=>b.id===n.followPen);if(!b?.pen){n.followPen=null;n.animalPath=[];continue;}
   const danger=[...s.enemies,...s.expedition.creatures.filter(m=>m.hp>0)].some(m=>dist(n,m)<155);n.animalState=danger?'wait':'return';
   if(!danger)moveAlong(n,n.animalPath,dt,85);
   if(dist(n,b)<60){if(b.pen.animals<(b.pen.roof?4:2)){b.pen.animals++;n.followPen=null;n.animalPath=[];n.restUntil=(Math.floor(s.time/300)+1)*300+25;n.available=false;tell(s,ANIMALS[n.species].name+'已安全到达圈舍，记得准备饲料。');}else{n.animalState='wait';}}
   continue;
  }
  const a=ANIMALS[n.species],scared=dist(n,s.player)<145&&(input.sprint||s.swingUntil>s.time),near=dist(n,s.player)<105;
  n.animalState=scared?'flee':near?'look':a.behavior;
  if(dist(n,s.player)<850){let target;if(scared){const d=Math.max(1,dist(n,s.player));target={x:n.x+(n.x-s.player.x)/d*70,y:n.y+(n.y-s.player.y)/d*70};}else if(near)target=n;else{const t=Math.floor(s.time/(a.behavior==='flutter'?4:8)),seed=(s.seed+n.homeX+n.homeY)%77;target={x:n.homeX+Math.cos(t*.8+seed)*45,y:n.homeY+Math.sin(t*.7+seed)*30};}
   const d=dist(n,target),speed=a.speed*(scared?3:1),step=Math.min(d,speed*dt),x=d?n.x+(target.x-n.x)*step/d:n.x,y=d?n.y+(target.y-n.y)*step/d:n.y;
   if(G.walkable(s,x,y)&&dist({x,y},{x:n.homeX,y:n.homeY})<180){n.x=x;n.y=y;}
  }
  if(!was&&(a.rain||a.transition||n.species==='firefly')&&!s.rural.seen[n.species]&&dist(n,s.player)<380&&s.time-s.rural.lastNoticeAt>30){s.rural.lastNoticeAt=s.time;tell(s,'季节访客：附近出现了'+a.name+'，可以走近观察。');}
 }
 for(const b of s.buildings.filter(b=>PEN_TYPES[b.type]&&b.pen)){
  const p=b.pen,d=PEN_TYPES[b.type];if(!p.animals)continue;
  if(p.food<=0&&p.auto&&p.reserve>0&&p.energy>=1){p.reserve--;p.energy--;p.food=Math.min(24,p.food+6);}
  if(p.food<=0)continue;
  const active=Math.min(dt,p.food/(p.animals*.035));p.food=Math.max(0,p.food-active*p.animals*.035);
  const protectedWeather=p.roof||(!G.weather(s).raining&&G.season(s).index!==3),factor=protectedWeather?1:.6;
  if((b.inventory[d.product]||0)<12){p.progress+=active*factor;if(p.progress>=d.interval){p.progress-=d.interval;b.inventory[d.product]=Math.min(12,(b.inventory[d.product]||0)+p.animals);b.inventory.compost=Math.min(8,(b.inventory.compost||0)+1);}}
  if(p.breeding){p.breedLeft=Math.max(0,p.breedLeft-active*factor);if(p.breedLeft<=0){p.breeding=false;p.animals=Math.min(p.roof?4:2,p.animals+1);tell(s,'圈舍迎来了新伙伴，口粮消耗也会增加。');}}
 }
}
function fits(s,bag){return Object.entries(bag).every(([id,n])=>(s.inventory[id]||0)+n<=9999);}
function reward(s,bag){for(const[id,n]of Object.entries(bag))s.inventory[id]=(s.inventory[id]||0)+n;}
export function countrysideAction(s,action,id,value){
 if(s.status!=='playing')return fail('先返回正在进行的旅程');
 if(action==='leave'){if(!s.rural.visit)return fail('当前不在聚落内部');s.rural.visit=null;return tell(s,'回到聚落门前，荒野时间继续。');}
 if(action==='visit'){
  if(s.rural.visit)return fail('已经在聚落内部，请从院子前往房屋');
  const d=G.VILLAGES[id],n=s.nodes.find(n=>n.id==='village-'+id);if(!d||!G.inHome(s)||!n||dist(s.player,n)>155||s.level<d.level)return fail('先走到已开放等级的聚落门前');
  s.rural.visit={village:id,x:480,y:560,clock:0,walk:0,face:1,direction:'front',path:[],destination:null};s.settlements.villages[id].met=true;s.action=null;s.path=[];s.target=null;s.request=null;return tell(s,'走进'+d.name+'。摇杆、WASD 或点击地面移动；上方可选择要拜访的房屋。');
 }
 if(action==='walk-room')return visitRoom(s,id);
 if(action==='house-rest'){
  const v=s.rural.visit;if(!v||nearbyRoom(s)!=='hearth')return fail('先走近公共火屋的守岸人');s.rural.rests??={};if(s.rural.rests[v.village]===G.day(s))return fail('今天已在这里休息，明天再来');if(!G.craftAffordable(s,{berry:1,wood:1}))return fail('需要 1 浆果和 1 木材');G.payCraft(s,{berry:1,wood:1});s.rural.rests[v.village]=G.day(s);s.player.hp=Math.min(G.maxHealth(s),s.player.hp+10);s.player.clarity=Math.min(100,s.player.clarity+12);return tell(s,'在公共火屋休息片刻，生命 +10、意识 +12。');
 }
 if(action==='house-help'){
  const v=s.rural.visit,r=ROOMS[id];if(!v||!r||dist(v,r)>115)return fail('先进入房屋，走近当地居民');const key=v.village+':'+id;
  if(s.rural.houseTasks.includes(key))return fail('这项共同事务已经完成');if(id==='seedhouse'&&Object.keys(s.rural.seen).length<3)return fail('先观察三种不同动物，把见闻带回来');
  if(!G.craftAffordable(s,r.cost)||!fits(s,r.reward))return fail('共同事务所需材料不足，或行囊没有奖励空间');G.payCraft(s,r.cost);reward(s,r.reward);s.rural.houseTasks.push(key);s.insight+=3;const village=s.settlements.villages[v.village];village.affinity=Math.min(100,village.affinity+5);village.comfort=Math.min(100,village.comfort+5);return tell(s,'完成「'+r.title+'」：洞见 +3、当地好感与安稳 +5。');
 }
 if(!G.inHome(s)||s.rural.visit)return fail('先返回原岛荒野');
 const n=s.nodes.find(n=>n.id===id&&n.type==='animal'&&n.available);
 if(action==='observe'){
  if(!n||dist(n,s.player)>100)return fail('走近动物再观察');if(s.rural.seen[n.species])return tell(s,'这位荒野邻居已经记录在动物手记里。');
  s.rural.seen[n.species]={day:G.day(s),season:G.season(s).index};s.insight+=2;return tell(s,'记录'+ANIMALS[n.species].name+' · 洞见 +2。观察不会消耗或伤害动物。');
 }
 if(action==='lead'){
  if(!n||dist(n,s.player)>100||!ANIMALS[n.species].domestic)return fail('走近可驯养的原野鸡或棉尾兔');if(!s.tech.includes('animalcare'))return fail('先在科技树研究温和驯养');if(n.followPen)return fail('它已经在回圈舍的路上');
  const pen=animalDestinations(s,n).find(b=>dist(b,n)<=900);if(!pen)return fail('900 步内需要一座有空位的对应圈舍');const path=findLandPath(n,pen,(x,y)=>G.walkable(s,x,y));if(!path)return fail('回圈舍的通路受阻，请换个位置建造');
  const cost=ANIMALS[n.species].bait;if(!G.craftAffordable(s,cost))return fail('需要'+Object.entries(cost).map(([k,n])=>G.ITEMS[k].name+' ×'+n).join('、'));G.payCraft(s,cost);n.followPen=pen.id;n.animalPath=path;n.animalState='return';return tell(s,'它正沿通路回圈舍；途中遇险会停下，离开原岛或暂停时也会等待。');
 }
 const b=s.buildings.find(b=>b.id===id&&PEN_TYPES[b.type]),p=b?.pen;if(!p||dist(b,s.player)>180)return fail('先走近鸡舍或兔苑');
 if(action==='feed'){if(p.food>18)return fail('食槽接近装满，暂时不用再投料');if(!G.craftAffordable(s,{feed:1}))return fail('需要 1 谷籽饲料，可在合成 → 材料制作');G.payCraft(s,{feed:1});p.food+=6;return tell(s,'投入 1 饲料，食槽口粮 +6。');}
 if(action==='roof'){if(p.roof)return fail('已有遮雨棚');const cost={board:2,grass:6};if(!G.craftAffordable(s,cost))return fail('需要 2 木板、6 纤维');G.payCraft(s,cost);p.roof=true;return tell(s,'遮雨棚建好：容量升至 4 只，雨冬不再降低产出速度。');}
 if(action==='auto'){
  if(p.auto)return fail('已安装自动喂料');if(s.level<3||!s.tech.includes('robotics')||!s.rural.houseTasks.some(k=>k.endsWith(':workshop')))return fail('三级掌握机械助手，并完成任一聚落的工坊共同事务后解锁');const cost={ingot:3,board:2,crystal:2};if(!G.craftAffordable(s,cost))return fail('需要 3 铜锭、2 木板、2 原晶');G.payCraft(s,cost);p.auto=true;return tell(s,'自动喂料器安装完成。装入储备饲料与原晶，空槽时自动补料。');
 }
 if(action==='reserve'){if(!p.auto||p.reserve>=10)return fail('先安装自动喂料器；储备最多 10 份');if(!G.craftAffordable(s,{feed:1}))return fail('需要 1 谷籽饲料');G.payCraft(s,{feed:1});p.reserve++;return tell(s,'储备饲料 +1；食槽空时自动投入，不凭空产生口粮。');}
 if(action==='charge'){if(!p.auto||p.energy>20)return fail('先安装自动喂料器，晶能仓接近装满时无需再充能');if(!G.craftAffordable(s,{crystal:1}))return fail('需要 1 原晶');G.payCraft(s,{crystal:1});p.energy+=20;return tell(s,'原晶充能 +20，每次自动补料消耗 1 晶能。');}
 if(action==='breed'){if(p.breeding||p.animals<2||p.animals+s.nodes.filter(n=>n.followPen===b.id).length>=(p.roof?4:2)||p.food<6)return fail('需要两只动物、扩建后的空位和至少 6 口粮，且当前没有繁育任务');p.food-=6;p.breeding=true;p.breedLeft=180;return tell(s,'繁育开始，需要 180 秒有效照料；缺粮会等待，不会伤害动物。');}
 if(action==='collect'){let count=0;for(const[k,n]of Object.entries(b.inventory)){const take=Math.min(n,9999-(s.inventory[k]||0));if(take){s.inventory[k]=(s.inventory[k]||0)+take;b.inventory[k]-=take;count+=take;}}return count?tell(s,'收取 '+count+' 份养殖产物。'):fail('还没有产物，或行囊已满');}
 if(action==='empty'){
  if(p.animals||p.breeding||s.nodes.some(n=>n.followPen===b.id))return fail('先放归全部动物，等待在途引领与繁育结束');const refund={feed:p.reserve+Math.floor(p.food/6),crystal:Math.floor(p.energy/20)};if(!fits(s,refund))return fail('行囊没有取回储备的空间');reward(s,refund);p.food=0;p.reserve=0;p.energy=0;p.progress=0;return tell(s,'取回整份储备并清空食槽，零散口粮与余电不折回材料。');
 }
 if(action==='release'){
  if(!p.animals||p.breeding)return fail('先完成繁育；圈舍里需要有动物');const kind=PEN_TYPES[b.type].species,existing=s.nodes.find(n=>n.type==='animal'&&n.species===kind&&!n.available&&!n.followPen);
  if(!existing&&s.nodes.filter(n=>n.type==='animal').length>=80)return fail('附近动物较多，稍后再放归');
  // 岸边圈舍也应放归到陆地，不能把动物放进海里或建筑内部。
  let point;for(const radius of[90,130,170]){for(let angle=0;angle<Math.PI*2;angle+=Math.PI/6){const x=b.x+Math.cos(angle)*radius,y=b.y+Math.sin(angle)*radius;if(G.walkable(s,x,y)&&findLandPath(b,{x,y},(x,y)=>G.walkable(s,x,y))){point={x,y};break;}}if(point)break;}
  if(!point)return fail('圈舍附近暂时没有安全通路，请先腾出林地');
  const release=existing||animalNode('released-'+s.rural.nextId++,kind,point.x,point.y);if(!existing)s.nodes.push(release);release.x=release.homeX=point.x;release.y=release.homeY=point.y;release.restUntil=0;release.available=animalPresent(s,release);p.animals--;return tell(s,'一只'+ANIMALS[kind].name+'回到了附近林地。');
 }
 return fail('未知照料操作');
}
export function interiorWalkable(x,y){if(x<25||x>935||y<75||y>650)return false;if(y>=380)return true;return Object.values(ROOMS).some(r=>(x>=r.left&&x<=r.left+250&&y>=90&&y<=335)||(Math.abs(x-r.x)<=48&&y>=315&&y<=395));}
export function visitDestination(s,x,y,room=null){const v=s.rural.visit;if(!v||!interiorWalkable(x,y))return fail('从院子与房门之间通行，墙壁不能穿过');const path=findLandPath(v,{x,y},interiorWalkable,{cell:30});if(!path)return fail('请从院子经过房门进入');v.path=path;v.destination=room;return{ok:true};}
export function visitRoom(s,id){const r=ROOMS[id];if(!r||!s.rural.visit)return fail('先进入聚落');return visitDestination(s,r.x,r.y+65,id);}
export function nearbyRoom(s){const v=s.rural.visit;return v?Object.entries(ROOMS).find(([,r])=>dist(v,r)<115)?.[0]||null:null;}
export function stepVillageInterior(s,dt,input={}){const v=s.rural.visit;if(!v||s.status!=='playing')return;const oldX=v.x,oldY=v.y;v.clock+=dt;let x=input.x||0,y=input.y||0;const manual=Math.hypot(x,y)>0;if(manual){v.path=[];v.destination=null;const d=Math.max(1,Math.hypot(x,y)),speed=145*dt,nx=v.x+x/d*speed,ny=v.y+y/d*speed;if(interiorWalkable(nx,v.y))v.x=nx;if(interiorWalkable(v.x,ny))v.y=ny;v.face=x<0?-1:x>0?1:v.face;v.walk+=dt*8;}else if(v.path.length){moveAlong(v,v.path,dt,145);v.walk+=dt*8;}else v.walk=0;
 const dx=v.x-oldX,dy=v.y-oldY;if(Math.abs(dx)+Math.abs(dy)>.001)v.direction=Math.abs(dx)>Math.abs(dy)?dx<0?'left':'right':dy<0?'back':'front';
 if(v.destination&&!v.path.length){const id=v.destination;v.destination=null;if(nearbyRoom(s)===id)return{ok:true,panel:'room-talk',buildingId:id};}
}
export function validateCountryside(s,num){
 const r=s.rural;if(r===undefined)return;const integer=(n,a=0,b=1e9)=>Number.isInteger(n)&&num(n,a,b),keys=Object.keys(ANIMALS);
 if(!r||r.version!==1||!integer(r.nextId,1)||typeof r.seeded!=='boolean'||!num(r.lastRainAt)||!num(r.lastNoticeAt)||!r.seen||Array.isArray(r.seen)||Object.entries(r.seen).some(([k,v])=>!keys.includes(k)||!v||!integer(v.day,1)||v.day>G.day(s)||!integer(v.season,0,3))||!Array.isArray(r.houseTasks)||r.houseTasks.length>9||new Set(r.houseTasks).size!==r.houseTasks.length||r.houseTasks.some(k=>!Object.keys(G.VILLAGES).some(id=>Object.keys(ROOMS).some(room=>k===id+':'+room))))throw Error('原岛生态记录无效');
 if(r.rests!==undefined&&(!r.rests||Array.isArray(r.rests)||Object.entries(r.rests).some(([id,n])=>!Object.hasOwn(G.VILLAGES,id)||!integer(n,1)||n>G.day(s))))throw Error('聚落休息记录无效');
 const v=r.visit;if(v!==null&&(!v||s.status!=='playing'||!G.inHome(s)||!Object.hasOwn(G.VILLAGES,v.village)||s.level<G.VILLAGES[v.village].level||!num(v.x,0,960)||!num(v.y,0,660)||!interiorWalkable(v.x,v.y)||!num(v.clock)||!num(v.walk)||![-1,1].includes(v.face)||(v.direction!==undefined&&!['front','back','left','right'].includes(v.direction))||!(v.destination===null||Object.hasOwn(ROOMS,v.destination))||!Array.isArray(v.path)||v.path.length>128||v.path.some(p=>!p||!num(p.x,0,960)||!num(p.y,0,660)||!interiorWalkable(p.x,p.y))))throw Error('聚落内部行动数据无效');
 for(const map of[s,...Object.values(s.expedition.worlds)]){
  const animals=map.nodes.filter(n=>n.type==='animal');if(animals.length>80)throw Error('原岛动物数量无效');
  for(const n of animals)if(!Object.hasOwn(ANIMALS,n.species)||!num(n.homeX,0,3600)||!num(n.homeY,0,2800)||!num(n.restUntil)||!(n.followPen===null||typeof n.followPen==='string'&&map.buildings.some(b=>b.id===n.followPen&&b.type===ANIMALS[n.species].domestic))||!Array.isArray(n.animalPath)||n.animalPath.length>128||n.animalPath.some(p=>!p||!num(p.x,0,3600)||!num(p.y,0,2800))||!['rest','return','wait','flee','look','peck','hop','scurry','flutter','graze'].includes(n.animalState))throw Error('原岛动物行动数据无效');
  for(const b of map.buildings.filter(b=>PEN_TYPES[b.type])){const p=b.pen;if(!p||!integer(p.animals,0,p.roof?4:2)||!num(p.food,0,24)||!num(p.progress,0,1000)||typeof p.roof!=='boolean'||typeof p.auto!=='boolean'||!integer(p.reserve,0,10)||!num(p.energy,0,40)||typeof p.breeding!=='boolean'||!num(p.breedLeft,0,180)||animals.filter(n=>n.followPen===b.id).length+p.animals+(p.breeding?1:0)>(p.roof?4:2))throw Error('养殖圈舍数据无效');}
 }
}
