import * as G from './survival.js';
import {payCraft} from './homestead.js';
import {AUTO_RECIPES,SITES,CONTACTS,GUARDIAN_REPAIR,SIGNAL_COST,INITIAL_HEALTH} from './odyssey-data.js';
export * from './odyssey-data.js';
const own=(o,k)=>Object.hasOwn(o,k), clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,v));
const fail=reason=>({ok:false,reason});
const stock=(bag,id)=>bag?.[id]||0;
const fits=(bag,drop)=>Object.entries(drop).every(([id,n])=>stock(bag,id)+n<=9999);
function give(bag,drop){for(const[id,n]of Object.entries(drop))bag[id]=stock(bag,id)+n;}
function say(s,text){s.message={id:++s.messageSeq,text};s.journal.unshift({day:G.day(s),text});s.journal=s.journal.slice(0,80);return{ok:true,reason:text};}
export const isOdyssey=s=>s.odyssey?.campaign==='odyssey';
export function allMaps(s){return [[s.expedition.current,s],...Object.entries(s.expedition.worlds)];}
export function worldState(s,id){return id===s.expedition.current?s:s.expedition.worlds[id];}
export function hasFacility(s,realm,type){return !!worldState(s,realm)?.buildings.some(b=>b.type===type);}
export function traceBeam(mirrors){
  const places=[[1,1],[1,0],[4,0],[4,2]],points=[{x:-1,y:1}];let x=-1,y=1,dx=1,dy=0,relay=false;
  for(let i=0;i<60;i++){
    x+=dx;y+=dy;points.push({x,y});
    if(x<0||x>=6||y<0||y>=4)return{points,solved:x===6&&y===2&&relay};
    if(x===3&&y===0)relay=true;
    const index=places.findIndex(p=>p[0]===x&&p[1]===y);
    if(index>=0){if(mirrors[index]===0)[dx,dy]=[-dy,-dx];else[dx,dy]=[dy,dx];}
  }
  return{points,solved:false};
}
function puzzleFor(seed,id){
  const definition=SITES[id];let values;
  if(definition.kind==='switch'){
    const n=id==='home'?3:4;values=Array(n).fill(1);
    for(let j=0;j<3;j++){const i=((seed>>>(j*3))+j)%n;values[i]^=1;values[(i+1)%n]^=1;}
    if(values.every(Boolean)){values[0]^=1;values[1]^=1;}
  }else if(definition.kind==='power')values=[0,1,0];
  else if(definition.kind==='beam'){values=Array.from({length:4},(_,i)=>(seed>>>(i+3))%2);if(traceBeam(values).solved)values[0]^=1;}
  else values=[];
  return{values,solved:false,attempts:0};
}
export function signalPattern(s){return Array.from({length:5},(_,i)=>((s.seed>>>(i*4))+i)%4);}
export function initOdyssey(s,campaign){
  if(!s.odyssey)s.odyssey={campaign:campaign==='odyssey'?'odyssey':'classic',focus:null,power:25,heat:0,projection:false,overheated:false,projectionClock:0,strain:0,shutdown:0,
    grids:Object.fromEntries(Object.keys(INITIAL_HEALTH).map(k=>[k,{charge:0}])),health:{...INITIAL_HEALTH},puzzles:Object.fromEntries(Object.keys(SITES).map(k=>[k,puzzleFor(s.seed,k)])),
    contacts:{},treaties:[],signals:[],routes:[],sequence:0,creative:false,previousEnding:null,
    stats:{generated:0,drilled:0,manufactured:0,shipments:0,projectionHits:0,returns:0,repairs:0},trails:[],pickups:[]};
  const e=s.odyssey;
  for(const[id,map]of allMaps(s)){
    for(const [type,key,definition]of [['conduit','conduit',SITES[id]],['wayfarer','contact',CONTACTS[id]]]){
      if(!definition||map.nodes.some(n=>n.id==='odyssey-'+key+'-'+id))continue;
      let spot={x:definition.x,y:definition.y};
      outer:for(const r of[0,80,140,210])for(let a=0;a<16;a++){
        const p={x:definition.x+Math.cos(a*Math.PI/8)*r,y:definition.y+Math.sin(a*Math.PI/8)*r};
        if(G.isLand(p.x,p.y)&&!map.nodes.some(n=>n.available&&G.distance(n,p)<65)&&!map.buildings.some(b=>G.distance(b,p)<100)){spot=p;break outer;}
      }
      map.nodes.push({id:'odyssey-'+key+'-'+id,type,realm:id,...spot,hp:1,available:true,respawnAt:0});
    }
  }
  e.trails??=[];e.pickups??=[];
  return s;
}
export function machineState(b){
  b.machine??={enabled:true,priority:1,clock:0,recipe:'board',target:20,job:null,powered:false};b.inventory??={};return b.machine;
}
export function gridCapacity(map){return Math.min(200,40+map.buildings.filter(b=>['windmill','solararray'].includes(b.type)).length*40);}
function pay(s,cost){if(s.odyssey.creative)return true;if(!G.craftAffordable(s,cost))return false;payCraft(s,cost);return true;}
function nearbyObject(s,id,types){const b=[...s.buildings,...s.nodes].find(b=>b.id===id&&types.includes(b.type));return b&&G.distance(b,s.player)<=180?b:null;}
function puzzleObject(s){return s.nodes.find(n=>n.type==='conduit'&&n.realm===s.expedition.current&&G.distance(n,s.player)<=180);}
function finishPuzzle(s,id){
  const e=s.odyssey,p=e.puzzles[id];if(p.solved)return fail('这座遗构已经接续，奖励不会重复领取');
  const drop=id==='mirror'||id==='orbit'?{phasecore:1}:{};
  if(!fits(s.inventory,drop))return fail('请先腾出背包空间');
  p.solved=true;s.insight+=8;s.resonance=Math.min(100,s.resonance+4);e.health[id]=clamp(e.health[id]+6);give(s.inventory,drop);
  return say(s,'接续「'+SITES[id].name+'」· 洞见 +8 · 共鸣 +4'+(drop.phasecore?' · 相位核心 +1':''));
}
export function odysseyAction(s,action,id='',value='',count=1){
  if(s.status!=='playing')return fail('先返回仍在继续的旅程');initOdyssey(s);const e=s.odyssey,current=s.expedition.current;
  if(action==='focus'){
    if(!['craft','care'].includes(value)||s.level<2)return fail('二级后选择工艺或共生专注');
    if(e.focus&&e.focus!==value&&!G.nearby(s,'archive',180))return fail('已选专注；八级后可在档案馆重选');
    if(e.focus===value)return fail('已经选择这个专注');
    if(e.focus&&!pay(s,{resonance:6}))return fail('重选需要 6 共鸣');
    e.focus=value;return say(s,value==='craft'?'工艺专注：晶能产量 +20%，采集的生态代价 +10%。':'共生专注：采集生态代价减少 20%，冥想多得 1 共鸣，自动装配耗时 +10%。');
  }
  if(action==='puzzle-toggle'||action==='puzzle-input'||action==='puzzle-check'){
    const def=SITES[current],p=e.puzzles[current];
    if(!puzzleObject(s)||s.level<def.level)return fail('先走近对应等级的文明遗构');
    if(p.solved)return fail('这处遗构已经接续');
    if(action==='puzzle-toggle'){
      const index=Number(value);if(!Number.isInteger(index)||index<0||index>=p.values.length)return fail('开关编号无效');
      if(def.kind==='switch'){p.values[index]^=1;p.values[(index+1)%p.values.length]^=1;}
      else if(['power','beam'].includes(def.kind))p.values[index]^=1;else return fail('这里需要回应信号');
      return{ok:true};
    }
    if(action==='puzzle-input'){
      const input=Number(value);if(def.kind!=='memory'||!Number.isInteger(input)||input<0||input>3)return fail('信号无效');
      p.values.push(input);const pattern=signalPattern(s);
      if(p.values.some((v,i)=>v!==pattern[i])){p.values=[];p.attempts++;return fail('信号未能接续，可以重新阅读并回应；没有材料损失。');}
      return p.values.length===pattern.length?finishPuzzle(s,current):{ok:true};
    }
    const solved=def.kind==='switch'?p.values.every(Boolean):def.kind==='power'?p.values[0]===1&&p.values[1]===0&&p.values[2]===1:def.kind==='beam'?traceBeam(p.values).solved:false;
    p.attempts++;return solved?finishPuzzle(s,current):fail(def.kind==='power'?'负荷需在 5 以内，并优先保障营地与必要设施。':'连接尚未形成。观察光路与提示，再试一次。');
  }
  if(action==='contact'){
    const def=CONTACTS[current],option=def.options.find(o=>o.id===value);
    if(!nearbyObject(s,id,['wayfarer'])||!option)return fail('先走近当地营地，选择他们愿意接受的援助');
    if(own(e.contacts,current))return fail('这段约定已经完成，不会重复领取');
    if(!fits(s.inventory,option.drop)||!pay(s,option.cost))return fail('援助材料不足，或背包空间不足');
    give(s.inventory,option.drop);e.contacts[current]=value;e.health[current]=clamp(e.health[current]+(option.health||3));s.insight+=5;
    return say(s,'完成「'+def.name+'」。对方保留自己的去留与生活安排。');
  }
  if(action==='treaty'){
    const def=GUARDIAN_REPAIR[current];if(!def||!puzzleObject(s)||!e.puzzles[current].solved)return fail('先走近并解开这张地图的文明遗构');
    if(e.treaties.includes(current)||s.expedition.bosses.includes(def.kind))return fail('这名守卫已经恢复平静或被击败');
    if(!fits(s.inventory,def.drop)||!pay(s,def.cost))return fail('修复材料或背包空间不足');
    const guardian=s.expedition.creatures.find(m=>m.kind===def.kind);if(guardian){guardian.pacified=true;guardian.warning=null;guardian.alert=0;}
    e.treaties.push(current);e.stats.repairs++;give(s.inventory,def.drop);e.health[current]=clamp(e.health[current]+10);
    return say(s,'守卫恢复平静。修复路线与战斗路线提供相同的主线资格，奖励仅领取一次。');
  }
  if(action==='signal'){
    if(s.level<8||!s.tech.includes('signalweb'))return fail('八级研究「星海信使」后接续信号');
    if(!nearbyObject(s,id,['wayfarer'])||!own(e.contacts,current)||!e.puzzles[current].solved)return fail('先完成当地援助与遗构，取得营地同意');
    if(e.signals.includes(current))return fail('这里已经加入共建信号');
    if(!hasFacility(s,current,'relay')||e.grids[current].charge<5)return fail('当地需要折跃货栈与至少 5 营地晶能');
    if(!fits(s.inventory,{accord:1})||!pay(s,SIGNAL_COST[current]))return fail('信号物资或背包空间不足');
    e.grids[current].charge-=5;e.signals.push(current);give(s.inventory,{accord:1});e.health[current]=clamp(e.health[current]+8);
    return say(s,'「'+G.REALMS[current].name+'」同意加入信号，共建印记 +1。');
  }
  if(action==='projection'){
    if(s.level<6||!s.tech.includes('projection'))return fail('六级研究意识投影臂后使用');
    if(e.overheated)return fail('投影装置正在散热，热量降至 40 后可重新展开');
    if(!e.projection&&e.power<2&&!e.creative)return fail('晶能不足，使用晶能电池或靠近供能设备充电');
    e.projection=!e.projection;return say(s,e.projection?'投影臂已展开：只处理身边的普通资源，实际消耗工具耐久与晶能。':'已收起投影臂。');
  }
  if(action==='powercell'){
    if(!s.inventory.powercell)return fail('没有晶能电池');if(e.power>=100)return fail('便携晶能已经充足');
    s.inventory.powercell--;e.power=clamp(e.power+35);return say(s,'使用晶能电池，便携晶能 +35。');
  }
  if(action==='charge-grid'){
    if(!nearbyObject(s,id,['windmill','solararray','relay']))return fail('走近供能设备或货栈补充晶能');
    const grid=e.grids[current],capacity=gridCapacity(s);if(grid.charge>=capacity)return fail('营地晶能已满');
    if(!pay(s,{powercell:1}))return fail('需要 1 晶能电池');grid.charge=Math.min(capacity,grid.charge+40);return say(s,'电池已接入营地，晶能 +40。');
  }
  if(action==='machine-toggle'||action==='priority'||action==='recipe'||action==='target'){
    const b=nearbyObject(s,id,['drill','synthesizer','assembler']);if(!b)return fail('先走近这台工业设备');const m=machineState(b);
    if(action==='machine-toggle')m.enabled=!m.enabled;
    if(action==='priority'){const n=Number(value);if(![0,1,2].includes(n))return fail('优先级无效');m.priority=n;}
    if(action==='recipe'){if(b.type!=='assembler'||!own(AUTO_RECIPES,value))return fail('配方不存在');if(m.job)return fail('先完成当前订单再更换配方');m.recipe=value;}
    if(action==='target'){const n=Number(value);if(![20,60,120].includes(n))return fail('目标库存无效');m.target=n;}
    return{ok:true};
  }
  if(action==='store-in'||action==='store-out'){
    const b=nearbyObject(s,id,['relay','assembler']);
    if(!b||!own(G.ITEMS,value)||G.ITEMS[value].durability||G.ITEMS[value].unique||!Number.isInteger(count)||count<1||count>9999)return fail('储物参数无效');
    b.inventory??={};const from=action==='store-in'?s.inventory:b.inventory,to=action==='store-in'?b.inventory:s.inventory;
    const n=Math.min(count,stock(from,value),9999-stock(to,value));if(!n)return fail('没有可转移物品或空间不足');from[value]-=n;to[value]=stock(to,value)+n;return{ok:true};
  }
  if(action==='collect-machine'){
    const b=nearbyObject(s,id,['relay','assembler','drill','synthesizer']);if(!b)return fail('先走近设备');if(b.type==='drill'){const n=Math.min(b.stored,9999-stock(s.inventory,'ore'));if(!n)return fail('暂时没有可取出的铜矿');b.stored-=n;give(s.inventory,{ore:n});return say(s,'取出铜矿 ×'+n+'。');}b.inventory??={};let total=0;
    for(const[k,v]of Object.entries(b.inventory)){const n=Math.min(v,9999-stock(s.inventory,k));if(n){b.inventory[k]-=n;s.inventory[k]=stock(s.inventory,k)+n;total+=n;}}
    return total?say(s,'已取出设备库存。'):fail('没有可取出物品，或背包已满');
  }
  if(action==='route-add'){
    const to=id,item=value,n=Number(count),from=current;
    if(s.level<4||!s.tech.includes('relaynetwork')||!hasFacility(s,from,'relay')||!G.nearby(s,'relay',180))return fail('四级研究折跃货运后，在当地货栈配置运输');
    if(!own(G.REALMS,to)||to===from||!hasFacility(s,to,'relay'))return fail('目的地需要已建好的折跃货栈');
    if(!own(G.ITEMS,item)||G.ITEMS[item].durability||G.ITEMS[item].unique||!Number.isInteger(n)||n<1||n>20)return fail('货物或批量无效');
    if(e.routes.length>=12)return fail('最多保留 12 条货运路线');
    if(e.routes.some(r=>r.from===from&&r.to===to&&r.item===item))return fail('同一货运路线已存在');
    e.routes.push({id:'route-'+(++e.sequence),from,to,item,count:n,wait:0,enabled:true,cargo:null});return say(s,'货运已配置：装载时扣除源站 2 晶能，抵达后实际入库；每趟 15 秒。');
  }
  if(action==='route-toggle'||action==='route-remove'){
    const route=e.routes.find(r=>r.id===id);if(!route)return fail('货运路线不存在');
    if(action==='route-toggle'){route.enabled=!route.enabled;return{ok:true};}
    if(route.cargo)return fail('这条路线仍有在途货物，请等到货后再移除');
    e.routes=e.routes.filter(r=>r!==route);return{ok:true};
  }
  if(action==='restore'){
    if(s.level<7||!s.tech.includes('ecolink')||!G.nearby(s,'garden',180))return fail('七级研究群落共生网后，走近当地生态花园');
    if(e.health[current]>=100)return fail('当地土地已经恢复健康');if(!pay(s,{compost:2,seed:3}))return fail('需要 2 堆肥与 3 种子');
    e.health[current]=clamp(e.health[current]+15);s.ecology=clamp(s.ecology+4);e.strain=clamp(e.strain-4);return say(s,'当地生态健康 +15，全局生态 +4，文明失衡 −4。');
  }
  if(action==='stabilize'){
    if(!G.nearby(s,'resonator',180)&&!G.nearby(s,'archive',180))return fail('走近共鸣台或记忆档案馆，安排文明调谐');
    if(e.strain<=0)return fail('当前文明状态平稳');if(!pay(s,{resonance:4}))return fail('需要 4 共鸣');
    e.strain=clamp(e.strain-20);e.shutdown=0;return say(s,'重新调谐晶能网，失衡 −20。停机保护已解除。');
  }
  if(action==='creative'){
    if(s.level!==9||s.expansion.ending!=='stay')return fail('九级选择留下守护后，可开启自由建造');
    e.creative=!e.creative;return say(s,e.creative?'已开启九级自由建造：合成与建筑不再消耗材料。':'已回到常规建设模式。');
  }
  return fail('未知的文明操作');
}
export function startOdyssey(s){
  if(s.status==='dead')return fail('先恢复这段旅程');initOdyssey(s);
  if(isOdyssey(s))return fail('这已经是一段星海旅程');
  s.odyssey.campaign='odyssey';s.odyssey.previousEnding=s.expansion.ending;
  if(s.status==='won'){s.status='playing';s.expansion.ending=null;}
  return say(s,'旧世界已接续星海新篇：等级、装备、营地与此前选择均已保留。');
}
function hasGuardian(s,id){return s.odyssey.treaties.includes(id)||s.expedition.bosses.includes(GUARDIAN_REPAIR[id].kind);}
export function campaignRequirements(s,target=Math.min(9,s.level+1)){
  if(!isOdyssey(s))return[];const e=s.odyssey,rows=[],add=(ok,text,map)=>rows.push({ok:!!ok,text,map});
  if(target===3){add(s.tech.includes('powergrid'),'掌握晶能供电');add(e.puzzles.home.solved,'接续原岛初始能源站','home');add(e.stats.drilled>=3,'供电采矿机实际产出铜矿 '+Math.min(3,e.stats.drilled)+'/3','home');}
  if(target===4){for(const id of['verdant','cinder']){add(e.puzzles[id].solved,'接续'+SITES[id].name,id);add(own(e.contacts,id),'完成'+CONTACTS[id].name,id);}}
  if(target===5){add(e.puzzles.mirror.solved,'解开镜沙棱镜光路','mirror');add(s.tech.includes('relaynetwork'),'掌握折跃货运');add(hasFacility(s,'home','relay')&&hasFacility(s,'mirror','relay'),'原岛与镜沙各建一座折跃货栈');add(e.stats.returns>=1,'从远方使用一次归途传送');}
  if(target===6){add(s.tech.includes('automation'),'掌握生产逻辑');add(e.stats.manufactured>=3,'自动装配完成 '+Math.min(3,e.stats.manufactured)+'/3 批');add(e.stats.shipments>=1,'实际完成一趟跨图货运');}
  if(target===7){add(e.puzzles.orbit.solved,'接续星环记忆阵','orbit');add(s.tech.includes('projection'),'掌握意识投影臂');add(e.stats.projectionHits>=6,'投影臂实际作业 '+Math.min(6,e.stats.projectionHits)+'/6 次');add(hasGuardian(s,'mirror'),'修复或击败镜沙巨像','mirror');}
  if(target===8){const healthy=allMaps(s).filter(([id,map])=>map.buildings.some(b=>b.type==='garden')&&e.health[id]>=60).length;add(s.tech.includes('ecolink'),'掌握群落共生网');add(e.puzzles.frost.solved,'接续雪线供暖站','frost');add(healthy>=3,'三个地图建有花园且生态健康 ≥60 · '+healthy+'/3');}
  if(target===9){add(s.tech.includes('signalweb'),'掌握星海信使');add(e.signals.length===6,'征得六个营地同意，接续信号 '+e.signals.length+'/6');add(hasGuardian(s,'orbit'),'修复或击败失落星环','orbit');add(e.strain<60,'文明失衡 <60 · 当前 '+Math.round(e.strain));}
  return rows;
}
export function nextCampaignGoal(s){
  return campaignRequirements(s).find(r=>!r.ok)||null;
}
export function canDismantle(s,b){
  if(b.machine?.job)return'先完成自动装配台当前订单，避免丢失已投入材料';
  if(b.type==='relay'&&s.odyssey.routes.some(r=>(r.from===s.expedition.current||r.to===s.expedition.current)&&(r.enabled||r.cargo)))return'先停用关联货运，并等待在途货物抵达';
  return'';
}
export function stepOdyssey(s,dt,projectHarvest){
  const e=s.odyssey;if(!e)return;
  e.heat=clamp(e.heat-dt*5);if(e.overheated&&e.heat<40)e.overheated=false;e.shutdown=Math.max(0,e.shutdown-dt);
  const current=s.expedition.current;
  for(const[id,map]of allMaps(s)){
    if(id!==current&&!map.buildings.some(b=>b.type==='relay'))continue;
    const grid=e.grids[id],capacity=gridCapacity(map);
    const generators=map.buildings.filter(b=>['windmill','solararray'].includes(b.type));
    const generated=generators.reduce((n,b)=>n+(b.type==='windmill'?.35:G.phase(s)==='day'?.65:.08),0)*(e.focus==='craft'?1.2:1)*dt;
    const accepted=Math.min(Math.max(0,capacity-grid.charge),generated);grid.charge=clamp(grid.charge+accepted,0,capacity);e.stats.generated+=accepted;
    const industrial=map.buildings.filter(b=>['assembler',...(isOdyssey(s)?['drill','synthesizer']:[])].includes(b.type));
    industrial.forEach(machineState);industrial.sort((a,b)=>b.machine.priority-a.machine.priority||a.id.localeCompare(b.id));
    for(const b of industrial){
      const m=b.machine;m.powered=false;
      if(!m.enabled||e.shutdown>0)continue;
      let rate=b.type==='drill'?.08:b.type==='synthesizer'?.18:AUTO_RECIPES[m.recipe].power;
      if(b.type==='drill'&&b.stored>=30)continue;
      if(b.type==='synthesizer'&&Object.values(b.inventory).some(v=>v>=150))continue;
      const use=rate*dt;if(grid.charge+1e-9<use&&!e.creative)continue;
      if(b.type==='assembler'){
        const recipe=AUTO_RECIPES[m.recipe],output=Object.keys(recipe.drop)[0];
        if(!m.job){
          if(stock(b.inventory,output)>=m.target||!fits(b.inventory,recipe.drop)||!Object.entries(recipe.cost).every(([k,v])=>stock(b.inventory,k)>=v))continue;
          for(const[k,v]of Object.entries(recipe.cost))b.inventory[k]-=v;
          m.job={recipe:m.recipe,remaining:recipe.seconds*(e.focus==='care'?1.1:1)};
        }
      }
      if(b.type==='assembler'&&b.machine.job?.remaining===0&&!fits(b.inventory,AUTO_RECIPES[b.machine.job.recipe].drop))continue;
      if(!e.creative)grid.charge=Math.max(0,grid.charge-use);m.powered=true;
      if(b.type==='assembler'){
        m.job.remaining=Math.max(0,m.job.remaining-dt);
        if(m.job.remaining===0&&fits(b.inventory,AUTO_RECIPES[m.job.recipe].drop)){give(b.inventory,AUTO_RECIPES[m.job.recipe].drop);m.job=null;e.stats.manufactured++;}
      }else{
        const interval=b.type==='drill'?15:30;m.clock+=dt;
        while(m.clock+1e-7>=interval){m.clock=Math.max(0,m.clock-interval);if(b.type==='drill'){b.stored=Math.min(30,b.stored+1);e.stats.drilled++;}else for(const[k,v]of Object.entries({wood:5,stone:4,ore:3,berry:4}))b.inventory[k]=Math.min(150,stock(b.inventory,k)+v);}
      }
      if(isOdyssey(s)){const strain=dt*(b.type==='drill'?.012:.006);e.strain=clamp(e.strain+strain);e.health[id]=clamp(e.health[id]-strain*.08);}
    }
    if(s.level>=7&&map.buildings.some(b=>b.type==='garden')){e.health[id]=clamp(e.health[id]+dt*.03);e.strain=clamp(e.strain-dt*.025);}
    if(id===current&&generators.some(b=>G.distance(b,s.player)<185)&&e.power<100){const charge=Math.min(dt*1.3,grid.charge,100-e.power);e.power+=charge;grid.charge-=charge;}
  }
  for(const route of e.routes){
    const source=worldState(s,route.from)?.buildings.find(b=>b.type==='relay'),dest=worldState(s,route.to)?.buildings.find(b=>b.type==='relay');
    if(route.cargo){
      route.cargo.remaining=Math.max(0,route.cargo.remaining-dt);
      if(!route.cargo.remaining&&dest&&fits(dest.inventory||{},{[route.item]:route.count})){dest.inventory??={};give(dest.inventory,{[route.item]:route.count});route.cargo=null;route.wait=30;e.stats.shipments++;}
      continue;
    }
    if(!route.enabled)continue;route.wait=Math.max(0,route.wait-dt);if(route.wait||e.shutdown>0)continue;
    if(!source||!dest||stock(source.inventory,route.item)<route.count||e.grids[route.from].charge<2||!fits(dest.inventory||{},{[route.item]:route.count}))continue;
    source.inventory[route.item]-=route.count;e.grids[route.from].charge-=2;route.cargo={remaining:15};
  }
  if(e.strain>=95&&!e.shutdown){e.shutdown=45;e.strain=80;say(s,'晶能网过载：工业进入 45 秒保护停机。关闭低优先级设备，或到共鸣台用 4 共鸣调谐，解除停机。');}
  if(e.creative){e.power=100;e.heat=0;}
  if(e.projection&&e.heat>=85){e.projection=false;e.overheated=true;say(s,'投影臂热量达到保护线，已收起散热。');}
  if(e.projection&&!e.overheated&&s.level>=6&&s.tech.includes('projection')){
    e.projectionClock+=dt;
    if(e.projectionClock>=1.4){
      e.projectionClock=0;
      const candidates=s.nodes.filter(n=>n.available&&n.id!==s.action?.id&&['tree','rock','ore','crystal','meteor','lumen','mirrorsand','starroot','bush','grass'].includes(n.type)&&G.distance(n,s.player)<=190&&(!G.NODES[n.type].level||s.level>=G.NODES[n.type].level)&&(!G.NODES[n.type].tool||(s.inventory[G.NODES[n.type].tool]>0&&s.durability[G.NODES[n.type].tool]>0))).sort((a,b)=>G.distance(a,s.player)-G.distance(b,s.player)).slice(0,3);
      for(const n of candidates){
        if(e.power<.8&&!e.creative){e.projection=false;say(s,'投影臂晶能不足，已安全收起。');break;}
        if(e.heat>=85){e.projection=false;e.overheated=true;say(s,'投影臂热量达到保护线，已收起散热；材料与工具没有额外损失。');break;}
        if(projectHarvest(s,n)){if(!e.creative){e.power=Math.max(0,e.power-.8);e.heat=clamp(e.heat+7);}e.stats.projectionHits++;e.trails.push({x:n.x,y:n.y,at:s.time,type:'arm'});}
      }
    }
  }
  e.trails=e.trails.filter(t=>s.time-t.at<.7).slice(-12);e.pickups=e.pickups.filter(t=>s.time-t.at<.8).slice(-16);
}
export function validateOdyssey(s,num){
  const e=s.odyssey;if(!e||typeof e!=='object'||Array.isArray(e)||!['classic','odyssey'].includes(e.campaign)||![null,'craft','care'].includes(e.focus))throw Error('文明旅程格式无效');
  for(const k of ['power','heat','strain'])if(!num(e[k],0,100))throw Error('晶能或热量数据无效');
  for(const[k,max]of [['projectionClock',1.4],['shutdown',45],['sequence',1000000]])if(!num(e[k],0,max))throw Error('文明计时无效');
  for(const k of ['projection','overheated','creative'])if(typeof e[k]!=='boolean')throw Error('文明能力状态无效');
  if(e.creative&&(s.level!==9||s.expansion.ending!=='stay'))throw Error('自由建造资格无效');
  if(![null,'stay','return'].includes(e.previousEnding))throw Error('旧旅程记录无效');
  if(!e.stats||['generated','drilled','manufactured','shipments','projectionHits','returns','repairs'].some(k=>!num(e.stats[k])))throw Error('文明统计无效');
  for(const id of Object.keys(SITES)){
    if(!e.grids||!own(e.grids,id)||!num(e.grids[id]?.charge,0,200)||!e.health||!num(e.health[id],0,100))throw Error('地图晶能与生态无效');
    const p=e.puzzles?.[id],def=SITES[id],length=def.kind==='switch'?(id==='home'?3:4):def.kind==='power'?3:def.kind==='beam'?4:null;
    if(!p||typeof p.solved!=='boolean'||!num(p.attempts)||!Array.isArray(p.values)||(length!==null?p.values.length!==length:p.values.length>5)||p.values.some(v=>!Number.isInteger(v)||v<0||v>(def.kind==='memory'?3:1)))throw Error('遗构谜题数据无效');
  }
  if(!e.contacts||typeof e.contacts!=='object'||Array.isArray(e.contacts)||Object.entries(e.contacts).some(([k,v])=>!own(CONTACTS,k)||!CONTACTS[k].options.some(o=>o.id===v)))throw Error('营地约定无效');
  for(const [key,valid,max]of [['treaties',Object.keys(GUARDIAN_REPAIR),2],['signals',Object.keys(SITES),6]])if(!Array.isArray(e[key])||e[key].length>max||new Set(e[key]).size!==e[key].length||e[key].some(k=>!valid.includes(k)))throw Error('守护信号无效');
  if(!Array.isArray(e.routes)||e.routes.length>12||new Set(e.routes.map(r=>r?.id)).size!==e.routes.length)throw Error('货运路线无效');
  for(const r of e.routes){
    if(!r||typeof r.id!=='string'||!/^route-\d+$/.test(r.id)||!own(SITES,r.from)||!own(SITES,r.to)||r.from===r.to||!own(G.ITEMS,r.item)||G.ITEMS[r.item].durability||G.ITEMS[r.item].unique||!Number.isInteger(r.count)||!num(r.count,1,20)||!num(r.wait,0,30)||typeof r.enabled!=='boolean'||(r.cargo&&(!num(r.cargo.remaining,0,15)||Object.keys(r.cargo).length!==1)))throw Error('货运状态无效');
    if(!hasFacility(s,r.from,'relay')||!hasFacility(s,r.to,'relay'))throw Error('货运站点不存在');
  }
  for(const[id,map]of allMaps(s)){
    for(const n of map.nodes)if(['conduit','wayfarer'].includes(n.type)&&(n.realm!==id||n.id!=='odyssey-'+(n.type==='conduit'?'conduit':'contact')+'-'+id))throw Error('文明地点无效');
    if(map.buildings.filter(b=>b.type==='relay').length>1)throw Error('每图只能保留一座折跃货栈');
    for(const b of map.buildings)if(b.machine){
      const m=b.machine;if(!['drill','synthesizer','assembler'].includes(b.type)||typeof m.enabled!=='boolean'||typeof m.powered!=='boolean'||![0,1,2].includes(m.priority)||!own(AUTO_RECIPES,m.recipe)||![20,60,120].includes(m.target)||!num(m.clock,0,30))throw Error('工业设备配置无效');
      if(m.job&&(!own(AUTO_RECIPES,m.job.recipe)||!num(m.job.remaining,0,AUTO_RECIPES[m.job.recipe].seconds*1.1)||b.type!=='assembler'))throw Error('自动装配订单无效');m.powered=false;
    }
  }
  e.trails=[];e.pickups=[];
}
