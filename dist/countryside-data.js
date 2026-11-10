// 原岛生态、季节访客与友善养殖，全部使用本地素材和游戏内时间。
export const ANIMALS={
 chicken:{name:'原野鸡',sprite:'chicken',behavior:'peck',speed:19,when:'白昼和黄昏 · 草地',tip:'白天在草地觅食，夜里归巢。先建鸡舍，用种子温和引回，再投入谷籽饲料。',domestic:'chickencoop',bait:{seed:2},seasons:[0,1,2,3],hours:[20,230]},
 rabbit:{name:'棉尾兔',sprite:'rabbit',behavior:'hop',speed:30,when:'清晨至黄昏 · 草甸',tip:'靠近时先停下来。奔跑或挥动武器会让它逃开；兔苑可以用浆果引入。',domestic:'rabbitpen',bait:{berry:2},seasons:[0,1,2,3],hours:[8,230]},
 squirrel:{name:'松果栗鼠',sprite:'squirrel',behavior:'scurry',speed:35,when:'白昼 · 青杉林',tip:'在树根旁寻找种子，听到脚步会跳向另一棵树。只观察，不必捕捉。',seasons:[0,1,2],hours:[20,185]},
 butterfly:{name:'晨露蝶',sprite:'butterfly',behavior:'flutter',speed:17,when:'春夏白昼 · 花丛',tip:'春夏花开的白天出现，寒季暂别。留一些荧光花给它们。',seasons:[0,1],hours:[35,170]},
 frog:{name:'雨铃蛙',sprite:'frog',behavior:'hop',speed:19,when:'春夏雨天或雨后 · 水边',tip:'雨中及雨停后的短时间，能在池边发现它们。',seasons:[0,1],hours:[0,300],rain:true},
 firefly:{name:'星点萤',sprite:'firefly',behavior:'flutter',speed:12,when:'夏季黄昏与夜晚 · 水边',tip:'夏夜的水边会亮起细小光点。它们是季节访客，不提供安全照明。',seasons:[1],hours:[190,300]},
 hedgehog:{name:'落叶刺团',sprite:'hedgehog',behavior:'scurry',speed:15,when:'秋季黄昏 · 落叶地',tip:'秋天日落后出来觅食，受到惊吓会避开急促的脚步。',seasons:[2],hours:[175,260]},
 deer:{name:'迁徙花鹿',sprite:'deer',behavior:'graze',speed:28,when:'换季前后 · 林缘',tip:'每季最后一天与下一季第一天，鹿群会经过林缘。观察后留出通路。',seasons:[0,1,2,3],hours:[20,210],transition:true}
};
export const COUNTRY_ITEMS={egg:{name:'鲜鸡蛋',icon:'egg',food:10,clarity:-2},omelet:{name:'营火煎蛋',icon:'egg',food:35,health:7},feed:{name:'谷籽饲料',icon:'feed'},rabbitwool:{name:'脱落兔绒',icon:'rabbitwool'}};
export const COUNTRY_TECH={id:'animalcare',name:'温和驯养',branch:'mind',cost:{insight:5,seed:3,grass:4},requires:['observe'],text:'学习观察、引诱与照料，解锁鸡舍和兔苑；缺粮只暂停产出，动物不会离线死亡。'};
export const COUNTRY_RECIPES=[
 {id:'feed',name:'谷籽饲料',category:'materials',cost:{seed:2,grass:4},item:'feed',count:2,desc:'制作 2 份饲料。在鸡舍或兔苑投入，每份提供 6 点口粮。'},
 {id:'chickencoop',name:'原野鸡舍',category:'camp',cost:{wood:10,grass:8,twig:4},building:'chickencoop',tech:'animalcare',desc:'先建鸡舍，再用种子引入野鸡。初始容纳 2 只，产出鸡蛋与少量堆肥。'},
 {id:'rabbitpen',name:'棉尾兔苑',category:'camp',cost:{wood:8,grass:10,stone:4},building:'rabbitpen',tech:'animalcare',desc:'先建兔苑，再用浆果引入野兔。照料后收集自然脱落的兔绒与堆肥。'},
 {id:'omelet',name:'营火煎蛋',category:'survival',cost:{egg:2},item:'omelet',station:'campfire',desc:'饱食 +35、生命 +7。用养殖取得的鲜鸡蛋制作。'},
 {id:'woolcoat',name:'兔绒保暖披肩',category:'survival',cost:{rabbitwool:5,grass:6},item:'coat',desc:'收集自然脱落兔绒，制作保暖披肩；不需要猎杀动物。'}
];
export const PEN_TYPES={chickencoop:{species:'chicken',interval:85,product:'egg'},rabbitpen:{species:'rabbit',interval:120,product:'rabbitwool'}};
export const ROOMS={
 hearth:{name:'公共火屋',npc:'禾 · 守岸人',sprite:'companion-keeper',x:190,y:220,left:65,cost:{wood:3,berry:2},reward:{cooked:2},title:'给远行的人留一顿热饭',text:'把柴火与食物交给公共火屋。修好火塘后，旅人可以在这里歇脚。'},
 workshop:{name:'协作工坊',npc:'砚 · 修械人',sprite:'companion-engineer',x:480,y:220,left:355,cost:{wood:4,flint:3},reward:{feed:3},title:'修好第一只喂料槽',text:'带来木材与燧石，和修械人一起做好喂料槽。三级掌握机械助手后，可升级为自动喂料。'},
 seedhouse:{name:'种子屋',npc:'穗 · 观星长者',sprite:'companion-botanist',x:770,y:220,left:645,cost:{seed:3,grass:4},reward:{seed:5,flower:2},title:'为下一季留种',text:'带回三种动物的观察记录，再把种子和纤维交给长者。她会告诉你下一季该在哪里寻找新邻居。'}
};
