import {drawVillageContribution} from './community-view.js';
import {VILLAGES} from './settlements.js';
export function drawSettlement(view,c,s,n){if(n.type!=='settlement')return false;const d=VILLAGES[n.village],v=s.settlements.villages[n.village];c.save();c.translate(n.x,n.y);c.fillStyle='#48624d77';c.beginPath();c.ellipse(0,0,90,38,0,0,7);c.fill();
 for(let i=0;i<3;i++){const x=(i-1)*57,y=i===1?-15:0;c.fillStyle='#8d8060';c.fillRect(x-24,y-49,48,40);c.fillStyle=d.color;c.strokeStyle='#344c3f';c.lineWidth=3;c.beginPath();c.moveTo(x-33,y-46);c.lineTo(x,y-83);c.lineTo(x+33,y-46);c.closePath();c.fill();c.stroke();c.fillStyle='#354b3d';c.fillRect(x-8,y-33,16,24);}
 if(s.campLiving?.joint===2&&['bay','ridge'].includes(n.village)){view.sprite(c,'chest',94,20,43);c.font='10px sans-serif';c.textAlign='center';c.fillStyle='#ecd7a4';c.fillText('两地共建',94,34);}
 drawVillageContribution(c,s,n.village,-105,42,.75);
 c.restore();c.font='bold 12px sans-serif';c.textAlign='center';c.lineWidth=4;c.strokeStyle='#243c32';const text=d.name+' · '+v.population+' 人'+(s.level<d.level?' · '+d.level+'级开放':'');c.strokeText(text,n.x,n.y-110);c.fillStyle=d.color;c.fillText(text,n.x,n.y-110);return true;}
