import {bindVillageLife,initVillageLife,stepVillageLife,validateVillageLife} from './village-life.js';
// 原创聚落协作：交易有库存，委托有交付，战术演练不消耗生存物资。
let G;export function bindSettlements(rules){G=rules;bindVillageLife(rules,VILLAGES);}
export const VILLAGES={
 bay:{name:'河湾聚落',npc:'禾 · 守岸人',level:1,x:1530,y:1580,color:'#d5bd87',intro:'潮水把你送来了。先留下一团火，再决定要走多远。',want:{wood:4},gift:{berry:4},quest:{name:'给第一夜留一点温暖',cost:{wood:6,grass:4},reward:{cooked:2},text:'准备燃料和干燥纤维，帮助守岸人修好公共火塘。'},care:{seed:3,wood:3}},
 ridge:{name:'石脊聚落',npc:'砾 · 修械师',level:2,x:2130,y:1470,color:'#b9b4a3',intro:'我们交换手艺，也交换修复旧机器的办法。',want:{ore:4,wood:2},gift:{ingot:1},quest:{name:'停摆的风轮',cost:{stone:8,board:2},reward:{relicpart:1},text:'补好风轮基座与叶片，让聚落有稳定的动力。'},care:{stone:6,flint:3}},
 reed:{name:'星苇聚落',npc:'芦 · 观星人',level:3,x:1720,y:2090,color:'#9fc9b1',intro:'树根接住土壤，记忆接住我们。欢迎带着问题来。',want:{flower:3},gift:{seed:5},quest:{name:'找回河岸的种子',cost:{seed:8,flower:3},reward:{blueprint:1},text:'为水边的育苗地带回不同种子与夜间照明。'},care:{flower:3,grass:5}}
};
export const VILLAGE_TECH=[
 {id:'greeting',name:'围火约定',requires:[],level:1,cost:{wood:2},text:'完成见面教学，开启三聚落的礼物交换与委托。'},
 {id:'barter',name:'公平交换',requires:['greeting'],level:1,cost:{grass:3,stone:2},text:'每天每地可交换 3 次；持有物资才可成交，不使用货币。'},
 {id:'care',name:'公共火塘',requires:['greeting'],level:2,cost:{wood:6,stone:4},text:'支持聚落食物与燃料储备，让人口在安稳生活中增长。'},
 {id:'watch',name:'守望手势',requires:['barter'],level:2,cost:{twig:4,flint:2},text:'在演练场读懂三格预警，开启巡械据点事件。'},
 {id:'workshop',name:'协作工坊',requires:['care','watch'],level:3,cost:{board:2,ingot:1},text:'据点队伍耐久 +4、出手伤害 +1；不影响野外角色生命。'},
 {id:'council',name:'共生议事',requires:['workshop'],level:4,cost:{crystal:2,flower:4},text:'高好感聚落的每日食物消耗减少 1，最低仍为 1。'}
];
const has=(o,k)=>Object.hasOwn(o||{},k),fail=reason=>({ok:false,reason}),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function initSettlements(s,legacy=false){
 s.settlements??={intro:legacy?3:0,expert:legacy,lesson:0,mercyUsed:false,death:null,active:null,tech:[],encounter:null,villages:Object.fromEntries(Object.keys(VILLAGES).map(id=>[id,{met:false,affinity:0,population:3,comfort:50,food:0,fuel:0,day:G.day(s),trades:0,quest:false,outpost:false}]))};
 const home=G.inHome(s)?s:s.expedition.worlds.home;if(home)for(const[id,d]of Object.entries(VILLAGES))if(!home.nodes.some(n=>n.id==='village-'+id)){
  let p={x:d.x,y:d.y};for(let i=0;i<32;i++){const q={x:d.x+Math.cos(i*2.4)*Math.floor(i/8)*65,y:d.y+Math.sin(i*2.4)*Math.floor(i/8)*65};if(G.isLand(q.x,q.y)&&!home.nodes.some(n=>dist(n,q)<60)&&!home.buildings.some(n=>dist(n,q)<80)){p=q;break;}}
  home.nodes.push({id:'village-'+id,type:'settlement',village:id,...p,hp:1,available:true,respawnAt:0});
 }
 initVillageLife(s);return s.settlements;
}
export function guideStage(s){if(s.stats.nights)return 3;if(s.buildings.some(b=>b.type==='campfire'))return 2;if(s.inventory.axe||s.crafted.includes('axe'))return 1;return 0;}
export function guideGoal(s){return[
 ['拾起第一把石斧','先拾取 2 树枝和 2 燧石，打开合成制作石斧。'],['给第一夜留一团火','砍树与采石，准备 5 木材、4 石料、2 纤维，建营火。'],['把长夜交给营火','备好食物和柴，靠近营火等待天亮；研究与远征可以稍后再学。'],['去和守岸人打个招呼','靠近地图上的河湾聚落，与禾交谈，先完成免费的交换与守望演练。']][guideStage(s)];}
