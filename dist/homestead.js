import * as G from './survival.js';
import {REALMS} from './expeditions.js';
// 林海回声：委托、探索与营地形成闭环；计时只在当前地图推进。
export const HOME_ITEMS={relicpart:{name:'古代构件',icon:'relicpart'},wildpod:{name:'林海种荚',icon:'wildpod'},root:{name:'甘露块根',icon:'root',food:18},grain:{name:'耐寒谷物',icon:'grain'},trailmeal:{name:'风干行粮',icon:'trailmeal',food:60,health:10,satiety:120},graincake:{name:'谷物饼',icon:'trailmeal',food:65,health:8},rootstew:{name:'甘露炖汤',icon:'stew',food:55,health:22,clarity:10},herbtea:{name:'荧光热饮',icon:'stew',food:18,clarity:20,warmth:true},lure:{name:'浆果诱饵',icon:'bush'}};
export const HOME_RECIPES=[
 {id:'fielddesk',name:'远征手记台',category:'camp',cost:{wood:8,stone:4,grass:6},building:'fielddesk',desc:'接受与交付九项远征委托。原岛交付，探索不必战斗。'},
 {id:'dryingrack',name:'旅行晾晒架',category:'camp',cost:{relicpart:2,wood:8,grass:6},building:'dryingrack',contract:true,desc:'完成首项委托后，用古代构件升级营地。浆果与生肉晾成行粮。'},
 {id:'nursery',name:'林海育苗床',category:'camp',cost:{relicpart:2,wood:8,grass:6},building:'nursery',contract:true,desc:'种植块根、耐寒谷物和荧光花。与晾晒架争用早期构件，需要再次远征。'},
 {id:'graincake',name:'谷物饼',category:'survival',cost:{grain:2,seed:1},item:'graincake',station:'campfire',desc:'饱食 +65、生命 +8，利用营地种植的谷物。'},
 {id:'herbtea',name:'荧光热饮',category:'survival',cost:{flower:2,grain:1,wood:1},item:'herbtea',station:'campfire',desc:'饱食 +18、意识 +20，体感温度向 25℃ 恢复一半。'},
 {id:'lure',name:'浆果诱饵',category:'weapons',cost:{berry:2,grass:1},item:'lure',desc:'背包使用，在身边放置诱饵，30 秒内吸引普通野怪。守卫不受影响。'}
];
export const HOME_DISHES=[{id:'rootstew',name:'甘露炖汤',cost:{root:2,mushroom:1,wood:1},seconds:12,text:'饱食 +55 · 生命 +22 · 意识 +10，利用育苗床收成'}];
export const CROPS={root:{name:'甘露块根',cost:{seed:2},drop:{root:3,seed:1},seconds:90,season:0,tip:'春季 90 秒，其他季节 135 秒。'},grain:{name:'耐寒谷物',cost:{wildpod:1},drop:{grain:3,seed:2},seconds:110,season:3,tip:'冬季 110 秒，其他季节 165 秒。'},flower:{name:'荧光花',cost:{seed:3,flower:1},drop:{flower:4,seed:1},seconds:100,season:1,tip:'夏季 100 秒，其他季节 150 秒。'}};
export const SPECIALTIES={bow:{steady:{name:'稳准射击',text:'伤害 25、射程 410，间隔 0.95 秒。'},rapid:{name:'轻弦连射',text:'伤害 15、射程 350，间隔 0.5 秒。'}},hammer:{stagger:{name:'震荡打断',text:'伤害 23、打断 1.2 秒，间隔 0.95 秒。'},crack:{name:'集中破甲',text:'伤害 35、范围 65，间隔 1.2 秒。'}}};
export const SITE_TYPES={
 well:{name:'受损古井',icon:'oldwell',text:'井壁留下古老构件。可以用工程快速修复，也可以种植与调理水土。',options:[{id:'repair',name:'工程修复',cost:{ingot:2,wood:4},seconds:6,drop:{relicpart:1},insight:5},{id:'restore',name:'生态修复',cost:{seed:4,berry:4},seconds:14,drop:{relicpart:1},insight:5,eco:5}]},
 pod:{name:'隐蔽种荚',icon:'wildpod',text:'树根间藏着适合寒地生长的种荚。耐心整理，不必猎杀生物。',options:[{id:'gather',name:'整理藤蔓',cost:{grass:2},seconds:8,drop:{wildpod:2,seed:3},insight:3}]},
 den:{name:'蛛丝林穴',icon:'fieldnest',text:'保持安静，记录巢穴结构。移动和攻击会中断观察；受到伤害也会中断。',options:[{id:'observe',name:'留下诱食，隐蔽观察',cost:{berry:2},seconds:12,drop:{silk:3,relicpart:1},insight:4}]},
 log:{name:'倒伏巨木',icon:'fallenlog',text:'风暴留下的木材与种子。收拾遗落物，可以减少继续砍伐。',options:[{id:'sort',name:'整理巨木',cost:{flint:2},seconds:7,drop:{wood:8,seed:2},insight:3}]},
 cache:{name:'旅人旧匣',icon:'oldcache',text:'残破行囊保留着一件构件和几份旧种子。',options:[{id:'open',name:'修开锁扣',cost:{flint:3,grass:3},seconds:9,drop:{relicpart:1,wildpod:1},insight:4}]},
 stone:{name:'回声石碑',icon:'echoStone',text:'放下手中的工具，听风走过石缝。',options:[{id:'listen',name:'以花回应回声',cost:{flower:2},seconds:10,drop:{},insight:6,resonance:4}]}
};
const maps=['verdant','cinder','frost'];
export const CONTRACTS=maps.flatMap(map=>['well','pod','den'].map((type,i)=>({id:map+'-'+type,map,type,name:REALMS[map].name+' · '+['修复古井','寻回种荚','观测巢穴'][i],text:['完成当地古井任一修复方案。','整理当地的隐蔽种荚。','在当地林穴完成一次隐蔽观察。'][i],reward:{relicpart:1,...(type==='pod'?{wildpod:1}:{seed:3})}})));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),fail=reason=>({ok:false,reason});
export function initHomestead(s){
 s.homestead??={mode:'survival',active:null,completed:[],sites:[],choices:{},specialty:{},satiety:0,recoveries:0,graves:[],lures:[],channel:null};
 const add=(map,id)=>{if(['home','tide','fungus'].includes(id))return;Object.keys(SITE_TYPES).forEach((type,i)=>{
  const siteId='site-'+id+'-'+type;if(map.nodes.some(n=>n.id===siteId))return;
  const bases=[[1600,1780],[1810,1390],[1470,1110],[2050,2000],[2440,1190],[990,2040]],jitter=(s.seed%61)-30;
  let x=bases[i][0]+jitter,y=bases[i][1]-jitter;
  for(const r of [0,75,130]){let found=false;for(let a=0;a<8;a++){const px=bases[i][0]+jitter+Math.cos(a*Math.PI/4)*r,py=bases[i][1]-jitter+Math.sin(a*Math.PI/4)*r;if(G.isLand(px,py)&&!map.nodes.some(n=>n.available&&distance(n,{x:px,y:py})<65)&&!map.buildings.some(b=>distance(b,{x:px,y:py})<100)){x=px;y=py;found=true;break;}}if(found)break;}
  map.nodes.push({id:siteId,type:'fieldsite',siteType:type,realm:id,x,y,hp:1,available:!s.homestead.sites.includes(siteId),respawnAt:0});
 });};
 add(s,s.expedition.current);for(const[id,map]of Object.entries(s.expedition.worlds))add(map,id);
 s.homestead.channel=null;
}
export function craftAmount(s,id){
 if(['insight','resonance'].includes(id))return G.amount(s,id);
 const item=G.ITEMS[id];let n=G.amount(s,id);if(!item||item.durability||item.unique)return n;
 for(const b of s.buildings)if(['chest','robotdock'].includes(b.type)&&distance(b,s.player)<=180)n+=b.inventory?.[id]||0;
 return n;
}
export function craftAffordable(s,cost){return Object.entries(cost||{}).every(([id,n])=>craftAmount(s,id)>=n);}
export function payCraft(s,cost){
 // 调用方必须先校验整份配方；先背包后附近箱子，不能远程取用休眠地图。
 for(const[id,n]of Object.entries(cost||{})){
  if(['insight','resonance'].includes(id)){s[id]-=n;continue;}let left=n;
  const take=Math.min(left,s.inventory[id]||0);s.inventory[id]=(s.inventory[id]||0)-take;left-=take;
  for(const b of s.buildings)if(left&&['chest','robotdock'].includes(b.type)&&distance(b,s.player)<=180){const v=Math.min(left,b.inventory?.[id]||0);if(v)b.inventory[id]-=v;left-=v;}
 }
}
function rewardsFit(s,drop){return Object.entries(drop).every(([id,n])=>(s.inventory[id]||0)+n<=9999);}
function reward(s,drop){for(const[id,n]of Object.entries(drop))s.inventory[id]=(s.inventory[id]||0)+n;}
export function contractProgress(s,c){return s.homestead.sites.includes('site-'+c.map+'-'+c.type);}
export function acceptContract(s,id){const c=CONTRACTS.find(c=>c.id===id),h=s.homestead;if(s.status!=='playing'||!c||!G.inHome(s)||!G.nearby(s,'fielddesk',180))return fail('在原岛远征手记台附近接受委托');if(h.active||h.completed.includes(id))return fail('先交付当前委托，已完成委托不可重复领取');if(s.level<G.REALMS[c.map].level)return fail('晋升到 '+G.REALMS[c.map].level+' 级后开启');h.active=id;return{ok:true,reason:'已追踪：'+c.name+'。打开地图查看探索点。'};}
export function claimContract(s){const h=s.homestead,c=CONTRACTS.find(c=>c.id===h.active);if(s.status!=='playing'||!c||h.completed.includes(c.id)||!G.inHome(s)||!G.nearby(s,'fielddesk',180))return fail('带着成果回到原岛远征手记台交付');if(!contractProgress(s,c))return fail('探索目标尚未完成');if(!rewardsFit(s,c.reward))return fail('请先腾出背包空间');reward(s,c.reward);h.completed.push(c.id);h.active=null;return{ok:true,reason:'委托完成：古代构件已放入行囊，可选择晾晒架或育苗床。'};}
export function siteReason(s,id,choice){const n=s.nodes.find(n=>n.id===id&&n.type==='fieldsite'),o=n&&Object.hasOwn(SITE_TYPES,n.siteType)?SITE_TYPES[n.siteType].options.find(o=>o.id===choice):null;if(s.status!=='playing'||!n||!o||n.realm!==s.expedition.current)return'这处探索点不在当前地图';if(!n.available||s.homestead.sites.includes(id))return'这处探索点已经完成';if(distance(s.player,n)>140)return'走近探索点后再开始';if(!G.affordable(s,o.cost))return'背包材料不足，探索点不远程使用营地箱子';if(!rewardsFit(s,o.drop))return'背包空间不足';return'';}
export function beginSite(s,id,choice){const reason=siteReason(s,id,choice);if(reason)return fail(reason);const n=s.nodes.find(n=>n.id===id),o=SITE_TYPES[n.siteType].options.find(o=>o.id===choice);s.action=null;s.target=null;s.path=[];s.channel=null;s.homestead.channel={id,choice,realm:s.expedition.current,elapsed:0,duration:o.seconds,hp:s.player.hp};return{ok:true,reason:'开始'+o.name+'，保持静止；完成时才扣材料。'};}
export function homeStation(s,b,action){
 if(s.status!=='playing'||!b||distance(s.player,b)>180)return fail('请先走近设施');
 if(action==='home-collect'){
  if(!['nursery','dryingrack'].includes(b.type))return fail('这里没有可领取的产物');let taken=0;
  for(const[id,n]of Object.entries(b.inventory||{})){const v=Math.min(n,9999-(s.inventory[id]||0));if(v){reward(s,{[id]:v});b.inventory[id]-=v;taken+=v;}}
  return taken?{ok:true,reason:'营地产物已放入行囊。'}:fail('尚无产物或背包空间不足');
 }
 if(action==='dry'){
  const cost={berry:4,meat:1};if(b.type!=='dryingrack'||b.crop||Object.values(b.inventory||{}).some(n=>n))return fail('先等待晾晒完成并取走产物');if(!craftAffordable(s,cost))return fail('需要 4 浆果、1 生肉（可用附近箱子）');payCraft(s,cost);b.crop={kind:'trailmeal',readyAt:s.time+70*(b.improved?.8:1)};return{ok:true,reason:'开始晾晒，70 秒后可领取行粮。'};
 }
 if(action.startsWith('sow:')){
  const id=action.split(':')[1],crop=Object.hasOwn(CROPS,id)?CROPS[id]:null;if(b.type!=='nursery'||!crop||b.crop||Object.values(b.inventory||{}).some(n=>n))return fail('请先收获这一床作物');if(!craftAffordable(s,crop.cost))return fail('播种材料不足');payCraft(s,crop.cost);b.crop={kind:id,readyAt:s.time+crop.seconds*(G.season(s).index===crop.season?1:1.5)*(b.improved?.8:1)};return{ok:true,reason:'播下'+crop.name+'，离开面板后继续生长。'};
 }
 return fail('未知营地操作');
}
export function chooseSpecialty(s,weapon,id){if(s.status!=='playing'||!(Object.hasOwn(SPECIALTIES,weapon)&&Object.hasOwn(SPECIALTIES[weapon],id))||!G.nearby(s,'fielddesk',180))return fail('走近远征手记台选择武器专长');if(!s.inventory[weapon])return fail('先制作对应武器');if(s.homestead.specialty[weapon]===id)return fail('已经掌握该专长');if(!s.inventory.relicpart)return fail('需要 1 古代构件，可通过非战斗探索获得');s.inventory.relicpart--;s.homestead.specialty[weapon]=id;return{ok:true,reason:'已选择「'+SPECIALTIES[weapon][id].name+'」。切换需重新消耗构件。'};}
export function placeLure(s){if(s.status!=='playing'||!s.inventory.lure)return fail('需要浆果诱饵');const h=s.homestead;if(h.lures.filter(x=>x.realm===s.expedition.current&&x.until>s.time).length>=3)return fail('当前地图最多同时放置三处诱饵');s.inventory.lure--;h.lures.push({realm:s.expedition.current,x:s.player.x,y:s.player.y,until:s.time+30});return{ok:true,reason:'放下诱饵。30 秒内吸引普通野怪；保持距离绕行。'};}
export function stepHomestead(s,dt,interrupted){
 const h=s.homestead;if(!h)return;h.satiety=Math.max(0,h.satiety-dt);h.lures=h.lures.filter(x=>x.until>s.time);
 if(h.channel){const a=h.channel,n=s.nodes.find(n=>n.id===a.id);
  if(interrupted||s.player.hp<a.hp||s.action||s.channel||s.path.length||s.expedition.current!==a.realm||!n||distance(s.player,n)>140){h.channel=null;s.message={id:++s.messageSeq,text:'探索已中断，材料未消耗。'};}
  else if((a.elapsed+=dt)>=a.duration){h.channel=null;const reason=siteReason(s,a.id,a.choice);if(reason){s.message={id:++s.messageSeq,text:reason};}else{const o=SITE_TYPES[n.siteType].options.find(o=>o.id===a.choice);for(const[id,v]of Object.entries(o.cost))s.inventory[id]-=v;reward(s,o.drop);s.insight+=o.insight||0;s.resonance=Math.min(100,s.resonance+(o.resonance||0));s.ecology=Math.min(100,s.ecology+(o.eco||0));h.sites.push(a.id);h.choices[a.id]=a.choice;n.available=false;s.message={id:++s.messageSeq,text:'完成「'+SITE_TYPES[n.siteType].name+'」。成果已收入行囊，返回手记台交付委托。'};}}
 }
 for(const b of s.buildings)if(b.crop&&s.time>=b.crop.readyAt){b.inventory??={};reward({inventory:b.inventory},b.crop.kind==='trailmeal'?{trailmeal:1}:CROPS[b.crop.kind].drop);b.crop=null;}
}
export function recoveryCamp(s){
 const home=s.expedition.current==='home'?s:s.expedition.worlds.home;return home?.buildings.find(b=>b.type==='campfire')||null;
}
export function recover(s,switchRealm){
 const h=s.homestead,camp=recoveryCamp(s);if(s.status!=='dead'||h.mode!=='explore'||!camp)return fail('探索模式且保留原岛营火时，可以返回营地');
 if(h.graves.length>=24)return fail('请先通过备份恢复进度；未取回的遗落包已达上限');
 const loot={};for(const[id,n]of Object.entries(s.inventory))if(!G.ITEMS[id].durability&&!G.ITEMS[id].unique&&!G.ITEMS[id].food&&n>=2){loot[id]=Math.floor(n/2);s.inventory[id]-=loot[id];}
 if(Object.keys(loot).length){const id='lostpack-'+(++h.recoveries);h.graves.push({id,realm:s.expedition.current,inventory:loot});s.nodes.push({id,type:'lostpack',x:s.player.x,y:s.player.y,hp:1,available:true,respawnAt:0});}else h.recoveries++;
 if(s.expedition.current!=='home')switchRealm(s,'home');s.player.x=camp.x;s.player.y=camp.y+35;s.player.hp=Math.min(G.maxHealth(s),80);s.player.hunger=60;s.player.clarity=75;s.wilderness.wetness=0;s.living.temperature=25;s.darkTime=0;s.enemies=[];s.action=null;s.target=null;s.path=[];s.channel=null;h.channel=null;s.status='playing';s.expedition.invulnerable=5;camp.fuel=Math.max(camp.fuel,90);
 return{ok:true,teleported:true,reason:'你在原岛营火醒来。装备与食物保留，半数普通材料留在原地图的遗落包。'};
}
export function reclaimPack(s,id){const h=s.homestead,g=h.graves.find(g=>g.id===id&&g.realm===s.expedition.current),n=s.nodes.find(n=>n.id===id);if(s.status!=='playing'||!g||!n||distance(s.player,n)>140)return fail('请走近当前地图的遗落包');let count=0;for(const[key,v]of Object.entries(g.inventory)){const take=Math.min(v,9999-(s.inventory[key]||0));if(take){reward(s,{[key]:take});g.inventory[key]-=take;count+=take;}}if(Object.values(g.inventory).every(n=>!n)){h.graves=h.graves.filter(g=>g.id!==id);s.nodes=s.nodes.filter(n=>n.id!==id);}return count?{ok:true,reason:'已取回遗落材料。'}:fail('背包空间不足，请先腾出位置');}
export function validateHomestead(s,num){
 const h=s.homestead;if(!h)return;
 if(!['explore','survival'].includes(h.mode)||!(h.active===null||CONTRACTS.some(c=>c.id===h.active))||!num(h.satiety,0,120)||!Number.isInteger(h.recoveries)||!num(h.recoveries))throw Error('营地生存状态无效');
 const ids=maps.flatMap(map=>Object.keys(SITE_TYPES).map(type=>'site-'+map+'-'+type));
 for(const[key,allowed]of [['completed',CONTRACTS.map(c=>c.id)],['sites',ids]])if(!Array.isArray(h[key])||h[key].some(id=>!allowed.includes(id))||new Set(h[key]).size!==h[key].length)throw Error('远征委托进度无效');
 if(h.active&&h.completed.includes(h.active))throw Error('委托状态冲突');
 if(!h.choices||Array.isArray(h.choices)||Object.entries(h.choices).some(([id,choice])=>!h.sites.includes(id)||!SITE_TYPES[id.split('-').at(-1)]?.options.some(o=>o.id===choice))||h.sites.some(id=>!h.choices[id]))throw Error('探索选择无效');
 if(!h.specialty||Array.isArray(h.specialty)||Object.entries(h.specialty).some(([w,id])=>!(Object.hasOwn(SPECIALTIES,w)&&Object.hasOwn(SPECIALTIES[w],id))))throw Error('武器专长无效');
 const inv=bag=>bag&&typeof bag==='object'&&!Array.isArray(bag)&&Object.entries(bag).every(([id,n])=>Object.hasOwn(G.ITEMS,id)&&!G.ITEMS[id].durability&&!G.ITEMS[id].unique&&Number.isInteger(n)&&num(n,0,9999));
 if(!Array.isArray(h.graves)||h.graves.length>24||new Set(h.graves.map(g=>g.id)).size!==h.graves.length||h.graves.some(g=>!g||typeof g.id!=='string'||!/^lostpack-\d+$/.test(g.id)||!Object.hasOwn(G.REALMS,g.realm)||!inv(g.inventory)))throw Error('遗落包无效');
 if(!Array.isArray(h.lures)||h.lures.length>12||h.lures.some(l=>!Object.hasOwn(G.REALMS,l.realm)||!num(l.x,0,3600)||!num(l.y,0,2800)||!num(l.until)))throw Error('诱饵状态无效');
 for(const[id,map]of [[s.expedition?.current||'home',s],...Object.entries(s.expedition?.worlds||{})]){
  for(const n of map.nodes){if(n.type==='fieldsite'&&(!Object.hasOwn(SITE_TYPES,n.siteType)||n.realm!==id||n.id!=='site-'+id+'-'+n.siteType||n.available===h.sites.includes(n.id)))throw Error('探索点状态无效');if(n.type==='lostpack'&&!h.graves.some(g=>g.id===n.id&&g.realm===id))throw Error('遗落包地图无效');}
  for(const b of map.buildings)if(b.crop&&(Object.values(b.inventory||{}).some(n=>n>0)||!['nursery','dryingrack'].includes(b.type)||!num(b.crop.readyAt)||!(b.type==='nursery'?Object.hasOwn(CROPS,b.crop.kind):b.crop.kind==='trailmeal')))throw Error('作物状态无效');
 }
 h.channel=null;
}
