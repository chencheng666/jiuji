import * as G from './survival.js';
import {stepExpedition} from './expeditions.js';
import {placeLure} from './homestead.js';
export const LESSONS=[
 {title:'弓：先拉开距离',text:'目标在 260 步外，近战够不到。选择林语弓，再试一次攻击。',kind:'boar',x:430},
 {title:'锤：在蓄力时打断',text:'岩甲兽正在蓄力。选择碎岩锤，观察预警消失和打断标记。',kind:'rockling',x:250},
 {title:'霜矛：命中后留出空间',text:'余烬灵怕霜晶。选择霜晶长矛，命中后看减速标记，再准备后退。',kind:'emberling',x:300},
 {title:'诱饵：可以绕开战斗',text:'先放下诱饵，再向侧面绕行。普通野怪会转向诱饵，守卫不受影响。',kind:'boar',x:470},
 {title:'冲锋：离开锁定落点',text:'林猪的红圈已经锁定当前位置。点击侧移，躲开这次攻击。',kind:'boar',x:350}
];
export class CombatTraining{
 constructor(index=0){this.index=index;this.reset();}
 reset(){
  const l=LESSONS[this.index],s=G.createGame(34);s.time=30;s.player.x=170;s.player.y=205;s.player.direction='right';s.nodes=[];s.buildings=[];s.enemies=[];s.fx=[];
  s.inventory={bow:1,hammer:1,frostSpear:1,arrow:20,lure:2};s.durability={bow:100,hammer:120,frostSpear:150};s.expedition.equipped='bow';
  const m={id:'training-target',kind:l.kind,x:l.x,y:205,homeX:l.x,homeY:205,hp:G.CREATURES[l.kind].hp,cooldown:20,slow:0,stun:0,respawnAt:0,alert:0};
  if([1,4].includes(this.index))m.warning={kind:this.index===4?'charge':'slam',x:this.index===4?170:250,y:205,radius:this.index===4?58:105,left:2,total:2};
  s.expedition.creatures=[m];this.state=s;this.done=false;this.message='演练不消耗旅程里的物品，也不会写入旅程存档。';this.elapsed=0;this.running=false;this.lured=false;
 }
 act(action){
  const s=this.state,m=s.expedition.creatures[0];
  if(['bow','hammer','frostSpear'].includes(action)){G.useItem(s,action);this.message='已选择'+G.ITEMS[action].name;return;}
  if(this.done)return;
  if(action==='attack'){
   const result=G.attack(s);this.running=true;this.elapsed=0;
   this.done=this.index===0&&result.ok&&s.expedition.equipped==='bow'||this.index===1&&m.stun>0||this.index===2&&m.slow>0;
   this.message=this.done?['命中！箭迹展示了弓的射程；每次消耗一支演练箭矢。','打断成功！岩甲兽的蓄力被取消，钝击也克制岩甲。','减速成功！霜晶对余烬灵有克制效果，给你时间拉开距离。'][this.index]:result.reason||'这把武器没有完成本课目标，换一种试试。';
  }else if(action==='lure'){
   if(this.index!==3)return;const r=placeLure(s);this.lured=r.ok;this.message=r.reason;
  }else if(action==='sidestep'){
   if(this.index===3&&!this.lured){this.message='先在这里放下诱饵，再绕行。';return;}
   s.player.y=80;this.running=true;this.elapsed=0;
   this.message=this.index===4?'已离开红圈，观察这次冲锋落点。':'已从侧面绕行，观察林猪向诱饵移动。';
  }
 }
 step(dt){if(!this.running)return;const s=this.state,m=s.expedition.creatures[0];s.time+=dt;this.elapsed+=dt;s.attackCooldown=Math.max(0,s.attackCooldown-dt);stepExpedition(s,dt,()=>true);
  if(this.index===3&&this.lured&&this.elapsed>=1&&m.x<LESSONS[3].x&&s.player.hp===100){this.done=true;this.message='绕行成功！林猪走向诱饵，你无需击败它。';}
  if(this.index===4&&!m.warning&&this.elapsed>=2){this.done=s.player.hp===100;this.message=this.done?'避开了！冲锋落在旧位置，侧移比迎着冲锋跑更安全。':'没有避开这次攻击，重试后在红圈结束前侧移。';}
  if(this.elapsed>2.6)this.running=false;
 }
}
