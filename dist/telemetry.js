// 默认关闭。只传匿名编号、地图阶段、版本、设备与前台有效时间，不上传存档和坐标。
export class GameTelemetry {
 constructor({storage,send,now=()=>performance.now(),uuid=()=>crypto.randomUUID(),enabledHost=true,entry='game'}){
  Object.assign(this,{storage,send,now,uuid,enabledHost,entry});this.session=uuid();this.seq=0;this.activeMs=0;this.pendingMs=0;this.last=now();this.context=null;this.busy=false;this.generation=0;this.consent=this.read('jiuji.analytics.consent')==='yes';this.token=this.read('jiuji.analytics.token')||'';
 }
 read(key){try{return this.storage.getItem(key);}catch{return null;}}
 store(key,value){try{this.storage.setItem(key,value);}catch{}}
 setConsent(value){this.generation++;this.consent=!!value;this.store('jiuji.analytics.consent',value?'yes':'no');this.session=this.uuid();this.seq=0;this.activeMs=0;this.pendingMs=0;this.last=this.now();this.context=null;if(!value){this.token='';try{this.storage.removeItem('jiuji.analytics.token');}catch{}}}
 update(s,playing,visible){const t=this.now(),delta=Math.max(0,Math.min(1000,t-this.last));this.last=t;if(!this.consent||!this.enabledHost)return;const key=s.expedition.current+':'+s.level;if(this.context!==null&&this.context!==key)this.flush();this.context=key;this.nextContext={battleId:'journey-'+key.replace(':','-')+'-'+this.session,mapId:s.expedition.current,faction:'level-'+s.level,mode:'survival'};if(playing&&visible){this.activeMs+=delta;this.pendingMs+=delta;}this.playing=playing;this.visible=visible;}
 async flush(){if(!this.consent||!this.enabledHost||this.busy)return false;this.busy=true;const generation=this.generation;
  const body={consent:true,token:this.token,sessionId:this.session,seq:++this.seq,activeMs:Math.floor(this.activeMs),visible:!!this.visible,playing:!!this.playing,version:'1.1.0',entry:this.entry,context:this.nextContext||null};
  try{const result=await this.send(body);if(generation!==this.generation||!this.consent)return false;if(result.token){this.token=result.token;this.store('jiuji.analytics.token',this.token);}this.pendingMs=0;return true;}catch{return false;}finally{this.busy=false;}
 }
}
export function browserTelemetry(){
 const desktop=location.protocol==='tauri:'||location.hostname==='tauri.localhost';
 const official=location.origin==='https://www.daguojueqi.site',pages=location.origin==='https://chencheng666.github.io';
 const enabledHost=official||pages||desktop;
 return new GameTelemetry({storage:localStorage,enabledHost,entry:desktop?'desktop':'game',send:async body=>{const response=await fetch('https://www.daguojueqi.site/api/jiuji/telemetry',{method:'POST',headers:{'Content-Type':'text/plain'},credentials:'omit',body:JSON.stringify(body),signal:AbortSignal.timeout(8000)});if(!response.ok)throw Error('统计暂时不可用');return response.json();}});
}
