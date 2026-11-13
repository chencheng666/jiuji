import {TreeArt} from './tree-art.js';
// 荒野的程序化模型。模型只读存档，树冠、光影与动作单独渲染。
import {season,phase} from './survival.js';
import {solveJoint,travelerPose} from './character-view.js';
const TAU=Math.PI*2;
export function visualHash(value){let h=2166136261;for(const ch of String(value))h=Math.imul(h^ch.charCodeAt(0),16777619);return h>>>0;}
export function visualBudget(mobile,quality='auto',reduced=false){return{density:quality==='smooth'?1:mobile?1.25:1.5,ambient:reduced?0:quality==='smooth'?8:mobile?16:32,cacheBytes:(mobile?8:16)*1024*1024};}
function shape(c,points,fill,stroke='#283e39',line=2){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.stroke();}}
function oval(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fill();}
function limb(c,x,y,tx,ty,width,color){c.lineCap='round';c.lineWidth=width+3;c.strokeStyle='#283c37';c.beginPath();c.moveTo(x,y);c.lineTo(tx,ty);c.stroke();c.lineWidth=width;c.strokeStyle=color;c.stroke();}
function jointLimb(c,start,end,length,width,color,bend=1){const knee=solveJoint(start,end,length,length,bend);limb(c,start.x,start.y,knee.x,knee.y,width,color);limb(c,knee.x,knee.y,end.x,end.y,width,color);oval(c,knee.x-1,knee.y-1,width*.3,width*.3,'#c5b68855');}
export class SceneArt{
 constructor({mobile=false,create=()=>document.createElement('canvas')}={}){this.mobile=mobile;this.create=create;this.entries=new Map();this.blocked=new Set();this.flatBytes=0;this.trees=new TreeArt({create});}
 get bytes(){return this.flatBytes+this.trees.bytes;}
 clear(){this.trees.clear();for(const v of this.entries.values()){v.canvas.width=0;v.canvas.height=0;}this.entries.clear();this.blocked.clear();this.flatBytes=0;}
 model(type,variant,seasonIndex,budget){while(this.flatBytes>budget.cacheBytes*.25&&this.entries.size){const[k,v]=this.entries.entries().next().value;this.entries.delete(k);this.flatBytes-=v.bytes;v.canvas.width=v.canvas.height=0;}if(type==='tree')return this.trees.model('fir',variant%2,seasonIndex,{density:budget.density,cacheBytes:budget.cacheBytes*.75})?.crown||null;variant=0;if(type!=='bush')seasonIndex=0;const key=type+':'+variant+':'+seasonIndex+':'+budget.density;if(this.entries.has(key)){const v=this.entries.get(key);this.entries.delete(key);this.entries.set(key,v);return v.canvas;}
  if(this.blocked.has(key))return null;let canvas;try{canvas=this.create();const d=budget.density;canvas.width=192*d;canvas.height=240*d;const c=canvas.getContext('2d');if(!c)throw Error('模型缓冲不可用');c.scale(d,d);c.translate(16,18);
  if(type==='bush')bush(c,variant,seasonIndex);else if(['chest','table','campfire','robotdock'].includes(type))facility(c,type);else mineral(c,type,variant);
  const bytes=canvas.width*canvas.height*4;while(this.flatBytes+bytes>budget.cacheBytes*.25&&this.entries.size){const[k,v]=this.entries.entries().next().value;this.entries.delete(k);this.flatBytes-=v.bytes;v.canvas.width=0;v.canvas.height=0;}
  this.entries.set(key,{canvas,bytes});this.flatBytes+=bytes;return canvas;}catch{if(canvas){canvas.width=0;canvas.height=0;}this.blocked.add(key);return null;}
 }
 draw(c,n,s,view,w,alpha=1){if(n.type==='tree')return this.trees.draw(c,n,s,view,season(s).index,alpha);if(!['rock','ore','crystal','bush','chest','table','campfire','robotdock'].includes(n.type))return false;const variant=visualHash(n.id||n.x+':'+n.y)%3,budget=visualBudget(view.mobile,view.quality,view.reducedMotion),index=season(s).index;
  const im=this.model(n.type,variant,index,budget);if(!im)return false;const plant=n.type==='bush',sway=plant&&!view.reducedMotion?Math.sin(s.time*1.2+n.x*.019)*.009:0;
  c.save();c.globalAlpha=alpha;oval(c,n.x+8,n.y+3,w*.32,w*.10,'#163b382a');
  c.translate(n.x,n.y);c.transform(1,0,sway,1,0,0);const hit=view.reducedMotion?0:n.hitAt&&s.time-n.hitAt<.2?Math.sin((s.time-n.hitAt)*65)*3:s.action?.id===n.id?Math.sin(s.action.elapsed*25)*2:0;
  c.drawImage(im,-w*.6+hit,-w*1.2375,w*1.2,w*1.5);c.restore();return true;
 }
}
function bush(c,v,si){const p=si===2?['#4d6846','#9a9b61','#c6b676']:si===3?['#42655a','#71958a','#b4c9ad']:['#315c49','#5f8d63','#9cb47b'];for(let i=0;i<7;i++){const x=38+i*14,y=143-Math.sin(i/6*Math.PI)*21;oval(c,x,y,23,25,p[0]);oval(c,x-3,y-8,19,15,p[1]);oval(c,x-9,y-12,8,5,p[2]);}for(let i=0;i<6;i++){const x=38+i*16,y=140+(i%3)*8;oval(c,x,y,4,5,si===3?'#d3c9ad':'#d38b65');oval(c,x-1,y-2,1.4,1.4,'#ffe1a0');}limb(c,80,167,80,178,5,'#826b46');}
function mineral(c,type,v){const gem=type==='crystal',ore=type==='ore';if(gem){for(const[x,y,h,w]of[[56,172,65,25],[85,181,117,32],[111,175,81,24]]){shape(c,[[x-w/2,y-h*.77],[x,y-h],[x+w/2,y-h*.72],[x+w/2,y-5],[x,y+4],[x-w/2,y-6]],'#347f83');shape(c,[[x,y-h],[x+w/2,y-h*.72],[x+w/2,y-5],[x,y+4]],'#79c6ba',null);shape(c,[[x,y-h],[x,y+4],[x-w/2,y-6],[x-w/2,y-h*.77]],'#b9e7cd',null);limb(c,x-3,y-h+15,x-3,y-17,1,'#e1f4d9');}return;}
 shape(c,[[26,153],[39,112],[70,89],[106,99],[132,126],[140,165],[111,182],[57,181]],'#4f6861');shape(c,[[39,112],[70,89],[91,123],[73,151],[26,153]],'#9eafa0',null);shape(c,[[70,89],[106,99],[132,126],[112,151],[73,151],[91,123]],'#bac2a7',null);shape(c,[[73,151],[112,151],[140,165],[111,182]],'#6f8678',null);shape(c,[[39,112],[68,96],[52,119],[36,137]],'#d9d6b4',null);if(ore)for(let i=0;i<5;i++){const x=48+i*15,y=133+(i%2)*15;shape(c,[[x,y-7],[x+9,y-11],[x+14,y],[x+5,y+5]],i%2?'#b87e4f':'#dba86a','#735c40',1.5);}
}
// 脚、手臂、背包、躯干与头独立。动作来自真实行走/采集状态，不驱动规则。
export function drawTraveler(c,s,view){const p=s.player,t=s.time,walk=p.walk||0,reduced=view.reducedMotion,pose=travelerPose(s,reduced),step=reduced?0:walk?Math.sin(walk*2)*7:0,back=p.direction==='back'||(!p.direction&&p.face===-1),side=['left','right'].includes(p.direction),mirror=p.direction==='left'?-1:1,bend=pose.bend;
 c.save();c.translate(p.x,p.y);oval(c,2,3,21,7,'#193c373d');const roll=s.expedition?.rollCombo,fold=!reduced&&roll?.until>s.time?Math.sin((1-(roll.until-s.time)/.55)*Math.PI)*.16:0;c.scale(.9,.9-fold);c.scale(mirror,1);
 jointLimb(c,{x:side?1:-8,y:-22},pose.leftFoot,13,7,'#3e5046',-1);jointLimb(c,{x:side?7:10,y:-22},pose.rightFoot,13,7,'#506353',-1);oval(c,pose.leftFoot.x+1,pose.leftFoot.y+1,8,3.5,'#263b36');oval(c,pose.rightFoot.x+1,pose.rightFoot.y+1,8,3.5,'#263b36');
 c.translate(0,pose.bob);c.rotate(bend);
 if(!back){shape(c,[[-19,-46],[-27,-40],[-26,-15],[-12,-12],[-8,-43]],'#816746');limb(c,-24,-31,-13,-29,2,'#c9aa70');}
 jointLimb(c,{x:-12,y:-40},pose.leftHand,12,6,'#bda26e',1);jointLimb(c,{x:13,y:-40},pose.rightHand,14,6,'#c9ad7a',-1);oval(c,pose.rightHand.x,pose.rightHand.y+1,4,4,'#e4c9a0');
 shape(c,[[-11,-45],[12,-45],[17,-17],[0,-10],[-17,-17]],'#b68d59');shape(c,[[-10,-42],[-3,-41],[-5,-16],[-14,-19]],'#d0b17c',null);shape(c,[[5,-38],[12,-40],[15,-18],[3,-13]],'#8f754e',null);limb(c,-14,-22,14,-22,2,'#5d6550');shape(c,[[4,-25],[11,-25],[11,-20],[4,-20]],'#d8be7d',null);
 shape(c,[[-18,-49],[-16,-65],[-6,-76],[7,-78],[19,-63],[20,-48],[9,-38],[-9,-39]],'#79896a');shape(c,[[-16,-59],[-7,-72],[5,-75],[0,-60],[-9,-49],[-17,-48]],'#adac7a',null);
 if(!back){oval(c,side?7:0,-53,12,12,'#243f37');shape(c,side?[[3,-62],[12,-60],[15,-53],[19,-50],[15,-46],[13,-43],[5,-43],[0,-50]]:[[-9,-56],[-3,-62],[9,-58],[11,-51],[5,-44],[-4,-44],[-9,-50]],'#e1c59a',null);oval(c,side?11:-5,-54,1.1,1.9,'#273c34');if(!side)oval(c,5,-54,1.1,1.9,'#273c34');}
 else{shape(c,[[-11,-45],[10,-45],[16,-18],[0,-13],[-17,-18]],'#85704b');limb(c,-11,-32,11,-32,2,'#d3b782');}
 const tail=reduced?0:Math.sin(t*4)*3;shape(c,[[-10,-40],[3,-37],[14,-41],[8,-31],[2,-31],[-5,-26],[-8,-31],[-21-tail,-29],[-14,-35]],'#bb624b','#754e39',1.2);c.restore();
}
export function drawLivingGround(c,s,view,left,top,z){const b=visualBudget(view.mobile,view.quality,view.reducedMotion);if(!b.ambient||view.particles===false)return;const w=view.w/z,h=view.h/z,t=s.time,night=phase(s)==='night';
 c.save();for(let i=0;i<b.ambient;i++){const seed=visualHash(s.expedition.current+':'+i),x=left+(seed%997)/997*w+Math.sin(t*.35+i)*12,y=top+((seed>>>10)%991)/991*h+Math.cos(t*.27+i)*9;if(night){c.globalAlpha=.15+.4*Math.max(0,Math.sin(t*1.4+i));oval(c,x,y,1.6,1.6,'#c9e4a4');}else{c.globalAlpha=.16;oval(c,x,y,1.2,1.2,'#fff1bc');}}
 c.restore();
 // 水纹跟随世界岸线，不铺满屏幕、不改变陆地碰撞范围。
 c.save();c.strokeStyle=night?'#78b6b22b':'#b7d3bd55';c.lineWidth=1.2;for(let i=0;i<96;i++){const a=i/96*TAU,e=1+.055*Math.sin(a*5)+.025*Math.sin(a*9),pulse=Math.sin(t*1.1+i)*6,x=1800+Math.cos(a)*(1510*e+45+pulse),y=1390+Math.sin(a)*(1100*e+36+pulse);if(x<left-40||x>left+w+40||y<top-20||y>top+h+20)continue;c.beginPath();c.ellipse(x,y,16,3,-Math.cos(a)*.1,0,Math.PI);c.stroke();}c.restore();
}
export function drawActionMotes(c,s,view){if(view.reducedMotion||view.particles===false)return;const a=s.action,n=a&&s.nodes.find(n=>n.id===a.id);if(n&&['tree','rock','ore','crystal'].includes(n.type)){const period=.38,t=a.elapsed%period/period;for(let i=0;i<5;i++){const angle=i*1.9+visualHash(n.id)%7,r=t*(18+i*3),x=n.x+Math.cos(angle)*r,y=n.y-20-Math.sin(t*Math.PI)*22+t*12;c.globalAlpha=1-t;c.fillStyle=n.type==='tree'?'#d3b17a':n.type==='crystal'?'#c7efe0':'#dee0b8';c.fillRect(x,y,3,2);}c.globalAlpha=1;}
 const shot=s.expedition.shot;if(shot&&s.time<shot.until){const t=(s.time-shot.at)/Math.max(.01,shot.duration);if(t>.15&&t<.8){c.save();c.translate(shot.tx,shot.ty-20);c.globalAlpha=Math.sin(t*Math.PI)*.8;c.strokeStyle=shot.kind==='hammer'?'#efc78e':'#cfefdb';c.lineWidth=2;for(let i=0;i<7;i++){const a=i/7*TAU,r=6+t*22;c.beginPath();c.moveTo(Math.cos(a)*r,Math.sin(a)*r*.65);c.lineTo(Math.cos(a)*(r+7),Math.sin(a)*(r+7)*.65);c.stroke();}c.restore();}}
}
// 地表水与设备的第二层：复用世界坐标，不生成新的互动对象。
export function drawPond(c,s,n,reduced=false){c.save();c.translate(n.x,n.y-32);oval(c,0,10,72,28,'#243e3740');oval(c,0,0,74,29,'#b9b891');oval(c,0,-1,66,23,'#377a78');oval(c,-4,-5,55,16,'#65a39a');oval(c,-12,-8,38,9,'#91bcaa');c.strokeStyle='#d2dfb6';c.lineWidth=1.5;for(let i=0;i<3;i++){const t=reduced?i/3:(s.time*.18+i/3)%1;c.globalAlpha=(1-t)*.55;c.beginPath();c.ellipse(-12+i*12,-1+i*2,12+t*32,4+t*8,0,0,TAU);c.stroke();}c.globalAlpha=1;for(const[x,y]of[[-63,6],[48,15],[63,-8]]){oval(c,x,y,9,4,'#829276');limb(c,x,y,x-3,y-14,1,'#6a8958');}c.restore();}
export function drawDeviceLife(c,s,n,view){if(view.reducedMotion||view.particles===false)return;const t=s.time;
 if(n.type==='campfire'&&n.fuel>0){c.save();c.translate(n.x,n.y-27);c.globalCompositeOperation='screen';for(let i=0;i<3;i++){const u=(t*.9+i*.33)%1;oval(c,Math.sin(t*4+i)*3,-u*20,9*(1-u)+2,13*(1-u)+2,i?'#ffd682aa':'#e9a15399');}c.restore();}
 if(['resonator','beacon','gate','ascension','crystal'].includes(n.type)){c.save();const y=n.y-(n.type==='crystal'?35:45),r=n.type==='crystal'?23:40;c.strokeStyle='#a5e7d083';c.lineWidth=1.1;c.beginPath();c.ellipse(n.x,y,r, r*.24,0,t*.7,t*.7+4.8);c.stroke();for(let i=0;i<3;i++){const a=t*.8+i*TAU/3;oval(c,n.x+Math.cos(a)*r,y+Math.sin(a)*r*.24,1.8,1.8,'#d2f3ce');}c.restore();}
 if(n.type==='gatherbot'){const moving=['outbound','returning','delivering'].includes(n.state);if(!moving&&n.state!=='gathering')return;c.save();c.strokeStyle='#d6c38c';c.lineWidth=2;const a=t*9;for(const x of [-11,11]){c.beginPath();c.moveTo(n.x+x-3*Math.cos(a),n.y-3-3*Math.sin(a));c.lineTo(n.x+x+3*Math.cos(a),n.y-3+3*Math.sin(a));c.stroke();}c.restore();}
}

