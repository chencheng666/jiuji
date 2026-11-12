let G;
export function bindCommunity(rules){G=rules;}
const payCraft=(s,cost)=>G.payCraft(s,cost);
import {COMMUNITY_REQUESTS,COMMUNITY_PROJECTS} from './community-data.js';
export * from './community-data.js';
export const COMMUNITY_REALMS=['home','verdant','cinder','frost','mirror','orbit'];
const fail=reason=>({ok:false,reason}),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const world=(s,id)=>id===s.expedition.current?s:s.expedition.worlds[id];
const danger=(map,p,home=false)=>[...(home?map.enemies||[]:[]),...(map.expedition?.creatures||map.creatures||[])].some(e=>e.hp>0&&dist(e,p)<250);
function say(s,text){s.message={id:++s.messageSeq,text};s.journal.unshift({day:G.day(s),text});s.journal=s.journal.slice(0,80);return{ok:true,reason:text};}
export function initCommunity(s){s.community??={version:1,requests:{bay:0,ridge:0,reed:0},announced:{bay:-1,ridge:-1,reed:-1},projects:{supply:[],beacon:[]},rests:{},log:[],gardens:0};return s.community;}
export function roadMultiplier(s,p){return s.buildings.some(b=>b.type==='trail'&&dist(b,p)<=38)?1.15:1;}
function record(s,type,text){const e=initCommunity(s);e.log.unshift({day:G.day(s),realm:s.expedition.current,type,text});e.log=e.log.slice(0,60);}
export function requestReason(s,id){
 const e=initCommunity(s),stage=e.requests[id],d=Object.hasOwn(COMMUNITY_REQUESTS,id)?COMMUNITY_REQUESTS[id][stage]:null;if(!d)return'这里的共同事务已经完成';
 if(s.level<d.level)return'需要 '+d.level+' 级';
 if(id==='ridge'&&stage===1&&e.requests.bay<2)return'先和河湾准备饭篮，再带到石脊';
 if(d.robot&&!e.gardens)return'先让园丁真实收成并运回工作站';return'';
}
export function stepCommunity(s){
 const e=initCommunity(s);if(!G.inHome(s))return;
 for(const id of Object.keys(COMMUNITY_REQUESTS)){
  if(!s.settlements.villages[id].met||requestReason(s,id)||e.announced[id]===e.requests[id])continue;
  e.announced[id]=e.requests[id];const d=COMMUNITY_REQUESTS[id][e.requests[id]];
  say(s,G.VILLAGES[id].npc+'托人带来消息：'+d.name+'。不急，准备好再来聚落交谈。');record(s,'request',d.name);break;
 }
}
export function postTravelReason(s,from,to){
 if(!COMMUNITY_REALMS.includes(to)||to===s.expedition.current)return'请选择另一张常驻地图的前哨站';
 const current=s.buildings.find(b=>b.id===from&&b.type==='outpost'),map=world(s,to),dest=map?.buildings?.find(b=>b.type==='outpost');
 if(s.status!=='playing'||s.rural?.visit)return'先回到正在进行的荒野旅程';
 if(!COMMUNITY_REALMS.includes(to)||to===s.expedition.current||!dest)return'先亲自到目的地图建好前哨站';
 if(!current||dist(s.player,current)>180)return'走近本地前哨站再出发';
 if(s.level<4||!s.tech.includes('spatial'))return'四级研究空间折叠后，解锁前哨往返';
 if(s.level<G.REALMS[to].level)return'目的地等级尚未开放';
 if(s.expedition.cooldown>0)return'等待折跃稳定 '+Math.ceil(s.expedition.cooldown)+' 秒';
 if(danger(s,current,true)||danger(map,dest,to==='home'))return'起点或终点附近有危险，先清理或使用虫洞';
 if((s.inventory.crystal||0)<1||s.resonance<2)return'需要随身 1 原晶和 2 共鸣；虫洞仍免费';return'';
}
export function communityAction(s,action,id,value){
 const e=initCommunity(s);if(s.status!=='playing')return fail('先返回正在进行的旅程');
 if(action==='request'){
  if(!Object.hasOwn(COMMUNITY_REQUESTS,id))return fail('未知聚落');
  const node=s.nodes.find(n=>n.id==='village-'+id),v=s.settlements.villages[id],d=COMMUNITY_REQUESTS[id]?.[e.requests[id]];
  if(!node||!v||!G.inHome(s)||dist(s.player,node)>155)return fail('先走近聚落当面交付');
  const reason=requestReason(s,id);if(reason)return fail(reason);
  if(!G.craftAffordable(s,d.cost)||Object.entries(d.reward).some(([k,n])=>(s.inventory[k]||0)+n>9999))return fail('交付材料不足或回礼没有空间');
  payCraft(s,d.cost);for(const[k,n]of Object.entries(d.reward))s.inventory[k]=(s.inventory[k]||0)+n;
  e.requests[id]++;v.met=true;v.affinity=Math.min(100,v.affinity+6);v.comfort=Math.min(100,v.comfort+5);s.insight+=3;record(s,'request-done',d.name);return say(s,'一起完成「'+d.name+'」。回礼已入行囊，洞见 +3、当地好感 +6、安稳 +5。');
 }
 const b=s.buildings.find(b=>b.id===id&&b.type==='outpost');if(!b||dist(s.player,b)>180||s.rural?.visit)return fail('先走近本地前哨站');
 if(action==='travel'){
  const reason=postTravelReason(s,id,value);if(reason)return fail(reason);const dest=world(s,value).buildings.find(b=>b.type==='outpost');
  s.inventory.crystal--;s.resonance-=2;const r=G.enterRiftRealm(s,value);s.player.x=dest.x;s.player.y=G.walkable(s,dest.x,dest.y+28)?dest.y+28:dest.y;
  if(s.symbiosis?.following){const c=s.symbiosis.companions[s.symbiosis.following];c.x=s.player.x-30;c.y=s.player.y+20;}
  record(s,'travel','抵达'+G.REALMS[value].name+'前哨');return{...r,reason:'抵达前哨站。消耗 1 原晶、2 共鸣；原来的虫洞仍可免费往返。'};
 }
 if(action==='rest'){
  if(e.rests[s.expedition.current]===G.day(s))return fail('今天已经在本图前哨休整，明天再来');
  if(danger(s,b,true))return fail('附近有危险，暂时不能休整');if(!G.craftAffordable(s,{ration:1,wood:2}))return fail('需要 1 旅行口粮与 2 木材，可用附近仓储');
  payCraft(s,{ration:1,wood:2});s.player.hp=Math.min(G.maxHealth(s),s.player.hp+25);s.player.hunger=Math.min(100,s.player.hunger+30);s.player.clarity=Math.min(100,s.player.clarity+15);s.wilderness.wetness=Math.max(0,s.wilderness.wetness-40);e.rests[s.expedition.current]=G.day(s);record(s,'rest','在前哨休整');return say(s,'在前哨吃过行粮，生命 +25、饱食 +30、意识 +15、湿冷 −40，不跳过整夜。');
 }
 if(action==='project'){
  const p=Object.hasOwn(COMMUNITY_PROJECTS,value)?COMMUNITY_PROJECTS[value]:null,realm=s.expedition.current;if(!p||!COMMUNITY_REALMS.includes(realm))return fail('未知共建项目');
  if(e.projects[value].includes(realm))return fail('本图已完成这一步，不会重复扣料');if(s.level<p.level)return fail('需要 '+p.level+' 级');
  if(value==='beacon'&&e.projects.supply.length<6)return fail('先完成六地补给约定');
  const last=e.projects[value].length===5;if(!G.craftAffordable(s,p.cost)||last&&Object.entries(p.reward).some(([k,n])=>(s.inventory[k]||0)+n>9999))return fail('共建材料不足，或最终回礼没有空间');
  payCraft(s,p.cost);e.projects[value].push(realm);record(s,'project',G.REALMS[realm].name+' · '+p.name);
  if(last){for(const[k,n]of Object.entries(p.reward))s.inventory[k]=(s.inventory[k]||0)+n;s.insight+=p.insight;}
  return say(s,p.name+' · '+e.projects[value].length+'/6。'+(last?'六地的共同成果已写进编年史。':'本地陈设已完成，下一站由你决定。'));
 }
 return fail('未知共同体行动');
}
export function communityLine(s,id){
 const e=s.community,stage=e?.requests[id]||0;if(!requestReason(s,id))return COMMUNITY_REQUESTS[id][stage].text;
 return stage>=2?'这件事是我们一起完成的，回来看看新布置吧。':'';
}
export function validateCommunity(s,num){
 const e=s.community;if(e===undefined)return;
 if(!e||e.version!==1||!Number.isInteger(e.gardens)||!num(e.gardens)||!e.requests||!e.announced||Object.keys(e.requests).length!==3||Object.keys(e.announced).length!==3||!e.projects||Object.keys(e.projects).length!==2||!e.rests||Array.isArray(e.rests)||!Array.isArray(e.log)||e.log.length>60)throw Error('共同体记录无效');
 for(const id of Object.keys(COMMUNITY_REQUESTS))if(!Number.isInteger(e.requests[id])||!num(e.requests[id],0,2)||!Number.isInteger(e.announced[id])||!num(e.announced[id],-1,2))throw Error('聚落生活事务无效');
 if(e.requests.ridge===2&&e.requests.bay<2)throw Error('饭篮交付顺序无效');
 for(const key of Object.keys(COMMUNITY_PROJECTS)){const list=e.projects[key];if(!Array.isArray(list)||list.length>6||new Set(list).size!==list.length||list.some(id=>!COMMUNITY_REALMS.includes(id)))throw Error('六地共建记录无效');}
 if(e.projects.beacon.length&&e.projects.supply.length!==6)throw Error('纪念碑前置无效');
 if(Object.entries(e.rests).some(([id,n])=>!COMMUNITY_REALMS.includes(id)||!Number.isInteger(n)||!num(n,1,G.day(s))))throw Error('前哨休整记录无效');
 if(e.log.some(x=>!x||!Number.isInteger(x.day)||!num(x.day,1,G.day(s))||!COMMUNITY_REALMS.includes(x.realm)||!['request','request-done','rest','travel','project'].includes(x.type)||typeof x.text!=='string'||x.text.length>160))throw Error('荒野编年史无效');
 for(const map of[s,...Object.values(s.expedition.worlds)])if(map.buildings.filter(b=>b.type==='trail').length>160||map.buildings.filter(b=>b.type==='outpost').length>1)throw Error('前哨或道路数量无效');
}
