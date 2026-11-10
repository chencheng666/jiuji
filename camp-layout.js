// 建筑组合只取一份加成；预览、生产与取料使用同一套距离规则。
export const CAMP_COMBOS=[
 {id:'sheltered',name:'庇护区',target:'shelter',partner:'campfire',range:150,lit:true,text:'庇护所内衣物晾干速度 +50%'},
 {id:'processing',name:'加工区',target:'dryingrack',partner:'campfire',range:155,lit:true,text:'晾晒速度 +25%，不增加产物'},
 {id:'storage',name:'储物区',target:'chest',partner:'fielddesk',range:150,text:'此箱合成取料范围 180 → 220 步'}
];
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function buildingLinks(s,b,{preview=false}={}){
 return CAMP_COMBOS.filter(d=>d.target===b.type).flatMap(d=>{
  const partner=s.buildings.filter(p=>p.id!==b.id&&p.type===d.partner&&dist(p,b)<=d.range).sort((a,c)=>(d.lit?Number(c.fuel>0)-Number(a.fuel>0):0)||dist(a,b)-dist(c,b))[0];
  return partner?[{...d,partner,active:!d.lit||partner.fuel>0,preview}]:[];
 });
}
export function layoutPreview(s,b){
 const projected={...b,id:'placement-preview'},next={...s,buildings:[...s.buildings,projected]},links=buildingLinks(next,projected,{preview:true});
 for(const other of s.buildings)for(const link of buildingLinks(next,other,{preview:true}))if(link.partner.id===projected.id)links.push({...link,target:other});
 return links.filter((v,i,a)=>a.findIndex(o=>o.id===v.id)===i);
}
export const layoutMultiplier=(s,b,id)=>buildingLinks(s,b).some(d=>d.id===id&&d.active)?id==='sheltered'?1.5:1.25:1;
export const craftStorageRange=(s,b)=>b.type==='chest'&&buildingLinks(s,b).some(d=>d.id==='storage')?220:180;
