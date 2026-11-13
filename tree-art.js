import {TREE_SPECIES,treeProfile,treeMetrics,treeHash,treeSeason} from './tree-species.js';
const TAU=Math.PI*2;
function oval(c,x,y,rx,ry,fill){c.fillStyle=fill;c.beginPath();c.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,TAU);c.fill();}
function shape(c,p,fill,stroke){c.beginPath();for(let i=0;i<p.length;i++)i?c.lineTo(...p[i]):c.moveTo(...p[i]);c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.lineWidth=.7;c.strokeStyle=stroke;c.stroke();}}
function line(c,p,color,w=1){c.strokeStyle=color;c.lineWidth=w;c.lineCap='round';c.lineJoin='round';c.beginPath();p.forEach((v,i)=>i?c.lineTo(...v):c.moveTo(...v));c.stroke();}
function curve(c,p,color,w=1){c.strokeStyle=color;c.lineWidth=w;c.lineCap='round';c.beginPath();c.moveTo(...p[0]);c.bezierCurveTo(...p[1],...p[2],...p[3]);c.stroke();}
function randomFor(key){let n=treeHash(key);return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}

// 主干和树冠各缓存一张小画布。换季或细节档变化才重建，动态不重画树皮。
export class TreeArt{
 constructor({create=()=>document.createElement('canvas')}={}){this.create=create;this.entries=new Map();this.blocked=new Set();this.bytes=0;}
 clear(){for(const e of this.entries.values())for(const c of[e.trunk,e.crown])c.width=c.height=0;this.entries.clear();this.blocked.clear();this.bytes=0;}
 model(id,variant,si,{density=1,cacheBytes=6*1024*1024}={},detail=true){
  const key=[id,variant,si,density,detail?1:0].join(':');
  while(this.bytes>cacheBytes&&this.entries.size){const[k,e]=this.entries.entries().next().value;this.entries.delete(k);this.bytes-=e.bytes;e.trunk.width=e.trunk.height=e.crown.width=e.crown.height=0;}
  if(this.entries.has(key)){const e=this.entries.get(key);this.entries.delete(key);this.entries.set(key,e);return e;}
  if(this.blocked.has(key))return null;const canvases=[];
  try{
   const rig=makeRig(id,variant),season=treeSeason(id,si),d=TREE_SPECIES[id];
   for(const part of['trunk','crown']){const canvas=this.create();canvases.push(canvas);canvas.width=Math.max(1,Math.floor(128*density));canvas.height=Math.max(1,Math.floor(192*density));const c=canvas.getContext('2d');if(!c)throw Error('树木缓冲不可用');c.scale(canvas.width/128,canvas.height/192);
    if(part==='trunk')paintTrunk(c,d,rig,season,detail);else paintCrown(c,d,rig,season,detail);
   }
   const bytes=canvases.reduce((n,c)=>n+c.width*c.height*4,0);
   if(bytes>cacheBytes)throw Error('树木模型超过缓存预算');
   while(this.entries.size&&this.bytes+bytes>cacheBytes){const[k,e]=this.entries.entries().next().value;this.entries.delete(k);this.bytes-=e.bytes;e.trunk.width=e.trunk.height=e.crown.width=e.crown.height=0;}
   const entry={trunk:canvases[0],crown:canvases[1],bytes,rig,season};this.entries.set(key,entry);this.bytes+=bytes;return entry;
  }catch{for(const c of canvases)c.width=c.height=0;if(this.blocked.size<512)this.blocked.add(key);return null;}
 }
 draw(c,n,s,view,si,alpha=1){
  const profile=treeProfile(n,s),metrics=treeMetrics(n,s),gap=Math.hypot(n.x-s.player.x,n.y-s.player.y),detail=!n.sapling&&gap<(view.mobile?290:420)&&view.quality!=='smooth',
   density=n.sapling||gap>460?.6:view.mobile?(view.quality==='clear'?1.1:.9):view.quality==='smooth'?.8:1.35,
   model=this.model(profile.id,treeHash(n.id||'tree')%2,si,{density,cacheBytes:(view.mobile?6:12)*1024*1024},detail);
  if(!model)return false;
  const w=metrics.width,h=metrics.height,y=-h*181/192,t=view.reducedMotion?0:s.time,phase=treeHash(n.id||'tree')%100,
   hit=view.reducedMotion?0:n.hitAt&&s.time-n.hitAt<.2?Math.sin((s.time-n.hitAt)*65)*2:s.action?.id===n.id?Math.sin(s.action.elapsed*25)*1.4:0,
   sway=view.reducedMotion?0:Math.sin(t*.85+phase)*(['willow','aspen','birch'].includes(profile.id)?.014:.005);
  c.save();c.translate(n.x,n.y);c.globalAlpha=alpha;oval(c,4,2,w*.34,h*.038,'#15362c28');
  if(!view.mobile&&!n.sapling&&gap<500){c.save();c.globalAlpha=alpha*.09;c.transform(1,0,-.45,.19,0,0);c.drawImage(model.crown,-w/2,y,w,h);c.restore();}
  c.drawImage(model.trunk,-w/2+hit*.2,y,w,h);
  c.save();c.transform(1,0,sway,1,hit,0);c.drawImage(model.crown,-w/2,y,w,h);
  if(!view.reducedMotion&&detail)drawTreeLife(c,profile.id,model.rig,model.season,t,view.mobile,w,h,y);
  c.restore();c.restore();return true;
 }
}

