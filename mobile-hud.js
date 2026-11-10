// 手记展开偏好属于设备；读档不会把手机界面强行展开。
export function initMobileHUD(doc,win){
 const quest=doc.querySelector('#quest'),toggle=doc.querySelector('#quest-toggle');
 const compact=win.matchMedia('(max-width:650px), (max-height:560px) and (max-width:1280px), (pointer:coarse)');
 let preference=null;
 try{const value=win.localStorage.getItem('jiuji.ui.quest');if(value==='open'||value==='closed')preference=value;}catch{/* 存储受限时仍可收起。 */}
 let open=preference?preference==='open':!compact.matches;
 function render(){doc.body.classList.toggle('compact-hud',compact.matches);doc.body.classList.toggle('quest-open',open);quest.hidden=!open;toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'收起荒野手记':'展开荒野手记');toggle.querySelector('span').textContent=open?'收起手记':'荒野手记';}
 doc.addEventListener('click',e=>{const button=e.target.closest('[data-ui="quest-toggle"]');if(!button)return;open=!open;preference=open?'open':'closed';try{win.localStorage.setItem('jiuji.ui.quest',preference);}catch{/* 不影响当前操作。 */}render();});
 doc.addEventListener('click',e=>{if(!compact.matches)return;if(e.target.closest('#camp-toolbar-toggle')){const expanded=doc.querySelector('#camp-toolbar-toggle').getAttribute('aria-expanded')==='true';doc.body.classList.toggle('camp-open',expanded);if(expanded){open=false;preference='closed';try{win.localStorage.setItem('jiuji.ui.quest','closed');}catch{}render();}}else if(e.target.closest('[data-ui="quest-toggle"]')&&open&&doc.querySelector('#camp-toolbar-toggle').getAttribute('aria-expanded')==='true')doc.querySelector('#camp-toolbar-toggle').click();});
 const adapt=()=>{if(preference===null)open=!compact.matches;render();};
 if(compact.addEventListener)compact.addEventListener('change',adapt);else compact.addListener(adapt);
 render();return{render};
}
