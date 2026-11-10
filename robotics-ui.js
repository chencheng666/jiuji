import * as G from './survival.js';
import {ROBOT_COST,ROBOT_TYPES,robotAt,robotStatus} from './robotics.js';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const items=bag=>Object.entries(bag||{}).filter(([,n])=>n>0).map(([id,n])=>G.ITEMS[id].name+' ×'+n).join('、')||'暂无物资';
export function robotStation(s,d){
 const r=robotAt(s,d.id),near=G.distance(s.player,d)<=180;
 const button=(action,text,disabled=false)=>`<button class="secondary" data-robot="${action}" data-dock="${escape(d.id)}" ${disabled?'disabled':''}>${text}</button>`;
 let body=`<div class="robot-summary"><img src="./assets/gatherbot.svg" alt="背着货箱的拾荒机器人"><div><h3>${r?'拾荒机 '+r.id.slice(6):'你的第一台机械助手'}</h3><p>${r?escape(robotStatus(s,r)):'二级研究机械助手后，组装一台独立作业的拾荒机。'}</p><p>工作站晶能 ${Math.floor(d.robotEnergy||0)}/120${r?' · 电量 '+Math.floor(r.battery)+'%':''}</p></div></div>`;
 body+=`<p class="robot-note">不需要跟随玩家：只在当前地图已探索的陆地上采集。满载、低电或遇险会返回；切图、打开面板和退出游戏时暂停，不补算离线生产。</p>`;
 if(!r)body+=`<p>组装材料：${Object.entries(ROBOT_COST).map(([id,n])=>G.ITEMS[id].name+' '+G.craftAmount(s,id)+'/'+n).join(' · ')}</p>${button('assemble','组装拾荒机',!near||s.level<2||!s.tech.includes('robotics')||!G.craftAffordable(s,ROBOT_COST))}`;
 if(r){
  body+=`<div class="robot-actions">${button('toggle',r.enabled?'暂停并返站':'开启独立作业')}${button('return','召回待命')}${button('pack','回收机体',!near||r.enabled||G.distance(r,d)>=3||Object.values(r.cargo).some(n=>n>0))}</div><div class="robot-settings"><label>采集目标<select data-robot-setting="resource" data-dock="${escape(d.id)}">${Object.entries(ROBOT_TYPES).map(([id,v])=>`<option value="${id}" ${r.resource===id?'selected':''}>${v.name}</option>`).join('')}</select></label><label>工作站周围范围<select data-robot-setting="radius" data-dock="${escape(d.id)}">${[240,400,560].map(n=>`<option value="${n}" ${r.radius===n?'selected':''}>${n} 步</option>`).join('')}</select></label><label>工作站目标库存<select data-robot-setting="target" data-dock="${escape(d.id)}">${[20,40,80].map(n=>`<option value="${n}" ${r.target===n?'selected':''}>${n} 份后停工</option>`).join('')}</select></label></div><p>货箱（上限 16）：${items(r.cargo)}<br>已完成 ${r.trips} 趟返站，累计卸货 ${r.delivered} 份。任务变更会先返站，不丢弃货物。回收机体完整返还组装材料，电量不折回原晶。</p>`;
 }
 body+=`<div class="robot-store"><h3>工作站物资</h3><p>${items(d.inventory)}</p><div class="robot-actions">${button('collect','取出采集物',!near)}${button('fuel','投入 1 原晶 · 晶能 +60',!near||(d.robotEnergy||0)>60||!G.craftAffordable(s,{crystal:1}))}</div><small>附近 180 步内的仓内物资也可直接合成；不会跨图取料。${near?'':'补能、组装和取货需要先走近工作站。'}</small></div>`;
 return body;
}
export function robotOverview(s){
 const docks=s.buildings.filter(b=>b.type==='robotdock');
 return`<p>机械助手会替你处理重复劳动。打开本面板时，世界和机器人均暂停。</p>${docks.length?docks.map(d=>`<article class="robot-card"><h3>本地机器人工作站</h3>${robotStation(s,d)}</article>`).join(''):`<article class="robot-card"><h3>从第一台拾荒机开始</h3><p>晋升二级 → 掌握「地脉采集」和「万物观察」 → 在研究台研究「营地机械助手」 → 合成文明设施里的机器人工作站。</p><button class="secondary" data-open-category="advanced">查看工作站配方</button><button class="secondary" data-do="tech">查看科技</button></article>`}${s.robotics.robots.filter(r=>r.realm!==s.expedition.current).map(r=>`<article class="robot-card"><b>${G.REALMS[r.realm].name} · 拾荒机 ${r.id.slice(6)}</b><p>外地图待机，货物和电量保留；返回当地后继续原任务。</p></article>`).join('')}`;
}
