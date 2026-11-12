// 方向使用同一套正面、背面、左右侧身，老存档缺少方向时保留原朝向。
export function playerSpriteName(p){
 if(p.direction==='left'||p.direction==='right')return'player-'+p.direction;
 if(p.direction==='back')return'player-back';if(p.direction==='front')return'player';
 return p.face===-1?'player-back':'player';
}
// 空手拾取使用弯腰与探手，伐木和采矿仍保留工具挥击。
export function gatherBend(s){const a=s.action;if(!a||a.duration<=0)return 0;const n=s.nodes.find(n=>n.id===a.id);if(!n||!['twig','flint','flower','bush','grass','mushroom','brokenwood'].includes(n.type))return 0;return Math.sin(Math.min(1,a.elapsed/a.duration)*Math.PI)*(n.x<s.player.x?-1:1);}
