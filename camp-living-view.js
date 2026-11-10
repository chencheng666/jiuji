import {rememberedResources,exploredAt} from './camp-living.js';
export function drawResourceMemory(c,s,large=false){
 c.save();c.lineWidth=large?8:11;
 for(const n of rememberedResources(s)){
  c.strokeStyle=n.available?'#e2d297':'#a8b6af';c.beginPath();c.arc(n.x,n.y,large?19:24,0,Math.PI*2);c.stroke();
  if(!n.available){c.beginPath();c.moveTo(n.x-12,n.y-12);c.lineTo(n.x+12,n.y+12);c.moveTo(n.x+12,n.y-12);c.lineTo(n.x-12,n.y+12);c.stroke();}
 }
 const t=s.campLiving?.tracked,n=t?.realm===s.expedition.current?[...s.nodes,...s.buildings].find(n=>n.id===t.id):null;
 if(n&&(s.buildings.includes(n)||exploredAt(s,n))){c.strokeStyle='#ffe197';c.lineWidth=large?11:15;c.beginPath();c.arc(n.x,n.y,large?48:60,0,Math.PI*2);c.stroke();if(large){c.fillStyle='#ffe197';c.font='bold 42px sans-serif';c.textAlign='center';c.fillText('追踪',n.x,n.y-65);}}
 c.restore();
}
