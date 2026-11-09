// 只标出已探索区域中的最近材料，不泄露迷雾，也不改变采集规则。
export function resourceCandidates(s,item,nodeTypes){
 return s.nodes.filter(n=>{
  const d=nodeTypes[n.type];
  return n.available&&d?.drop?.[item]&&(!d.tool||(s.inventory[d.tool]>0&&s.durability?.[d.tool]>0));
 }).sort((a,b)=>Math.hypot(a.x-s.player.x,a.y-s.player.y)-Math.hypot(b.x-s.player.x,b.y-s.player.y));
}
export function trackedResourceHints(s,recipes,nodeTypes,amount,limit=3){
 const recipe=recipes.find(r=>r.id===s.wilderness?.pinned);
 if(!recipe)return[];
 const known=new Set(s.explored),used=new Set(),hints=[];
 for(const[item,count]of Object.entries(recipe.cost)){
  if(amount(s,item)>=count)continue;
  const node=resourceCandidates(s,item,nodeTypes).find(n=>known.has(Math.floor(n.x/160)+','+Math.floor(n.y/160))&&!used.has(n.id));
  if(node){used.add(node.id);hints.push({id:node.id,item});}
  if(hints.length>=limit)break;
 }
 return hints;
}
