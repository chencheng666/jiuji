import * as G from './survival.js';
import {CROPS} from './homestead.js';
import {ROBOT_MODELS,ROBOT_UPGRADES,ROBOT_TYPES,robotCapacity,robotRadius,robotStores,robotStatus} from './robotics.js';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const items=bag=>Object.entries(bag||{}).filter(([,n])=>n>0).map(([id,n])=>G.ITEMS[id].name+' ×'+n).join('、')||'暂无物资';
const costs=(s,bag)=>Object.entries(bag).map(([id,n])=>G.ITEMS[id].name+' '+G.craftAmount(s,id)+'/'+n).join(' · ');
export function robotStation(s,d){
 const near=G.distance(s.player,d)<=180,bots=s.robotics.robots.filter(r=>r.realm===s.expedition.current&&r.dockId===d.id);
 const button=(action,text,disabled=false,r=null,value='')=>`<button class="secondary" data-robot="${action}" data-dock="${escape(d.id)}" data-bot="${r?.id||''}" data-value="${escape(value)}" ${disabled?'disabled':''}>${text}</button>`;
 const select=(r,key,title,options)=>`<label>${title}<select aria-label="${ROBOT_MODELS[r.model||'gather'].name} · ${title}" data-robot-setting="${key}" data-dock="${escape(d.id)}" data-bot="${r.id}">${options.map(([value,text])=>`<option value="${escape(value)}" ${String(r[key])===String(value)?'selected':''}>${escape(text)}</option>`).join('')}</select></label>`;
 let body=`<details class="robot-rules" data-disclosure="rules"><summary>作业规则与跨图说明</summary><p class="robot-note">各型号一台，合计最多三台。只在当前地图已探索的安全陆地作业；满载、低电或遇险返站。面板、后台、切图和离线均暂停机器人。折跃货栈负责跨图，搬运机负责本地接驳。</p></details><div class="robot-actions">${button('fuel','投入 1 原晶 · 晶能 +60',!near||(d.robotEnergy||0)>60||!G.craftAffordable(s,{crystal:1}))}${button('collect','取出工作站全部物资',!near)}</div><p>工作站晶能 ${Math.floor(d.robotEnergy||0)}/120 · 三机共用，停机也会充电。</p>`;
 for(const[model,def]of Object.entries(ROBOT_MODELS)){
  const r=bots.find(r=>(r.model||'gather')===model);
  body+=`<details class="robot-card robot-model" data-disclosure="model-${model}"><summary><img src="./assets/${def.sprite}.svg" alt=""><span><b>${def.name}${r?' · '+Math.floor(r.battery)+'%':''}</b><small>${r?escape(robotStatus(s,r)):'点开组装 · '+def.level+'级 · '+def.text}</small></span><span aria-hidden="true">⌄</span></summary>`;
  if(!r){body+=`<p>${def.text}${def.tech?' 需要共生实践。':''}</p><p>${costs(s,def.cost)}</p>${button('assemble','组装'+def.name,!near||s.level<def.level||!s.tech.includes('robotics')||def.tech&&!s.tech.includes(def.tech)||!G.craftAffordable(s,def.cost),null,model)}</details>`;continue;}
  body+=`<div class="robot-actions">${button('toggle',r.enabled?'暂停并返站':'开启独立作业',false,r)}${button('return','召回待命',false,r)}</div><div class="robot-settings">`;
  if(model==='gather')body+=select(r,'resource','采集目标',Object.entries(ROBOT_TYPES).map(([id,v])=>[id,v.name]));
  if(model==='gardener')body+=select(r,'crop','补种作物',Object.entries(CROPS).map(([id,v])=>[id,v.name+' · '+items(v.cost)]));
  if(model==='hauler'){
   const stores=robotStores(s).map(b=>[b.id,G.BUILDING_NAMES[b.type]+' · '+Math.round(b.x)+','+Math.round(b.y)]),options=[['','请先选择本地设施'],...stores];
   body+=select(r,'sourceId','起点设施',options)+select(r,'destinationId','终点设施',options)+select(r,'haulItem','搬运物品',Object.entries(G.ITEMS).filter(([,v])=>!v.unique&&!v.durability).map(([id,v])=>[id,v.name]))+select(r,'reserve','源仓至少保留',[0,5,10,20].map(n=>[n,n+' 份']))+select(r,'batch','每趟上限',[1,5,10,16].map(n=>[n,n+' 份']));
  }
  body+=select(r,'radius','基础作业半径',[240,400,560].map(n=>[n,n+' 步']))+select(r,'target',model==='hauler'?'终点目标库存':model==='gardener'?'工作站收成目标':'工作站目标库存',[20,40,80].map(n=>[n,n+' 份后等待']))+`</div><p>实际半径 ${robotRadius(r)} 步 · 货箱 ${Object.values(r.cargo).reduce((a,b)=>a+b,0)}/${robotCapacity(r)}：${items(r.cargo)}<br>返站 ${r.trips} 趟 · 累计卸货 ${r.delivered} 份。</p>`;
  if(model==='gardener')body+=`<p class="subtle">育苗床需要先完成首项远征委托才能建造。园丁只从本站领种料，不动你的背包；已有作物等成熟后收获，再按新设置补种。没料、没床或达到库存就等待，不加快作物生长。</p>`;
  body+=`<details class="robot-upgrades" data-disclosure="upgrade-${r.id}"><summary>改装与回收${r.upgrade?' · '+ROBOT_UPGRADES[r.upgrade].name:''}</summary><p>二选一，需停机、卸空并靠近。回收机体返还组装和改装材料，电量不折回原晶。</p>${Object.entries(ROBOT_UPGRADES).map(([id,u])=>`<p><b>${u.name}</b> · ${u.text}<br>${costs(s,u.cost)}</p>${button('upgrade',r.upgrade===id?'已安装':'安装'+u.name,!!r.upgrade||!near||r.enabled||G.distance(r,d)>=3||Object.values(r.cargo).some(n=>n)||!G.craftAffordable(s,u.cost),r,id)}`).join('')}${button('pack','回收机体与模块',!near||r.enabled||G.distance(r,d)>=3||Object.values(r.cargo).some(n=>n>0),r)}</details></details>`;
 }
 body+=`<details class="robot-store" data-disclosure="robot-store"><summary>工作站种料与库存 · 点此存入 / 取出</summary><p>${items(d.inventory)}</p><p>可装入种子、种荚、荧光花供园丁播种，或把工作站设为搬运机的起点。附近 180 步可直接合成，不跨图取料。</p><div class="robot-supplies">${Object.entries(s.inventory).filter(([id,n])=>n>0&&!G.ITEMS[id].unique&&!G.ITEMS[id].durability).map(([id,n])=>`<div><span>${G.ITEMS[id].name} · 背包 ${n} / 站内 ${d.inventory?.[id]||0}</span><button class="secondary" data-robot-deposit="${escape(id)}" data-dock="${escape(d.id)}" ${near?'':'disabled'}>存入5</button></div>`).join('')}</div></details>`;
 return body;
}
export function robotOverview(s){
 const docks=s.buildings.filter(b=>b.type==='robotdock');
 return`<p>拾荒 → 园丁 → 搬运：从替你收集到连接营地。展开一种型号配置，其余收起，关闭面板后世界才继续。</p>${docks.length?docks.map(d=>robotStation(s,d)).join(''):`<article class="robot-card"><h3>从机械助手开始</h3><p>二级 → 地脉采集＋万物观察 → 营地机械助手 → 文明设施中建工作站。园丁还需共生实践，搬运机三级开放。</p><button class="secondary" data-open-category="advanced">查看工作站配方</button><button class="secondary" data-do="tech">查看科技</button></article>`}${s.robotics.robots.filter(r=>r.realm!==s.expedition.current).map(r=>`<article class="robot-card"><b>${G.REALMS[r.realm].name} · ${ROBOT_MODELS[r.model||'gather'].name}</b><p>外地图待机，货物和电量保留；返回当地后继续。</p></article>`).join('')}`;
}
