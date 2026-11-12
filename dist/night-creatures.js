// 夜怪按少量状态推进，锁定的是蓄势时的落点，不会持续吸附追踪玩家。
export const NIGHT_KINDS={stalker:{name:'苔影',speed:68,windup:1.1,reach:105,damage:9},lancer:{name:'棘影',speed:100,windup:.9,reach:210,damage:12},prowler:{name:'羽影',speed:88,windup:1.3,reach:150,damage:10}};
export function stepNightCreatures(s,dt,{walkable,lightAt}){
 const p=s.player,lit=lightAt(s,p.x,p.y);
 const move=(e,tx,ty,speed)=>{const d=Math.hypot(tx-e.x,ty-e.y)||1,step=Math.min(d,speed*dt);const x=e.x+(tx-e.x)/d*step,y=e.y+(ty-e.y)/d*step;if(walkable(s,x,y)){e.x=x;e.y=y;}};
 for(const e of s.enemies){const d=NIGHT_KINDS[e.kind]||NIGHT_KINDS.stalker;e.kind??='stalker';e.cooldown=Math.max(0,(e.cooldown||0)-dt);const distance=Math.hypot(p.x-e.x,p.y-e.y),flee=e.hp<=12||lightAt(s,e.x,e.y);
  if(flee){e.warning=null;e.state='retreat';move(e,e.x+(e.x-p.x||1),e.y+(e.y-p.y),155);continue;}
  if(e.warning){e.warning.left-=dt;if(e.warning.left<=0){const w=e.warning;e.warning=null;
    // 沿锁定方向逐段检测，突刺不能跃过不通行的地形。
    const dx=w.x-e.x,dy=w.y-e.y,l=Math.hypot(dx,dy)||1;for(let n=0;n<Math.ceil(l/10);n++){const step=Math.min(10,l-n*10),x=e.x+dx/l*step,y=e.y+dy/l*step;if(!walkable(s,x,y)||lightAt(s,x,y))break;e.x=x;e.y=y;}
    if(Math.hypot(e.x-p.x,e.y-p.y)<48&&!lit&&!s.expedition.invulnerable){const armored=s.inventory.armor&&s.durability.armor>0;p.hp-=armored?Math.ceil(d.damage*.55):d.damage;p.clarity=Math.max(0,p.clarity-3);if(armored){s.durability.armor=Math.max(0,s.durability.armor-6);if(!s.durability.armor)s.inventory.armor=0;}s.hurtUntil=s.time+.3;}
    e.cooldown=2.2;e.state='recover';
   }continue;}
  if(e.cooldown>0){e.state='recover';continue;}
  if(!lit&&distance<d.reach){e.state='windup';e.warning={x:p.x,y:p.y,left:d.windup,total:d.windup};continue;}
  e.state='stalk';const angle=Math.atan2(p.y-e.y,p.x-e.x)+(distance<250?(e.kind==='prowler'?1.1:e.kind==='stalker'?.65:0):0);move(e,e.x+Math.cos(angle)*300,e.y+Math.sin(angle)*300,d.speed);
 }
 s.enemies=s.enemies.filter(e=>e.hp>0&&!(e.hp<=12&&Math.hypot(e.x-p.x,e.y-p.y)>650));
}
export function drawNightCreature(view,c,s,e){
 const name=Object.hasOwn(NIGHT_KINDS,e.kind)?e.kind:'stalker';view.sprite(c,'night-'+name,e.x,e.y,78);
 if(e.warning){const w=e.warning;c.save();c.strokeStyle='#e7a693';c.lineWidth=3;c.setLineDash([6,6]);c.beginPath();c.moveTo(e.x,e.y);c.lineTo(w.x,w.y);c.stroke();c.setLineDash([]);c.beginPath();c.ellipse(w.x,w.y,48,23,0,0,7);c.stroke();c.fillStyle='#efc49f';c.font='12px sans-serif';c.textAlign='center';c.fillText('蓄势 · 侧移避开',e.x,e.y-104);c.restore();}
 else if(e.state==='retreat'){c.fillStyle='#c1cfb4';c.font='11px sans-serif';c.textAlign='center';c.fillText(e.hp<=12?'负伤退去':'畏光退避',e.x,e.y-101);}
}
