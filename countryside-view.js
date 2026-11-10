import {playerSpriteName} from './character-view.js';
import {ANIMALS,PEN_TYPES,ROOMS} from './countryside-data.js';
import {VILLAGES} from './settlements.js';
import {nearbyRoom} from './countryside.js';
export function drawCountrysideObject(view,c,s,n){
 if(n.type==='animal'){
  if(!n.available)return true;const a=ANIMALS[n.species],moving=['hop','scurry','return','flee'].includes(n.animalState),bob=view.reducedMotion?0:Math.sin(s.time*(moving?12:3)+n.homeX)*(a.behavior==='flutter'?4:moving?2:.4);
  const size=n.species==='deer'?75:n.species==='firefly'?34:n.species==='butterfly'?35:45;
  c.save();if(n.x<n.homeX){c.translate(n.x,0);c.scale(-1,1);view.sprite(c,a.sprite,0,n.y+bob,size);}else view.sprite(c,a.sprite,n.x,n.y+bob,size);c.restore();
  if(view.hover?.id===n.id||s.target?.id===n.id||n.followPen){c.fillStyle='#f0dfad';c.strokeStyle='#304637';c.lineWidth=3;c.font='12px sans-serif';c.textAlign='center';const text=n.followPen?(n.animalState==='wait'?'有危险 · 先等待':'正在回圈舍'):a.name;c.strokeText(text,n.x,n.y-size-8);c.fillText(text,n.x,n.y-size-8);}return true;
 }
 if(!PEN_TYPES[n.type])return false;
 view.sprite(c,n.type,n.x,n.y,125);const p=n.pen;if(!p)return true;
 for(let i=0;i<p.animals;i++){const x=n.x-20+i%2*30,y=n.y-12+Math.floor(i/2)*9;view.sprite(c,ANIMALS[PEN_TYPES[n.type].species].sprite,x,y+(view.reducedMotion?0:Math.sin(s.time*2+i)*1.3),28);}
 if(p.roof){c.strokeStyle='#344b37';c.lineWidth=3;c.fillStyle='#6f8a60';c.beginPath();c.moveTo(n.x-65,n.y-102);c.lineTo(n.x,n.y-127);c.lineTo(n.x+65,n.y-103);c.lineTo(n.x+53,n.y-88);c.lineTo(n.x-55,n.y-87);c.closePath();c.fill();c.stroke();c.beginPath();c.moveTo(n.x-53,n.y-88);c.lineTo(n.x-53,n.y-25);c.moveTo(n.x+53,n.y-88);c.lineTo(n.x+53,n.y-25);c.stroke();}
 if(p.auto)view.sprite(c,'gatherbot',n.x+57,n.y-5,25);
 if(p.animals){c.fillStyle='#283e30';c.fillRect(n.x-28,n.y+8,56,5);c.fillStyle=p.food<=0?'#d5a17c':'#d6cf8d';c.fillRect(n.x-28,n.y+8,56*p.food/24,5);if(p.food<=0){c.font='11px sans-serif';c.fillStyle='#f1d2a0';c.textAlign='center';c.fillText('等待饲料',n.x,n.y+27);}}
 return true;
}
function plate(c,text,x,y){c.font='bold 15px sans-serif';c.textAlign='center';c.lineWidth=4;c.strokeStyle='#283d30';c.strokeText(text,x,y);c.fillStyle='#f1dfaf';c.fillText(text,x,y);}
export function drawVillageInterior(view,c,s,dt){
 const v=s.rural.visit,w=view.w,h=view.h,portrait=w<600,z=portrait?.92:Math.min(1.1,Math.max(.82,h/570));view.zoom=z;
 const tx=Math.max(Math.min(w/2/z,480),Math.min(960-Math.min(w/2/z,480),v.x));let ty=Math.max(Math.min(h/2/z,345),Math.min(690-Math.min(h/2/z,345),v.y));
 // 矮横屏在屋内为导航留出画面空间，房名和居民不能藏在固定栏下面。
 if(!portrait&&h<=500&&v.y<380)ty=Math.min(ty,90+(h/2-120)/z);
 view.camera.x+=(tx-view.camera.x)*Math.min(1,dt*10);view.camera.y+=(ty-view.camera.y)*Math.min(1,dt*10);
 c.fillStyle='#20382d';c.fillRect(0,0,w,h);c.save();c.scale(z,z);c.translate(w/2/z-view.camera.x,h/2/z-view.camera.y);
 c.fillStyle='#849575';c.fillRect(15,70,930,600);c.fillStyle='#a3a17c';c.fillRect(25,380,910,275);
 for(let x=45;x<940;x+=54)for(let y=399;y<650;y+=45){c.fillStyle=((x+y)%5?'#b9ad84':'#979c77');c.fillRect(x,y,46,35);}
 const actors=[];
 for(const[id,r]of Object.entries(ROOMS)){
  c.fillStyle=id==='workshop'?'#9a8e6f':id==='seedhouse'?'#b1ac7b':'#b59f79';c.fillRect(r.left,90,250,245);
  c.strokeStyle='#394e39';c.lineWidth=12;c.beginPath();c.moveTo(r.left,335);c.lineTo(r.left,90);c.lineTo(r.left+250,90);c.lineTo(r.left+250,335);c.lineTo(r.x+49,335);c.moveTo(r.x-49,335);c.lineTo(r.left,335);c.stroke();
  c.fillStyle='#d7bd87';c.fillRect(r.x-48,321,96,78);for(let y=111;y<321;y+=24){c.strokeStyle='#675f422a';c.lineWidth=1;c.beginPath();c.moveTo(r.left+6,y);c.lineTo(r.left+245,y);c.stroke();}
  plate(c,r.name,r.x,113);
  const time=view.reducedMotion?0:v.clock;actors.push({kind:'resident',sprite:r.sprite,x:r.x+Math.sin(time*.4+Object.keys(ROOMS).indexOf(id))*17,y:r.y+Math.cos(time*.4)*7,name:id==='hearth'?VILLAGES[v.village].npc:r.npc});
  if(id==='hearth'){view.sprite(c,'campfire',r.x-65,205,85);view.sprite(c,'cookpot',r.x+74,210,60);c.fillStyle='#715b40';c.fillRect(r.x-66,273,117,16);}
  if(id==='workshop'){view.sprite(c,'table',r.x-65,190,80);view.sprite(c,'gatherbot',r.x+73,190,49);view.sprite(c,'chest',r.x+76,300,47);}
  if(id==='seedhouse'){view.sprite(c,'nursery',r.x+65,205,72);view.sprite(c,'archive',r.x-72,215,70);view.sprite(c,'flower',r.x+78,295,36);}
 }
 if(s.campLiving?.joint===2&&['bay','ridge'].includes(v.village)){view.sprite(c,'chest',575,300,50);plate(c,'两地共建',575,243);}
 const pop=s.settlements.villages[v.village].population;
 for(let i=3;i<pop;i++){const t=view.reducedMotion?0:v.clock;actors.push({kind:'resident',sprite:i%2?'companion-ranger':'companion-botanist',x:150+(i-3)*100+Math.sin(t*.3+i)*35,y:440+Math.cos(t*.2+i)*30,name:'聚落居民'});}
 actors.push({kind:'player',x:v.x,y:v.y,sprite:playerSpriteName(v),name:'你'});
 actors.sort((a,b)=>a.y-b.y);for(const a of actors){view.sprite(c,a.sprite,a.x,a.y+(view.reducedMotion?0:Math.sin(v.clock*(a.kind==='player'&&v.walk?9:2))*1.2),a.kind==='player'?66:60);if(a.kind==='player'||Math.hypot(a.x-v.x,a.y-v.y)<125)plate(c,a.name,a.x,a.y-84);}
 const room=nearbyRoom(s);if(room){c.strokeStyle='#eed997';c.lineWidth=2;c.beginPath();c.ellipse(ROOMS[room].x,ROOMS[room].y+8,40,16,0,0,7);c.stroke();}
 c.fillStyle='#516b4b';for(const[x,y]of[[55,525],[910,520],[280,565],[680,565]]){view.sprite(c,'bush',x,y,55);}
 c.fillStyle='#3d563d';c.fillRect(407,625,146,30);plate(c,'返回原岛',480,647);c.restore();
}
export function drawNightContrast(view,c,s,left,top,z){
 if(s.time%300<190||s.rural?.visit)return;
 const fires=s.buildings.filter(b=>b.type==='campfire'&&b.fuel>0&&Math.hypot(b.x-s.player.x,b.y-s.player.y)<300);
 c.save();c.scale(z,z);c.translate(-left,-top);
 for(const b of fires){c.strokeStyle='#eac98466';c.lineWidth=1.5;c.setLineDash([5,9]);c.beginPath();c.ellipse(b.x,b.y,190,190,0,0,7);c.stroke();c.setLineDash([]);}
 c.restore();
 if(s.darkTime>0&&s.level<8){const x=(s.player.x-left)*z,y=(s.player.y-top)*z+20;c.font='12px sans-serif';c.textAlign='center';c.strokeStyle='#253528';c.lineWidth=4;const text=s.darkTime<7?'缺光 · 点火炬或回到光圈':'正在受伤 · 尽快回到光圈';c.strokeText(text,x,y);c.fillStyle=s.darkTime<7?'#ecd395':'#e4ad98';c.fillText(text,x,y);}
}
