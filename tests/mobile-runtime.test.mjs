import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {SurvivalAudio} from '../dist/audio.js';
import {WorldView} from '../dist/world.js';

const bootCode=readFileSync(new URL('../dist/boot.js',import.meta.url),'utf8');
function bootEnvironment(){
 const events=new Map(),frames=[],style=new Map(),texts={p:{},small:{}},boot={hidden:false,querySelector:k=>texts[k]};
 const button={addEventListener:(name,fn)=>button[name]=fn};
 const env={document:{querySelector:k=>k==='#boot'?boot:button,documentElement:{style:{setProperty:(k,v)=>style.set(k,v)}}},innerHeight:324,
  visualViewport:{height:312,scale:1,addEventListener:(name,fn)=>events.set('viewport:'+name,fn)},
  addEventListener:(name,fn)=>events.set(name,fn),dispatchEvent:event=>events.get(event.type)?.(event),Event:class{constructor(type){this.type=type;}},
  requestAnimationFrame:fn=>{frames.push(fn);return frames.length;},setTimeout:fn=>{env.timeout=fn;return 1;},clearTimeout:()=>{},location:{reload:()=>env.reloaded=true}};
 env.window=env;vm.createContext(env);vm.runInContext('delete Object.hasOwn; delete Array.prototype.at;',env);vm.runInContext(bootCode,env);
 return{env,events,frames,boot,texts,style,button};
}

test('旧内置浏览器缺少 hasOwn 和 at 时，首次创建世界及点击移动仍可运行',()=>{
 const {env}=bootEnvironment();
 assert.equal(vm.runInContext('Object.hasOwn({x:1},"x")',env),true);
 assert.equal(vm.runInContext('Object.hasOwn(Object.create({x:1}),"x")',env),false);
 assert.equal(vm.runInContext('[1,2].at(-1)',env),2);
 assert.equal(vm.runInContext('[1,2].at(Infinity)',env),undefined);
 assert.equal(vm.runInContext('[1,2].at(-3)',env),undefined);
});

test('不足420像素的宿主横屏使用实际高度，切屏更新且放大阅读不改变布局',()=>{
 const {env,events,frames,style}=bootEnvironment();assert.equal(style.get('--game-height'),'312px');
 env.visualViewport.height=280;events.get('viewport:resize')();frames.shift()();assert.equal(style.get('--game-height'),'280px');
 env.visualViewport.scale=2;env.innerHeight=350;events.get('resize')();frames.shift()();assert.equal(style.get('--game-height'),'350px');
});

test('首帧成功才隐藏加载层；脚本故障保留重试入口且不清除存档',()=>{
 const {env,events,boot,texts,button}=bootEnvironment();assert.equal(boot.hidden,false);
 env.timeout();assert.match(texts.small.textContent,/存档不会被清除/);
 events.get('error')({target:{tagName:'IMG'}});assert.equal(texts.p.textContent,undefined);
 events.get('error')({error:Error('不支持的接口')});assert.match(texts.p.textContent,/没能启动/);
 events.get('jiuji:ready')();assert.equal(boot.hidden,true);
 events.get('error')({error:Error('绘图失败')});assert.equal(boot.hidden,false);assert.match(texts.p.textContent,/暂停/);
 button.click();assert.equal(env.reloaded,true);
});

test('缺少 randomUUID 甚至 crypto 时，默认关闭的统计不会阻断启动',()=>{
 const code=readFileSync(new URL('../dist/telemetry.js',import.meta.url),'utf8').replaceAll('export ','');
 for(const crypto of [undefined,{getRandomValues:bytes=>bytes.fill(5)}]){
  const context={crypto,performance:{now:()=>0}};vm.createContext(context);
  vm.runInContext(code+'\nthis.instance=new GameTelemetry({storage:{getItem:()=>null},send:()=>{throw Error("不应上报");}});',context);
  assert.match(context.instance.session,/^[a-f0-9]{32}$/);assert.equal(context.instance.consent,false);
 }
});

test('宿主禁用音频不会阻断游戏交互',()=>{
 const previous=globalThis.window;globalThis.window={AudioContext:class{constructor(){throw Error('音频被宿主禁用');}}};
 try{const audio=new SurvivalAudio();assert.doesNotThrow(()=>audio.unlock());assert.doesNotThrow(()=>audio.toggle());}finally{globalThis.window=previous;}
});

test('低内存设备地形保持逻辑坐标与点击位置，换图主动释放旧画布',()=>{
 const previousWindow=globalThis.window,previousDocument=globalThis.document;
 const draws=[],canvases=[];
 const ctx=new Proxy({drawImage:(...args)=>draws.push(args),measureText:()=>({width:10})},{get:(target,k)=>target[k]??(()=>{}),set:(target,k,v)=>(target[k]=v,true)});
 globalThis.window={innerWidth:720,innerHeight:324,devicePixelRatio:3,matchMedia:()=>({matches:true})};
 globalThis.document={createElement:()=>{const c={width:0,height:0,getContext:()=>ctx};canvases.push(c);return c;}};
 const previousImage=globalThis.Image;globalThis.Image=class{};
 try{
  const view=new WorldView({getContext:()=>ctx,getBoundingClientRect:()=>({width:720,height:324})});
  assert.equal(view.terrain.width,1800);assert.equal(view.terrain.height,1400);assert.equal(view.canvas.width,1080);
  const original=view.terrain;view.makeTerrain('cinder');assert.equal(original.width,0);assert.equal(original.height,0);
  assert.equal(view.terrain.width,1800);assert.deepEqual(view.toWorld(view.w/2,view.h/2),view.camera);
 }finally{globalThis.window=previousWindow;globalThis.document=previousDocument;globalThis.Image=previousImage;}
});
