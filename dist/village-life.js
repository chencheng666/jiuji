import {villageContextLine} from './camp-living.js';
let G,VILLAGES;
export function bindVillageLife(rules,villages){G=rules;VILLAGES=villages;}
import {findLandPath} from './navigation.js';
// 聚落生活只表现居民的日程；生产与人口仍由公共储备规则结算，不凭空产物。
export const RESIDENT_ROLES=[{name:'守望人',sprite:'companion-keeper'},{name:'园丁',sprite:'companion-botanist'},{name:'搬运人',sprite:'companion-engineer'},{name:'巡林人',sprite:'companion-ranger'}];
export const RESIDENT_STATES={home:'在家休息',work:'照料营地',walk:'散步',chat:'围火交谈',rain:'回屋避雨',danger:'回屋避险',greeting:'迎接旅人'};
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function houseAt(n,x,y){return[-1,0,1].some(i=>Math.abs(x-(n.x+i*57))<26&&y>n.y+(i===0?-15:0)-52&&y<n.y+(i===0?-15:0)-7);}
function point(s,n,x,y){
 const obstacles=[...s.nodes.filter(o=>o.available&&['tree','rock','ore','crystal'].includes(o.type)),...s.buildings];
 const pass=(x,y)=>G.walkable(s,x,y)&&!houseAt(n,x,y)&&dist(n,{x,y})<=210&&!obstacles.some(o=>dist(o,{x,y})<24);
 for(let i=0;i<16;i++){const a=i*2.4,r=Math.floor(i/4)*18,p={x:n.x+x+Math.cos(a)*r,y:n.y+y+Math.sin(a)*r};if(pass(p.x,p.y))return p;}
 return{x:n.x,y:n.y+12};
}
export function initVillageLife(s){
 const e=s.settlements;if(!e)return;e.life??={version:1,people:{bay:[],ridge:[],reed:[]}};
 const home=G.inHome(s)?s:s.expedition.worlds.home;if(!home)return;
 for(const[id,v]of Object.entries(e.villages)){
  const n=home.nodes.find(n=>n.id==='village-'+id);if(!n)continue;
  const people=e.life.people[id];
  while(people.length<v.population){const index=people.length,p={x:n.x+(index%3-1)*57,y:n.y+18+(index%2)*8};people.push({id:id+'-'+index,index,x:p.x,y:p.y,role:index%4,state:'home',inside:false,path:[],waitUntil:0,round:0,walk:0,face:1,speech:'',speechUntil:0});}
 }
}
function schedule(s,n,v,r){
 const time=s.time%300,w=G.weather(s),danger=[...s.enemies,...s.expedition.creatures.filter(e=>e.hp>0)].some(e=>dist(e,n)<230);
 if(danger)return{state:'danger',x:(r.index%3-1)*57,y:18,text:'先回屋，等外面安全些。'};
 if(w.raining)return{state:'rain',x:(r.index%3-1)*57,y:18,text:'下雨了，把工具收好。'};
 if(time>=230)return{state:'home',x:(r.index%3-1)*57,y:18,text:'明早再见。'};
 if(r.index===0&&dist(s.player,n)<190)return{state:'greeting',x:38,y:38,text:villageContextLine(s,n.village)||(v.met?'回来啦，营地里慢慢聊。':'欢迎，点聚落标牌就能和我们交谈。')};
 if(time>=190)return{state:'chat',x:Math.cos(r.index*2.4)*45,y:65+Math.sin(r.index*2.4)*22,text:v.food>0?'今天的粮食已经收好了。':'明天得准备些食物和柴火。'};
 const phase=(r.round+r.index+Math.floor(s.seed/13))%4;
 if(phase===3)return{state:'walk',x:Math.cos(r.index*2.4+r.round)*145,y:45+Math.sin(r.index*2.4+r.round)*80,text:'出去走一走，看看新长的草。'};
 if(phase===2&&v.comfort>=40)return{state:'chat',x:(r.index%3-1)*25,y:65,text:'从那边回来的人，带了新的见闻。'};
 const offsets=[[45,35],[-110,65],[118,40],[20,-85]],p=offsets[r.role];
 return{state:'work',x:p[0]+(r.index%2)*14,y:p[1],text:['看看火塘和住处。','照料苗圃，留下一些种子。',v.food?'整理公共粮仓。':'检查粮仓，还需要大家补充储备。','沿着营地边缘看看。'][r.role]};
}
function choose(s,n,v,r,task){
 const dest=point(s,n,task.x,task.y),previous=r.state;
 const obstacles=[...s.nodes.filter(o=>o.available&&['tree','rock','ore','crystal'].includes(o.type)),...s.buildings];
 const path=findLandPath(r,dest,(x,y)=>G.walkable(s,x,y)&&!houseAt(n,x,y)&&dist(n,{x,y})<=215&&!obstacles.some(o=>dist(o,{x,y})<23));
 r.state=task.state;r.inside=false;r.path=path||[];
 r.waitUntil=s.time+(path?8+(r.index*7+r.round*3)%9:3);r.round++;
 if(previous!==r.state||r.round%3===0){r.speech=task.text;r.speechUntil=s.time+5;}
}
export function stepVillageLife(s,dt){
 if(!s.settlements||!G.inHome(s))return;initVillageLife(s);
 for(const[id,v]of Object.entries(s.settlements.villages)){
  const n=s.nodes.find(n=>n.id==='village-'+id);if(!n||dist(n,s.player)>900)continue;
  for(const r of s.settlements.life.people[id]){
   const task=schedule(s,n,v,r),urgent=['rain','danger','home'].includes(task.state);
   if((urgent&&r.state!==task.state)||(!urgent&&['rain','danger','home'].includes(r.state))||s.time>=r.waitUntil&&!r.path.length)choose(s,n,v,r,task);
   if(r.path.length){const p=r.path[0],length=dist(r,p),speed=urgent?52:27+(r.index%3)*3,amount=Math.min(length,speed*dt),x=length?r.x+(p.x-r.x)*amount/length:p.x,y=length?r.y+(p.y-r.y)*amount/length:p.y;
    if(G.walkable(s,x,y)){r.face=x>=r.x?1:-1;r.x=x;r.y=y;r.walk+=dt*7;if(length<=amount+.001)r.path.shift();}else{r.path=[];r.waitUntil=s.time+2;}
    if(!r.path.length){r.waitUntil=s.time+6+(r.index*3)%8;r.walk=0;}
   }else{r.walk=0;r.inside=urgent&&dist(r,{x:n.x+(r.index%3-1)*57,y:n.y+18})<65;}
  }
 }
}
export function villageLifeSummary(s,id){const people=s.settlements?.life?.people[id]||[];const counts={};for(const r of people)counts[RESIDENT_STATES[r.state]]=(counts[RESIDENT_STATES[r.state]]||0)+1;return Object.entries(counts).map(([name,n])=>name+' '+n+' 人').join(' · ');}
export function validateVillageLife(s,num){
 const life=s.settlements?.life;if(life===undefined)return;
 if(!life||life.version!==1||!life.people||Object.keys(life.people).length!==3)throw Error('聚落居民生活数据无效');
 for(const[id,v]of Object.entries(s.settlements.villages)){
  const people=life.people[id];if(!Array.isArray(people)||people.length!==v.population)throw Error('聚落居民人数无效');
  for(let index=0;index<people.length;index++){const r=people[index];if(!r||r.id!==id+'-'+index||r.index!==index||r.role!==index%4||!Object.hasOwn(RESIDENT_STATES,r.state)||typeof r.inside!=='boolean'||!num(r.x,0,3600)||!num(r.y,0,2800)||!num(r.waitUntil)||!num(r.round)||!Number.isInteger(r.round)||!num(r.walk)||![-1,1].includes(r.face)||typeof r.speech!=='string'||r.speech.length>100||!num(r.speechUntil)||!Array.isArray(r.path)||r.path.length>128||r.path.some(p=>!p||!num(p.x,0,3600)||!num(p.y,0,2800)))throw Error('聚落居民行动数据无效');}
 }
}
