import test from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../dist/survival.js';
import {TREE_SPECIES,treeProfile,treeName,treeMetrics,treeHit,treeVisible,treeOcclusion,treeSeason,initTreeSpecies,plantingSpecies} from '../dist/tree-species.js';
import {TreeArt} from '../dist/tree-art.js';
import {SceneArt} from '../dist/visual-scene.js';
const context=()=>new Proxy({calls:[]},{get(o,k){if(k in o)return o[k];return(...args)=>o.calls.push([k,...args]);}});
const factory=()=>({width:0,height:0,getContext:()=>context()});
function freeze(o){if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;}
test('十二种林木进入新地图，固定种子重复生成一致，不改变游戏随机数或资源产出',()=>{
 assert.equal(Object.keys(TREE_SPECIES).length,12);const a=G.createOdysseyGame(410),b=G.createOdysseyGame(410),trees=a.nodes.filter(n=>n.type==='tree');assert.deepEqual(trees,b.nodes.filter(n=>n.type==='tree'));assert.ok(new Set(trees.map(n=>n.treeSpecies)).size>=9);
 const rng=a.rng,before=G.serialize(a);initTreeSpecies(a);assert.equal(G.serialize(a),before);assert.equal(a.rng,rng);assert.deepEqual(G.NODES.tree.drop,{wood:4,twig:1,seed:1});
 const nodeCount=a.nodes.length;const r=G.enterRiftRealm(a,'frost');assert.ok(r.ok);assert.ok(a.nodes.filter(n=>n.type==='tree').every(n=>['pine','fir','birch','aspen'].includes(n.treeSpecies)));assert.ok(G.enterRiftRealm(a,'home').ok);assert.equal(a.nodes.length,nodeCount);assert.deepEqual(a.nodes.filter(n=>n.type==='tree'),trees);
});
test('旧档当前与离线地图稳定补齐树种，保留坐标、采空和树苗计时，非法树种拒绝导入',()=>{
 const s=G.createOdysseyGame(410);G.enterRiftRealm(s,'frost');const maps=[s,...Object.values(s.expedition.worlds)];for(const m of maps)for(const n of m.nodes)delete n.treeSpecies;
 const tree=s.nodes.find(n=>n.type==='tree');Object.assign(tree,{available:false,hp:0,respawnAt:0});const expected=maps.map(m=>m.nodes.filter(n=>n.type==='tree').map(n=>({id:n.id,x:n.x,y:n.y,hp:n.hp,available:n.available,respawnAt:n.respawnAt}))),rng=s.rng;
 const a=G.parseSave(G.serialize(s)),b=G.parseSave(G.serialize(s));assert.equal(a.rng,rng);assert.deepEqual(a.nodes,b.nodes);assert.deepEqual([a,...Object.values(a.expedition.worlds)].map(m=>m.nodes.filter(n=>n.type==='tree').map(n=>({id:n.id,x:n.x,y:n.y,hp:n.hp,available:n.available,respawnAt:n.respawnAt}))),expected);
 a.nodes.find(n=>n.type==='tree').treeSpecies='不存在的树';assert.throws(()=>G.parseSave(G.serialize(a)),/树种/);
});
test('种苗继承附近成熟林木的树种，长成后保持树种与生态、共鸣规则',()=>{
 const s=G.createOdysseyGame(410);s.nodes=[];s.buildings=[];const p=s.player;s.nodes.push({id:'mother',type:'tree',treeSpecies:'maple',x:p.x-100,y:p.y,hp:3,available:true,respawnAt:0});s.inventory.seed=2;
 assert.equal(plantingSpecies(s,p.x+55,p.y),'maple');const eco=s.ecology,res=s.resonance;assert.ok(G.plant(s,p.x+55,p.y).ok);const sapling=s.nodes.at(-1);assert.equal(sapling.treeSpecies,'maple');assert.equal(s.stats.planted,1);assert.equal(s.ecology,eco+3);
 s.time=sapling.respawnAt;G.step(s,.05);assert.equal(sapling.sapling,false);assert.equal(sapling.treeSpecies,'maple');assert.equal(s.resonance,res+1);assert.equal(treeName(sapling,s),'血纹枫');
});
test('分树种季节：枫红、银杏金，松杉与黑檀常绿，落叶树冬季露枝',()=>{
 for(const id of Object.keys(TREE_SPECIES)){assert.equal(treeSeason(id,3).bare,!TREE_SPECIES[id].evergreen);assert.equal(treeSeason(id,3).snow,true);}
 assert.deepEqual(treeSeason('pine',2).leaf,TREE_SPECIES.pine.leaf);assert.deepEqual(treeSeason('maple',2).leaf,TREE_SPECIES.maple.autumn);assert.notDeepEqual(treeSeason('maple',2).leaf,treeSeason('ginkgo',2).leaf);
});
test('树冠点击、遮挡和屏幕裁剪跟随树种尺寸，树苗不遮住人物',()=>{
 const s=G.createGame(),n={id:'a',type:'tree',treeSpecies:'oak',x:600,y:600},b=treeMetrics(n,s);
 assert.ok(treeHit(n,{x:n.x,y:n.y-b.height*.6},s));assert.ok(!treeHit(n,{x:n.x+b.width,y:n.y},s));assert.ok(treeVisible(n,s,600+b.width*.4,400,300,200));
 assert.equal(treeOcclusion(n,{x:600,y:550},s),.38);assert.equal(treeOcclusion(n,{x:600,y:650},s),1);assert.equal(treeOcclusion({...n,sapling:true},{x:600,y:550},s),1);
 assert.ok(treeMetrics({...n,treeSpecies:'fir'},s).height>treeMetrics({...n,treeSpecies:'jujube'},s).height);assert.equal(treeProfile(n,s).id,'oak');
});
test('多树种、季节和密度反复切换有硬缓存上限，被淘汰与清空的两层画布真正释放',()=>{
 const made=[],art=new TreeArt({create:()=>{const c=factory();made.push(c);return c;}}),budget={density:1,cacheBytes:500000},first=art.model('birch',0,0,budget);
 assert.equal(art.model('birch',0,0,budget),first);
 for(const id of Object.keys(TREE_SPECIES))for(let si=0;si<4;si++){art.model(id,1,si,budget);assert.ok(art.bytes<=budget.cacheBytes);}
 assert.equal(first.trunk.width,0);assert.equal(first.crown.width,0);art.clear();assert.equal(art.bytes,0);assert.ok(made.every(c=>!c.width&&!c.height));
});
test('所有树种四季在手机与减少动态下只读状态，绘制坐标有效；分配失败回退不反复尝试',()=>{
 const art=new SceneArt({create:factory}),s=G.createGame(),node={id:'draw',type:'tree',x:s.player.x,y:s.player.y};
 for(const id of Object.keys(TREE_SPECIES))for(let si=0;si<4;si++){s.time=si*1200+50;const state=freeze(structuredClone(s)),before=G.serialize(state),c=context();art.draw(c,{...node,treeSpecies:id},state,{mobile:true,reducedMotion:si%2===0},145);assert.equal(G.serialize(state),before);for(const[name,...args]of c.calls)for(const arg of args)if(typeof arg==='number')assert.ok(Number.isFinite(arg),name);assert.ok(art.bytes<=8*1024*1024);}
 let attempts=0;const failed=new TreeArt({create:()=>{attempts++;throw Error('内存不足');}});assert.equal(failed.model('willow',0,0),null);assert.equal(failed.model('willow',0,0),null);assert.equal(attempts,1);
});
