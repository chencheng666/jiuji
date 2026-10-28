// 荒野生活扩展：天气、营地烹饪与诱捕；不依赖绘图和浏览器。
export const WILD_ITEMS = {
  rod:{name:'枝编钓竿',icon:'rod',durability:40},
  fish:{name:'溪鱼',icon:'fish',food:12,clarity:-3},
  fishsoup:{name:'暖身鱼汤',icon:'stew',food:62,health:20,clarity:14},
  mushroom:{name:'林地菌菇',icon:'mushroom',food:8,clarity:-4},
  meat:{name:'生肉',icon:'meat',food:9,clarity:-6},
  fur:{name:'柔软毛皮',icon:'fur'},
  roast:{name:'炙烤肉排',icon:'meat',food:36,health:10},
  stew:{name:'暖胃菌菇汤',icon:'stew',food:58,health:16,clarity:12},
  feast:{name:'猎人炖肉',icon:'stew',food:78,health:25,clarity:15},
  coat:{name:'毛皮披肩',icon:'fur',unique:true}
};
export const WILD_NODES = {
  pond:{name:'涟漪鱼塘',tool:'rod',hp:1,time:6,drop:{fish:2},regrow:55},
  mushroom:{name:'林地菌菇',hp:1,time:.7,drop:{mushroom:3},regrow:180},
  burrow:{name:'野兔洞',hp:1,time:1,drop:{}}
};
export const WILD_RECIPES = [
  {id:'rod',name:'枝编钓竿',category:'tools',cost:{twig:5,grass:6,flint:1},item:'rod',desc:'在涟漪鱼塘钓鱼，每次等待 6 秒。鱼塘 55 秒恢复，移动会中断。'},
  {id:'shelter',name:'枝叶庇护所',category:'camp',cost:{wood:8,grass:10,twig:4},building:'shelter',desc:'附近 125 步内阻挡雨水，缓慢晾干衣物。可在营火旁搭建。'},
  {id:'cookpot',name:'营地烹饪锅',category:'camp',cost:{stone:6,wood:4,twig:4},building:'cookpot',tech:'stonework',desc:'加入食材与木材，炖煮 12 秒。成品可留在锅内，之后再领取。'},
  {id:'trap',name:'诱捕笼',category:'survival',cost:{twig:4,grass:5},building:'trap',desc:'放在兔洞 180 步内。每次投入 1 浆果，60 秒后获得生肉和毛皮。'},
  {id:'roast',name:'炙烤肉排',category:'survival',cost:{meat:1},item:'roast',station:'campfire',desc:'饱食 +36，生命 +10。需要燃烧的营火。'},
  {id:'coat',name:'毛皮披肩',category:'tools',cost:{fur:3,grass:6},item:'coat',desc:'自动穿戴，让淋雨速度降低 75%。不消耗耐久。'}
];
export const DISHES = [
  {id:'fishsoup',name:'暖身鱼汤',cost:{fish:2,mushroom:1,wood:1},seconds:12,text:'饱食 +62 · 生命 +20 · 意识 +14 · 湿度 −25 · 体温向舒适区恢复'},
  {id:'stew',name:'暖胃菌菇汤',cost:{mushroom:2,berry:2,wood:1},seconds:12,text:'饱食 +58 · 生命 +16 · 意识 +12 · 湿度 −25'},
  {id:'feast',name:'猎人炖肉',cost:{meat:2,mushroom:1,wood:1},seconds:12,text:'饱食 +78 · 生命 +25 · 意识 +15 · 湿度 −25'}
];
export const near=(a,b,r)=>Math.hypot(a.x-b.x,a.y-b.y)<r;
export function weather(s){
  // 每两天一场可预见的雨。第一天给玩家准备营火和庇护所的时间。
  const t=s.time%600,start=355,end=445;
  const raining=t>=start&&t<end;
  return {raining,intensity:raining?Math.min(1,(t-start+1)/10,(end-t)/10):0,
    warning:t>=start-30&&t<start,remaining:raining?end-t:(t<start?start-t:600-t+start)};
}
export function shelterAt(s){return s.buildings.some(b=>b.type==='shelter'&&near(s.player,b,125));}
export function initWilderness(s){
  if(!s.wilderness){
    s.wilderness={wetness:0,pinned:null,impactSeq:0};
    const add=(type,x,y)=>s.nodes.push({id:'wild-'+type+'-'+x+'-'+y,type,x,y,hp:1,available:true,respawnAt:0});
    for(const [x,y] of [[1080,1520],[1430,1370],[940,1190],[1260,1040],[730,1350],[1600,1900],[1900,2240],[2180,1890],[950,1950],[1780,880]])add('mushroom',x,y);
    for(const [x,y] of [[1450,1900],[1040,1780],[1750,2060],[2250,2080],[1280,2210],[860,1460],[1640,1160]])add('burrow',x,y);
  }
  for(const [x,y] of [[1550,1670],[1010,1410],[2040,2110]])if(!s.nodes.some(n=>n.id==='pond-'+x))s.nodes.push({id:'pond-'+x,type:'pond',x,y,hp:1,available:true,respawnAt:0});
  s.wilderness.particles=[];s.wilderness.impact=null;
  for(const b of s.buildings)if(['cookpot','trap'].includes(b.type))b.inventory||={};
}
export function stepWilderness(s,dt){
  const w=weather(s),p=s.player,covered=shelterAt(s),warm=s.buildings.some(b=>b.type==='campfire'&&b.fuel>0&&near(p,b,165));
  let change=w.raining&&!covered&&s.level<8?1.05*w.intensity*(s.inventory.coat?.25:1):-.24;
  if(covered)change=-.7;if(warm)change=-1.8;
  s.wilderness.wetness=Math.max(0,Math.min(100,s.wilderness.wetness+change*dt));
  if(s.wilderness.wetness>65&&!warm&&!covered)p.clarity=Math.max(0,p.clarity-.09*dt);
  if(s.wilderness.wetness>90&&s.time%300>=230&&!warm&&!covered)p.hp-=.22*dt;
  for(const b of s.buildings){
    if(b.kitchen&&s.time>=b.kitchen.readyAt){const dish=b.kitchen.dish;b.inventory[dish]=(b.inventory[dish]||0)+1;b.kitchen=null;}
    if(b.type==='trap'&&b.baitAt&&s.time>=b.baitAt){b.inventory.meat=2;b.inventory.fur=1;b.baitAt=0;}
  }
  s.wilderness.particles=s.wilderness.particles.filter(f=>s.time-f.at<1);
}
export function impact(s,n){
  s.wilderness.impact={id:++s.wilderness.impactSeq,type:n.type,x:n.x,y:n.y,at:s.time};n.hitAt=s.time;
  for(let i=0;i<7;i++)s.wilderness.particles.push({x:n.x,y:n.y-25,at:s.time,vx:Math.cos(i*2.4)*48,vy:-25-i*5,color:n.type==='tree'?'#d7b278':n.type==='mushroom'?'#b27652':'#c4c0a0'});
  s.wilderness.particles=s.wilderness.particles.slice(-70);
}
