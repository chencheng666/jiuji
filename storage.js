// 双份存档：先保留上一份可读取记录，再替换主存档。
export function loadProgress(storage,key,oldKeys,parse){
 let damaged=false;
 for(const candidate of [key,key+'.backup',...oldKeys]){
  try{const raw=storage.getItem(candidate);if(!raw)continue;return {state:parse(raw),recovered:candidate===key+'.backup',migrated:oldKeys.includes(candidate)};}catch{damaged=true;}
 }
 return {state:null,damaged};
}
export function storeProgress(storage,key,raw,parse){
 const previous=storage.getItem(key);
 if(previous===raw)return;
 if(previous){let valid=false;try{parse(previous);valid=true;}catch{}if(valid)storage.setItem(key+'.backup',previous);}
 storage.setItem(key,raw);
}