function outputFits(s,bag){return Object.entries(bag).every(([id,n])=>G.amount(s,id)+n<=9999);}
function reward(s,bag){for(const[id,n]of Object.entries(bag))s.inventory[id]=(s.inventory[id]||0)+n;}
function pay(s,bag){if(!G.craftAffordable(s,bag))return false;G.payCraft(s,bag);return true;}
function near(s,id){const n=s.nodes.find(n=>n.id==='village-'+id);return G.inHome(s)&&n&&dist(s.player,n)<150&&s.level>=VILLAGES[id].level;}
const success=reason=>({ok:true,reason});
export function villageTechReason(s,t){if(s.settlements.tech.includes(t.id))return'已掌握';if(s.level<t.level)return'需要 '+t.level+' 级';const missing=t.requires.filter(x=>!s.settlements.tech.includes(x));if(missing.length)return'还差：'+missing.map(id=>VILLAGE_TECH.find(t=>t.id===id).name).join('、');if(!G.craftAffordable(s,t.cost))return'还差材料：'+Object.entries(t.cost).filter(([k,n])=>G.craftAmount(s,k)<n).map(([k,n])=>G.ITEMS[k].name+' '+(n-G.craftAmount(s,k))).join('、');return'';}
export function settlementAction(s,action,id='',value=''){
 const e=s.settlements;if(s.status!=='playing')return fail('先返回正在继续的旅程');
 if(action==='intro'){e.intro=Math.min(3,e.intro+1);return success('岸边的脚印，正通向新的故事。');}
 if(action==='skip'){e.intro=3;e.expert=true;return success('已展开全部系统，可在菜单重新阅读引导。');}
 if(action==='expert'){e.expert=!e.expert;return success(e.expert?'已展开全部系统':'已恢复渐进引导');}
 if(action==='replay'){e.intro=0;return success('重新阅读开场，不会重置世界。');}
 const d=VILLAGES[id],v=e.villages[id];if(!has(VILLAGES,id)||!near(s,id))return fail('先走近已开放等级的聚落，与当地居民交谈');
 v.met=true;
 if(action==='lesson'){e.lesson=Math.min(3,e.lesson+1);return success(['','先看投入和所得；正式交易会消耗物资，演练不会。','先接受委托，备齐物资后回到同一个居民面前交付。','红格是巡械下一轮落点。移动避开，守住同一格，或冒险出手。'][e.lesson]);}
 if(action==='tech'){const t=VILLAGE_TECH.find(t=>t.id===value);if(!t)return fail('未知聚落研究');const reason=villageTechReason(s,t);if(reason)return fail(reason);if(e.lesson<1)return fail('先听完第一段见面教学');pay(s,t.cost);e.tech.push(t.id);return success('掌握聚落手艺：'+t.name);}
 if(action==='trade'){
  if(e.lesson<1||!e.tech.includes('barter'))return fail('先学习见面教学与公平交换');if(v.trades>=3)return fail('当地今日交换库存已用完，明天再来');if(!outputFits(s,d.gift)||!pay(s,d.want))return fail('交换物资不足或背包空间不足');reward(s,d.gift);v.trades++;v.affinity=Math.min(100,v.affinity+2);return success('双方确认了交换，今日还可交换 '+(3-v.trades)+' 次。');
 }
 if(action==='accept'){if(e.lesson<2||!e.tech.includes('greeting'))return fail('先听完委托教学并掌握围火约定');if(e.active||v.quest)return fail('先完成已接受委托；每项委托只可交付一次');e.active=id;return success('接受委托：'+d.quest.name+'。带齐物资后回来交付。');}
 if(action==='deliver'){if(e.active!==id||v.quest)return fail('先在此地接受尚未完成的委托');if(!outputFits(s,d.quest.reward)||!pay(s,d.quest.cost))return fail('交付物资不足或奖励没有空间');reward(s,d.quest.reward);v.quest=true;e.active=null;v.affinity=Math.min(100,v.affinity+15);v.comfort=Math.min(100,v.comfort+15);s.insight+=3;return success('委托完成，好感 +15，洞见 +3。');}
 if(action==='supply'){if(!e.tech.includes('care'))return fail('先掌握公共火塘');if(v.food>94||v.fuel>94)return fail('公共库存已足够，请等居民使用后再投入');if(!pay(s,{berry:3,wood:3}))return fail('需要 3 浆果和 3 木材');v.food+=6;v.fuel+=6;v.affinity=Math.min(100,v.affinity+2);return success('公共储备已补充；居民在原岛世界运行时每日使用，不离线生产。');}
 if(action==='repair'){if(e.lesson<3||!e.tech.includes('watch')||v.outpost)return fail('完成守望教学与研究，选择尚未安定的据点');if(!outputFits(s,{relicpart:1}))return fail('背包已满');if(!pay(s,d.care))return fail('修复材料不足');v.outpost=true;v.affinity=Math.min(100,v.affinity+10);reward(s,{relicpart:1});return success('据点和平修复，巡械停止侵扰。构件奖励与战斗路线相同。');}
 if(action==='practice'||action==='battle'){
  if(e.encounter)return fail('先完成或退出当前演练');const practice=action==='practice';if(e.lesson<3)return fail('先听完三段见面教学');if(!practice&&(!e.tech.includes('watch')||v.outpost))return fail('先掌握守望手势，并选择尚未安定的据点');if(!practice&&!pay(s,{twig:2,berry:1}))return fail('据点出发需要 2 树枝、1 浆果');
  e.encounter={village:id,practice,hp:e.tech.includes('workshop')?16:12,enemy:12,position:0,enemyLane:0,warning:1,turn:0,log:'先观察红格，再决定站位。点击一格移动会经过一轮；攻击仅命中同格巡械。'};return success(practice?'免费演练开始，不会损失角色生命和背包。':'巡械据点开始。撤回或失败不追加扣料。');
 }
 if(action==='retreat'){if(e.encounter?.village!==id)return fail('这里没有进行中的据点事件');e.encounter=null;return success('已结束据点事件，角色生命和背包保持原状。');}
 if(['move','strike','guard'].includes(action)){
  const b=e.encounter;if(!b||b.village!==id)return fail('先开始演练或据点事件');if(action==='move'){const lane=Number(value);if(!Number.isInteger(lane)||lane<0||lane>2||lane===b.position)return fail('选择另一个格子');b.position=lane;}
  if(!b.practice&&action==='strike'&&b.position===b.enemyLane&&b.enemy<=(e.tech.includes('workshop')?5:4)&&!outputFits(s,{relicpart:1}))return fail('背包没有奖励空间，请先退出整理');
  if(action==='strike'&&b.position===b.enemyLane)b.enemy=Math.max(0,b.enemy-(e.tech.includes('workshop')?5:4));
  if(b.enemy===0){if(!b.practice&&!outputFits(s,{relicpart:1}))return fail('背包没有奖励空间，请先退出整理');if(!b.practice){v.outpost=true;v.affinity=Math.min(100,v.affinity+10);reward(s,{relicpart:1});}e.encounter=null;return success(b.practice?'演练完成！正式据点也可以选择交付材料和平修复。':'据点安定，获得 1 古代构件，好感 +10。');}
  const hit=b.position===b.warning&&action!=='guard';if(hit)b.hp=Math.max(0,b.hp-4);b.turn++;b.enemyLane=b.turn%3;b.warning=[1,1,0,2,0,2][b.turn%6];b.log=hit?'这一轮站在预警格中，队伍耐久 −4。':'成功避开或格挡了预警。';if(!b.hp){e.encounter=null;return success('本次演练或据点暂未完成：先读红格再行动，角色无死亡惩罚。');}return success(b.log);
 }
 return fail('未知聚落行动');
}
export function stepSettlements(s,dt=0){const e=s.settlements;if(!e||!G.inHome(s))return;for(const v of Object.values(e.villages)){
 const now=G.day(s);if(v.day===now)continue;v.day=now;v.trades=0;if(!v.met)continue;
 const food=Math.max(1,Math.ceil(v.population/3)-(e.tech.includes('council')&&v.affinity>=40?1:0));if(v.food>=food&&v.fuel>=1){v.food-=food;v.fuel--;v.comfort=Math.min(100,v.comfort+8);if(v.affinity>=15&&v.comfort>=65)v.population=Math.min(10,v.population+1);}else v.comfort=Math.max(0,v.comfort-5);
 }initVillageLife(s);if(dt>0)stepVillageLife(s,dt);}
