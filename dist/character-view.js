// 方向使用同一套正面、背面、左右侧身，老存档缺少方向时保留原朝向。
export function playerSpriteName(p){
 if(p.direction==='left'||p.direction==='right')return'player-'+p.direction;
 if(p.direction==='back')return'player-back';if(p.direction==='front')return'player';
 return p.face===-1?'player-back':'player';
}
