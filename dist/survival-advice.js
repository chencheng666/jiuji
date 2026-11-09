import * as G from './survival.js';
import {temperatureTarget,SEASONS} from './seasons.js';
const safe=s=>[...s.nodes,...s.buildings].filter(n=>n.available!==false&&(n.fuel===undefined||n.type!=='campfire'||n.fuel>0)&&s.explored.includes(Math.floor(n.x/160)+','+Math.floor(n.y/160))&&G.walkable(s,n.x,n.y));
const nearest=(s,types)=>safe(s).filter(n=>types.includes(n.type)).sort((a,b)=>G.distance(s.player,a)-G.distance(s.player,b))[0]||null;
export function hungerWindow(s){
 if(s.level>=9)return null;
 // 按持续奔跑估算，明确假设；不把预测写成保证，也不改变实际消耗。
 const rate=.12*(s.homestead.satiety>0?.6:1)*(s.level>=7?.5:1)+(s.level<8&&(s.living.temperature<6||s.living.temperature>33)?.025:0);
 return{seconds:Math.floor(s.player.hunger/rate),days:s.player.hunger/rate/300};
}
export function seasonTrend(s){
 const current=G.season(s);if(current.day!==4)return null;
 const next=SEASONS[(current.index+1)%4],delta=next.temperature-current.temperature;
 return{next:next.name,seconds:Math.ceil(current.remaining),direction:delta>0?'升温':delta<0?'降温':'平稳',tip:next.tip};
}
export function survivalAdvice(s){
 const alerts=[],p=s.player,window=hungerWindow(s),target=temperatureTarget(s),weather=G.weather(s);
 const add=(id,title,detail,severity,extra={})=>alerts.push({id,title,detail,severity,...extra});
 if(p.hunger<=40&&window){
  const foods=Object.entries(s.inventory).filter(([id,n])=>n>0&&G.ITEMS[id]?.food>0).sort(([a],[b])=>(G.ITEMS[a].clarity<0?1:0)-(G.ITEMS[b].clarity<0?1:0)||G.ITEMS[b].food-G.ITEMS[a].food),food=foods[0]?.[0],node=nearest(s,['bush']);
  add('hunger',p.hunger<=20?'尽快补充食物':'该准备下一餐了',`当前饱食 ${Math.ceil(p.hunger)}。按持续奔跑估算，约 ${window.days.toFixed(1)} 个游戏日后耗尽；休息和进食会改变时间。`+(food?'行囊里有'+G.ITEMS[food].name+(G.ITEMS[food].clarity<0?'，生食会减少意识，建议先烹饪。':'。'):node?'已探索区域有浆果丛，可前往采集。':'附近尚未发现可采食物，先探索浆果丛或准备烹饪。'),p.hunger<=20?2:1,{food,node});
 }
 if(s.level<8&&(s.living.temperature<12||target<6)){
  const node=nearest(s,['campfire','shelter']);add('cold',s.living.temperature<6?'体温过低':target<6?'寒冷正在靠近':'体温偏低',`体感 ${Math.round(s.living.temperature)}℃，当前环境趋向 ${Math.round(target)}℃。`+(s.living.temperature>6&&target<6?`维持当前条件，约 ${Math.ceil((s.living.temperature-6)/.3)} 秒后接近受寒线。`:'')+'靠近营火、进入庇护所，或穿披肩、点火炬；预警本身不降低能力。',s.living.temperature<6?2:1,{node});
 }
 if(s.level<8&&(s.living.temperature>30||target>33))add('heat',s.living.temperature>33?'需要避暑':target>33?'注意接下来的高温':'体感偏热',`体感 ${Math.round(s.living.temperature)}℃，当前环境趋向 ${Math.round(target)}℃。进入庇护所或准备鱼汤，避免长时间暴露。`,s.living.temperature>33?2:1,{node:nearest(s,['shelter'])});
 const phase=s.time%300,toNight=230-phase;
 if(phase<230&&toNight<=50&&!G.lightAt(s,p.x,p.y))add('night','天色将暗',`距夜晚约 ${Math.ceil(toNight)} 秒。${s.inventory.torch?'行囊已有火炬，确认点亮并留意剩余燃料。':'准备火炬，或提前回到有燃料的营火。'}`,1,{node:nearest(s,['campfire','lantern'])});
 if(phase>=230&&!G.lightAt(s,p.x,p.y))add('dark','先回到光里','夜影会伤害角色。点亮火炬，或回到有燃料的营火。',2,{node:nearest(s,['campfire','lantern'])});
 const fire=G.nearby(s,'campfire',180);
 if(fire){const rate=(G.phase(s)==='night'?1:.28)*(weather.raining?1.35:1),seconds=Math.ceil(fire.fuel/rate);if(seconds<100)add('fuel','营火需要备柴',`按当前昼夜和天气，约还能燃烧 ${seconds} 秒。添 1 木材增加 70 燃料；雨天烧得更快。`,seconds<30?2:1,{fire});}
 if(weather.warning&&!G.shelterAt(s))add('rain','雨云将至',`约 ${Math.ceil(weather.remaining)} 秒后可能下雨。备好柴火，进入庇护所可避免淋湿。`,1,{node:nearest(s,['shelter'])});
 const trend=seasonTrend(s);if(trend)add('season',trend.next+'将至 · '+trend.direction,`约 ${trend.seconds} 秒后换季（本季最后一天）。${trend.tip}`,0);
 return alerts.sort((a,b)=>b.severity-a.severity);
}
