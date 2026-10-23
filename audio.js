// 音效由浏览器实时合成，仅在玩家交互后启动，不请求外部音频。
export class SurvivalAudio {
  constructor(){this.muted=false;this.lastImpact=0;try{this.muted=localStorage.getItem('jiuji.audio.muted')==='1';}catch{}}
  unlock(){if(!this.ctx){const Audio=window.AudioContext||window.webkitAudioContext;if(Audio)this.ctx=new Audio();}this.ctx?.resume().catch(()=>{});}
  toggle(){this.muted=!this.muted;try{localStorage.setItem('jiuji.audio.muted',this.muted?'1':'0');}catch{}this.unlock();return this.muted;}
  tone(freq,duration=.12,type='triangle',gain=.035){if(this.muted||!this.ctx||this.ctx.state!=='running')return;const t=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(freq*.55,t+duration);g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g);g.connect(this.ctx.destination);o.start(t);o.stop(t+duration);}
  success(){this.tone(480,.16,'sine',.03);}
  update(s){const hit=s.wilderness.impact;if(!hit||hit.id===this.lastImpact)return;this.lastImpact=hit.id;if(s.time-hit.at>.2)return;this.tone(hit.type==='tree'?150:['rock','ore','crystal'].includes(hit.type)?740:280,.13,hit.type==='tree'?'triangle':'sine');}
}
