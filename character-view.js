// 方向使用同一套正面、背面、左右侧身，老存档缺少方向时保留原朝向。
export function playerSpriteName(p){
 if(p.direction==='left'||p.direction==='right')return'player-'+p.direction;
 if(p.direction==='back')return'player-back';if(p.direction==='front')return'player';
 return p.face===-1?'player-back':'player';
}
// 空手拾取使用弯腰与探手，伐木和采矿仍保留工具挥击。
export function gatherBend(s){const a=s.action;if(!a||a.duration<=0)return 0;const n=s.nodes.find(n=>n.id===a.id);if(!n||!['twig','flint','flower','bush','grass','mushroom','brokenwood'].includes(n.type))return 0;return Math.sin(Math.min(1,a.elapsed/a.duration)*Math.PI)*(n.x<s.player.x?-1:1);}

// 两段骨骼按目标解出肘/膝，不靠整张图片摇摆来模拟走路。
export function solveJoint(start,end,upper,lower,bend=1){
 const dx=end.x-start.x,dy=end.y-start.y,raw=Math.hypot(dx,dy),d=Math.max(.001,Math.min(upper+lower-.001,Math.max(Math.abs(upper-lower)+.001,raw))),
  ux=raw>1e-8?dx/raw:0,uy=raw>1e-8?dy/raw:1,a=(upper*upper-lower*lower+d*d)/(2*d),h=Math.sqrt(Math.max(0,upper*upper-a*a));
 return{x:start.x+ux*a-uy*h*bend,y:start.y+uy*a+ux*h*bend};
}
export function travelerPose(s,reduced=false){
 const p=s.player,cycle=reduced?0:(p.walk||0)*2,step=Math.sin(cycle),moving=!!p.walk&&!reduced,side=['left','right'].includes(p.direction),a=s.action,
  gather=a&&!reduced?Math.sin(Math.min(1,a.elapsed/Math.max(.01,a.duration))*Math.PI):0,shot=s.expedition?.shot,
  strike=shot&&s.time>=shot.at&&s.time<shot.until?(reduced?.5:Math.sin(Math.max(0,Math.min(1,(s.time-shot.at)/Math.max(.01,shot.duration||.25)))*Math.PI)):0;
 return{leftFoot:{x:(side?-4:-10)+(moving?step*9:0),y:moving?-Math.max(0,Math.cos(cycle))*4:0},
  rightFoot:{x:(side?8:12)-(moving?step*9:0),y:moving?-Math.max(0,-Math.cos(cycle))*4:0},
  leftHand:{x:-19+(moving?step*5:0),y:-21-gather*2},rightHand:{x:20-(moving?step*5:0)+gather*8+strike*8,y:-21-gather*8-strike*14},
  bob:reduced?0:moving?-Math.abs(step)*1.5:Math.sin(s.time*2)*.55,bend:gather*.11,strike};
}
