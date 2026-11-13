// 夜影由关节、金属片和流动物质构成；渲染只读战斗状态，余迹保留在视图内。
const TAU=Math.PI*2;
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const mix=(a,b,t)=>a+(b-a)*t;
function hash(s){let n=2166136261;for(const c of String(s))n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
function oval(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,TAU);c.fill();}
function poly(c,p,color,edge){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=color;c.fill();if(edge){c.strokeStyle=edge;c.lineWidth=.8;c.stroke();}}
function line(c,p,color,width=1){c.strokeStyle=color;c.lineWidth=width;c.lineJoin='round';c.lineCap='round';c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
function ring(c,x,y,rx,ry,color,width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.stroke();}

export function nightBudget(view={}){
 const smooth=view.quality==='smooth';
 return{bats:smooth?20:view.mobile?36:view.quality==='clear'?96:64,details:smooth?8:view.mobile?12:20,
  particles:view.reducedMotion||view.particles===false?0:smooth?4:view.mobile?8:16,trails:view.reducedMotion||view.particles===false?0:view.mobile?12:24};
}

// 固定种子决定个体体形，动态仅更新关节，不逐帧重新生成细节。
export class NightModels{
 constructor(){this.rigs=new Map();this.tracks=new Map();this.realm=null;this.lastTime=-1;}
 clear(){this.rigs.clear();this.tracks.clear();this.realm=null;this.lastTime=-1;}
 rig(e){const key=e.kind+':'+hash(e.id||e.kind)%4;if(this.rigs.has(key))return this.rigs.get(key);
  let seed=hash(key);const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const rig={seed:rand()*TAU,plates:Array.from({length:20},(_,i)=>({x:-34+(i%5)*14+rand()*4,y:-43+Math.floor(i/5)*9,tilt:rand()*6})),
   shards:Array.from({length:12},(_,i)=>({x:(rand()-.5)*25,y:-89+i*5.4,d:rand()*5+4})),
   bats:Array.from({length:96},()=>({a:rand()*TAU,r:.25+rand()*.75,z:rand()*TAU,speed:.6+rand()*.7,size:1.7+rand()*1.1})),
   debris:Array.from({length:10},(_,i)=>({x:-33+i*7,y:-46-Math.sin(i/9*Math.PI)*14,h:14+rand()*22,type:i%4,tilt:(rand()-.5)*.4}))};
  if(this.rigs.size>=20)this.rigs.delete(this.rigs.keys().next().value);this.rigs.set(key,rig);return rig;
 }
 sync(s,view={}){
  const realm=s.expedition?.current||'home',limit=nightBudget(view).trails;
  if(this.realm!==realm||s.time<this.lastTime||!limit)this.tracks.clear();this.realm=realm;this.lastTime=s.time;
  if(!limit)return;
  for(const e of s.enemies||[]){if(!['scorpion','boneboar'].includes(e.kind))continue;
   let track=this.tracks.get(e.id);if(!track){track={kind:e.kind,last:s.time,points:[]};this.tracks.set(e.id,track);}
   const prev=track.points.at(-1);if(!prev||s.time-prev.at>=.12&&Math.hypot(e.x-prev.x,e.y-prev.y)>3){
    // 瞬移不连接成穿越整片地图的油线。
    if(prev&&Math.hypot(e.x-prev.x,e.y-prev.y)>90)track.points=[];
    track.points.push({x:e.x,y:e.y,at:s.time});if(track.points.length>limit)track.points.shift();
   }track.last=s.time;track.points=track.points.filter(p=>s.time-p.at<3);
  }
  for(const[id,t]of this.tracks)if(s.time-t.last>3)this.tracks.delete(id);
  while(this.tracks.size>8)this.tracks.delete(this.tracks.keys().next().value);
 }
 drawGround(c,s,visible=()=>true){for(const track of this.tracks.values())for(let i=0;i<track.points.length;i++){
  const p=track.points[i],age=s.time-p.at;if(age<0||age>3||!visible(p))continue;c.save();c.globalAlpha=(1-age/3)*.32;
  if(track.kind==='scorpion'){oval(c,p.x,p.y,22,7,'#080b16');ring(c,p.x-2,p.y,17,4,'#554064',.7);}
  else if(i%3===0){for(const x of[-14,14]){oval(c,p.x+x,p.y,5,2.6,'#172323');line(c,[[p.x+x-4,p.y-2],[p.x+x+3,p.y-3]],'#ab927a',.7);}}
  c.restore();
 }}
}

export function nightPose(s,e,view={}){
 const t=view.reducedMotion?0:s.time,kind=e.kind,progress=e.warning?clamp(1-e.warning.left/e.warning.total):0,
  rage=kind==='devourer'&&e.hp<=82*.35,ev=e.visualEvent,age=ev?s.time-ev.at:99;
 return{t,progress,rage,age,reduced:!!view.reducedMotion,event:ev,seed:hash(e.id||kind)%997/997*TAU,
  moving:!view.reducedMotion&&['stalk','retreat'].includes(e.state),
  scale:kind==='devourer'?(rage?1.5:1)+Math.min(3,e.firesConsumed||0)*.04:1,
  flip:(e.headingX??s.player.x-e.x)<0?-1:1,
  blinkOut:!view.reducedMotion&&e.warning?.kind==='blink'?clamp((progress-.6)/.4):0,
  blinkIn:!view.reducedMotion&&ev?.kind==='blink'&&age>=0&&age<.38?age/.38:1,
  impact:!view.reducedMotion&&ev?.kind==='impact'&&age>=0&&age<1?1-age:0};
}

export function drawNightModel(c,s,e,view={},emissive=false){
 if(!['scorpion','howler','boneboar','bloodbats','devourer'].includes(e.kind))return false;
 const model=view.nightModels||(view.nightModels=new NightModels()),rig=model.rig(e),p=nightPose(s,e,view),b=nightBudget(view),near=Math.hypot(e.x-s.player.x,e.y-s.player.y),hidden=e.state==='burrow';
 c.save();c.translate(e.x,e.y);c.scale(p.flip*p.scale,p.scale);c.lineCap='round';
 // 脱离夜幕的第二遍只绘制细边和自发光，避免把敌人整体照亮。
 c.globalAlpha=emissive?(near<280?.72:.32):hidden?.34:1;
 if(e.kind==='scorpion')scorpion(c,p,rig,b,emissive);
 else if(e.kind==='howler')beaked(c,p,rig,b,emissive);
 else if(e.kind==='boneboar')boar(c,p,rig,b,emissive);
 else if(e.kind==='bloodbats')bats(c,s,e,p,rig,b,emissive,view);
 else devourer(c,p,rig,b,emissive);
 c.restore();return true;
}

function scorpion(c,p,rig,b,light){
 const t=p.t,step=p.moving?Math.sin(t*11):0,jitter=Math.sin(t*7+rig.seed)*.8;
 if(!light){oval(c,0,0,43,12,'#060a1270');
  // 左右四组反折肢，前后错相：始终是八条腿。
  for(let side=-1;side<=1;side+=2)for(let i=0;i<4;i++){
   const x=-23+i*14,k=Math.sin(t*10+i*Math.PI*.8+side)* (p.moving?6:1),y=-16+side*9;
   const points=[[x,y],[x-9+k,y+side*17-12],[x+7+k,y+side*26-2],[x+13+k,y+side*32]];
   line(c,points,'#070a12',4);line(c,points.slice(0,3),'#353441',1.1);line(c,[points[2],points[3]],'#777080',.8);
  }
  oval(c,-9,-21+jitter,30,16,'#080a12');oval(c,18,-23,19,12,'#0b0d18');
  c.beginPath();c.moveTo(-36,-24);c.bezierCurveTo(-22,-42,-2,-35,13,-32);c.bezierCurveTo(-2,-31,-20,-29,-31,-18);c.fillStyle='#232330';c.fill();
  for(let i=0;i<b.details;i++){const a=i/b.details*TAU,r=29+Math.sin(t*4+i*2)*1.6;oval(c,-7+Math.cos(a)*r,-21+Math.sin(a)*13,2.5,1.5,'#10111d');}
  ring(c,-11,-26,15,5,'#42404d55',.8);
 }
 for(let side=-1;side<=1;side+=2)for(let i=0;i<4;i++){
  if(Math.sin(t*3+i*2.3+side)>.7||p.progress>.6){const k=Math.sin(t*10+i*Math.PI*.8+side)*(p.moving?6:1),x=-23+i*14+13+k,y=-16+side*9+side*32;
   line(c,[[x-2,y-3],[x+1,y],[x+3,y-3]],'#ae7ae6',.9);}
 }
 const open=p.progress>0?Math.sin(p.progress*Math.PI)*2.2:.3;
 oval(c,29,-23,8,open,'#7f243b');line(c,[[21,-24-open],[35,-24-open]],'#d35a653d',.8);
 if(light)line(c,[[-32,-29],[-17,-36],[1,-35],[20,-34]],'#6f6b845c',.65);
}

function beaked(c,p,rig,b,light){
 const t=p.t,bob=Math.sin(t*1.8+rig.seed)*1.2,step=p.moving?Math.sin(t*7)*7:0;
 c.save();c.translate(0,bob);
 // 离场从脚底往上擦除；入场从头部向下加载，光点仍留到最后。
 if(p.blinkOut>0||p.blinkIn<1){const bottom=p.blinkOut>0?-120*p.blinkOut:-120+124*p.blinkIn;c.beginPath();c.rect(-64,-124,128,Math.max(0,bottom+124));c.clip();}
 if(!light){oval(c,0,-1,24,7,'#08152166');
  for(const side of[-1,1]){line(c,[[side*7,-48],[side*10-step*.4,-25],[side*13+step,0]],'#141c29',5);line(c,[[side*7,-48],[side*10-step*.4,-25],[side*13+step,0]],'#4a5967',.9);poly(c,[[side*13+step,0],[side*13+step+9,1],[side*13+step+3,-6]],'#0b111d');}
  poly(c,[[-12,-88],[10,-91],[16,-65],[7,-45],[-9,-49],[-18,-69]],'#111b29','#647785');
  for(const side of[-1,1]){const x=side*21;line(c,[[side*14,-83],[x+side*4,-60],[x+side*7,-40]],'#162130',4);line(c,[[side*14,-83],[x+side*4,-60],[x+side*7,-40]],'#536976',.7);
   for(let i=0;i<5;i++)line(c,[[x+side*7+(i-2)*1.5,-41],[x+side*9+(i-2)*2.6,-18-i%3*4]],'#080d19',1.2);
  }
 }
 for(let i=0;i<Math.min(b.details,rig.shards.length);i++){const v=rig.shards[i],pulse=(Math.sin(t*2+i)+1)*.5;
  if(!light)poly(c,[[v.x-v.d,-v.d+v.y],[v.x+v.d*.7,v.y-3],[v.x+v.d,v.y+4],[v.x-2,v.y+8]],i%2?'#243447':'#1a283a','#61718455');
  line(c,[[v.x-3,v.y-5],[v.x+2,v.y],[v.x-1,v.y+4]],`rgba(96,183,224,${.25+pulse*.5})`,light?.8:1.3);
 }
 if(!light){
  // 喙与头骨相连，长弯喙向地面收尖。
  c.beginPath();c.moveTo(-15,-98);c.bezierCurveTo(-14,-116,5,-123,17,-111);c.bezierCurveTo(34,-110,44,-90,43,-77);c.bezierCurveTo(33,-89,28,-93,17,-94);c.lineTo(4,-92);c.lineTo(-9,-88);c.closePath();c.fillStyle='#090e1a';c.fill();c.strokeStyle='#627282';c.lineWidth=1;c.stroke();
  line(c,[[5,-115],[18,-109],[32,-99]],'#8492a155',1);oval(c,12,-104,5,4,'#020713');oval(c,-4,-104,3.5,4,'#020713');
 }
 oval(c,13,-104,1.2,1.2,'#e9f5f9');oval(c,-3,-104,.9,1,'#cce2ea');
 c.restore();
 for(let i=0;i<3;i++){const u=(t*.32+i/3)%1;c.save();c.globalAlpha*=(1-u)*.5;ring(c,0,-44,18+u*40,8+u*17,'#70b5da',.8);
  if(b.particles)for(let j=0;j<4;j++){const a=j*TAU/4+rig.seed;oval(c,Math.cos(a)*(18+u*40),-44+Math.sin(a)*(8+u*17),.9,.9,'#a6d9ee');}c.restore();}
 if(p.blinkOut>.94)oval(c,1,-118,2,1.3,'#e8f8ff');
}

function boar(c,p,rig,b,light){
 const t=p.t,charge=p.progress,recoil=p.impact,shake=recoil*Math.sin(p.age*65)*3,step=p.moving?Math.sin(t*10)*4:0;
 c.save();c.translate(shake,recoil*5);
 if(!light){oval(c,0,1,50,13,'#0a0c1460');
  for(const x of[-29,28])for(const side of[-1,1]){const xx=x+side*6,yy=side<0?-3:3;line(c,[[xx,-22],[xx+step*side,-9],[xx+step*side+recoil*7,yy]],'#242630',9);
   for(let j=0;j<4;j++)poly(c,[[xx-6+j*3,yy-6],[xx-3+j*3,yy-5],[xx-2+j*3,yy+2],[xx-6+j*3,yy+2]],j%2?'#5e5b59':'#343742','#9a8d7744');}
  oval(c,0,-33,46,27,'#3c1d23');
 }
 for(let i=0;i<b.details;i++){const v=rig.plates[i];if(!light)poly(c,[[v.x-5,v.y-6],[v.x+8,v.y-v.tilt-4],[v.x+11,v.y+4],[v.x+1,v.y+9],[v.x-6,v.y+5]],i%3===0?'#44434a':i%2?'#2d313b':'#22262f','#6b6164');
  line(c,[[v.x-4,v.y+6],[v.x,v.y+1],[v.x+3,v.y+5],[v.x+8,v.y+2]],'#d66b3a'+(light?'a0':'70'),.8);
 }
 if(!light){for(const d of rig.debris){c.save();c.translate(d.x,d.y);c.rotate(d.tilt-charge*1.1+recoil*Math.sin(p.age*22)*.5);
   if(d.type===0){poly(c,[[-3,0],[-2,-d.h],[2,-d.h-3],[3,0]],'#5c5251','#8d6a50');for(let j=5;j<d.h;j+=5)line(c,[[-3,-j],[2,-j-2]],'#b28560',.7);}
   else if(d.type===1){poly(c,[[-5,0],[-6,-d.h+6],[-2,-d.h+1],[0,-d.h+7],[4,-d.h],[5,0]],'#4c3c36','#80644b');}
   else{line(c,[[0,0],[0,-d.h]],'#4d5057',5);line(c,[[-1,0],[-1,-d.h]],'#9f7b59',1);if(d.type===3){poly(c,[[-7,-d.h-7],[9,-d.h-5],[7,-d.h+2],[-8,-d.h+1]],'#45665f','#a38d6c');line(c,[[-4,-d.h-3],[5,-d.h-2]],'#c1b89b',1);}}
   oval(c,0,-1,5,3,'#20222b');c.restore();}
  c.save();c.translate(41,-27+charge*6);c.rotate(charge*.22);poly(c,[[-6,-23],[14,-22],[28,-6],[26,14],[1,12],[-13,1]],'#252833','#7c6b63');poly(c,[[14,-7],[31,-6],[31,8],[15,11]],'#555259','#9f9385');for(let i=0;i<4;i++)line(c,[[17+i*3,-5],[17+i*3,8]],'#262b33',1);line(c,[[15,0],[30,0]],'#252a34',1);
  for(const side of[-1,1]){line(c,[[12,8+side*4],[29,4+side*3],[36,-15+side*3]],'#6d493b',4);line(c,[[30,-2+side*3],[36,-15+side*3]],'#ddd0ae',1.4);}oval(c,12,-14,2,1.5,'#e49c57');c.restore();
 }
 if(recoil&&b.particles)for(let i=0;i<b.particles;i++){const u=p.age,a=i*2.4,r=u*(45+i*3);line(c,[[Math.cos(a)*r,-32-Math.sin(u*Math.PI)*24+Math.sin(a)*r*.4],[Math.cos(a)*r+3,-33-Math.sin(u*Math.PI)*24+Math.sin(a)*r*.4]],'#ffd3a4',1);}
 if(light)line(c,[[-40,-43],[-16,-57],[14,-57],[34,-42]],'#b38d7760',.8);
 c.restore();
}

function bats(c,s,e,p,rig,b,light,view){
 const t=p.t,fire=s.buildings.some(n=>n.type==='campfire'&&n.fuel>0&&Math.hypot(n.x-e.x,n.y-e.y)<330)||s.torchOn&&s.torchFuel>0&&Math.hypot(s.player.x-e.x,s.player.y-e.y)<220,
  burst=!p.reduced&&p.event?.kind==='bats'&&p.age>=0&&p.age<.7?1-p.age/.7:0,
  arrow=e.warning?.kind==='bats'?p.progress:burst,spread=1-arrow*.73,roost=e.state==='burrow';
 c.save();if(burst)c.translate((p.event.x-e.x)*p.flip*Math.sin(p.age/.7*Math.PI),(p.event.y-e.y)*Math.sin(p.age/.7*Math.PI));
 if(!light){oval(c,0,-6,39*spread,12,'#230c2055');oval(c,-2,-43,31*spread,23,'#2e0c192b');}
 const count=light?Math.min(12,b.bats):b.bats;
 for(let i=0;i<count;i++){const q=rig.bats[i],a=q.a+t*q.speed*(fire?2:1),r=q.r*37*spread,
  x=roost?(i%10-4.5)*5:Math.cos(a)*r+arrow*q.r*34,
  y=roost?-38-Math.floor(i/10)*4:-44+Math.sin(a*1.2+q.z)*r*.7+Math.sin(t*2+q.z)*5,
  flap=view.reducedMotion?.55:.2+.8*Math.abs(Math.sin(t*(fire?25:13)+q.z)),w=q.size*(light?.8:1),color=fire?'#d83d4d':'#882b48';
  c.save();c.translate(x,y);c.rotate(roost?Math.PI:Math.sin(a)*.3);
  if(!light){poly(c,[[0,0],[-w*3,-flap*w*2],[-w*2,1],[-w,0],[-w*.5,2]],color+'b8');poly(c,[[0,0],[w*3,-flap*w*2],[w*2,1],[w,0],[w*.5,2]],color+'b8');line(c,[[-w*2.7,-flap*w*1.7],[0,0],[w*2.7,-flap*w*1.7]],'#d55e6870',.45);oval(c,0,0,w*.48,w,'#110f20');poly(c,[[-w*.7,-w],[w*.7,-w],[0,-w*2]],'#211323');}
  else line(c,[[-w*2,-flap*w],[0,0],[w*2,-flap*w]],'#ef667b99',.7);
  if(i%3===0){oval(c,-w*.35,-w*1.4,.55,.7,'#c2a867');oval(c,w*.35,-w*1.4,.55,.7,'#c2a867');}
  c.restore();
 }
 c.restore();
}

function devourer(c,p,rig,b,light){
 const t=p.t,wave=Math.sin(t*2+rig.seed),rage=p.rage,swallow=p.event?.kind==='snuff'&&p.age>=0&&p.age<1.3?1-p.age/1.3:0,
  wrap=!p.reduced&&p.event?.kind==='snuff'&&p.age>=0&&p.age<.65?Math.sin(p.age/.65*Math.PI):0,reach=p.progress;
 if(!light){oval(c,0,0,32,10,'#050a1680');c.beginPath();
  c.moveTo(-18,1);c.bezierCurveTo(-6,-22,-24-wave*7,-30,-22,-49);c.bezierCurveTo(-48-reach*12,-23,-42,-28,-37,-60);
  c.bezierCurveTo(-35,-75,-20,-68,-17,-86);c.bezierCurveTo(-20,-117,18,-121,18+wave*5,-96);
  c.bezierCurveTo(36,-79,22,-75,26,-66);c.bezierCurveTo(57+reach*12,-48,38,-15,31,-32);
  c.bezierCurveTo(19,-60,14,-45,15,-27);c.bezierCurveTo(7,-15,27,0,14,2);c.bezierCurveTo(-2,-4,4,-22,-4,-19);c.bezierCurveTo(-10,-9,-9,3,-18,1);
  c.fillStyle='#090d19';c.fill();c.strokeStyle='#4e3c565e';c.lineWidth=1;c.stroke();
  for(let i=0;i<b.details;i++){const a=i*2.399+rig.seed,y=-20-i*4,x=Math.sin(a+t*.8)*(10+Math.sin(i)*8),r=3+(Math.sin(t*2+i)+1)*2;oval(c,x,y,r,r*1.3,i%2?'#171725':'#20202e');ring(c,x-1,y-1,r*.7,r*.8,'#57475845',.6);}
 }
 // 暗核保留黑心，以周围物质旋涡呈现引力感。
 for(let i=0;i<3;i++){c.save();c.translate(0,-65);c.rotate(-t*.7+i*TAU/3);c.strokeStyle=i?'#78354d99':'#a44b6077';c.lineWidth=1.2;c.beginPath();c.ellipse(0,0,12+i*2,5+i,0,.4,4.4);c.stroke();c.restore();}oval(c,0,-65,7,8,'#080b13');
 if(swallow)for(let i=0;i<5;i++){const y=-26-i*12,x=Math.sin(t*10+i)*7;line(c,[[x-5,y+7],[x+2,y],[x-3,y-8]],`rgba(224,118,61,${swallow*.8})`,1.7);}
 if(wrap&&!light){c.beginPath();c.moveTo(10,-80);c.quadraticCurveTo(90*wrap,-100,70*wrap,-25);c.quadraticCurveTo(55*wrap,-5,20,-50);c.fillStyle='#0c101cdb';c.fill();}
 if(rage&&b.particles){for(let i=0;i<Math.min(5,b.particles);i++){const x=Math.sin(i*5+t*2)*20,y=-94+i*19;line(c,[[x,y],[x+8,y+4],[x-3,y+9],[x+9,y+15]],'#a5d9ee99',.9);}if(!light)ring(c,0,-1,39,12,'#b1dcf729',1);}
 if(light)line(c,[[-22,-76],[-16,-94],[-5-wave*3,-105],[12,-100]],rage?'#9cb9d67a':'#826a8355',.7);
}

// 吞火的牵引线属于预警反馈，火炬和永久照明仍按原规则提供保护。
export function drawNightLinks(c,s,view){if(view.reducedMotion||view.particles===false)return;
 for(const e of s.enemies||[]){const w=e.warning,ev=e.visualEvent,age=ev?s.time-ev.at:99;
  if(w?.kind==='snuff'){
   const progress=clamp(1-w.left/w.total);c.save();c.globalAlpha=.2+progress*.5;
   for(let i=0;i<3;i++){const x=mix(w.x,e.x,progress),y=mix(w.y-32,e.y-60,progress);c.strokeStyle=i?'#8a50604d':'#cf956e99';c.lineWidth=1;c.beginPath();c.moveTo(w.x,w.y-32);c.quadraticCurveTo(x+Math.sin(s.time*3+i)*20,y-25,e.x,e.y-65);c.stroke();}c.restore();
  }
  if(ev?.kind==='blink'&&age>=0&&age<.4){c.save();c.globalAlpha=(1-age/.4)*.6;for(let i=0;i<7;i++){const y=ev.oy-112+i*15;line(c,[[ev.ox-9,y],[ev.ox+10,y]],'#86c5dd',1);}oval(c,ev.ox,ev.oy-118,2,1,'#e8f6ff');c.restore();}
 }
}

export function drawNightPortrait(canvas,kind,time=0,view={}){const c=canvas.getContext('2d');if(!c)return;
 c.clearRect(0,0,canvas.width,canvas.height);c.save();c.scale(canvas.width/240,canvas.height/180);c.fillStyle='#132329';c.fillRect(0,0,240,180);
 const e={id:'portrait-'+kind,kind,x:120,y:155,hp:82,state:'stalk',headingX:1},s={time,player:{x:260,y:155},buildings:[],enemies:[e]};drawNightModel(c,s,e,view);drawNightModel(c,s,e,view,true);c.restore();
}
