// 音效由浏览器实时合成，仅在玩家交互后启动，不请求外部音频。
export class SurvivalAudio {
  constructor(){this.muted=false;this.lastImpact=0;try{this.muted=localStorage.getItem('jiuji.audio.muted')==='1';}catch{}}
  unlock(){try{if(!this.ctx){const Audio=window.AudioContext||window.webkitAudioContext;if(Audio)this.ctx=new Audio();}this.ctx?.resume().catch(()=>{});}catch{/* 宿主禁用音频时仍允许移动、合成与存档。 */}}
  toggle(){this.muted=!this.muted;try{localStorage.setItem('jiuji.audio.muted',this.muted?'1':'0');}catch{}this.unlock();return this.muted;}
  tone(freq,duration=.12,type='triangle',gain=.035){if(this.muted||!this.ctx||this.ctx.state!=='running')return;const t=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(freq*.55,t+duration);g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g);g.connect(this.ctx.destination);o.start(t);o.stop(t+duration);}
  success(){this.tone(480,.16,'sine',.03);}
  ambient(s){
    if(this.muted||!this.ctx||this.ctx.state!=='running'||s.time<(this.nextAmbient||0))return;this.nextAmbient=s.time+4.5;
    const night=s.time%300>=230,nearFire=s.buildings.some(b=>b.type==='campfire'&&b.fuel>0&&Math.hypot(b.x-s.player.x,b.y-s.player.y)<200);
    try{if(night){this.tone(2300,.045,'sine',.004);this.tone(3100,.06,'sine',.003);}else this.tone(1450+Math.sin(s.time)*240,.1,'sine',.004);
      if(nearFire)this.tone(95,.08,'triangle',.005);
      if(s.rural?.lastRainAt&&s.time-s.rural.lastRainAt<1)this.tone(360,.2,'triangle',.004);
    }catch{/* 环境声异常不影响画面和操作。 */}
  }
  update(s,active=true){if(!active)return;this.ambient(s);const hit=s.wilderness.impact;if(!hit||hit.id===this.lastImpact)return;this.lastImpact=hit.id;if(s.time-hit.at>.2)return;this.tone(hit.type==='tree'?150:['rock','ore','crystal'].includes(hit.type)?740:280,.13,hit.type==='tree'?'triangle':'sine');}
}
