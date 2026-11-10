// 角色与机器人共用陆地寻路，避免沿海岸直线穿水。
export function findLandPath(from,to,passable,{cell=70}={}){
 const distance=Math.hypot(to.x-from.x,to.y-from.y);
 if(!passable(to.x,to.y))return null;
 const clear=(a,b)=>{const steps=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/24));for(let i=1;i<=steps;i++)if(!passable(a.x+(b.x-a.x)*i/steps,a.y+(b.y-a.y)*i/steps))return false;return true;};
 if(clear(from,to))return[{x:to.x,y:to.y}];
 const key=(x,y)=>x+','+y,sx=Math.floor(from.x/cell),sy=Math.floor(from.y/cell),gx=Math.floor(to.x/cell),gy=Math.floor(to.y/cell);
 const start={x:sx,y:sy,g:0,f:distance/cell},open=[start],seen=new Map([[key(sx,sy),start]]),closed=new Set();let found=null,limit=0;
 while(open.length&&limit++<2500){open.sort((a,b)=>a.f-b.f);const n=open.shift(),nk=key(n.x,n.y);if(closed.has(nk))continue;closed.add(nk);
  const p=n.parent?{x:(n.x+.5)*cell,y:(n.y+.5)*cell}:from;
  if(n.x===gx&&n.y===gy&&clear(p,to)){found=n;break;}
  for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){if(!dx&&!dy)continue;const xx=n.x+dx,yy=n.y+dy,k=key(xx,yy),next={x:(xx+.5)*cell,y:(yy+.5)*cell};if(closed.has(k)||!passable(next.x,next.y)||!clear(p,next))continue;const g=n.g+Math.hypot(dx,dy);if(seen.has(k)&&seen.get(k).g<=g)continue;const v={x:xx,y:yy,g,f:g+Math.hypot(gx-xx,gy-yy),parent:n};seen.set(k,v);open.push(v);}
 }
 if(!found)return null;const path=[{x:to.x,y:to.y}];while(found.parent){path.unshift({x:(found.x+.5)*cell,y:(found.y+.5)*cell});found=found.parent;}return path;
}
export function pathLength(from,path){let total=0;for(const point of path){total+=Math.hypot(point.x-from.x,point.y-from.y);from=point;}return total;}
