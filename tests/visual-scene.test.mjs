import test from 'node:test';
import assert from 'node:assert/strict';
import {SceneArt,visualBudget,visualHash,drawTraveler,drawLivingGround,drawActionMotes,drawPond,drawDeviceLife} from '../dist/visual-scene.js';
import {createOdysseyGame} from '../dist/survival.js';
function context(){const calls=[];return new Proxy({calls},{get(o,k){if(k in o)return o[k];return(...args)=>calls.push([k,...args]);}});}
function create(){const c=context();return{width:0,height:0,getContext:()=>c};}
function freeze(o){if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;}
test('程序模型按确定种子复用，季节和画质切换有硬性内存上限',()=>{
 const made=[],art=new SceneArt({mobile:true,create:()=>{const v=create();made.push(v);return v;}}),b=visualBudget(true),first=art.model('tree',0,0,b);
 assert.equal(art.model('tree',0,0,b),first);assert.equal(visualHash('树-101'),visualHash('树-101'));assert.notEqual(visualHash('树-101'),visualHash('树-102'));
 for(const quality of ['auto','clear','smooth'])for(let season=0;season<4;season++)for(const type of ['tree','rock','ore','crystal','bush','chest','table','campfire','robotdock'])for(let v=0;v<3;v++){const budget=visualBudget(true,quality);art.model(type,v,season,budget);assert.ok(art.bytes<=budget.cacheBytes);}
 art.clear();assert.equal(first.width,0);assert.equal(art.bytes,0);assert.ok(made.every(c=>c.width===0));
});
test('画布分配或上下文失败仅回退旧精灵，同一失败模型不反复分配',()=>{
 for(const create of [()=>{throw Error('设备内存不足');},()=>({getContext:()=>null})]){let count=0;const art=new SceneArt({create:()=>{count++;return create();}}),s=createOdysseyGame();const n=s.nodes.find(n=>n.type==='tree');const view={quality:'auto',mobile:false,reducedMotion:false};assert.equal(art.draw(context(),n,s,view,145),false);assert.equal(art.draw(context(),n,s,view,145),false);assert.equal(count,1);assert.equal(art.bytes,0);art.clear();assert.equal(art.blocked.size,0);}
});
test('场景、角色和特效绘制不改时间、物资、命中或存档，四方向均可绘制',()=>{
 const s=createOdysseyGame();s.action={id:s.nodes.find(n=>n.type==='tree').id,elapsed:.4,duration:1};s.expedition.shot={at:0,until:1,duration:1,x:0,y:0,tx:10,ty:10};s.time=.4;const view={mobile:false,quality:'auto',reducedMotion:false,particles:true,w:1500,h:748};
 for(const direction of ['front','back','left','right']){s.player.direction=direction;const state=freeze(structuredClone(s)),before=JSON.stringify(state),c=context();drawTraveler(c,state,view);drawLivingGround(c,state,view,0,0,1);drawActionMotes(c,state,view);drawPond(c,state,{x:10,y:10});drawDeviceLife(c,state,{type:'campfire',fuel:10,x:0,y:0},view);assert.equal(JSON.stringify(state),before);assert.ok(c.calls.length>0);}
});
test('减少动态、关闭粒子和流畅档真正限制环境绘制',()=>{
 assert.equal(visualBudget(true,'auto',true).ambient,0);assert.ok(visualBudget(true).ambient<visualBudget(false).ambient);assert.ok(visualBudget(true,'smooth').density<visualBudget(true).density);
 const s=createOdysseyGame();for(const view of [{reducedMotion:true,particles:true},{reducedMotion:false,particles:false}]){const c=context();drawLivingGround(c,s,view,0,0,1);drawActionMotes(c,s,view);drawDeviceLife(c,s,{type:'crystal'},view);assert.equal(c.calls.length,0);}
});
