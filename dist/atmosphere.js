import {plantingSpecies,TREE_SPECIES} from './tree-species.js';
import {layoutPreview} from './camp-layout.js';
import {weather,placementReason,plantingReason,BUILDING_NAMES} from './survival.js';
// 绘图只读取世界状态，天气伤害与生产计时由生存规则计算。
export function paintTerrain(view,id='home',seasonIndex=0){
  const canvas=document.createElement('canvas'),scale=view.terrainScale||1;canvas.width=Math.round(3600*scale);canvas.height=Math.round(2800*scale);
  const c=canvas.getContext('2d');if(!c)throw Error('设备无法创建地形画布');c.scale(scale,scale);let seed=17;
  const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  let palette={home:['#365956','#929575','#6a8067','#ac9c79','#929b68','#879b91'],verdant:['#294a49','#658774','#446e5c','#879776','#739775','#507e7a'],cinder:['#483d37','#9e8666','#82725b','#b69b72','#8d795b','#ad8a6d'],frost:['#3e606b','#b5c8c1','#93b1b0','#bacac9','#9db9b5','#c4d4d2'],mirror:['#665c49','#baa779','#a49368','#d0bd88','#a39e79','#d3ca9d'],orbit:['#252c43','#7f8d96','#576c7c','#9c9f9c','#6c7d83','#a0abb0']}[id]||['#223d42','#688b83','#466d65','#9caa80','#6b8d72','#a0bdb6'];if(['home','verdant'].includes(id)){if(seasonIndex===2)palette=['#355c59','#a9a079','#8f8e62','#b29b76','#9b9664','#a1aa89'];if(seasonIndex===3)palette=['#416b73','#bac9b7','#8ea99a','#c3baa0','#a3b8a0','#bfd1c2'];}c.fillStyle=palette[0];c.fillRect(0,0,3600,2800);
  c.strokeStyle='#adc1a426';c.lineWidth=2;
  for(let y=15;y<2800;y+=31)for(let x=rnd()*100;x<3600;x+=120+rnd()*60){c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+22,y+6,x+42,y);c.stroke();}
  view.shore(c);c.strokeStyle='#456b62';c.lineWidth=75;c.stroke();c.strokeStyle='#c1b28a';c.lineWidth=29;c.stroke();c.strokeStyle='#48513c';c.lineWidth=3;c.stroke();
  c.save();view.shore(c);c.clip();c.fillStyle=palette[1];c.fillRect(0,0,3600,2800);
  const patch=(x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();for(let i=0;i<=30;i++){const a=i/30*Math.PI*2,r=.88+rnd()*.15;const px=x+Math.cos(a)*rx*r,py=y+Math.sin(a)*ry*r;i?c.lineTo(px,py):c.moveTo(px,py);}c.closePath();c.fill();};
  patch(820,780,800,700,palette[2]);patch(2450,1120,760,850,palette[3]);patch(1880,2450,1700,650,palette[4]);patch(2870,500,500,580,palette[5]);
  for(let i=0;i<680;i++){const x=rnd()*3600,y=rnd()*2800;patch(x,y,25+rnd()*115,10+rnd()*50,i%3?'#4b563314':'#e6d6a21a');}
  // 旧路连接营地、树林与草甸，提供可读的地表方向。
  for(const [width,color]of[[52,'#6e71451b'],[35,'#b9a77b66'],[26,'#c0ad8355']]){c.lineWidth=width;c.strokeStyle=color;c.beginPath();c.moveTo(680,1000);c.bezierCurveTo(1500,1300,900,1680,1510,1800);c.bezierCurveTo(1860,1940,2260,1720,2590,1200);c.stroke();}
  for(let i=0;i<23000;i++){const x=rnd()*3600,y=rnd()*2800;c.strokeStyle=i%5?'#38462c30':'#e9dba73c';c.lineWidth=i%3?1:1.5;c.beginPath();c.moveTo(x,y);c.lineTo(x-2,y-3-rnd()*5);c.moveTo(x+1,y);c.lineTo(x+4,y-4-rnd()*3);c.stroke();}
  for(let i=0;i<950;i++){const x=rnd()*3600,y=rnd()*2800;c.fillStyle=i%3?'#484d3630':'#eee1b73b';c.beginPath();c.ellipse(x,y,1+rnd()*3,1+rnd()*2,-.4,0,7);c.fill();}
  if(id==='mirror'){c.strokeStyle='#eee0ab55';c.lineWidth=3;for(let i=0;i<90;i++){const x=rnd()*3600,y=rnd()*2800;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+70,y-30,x+150,y+2);c.stroke();}}if(id==='orbit'){c.strokeStyle='#c2d9d554';c.lineWidth=2;for(let i=0;i<110;i++){const x=Math.round(rnd()*3600/120)*120,y=Math.round(rnd()*2800/90)*90;c.strokeRect(x,y,90,55);if(i%4===0){c.beginPath();c.arc(x+45,y+27,16,0,7);c.stroke();}}}if(id==='cinder'){c.strokeStyle='#e9b16b88';c.lineWidth=4;for(let i=0;i<45;i++){const x=rnd()*3600,y=rnd()*2800;c.beginPath();c.moveTo(x,y);c.lineTo(x+30,y-15);c.lineTo(x+45,y+18);c.lineTo(x+89,y+11);c.stroke();}}if(id==='frost'){c.fillStyle='#e7efdd88';for(let i=0;i<900;i++){const x=rnd()*3600,y=rnd()*2800;c.beginPath();c.ellipse(x,y,5+rnd()*20,2+rnd()*7,0,0,7);c.fill();}}c.restore();return canvas;
}
export function groundDetails(c,s,visible){
  for(const b of s.buildings.filter(visible)){
    c.fillStyle=b.type==='campfire'?'#65513544':'#6a65452c';c.beginPath();c.ellipse(b.x,b.y,57,25,0,0,7);c.fill();
    if(b.type==='shelter'){c.strokeStyle='#d6cc9c33';c.setLineDash([4,9]);c.beginPath();c.ellipse(b.x,b.y,125,90,0,0,7);c.stroke();c.setLineDash([]);}
    if(b.type==='campfire'&&b.fuel>0){const r=120+Math.sin(s.time*7)*5,g=c.createRadialGradient(b.x,b.y-10,4,b.x,b.y-10,r);g.addColorStop(0,'#ffbe594a');g.addColorStop(.4,'#f2b44925');g.addColorStop(1,'#ffb54a00');c.fillStyle=g;c.beginPath();c.arc(b.x,b.y-10,r,0,7);c.fill();}
  }
}
export function drawRabbit(view,c,s,n){
  const trap=s.buildings.some(b=>b.type==='trap'&&b.baitAt&&Math.hypot(b.x-n.x,b.y-n.y)<180);
  if(trap)return;
  const t=s.time*.65+n.x,scared=Math.hypot(n.x-s.player.x,n.y-s.player.y)<130;
  const x=n.x+Math.cos(t*.32)*(scared?45:24),y=n.y+18+Math.sin(t*.5)*12;
  const hop=Math.max(0,Math.sin(t*3))*5;
  view.sprite(c,'rabbit',x,y-hop,40);
}
export function gatherPose(c,s){
  const a=s.action;if(!a)return;
  const n=s.nodes.find(n=>n.id===a.id);if(!n)return;
  const p=s.player,side=n.x<p.x?-1:1,progress=a.elapsed/a.duration;
  if(n.type==='pond'){const cast=Math.min(1,progress/.16),reel=progress>.85?(progress-.85)/.15:0;c.save();c.strokeStyle='#b7a778';c.lineWidth=4;c.beginPath();c.moveTo(p.x+10,p.y-35);c.lineTo(p.x+side*43,p.y-84);c.stroke();c.strokeStyle='#d9ddc0';c.lineWidth=1;c.beginPath();c.moveTo(p.x+side*43,p.y-84);c.quadraticCurveTo((p.x+n.x)/2,p.y-60,p.x+(n.x-p.x)*cast*(1-reel*.8),p.y+(n.y-p.y)*cast-30+Math.sin(progress*12)*2);c.stroke();c.fillStyle=progress>.75?'#f5cc8e':'#d7e8c5';c.beginPath();c.arc(p.x+(n.x-p.x)*cast*(1-reel*.8),p.y+(n.y-p.y)*cast-30,progress>.75?5:3,0,7);c.fill();c.restore();return;}
  if(['twig','flint','flower','bush','grass','mushroom','brokenwood'].includes(n.type)){
   const bend=Math.sin(progress*Math.PI);c.save();c.strokeStyle='#2c4034';c.lineWidth=8;c.beginPath();c.moveTo(p.x+side*8,p.y-35+bend*7);c.quadraticCurveTo(p.x+side*25,p.y-17,p.x+side*(24+bend*10),p.y-8);c.stroke();c.strokeStyle='#bca675';c.lineWidth=4;c.stroke();c.fillStyle='#ddc596';c.beginPath();c.arc(p.x+side*(24+bend*10),p.y-8,4,0,7);c.fill();c.restore();return;
  }
  c.save();c.translate(p.x+side*12,p.y-27);c.scale(side,1);const swing=progress<.35?progress/.35*.25:progress<.72?.25+(progress-.35)/.37*.75:1-(progress-.72)/.28*.5;c.rotate(-1.5+swing*2.4);
  c.strokeStyle='#302f24';c.lineWidth=8;c.beginPath();c.moveTo(0,0);c.lineTo(25,-24);c.stroke();c.strokeStyle='#ae8a54';c.lineWidth=4;c.stroke();
  if(['tree','rock','ore','crystal','meteor','mirrorsand','starroot'].includes(n.type)){
    c.fillStyle='#b9c1ac';c.strokeStyle='#343b31';c.lineWidth=2;c.beginPath();c.moveTo(16,-27);c.lineTo(27,-39);c.lineTo(42,-30);c.lineTo(33,-17);c.closePath();c.fill();c.stroke();
  }
  c.restore();
}
export function ambientObjects(c,s,view,visible){
  for(const b of s.buildings.filter(visible)){
    if((b.type==='campfire'&&b.fuel>0)||b.kitchen){
      for(let i=0;i<5;i++){const t=(s.time*.42+i*.21)%1;c.fillStyle=`rgba(222,211,177,${(1-t)*.16})`;c.beginPath();c.ellipse(b.x+Math.sin(t*4+i)*12,b.y-50-t*72,6+t*12,4+t*8,0,0,7);c.fill();}
    }
    const stock=Object.values(b.inventory||{}).some(n=>n>0);
    if(['cookpot','trap'].includes(b.type)){
      const remaining=(b.kitchen?.readyAt||b.baitAt||0)-s.time;
      if(stock){view.sprite(c,b.type==='trap'?'rabbit':'stew',b.x,b.y-36,43);label(c,'可以收获',b.x,b.y-105,'#ead599');}
      else if(remaining>0){const max=b.type==='trap'?60:12;c.fillStyle='#292f24';c.fillRect(b.x-30,b.y-102,60,5);c.fillStyle='#c7b786';c.fillRect(b.x-30,b.y-102,60*(1-remaining/max),5);label(c,(b.type==='trap'?'诱捕 ':'炖煮 ')+Math.ceil(remaining)+'秒',b.x,b.y-112,'#e1d5ae');}
    }
  }
  for(const f of s.wilderness.particles){const t=s.time-f.at;c.globalAlpha=Math.max(0,1-t);c.fillStyle=f.color;c.save();c.translate(f.x+f.vx*t,f.y+f.vy*t+60*t*t);c.rotate(t*6);c.fillRect(-2,-2,5,3);c.restore();}c.globalAlpha=1;
  if(s.player.walk){for(let i=0;i<3;i++){const t=(s.player.walk*.12+i*.3)%1;c.fillStyle=`rgba(210,195,151,${.2*(1-t)})`;c.beginPath();c.ellipse(s.player.x-8+i*7,s.player.y+5+t*12,2+t*6,1+t*3,0,0,7);c.fill();}}
}
function label(c,text,x,y,color){c.save();c.textAlign='center';c.font='11px sans-serif';c.lineWidth=3;c.strokeStyle='#30382b';c.strokeText(text,x,y);c.fillStyle=color;c.fillText(text,x,y);c.restore();}
export const snapPoint=p=>({x:Math.round(p.x/32)*32,y:Math.round(p.y/32)*32});
export function buildingPreview(view,c,s){
  const raw=view.pointer?view.toWorld(view.pointer.x,view.pointer.y):{x:s.player.x+100,y:s.player.y+70};
  const p=view.snap?snapPoint(raw):raw,bad=placementReason(s,view.building,p.x,p.y);
  c.save();c.strokeStyle='#e2d4a32b';c.lineWidth=1;
  for(let x=Math.floor((s.player.x-220)/32)*32;x<s.player.x+220;x+=32){c.beginPath();c.moveTo(x,s.player.y-220);c.lineTo(x,s.player.y+220);c.stroke();}
  for(let y=Math.floor((s.player.y-220)/32)*32;y<s.player.y+220;y+=32){c.beginPath();c.moveTo(s.player.x-220,y);c.lineTo(s.player.x+220,y);c.stroke();}
  c.setLineDash([6,7]);c.strokeStyle='#e8d7a670';c.beginPath();c.arc(s.player.x,s.player.y,210,0,7);c.stroke();c.setLineDash([]);
  c.fillStyle=bad?'#b74d3c44':'#d0d69244';c.strokeStyle=bad?'#f0a18a':'#efe4b1';c.beginPath();c.ellipse(p.x,p.y,48,25,0,0,7);c.fill();c.stroke();
  if(!view.sceneArt?.draw(c,{id:'preview',type:view.building,...p},s,view,118,.7))view.sprite(c,view.building,p.x,p.y,118,.7);label(c,bad||'点击建造 · '+BUILDING_NAMES[view.building],p.x,p.y-140,bad?'#f4baa3':'#f5e6bc');
  if(!bad){const links=layoutPreview(s,{type:view.building,...p});for(const[order,link]of links.entries()){label(c,link.name+' · '+link.text+(link.active?'':'（营火未点燃）'),p.x,p.y-164-order*19,'#e6edbc');const target=link.target||link.partner;c.strokeStyle='#c7e9ac99';c.setLineDash([4,6]);c.beginPath();c.moveTo(p.x,p.y);c.lineTo(target.x,target.y);c.stroke();c.setLineDash([]);}}c.restore();
}
export function plantingPreview(view,c,s){
  const p=view.pointer?view.toWorld(view.pointer.x,view.pointer.y):{x:s.player.x+65,y:s.player.y+45};
  const bad=plantingReason(s,p.x,p.y);
  c.save();c.setLineDash([5,8]);c.strokeStyle='#d5dc9b80';c.lineWidth=2;c.beginPath();c.arc(s.player.x,s.player.y,160,0,7);c.stroke();c.setLineDash([]);
  c.fillStyle=bad?'#b74d3c55':'#a6d99466';c.strokeStyle=bad?'#f0a18a':'#e1efaa';c.beginPath();c.ellipse(p.x,p.y,25,14,0,0,7);c.fill();c.stroke();
  if(!view.sceneArt?.draw(c,{id:'seed-preview',type:'tree',treeSpecies:plantingSpecies(s,p.x,p.y),sapling:true,...p},s,view,48,.7))view.sprite(c,'tree',p.x,p.y,48,.7);label(c,bad||'播种'+TREE_SPECIES[plantingSpecies(s,p.x,p.y)].name+' · 1 种子 · 生态 +3',p.x,p.y-72,bad?'#f4baa3':'#f5e6bc');c.restore();
}
export function screenWeather(c,s,w,h){
  const rain=weather(s);if(rain.raining){
    c.fillStyle=`rgba(40,57,64,${.13*rain.intensity})`;c.fillRect(0,0,w,h);c.strokeStyle=`rgba(205,222,207,${.32*rain.intensity})`;c.lineWidth=1;
    const count=Math.ceil(w*h/6500);c.beginPath();for(let i=0;i<count;i++){const x=(i*137.31+s.time*125)%w,y=(i*89.7+s.time*430)%h;c.moveTo(x,y);c.lineTo(x-7,y+21);}c.stroke();
    c.strokeStyle='#b3c7b12b';for(let i=0;i<14;i++){const t=(s.time*1.3+i*.31)%1,x=(i*193.3)%w,y=(i*127.1)%h;c.globalAlpha=rain.intensity*(1-t);c.beginPath();c.ellipse(x,y,3+t*9,1+t*3,0,0,7);c.stroke();}c.globalAlpha=1;
  }
  const g=c.createRadialGradient(w/2,h/2,Math.min(w,h)*.25,w/2,h/2,Math.max(w,h)*.65);g.addColorStop(0,'#1a211600');g.addColorStop(1,'#24271b3b');c.fillStyle=g;c.fillRect(0,0,w,h);
}
