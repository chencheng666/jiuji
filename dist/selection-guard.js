// 游戏区域的长按用于操作，不触发系统选字；真正的输入框仍可编辑。
export function bindSelectionGuard(doc){
 const editable=target=>!!target?.closest?.('input,textarea,[contenteditable="true"],[contenteditable=""]');
 const prevent=e=>{if(!editable(e.target))e.preventDefault();};
 // 捕获阶段统一拦截，弹窗或按钮自己的事件处理不会漏掉选字保护。
 doc.addEventListener('selectstart',prevent,true);
 doc.addEventListener('contextmenu',prevent,true);
 doc.addEventListener('dragstart',prevent,true);
 doc.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.code==='KeyA'&&!editable(e.target))e.preventDefault();});
}
