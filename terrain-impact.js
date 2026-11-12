// 冲撞与击退沿陆地逐段推进；树木拦截、掉落和生态变化只结算一次。
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function fellImpactTree(s,tree){
 if(!tree?.available||tree.type!=='tree'||tree.sapling)return false;
 let debris=s.nodes.find(n=>n.id==='impact-'+tree.id);if(!debris&&s.nodes.length>=1490)return false;
 tree.available=false;tree.hp=0;tree.felledAt=s.time;tree.respawnAt=0;s.ecology=Math.max(0,s.ecology-1.2);
 if(debris){debris.available=true;debris.hp=1;debris.respawnAt=0;}else s.nodes.push({id:'impact-'+tree.id,type:'brokenwood',x:tree.x,y:tree.y,hp:1,available:true,respawnAt:0});
 s.fx.push({x:tree.x,y:tree.y,at:s.time,text:'树干折断 · 木料留在地面'});return true;
}
export function terrainPush(s,actor,target,walkable,{hitTrees=true}={}){
 const start={x:actor.x,y:actor.y},dx=target.x-start.x,dy=target.y-start.y,length=Math.hypot(dx,dy);if(!length)return{moved:0,tree:null,blocked:false};
 for(let n=0;n<Math.ceil(length/8);n++){
  const f=Math.min(length,(n+1)*8)/length,x=start.x+dx*f,y=start.y+dy*f;if(!walkable(s,x,y))return{moved:dist(start,actor),tree:null,blocked:true};
  const tree=hitTrees?s.nodes.find(t=>t.type==='tree'&&t.available&&!t.sapling&&Math.hypot(t.x-x,t.y-y)<24):null;
  if(tree){fellImpactTree(s,tree);return{moved:dist(start,actor),tree,blocked:true};}
  actor.x=x;actor.y=y;
 }
 return{moved:dist(start,actor),tree:null,blocked:false};
}
export function boarKnockback(s,origin,walkable,distance=72){
 const p=s.player,dx=p.x-origin.x,dy=p.y-origin.y,length=Math.hypot(dx,dy)||1;
 const result=terrainPush(s,p,{x:p.x+dx/length*distance,y:p.y+dy/length*distance},walkable);
 if(result.tree){p.hp-=4;p.clarity=Math.max(0,p.clarity-6);s.fx.push({x:p.x,y:p.y,at:s.time,text:'撞上树干 · 生命 −4 / 意识 −6'});}
 s.action=null;s.channel=null;s.path=[];s.target=null;return result;
}
