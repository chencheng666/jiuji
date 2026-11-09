import test from 'node:test';
import assert from 'node:assert/strict';
import {readControls,normalizeControls,bindStick,CONTROL_DEFAULTS} from '../dist/device-controls.js';

test('设备设置损坏、被禁用或不存在时仍可开始游戏',()=>{
 for(const raw of ['bad','null','[]','{}'])assert.deepEqual(readControls({getItem:()=>raw}),CONTROL_DEFAULTS);
 assert.deepEqual(readControls({getItem(){throw new Error('禁用存储');}}),CONTROL_DEFAULTS);
 const before=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 try{Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw new Error('隐私模式');}});assert.deepEqual(readControls(),CONTROL_DEFAULTS);}
 finally{if(before)Object.defineProperty(globalThis,'localStorage',before);else delete globalThis.localStorage;}
 assert.deepEqual(normalizeControls({size:100,opacity:0,fps:100,ability:'不存在',leftHanded:1}),CONTROL_DEFAULTS);
 const selected={size:1.15,opacity:.6,fps:30,ability:'return',leftHanded:true,reducedMotion:true,particles:false};
 assert.deepEqual(readControls({getItem:()=>JSON.stringify(selected)}),selected);
});

test('摇杆限制幅度并忽略第二触点，取消、失焦和进入后台立即停止移动',()=>{
 const events=()=>{const map={};return{map,addEventListener:(name,fn)=>map[name]=fn};};
 const el={...events(),style:{setProperty(){}},getBoundingClientRect:()=>({left:0,top:0,width:100,height:100}),setPointerCapture(){}};
 const oldWindow=globalThis.window,oldDocument=globalThis.document,values=[];
 try{
  globalThis.window=events();globalThis.document={...events(),hidden:false};
  bindStick(el,v=>values.push(v));
  const pointer=(pointerId,x=100,y=50)=>({pointerId,clientX:x,clientY:y,preventDefault(){}});
  el.map.pointerdown(pointer(1));assert.deepEqual(values.at(-1),{x:1,y:0});
  const count=values.length;el.map.pointerdown(pointer(2,0));assert.equal(values.length,count);
  el.map.pointermove(pointer(1,52,51));assert.deepEqual(values.at(-1),{x:0,y:0});
  el.map.pointermove(pointer(1,300,300));assert.ok(Math.hypot(values.at(-1).x,values.at(-1).y)<=1);
  el.map.pointercancel(pointer(1));assert.deepEqual(values.at(-1),{x:0,y:0});
  el.map.pointerdown(pointer(3));globalThis.window.map.blur();assert.deepEqual(values.at(-1),{x:0,y:0});
  el.map.pointerdown(pointer(4));globalThis.document.hidden=true;globalThis.document.map.visibilitychange();assert.deepEqual(values.at(-1),{x:0,y:0});
 }finally{if(oldWindow===undefined)delete globalThis.window;else globalThis.window=oldWindow;if(oldDocument===undefined)delete globalThis.document;else globalThis.document=oldDocument;}
});
