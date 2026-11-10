import {drawCreatureStatus} from './combat-view.js';
import {CREATURES,realm,creatureProfile} from './expeditions.js';
// 攻击预警与伤害区域共享同一坐标、半径，画面不另行估算命中。
export function drawCreature(view,c,s,m){
 const d=creatureProfile(m);if(!d||m.hp<=0)return;
 const width=d.boss?135:85;view.sprite(c,m.kind,m.x,m.y,width,m.stun?.55:1);
 const y=m.y-width*1.15;c.fillStyle='#1c302bdd';c.fillRect(m.x-33,y,66,5);c.fillStyle=d.boss?'#e6bb7d':'#c6d599';c.fillRect(m.x-33,y,66*Math.max(0,m.hp/d.hp),5);
 drawCreatureStatus(c,s,m);
 const name=m.pacified?d.name+' · 已修复':d.phases?d.name+' · '+(d.phase+1)+'/3阶段':d.name;
 c.font='11px sans-serif';c.textAlign='center';c.strokeStyle='#25352b';c.lineWidth=3;c.strokeText(name,m.x,y-7);c.fillStyle=m.pacified?'#b3dfc9':'#efe2bc';c.fillText(name,m.x,y-7);
 if(d.phases&&!m.pacified){c.fillStyle='#d6d9bc';c.font='10px sans-serif';c.fillText('弱点：'+({energy:'能量',blunt:'钝击',frost:'霜晶',fire:'火焰'}[d.weak]||d.weak),m.x,y-22);}
}
export function drawWarnings(c,s){
 for(const m of s.expedition.creatures){const w=m.warning;if(!w||m.hp<=0)continue;const p=1-w.left/w.total;
  if(w.kind==='beam'){
   c.strokeStyle='#d9977855';c.lineWidth=w.radius*2;c.beginPath();c.moveTo(w.ox,w.oy);c.lineTo(w.x,w.y);c.stroke();c.strokeStyle='#f5c693';c.lineWidth=3;c.setLineDash([7,6]);c.beginPath();c.moveTo(w.ox,w.oy);c.lineTo(w.x,w.y);c.stroke();c.setLineDash([]);
  }else{c.fillStyle='#df7d5833';c.strokeStyle='#f8aa75';c.lineWidth=3;c.beginPath();c.arc(w.x,w.y,w.radius,0,Math.PI*2);c.fill();c.stroke();}
  if(w.innerRadius){c.fillStyle='#83cba244';c.strokeStyle='#c3e0a6';c.beginPath();c.arc(w.x,w.y,w.innerRadius,0,Math.PI*2);c.fill();c.stroke();}
  c.strokeStyle='#f9d49b';c.lineWidth=5;c.beginPath();c.arc(w.x,w.y,w.radius,-Math.PI/2,-Math.PI/2+p*Math.PI*2);c.stroke();
  if(CREATURES[m.kind].kind==='charge'){c.setLineDash([8,7]);c.beginPath();c.moveTo(m.x,m.y);c.lineTo(w.x,w.y);c.stroke();c.setLineDash([]);}
  c.font='bold 11px sans-serif';c.fillStyle='#fff0c4';c.textAlign='center';c.fillText('即将攻击',w.x,w.y+4);
 }

 if(s.expedition.invulnerable>0){c.strokeStyle='#d6eee5bb';c.lineWidth=2;c.beginPath();c.ellipse(s.player.x,s.player.y-35,36,51,0,0,Math.PI*2);c.stroke();}
}
export function drawPortal(view,c,s,n){
 view.sprite(c,'wormhole',n.x,n.y,108);c.save();c.strokeStyle='#c3e8d380';c.lineWidth=2;c.beginPath();c.ellipse(n.x,n.y-42,25+Math.sin(s.time*2)*3,39,0,0,7);c.stroke();
 c.font='12px sans-serif';c.textAlign='center';c.fillStyle='#f0dfb3';c.fillText('虫洞 · '+realm({expedition:{current:n.destination}}).name,n.x,n.y-128);c.restore();
}
