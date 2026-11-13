// 音效由浏览器实时合成，仅在玩家交互后启动，不请求外部音频。
export class SurvivalAudio {
  constructor(){this.muted=false;this.lastImpact=0;try{this.muted=localStorage.getItem('jiuji.audio.muted')==='1';}catch{}}
  unlock(){try{if(!this.ctx){const Audio=window.AudioContext||window.webkitAudioContext;if(Audio){this.ctx=new Audio();this.master=this.ctx.createGain();this.filter=this.ctx.createBiquadFilter();this.filter.type='lowpass';this.filter.frequency.value=18000;this.master.connect(this.filter);this.filter.connect(this.ctx.destination);}}this.ctx?.resume().catch(()=>{});}catch{/* 宿主禁用音频时仍允许移动、合成与存档。 */}}
  toggle(){this.muted=!this.muted;try{localStorage.setItem('jiuji.audio.muted',this.muted?'1':'0');}catch{}this.unlock();return this.muted;}
  tone(freq,duration=.12,type='triangle',gain=.035){if(this.muted||!this.ctx||this.ctx.state!=='running')return;const t=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(freq*.55,t+duration);g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g);g.connect(this.master||this.ctx.destination);o.start(t);o.stop(t+duration);}
  success(){this.tone(480,.16,'sine',.03);}
  ambient(s){
    if(this.muted||!this.ctx||this.ctx.state!=='running'||s.time<(this.nextAmbient||0))return;this.nextAmbient=s.time+4.5;
    const night=s.time%300>=230,nearFire=s.buildings.some(b=>b.type==='campfire'&&b.fuel>0&&Math.hypot(b.x-s.player.x,b.y-s.player.y)<200);
    try{if(night){this.tone(2300,.045,'sine',.004);this.tone(3100,.06,'sine',.003);}else this.tone(1450+Math.sin(s.time)*240,.1,'sine',.004);
      if(nearFire)this.tone(95,.08,'triangle',.005);
      if(s.rural?.lastRainAt&&s.time-s.rural.lastRainAt<1)this.tone(360,.2,'triangle',.004);
    }catch{/* 环境声异常不影响画面和操作。 */}
  }
  update(s,active=true){
    if(this.ctx&&this.filter){const gap=active?Math.min(600,...s.enemies.filter(e=>e.kind==='devourer'&&e.hp>0).map(e=>Math.hypot(e.x-s.player.x,e.y-s.player.y))):600,weight=Math.max(0,1-gap/500);this.filter.frequency.setTargetAtTime(18000-weight*16700,this.ctx.currentTime,.18);}
    if(!active)return;this.ambient(s);
    if(!this.muted&&this.ctx?.state==='running')for(const e of s.enemies){if(e.kind!=='boneboar'||Math.hypot(e.x-s.player.x,e.y-s.player.y)>340)continue;const ev=e.visualEvent;if(ev?.kind==='impact'&&s.time-ev.at<.25&&this.lastBoarImpact!==ev.at){this.lastBoarImpact=ev.at;this.tone(430,.12,'triangle',.014);this.tone(1070,.08,'sine',.008);}else if(e.state==='stalk'&&s.time>(this.nextHoof||0)){this.nextHoof=s.time+.5;this.tone(165,.045,'triangle',.007);}}
    const hit=s.wilderness.impact;if(!hit||hit.id===this.lastImpact)return;this.lastImpact=hit.id;if(s.time-hit.at>.2)return;this.tone(hit.type==='tree'?150:['rock','ore','crystal'].includes(hit.type)?740:280,.13,hit.type==='tree'?'triangle':'sine');}
}