function box(c,x,y,w,h,d,colors){shape(c,[[x,y],[x+w,y-d],[x+w,y-d-h],[x,y-h]],colors[1]);shape(c,[[x-w,y-d],[x,y],[x,y-h],[x-w,y-d-h]],colors[0]);shape(c,[[x-w,y-d-h],[x,y-h],[x+w,y-d-h],[x,y-d*2-h]],colors[2]);}
function facility(c,type){
 if(type==='campfire'){for(let i=0;i<9;i++){const a=i/9*TAU;oval(c,80+Math.cos(a)*40,169+Math.sin(a)*14,10,6,i<5?'#9da98e':'#657c6d');}limb(c,56,172,105,155,8,'#8e6941');limb(c,56,155,105,174,8,'#ab8050');return;}
 if(type==='table'){for(const[x,y]of[[48,174],[109,169],[80,183]])box(c,x,y,5,38,4,['#6d6548','#48594b','#9a8c60']);box(c,80,149,53,10,23,['#8f8157','#626c51','#c2b27a']);box(c,65,114,16,4,9,['#8d9b84','#6a7d6d','#ded9ae']);limb(c,91,120,113,106,4,'#b69060');shape(c,[[104,101],[120,97],[124,106],[109,111]],'#a9b7a3');return;}
 if(type==='chest'){box(c,80,180,46,38,22,['#a18854','#6c6948','#d1b778']);box(c,80,144,47,12,23,['#b49b62','#84754c','#e0c58b']);for(const x of [-28,28]){limb(c,80+x,140+Math.abs(x)*-.48,80+x,173-Math.abs(x)*.48,4,'#4e6d60');}shape(c,[[76,141],[85,138],[85,151],[76,153]],'#e3c781');return;}
 box(c,80,183,53,10,25,['#4b6862','#2c514c','#8aa69a']);box(c,80,165,33,19,16,['#71847a','#405e58','#c1c2a0']);box(c,80,135,24,49,12,['#567a70','#284e48','#88b49c']);shape(c,[[74,100],[87,95],[87,115],[74,120]],'#b1e4c2');for(let i=0;i<3;i++)limb(c,76,130+i*5,86,126+i*5,1,'#bac799');
}
