let G;
export function bindCampLiving(rules){G=rules;}
export const CAMP_ITEMS={jointcrate:{name:'两地协作物资箱',icon:'chest',unique:true}};
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),fail=reason=>({ok:false,reason});
export function initCampLiving(s){s.campLiving??={version:1,memory:{},tracked:null,joint:0};return s.campLiving;}
const permanent=s=>!['tide','fungus'].includes(s.expedition.current);
export const exploredAt=(s,n)=>s.explored.includes(Math.floor(n.x/160)+','+Math.floor(n.y/160));
export function rememberResource(s,n){
 if(!permanent(s)||!G.NODES[n.type]?.drop||!Object.keys(G.NODES[n.type].drop).length)return;
 const e=initCampLiving(s),map=e.memory[s.expedition.current]??={};map[n.id]={id:n.id,type:n.type,x:n.x,y:n.y,at:s.time};
 if(Object.keys(map).length>160){const oldest=Object.values(map).sort((a,b)=>a.at-b.at)[0];delete map[oldest.id];}
}
export function rememberedResources(s){const map=s.campLiving?.memory[s.expedition.current]||{};const nodes=new Map(s.nodes.map(n=>[n.id,n]));return Object.values(map).map(m=>{const n=nodes.get(m.id);return n&&exploredAt(s,n)?{...m,available:n.available,remaining:Math.max(0,n.respawnAt-s.time),node:n}:null;}).filter(Boolean);}
export function inspectable(s,n){return !!n&&!s.rural?.visit&&(s.buildings.some(b=>b.id===n.id)||exploredAt(s,n));}
export function campLivingAction(s,action,id){
 if(s.status!=='playing')return fail('先返回正在进行的旅程');const e=initCampLiving(s);
 if(action==='track'){
  const n=[...s.nodes,...s.buildings].find(n=>n.id===id);if(!permanent(s))return fail('临时裂隙每趟都会变化，请使用本趟地图导航');if(!inspectable(s,n))return fail('只能追踪当前地图中已经发现的目标');
  e.tracked=e.tracked?.realm===s.expedition.current&&e.tracked.id===id?null:{realm:s.expedition.current,id};return{ok:true,reason:e.tracked?'已标记目标，可在地图查看；不会自动移动。':'已取消目标追踪。'};
 }
 if(action!=='joint')return fail('未知营地操作');
 const required=e.joint===0?'bay':'ridge',node=s.nodes.find(n=>n.id==='village-'+required);
 if(e.joint===2)return fail('两地协作已经完成');if(id!==required||!G.inHome(s)||!node||distance(s.player,node)>155||s.level<G.VILLAGES[required].level)return fail('先走近当前阶段对应的聚落，不能远程交付');
 const cost=e.joint===0?{wood:6,grass:6}:{jointcrate:1,stone:6,flint:2},reward=e.joint===0?{jointcrate:1}:{blueprint:1,feed:3};
 if(!G.craftAffordable(s,cost))return fail('共同事务材料不足；协作物资箱需要放在随身行囊');
 if(Object.entries(reward).some(([k,n])=>(s.inventory[k]||0)+n>9999))return fail('先为回礼腾出行囊空间');
 G.payCraft(s,cost);for(const[k,n]of Object.entries(reward))s.inventory[k]=(s.inventory[k]||0)+n;e.joint++;
 const text=e.joint===1?'河湾打好了协作物资箱。把它带到石脊，和修械师完成共用储物架。':'两地共用储物架完成！远征图纸 +1、饲料 +3、洞见 +4，两地好感与安稳提升。';
 if(e.joint===2){s.insight+=4;for(const village of['bay','ridge']){const v=s.settlements.villages[village];v.affinity=Math.min(100,v.affinity+6);v.comfort=Math.min(100,v.comfort+5);}}
 s.message={id:++s.messageSeq,text};s.journal.unshift({day:G.day(s),text});s.journal=s.journal.slice(0,80);return{ok:true,reason:text};
}
// 对话只表达性格与当前状况，不以随机负面特质扣减伙伴能力。
const REACTIONS={
 danger:{botanist:'先别赶路，我看看你的伤。补给好了再一起走。',engineer:'先撤到安全处，机器可以晚一点修。',ranger:'前面的路我记住了，先避开危险。',keeper:'回来坐一会儿，先把自己照顾好。'},
 rain:{botanist:'雨水适合种子，人还是先找个屋檐。',engineer:'把工具收干燥，雨停后我接着修。',ranger:'雨会盖住脚印，这趟别走得太急。',keeper:'柴先放到干处，今晚还能留一锅热饭。'},
 winter:{botanist:'下季会冷，种子和保暖衣物都要提前留好。',engineer:'低温前把工具修好，外出就少一件担心的事。',ranger:'迁徙的花鹿快来了，我们留一条安静的路。',keeper:'冬天快到了，给归来的人留点柴和行粮。'},
 joint:{botanist:'两地愿意分享储物手艺，种子也能带去更远的地方。',engineer:'那只共用储物架，是两边一起做出来的。',ranger:'河湾到石脊这条路，现在也有共同的故事了。',keeper:'你带回的不只是回礼，还有愿意一起做事的人。'},
 animals:{botanist:'你记下的动物，告诉我们这一季过得怎么样。',engineer:'食槽有储备后，让机器接手，人就能再走远一点。',ranger:'肯安静观察，往往比追着跑更容易认识它们。',keeper:'鸡蛋能留一顿热饭，兔绒能留一点温暖。'},
 home:{botanist:'留一片土给野花，明天再看看长出了什么。',engineer:'我想让工具好修、好用，也让人有时间休息。',ranger:'要出门的话带点诱饵，有些路可以绕着走。',keeper:'不赶时间，火还在，回来就能歇一会儿。'}
};
export function companionReaction(s,id){
 const season=Math.floor(s.time/1200)%4,day=Math.floor(s.time/300)%4+1;
 const key=s.player.hp<40?'danger':G.weather(s).raining?'rain':season===2&&day>=3?'winter':s.campLiving?.joint===2?'joint':Object.keys(s.rural?.seen||{}).length>=2?'animals':'home';
 return REACTIONS[key][id]||'';
}
export function villageContextLine(s,id){const joint=s.campLiving?.joint;if(joint===1)return id==='ridge'?'河湾准备的物资箱，可以带来一起修储物架。':id==='bay'?'木料装好了，石脊的人正等着一起动手。':null;if(joint===2&&['bay','ridge'].includes(id))return'这只储物架是两地一起做的，路上的人都用得上。';return null;}
export function validateCampLiving(s,num){
 const e=s.campLiving;if(e===undefined)return;
 if(!e||e.version!==1||!Number.isInteger(e.joint)||e.joint<0||e.joint>2||!e.memory||Array.isArray(e.memory))throw Error('营地协作记录无效');
 for(const[realm,map]of Object.entries(e.memory)){const world=realm===s.expedition.current?s:s.expedition.worlds[realm];if(!world||['tide','fungus'].includes(realm)||!map||Array.isArray(map)||Object.keys(map).length>160)throw Error('资源地图记忆无效');for(const[id,n]of Object.entries(map))if(!n||id!==n.id||!num(n.x,0,3600)||!num(n.y,0,2800)||!num(n.at,0,s.time)||!world.nodes.some(o=>o.id===id&&o.type===n.type&&Math.abs(o.x-n.x)<.001&&Math.abs(o.y-n.y)<.001))throw Error('资源地图记忆无效');}
 if(e.tracked!==null){const t=e.tracked,world=t?.realm===s.expedition.current?s:s.expedition.worlds[t?.realm];if(!world||typeof t.id!=='string'||![...world.nodes,...world.buildings].some(n=>n.id===t.id))throw Error('资源追踪记录无效');}
}
