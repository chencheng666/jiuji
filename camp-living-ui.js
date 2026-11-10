import * as G from './survival.js';
import {ANIMALS} from './countryside-data.js';
import {buildingLinks} from './camp-layout.js';
import {rememberedResources,companionReaction,inspectable} from './camp-living.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const name=n=>n.type==='animal'?ANIMALS[n.species]?.name:G.BUILDING_NAMES[n.type]||G.NODES[n.type]?.name||'荒野目标';
export function layoutCard(s,b){const list=buildingLinks(s,b);return list.length?`<section class="layout-card"><h3>营地布局</h3>${list.map(d=>`<p><b>${d.name}${d.active?' · 已生效':' · 等待营火点燃'}</b><br>${d.text}<br>关联：${G.BUILDING_NAMES[d.partner.type]} · ${Math.round(G.distance(b,d.partner))} 步；同类不叠加。</p>`).join('')}</section>`:'';}
export function inspectPanel(s,id){
 const n=[...s.nodes,...s.buildings].find(n=>n.id===id);if(!inspectable(s,n))return'<p>目标暂时离开了，或尚未探索到这里。</p>';
 const building=s.buildings.includes(n),d=G.NODES[n.type],tracked=s.campLiving.tracked?.realm===s.expedition.current&&s.campLiving.tracked.id===id;
 const remaining=Math.max(0,(n.respawnAt||0)-s.time),status=building?'已建造':n.available?'可以交互':remaining?'恢复中 · 约 '+Math.ceil(remaining)+' 秒':n.type==='tree'?'已采空 · 可用种子重新植树':'已采空 · 不会自动恢复';
 const drops=Object.entries(d?.drop||{}).map(([k,v])=>G.ITEMS[k].name+' ×'+v).join('、');
 const near=G.distance(s.player,n)<=180,permanent=!['tide','fungus'].includes(s.expedition.current);
 return`<h3>${esc(name(n))}</h3><p>${status} · 距离 ${Math.round(G.distance(s.player,n))} 步</p>${!building&&drops?`<p>每次完整采集：${drops}<br>${d.tool?'工具：'+G.ITEMS[d.tool].name+'；':'徒手可采；'}${n.available?'当前还需 '+Math.max(1,n.hp)+' 次操作。':remaining?'按当前地图有效游玩时间恢复，离开地图时暂停。':'可以在地图保留采空记录。'}</p>`:''}${n.type==='animal'?`<p>${esc(ANIMALS[n.species].when)}。可走近观察，驯养说明见动物手记。</p>`:''}${building?layoutCard(s,n):''}<div class="inspect-actions">${permanent?`<button class="secondary" data-living="track" data-living-id="${esc(id)}">${tracked?'取消追踪':'标记为当前目标'}</button>`:'<p>临时裂隙每趟会变化，不保留跨趟标记。</p>'}<button class="secondary" data-do="map">打开地图</button>${building?`<button class="primary" ${near?'data-manage':'data-inspect-go'}="${esc(id)}">${near?'管理设施':'走近并管理'}</button>`:n.available?`<button class="primary" data-inspect-go="${esc(id)}">走近并${n.type==='animal'?'观察':'交互'}</button>`:''}</div><p class="subtle">长按只查看，不自动采集。摇杆和触屏按键继续用于移动、攻击；关闭详情回到荒野。</p>`;
}
export function memoryPanel(s){
 const list=rememberedResources(s).sort((a,b)=>b.at-a.at),tracked=s.campLiving.tracked;
 return`<details class="memory-list"><summary>资源足迹 · 本图记住 ${list.length} 处${tracked?.realm===s.expedition.current?' · 有追踪目标':''}</summary><p>只记录亲手采集过的地点；灰圈表示采空，空心圈表示已恢复。每张常驻地图保留最近 160 处，旧版存档从本次游玩开始记录。</p>${list.slice(0,16).map(n=>`<button class="secondary" data-inspect="${esc(n.id)}">${esc(name(n))} · ${n.available?'可采':n.remaining?'约 '+Math.ceil(n.remaining)+' 秒恢复':'已采空'}${tracked?.realm===s.expedition.current&&tracked.id===n.id?' · 追踪中':''}</button>`).join('')||'<p>采集过的树、矿点和草丛会留下足迹。</p>'}</details>`;
}
export function jointProjectCard(s,id){const stage=s.campLiving.joint;if(!['bay','ridge'].includes(id))return'';const expected=stage===0?'bay':'ridge';return`<article class="co-card joint-project"><h3>两地共同事务 · 共用储物架</h3><p>${stage===0?'河湾出木料，石脊出手艺。先在河湾用 6 木材、6 纤维准备协作物资箱。':stage===1?'把河湾的协作物资箱带到石脊，再提供 6 石料、2 燧石，和修械师共同完成。':'✓ 两地储物架已完成，这段共同的经历已经写进旅程。'}</p><p>进度 ${stage}/2。完成回礼：远征图纸 ×1、谷籽饲料 ×3、洞见 +4，两地好感 +6、安稳 +5。无倒计时，不扣另一聚落好感。</p>${stage<2?`<button class="secondary" data-living="joint" data-living-id="${esc(id)}" ${id===expected?'':'disabled'}>${id!==expected?'下一站：'+(expected==='bay'?'河湾聚落':'石脊聚落'):stage===0?'备好材料，打包协作物资箱':'交付物资，一起完成储物架'}</button>`:''}<p class="subtle">需走近对应聚落当面交付；物资箱为任务物品，不会因探索模式倒下掉落。</p></article>`;}
export const companionLine=(s,id)=>`<p class="companion-reaction">「${esc(companionReaction(s,id))}」</p>`;
