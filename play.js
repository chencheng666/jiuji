import {loadProgress,storeProgress} from './storage.js';
import * as G from './survival.js';
import {WorldView} from './world.js';
import {snapPoint} from './atmosphere.js';
import {SurvivalAudio} from './audio.js';
const $=s=>document.querySelector(s),escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slot=new URLSearchParams(location.search).get('slot');const suffix=slot?'.'+slot.replace(/[^a-zA-Z0-9_-]/g,'').slice(0,32):'';const SAVE_KEY='jiuji.survival.v4'+suffix,OLD_KEYS=['jiuji.survival.v3'+suffix,'jiuji.survival.v2'+suffix];
let state=G.createGame(),hasSave=false,saveError='',panel='',category='tools',stationId=null,trialId=null,placing=null,lastMessage=-1,toastUntil=0,lastHud=0,lastSave=0,lastFrame=0,deathShown=false;
try{const loaded=loadProgress(localStorage,SAVE_KEY,OLD_KEYS,G.parseSave);if(loaded.state){state=loaded.state;hasSave=true;if(loaded.recovered)saveError='主存档异常，已从上一份备份恢复。';}else if(loaded.damaged)saveError='存档无法读取，可导入备份或重新出发。';}catch{saveError='浏览器禁止本地存档，请定期导出备份。';}
const view=new WorldView($('#world')),keys=new Set(),audio=new SurvivalAudio();let continuous=false;let moveTouch={x:0,y:0};
const glyphs={seed:'❧',ingot:'▱',board:'▤',food:'♨',spear:'↟',torch:'♨',bedroll:'▱',armor:'♜'};
function icon(id,cls=''){const name=G.ITEMS[id]?.icon||id;return glyphs[name]?`<span class="item-icon ${cls}" aria-hidden="true">${glyphs[name]}</span>`:`<img class="${cls}" src="./assets/${name==='lantern'?'resonator':name}.svg" alt="">`;}
function costs(cost){return'<div class="cost">'+Object.entries(cost||{}).map(([id,n])=>`<span class="${G.amount(state,id)<n?'missing':''}">${G.RESOURCE_NAMES[id]} ${Math.floor(G.amount(state,id))}/${n}</span>`).join('')+'</div>';}
function save(){try{storeProgress(localStorage,SAVE_KEY,G.serialize(state),G.parseSave);hasSave=true;return true;}catch(e){notice('自动存档不可用，请从菜单导出备份。');return false;}}
function notice(text){$('#toast').textContent=text;$('#toast').classList.add('show');toastUntil=performance.now()+3600;}
function resetInput(){keys.clear();moveTouch={x:0,y:0};}
function show(name,extra){resetInput();if(!['welcome','restore'].includes(name))save();panel=name;if(extra){if(name==='trial')trialId=extra;else stationId=extra;}renderPanel();}
function close(){panel='';$('#overlay').classList.remove('craft-mode');$('#overlay').hidden=true;resetInput();$('#world').focus({preventScroll:true});save();}
function run(result){if(result?.ok)audio.success();if(result?.reason)notice(result.reason);if(result?.panel)show(result.panel,result.trialId||result.buildingId);if(result?.teleported)view.camera={...state.player};if(result?.promoted){show('promotion');save();}else if(result?.won){deathShown=true;show('won');save();}else if(panel)renderPanel();updateHUD();return result;}
function buildControls(){
 $('#build-controls').innerHTML=`<p>放置${G.BUILDING_NAMES[placing]} · 点击空地确认</p><div><button data-do="place-near">身边建造</button><button data-do="toggle-repeat" aria-pressed="${continuous}">连续 ${continuous?'开':'关'}</button><button data-do="toggle-snap" aria-pressed="${view.snap}">网格 ${view.snap?'开':'关'}</button><button data-do="cancel-build">取消</button></div><small>Shift 连建 · G 网格 · 右键 / Esc 取消</small>`;
}
function beginBuilding(type){placing=type;view.building=type;close();$('#build-controls').hidden=false;buildControls();}
function cancelBuilding(){placing=null;view.building=null;$('#build-controls').hidden=true;}
function buildAt(p){const type=placing,r=G.place(state,type,p.x,p.y);run(r);if(r.ok){if(!(continuous||keys.has('ShiftLeft')||keys.has('ShiftRight'))||G.recipeReason(state,G.RECIPES.find(r=>r.building===type)))cancelBuilding();else buildControls();save();}}
function dialog(title,eyebrow,body,subtitle='',footer='查看面板时，荒野时间暂停。'){
 return`<section class="dialog" role="dialog" aria-modal="true" aria-label="${title}"><header class="dialog-header"><div><div class="eyebrow">${eyebrow}</div><h2>${title}</h2>${subtitle?`<p>${subtitle}</p>`:''}</div><button class="close" data-do="close" aria-label="关闭面板">×</button></header><div class="dialog-body">${body}</div><footer class="dialog-foot"><span>${footer}</span><button data-do="close">返回荒野 <kbd>Esc</kbd></button></footer></section>`;
}
function requirementList(){return'<div class="requirements">'+G.promotionRequirements(state).map(r=>`<div class="requirement ${r.ok?'met':''}">${r.ok?'✓':'○'} ${r.text}</div>`).join('')+'</div>';}
function renderPanel(){
 $('#boot')?.remove();
 const overlay=$('#overlay');overlay.hidden=!panel;overlay.classList.toggle('craft-mode',panel==='craft');if(!panel)return;const oldScroll=overlay.querySelector('.dialog-body')?.scrollTop||0;let html='';
 if(panel==='welcome')html=`<section class="dialog welcome" role="dialog" aria-modal="true" aria-label="九级荒野初醒"><div class="crest">✧</div><h1>九级</h1><div class="chapter">从荒野，到星海</div><p class="intro">你在一片陌生的土地上醒来。<br>拾起第一根树枝，在长夜前点燃营火。<br>活下去，然后让文明生长。</p><div class="start-steps"><span>${icon('axe')}采集与合成</span><span>${icon('campfire')}建造与生存</span><span>${icon('resonator')}研究与晋升</span></div><button class="primary" data-do="start">${hasSave?'继续旅程':'踏入荒野'} →</button><p class="minor">WASD 移动 / 点击资源自动采集 / C 合成<br>1.0 · 四季 / 钓鱼 / 生存手册 · 双份存档${saveError?'<br>'+saveError:''}</p></section>`;
 if(panel==='craft'){
  const cats={tools:'工具',survival:'生存',camp:'营地',materials:'材料',advanced:'文明设施'};
  const tabs='<div class="tabs">'+Object.entries(cats).map(([id,name])=>`<button data-category="${id}" class="${id===category?'selected':''}">${name}</button>`).join('')+'</div>';
  const recipes=G.RECIPES.filter(r=>r.category===category&&(!r.level||r.level<=state.level+1)).map(r=>{const reason=G.recipeReason(state,r);return`<article class="recipe">${icon(r.item||r.building,'recipe-image')}<div class="recipe-content"><h3>${r.name}${r.level?` <small>${G.LEVEL_ROMAN[r.level]}</small>`:''}</h3><p>${r.desc}</p>${costs(r.cost)}<button class="primary" data-craft="${r.id}" ${reason?'disabled':''}>${r.building?'选择位置':'制作'}</button>${!r.building&&!G.ITEMS[r.item]?.durability&&!G.ITEMS[r.item]?.unique?`<button class="secondary batch" data-batch="${r.id}" ${reason||!G.affordable(state,Object.fromEntries(Object.entries(r.cost).map(([id,n])=>[id,n*5])))?'disabled':''}>×5</button>`:''}<button class="pin-recipe" data-pin="${r.id}" aria-label="追踪${r.name}材料">${state.wilderness.pinned===r.id?'✓ 已追踪':'＋ 追踪材料'}</button>${reason?`<div class="reason">${reason}</div>`:''}</div></article>`;}).join('');
  html=dialog('把荒野，变成家','荒野工艺 · 材料与手艺',tabs+'<div class="recipe-grid">'+recipes+'</div>','工具随采集自动使用。建筑在选定位置后才消耗材料。');
 }
 if(panel==='tech'){
  const cards=branch=>G.TECHS.filter(t=>t.branch===branch&&(!t.level||t.level<=state.level+1)).map(t=>{const reason=G.researchReason(state,t),known=state.tech.includes(t.id);return`<article class="tech-card ${known?'known':''}"><h3>${t.name}<small>${known?'✓ 已掌握':(t.level||1)+'级科技'}</small></h3><p>${t.text}</p>${known?'':costs(t.cost)}${known?'':`<button class="primary" data-research="${t.id}" ${reason?'disabled':''}>${reason||'点亮科技'}</button>`}</article>`;}).join('');
  html=dialog('两条成长的道路','KNOWLEDGE',`<div class="tech-columns"><section><h3 class="branch-title">◇ 物质 · 理解与创造</h3>${cards('matter')}</section><section><h3 class="branch-title mind">✧ 意识 · 观察与共生</h3>${cards('mind')}</section></div><h3 style="font-size:14px;margin-top:14px">${state.level<3?'一级 → 二级 · 共鸣台试炼':state.level+'级晋升试炼'}</h3>${state.level<3?requirementList():chapterList()}`,`洞见 ${Math.floor(state.insight)} · 共鸣 ${Math.floor(state.resonance)}。${G.nearby(state,'table',185)?'你在研究台范围内。':'走近研究台后才能研究。'}`);
 }
 if(panel==='bag'){
  html=dialog('行囊里的世界','INVENTORY',`<div class="bag-grid">${Object.entries(state.inventory).filter(([,n])=>n>0).map(([id,n])=>`<button class="bag-item" data-use="${id}">${icon(id)}<strong>${G.ITEMS[id].name}</strong><b>×${n}</b><small>${G.ITEMS[id].food?'食用 · 饱食 +'+G.ITEMS[id].food+(G.ITEMS[id].clarity<0?' / 意识 '+G.ITEMS[id].clarity:''):G.ITEMS[id].health?'使用 · 生命 +'+G.ITEMS[id].health:G.ITEMS[id].durability?'耐久 '+state.durability[id]+'/'+G.ITEMS[id].durability:id==='coat'?'已穿戴 · 淋雨速度 −75%':id==='seed'?'点击，在身边播种':id==='torch'?'点击，切换照明':'合成材料'}</small></button>`).join('')}</div>${repairList()}${nearbyFacilities()}`,'点击食物即可食用；点击种子在空地播种。工具会自动使用。');
 }
 if(panel==='station'){
  const b=state.buildings.find(b=>b.id===stationId);if(!b){close();return;}let body=`<div class="station-visual">${icon(b.type)}<div><h3>${G.BUILDING_NAMES[b.type]}</h3><p class="subtle">${b.type==='campfire'?`燃料还可燃烧 ${Math.ceil(b.fuel)} 秒<br>白天燃料消耗更慢。光照范围内可以驱离夜影。`:b.type==='furnace'?'用火理解矿石，让材料拥有新的可能。':b.type==='resonator'?'每一次创造，都需要与之相称的理解。':(G.RECIPES.find(r=>r.building===b.type)?.desc||'让星火回应荒野深处的沉默。')}</p></div></div>`;
  if(b.type==='campfire')body+=`<div class="station-actions"><button data-station="fuel">添柴<small>消耗 1 木材 · 燃料 +70 秒</small></button><button data-open-category="survival">烹饪与睡袋<small>打开生存配方</small></button><button data-station="meditate">营火冥想<small>1 荧光花 → 4 共鸣<br>需要万物观察 · 间隔 12 秒</small></button><button data-station="sleep">休息到清晨<small>需要睡袋、65 秒燃料、饱食 ≥30<br>黄昏 / 夜间可用 · 饱食 −24</small></button></div>`;
  if(b.type==='furnace')body+='<button class="primary" data-open-category="materials">冶炼与材料合成 →</button>';
  if(b.type==='resonator')body+=state.level>=2?'<p class="subtle">共鸣台已经回应了你。星陨高地向你敞开。</p>':requirementList()+`<button class="primary" data-station="promote" ${G.promotionRequirements(state).every(r=>r.ok)?'':'disabled'}>启动共鸣 · 晋升二级</button>`;
  if(b.type==='beacon')body+=`<p class="subtle" style="margin-bottom:18px">需要建成晶能采矿机，并投入 10 共鸣。<br>当前共鸣 ${Math.floor(state.resonance)} · 采矿机 ${state.buildings.some(b=>b.type==='drill')?'已建成':'尚未建成'}</p><button class="primary" data-station="beacon" ${state.chapterCompleted?'disabled':''}>${state.chapterCompleted?'星火已经亮起':'点亮信标'}</button>`;
  body+=stationExtension(b);html=dialog(G.BUILDING_NAMES[b.type],'营地生活',body);
 }
 if(panel==='handbook')html=handbookPanel();
 if(panel==='restore')html=dialog('恢复上一份备份','存档恢复',`<p class="subtle">将当前进度回退到上一次成功保存的状态。恢复前可先导出当前存档。</p><div class="menu-grid"><button data-do="export">导出当前进度</button><button class="primary" data-do="confirm-restore">确认恢复备份</button></div>`);
 if(panel==='journey')html=journeyPanel();
 if(panel==='trial')html=trialPanel();
 if(panel==='dismantle')html=dialog('拆除设施','营地整理',`<p class="subtle">返还一半基础材料（向下取整）。箱子与生产设施必须先取空，炖煮和诱捕完成前不能拆除。</p><div class="menu-grid"><button class="secondary" data-do="close">保留设施</button><button class="danger" data-do="confirm-dismantle">确认拆除</button></div>`);
 if(panel==='map'){
  html=dialog('脚步之外，仍是未知','EXPLORE',`<canvas id="large-map" class="map-large" width="900" height="650" aria-label="已探索区域与营地位置"></canvas><div class="map-legend"><span><i style="background:#f3e2af"></i>营地 / 遗迹</span><span><i style="background:#78cbd6"></i>鱼塘</span><span><i style="background:#d5945d"></i>铜矿</span><span><i style="background:#b4eddb"></i>原晶</span><span>◇ 遗迹试炼 · 灰暗区域需要探索</span></div><div class="journal">${state.journal.slice(0,7).map(j=>`<p><b>第 ${j.day} 天</b>${escape(j.text)}</p>`).join('')}</div>`,'东部丘陵有铜矿，南部草甸生长荧光花。二级解锁东北方的星陨高地。');
 }
 if(panel==='pause')html=dialog('在这里，歇一会儿','J I U J I · MENU',`<p class="subtle">第 ${G.day(state)} 天 · ${state.level+'级 · '+G.LEVEL_NAMES[state.level]} · ${G.biome(state.player.x,state.player.y).name}<br>世界已暂停。离开页面后不会离线消耗资源。</p><div class="menu-grid"><button class="primary" data-do="close">继续旅程</button><button class="secondary" data-do="export">导出存档</button><button class="secondary" data-do="import">导入存档</button><button class="secondary" data-do="restore">恢复上一份备份</button><button class="secondary" data-do="handbook">生存手册与四季</button><button class="danger" data-do="new">重新出发</button></div><div class="key-guide"><kbd>W A S D</kbd> / 方向键移动，<kbd>Shift</kbd> 奔跑<br><kbd>E</kbd> 采集或使用设施，<kbd>Space</kbd> 攻击<br><kbd>C</kbd> 合成，<kbd>T</kbd> 科技，<kbd>B</kbd> 背包，<kbd>M</kbd> 地图<br><kbd>F</kbd> 营火添柴，建造时 <kbd>G</kbd> 网格、<kbd>Shift</kbd> 连续放置<br><kbd>J</kbd> 九级历程，<kbd>Q</kbd> 闪步（三级），<kbd>R</kbd> 归途（四级建成折跃门）<br>点击资源会自动走近并连续采集；点击地面移动。<br>数字 <kbd>1—8</kbd> 使用快捷栏；<kbd>Esc</kbd> 关闭面板或暂停。<br>夜晚留在光里。砍树后播种，可以修复生态。</div>`,'1.0 · 从荒野到星海', '当前进度自动保存在本浏览器，建议定期导出备份。');
 if(panel==='new')html=dialog('重新走进这片荒野','NEW JOURNEY',`<p class="subtle">重新出发会替换当前生存进度。你可以先导出存档。</p><div class="menu-grid"><button class="secondary" data-do="export">先导出存档</button><button class="danger" data-do="confirm-new">确认重新出发</button></div>`);
 if(panel==='promotion'||panel==='won'||panel==='dead'){
  const won=panel==='won',dead=panel==='dead';html=`<section class="dialog ending" role="dialog" aria-modal="true" aria-label="${dead?'旅程结束':won?'九级结局':'文明晋升'}"><div class="ending-level">${dead?'☾':won?'✧':G.LEVEL_ROMAN[state.level]}</div><h2>${dead?'脚步暂止于此':won?(state.expansion.ending==='stay'?'留下，守护星火。':'归源，让故事延续。'):state.level+'级 · '+G.LEVEL_NAMES[state.level]}</h2><p class="subtle">${dead?'荒野记住了你的足迹。<br>下次，在夜晚来临前带上光与食物。':won?'从第一根树枝，到九级的最后一道门。<br>六处遗迹记住了你的选择。':G.LEVEL_BENEFITS[state.level]+'。<br>'+ (state.level===9?'回到归一星环，完成最终的选择。':'打开九级历程，查看下一段旅程。')}</p><div class="result-stats"><span><b>${G.day(state)}</b>生存天数</span><span><b>${state.stats.gathered}</b>采集次数</span><span><b>${state.tech.length}</b>科技研究</span></div>${dead?'<button class="primary" data-do="confirm-new">重新出发</button><button class="secondary" data-do="import">导入备份</button>':`<button class="primary" data-do="${won?'freeplay':'close'}">${won?'继续自由生存':'走向新的荒野'} →</button>`}<p class="minor" style="font-size:10px;color:#9cb392;margin-top:16px">${won?'九级主线已经完成。你的营地与探索记录仍会保留。':'世界已暂停，准备好后再出发。'}</p></section>`;
 }
 overlay.innerHTML=html;const scrollBody=overlay.querySelector('.dialog-body');if(scrollBody)scrollBody.scrollTop=oldScroll;if(panel==='map')view.map($('#large-map'),state,true);
 const focus=overlay.querySelector('button:not(:disabled)');focus?.focus({preventScroll:true});
}
const htmlCache=new Map();
function setHTML(selector,html){if(htmlCache.get(selector)!==html){$(selector).innerHTML=html;htmlCache.set(selector,html);}}
function hotItem(id){return id==='cooked'?['feast','fishsoup','stew','roast','ration','cooked'].find(k=>state.inventory[k])||id:id==='spear'&&state.inventory.copperSpear?'copperSpear':id;}
const hotIds=['axe','pickaxe','spear','torch','berry','cooked','seed','flower'];
function updateHUD(){
 updateWildernessHUD();
 const p=state.player;$('#vitals').innerHTML=[['♥','生命',p.hp,G.maxHealth(state),'#dfa18b'],['◒','饱食',p.hunger,100,'#dfc282'],['✧','意识',p.clarity,100,'#b9d9cd']].map(([ic,name,n,max,col])=>`<div class="vital" title="${name} ${Math.round(n)}/${max}" style="--accent:${col}"><div class="line"><em>${ic}</em><small>${name}</small><b>${Math.ceil(n)}</b></div><div class="meter"><i style="width:${Math.max(0,n/max*100)}%"></i></div></div>`).join('');
 const ph=G.phase(state),remaining=ph==='day'?190-state.time%300:ph==='dusk'?230-state.time%300:300-state.time%300;$('#day').textContent='第 '+G.day(state)+' 天';$('#phase').textContent=({day:'白昼',dusk:'黄昏',night:'夜晚'})[ph]+' · '+Math.ceil(remaining)+'s';$('#sun').textContent=ph==='night'?'☾':'☼';
 $('#knowledge').innerHTML=`<span>◇ <b>${G.LEVEL_ROMAN[state.level]} ${G.LEVEL_NAMES[state.level]}</b></span><span>洞见 <b>${Math.floor(state.insight)}</b></span><span>共鸣 <b>${Math.floor(state.resonance)}</b></span><span>生态 <b>${Math.round(state.ecology)}</b></span>`;
 const q=G.getQuest(state);$('#quest').innerHTML=`<div class="eyebrow"><span>荒野手记</span><span>第 ${state.level} 阶 / 九级</span></div><h2>${q.title}</h2><p>${q.text}<br><span style="color:#e0cc9a">${q.progress}</span></p><div class="quest-progress">${Array.from({length:9},(_,i)=>`<i class="${i<state.level?'done':''}"></i>`).join('')}</div>`;$('#quest').title=q.hint;
 $('#location').innerHTML=`⌖ ${G.biome(p.x,p.y).name} <small>${Math.round(p.x)}, ${Math.round(p.y)}</small>`;
 const hotbarHTML=hotIds.map((id,i)=>{id=hotItem(id);const n=state.inventory[id]||0;return`<button class="slot ${!n?'empty':''} ${id==='torch'&&state.torchOn?'active':''}" data-use="${id}" title="${G.ITEMS[id].name}${G.ITEMS[id].food?' · 点击食用':''}${G.ITEMS[id].durability?' · 采集时自动使用':''}" aria-label="${G.ITEMS[id].name}，数量 ${n}" ${!n?'disabled':''}>${icon(id)}<small>${i+1}</small><b>${n||''}</b>${G.ITEMS[id].durability&&n?`<i class="durability" style="width:${state.durability[id]/G.ITEMS[id].durability*100}%"></i>`:''}</button>`;}).join('');setHTML('#hotbar',hotbarHTML);
 const n=G.nearest(state);const contextHTML=placing?'':n?`<button data-do="interact"><kbd>E</kbd> ${NODESAction(n)} · ${(n.type==='trial'?G.TRIALS.find(t=>t.id===n.trialId)?.name:G.NODES[n.type]?.name)||G.BUILDING_NAMES[n.type]}</button>${n.type==='campfire'?`<button data-do="fuel" class="quick-fuel"><kbd>F</kbd> 添柴 · ${Math.ceil(n.fuel)}s</button>`:''}`:G.phase(state)==='night'&&!G.lightAt(state,p.x,p.y)?'黑暗正在侵蚀意识 · 快点亮火炬或回到营火':state.torchOn?`火炬剩余 ${Math.ceil(state.torchFuel)} 秒 · 点击火炬可熄灭`:'';setHTML('#context',contextHTML);
 updateAbilities();view.map($('#mini'),state);if(state.message&&state.message.id!==lastMessage){lastMessage=state.message.id;notice(state.message.text);}
}
function NODESAction(n){if(n.type==='pond')return'钓鱼';if(n.type==='burrow')return'查看';return G.NODES[n.type]?(['ruin','trial'].includes(n.type)?'调查':['tree'].includes(n.type)?'砍伐':['rock','ore','crystal'].includes(n.type)?'开采':'采集'):n.type==='farm'?'收获':n.type==='drill'?'取出矿石':'使用';}
function exportSave(){const url=URL.createObjectURL(new Blob([G.serialize(state)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=`九级-生存-第${G.day(state)}天.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);notice('存档已导出。');}
function perform(action){
 if(action==='sound'){audio.toggle();updateWildernessHUD();return;}if(action==='fuel'){run(G.quickFuel(state));save();return;}
 if(action==='toggle-repeat'){continuous=!continuous;buildControls();return;}if(action==='toggle-snap'){view.snap=!view.snap;if(placing)buildControls();return;}
 if(action==='unpin'){state.wilderness.pinned=null;save();updateWildernessHUD();return;}
 if(action==='close'){close();return;}if(action==='start'){close();if(state.status==='dead')show('dead');else if(state.status==='won')show('won');return;}
 if(action==='pause'){if(!panel)show('pause');else close();return;}if(['craft','tech','bag','map','journey','handbook'].includes(action)){if(panel===action)close();else show(action);return;}
 if(action==='interact'){if(!panel)run(G.interact(state));return;}if(action==='attack'){if(!panel)run(G.attack(state));return;}
 if(action==='cancel-build'){cancelBuilding();return;}if(action==='place-near'){const p=G.placementNearPlayer(state,placing);if(p)buildAt(p);else notice('附近没有合适的空地，移动后再试。');return;}
 if(action==='dash'){run(G.dash(state,(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0),(keys.has('KeyS')?1:0)-(keys.has('KeyW')?1:0)));return;}if(action==='return'){run(G.returnHome(state));save();return;}
 if(action==='dismantle'){show('dismantle');return;}if(action==='confirm-dismantle'){const r=G.dismantle(state,stationId);run(r);if(r.ok)close();return;}
 if(action==='restore'){show('restore');return;}
 if(action==='confirm-restore'){try{const raw=localStorage.getItem(SAVE_KEY+'.backup');if(!raw)throw new Error('尚无备份');const recovered=G.parseSave(raw);state=recovered;deathShown=false;cancelBuilding();view.camera={...state.player};close();notice('已恢复上一份备份。');}catch(e){notice('无法恢复：'+e.message);}return;}
 if(action==='export'){exportSave();return;}if(action==='import'){$('#import-file').click();return;}if(action==='new'){show('new');return;}
 if(action==='confirm-new'){state=G.createGame();deathShown=false;lastMessage=-1;cancelBuilding();view.camera={...state.player};save();close();notice('先拾取身边的树枝和燧石，合成石斧。');return;}
 if(action==='freeplay'){state.status='playing';deathShown=false;close();save();}
}
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b||b.disabled)return;audio.unlock();
 if(b.dataset.claim){run(G.claimHandbook(state,b.dataset.claim));save();return;}
 if(b.dataset.pin){state.wilderness.pinned=state.wilderness.pinned===b.dataset.pin?null:b.dataset.pin;save();renderPanel();updateWildernessHUD();return;}
 if(b.dataset.batch){run(G.craftBatch(state,b.dataset.batch,5));save();return;}
 if(b.dataset.do){perform(b.dataset.do);return;}
 if(b.dataset.manage){show('station',b.dataset.manage);return;}
 if(b.dataset.trial){const r=G.beginTrial(state,trialId,b.dataset.trial);run(r);if(r.ok)close();return;}
 if(b.dataset.repair){run(G.repair(state,b.dataset.repair));save();return;}
 if(b.dataset.transfer){run(G.transfer(state,stationId,b.dataset.item,b.dataset.transfer,Number(b.dataset.count)));save();return;}
 if(b.dataset.ending){run(G.chooseEnding(state,b.dataset.ending));save();return;}
 if(b.dataset.category){category=b.dataset.category;renderPanel();return;}
 if(b.dataset.openCategory){category=b.dataset.openCategory;show('craft');return;}
 if(b.dataset.craft){const r=G.craft(state,b.dataset.craft);if(r.placing)beginBuilding(r.placing);else run(r);save();return;}
 if(b.dataset.research){run(G.research(state,b.dataset.research));save();return;}
 if(b.dataset.use){const r=G.useItem(state,b.dataset.use);run(r);save();return;}
 if(b.dataset.station){const r=G.stationAction(state,b.dataset.station,stationId);run(r);if(r.ok&&(['sleep','meditate','bait'].includes(b.dataset.station)||b.dataset.station.startsWith('manifest:')||b.dataset.station.startsWith('cook:')))close();save();}
});
$('#import-file').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>500000)throw new Error('存档超过大小限制');const imported=G.parseSave(await file.text());state=imported;deathShown=false;lastMessage=-1;cancelBuilding();view.camera={...state.player};save();close();notice('存档已导入，旅程继续。');}catch(error){notice('导入失败：'+error.message);}e.target.value='';});
const keyMap={KeyW:'up',ArrowUp:'up',KeyS:'down',ArrowDown:'down',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right'};
window.addEventListener('keydown',e=>{
 if(e.ctrlKey||e.metaKey||e.altKey)return;audio.unlock();
 if(panel&&e.code==='Tab'){const buttons=[...$('#overlay').querySelectorAll('button:not(:disabled)')];if(buttons.length){const i=buttons.indexOf(document.activeElement),next=e.shiftKey?(i<=0?buttons.length-1:i-1):(i+1)%buttons.length;e.preventDefault();buttons[next].focus();}return;}
 if(e.code==='Escape'){e.preventDefault();if(placing)cancelBuilding();else if(panel==='welcome')perform('start');else if(panel==='won')perform('freeplay');else if(panel==='dead')show('pause');else if(panel)close();else show('pause');return;}
 if(e.repeat){if(!panel&&['Space',...Object.keys(keyMap)].includes(e.code))e.preventDefault();return;}
 if(panel){if(panel==='welcome'&&e.code==='Enter')perform('start');return;}
 if(keyMap[e.code]){e.preventDefault();keys.add(e.code);}if(e.code==='ShiftLeft'||e.code==='ShiftRight')keys.add(e.code);
 if(e.code==='KeyE'){e.preventDefault();keys.add(e.code);perform('interact');}if(e.code==='Space'){e.preventDefault();keys.add(e.code);perform('attack');}
 const act={KeyC:'craft',KeyT:'tech',KeyB:'bag',KeyM:'map',KeyJ:'journey',KeyF:'fuel',KeyG:'toggle-snap',KeyQ:'dash',KeyR:'return'}[e.code];if(act&&(act!=='toggle-snap'||placing))perform(act);
 if(/^Digit[1-8]$/.test(e.code)){let id=hotIds[Number(e.code.slice(-1))-1];id=hotItem(id);run(G.useItem(state,id));}
});
window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',resetInput);document.addEventListener('visibilitychange',()=>{if(document.hidden){resetInput();save();}lastFrame=performance.now();});window.addEventListener('beforeunload',save);
for(const b of document.querySelectorAll('[data-move]')){b.addEventListener('pointerdown',e=>{e.preventDefault();if(panel)return;b.setPointerCapture(e.pointerId);moveTouch={x:({left:-1,right:1})[b.dataset.move]||0,y:({up:-1,down:1})[b.dataset.move]||0};});for(const type of['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,()=>moveTouch={x:0,y:0});}
const canvas=$('#world');canvas.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();view.pointer={x:e.clientX-r.left,y:e.clientY-r.top};view.hover=panel?null:view.hit(state,view.pointer.x,view.pointer.y);canvas.style.cursor=placing?'crosshair':view.hover?'pointer':'default';});canvas.addEventListener('pointerleave',()=>view.hover=null);
canvas.addEventListener('pointerdown',e=>{if(panel||e.button!==0)return;e.preventDefault();const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,p=view.toWorld(x,y);audio.unlock();if(placing){buildAt(view.snap?snapPoint(p):p);return;}const n=view.hit(state,x,y);if(n?.type==='enemy'){run(G.attack(state));return;}run(G.goTo(state,n?.x||p.x,n?.y||p.y,n?.id));canvas.focus({preventScroll:true});});
canvas.addEventListener('contextmenu',e=>{e.preventDefault();if(placing)cancelBuilding();});
window.addEventListener('resize',()=>view.resize());
function loop(now){const dt=Math.min(.1,(now-(lastFrame||now))/1000);lastFrame=now;if(!panel&&!document.hidden){const x=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+moveTouch.x,y=(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0)+moveTouch.y;G.step(state,dt,{x,y,sprint:keys.has('ShiftLeft')||keys.has('ShiftRight'),interact:keys.has('KeyE'),attack:keys.has('Space')});if(state.request){const r=state.request;state.request=null;run(r);}if(state.status!=='playing'&&!deathShown){deathShown=true;show(state.status==='won'?'won':'dead');save();}}
 audio.update(state);view.render(state,dt);if(now-lastHud>250){updateHUD();lastHud=now;}if(now-lastSave>5000&&!panel){save();lastSave=now;}if(now>toastUntil)$('#toast').classList.remove('show');requestAnimationFrame(loop);}
show('welcome');updateHUD();requestAnimationFrame(loop);

function chapterList(){return'<div class="requirements">'+G.chapterRequirements(state).map(r=>`<div class="requirement ${r.ok?'met':''}">${r.ok?'✓':'○'} ${r.text}</div>`).join('')+'</div>';}
function repairList(){return`<section class="repair-list"><h3>装备维护</h3><p class="subtle">研究台附近可修理：石制工具消耗 1 燧石、1 树枝；铜矛消耗 1 铜锭、1 木材；护甲消耗 3 纤维、1 木材。</p>${Object.entries(state.inventory).filter(([id,n])=>n&&G.ITEMS[id].durability).map(([id])=>`<div><span>${G.ITEMS[id].name} · ${state.durability[id]}/${G.ITEMS[id].durability}</span><button class="secondary" data-repair="${id}" ${!G.nearby(state,'table',185)||state.durability[id]>=G.ITEMS[id].durability?'disabled':''}>修理</button></div>`).join('')}</section>`;}
function storageList(b){return`<h3 class="section-title">${b.type==='synthesizer'?'生产储备 · 每 30 秒补充':'营地储物'}</h3><div class="storage-grid">${Object.keys(G.ITEMS).filter(id=>!G.ITEMS[id].durability&&((b.inventory?.[id]||0)||(state.inventory[id]||0))).map(id=>`<div class="storage-row">${icon(id)}<div><b>${G.ITEMS[id].name}</b><small>背包 ${state.inventory[id]||0} / 设施 ${b.inventory?.[id]||0}</small></div>${b.type==='chest'?`<button data-transfer="in" data-item="${id}" data-count="9999" ${(state.inventory[id]||0)?'':'disabled'}>存入</button>`:''}<button data-transfer="out" data-item="${id}" data-count="9999" ${(b.inventory?.[id]||0)?'':'disabled'}>取出</button></div>`).join('')||'<p class="subtle">暂时没有物品。</p>'}</div>`;}
function stationExtension(b){let html=wildStation(b);if(['chest','synthesizer'].includes(b.type))html+=storageList(b);const c=G.CHAPTERS[state.level];if(c?.station===b.type)html+=`<h3 class="section-title">${state.level}级 → ${c.target}级 · ${G.LEVEL_NAMES[c.target]}</h3>${chapterList()}<button class="primary" data-station="ascend" ${G.chapterRequirements(state).every(r=>r.ok)?'':'disabled'}>晋升 ${c.target} 级</button>`;
 if(b.type==='forge')html+=`<h3 class="section-title">意念显化 · 每次 3 共鸣</h3><div class="manifest-grid">${Object.entries({wood:12,stone:10,ore:8,crystal:4,berry:8,grass:10,seed:6}).map(([id,n])=>`<button class="secondary" data-station="manifest:${id}">${G.ITEMS[id].name} ×${n}</button>`).join('')}</div><p class="subtle">显化后返回荒野，5 秒后可再次使用。</p>`;
 if(b.type==='garden')html+='<p class="subtle">每秒恢复 0.04 生态与 0.025 共鸣。三个不同区域的花园可以完成守序试炼。</p>';
 if(b.type==='gate')html+='<button class="secondary" data-do="return">归途传送 · 2 共鸣</button>';
 if(b.type==='archive')html+='<div class="journal">'+G.TRIALS.filter(t=>state.expansion.completed.includes(t.id)).map(t=>`<p><b>${t.name}</b>${t.options.find(o=>o.id===state.expansion.choices[t.id])?.name||'已完成'}</p>`).join('')+'</div>';
 if(b.type==='ascension'&&state.level===9)html+=state.expansion.ending?'<p class="subtle">你已经作出了自己的选择，世界仍在生长。</p>':`<h3 class="section-title">九级 · 你的最后一个选择</h3><div class="ending-choices"><button class="primary" data-ending="stay">留下守护<small>保留自己，在世界中继续生活。</small></button><button class="secondary" data-ending="return">归还星海<small>将记忆归于本源，完成这段旅程。</small></button></div>`;
 html+='<div class="station-maintenance"><button class="danger" data-do="dismantle">拆除设施</button><small>返还一半基础材料，需二次确认。</small></div>';return html;
}
function trialPanel(){const t=G.TRIALS.find(t=>t.id===trialId);if(!t)return dialog('遗迹','探索','没有找到这处遗迹。');const done=state.expansion.completed.includes(t.id);return dialog(t.name,'遗迹试炼 · '+t.level+'级',`<div class="station-visual">${icon('trial')}<p class="subtle">${t.intro}</p></div>${done?`<p class="subtle">你曾选择：${t.options.find(o=>o.id===state.expansion.choices[t.id])?.name}。这份记忆已经收入旅程。</p>`:t.options.map(o=>{const reason=G.trialReason(state,t.id,o.id);return`<article class="trial-option"><h3>${o.name}</h3><p>${o.text}</p>${costs(o.cost)}<button class="primary" data-trial="${o.id}" ${reason?'disabled':''}>${reason||'开始调谐'}</button></article>`;}).join('')}<p class="subtle">完成奖励：12 洞见、6 共鸣、1 记忆回响。<br>调谐时世界会继续运行；移动会中断，完成时才扣除材料。</p>`);}
function journeyPanel(){return dialog('九级 · 文明之路','从一根树枝，到整个星海',`<div class="journey-levels">${G.LEVEL_NAMES.slice(1).map((name,i)=>{const level=i+1,c=G.CHAPTERS[level];return`<article class="journey-level ${state.level===level?'current':''} ${state.level>level?'passed':''}"><div class="level-number">${G.LEVEL_ROMAN[level]}</div><div><h3>${name}<small>${state.level>level?'已抵达':state.level===level?'当前阶段':level+'级'}</small></h3><p>${G.LEVEL_BENEFITS[level]}</p>${c?`<small>晋升设施：${G.BUILDING_NAMES[c.station]} · ${G.TRIALS.find(t=>t.id===c.trial).name}</small>`:level===2?'<small>点亮高地信标，开启三级旅程。</small>':''}</div></article>`;}).join('')}</div><h3 class="section-title">遗迹坐标</h3><div class="trial-locations">${G.TRIALS.map(t=>`<div>${state.expansion.completed.includes(t.id)?'✓':'◇'} <b>${t.name}</b><span>${t.level}级 · ${t.x}, ${t.y}</span></div>`).join('')}</div>`,'遗迹位置在探索地图上以菱形标出。初始采矿会逐步过渡为自动生产与意念显化。');}
function updateAbilities(){const el=$('#abilities');if(!el)return;el.hidden=state.level<3;const a=state.expansion;setHTML('#abilities',`<button data-do="dash" title="Q 闪步，消耗 4 意识"><kbd>Q</kbd> 闪步${a.dashCooldown>0?' '+Math.ceil(a.dashCooldown)+'s':''}</button>${state.level>=4?`<button data-do="return" title="R 归途，需折跃门和 2 共鸣"><kbd>R</kbd> 归途${a.returnCooldown>0?' '+Math.ceil(a.returnCooldown)+'s':''}</button>`:''}${state.channel?`<span>调谐 ${Math.round(state.channel.elapsed/state.channel.duration*100)}%</span>`:''}`);}

function nearbyFacilities(){const list=state.buildings.filter(b=>G.distance(b,state.player)<=180);return '<h3 class="section-title">附近设施管理</h3><div class="manifest-grid">'+(list.map(b=>`<button class="secondary" data-manage="${b.id}">${G.BUILDING_NAMES[b.type]}</button>`).join('')||'<p class="subtle">靠近设施后可在这里管理与拆除。</p>')+'</div>';}

function updateWildernessHUD(){
 const season=G.season(state),temperature=Math.round(state.living.temperature);
 const w=G.weather(state),wet=Math.round(state.wilderness.wetness),covered=G.shelterAt(state),warm=G.nearby(state,'campfire',165);
 setHTML('#weather',`<span style="color:${season.color}">${season.name} ${season.day}/4 · ${temperature}℃</span><span>${w.raining?'☂ 林间阵雨':w.warning?'☁ 雨云将至':'☼ 天气晴朗'}</span><b class="${wet>65?'soaked':''}">${covered?'庇护中'+(wet?' · 湿度 '+wet+'%':''):warm&&wet?'烘干中 · '+wet+'%':wet?'湿度 '+wet+'%':'衣物干燥'}</b>${w.raining?`<small>约 ${Math.ceil(w.remaining)} 秒后停雨</small>`:w.warning?'<small>备好柴火，回到庇护所</small>':''}`);
 const handbook=$('[data-do="handbook"]');if(handbook)handbook.title='生存手册 · '+G.HANDBOOK.filter(h=>!state.living.claimed.includes(h.id)&&h.progress(state)>=h.goal).length+' 项奖励待领取';
 const button=$('[data-do="sound"]');button.textContent=audio.muted?'音效 关':'音效 开';button.setAttribute('aria-pressed',String(!audio.muted));
 const r=G.RECIPES.find(r=>r.id===state.wilderness.pinned),el=$('#pinned');el.hidden=!r;
 if(r)setHTML('#pinned',`<div><strong>制作清单 · ${r.name}</strong><button data-do="unpin" aria-label="取消材料追踪">×</button></div>${costs(r.cost)}<button class="secondary" data-craft="${r.id}" ${G.recipeReason(state,r)?'disabled':''}>${r.building?'选择位置':'制作'}</button>`);
}
function wildStation(b){
 if(b.type==='shelter')return '<p class="subtle">遮雨范围：125 步。进入范围后停止淋湿，并缓慢晾干。<br>在附近搭建营火，可以更快烘干衣物。毛皮披肩让外出时淋雨速度降低 75%。</p>';
 if(!['cookpot','trap'].includes(b.type))return '';
 const stock=Object.entries(b.inventory||{}).filter(([,n])=>n>0);let html='';
 if(stock.length)html+=`<div class="harvest-ready">${stock.map(([id,n])=>`${icon(id)}<span>${G.ITEMS[id].name} ×${n}</span>`).join('')}<button class="primary" data-station="collect">领取全部</button></div>`;
 else if(b.kitchen||b.baitAt)html+=`<div class="cooking-progress"><h3>${b.kitchen?'锅里咕嘟作响':'诱饵已经放好'}</h3><p>还需 ${Math.ceil((b.kitchen?.readyAt||b.baitAt)-state.time)} 秒。返回荒野后计时继续，可以先去采集。</p><button class="primary" data-do="close">继续在营地活动</button></div>`;
 else if(b.type==='trap')html+=`<p class="subtle">投入一颗浆果，60 秒后获得 2 生肉、1 毛皮。<br>诱捕在后台进行，离开营地仍会继续。</p>${costs({berry:1})}<button class="primary" data-station="bait" ${state.inventory.berry?'':'disabled'}>放置诱饵</button>`;
 else html+='<div class="dish-grid">'+G.DISHES.map(d=>`<article class="recipe">${icon(d.id,'recipe-image')}<div><h3>${d.name}</h3><p>${d.text}</p>${costs(d.cost)}<button class="primary" data-station="cook:${d.id}" ${G.affordable(state,d.cost)?'':'disabled'}>炖煮 · ${d.seconds} 秒</button></div></article>`).join('')+'</div>';
 return html;
}

function handbookPanel(){
 const season=G.season(state),temp=Math.round(state.living.temperature);
 return dialog('荒野生存手册','1.0 · 把每一件小事，变成旅程',`<section class="season-card" style="--season:${season.color}"><h3>${season.name} · 第 ${season.day} / 4 天</h3><p>${season.tip}</p><p>体感 ${temp}℃ · ${temp<6?'寒冷：寻找营火、披肩或喝鱼汤':temp>33?'炎热：前往庇护所避暑':'体感舒适'}<br>约 ${Math.ceil(season.remaining/60)} 分钟后进入${season.next}，世界暂停时不计时。</p><div class="season-strip">${['新芽春','长昼夏','丰收秋','静雪冬'].map((n,i)=>`<span class="${i===season.index?'active':''}">${n}</span>`).join('')}</div></section><div class="handbook-grid">${G.HANDBOOK.map(h=>{const value=Math.min(h.goal,h.progress(state)),claimed=state.living.claimed.includes(h.id);return `<article class="handbook-card ${claimed?'completed':''}"><h3>${claimed?'✓ ':''}${h.name}<small>${value} / ${h.goal}</small></h3><p>${h.text}</p><progress value="${value}" max="${h.goal}" aria-label="${h.name}进度"></progress><p class="reward">奖励：${Object.entries(h.reward).map(([id,n])=>G.RESOURCE_NAMES[id]+' ×'+n).join('、')}</p><button class="${value>=h.goal&&!claimed?'primary':'secondary'}" data-claim="${h.id}" ${claimed||value<h.goal?'disabled':''}>${claimed?'已领取':value<h.goal?'继续探索':'领取奖励'}</button></article>`;}).join('')}</div><p class="subtle">钓鱼：合成枝编钓竿，地图蓝色标记处寻找鱼塘，靠近点击或按 E。移动会中断等待。低于 6℃ 或高于 33℃ 会额外消耗饱食与意识；八级后不再受体温影响。</p>`,'每季四个游戏日。每条手册奖励只可领取一次。');
}
