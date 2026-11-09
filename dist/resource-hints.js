// 只标出已探索区域中的最近材料，不泄露迷雾，也不改变采集规则。
export function trackedResourceHints(s,recipes,nodeTypes,amount,limit=3){
 const recipe=recipes.find(r=>r.id===s.wilderness?.pinned);
 if(!recipe)return[];
 const known=new Set(s.explored),used=new Set(),hints=[];
 for(const[item,count]of Object.entries(recipe.cost)){
  if(amount(s,item)>=count)continue;
  const node=s.nodes.filter(n=>n.available&&nodeTypes[n.type]?.drop?.[item]&&known.has(Math.floor(n.x/160)+','+Math.floor(n.y/160))&&!used.has(n.id)).sort((a,b)=>Math.hypot(a.x-s.player.x,a.y-s.player.y)-Math.hypot(b.x-s.player.x,b.y-s.player.y))[0];
  if(node){used.add(node.id);hints.push({id:node.id,item});}
  if(hints.length>=limit)break;
 }
 return hints;
}