function makeRig(id,variant){
 const r=randomFor(id+':'+variant),d=TREE_SPECIES[id],clusters=[],branches=[],slant=(variant?1:-1)*(id==='jujube'?9:3),cx=64+slant;
 const specs={birch:[35,90,32,54,7],oak:[57,87,48,51,13],willow:[53,75,46,33,9],aspen:[37,78,31,54,10],jujube:[52,101,45,42,9],maple:[50,85,43,49,11],elm:[53,86,46,47,11],locust:[53,87,45,47,9],ginkgo:[47,79,37,59,11],ebony:[43,81,38,37,10]};
 if(!d.evergreen||id==='ebony'){
  const [spread,cy,rx,ry,count]=specs[id];
  for(let i=0;i<count;i++){const a=i/count*TAU,y=cy+Math.sin(a)*ry*.55,taper=id==='ginkgo'?.35+(y-25)/110*.7:1,x=cx+Math.cos(a)*spread*(.48+r()*.2)*taper;
   clusters.push({x,y,rx:rx*(.37+r()*.19)*(id==='birch'?.76:id==='ginkgo'?taper:1),ry:ry*(.30+r()*.18)*(id==='birch'?.83:1),seed:r()*TAU});branches.push([[64,176],[62+slant,133],[cx+(x-cx)*.6,100],[x,y]]);
  }
  clusters.push({x:cx-3,y:cy-7,rx:rx*.55,ry:ry*.45,seed:r()*TAU});
 }
 const leaves=Array.from({length:36},()=>{const q=clusters[Math.floor(r()*clusters.length)]||{x:64,y:90,rx:30,ry:40};return{x:q.x+(r()-.5)*q.rx*1.5,y:q.y+(r()-.5)*q.ry*1.3,a:r()*TAU,size:2.7+r()*2};});
 return{variant,slant,cx,clusters,branches,leaves,strands:Array.from({length:17},(_,i)=>({x:19+i*5.6+r()*2,y:68+Math.sin(i/16*Math.PI)*15,length:54+r()*43,phase:r()*TAU}))};
}
function paintTrunk(c,d,rig,season,detail){
 const id=d.form,thick=id==='oak'?10:id==='birch'||id==='aspen'?4.3:id==='ebony'?5:6.5,lean=rig.slant,tip=rig.clusters.length?Math.min(...rig.clusters.map(q=>q.y-q.ry))+15:35;
 // 根部、主干和分枝在同一层，树冠摇动不会扭动整根树干。
 if(id==='locust'){for(const[x,y]of[[36,183],[83,186],[96,179],[45,170]]){curve(c,[[64,155],[64,178],[x,174],[x,y]],d.bark,7);curve(c,[[64,157],[64,176],[x,175],[x,y]],d.inner,1.4);}}
 else{for(const x of[-12,12])line(c,[[64,164],[64+x*.4,176],[64+x,182]],d.bark,thick*.65);}
 for(const b of rig.branches){curve(c,b,d.bark,id==='oak'?4:2.7);if(detail)curve(c,b.map(([x,y])=>[x-1,y]),d.inner,.6);}
 if(id==='pine'||id==='fir')for(let i=0;i<6;i++){const y=48+i*19,w=11+i*5;line(c,[[64,180],[64+lean*.4,y],[64-w,y+13]],d.bark,2.7);line(c,[[64,y],[64+w,y+11]],d.bark,2.4);}
 shape(c,[[64-thick,180],[62-thick*.5+lean,112],[63-thick*.35+lean,tip],[65+thick*.3+lean,tip],[66+thick*.5+lean,112],[64+thick,181]],d.bark,'#273b3090');
 line(c,[[62-thick*.45,177],[61-thick*.2+lean,111],[62+lean,tip+7]],d.inner,id==='birch'||id==='aspen'?1.2:1.7);
 if(detail){
  for(let i=0;i<17;i++){const y=51+i*7.1,x=64+lean*(1-(y-35)/145),z=i%3;if(y<tip+7)continue;
   if(id==='birch'){line(c,[[x-3,y],[x+2+z,y-1]],'#555d4e',.9);if(i%3===0)shape(c,[[x+2,y],[x+8,y-1],[x+7,y+6],[x+3,y+4]],'#d8d7be','#9a9a7f');}
   else if(id==='aspen'){if(i>10)shape(c,[[x,y-2],[x+2,y],[x,y+3],[x-2,y]],'#6e7b66');}
   else if(id==='pine'){shape(c,[[x-4,y],[x+2,y-2],[x+4,y+3],[x-2,y+6]],i%2?'#ae6544':'#cb8050','#713e32');}
   else if(id==='elm'){shape(c,[[x-4,y],[x+2,y-2],[x+5,y+3],[x,y+6],[x-4,y+4]],i%2?'#b3a588':'#8b846d','#6d705b');}
   else if(id==='maple')line(c,[[x-3,y],[x-1,y+5],[x-2,y+9]],'#b46b5f',.7);
   else line(c,[[x-3+z*2,y-1],[x-4+z*2,y+4],[x-3+z*2,y+7]],id==='oak'?'#241f1c':id==='ebony'?'#131f1e':'#3e4838',id==='oak'?1.2:.6);
  }
 }
 if(id==='willow'){for(const[x,y]of[[61,143],[68,159],[59,118]]){oval(c,x,y,4,5,'#524d39');oval(c,x-1,y-1,2,2,'#9d8b65');}}
 if(id==='locust'){oval(c,65,142,4,10,'#1b302b');line(c,[[69,140],[70,152],[68,158]],'#b3a06d',.8);}
 if(id==='jujube'){for(let i=0;i<12;i++){const b=rig.branches[i%rig.branches.length],x=b[2][0],y=b[2][1]+i%3*5;line(c,[[x,y],[x+(i%2?5:-5),y-7]],'#b7b390',.8);}}
 if(season.snow){for(let i=0;i<Math.min(5,rig.branches.length);i++){const b=rig.branches[i];line(c,[[b[2][0],b[2][1]-1],[b[3][0],b[3][1]-1]],'#e0e7d6',1.5);}}
}

