import {NIGHT_ROSTER,nightProfile} from './night-creatures.js';
export function drawNightCreature(view,c,s,e){
 const known=Object.hasOwn(NIGHT_ROSTER,e.kind),d=nightProfile(e),size=e.kind==='boneboar'?96:e.kind==='devourer'?94:78;
 const alpha=e.state==='burrow'?.25:1;view.sprite(c,'night-'+(known?e.kind:['stalker','lancer','prowler'].includes(e.kind)?e.kind:'stalker'),e.x,e.y,size,alpha);
 if(e.boosted){c.strokeStyle='#baa8d4';c.lineWidth=2;c.beginPath();c.ellipse(e.x,e.y+2,28,10,0,0,7);c.stroke();}
 if(known&&(e.warning||Math.hypot(e.x-s.player.x,e.y-s.player.y)<260)){c.fillStyle='#23392f';c.fillRect(e.x-27,e.y-size-16,54,4);c.fillStyle='#d9b48f';c.fillRect(e.x-27,e.y-size-16,54*Math.max(0,e.hp/d.hp),4);}
}
export function drawNightOverlay(view,c,s,left,top,z){
 const state=s.nightEncounter;if(!state||state.realm!==s.expedition.current)return;
 const labeled=new Set([...s.enemies].filter(e=>Math.hypot(e.x-s.player.x,e.y-s.player.y)<400).sort((a,b)=>Number(!!b.warning)-Number(!!a.warning)||Math.hypot(a.x-s.player.x,a.y-s.player.y)-Math.hypot(b.x-s.player.x,b.y-s.player.y)).slice(0,view.mobile?2:4));
 c.save();c.scale(z,z);c.translate(-left,-top);
 for(const h of state.hazards){if(h.until<=s.time)continue;c.fillStyle=h.kind==='poison'?'#9dbd6726':'#a7819026';c.strokeStyle=h.kind==='poison'?'#bacb87':'#d4a6a7';c.lineWidth=2;c.beginPath();c.arc(h.x,h.y,h.radius,0,7);c.fill();c.stroke();c.fillStyle='#ecddb6';c.font='11px sans-serif';c.textAlign='center';c.fillText((h.kind==='poison'?'毒液 · 离开绿圈':'蝠雾 · 回到光中')+' '+Math.ceil(h.until-s.time)+'s',h.x,h.y-h.radius-10);}
 for(const e of s.enemies){const d=nightProfile(e),w=e.warning,near=Math.hypot(e.x-s.player.x,e.y-s.player.y)<400;if(!near)continue;
  // 近处轮廓在夜色之后弱显，保留黑暗，但让手机上能辨认敌人种类。
  if(Object.hasOwn(NIGHT_ROSTER,e.kind)&&Math.hypot(e.x-s.player.x,e.y-s.player.y)<280)view.sprite(c,'night-'+e.kind,e.x,e.y,e.kind==='boneboar'?96:e.kind==='devourer'?94:78,e.state==='burrow'?.12:.58);
  if(e.kind==='howler'&&e.state!=='retreat'){c.strokeStyle='#b4a4cf55';c.lineWidth=1;c.setLineDash([4,8]);c.beginPath();c.arc(e.x,e.y,240,0,7);c.stroke();c.setLineDash([]);}
  if(w){const radius=w.kind==='poison'?65:w.kind==='bats'?105:w.kind==='blink'?36:48;c.save();c.strokeStyle=w.kind==='poison'?'#c1d58e':w.kind==='blink'?'#bcdeea':w.kind==='snuff'?'#e1a88e':'#e4b192';c.lineWidth=2;c.setLineDash([6,7]);if(w.kind!=='blink'){c.beginPath();c.moveTo(e.x,e.y);c.lineTo(w.x,w.y);c.stroke();}c.setLineDash([]);c.beginPath();c.arc(w.x,w.y,radius,0,7);c.stroke();c.lineWidth=4;c.beginPath();c.arc(w.x,w.y,radius,-Math.PI/2,-Math.PI/2+Math.max(0,Math.min(1,1-w.left/w.total))*Math.PI*2);c.stroke();c.restore();}
  const label=w?({poison:'毒液将落 · 离开绿圈',bats:'蝠群将至 · 离开红圈',blink:'即将瞬移 · 落点不伤人',snuff:'正在吞火 · 攻击可打断',charge:'冲锋蓄势 · 侧移避开'})[w.kind]:e.state==='retreat'?(e.hp<=d.hp*.3?'负伤退去':'畏光退避'):e.kind==='devourer'&&e.hp<=d.hp*.35?'狂暴 · 仍然畏光':e.kind==='howler'?'支援光环 · 优先处理':'';
  if(label&&labeled.has(e)){c.font='bold 11px sans-serif';c.textAlign='center';const caption=d.name+' · '+label,half=c.measureText(caption).width/2+8,x=Math.max(left+half,Math.min(left+view.w/z-half,e.x)),y=Math.max(top+18,e.y-112);c.lineWidth=4;c.strokeStyle='#233a31';c.strokeText(caption,x,y);c.fillStyle='#f1dcaa';c.fillText(caption,x,y);}
 }
 c.restore();
 if(state.fogUntil>s.time){c.save();c.fillStyle='#4d32451c';const w=view.w,h=view.h;for(const[x,y,ww,hh]of[[0,0,w,14],[0,h-14,w,14],[0,14,14,h-28],[w-14,14,14,h-28]])c.fillRect(x,y,ww,hh);c.font='12px sans-serif';c.textAlign='center';c.strokeStyle='#24382e';c.lineWidth=4;c.strokeText('蝠雾扰识 · 离开雾圈或回到光中',w/2,h*.63);c.fillStyle='#e5c6bd';c.fillText('蝠雾扰识 · 离开雾圈或回到光中',w/2,h*.63);c.restore();}
}
export function nightBestiary(s){return`<details id="night-bestiary" class="community-section"><summary>夜间生灵 · ${Object.keys(NIGHT_ROSTER).filter(id=>s.discoveries.includes('night:'+id)).length}/5 已记录</summary><p>亲自靠近遭遇后记录外形与习性，不要求击杀。第一夜只有影蝎，中后期才会遇到支援与吞火组合；最多四只，同时最多一个夜嚎者、一个蚀者。同类区域不按数量叠加。</p><div class="bestiary-grid">${Object.entries(NIGHT_ROSTER).map(([id,d])=>{const seen=s.discoveries.includes('night:'+id);return`<article>${seen?`<img src="./assets/night-${id}.svg" alt="${d.name}">`:'<span class="level-number">?</span>'}<h3>${seen?'✓ '+d.name:'未记录的夜间生灵'}</h3><small>${d.level}级起 · 第${d.day}天以后 · ${seen?d.role:'等待亲自遭遇'}</small><p>${seen?d.tip:'接近后会记录习性；先准备火炬，留意攻击区域与蓄势预警。'}</p></article>`;}).join('')}</div><p>光圈外保留原有缺光预警和伤害，不叠加全局移速或耐久惩罚。血蝠的加倍只影响自身雾圈的意识消耗。八级自身心光仍提供保护。</p></details>`;}