export function recordDeath(s){const w=G.weather(s),cause=s.player.hunger<=0?'缺粮':s.darkTime>6?'缺光':w.raining&&s.wilderness.wetness>60?'淋雨':s.ecology<25?'生态压力':s.living.temperature<5?'失温':'战斗或环境伤害';s.settlements.death={cause,tip:({缺粮:'保留浆果，先学会在营火烤食物。',缺光:'天黑前准备营火燃料或一支火炬。',淋雨:'下雨时到庇护所避雨，火边烘干衣物。',生态压力:'砍树后补种，花与农圃都需要健康土地。',失温:'寒地远征先准备披肩、热食和营火。'})[cause]||'先观察蓄力预警，闪避后再攻击；演练不损失角色生命。'};}
export function validateSettlements(s,num){const e=s.settlements;if(e===undefined)return;const integer=(v,a=0,b=1e9)=>Number.isInteger(v)&&num(v,a,b),list=(x,valid)=>Array.isArray(x)&&new Set(x).size===x.length&&x.every(id=>valid.includes(id));
 if(!e||!integer(e.intro,0,3)||!integer(e.lesson,0,3)||typeof e.expert!=='boolean'||typeof e.mercyUsed!=='boolean'||!(e.active===null||has(VILLAGES,e.active))||!list(e.tech,VILLAGE_TECH.map(t=>t.id)))throw Error('聚落引导数据无效');
 if(e.death!==null&&(!e.death||typeof e.death.cause!=='string'||e.death.cause.length>30||typeof e.death.tip!=='string'||e.death.tip.length>150))throw Error('失败复盘数据无效');
 if(e.tech.some(id=>VILLAGE_TECH.find(t=>t.id===id).requires.some(pre=>!e.tech.includes(pre))))throw Error('聚落科技前置无效');
 if(!e.villages||Object.keys(e.villages).length!==3||Object.entries(e.villages).some(([id,v])=>!has(VILLAGES,id)||!v||!['met','quest','outpost'].every(k=>typeof v[k]==='boolean')||!integer(v.affinity,0,100)||!integer(v.comfort,0,100)||!integer(v.population,3,10)||!integer(v.food,0,100)||!integer(v.fuel,0,100)||(!integer(v.day,1)||v.day>G.day(s))||!integer(v.trades,0,3)))throw Error('聚落经营进度无效');
 for(const map of [s,...Object.values(s.expedition.worlds)])for(const n of map.nodes||[])if(n.type==='settlement'&&(!has(VILLAGES,n.village)||n.id!=='village-'+n.village))throw Error('聚落地点无效');
 validateVillageLife(s,num);
 const b=e.encounter;if(b!==null&&(!b||!has(VILLAGES,b.village)||typeof b.practice!=='boolean'||!integer(b.hp,1,16)||!integer(b.enemy,0,12)||!integer(b.position,0,2)||!integer(b.enemyLane,0,2)||!integer(b.warning,0,2)||!integer(b.turn)||typeof b.log!=='string'||b.log.length>200))throw Error('据点事件进度无效');
}