function tuft(c,q,p){
 const points=[];for(let j=0;j<12;j++){const a=j/12*TAU,r=j%2?.85:1;points.push([q.x+Math.cos(a)*q.rx*r,q.y+Math.sin(a)*q.ry*r]);}
 shape(c,points,p[0],'#27443390');
 shape(c,[[q.x-q.rx*.91,q.y],[q.x-q.rx*.6,q.y-q.ry*.75],[q.x,q.y-q.ry*.9],[q.x+q.rx*.5,q.y-q.ry*.6],[q.x+q.rx*.35,q.y],[q.x-q.rx*.15,q.y+q.ry*.45],[q.x-q.rx*.7,q.y+q.ry*.3]],p[1]);
 shape(c,[[q.x-q.rx*.7,q.y-q.ry*.15],[q.x-q.rx*.4,q.y-q.ry*.7],[q.x-q.rx*.02,q.y-q.ry*.75],[q.x+q.rx*.2,q.y-q.ry*.43],[q.x-q.rx*.2,q.y-q.ry*.17]],p[2]);
}
function paintCrown(c,d,rig,season,detail){
 const id=d.form,p=season.leaf;
 if(id==='pine'||id==='fir'){
  const count=id==='fir'?7:5;for(let i=0;i<count;i++){const y=23+i*(id==='fir'?19:27),r=9+i*(id==='fir'?5.8:8),h=id==='fir'?31:39;
   const q=[[64+rig.slant,y-13],[64-r*.65,y+h*.12],[64-r,y+h*.45],[64-r*.5,y+h*.38],[64-r*.7,y+h*.62],[65,y+h*.5],[64+r*.78,y+h*.65],[64+r*.58,y+h*.4],[64+r,y+h*.48],[64+r*.48,y]];
   shape(c,q,p[0],'#203c3299');shape(c,[[64+rig.slant,y-12],[64-r*.7,y+h*.3],[64-r*.35,y+h*.28],[64-r*.45,y+h*.48],[64,y+h*.35],[70,y+h*.08]],p[1]);
   shape(c,[[64+rig.slant,y-10],[64-r*.4,y+h*.16],[61,y+h*.08],[56,y+h*.3],[67,y+h*.14]],p[2]);
   if(detail)for(let k=0;k<7;k++){const x=64-r*.72+k*r*.2,yy=y+h*.39+(k%2)*3;line(c,[[x,yy],[x+3,yy-5],[x+5,yy+1]],p[2]+'aa',.6);}
   if(season.snow)shape(c,[[64+rig.slant,y-13],[64-r*.7,y+h*.2],[58,y+h*.07],[64,y+h*.16],[73,y+h*.03]],'#e3e9d4');
  }return;
 }
 if(season.bare){
  // 落叶树冬季露出枝架，少量残叶保留树种辨识度。
  if(id!=='willow')for(let i=0;i<5;i++){const q=rig.leaves[i];paintLeaf(c,id,q.x,q.y,2.2,q.a,'#978462');}
  if(id==='willow')paintWillow(c,rig,['#706b4e','#8d8e68','#b8b78f'],false,true);
  return;
 }
 const clusters=id==='ginkgo'?[...rig.clusters].sort((a,b)=>a.y-b.y):rig.clusters;
 for(const q of clusters)tuft(c,q,p);
 if(id==='willow')paintWillow(c,rig,p,detail,false);
 if(detail){for(let i=0;i<rig.leaves.length;i++){const q=rig.leaves[i];paintLeaf(c,id,q.x,q.y,q.size,q.a,p[i%3]);}}
 if(season.snow)for(let i=0;i<4;i++){const q=clusters[i];if(q)oval(c,q.x-3,q.y-q.ry*.6,q.rx*.55,2.5,'#dbe4d3');}
}
function paintLeaf(c,id,x,y,size,a,color){
 c.save();c.translate(x,y);c.rotate(a);const r=size;
 if(id==='ginkgo'){c.fillStyle=color;c.beginPath();c.moveTo(0,r);c.lineTo(-r*1.2,-r*.35);c.quadraticCurveTo(-r*.8,-r*1.25,-.5,-r);c.lineTo(0,-r*.4);c.lineTo(.5,-r);c.quadraticCurveTo(r*.8,-r*1.25,r*1.2,-r*.35);c.closePath();c.fill();line(c,[[0,r],[0,0]],'#907f4d70',.35);}
 else if(id==='maple'){shape(c,[[0,-r*1.5],[r*.35,-r*.5],[r,-r*.85],[r*.7,0],[r*1.2,r*.25],[r*.3,r*.7],[0,r*.5],[-r*.3,r*.7],[-r*1.2,r*.25],[-r*.7,0],[-r,-r*.85],[-r*.35,-r*.5]],color);}
 else if(id==='birch'||id==='aspen')shape(c,[[0,-r*1.2],[r,r*.5],[r*.5,r],[-r*.7,r*.8],[-r,r*.4]],color);
 else if(id==='locust'){line(c,[[0,-r*2],[0,r*2]],color,.5);for(let j=-1;j<=1;j++){oval(c,-r*.7,j*r,r*.65,r*.35,color);oval(c,r*.7,j*r+.3,r*.65,r*.35,color);}}
 else if(id==='oak'){shape(c,[[0,-r*1.5],[r*.65,-r],[r*.4,-r*.45],[r,-r*.1],[r*.55,r*.4],[r*.7,r],[0,r*1.3],[-r*.7,r],[-r*.55,r*.4],[-r,-r*.1],[-r*.4,-r*.45],[-r*.65,-r]],color);}
 else oval(c,0,0,r*.6,r,color);
 c.restore();
}
function paintWillow(c,rig,p,detail,bare){
 for(let i=0;i<rig.strands.length;i++){const q=rig.strands[i],end=q.y+q.length;curve(c,[[q.x,q.y],[q.x-4,q.y+16],[q.x+3,end-14],[q.x-1,end]],bare?'#817858':p[0],bare?.7:1.3);
  if(!bare)for(let k=1;k<(detail?11:7);k++){const f=k/(detail?11:7),y=q.y+q.length*f;oval(c,q.x+(k%2?2:-2),y,1.6,4.2,p[(k+i)%3]);}
 }
}
function drawTreeLife(c,id,rig,season,t,mobile,w,h,y){
 c.save();c.translate(-w/2,y);c.scale(w/128,h/192);
 if(id==='willow'){const count=mobile?5:9;for(let i=0;i<count;i++){const q=rig.strands[i*2],a=Math.sin(t*1.1+q.phase)*4;
  curve(c,[[q.x,q.y],[q.x+a*.15,q.y+20],[q.x+a*.65,q.y+q.length*.7],[q.x+a,q.y+q.length]],season.bare?'#aaab8b99':season.leaf[2]+'aa',season.bare?.6:.8);
  if(!season.bare)for(let k=2;k<6;k++){const f=k/6;oval(c,q.x+a*f*f,q.y+q.length*f,1.4,3.2,season.leaf[2]+'bb');}
 }}
 else if(!season.bare&&['aspen','birch'].includes(id)){for(let i=0;i<(mobile?5:10);i++){const q=rig.leaves[i*3],turn=Math.sin(t*1.4+i*2+rig.variant);c.save();c.globalAlpha=.18+Math.abs(turn)*.35;oval(c,q.x,q.y,Math.max(.3,Math.abs(turn)*q.size),q.size*.65,turn>0?'#e0e6c9':season.leaf[1]);c.restore();}}
 else if(!season.bare&&id==='ginkgo'){for(let i=0;i<(mobile?3:5);i++){const q=rig.leaves[i*5];paintLeaf(c,id,q.x+Math.sin(t*.9+i)*.5,q.y,2.8,Math.sin(t*.8+i)*.3,season.leaf[2]+'a0');}}
 c.restore();
}
