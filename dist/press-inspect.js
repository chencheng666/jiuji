// 单击仍走近，触屏长按才查看详情；滑动、第二触点和失焦取消，不吞摇杆事件。
export function bindWorldPress(element,{tap,hold,canHold=()=>true},env=globalThis){
 let press=null,ignoreClickAt=null;const now=()=>env.performance?.now?.()??Date.now();
 const cancel=()=>{if(press?.timer)env.clearTimeout(press.timer);press=null;};
 element.addEventListener('pointerdown',e=>{
  if(e.button!==0)return;e.preventDefault();
  if(e.pointerType!=='touch'){tap(e);return;}
  if(press){cancel();return;}
  const p={id:e.pointerId,x:e.clientX,y:e.clientY,held:false,moved:false,event:e};press=p;element.setPointerCapture?.(e.pointerId);
  if(canHold(e))p.timer=env.setTimeout(()=>{if(press!==p||p.moved)return;p.held=true;ignoreClickAt=now();hold(p.event);},500);
 });
 element.addEventListener('pointermove',e=>{if(press&&e.pointerId===press.id&&Math.hypot(e.clientX-press.x,e.clientY-press.y)>12){press.moved=true;env.clearTimeout(press.timer);}});
 element.addEventListener('pointerup',e=>{if(!press||e.pointerId!==press.id)return;const p=press;cancel();if(p.held)ignoreClickAt=now();else if(!p.moved)tap(e);});
 for(const name of['pointercancel','lostpointercapture'])element.addEventListener(name,cancel);
 env.addEventListener?.('blur',cancel);env.document?.addEventListener('visibilitychange',()=>{if(env.document.hidden)cancel();});
 // 长按弹窗后松手的兼容 click 可能落到新按钮上，不能因此误点追踪或交付。
 env.document?.addEventListener('click',e=>{if(ignoreClickAt!==null&&now()-ignoreClickAt<800&&e.detail!==0){ignoreClickAt=null;e.preventDefault();e.stopImmediatePropagation();}},true);
 env.document?.addEventListener('pointerdown',()=>{ignoreClickAt=null;},true);
 return cancel;
}
