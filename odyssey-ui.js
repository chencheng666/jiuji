import * as G from './survival.js';
import {AUTO_RECIPES,SITES,CONTACTS,GUARDIAN_REPAIR,SIGNAL_COST} from './odyssey-data.js';
import {allMaps,worldState,gridCapacity,machineState,traceBeam,signalPattern,campaignRequirements,isOdyssey} from './odyssey.js';
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(action,label,{id='',value='',count=1,disabled=false,primary=false}={})=>`<button class="${primary?'primary':'secondary'}" data-odyssey-action="${action}" data-id="${esc(id)}" data-value="${esc(value)}" data-count="${count}" ${disabled?'disabled':''}>${label}</button>`;
const costText=cost=>Object.entries(cost||{}).map(([id,n])=>`${G.RESOURCE_NAMES[id]} ×${n}`).join(' · ');
const icon=type=>`<img class="civ-icon" src="./assets/${type}.svg" alt="">`;
const near=(s,b)=>b&&G.distance(s.player,b)<=180;
function goButton(object,label='前往这里'){return object?`<button class="secondary" data-civ-walk="${esc(object.id)}">${label}</button>`:'';}
function meter(label,value,max=100){return`<div class="civ-meter"><span>${label}<b>${Math.floor(value)}/${max}</b></span><i><em style="width:${Math.min(100,Math.max(0,value/max*100))}%"></em></i></div>`;}
function overview(s){
 const e=s.odyssey,requirements=campaignRequirements(s),next=G.getQuest(s),map=s.expedition.current;
 const rows=requirements.length?requirements.map(r=>{
  let target=null;if(r.map===map){target=s.nodes.find(n=>n.type===(r.text.includes(CONTACTS[map].name)?'wayfarer':'conduit'));}
  return`<li class="${r.ok?'met':''}"><span>${r.ok?'✓':'○'} ${esc(r.text)}</span>${!r.ok&&target?goButton(target,'前往'):''}${!r.ok&&r.map&&r.map!==map?`<small>目标：${G.REALMS[r.map].name}</small>`:''}</li>`;
 }).join(''):'<li>先采集与建造营地，完成第一个夜晚；二级开始接续晶能与六地旅程。</li>';
 const focus=e.focus?`当前：${e.focus==='craft'?'工艺专注':'共生专注'}；八级在档案馆可花 6 共鸣重选。`:'专注不是单线科技，物质与意识仍需一起发展。';
 return`<section class="civ-callout"><small>${isOdyssey(s)?'2.0 星海新篇':'旧旅程 · 兼容模式'}</small><h3>${esc(next.title)}</h3><p>当前种子 ${s.seed} · ${G.realm(s).name} · 六地信号 ${e.signals.length}/6</p>${!isOdyssey(s)?'<p>旧存档保留原有晋级规则。接续新篇后保留等级、装备、营地与历史结局，开始完成六地目标。</p><button class="primary" data-do="start-odyssey">在这个世界接续 2.0 新篇</button>':''}</section><div class="civ-meters">${meter('便携晶能',e.power)}${meter('投影热量',e.heat)}${meter('文明失衡',e.strain)}${meter('当地晶能',e.grids[map].charge,gridCapacity(s))}</div>${e.shutdown>0?`<div class="reason">晶能网保护停机还剩 ${Math.ceil(e.shutdown)} 秒。可关闭设备，或到共鸣台 / 档案馆用 4 共鸣调谐。</div>`:''}<h3 class="section-title">晋级需要真正完成的事</h3><ul class="civ-requirements">${rows}</ul><div class="civ-buttons"><button class="secondary" data-do="journey">查看原有遗迹与晋升设施</button><button class="secondary" data-do="tech">查看科技前置</button><button class="secondary" data-open-category="advanced">查看文明设施配方</button></div><h3 class="section-title">选择你的专注</h3><div class="civ-grid"><article class="growth-card"><h3>工艺专注</h3><p>晶能产量 +20%，采集的生态代价 +10%。适合安排供能与生产。</p>${button('focus',e.focus==='craft'?'✓ 当前专注':'选择工艺',{value:'craft',disabled:s.level<2||e.focus==='craft'})}</article><article class="growth-card"><h3>共生专注</h3><p>采集生态代价减少 20%，冥想多得 1 共鸣，自动装配耗时 +10%。</p>${button('focus',e.focus==='care'?'✓ 当前专注':'选择共生',{value:'care',disabled:s.level<2||e.focus==='care'})}</article></div><p class="subtle">${focus}</p><h3 class="section-title">你的九级能力</h3><div class="civ-buttons">${button('projection',e.projection?'收起投影臂':'展开投影臂',{disabled:s.level<6||!s.tech.includes('projection')||e.overheated})}${button('powercell','使用晶能电池 · +35',{disabled:!s.inventory.powercell||e.power>=100})}${button('stabilize','文明调谐 · 4共鸣',{disabled:e.strain<=0})}${s.level===9&&s.expansion.ending==='stay'?button('creative',e.creative?'关闭自由建造':'开启九级自由建造'):''}</div><p class="subtle">投影臂实际消耗晶能与工具耐久；热量过高会安全收起。工业失衡可以修复，不会永久锁死旅程。</p>`;
}
function puzzlePanel(s){
 const id=s.expedition.current,definition=SITES[id],p=s.odyssey.puzzles[id],object=s.nodes.find(n=>n.type==='conduit'),at=near(s,object),disabled=!at||s.level<definition.level||p.solved;
 let content='';
 if(definition.kind==='switch')content=`<div class="civ-switches">${p.values.map((v,i)=>`<button class="civ-switch ${v?'lit':''}" data-odyssey-action="puzzle-toggle" data-value="${i}" aria-pressed="${!!v}" ${disabled?'disabled':''}><span>${v?'✦':'○'}</span><b>${i+1}号灯 · ${v?'亮':'灭'}</b><small>改变本灯与右侧灯</small></button>`).join('')}</div>`;
 if(definition.kind==='power'){
  const labels=id==='frost'?['营地供暖','矿脉采样','返航信号']:['冷却泵','采样矿机','营地维生'];
  const load=p.values.reduce((n,v,i)=>n+v*[3,2,2][i],0);
  content=`<div class="civ-power-budget"><b>总负荷 ${load} / 5</b><span>${load>5?'过载：先关闭非必要设备':'预算正常；别忘记保障两项必要设施'}</span></div><div class="civ-grid">${labels.map((name,i)=>`<button class="civ-power-node ${p.values[i]?'lit':''}" data-odyssey-action="puzzle-toggle" data-value="${i}" aria-pressed="${!!p.values[i]}" ${disabled?'disabled':''}><strong>${name}</strong><span>消耗 ${[3,2,2][i]} 晶能 · ${p.values[i]?'已接通':'已关闭'}</span></button>`).join('')}</div>`;
 }
 if(definition.kind==='beam'){
  const positions=[[1,1],[1,0],[4,0],[4,2]],beam=traceBeam(p.values),points=beam.points.map(q=>`${(q.x+.5)*50+25},${(q.y+.5)*50+25}`).join(' ');
  content=`<p class="subtle">入口：左侧第二行 → 上方中继点 ✧ → 出口：右侧第三行。每次点击镜面切换 / 与 ＼。</p><div class="beam-board"><svg viewBox="0 0 350 250" aria-hidden="true"><polyline points="${points}" fill="none" stroke="${beam.solved?'#c8e0a4':'#e2bd79'}" stroke-width="3"/></svg><div class="beam-grid">${Array.from({length:24},(_,i)=>{const x=i%6,y=Math.floor(i/6),index=positions.findIndex(p=>p[0]===x&&p[1]===y);return index<0?`<span class="beam-cell">${x===3&&y===0?'✧':''}</span>`:`<button class="beam-mirror" data-odyssey-action="puzzle-toggle" data-value="${index}" aria-label="转动第${index+1}面镜子，当前${p.values[index]?'反斜面':'斜面'}" ${disabled?'disabled':''}>${p.values[index]?'＼':'／'}</button>`;}).join('')}</div><span class="beam-start">入</span><span class="beam-end">出</span></div>`;
 }
 if(definition.kind==='memory'){
  const names=['东','南','西','北'],arrows=['→','↓','←','↑'];
  content=`<details class="civ-clue"><summary>阅读星环留下的信号</summary><p>${signalPattern(s).map(n=>names[n]+' '+arrows[n]).join('　｜　')}</p><small>可以反复阅读；没有时间限制。</small></details><p>已回应 ${p.values.length}/5：${p.values.map(n=>names[n]).join(' · ')||'等待第一个信号'}</p><div class="civ-memory">${names.map((name,i)=>button('puzzle-input',name+' '+arrows[i],{value:String(i),disabled})).join('')}</div>`;
 }
 const repair=GUARDIAN_REPAIR[id],done=repair&&(s.odyssey.treaties.includes(id)||s.expedition.bosses.includes(repair.kind));
 return`<section class="civ-callout">${icon('conduit')}<small>${definition.level}级 · ${p.solved?'✓ 已接续':'等待你的观察'}</small><h3>${definition.name}</h3><p>${definition.hint}</p>${!at?goButton(object,'走近遗构开始解谜'):''}</section>${content}<div class="civ-buttons">${definition.kind!=='memory'?button('puzzle-check',p.solved?'已接续，不重复领奖':'校验连接',{disabled,primary:true}):''}</div><p class="subtle">面板打开时世界暂停。尝试错误不会扣材料；接续奖励仅领取一次。</p>${repair?`<h3 class="section-title">守卫：战斗或修复</h3><div class="growth-card"><h3>${G.CREATURES[repair.kind].name}</h3><p>${G.CREATURES[repair.kind].tip}</p><p>和平修复：${costText(repair.cost)}</p>${button('treaty',done?'✓ 守卫目标已完成':'修复核心，令守卫平静',{disabled:done||!at||!p.solved,primary:true})}<p class="subtle">修复与战斗都能获得主线资格与核心。选择修复后，守卫不会再主动攻击。</p></div>`:''}`;
}
function storyPanel(s){
 const id=s.expedition.current,e=s.odyssey,definition=CONTACTS[id],object=s.nodes.find(n=>n.type==='wayfarer'),at=near(s,object),done=Object.hasOwn(e.contacts,id);
 return`<section class="civ-callout">${icon('wayfarer')}<h3>${definition.name}</h3><p>${definition.text}</p>${!at?goButton(object,'走近当地营地'):''}</section><div class="civ-grid">${definition.options.map(o=>`<article class="growth-card"><h3>${done&&e.contacts[id]===o.id?'✓ ':''}${o.name}</h3><p>${o.text}</p><p class="cost">${costText(o.cost)}</p><p class="reward">回赠：${costText(o.drop)}</p>${button('contact',done?'这段约定已经完成':o.name,{id:object?.id,value:o.id,disabled:done||!at,primary:true})}</article>`).join('')}</div><h3 class="section-title">八级 · 信使约定</h3><p>对方已选择继续自己的生活。取得同意后，你只负责接续信号，不替他们安排去留。</p><p class="cost">${costText(SIGNAL_COST[id])} · 当地晶能 5 · 需要折跃货栈</p>${button('signal',e.signals.includes(id)?'✓ 已接续共建信号':'征得同意，接续信号',{id:object?.id,disabled:!at||!done||!e.puzzles[id].solved||s.level<8||e.signals.includes(id),primary:true})}`;
}
function stockPanel(s,b){
 const transferable=Object.entries(s.inventory).filter(([id,n])=>n>0&&!G.ITEMS[id].durability&&!G.ITEMS[id].unique);
 return`<details class="civ-stock" open><summary>设备库存与材料装入</summary><p class="subtle">这些库存是真实材料。装配台只使用自己库存，货栈只装载这里已存入的货物。</p><div class="civ-stock-list">${Object.entries(b.inventory||{}).filter(([,n])=>n>0).map(([id,n])=>`<div><span>${G.RESOURCE_NAMES[id]} ×${n}</span>${button('store-out','取出',{id:b.id,value:id,count:9999})}</div>`).join('')||'<p class="subtle">设备库存为空。</p>'}</div><div class="civ-stock-list">${transferable.map(([id,n])=>`<div><span>背包 ${G.RESOURCE_NAMES[id]} ×${n}</span><span>${button('store-in','装入5',{id:b.id,value:id,count:5})}${button('store-in','全部',{id:b.id,value:id,count:9999})}</span></div>`).join('')}</div></details>`;
}
function industryPanel(s,selectedId){
 const facilities=s.buildings.filter(b=>['windmill','solararray','drill','synthesizer','relay','assembler'].includes(b.type)),b=facilities.find(x=>x.id===selectedId),e=s.odyssey;
 const cards=facilities.map(b=>`<article class="growth-card">${icon(b.type)}<h3>${G.BUILDING_NAMES[b.type]}</h3><p>${['drill','synthesizer','assembler'].includes(b.type)?b.machine?.powered?'晶能供电中':b.machine?.enabled===false?'已暂停':'等待材料或晶能':'全图晶能网络的一部分'}</p>${near(s,b)?`<button class="secondary" data-civ-object="${esc(b.id)}">管理这台设备</button>`:goButton(b,'前往设备')}</article>`).join('');
 let detail='';if(b){
  if(!near(s,b))detail=`<div class="reason">先走近设备才能操作。${goButton(b)}</div>`;
  else{
   detail=`<section class="civ-callout"><h3>${G.BUILDING_NAMES[b.type]}</h3><p>当地晶能 ${Math.floor(e.grids[s.expedition.current].charge)}/${gridCapacity(s)}；便携晶能 ${Math.floor(e.power)}/100。</p></section>`;
   if(['windmill','solararray','relay'].includes(b.type))detail+=button('charge-grid','接入一枚电池 · 晶能 +40',{id:b.id,disabled:!s.inventory.powercell});
   if(['drill','synthesizer','assembler'].includes(b.type)){
    const m=machineState(b);detail+=`<div class="civ-buttons">${button('machine-toggle',m.enabled?'暂停设备':'启动设备',{id:b.id})}${[0,1,2].map(n=>button('priority',(m.priority===n?'✓ ':'')+['低优先','常规','高优先'][n],{id:b.id,value:String(n)})).join('')}</div>`;
    if(b.type==='drill')detail+=`<p class="subtle">耗电 0.08 / 秒，实际运转 15 秒产出 1 铜矿；当前储存 ${b.stored}/30。</p>${button('collect-machine','取出铜矿',{id:b.id,disabled:!b.stored})}`;
    if(b.type==='synthesizer')detail+=`<p class="subtle">耗电 0.18 / 秒，实际运转 30 秒产出一批基础资源。</p>${button('collect-machine','领取合成产物',{id:b.id})}`;
    if(b.type==='assembler'){
     const recipe=AUTO_RECIPES[m.recipe];detail+=`<p class="subtle">${m.job?'当前订单：'+AUTO_RECIPES[m.job.recipe].name+'，剩余 '+Math.ceil(m.job.remaining)+' 秒；材料已经投入。':'先装入材料，再选择配方。'}停机不会丢失进度，暂停与离线不生产。</p><div class="civ-grid">${Object.entries(AUTO_RECIPES).map(([id,r])=>`<article class="growth-card"><h4>${m.recipe===id?'✓ ':''}${r.name}</h4><p>${costText(r.cost)} → ${costText(r.drop)}</p><small>${r.seconds}秒 · 耗电 ${r.power}/秒</small>${button('recipe','设为生产配方',{id:b.id,value:id,disabled:!!m.job||m.recipe===id})}</article>`).join('')}</div><p>自动补货目标：${[20,60,120].map(n=>button('target',(m.target===n?'✓ ':'')+n,{id:b.id,value:String(n)})).join('')}</p><p class="subtle">达到目标或库存不足时自动等待；优先级决定晶能不足时谁先运转。</p>`;
    }
   }
   if(['relay','assembler'].includes(b.type))detail+=stockPanel(s,b);
  }
 }
 return`<div class="civ-callout"><h3>先供能，再自动化</h3><p>风能塔全天供能；星光集能板白昼产量更高。便携晶能可在供能设备 185 步内自动补充。每图建一座货栈后，供能与工业可在你远行期间继续运转；普通农圃与旧订单仍按原规则暂停。</p><button class="secondary" data-open-category="advanced">查看设施配方</button></div>${detail}<h3 class="section-title">当前地图的工业设备</h3><div class="civ-grid">${cards||'<p>还没有工业设备，二级研究晶能供电后先造风能塔。</p>'}</div>`;
}
function logisticsPanel(s){
 const e=s.odyssey,id=s.expedition.current,relay=s.buildings.find(b=>b.type==='relay'),at=near(s,relay),targets=allMaps(s).filter(([key,map])=>key!==id&&map.buildings.some(b=>b.type==='relay'));
 const options=Object.entries(G.ITEMS).filter(([key,item])=>!item.durability&&!item.unique&&(relay?.inventory?.[key]||s.inventory[key]||['wood','ore','board','powercell'].includes(key)));
 return`<section class="civ-callout"><h3>让远征成为补给线</h3><p>材料必须先存入源地图的货栈。每趟装载消耗源站 2 晶能，运输需 15 秒，到站后真实入库。暂停与离线不推进；停用路线不会丢掉在途货物。</p><p>已完成运输 ${e.stats.shipments} 趟 · 全图上限 12 条路线。</p>${relay&&!at?goButton(relay,'走近货栈配置'):!relay?'<button class="secondary" data-open-category="advanced">建造折跃货栈</button>':''}</section><div class="civ-route-form"><label>目的地<select id="cargo-destination" aria-label="货运目的地">${targets.length?targets.map(([key])=>`<option value="${key}">${G.REALMS[key].name}</option>`).join(''):'<option value="">先在另一张地图建设货栈</option>'}</select></label><label>货物<select id="cargo-item" aria-label="货运物品">${options.map(([key,item])=>`<option value="${key}">${item.name} · 源站 ${relay?.inventory?.[key]||0}</option>`).join('')}</select></label><label>每趟批量<select id="cargo-count" aria-label="每趟货物数量"><option value="1">1</option><option value="5" selected>5</option><option value="10">10</option><option value="20">20</option></select></label><button class="primary" data-civ-create-route ${!at||!targets.length?'disabled':''}>建立货运路线</button></div><div class="civ-grid">${e.routes.map(r=>`<article class="growth-card"><h3>${G.REALMS[r.from].name} → ${G.REALMS[r.to].name}</h3><p>${G.RESOURCE_NAMES[r.item]} ×${r.count} · ${r.cargo?'在途，剩余 '+Math.ceil(r.cargo.remaining)+' 秒':!r.enabled?'已停用':r.wait?'装载间隔 '+Math.ceil(r.wait)+' 秒':'等待源站库存与晶能'}</p>${button('route-toggle',r.enabled?'停用路线':'启用路线',{id:r.id})}${button('route-remove','移除路线',{id:r.id,disabled:!!r.cargo})}</article>`).join('')||'<p class="subtle">尚无货运路线。四级先连接原岛与镜沙，两地分别建好货栈。</p>'}</div>`;
}
function ecologyPanel(s){
 const e=s.odyssey;
 return`<section class="civ-callout"><h3>六片土地，各自生长</h3><p>工业提取会积累文明失衡。七级后在不同地图建生态花园，并用堆肥与种子修复当地生态。至少三地拥有花园且健康达到 60，才能完成守序阶段的新篇目标。</p>${button('restore','照料当前土地 · 2堆肥 + 3种子',{disabled:s.level<7||!s.tech.includes('ecolink')})}${button('stabilize','共鸣台调谐 · 4共鸣',{disabled:e.strain<=0})}</section><div class="civ-grid">${Object.entries(G.REALMS).map(([id,map])=>{const world=worldState(s,id),visited=s.expedition.visited.includes(id),garden=world?.buildings.some(b=>b.type==='garden');return`<article class="growth-card ${visited?'':'frontier-locked'}"><h3>${map.name}</h3>${meter('生态健康',e.health[id])}<p>${visited?'已探索':'未探索 · '+map.level+'级开放'} · ${garden?'✓ 有生态花园':'待建生态花园'}</p><p>${e.signals.includes(id)?'✦ 已接续共建信号':ownContact(e,id)?'已完成营地约定':'待了解当地营地'}</p></article>`;}).join('')}</div>`;
}
const ownContact=(e,id)=>Object.hasOwn(e.contacts,id);
export function renderOdysseyPanel(s,{tab='overview',selectedId=null}={}){
 const tabs={overview:'新篇任务',puzzle:'遗构解谜',story:'营地约定',industrial:'供能生产',logistics:'跨图货运',ecology:'六地生态'};
 const nav=`<div class="tabs civ-tabs">${Object.entries(tabs).map(([id,name])=>`<button data-civ-tab="${id}" class="${id===tab?'selected':''}" aria-pressed="${id===tab}">${name}</button>`).join('')}</div>`;
 const pages={overview:()=>overview(s),puzzle:()=>puzzlePanel(s),story:()=>storyPanel(s),industrial:()=>industryPanel(s,selectedId),logistics:()=>logisticsPanel(s),ecology:()=>ecologyPanel(s)};
 const content=(pages[tab]||pages.overview)();
 return{title:tab==='puzzle'?SITES[s.expedition.current].name:tab==='story'?CONTACTS[s.expedition.current].name:'文明控制台',body:nav+'<div class="civilization-panel">'+content+'</div>',subtitle:'2.0 · 星海回响 · '+G.realm(s).name+' · 面板打开时世界暂停'};
}
