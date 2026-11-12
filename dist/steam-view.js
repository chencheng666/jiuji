import {steamState} from './steam.js';
// 锅炉主体缓存为矢量精灵，只有可见且运行的转轮、连杆与蒸汽逐帧绘制。
export function drawSteam(view,c,s,b){
 view.sprite(c,'steamworks',b.x,b.y,152);const m=steamState(b),active=m.enabled&&m.job?.remaining>0&&m.heat>0,angle=active&&!view.reducedMotion?s.time*3:0;
 c.save();c.translate(b.x+35,b.y-39);c.rotate(angle);c.strokeStyle='#d6ba7d';c.lineWidth=3;c.beginPath();c.arc(0,0,19,0,7);for(let i=0;i<6;i++){const a=i*Math.PI/3;c.moveTo(0,0);c.lineTo(Math.cos(a)*18,Math.sin(a)*18);}c.stroke();c.restore();
 c.strokeStyle='#d7c39d';c.lineWidth=3;c.beginPath();c.moveTo(b.x+35+Math.cos(angle)*12,b.y-39+Math.sin(angle)*12);c.lineTo(b.x-12,b.y-39);c.stroke();
 if(active&&!view.reducedMotion){for(let i=0;i<3;i++){const t=(s.time*16+i*17)%45;c.fillStyle=`rgba(228,229,207,${.4*(1-t/45)})`;c.beginPath();c.ellipse(b.x-39+Math.sin(t*.15)*5,b.y-124-t,3+t*.12,4+t*.15,0,0,7);c.fill();}}
 c.fillStyle='#ecd8a4';c.font='12px sans-serif';c.textAlign='center';c.fillText(active?'蒸汽加工 · '+Math.ceil(m.job.remaining)+'s':m.enabled?'等待原料 / 燃料':'蒸汽工坊 · 已停机',b.x,b.y+22);
}
