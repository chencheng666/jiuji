// 树种只扩展外观；原有木材、种子、砍伐和生态规则继续共用 tree 类型。
export const TREE_SPECIES={
 birch:{name:'灰皮桦',form:'birch',height:184,width:105,bark:'#c4c5b1',inner:'#d0b887',leaf:['#355a43','#689164','#a5ba80'],autumn:['#74613d','#ba9d50','#e5cf83'],tip:'灰白纸状树皮层层剥落，细干与稀疏三角叶形成一把灰伞。'},
 oak:{name:'铁干橡',form:'oak',height:202,width:180,bark:'#423c32',inner:'#7c6650',leaf:['#243f34','#42654b','#7e9967'],autumn:['#4c4232','#7d633e','#ae8b53'],tip:'粗干深沟、横展大枝和宽阔圆冠；叶片厚实，边缘呈波浪状。'},
 willow:{name:'垂泪柳',form:'willow',height:169,width:171,bark:'#74634c',inner:'#a08a66',leaf:['#375b3c','#73985b','#b0c77b'],autumn:['#6b6340','#a59c52','#c7be78'],tip:'瘤节树干托起细长柳条，窄叶沿垂枝一直落向地面。'},
 pine:{name:'赤鳞松',form:'pine',height:219,width:127,bark:'#9a4f39',inner:'#d68b51',leaf:['#23473d','#3f7054','#7b9867'],evergreen:true,tip:'橙红鳞片树皮、轮生横枝，深绿针簇层层收成尖塔。'},
 aspen:{name:'白骨杨',form:'aspen',height:204,width:118,bark:'#d0d3bd',inner:'#989b7c',leaf:['#2f6143','#6caa6b','#d6dfbf'],autumn:['#8a7c38','#c7b84d','#e9da8c'],tip:'光滑白干带菱形疤痕，薄叶正面翠绿、背面银白。'},
 jujube:{name:'棘刺枣',form:'jujube',height:126,width:142,bark:'#434940',inner:'#929478',leaf:['#263f2e','#4e7242','#869c5c'],autumn:['#625039','#897544','#b09c60'],tip:'低矮扭曲、多分枝，灰黑枝条交缠，间有细长直刺。'},
 maple:{name:'血纹枫',form:'maple',height:164,width:158,bark:'#75624e',inner:'#a26550',leaf:['#375b42','#6d935c','#a3b875'],autumn:['#722f38','#b7473d','#e78a50'],tip:'淡红树皮纵纹、横展垂枝，掌状五裂叶在秋季转为深红。'},
 elm:{name:'石皮榆',form:'elm',height:177,width:163,bark:'#a2997b',inner:'#d3c5a3',leaf:['#34503b','#668657','#98ac70'],autumn:['#6c633b','#a59850','#cfbd79'],tip:'扁平块状树皮如岩面起伏，小椭圆叶叠成开展的圆头冠。'},
 fir:{name:'雾冠杉',form:'fir',height:235,width:125,bark:'#7d5743',inner:'#ae8460',leaf:['#23494b','#3e6c66','#83a694'],evergreen:true,tip:'高耸直干与蓝绿针叶；大枝平展，小枝下垂，整体如雾中尖塔。'},
 locust:{name:'腐根槐',form:'locust',height:164,width:160,bark:'#655e48',inner:'#a18c61',leaf:['#334c3c','#647e56','#99aa78'],autumn:['#72603d','#a59150','#cbbb7b'],tip:'树干裂隙与暗色空洞，曲枝和羽状复叶散开，盘根露出地面。'},
 ginkgo:{name:'金叶银杏',form:'ginkgo',height:203,width:145,bark:'#817359',inner:'#b49c72',leaf:['#3c6544','#83aa63','#bfce87'],autumn:['#967427','#d5ae35','#f3d66d'],tip:'长短枝层次分明，扇形二裂叶沿枝展开；秋季整冠金黄。'},
 ebony:{name:'黑檀木',form:'ebony',height:148,width:120,bark:'#292f2d',inner:'#505c4c',leaf:['#172e2a','#2a4940','#58705a'],evergreen:true,tip:'近黑细裂树干，深绿革质叶密集成紧凑的黑伞。'}
};
export function treeHash(text){let n=2166136261;for(const ch of String(text))n=Math.imul(n^ch.charCodeAt(0),16777619);return n>>>0;}
export function resolveTreeSpecies(n,realm='home',seed=0){
 if(Object.hasOwn(TREE_SPECIES,n.treeSpecies))return n.treeSpecies;
 // 已种下的旧青杉保留松杉轮廓；地图老树按坐标补齐，绝不重掷游戏随机数。
 if(/^p\d+$/.test(n.id||''))return'fir';
 const pools={verdant:['oak','birch','maple','locust','ebony','elm'],frost:['fir','pine','birch','aspen'],cinder:['pine','jujube','oak','ebony'],mirror:['jujube','ebony','ginkgo'],orbit:['fir','aspen','ebony'],tide:['willow','locust','elm'],fungus:['locust','ebony','elm']};
 const pool=pools[realm]||(n.y>1850?['willow','locust','elm','jujube','ginkgo']:n.x<1350&&n.y<1380?['fir','oak','birch','maple','ebony','pine']:n.x>1900?['pine','oak','jujube','ginkgo']:['birch','aspen','elm','ginkgo','fir']);
 return pool[treeHash(seed+':'+realm+':'+n.id+':'+n.x+':'+n.y)%pool.length];
}
export function treeProfile(n,s={}){const id=resolveTreeSpecies(n,s.expedition?.current,s.seed);return{id,...TREE_SPECIES[id]};}
export function treeName(n,s){return treeProfile(n,s).name;}
export function initTreeSpecies(s){
 const apply=(map,realm)=>{for(const n of map.nodes||[])if(n.type==='tree'&&!Object.hasOwn(TREE_SPECIES,n.treeSpecies))n.treeSpecies=resolveTreeSpecies(n,realm,s.seed);};
 apply(s,s.expedition?.current||'home');for(const[id,map]of Object.entries(s.expedition?.worlds||{}))apply(map,id);
}
export function validateTreeSpecies(map){for(const n of map.nodes||[])if(n.treeSpecies!==undefined&&(n.type!=='tree'||!Object.hasOwn(TREE_SPECIES,n.treeSpecies)))throw Error('树种数据无效');}
export function plantingSpecies(s,x,y){let nearest=null,d=210;for(const n of s.nodes||[]){if(n.type!=='tree'||!n.available)continue;const gap=Math.hypot(n.x-x,n.y-y);if(gap<d){nearest=n;d=gap;}}return nearest?resolveTreeSpecies(nearest,s.expedition?.current,s.seed):resolveTreeSpecies({id:'planted',x,y},s.expedition?.current,s.seed);}
export function treeMetrics(n,s={}){const p=treeProfile(n,s),scale=(n.sapling?.24:1)*(.96+(treeHash(n.id||'tree')%3)*.04),width=p.width*scale,height=p.height*scale;return{width,height,left:n.x-width/2,right:n.x+width/2,top:n.y-height*.94,bottom:n.y+height*.06};}
export function treeVisible(n,s,left,top,width,height){const b=treeMetrics(n,s);return b.right>left&&b.left<left+width&&b.bottom>top&&b.top<top+height;}
export function treeHit(n,p,s){const b=treeMetrics(n,s);if(p.y<n.y-b.height*.26){const x=(p.x-n.x)/(b.width*.48),y=(p.y-(n.y-b.height*.59))/(b.height*.37);return x*x+y*y<1;}return Math.abs(p.x-n.x)<Math.max(8,b.width*.09)&&p.y>b.top&&p.y<n.y+10;}
export function treeOcclusion(n,p,s){if(n.y<=p.y||n.sapling)return 1;const b=treeMetrics(n,s);return Math.abs(n.x-p.x)<b.width*.39&&p.y>b.top+8&&p.y-74<n.y-b.height*.16?.38:1;}
export function treeSeason(id,index){const d=TREE_SPECIES[id]||TREE_SPECIES.fir;return{leaf:index===2&&!d.evergreen?d.autumn:d.leaf,bare:index===3&&!d.evergreen,snow:index===3};}
