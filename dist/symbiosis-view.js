import {companionReaction} from './camp-living.js';
import {inRift,riftGeometry,highTide,COMPANIONS,CO_RECIPES,hasModule} from './symbiosis.js';
export function drawRiftGround(c,s){
 if(!inRift(s)||!s.symbiosis.run)return;const r=s.symbiosis.run,g=riftGeometry(r),tide=r.realm==='tide';c.save();c.fillStyle=tide?'#244c55':'#252d3a';c.fillRect(0,0,3600,2800);
 const road=(list,width,color)=>{c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.beginPath();list.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();};
 road(g.shortcut,180,tide?(highTide(s)?'#47757c':'#a6ad83'):'#556b69');road(g.shortcut,tide&&highTide(s)?76:150,tide?'#b2ab85':'#859b88');
 road(g.points,g.road*2+14,'#40554b');road(g.points,g.road*2,tide?'#a5b18d':'#81938c');
 g.zones.forEach((p,i)=>{c.fillStyle=tide?'#c0b78e':'#677d73';c.strokeStyle=tide?'#e0cc9d':'#a1b4a5';c.lineWidth=9;c.beginPath();c.arc(p.x,p.y,g.radius,0,7);c.fill();c.stroke();c.fillStyle=tide?'#8aab8a':'#829886';c.beginPath();c.ellipse(p.x+40,p.y+45,210,180,-.4,0,7);c.fill();
  c.fillStyle='#dce4c8';c.font='bold 22px sans-serif';c.textAlign='center';c.fillText((i+1)+' · '+(tide?'潮标台':'通风区'),p.x,p.y-235);
  if(!tide&&!r.anchors[i]){c.fillStyle='#bda5dc22';c.beginPath();c.arc(p.x,p.y,270,0,7);c.fill();}
 });
 // 路面标记和同一套可行走几何一致，避免只换地图贴图。
 for(let i=1;i<g.points.length;i++){const a=g.points[i-1],b=g.points[i],len=Math.hypot(a.x-b.x,a.y-b.y);for(let k=30;k<len;k+=75){const t=k/len,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;c.strokeStyle=tide?'#5b71674a':'#bcc8a95a';c.lineWidth=5;c.beginPath();c.moveTo(x-20,y-15);c.lineTo(x+20,y+15);c.stroke();}}
 c.font='20px sans-serif';c.fillStyle='#dce9c4';c.fillText(tide?'↑ 永久高架路 · 涨潮仍可通行':'↑ 发光通风路 · 沿编号寻找观测点',1890,850);c.restore();
}
export function companionObjects(s){return Object.entries(s.symbiosis?.companions||{}).filter(([id])=>s.expedition.current==='home'||s.symbiosis.following===id).map(([id,c])=>({...c,id:'companion-'+id,kind:id,type:'companion'}));}
export function drawCoObject(view,c,s,n){
 if(n.type==='companion'){const d=COMPANIONS[n.kind],follow=s.symbiosis.following===n.kind,working=n.job&&s.time%300<230;view.sprite(c,'companion-'+n.kind,n.x,n.y+(view.reducedMotion?0:Math.sin(s.time*(working?5:2))*(working?1.5:.5)),90);c.font='11px sans-serif';c.textAlign='center';c.strokeStyle='#223d34';c.lineWidth=3;const text=d.name.split(' · ')[0]+' · '+(follow?'同行':working?d.job:'歇息');c.strokeText(text,n.x,n.y-110);c.fillStyle=d.color;c.fillText(text,n.x,n.y-110);if((follow||!s.symbiosis.following&&Object.entries(s.symbiosis.companions).sort(([,a],[,b])=>Math.hypot(a.x-s.player.x,a.y-s.player.y)-Math.hypot(b.x-s.player.x,b.y-s.player.y))[0]?.[0]===n.kind&&Math.hypot(n.x-s.player.x,n.y-s.player.y)<160)&&s.time%36<5){const full=companionReaction(s,n.kind),line=view.mobile&&full.length>17?full.slice(0,17)+'…':full;c.font='12px sans-serif';c.strokeText(line,n.x,n.y-132);c.fillText(line,n.x,n.y-132);}return true;}
 if(['riftanchor','riftevent'].includes(n.type)){const r=s.symbiosis.run,done=n.type==='riftanchor'?r.anchors[n.anchor]:!!r.choices[n.eventId];view.sprite(c,n.type,n.x,n.y,105,done?.5:1);c.strokeStyle=done?'#bcd6b2':'#efce84';c.lineWidth=2;c.beginPath();c.ellipse(n.x,n.y,35,16,0,0,7);c.stroke();c.fillStyle='#eee2b9';c.textAlign='center';c.font='12px sans-serif';c.fillText((done?'✓ ':'◇ ')+(n.type==='riftanchor'?'观测点 '+(n.anchor+1):'远征见闻'),n.x,n.y-125);return true;}
 return false;
}
export function drawCoLife(view,c,s){
 const e=s.symbiosis;if(!e)return;
 if(s.expedition.current==='home'&&e.projects.length){const camp=s.buildings.find(b=>b.type==='campfire');if(camp)for(let i=0;i<24;i++){const a=i*2.399,x=camp.x+Math.cos(a)*(120+i*4),y=camp.y+Math.sin(a)*(90+i*3);c.fillStyle=i%2?'#dbca91':'#a8d6bc';c.beginPath();c.ellipse(x,y,3,6,a,0,7);c.fill();}}
 for(const b of s.buildings){if(!CO_RECIPES.some(r=>r.building===b.type))continue;if(b.coTask){c.fillStyle='#e9d69d';c.font='12px sans-serif';c.textAlign='center';c.fillText('协作中 · '+Math.ceil(b.coTask.remaining)+'s',b.x,b.y-140);}if(!view.reducedMotion&&['shellmobile','funguslamp','starbench'].includes(b.type)){c.strokeStyle='#e6cf9b88';c.lineWidth=2;c.beginPath();c.ellipse(b.x,b.y-60,32+Math.sin(s.time*2)*3,10,0,0,7);c.stroke();}}
 for(const n of s.nodes){if(!n.available||!['rock','ore','crystal','mirrorsand'].includes(n.type)||n.hp>=3)continue;c.strokeStyle='#354739';c.lineWidth=2;c.beginPath();c.moveTo(n.x-17,n.y-50);c.lineTo(n.x,n.y-35);c.lineTo(n.x-9,n.y-20);if(n.hp===1){c.moveTo(n.x,n.y-35);c.lineTo(n.x+18,n.y-42);}c.stroke();}
 const shot=s.expedition.shot;if(shot&&shot.until>s.time&&!view.reducedMotion){const t=1-(shot.until-s.time)/.25,side=shot.tx<s.player.x?-1:1;c.save();c.translate(s.player.x+side*17,s.player.y-34);c.scale(side,1);c.rotate(-.8+t*1.8);c.strokeStyle='#dec898';c.lineWidth=5;c.beginPath();c.moveTo(0,0);c.lineTo(33,-30);c.stroke();c.fillStyle=shot.kind==='energy'?'#a6e7d4':'#b9c5ae';c.beginPath();c.moveTo(24,-31);c.lineTo(41,-49);c.lineTo(46,-28);c.closePath();c.fill();c.restore();}
 if(s.motion&&s.time-s.motion.at<.65){const t=(s.time-s.motion.at)/.65;c.save();c.strokeStyle='#dfcf9b';c.globalAlpha=1-t;c.lineWidth=2;c.beginPath();c.ellipse(s.motion.x,s.motion.y,10+t*25,5+t*10,0,0,7);c.stroke();c.restore();}
 if(inRift(s)){const r=e.run;c.save();c.fillStyle='#d9d8b2';c.font='12px sans-serif';c.textAlign='center';c.fillText('归路始终可用 · 观测 '+r.anchors.filter(Boolean).length+'/3',s.player.x,s.player.y+40);c.restore();}
}
export function drawPhotoCaption(c,s,w,h){c.save();c.fillStyle='#172d29cc';c.fillRect(0,h-58,w,58);c.fillStyle='#f1dfa8';c.font='bold 18px sans-serif';c.fillText('九级 · 荒野留影',20,h-30);c.font='12px sans-serif';c.fillStyle='#c3d9cb';c.fillText(s.level+' 级 · 种子 '+(s.symbiosis.run?.seed??s.seed),20,h-10);c.restore();}

// 地图编号指向真实地点，扫描模块可提前标出三段见闻。
export function drawRiftMapMarkers(c,s){
 if(!inRift(s))return;const run=s.symbiosis.run;c.save();c.textAlign='center';c.font='bold 64px sans-serif';c.strokeStyle='#193c35';c.lineWidth=12;
 for(const n of s.nodes){let text='';if(n.type==='riftanchor')text=(run.anchors[n.anchor]?'✓ ':'')+(n.anchor+1);else if(n.type==='riftevent'&&hasModule(s,'scanner')&&!run.choices[n.eventId])text='✧'+(run.events.indexOf(n.eventId)+1);if(!text)continue;c.strokeText(text,n.x,n.y-32);c.fillStyle='#efdbaf';c.fillText(text,n.x,n.y-32);}c.restore();
}
