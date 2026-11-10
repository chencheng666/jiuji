// 原始 SVG 只在首次遇到某个尺寸时栅格化；有上限的缓存避免长期游玩占满内存。
export class SpriteCache{
 constructor({budget=24*1024*1024,create=()=>document.createElement('canvas')}={}){this.budget=budget;this.create=create;this.entries=new Map();this.blocked=new Set();this.bytes=0;this.hits=0;this.misses=0;}
 get(name,image,width,ratio=1){
  if(!image?.complete||!image.naturalWidth)return image;
  const size=Math.max(12,Math.ceil(width/12)*12),density=Math.min(2,Math.max(.5,Math.ceil(ratio*4)/4)),key=name+':'+size+':'+density;
  if(this.blocked.has(key))return image;
  if(this.entries.has(key)){const entry=this.entries.get(key);this.entries.delete(key);this.entries.set(key,entry);this.hits++;return entry.canvas;}
  const w=Math.ceil(size*density),h=Math.ceil(size*1.25*density),bytes=w*h*4;if(bytes>this.budget)return image;
  let canvas;
  try{canvas=this.create();canvas.width=w;canvas.height=h;const c=canvas.getContext('2d');if(!c)throw Error('精灵缓冲不可用');c.drawImage(image,0,0,w,h);}catch{if(canvas){canvas.width=0;canvas.height=0;}this.blocked.add(key);return image;}
  while(this.bytes+bytes>this.budget){const [id,entry]=this.entries.entries().next().value;this.entries.delete(id);this.bytes-=entry.bytes;entry.canvas.width=0;entry.canvas.height=0;}
  this.entries.set(key,{canvas,bytes});this.bytes+=bytes;this.misses++;return canvas;
 }
 clear(){for(const {canvas} of this.entries.values()){canvas.width=0;canvas.height=0;}this.entries.clear();this.blocked.clear();this.bytes=0;}
}
