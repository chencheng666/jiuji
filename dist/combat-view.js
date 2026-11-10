// 所有效果只读取真实命中与控制状态，不改变伤害、射程或冷却。
export function drawCombat(c,s,reduced=false){
 const a=s.expedition.shot;if(!a||a.until<=s.time)return;
 const duration=a.duration||.25,t=Math.max(0,Math.min(1,1-(a.until-s.time)/duration)),angle=Math.atan2(a.ty-a.y,a.tx-a.x),bow=['bow','prismBow'].includes(a.weapon),hammer=['hammer','gravityHammer'].includes(a.weapon);
 c.save();c.lineCap='round';c.globalAlpha=reduced?1:1-t*.7;
 c.strokeStyle={fire:'#ffc17e',frost:'#c5edee',pierce:'#e4d5a5',blunt:'#dec89a',energy:'#a2e5da'}[a.kind]||'#e4d5a5';c.fillStyle=c.strokeStyle;c.lineWidth=3;
 if(bow){
  // 箭迹在命中时出现；其后保留短暂余迹，不暗示延迟结算伤害。
  c.setLineDash([10,7]);c.beginPath();c.moveTo(a.x,a.y);c.lineTo(a.tx,a.ty);c.stroke();c.setLineDash([]);
  c.save();c.translate(a.tx,a.ty);c.rotate(angle);c.beginPath();c.moveTo(-20,0);c.lineTo(5,0);c.moveTo(-3,-5);c.lineTo(5,0);c.lineTo(-3,5);c.stroke();c.restore();
  c.save();c.translate(a.x,a.y);c.rotate(angle);c.beginPath();c.arc(0,0,23,-1.2,1.2);c.moveTo(8,-21);c.lineTo(reduced?-5:-14*(1-t),0);c.lineTo(8,21);c.stroke();c.restore();
 }else if(hammer){
  c.save();c.translate(a.x,a.y);c.rotate(angle+(reduced?0:(t-.5)*1.3));c.lineWidth=5;c.beginPath();c.moveTo(0,0);c.lineTo(45,0);c.stroke();c.fillRect(37,-13,19,26);c.restore();
  c.lineWidth=3;c.beginPath();c.ellipse(a.tx,a.ty+22,reduced?32:20+t*38,reduced?12:8+t*15,0,0,7);c.stroke();
 }else{
  c.lineWidth=a.kind==='frost'?5:3;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(a.tx,a.ty);c.stroke();
  if(a.kind==='frost'){for(let i=0;i<3;i++){const x=a.tx+(i-1)*16,y=a.ty+12;c.beginPath();c.moveTo(x-5,y+8);c.lineTo(x,y-7);c.lineTo(x+5,y+8);c.stroke();}}
 }
 if(a.label){c.font='bold 12px sans-serif';c.textAlign='center';c.lineWidth=4;c.strokeStyle='#20362f';c.strokeText(a.label,a.tx,a.ty-40);c.fillText(a.label,a.tx,a.ty-40);}
 c.restore();
}
export function drawCreatureStatus(c,s,m){
 const label=m.stun>0?'打断 · '+m.stun.toFixed(1)+'秒':m.slow>0?'减速 · '+m.slow.toFixed(1)+'秒':'';if(!label)return;
 c.save();c.font='bold 11px sans-serif';c.textAlign='center';c.fillStyle=m.stun>0?'#f3d299':'#bde9ef';c.fillText(label,m.x,m.y+21);c.restore();
}
