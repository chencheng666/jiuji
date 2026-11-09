import {VILLAGES} from './settlements.js';
import {RESIDENT_ROLES} from './village-life.js';
export function villageLifeObjects(s){if(s.expedition.current!=='home')return[];const objects=Object.entries(s.settlements?.life?.people||{}).flatMap(([village,list])=>list.filter(r=>!r.inside).map(r=>({...r,id:'resident-'+r.id,type:'resident',village})));const nearby=objects.filter(r=>r.speechUntil>s.time&&Math.hypot(r.x-s.player.x,r.y-s.player.y)<130).sort((a,b)=>Math.hypot(a.x-s.player.x,a.y-s.player.y)-Math.hypot(b.x-s.player.x,b.y-s.player.y))[0];if(nearby)nearby.showSpeech=true;return objects;}
export function drawVillageResident(view,c,s,n){
 if(n.type!=='resident')return false;
 const role=RESIDENT_ROLES[n.role],bob=view.reducedMotion?0:n.walk?Math.sin(n.walk*2)*1.5:n.state==='work'?Math.sin(s.time*3+n.index)*.7:0;
 c.save();c.translate(n.x,n.y);c.scale(n.face,1);view.sprite(c,role.sprite,0,bob,n.index===0?57:45);if(n.role===2&&n.state==='work')view.sprite(c,'wood',17,-14,23);if(n.role===1&&n.state==='work'){c.strokeStyle='#ddce98';c.lineWidth=2;c.beginPath();c.moveTo(12,-20);c.lineTo(24,-8);c.stroke();}c.restore();
 if(n.showSpeech){c.font='11px sans-serif';c.textAlign='center';const text=n.speech,w=Math.min(250,c.measureText(text).width+18);c.fillStyle='#20382fef';c.fillRect(n.x-w/2,n.y-90,w,24);c.fillStyle='#f0dfb5';c.fillText(text,n.x,n.y-74,w-12);}
 return true;
}
