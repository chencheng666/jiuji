import test from 'node:test';
import assert from 'node:assert/strict';
import {renderSize,frameDue,FrameMeter} from '../dist/render-performance.js';
import {SpriteCache} from '../dist/sprite-cache.js';
import {normalizeControls} from '../dist/device-controls.js';

test('2K画质控制真实像素预算，界面逻辑尺寸不变，非法设置回均衡',()=>{
 const balanced=renderSize(2560,1440,2,false,'auto'),clear=renderSize(2560,1440,2,false,'clear'),smooth=renderSize(2560,1440,2,false,'smooth');
 assert.ok(balanced.width*balanced.height<=2500000);assert.ok(clear.width>balanced.width);assert.ok(balanced.width>smooth.width);
 for(const [w,h]of [[390,844],[844,390],[2560,1440]])for(const quality of ['auto','clear','smooth']){const size=renderSize(w,h,4,true,quality);assert.ok(size.width*size.height<=(quality==='smooth'?900000:1500000));assert.ok(Math.abs(size.width/size.height-w/h)<.02);}
 assert.equal(normalizeControls({quality:'invalid'}).quality,'auto');assert.equal(normalizeControls({quality:'clear'}).quality,'clear');
});

test('60帧节拍在60/90/120Hz和小幅抖动下不持续降成30帧，迟到后不连绘补帧',()=>{
 for(const hz of [60,90,120]){let last=0,count=0;for(let i=1;i<=hz*10;i++){const at=i*1000/hz+(i%2?.15:-.15),due=frameDue(at,last,60);if(due!==null){last=due;count++;}}assert.ok(count>=598&&count<=600,`${hz}Hz: ${count}`);}
 const last=frameDue(1005,0,60);assert.ok(last<=1005.5);assert.equal(frameDue(1006,last,60),null);
});

test('绘制统计按实际帧间隔计算，暂停不计时，不用CPU耗时冒充FPS',()=>{
 const meter=new FrameMeter();for(let i=0;i<61;i++)meter.add(i*1000/60,2);assert.equal(meter.summary().fps,60);assert.equal(meter.summary().cpuP95,2);
 meter.pause();meter.add(30000,1);assert.equal(meter.summary().fps,60);for(let i=1;i<=210;i++)meter.add(30000+i*1000/30,3);assert.equal(meter.samples.length,180);assert.equal(meter.summary().fps,30);meter.add(45000,4);assert.ok(meter.samples.at(-1).gap>2000);assert.ok(meter.summary().fps<30);
});

function fakeCanvas(){return{width:0,height:0,getContext:()=>({drawImage(){}})};}
test('同一精灵相邻尺寸复用缓冲，透明度不占缓存；LRU释放旧像素并守住预算',()=>{
 const made=[],cache=new SpriteCache({budget:50000,create:()=>{const c=fakeCanvas();made.push(c);return c;}}),im={complete:true,naturalWidth:100};
 const a=cache.get('tree',im,48,1);assert.equal(cache.get('tree',im,47,1),a);assert.equal(cache.hits,1);
 cache.get('rock',im,48,1);cache.get('ore',im,48,1);cache.get('tree',im,48,1);cache.get('flower',im,48,1);cache.get('bush',im,48,1);
 assert.ok(cache.bytes<=50000);assert.equal(made[1].width,0);assert.ok(a.width>0);cache.clear();assert.equal(cache.bytes,0);assert.ok(made.every(c=>c.width===0));
});

test('未加载图片、超大精灵和缓冲创建失败回退原图，不缓存空白',()=>{
 let creates=0;const im={complete:false,naturalWidth:0},cache=new SpriteCache({budget:1024,create:()=>{creates++;throw Error('内存不足');}});assert.equal(cache.get('x',im,10),im);im.complete=true;im.naturalWidth=80;assert.equal(cache.get('x',im,1000),im);assert.equal(cache.get('x',im,1),im);assert.equal(cache.get('x',im,1),im);assert.equal(creates,1);assert.equal(cache.entries.size,0);
});
