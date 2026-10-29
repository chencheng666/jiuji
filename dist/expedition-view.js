import {CREATURES,realm} from './expeditions.js';
// 攻击预警与伤害区域共享同一坐标、半径，画面不另行估算命中。
export function drawCreature(view,c,s,m){
 const d=CREATURES[m.kind];if(!d||m.hp<=0)return;
 const width=d.boss?135:85;view.sprite(c,m.kind,m.x,m.y,width,m.stun?.55:1);
 const y=m.y-width*1.15;c.fillStyle='#1c302bdd';c.fillRect(m.x-33,y,66,5);c.fillStyle=d.boss?'#e6bb7d':'#c6d599';c.fillRect(m.x-33,y,66*Math.max(0,m.hp/d.hp),5);
 c.font='11px sans-serif';c.textAlign='center';c.strokeStyle='#25352b';c.lineWidth=3;c.strokeText(d.name,m.x,y-7);c.fillStyle='#efe2bc';c.fillText(d.name,m.x,y-7);
}
export function drawWarnings(c,s){
 for(const m of s.expedition.creatures){const w=m.warning;if(!w||m.hp<=0)continue;const p=1-w.left/w.total;
  c.fillStyle='#df7d5833';c.strokeStyle='#f8aa75';c.lineWidth=3;c.beginPath();c.arc(w.x,w.y,w.radius,0,Math.PI*2);c.fill();c.stroke();
  c.strokeStyle='#f9d49b';c.lineWidth=5;c.beginPath();c.arc(w.x,w.y,w.radius,-Math.PI/2,-Math.PI/2+p*Math.PI*2);c.stroke();
  if(CREATURES[m.kind].kind==='charge'){c.setLineDash([8,7]);c.beginPath();c.moveTo(m.x,m.y);c.lineTo(w.x,w.y);c.stroke();c.setLineDash([]);}
  c.font='bold 11px sans-serif';c.fillStyle='#fff0c4';c.textAlign='center';c.fillText('即将攻击',w.x,w.y+4);
 }
 const shot=s.expedition.shot;if(shot&&shot.until>s.time){c.strokeStyle={fire:'#ffc17e',frost:'#c5edee',pierce:'#e4d5a5',blunt:'#dec89a'}[shot.kind];c.lineWidth=3;c.beginPath();c.moveTo(shot.x,shot.y);c.lineTo(shot.tx,shot.ty);c.stroke();}
 if(s.expedition.invulnerable>0){c.strokeStyle='#d6eee5bb';c.lineWidth=2;c.beginPath();c.ellipse(s.player.x,s.player.y-35,36,51,0,0,Math.PI*2);c.stroke();}
}
export function drawPortal(view,c,s,n){
 view.sprite(c,'wormhole',n.x,n.y,108);c.save();c.strokeStyle='#c3e8d380';c.lineWidth=2;c.beginPath();c.ellipse(n.x,n.y-42,25+Math.sin(s.time*2)*3,39,0,0,7);c.stroke();
 c.font='12px sans-serif';c.textAlign='center';c.fillStyle='#f0dfb3';c.fillText('虫洞 · '+realm({expedition:{current:n.destination}}).name,n.x,n.y-128);c.restore();
}
