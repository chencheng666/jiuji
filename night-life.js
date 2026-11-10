// 兼容夜色不用额外缓冲画布；按横条合并光圈，交叠处也保持明亮。
export function shadowBands(width,height,lights,step=8){
 if(!lights.length)return[{x:0,y:0,w:width,h:height}];
 const out=[];
 for(let y=0;y<height;y+=step){const mid=y+Math.min(step,height-y)/2,ranges=[];
  for(const l of lights){const dy=mid-l.y;if(Math.abs(dy)>=l.r)continue;const dx=Math.sqrt(l.r*l.r-dy*dy);ranges.push([Math.max(0,l.x-dx),Math.min(width,l.x+dx)]);}
  ranges.sort((a,b)=>a[0]-b[0]);let x=0;
  for(const[a,b]of ranges){if(b<=0||a>=width)continue;if(a>x)out.push({x,y,w:a-x,h:Math.min(step,height-y)});x=Math.max(x,b);}
  if(x<width)out.push({x,y,w:width-x,h:Math.min(step,height-y)});
 }
 return out;
}
export function fireWindow(s,fire,rain=false){
 const t=s.time%300,end=300-t;let remaining=fire.fuel,seconds=0,cursor=t;
 // 预测只按当前雨势估算，但精确跨越白昼/黄昏的燃烧速度。
 for(let i=0;i<6&&remaining>0;i++){const rate=(cursor<190?.28:1)*(rain?1.35:1),span=cursor<190?190-cursor:300-cursor,used=Math.min(span,remaining/rate);seconds+=used;remaining-=used*rate;cursor=cursor+used>=300?0:cursor+used;if(used<span)break;}
 return{seconds:Math.ceil(seconds-1e-8),toDawn:Math.ceil(end),nightLeft:t>=230?Math.ceil(end):70};
}
