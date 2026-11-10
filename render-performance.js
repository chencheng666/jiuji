// 只缩放游戏画布；界面、世界坐标与生存规则不随画质变化。
export const QUALITY_NAMES={auto:'均衡',clear:'清晰优先',smooth:'流畅优先'};
export function renderSize(w,h,dpr=1,mobile=false,quality='auto'){
 const limits=mobile?{auto:1500000,clear:1500000,smooth:900000}:{auto:2500000,clear:4000000,smooth:1500000};
 const scale=Math.min(Math.max(.1,dpr||1),mobile?1.5:2,Math.sqrt((limits[quality]||limits.auto)/(w*h)));
 return{width:Math.max(1,Math.floor(w*scale)),height:Math.max(1,Math.floor(h*scale))};
}
// 保留节拍余量，避免一次迟到使随后所有帧都跟着推迟。
export function frameDue(now,last,fps){const interval=1000/fps,elapsed=now-last;return elapsed>=interval-.5?last+Math.max(1,Math.floor((elapsed+.5)/interval))*interval:null;}
export class FrameMeter{
 constructor(){this.reset();}
 reset(){this.samples=[];this.previous=null;}
 pause(){this.previous=null;}
 add(at,cpu){if(this.previous!==null){const gap=at-this.previous;if(Number.isFinite(gap)&&gap>0){this.samples.push({gap,cpu});if(this.samples.length>180)this.samples.shift();}}this.previous=at;}
 summary(){const a=this.samples;if(a.length<10)return null;const sorted=a.map(x=>x.cpu).sort((x,y)=>x-y);return{frames:a.length,fps:Math.round(a.length*1000/a.reduce((n,x)=>n+x.gap,0)*10)/10,cpuP95:Math.round(sorted[Math.floor((sorted.length-1)*.95)]*10)/10,slowFrames:a.filter(x=>x.gap>50).length};}
}
