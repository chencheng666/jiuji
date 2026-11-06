import {SITES,CONTACTS} from './odyssey-data.js';
import {CREATURES} from './expeditions.js';
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function label(c,text,x,y,color='#d9d6ac'){
  c.save();c.font='11px sans-serif';c.textAlign='center';c.strokeStyle='#283b30';c.lineWidth=4;c.strokeText(text,x,y);c.fillStyle=color;c.fillText(text,x,y);c.restore();
}
export function drawOdysseySite(view,c,s,n){
  const id=s.expedition.current,e=s.odyssey;
  if(n.type==='conduit'){
    const definition=SITES[id],solved=e.puzzles[id].solved,locked=s.level<definition.level;
    view.sprite(c,'conduit',n.x,n.y,115,locked?.5:1);
    c.strokeStyle=solved?'#b8e1be':'#d5c28b88';c.lineWidth=2;c.setLineDash(solved?[]:[5,7]);c.beginPath();c.ellipse(n.x,n.y,55,23,0,0,Math.PI*2);c.stroke();c.setLineDash([]);
    label(c,(solved?'✓ ':definition.level+'级 · ')+definition.name,n.x,n.y-145,solved?'#c9e6c0':'#e9d3a2');
    if(!locked&&!solved){c.fillStyle='#d4dea8';c.beginPath();c.arc(n.x,n.y-125,3+Math.sin(s.time*2)*.5,0,7);c.fill();}
  }else{
    view.sprite(c,'wayfarer',n.x,n.y,100);
    const done=Object.hasOwn(e.contacts,id),signal=e.signals.includes(id);
    label(c,(signal?'✦ ':done?'✓ ':'◇ ')+CONTACTS[id].name,n.x,n.y-120,signal?'#b8e0cb':'#e2d1a9');
    c.fillStyle='#3a4e34';c.fillRect(n.x-30,n.y-8,60,4);c.fillStyle='#acc69b';c.fillRect(n.x-30,n.y-8,60*e.health[id]/100,4);
  }
}
export function drawCivilization(view,c,s,visible){
  const e=s.odyssey;if(!e)return;
  const reduced=view.reducedMotion;
  const generators=s.buildings.filter(b=>['windmill','solararray'].includes(b.type));
  for(const b of s.buildings){
    if(['drill','synthesizer','assembler'].includes(b.type)&&b.machine&&visible(b)){
      const source=generators.sort((a,z)=>dist(a,b)-dist(z,b))[0];
      if(source&&dist(source,b)<900){c.strokeStyle=b.machine.powered?'#a2ceaa33':'#8a967b26';c.lineWidth=2;c.setLineDash([5,9]);c.beginPath();c.moveTo(source.x,source.y-22);c.lineTo(b.x,b.y-22);c.stroke();c.setLineDash([]);}
      label(c,b.machine.powered?'晶能供电中':!b.machine.enabled?'已暂停':'等待晶能或材料',b.x,b.y-145,b.machine.powered?'#b6dfb5':'#cfbc8e');
      if(b.machine.job)label(c,'装配 '+Math.ceil(b.machine.job.remaining)+'s',b.x,b.y-160);
    }
    if(b.type==='windmill'&&visible(b)){
      c.save();c.translate(b.x,b.y-94);c.rotate(reduced?Math.PI/8:s.time*.8);
      for(let i=0;i<4;i++){c.rotate(Math.PI/2);c.fillStyle='#c7c5a0';c.strokeStyle='#3b4a37';c.lineWidth=2;c.beginPath();c.moveTo(4,-3);c.lineTo(36,-13);c.lineTo(31,2);c.lineTo(4,4);c.closePath();c.fill();c.stroke();}
      c.fillStyle='#7caa9e';c.beginPath();c.arc(0,0,5,0,7);c.fill();c.restore();
    }
    if(b.type==='relay'&&visible(b)){
      const active=e.routes.filter(r=>r.cargo&&(r.from===s.expedition.current||r.to===s.expedition.current)).length;
      label(c,active?'在途货运 '+active+' 趟':'折跃货栈',b.x,b.y-145,active?'#b3e2cf':'#d6c399');
      if(active&&!reduced){const t=(s.time*.4)%1;c.strokeStyle='#ade2cf';c.globalAlpha=1-t;c.lineWidth=2;c.beginPath();c.ellipse(b.x,b.y-55-t*45,18+t*28,7+t*10,0,0,7);c.stroke();c.globalAlpha=1;}
    }
    if(!reduced&&b.builtAt!==undefined&&s.time-b.builtAt<.8){const t=(s.time-b.builtAt)/.8;c.strokeStyle='#e8d69e';c.globalAlpha=1-t;c.lineWidth=3;c.beginPath();c.ellipse(b.x,b.y,36+t*35,15+t*15,0,0,7);c.stroke();for(let i=0;i<6;i++){const a=i*Math.PI/3;c.beginPath();c.moveTo(b.x+Math.cos(a)*(25+t*25),b.y-25+Math.sin(a)*20);c.lineTo(b.x+Math.cos(a)*(35+t*30),b.y-25+Math.sin(a)*30);c.stroke();}c.globalAlpha=1;}
  }
  if(e.projection){
    c.save();
    for(let i=0;i<6;i++){
      const a=i*Math.PI/3+(reduced?0:Math.sin(s.time*1.5)*.09),p=s.player;
      const elbow={x:p.x+Math.cos(a)*53,y:p.y-37+Math.sin(a)*30},tip={x:p.x+Math.cos(a)*77,y:p.y-37+Math.sin(a)*48};
      c.beginPath();c.moveTo(p.x+Math.cos(a)*15,p.y-37+Math.sin(a)*13);c.quadraticCurveTo(elbow.x,elbow.y-9,tip.x,tip.y);
      c.strokeStyle='#274d40';c.lineWidth=6;c.stroke();c.strokeStyle=e.heat>65?'#f1b77c':'#badfc3';c.lineWidth=2.5;c.stroke();
      c.fillStyle='#f0d69d';c.beginPath();c.arc(tip.x,tip.y,3,0,7);c.fill();
    }
    c.restore();
  }
  for(const t of e.trails){
    const age=s.time-t.at,alpha=Math.max(0,1-age/.7);if(reduced)continue;
    if(t.type==='arm'){
      c.save();c.globalAlpha=alpha;const p=s.player;
      for(const side of[-1,1]){c.strokeStyle='#294c41';c.lineWidth=7;c.beginPath();c.moveTo(p.x+side*15,p.y-37);c.quadraticCurveTo((p.x+t.x)/2+side*30,(p.y+t.y)/2-90,t.x,t.y-22);c.stroke();c.strokeStyle='#a8dcc9';c.lineWidth=3;c.stroke();}
      c.strokeStyle='#ead4a0';c.lineWidth=2;c.beginPath();c.arc(t.x,t.y-24,12+age*12,0,7);c.stroke();c.restore();
    }else view.sprite(c,'player',t.x,t.y,92,alpha*.5);
  }
  if(!reduced)for(const pickup of e.pickups){const t=(s.time-pickup.at)/.8,x=pickup.x+(s.player.x-pickup.x)*t,y=pickup.y+(s.player.y-pickup.y)*t-Math.sin(t*Math.PI)*40;c.save();c.globalAlpha=1-t;c.fillStyle='#e7c992';c.strokeStyle='#40543b';c.lineWidth=2;c.beginPath();c.arc(x,y-24,4,0,7);c.fill();c.stroke();c.restore();}
}
export function bossSummary(s){return s.expedition.creatures.filter(m=>CREATURES[m.kind]?.boss&&m.hp>0&&!m.pacified).map(m=>CREATURES[m.kind].name);}
