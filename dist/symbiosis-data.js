// 共生远征配置：规则、界面与验收共用同一份中文定义。
export const RIFT_REALMS={
 tide:{name:'潮汐群岛',subtitle:'潮水改变捷径，高地保留归路',level:3,color:'#8cd6c8',temperature:1,tip:'修复三个潮标与潮汐守卫。涨潮时走北侧高架栈道，入口随时可撤退。'},
 fungus:{name:'地心菌窟',subtitle:'光、气流与孢子之间的选择',level:4,color:'#c0aad8',temperature:-5,tip:'通风轴控制孢子。观察编号连接风路，沿发光路标寻找三处观测点。'}
};
export const CO_ITEMS={
 tideglass:{name:'潮汐晶砂',icon:'tideglass'},sporepod:{name:'净化孢囊',icon:'sporepod'},blueprint:{name:'远征图纸',icon:'blueprint'},watercrop:{name:'盐生芦果',icon:'watercrop',food:18},mushroommeal:{name:'菌香行粮',icon:'food',food:55,health:12},restoration:{name:'共生纪念章',icon:'restoration'}
};
export const CO_NODES={tidereed:{name:'盐生芦丛',hp:2,time:.65,drop:{tideglass:2,watercrop:2,grass:2}},glowfungus:{name:'净化菌簇',hp:2,time:.65,drop:{sporepod:2,mushroom:2}},riftanchor:{name:'远征观测点',hp:1,time:0,drop:{}},riftevent:{name:'远征见闻',hp:1,time:0,drop:{}}};
export const COMPANIONS={
 botanist:{name:'苓 · 植物学者',color:'#aace8c',level:2,cost:{seed:6,flower:3},intro:'她愿意来照看种子，前提是营地也为野生植物留一片土。',job:'育苗',station:'seedbed',input:{watercrop:1,seed:1},output:{watercrop:3,seed:2},story:'失而复得的种子',storyCost:{sporepod:4},storyText:'她把菌窟里找到的种子种在营地，而不是锁进档案柜。',perk:'随行时孢子伤害减半，让你有更多时间接续通风回路。'},
 engineer:{name:'铎 · 工程师',color:'#dbb58b',level:3,cost:{board:3,ingot:2},intro:'他想修好旧动力站，需要一个可以拆装、讨论和休息的工作角。',job:'维护',station:'repairbench',input:{flint:1,twig:1},output:{},story:'动力站最后一盏灯',storyCost:{tideglass:4},storyText:'他给旧设备留了手动开关：失去电源，人仍能决定回家的路。',perk:'随行时每 30 秒用 1 燧石修复已装备武器 8 耐久。'},
 ranger:{name:'岚 · 巡林者',color:'#98cbbf',level:3,cost:{twig:6,berry:4},intro:'她沿着迁徙路线行走，希望营地的人也学会读懂动物脚印。',job:'制饵',station:'trailpost',input:{berry:2,grass:1},output:{lure:1},story:'迁徙的另一端',storyCost:{tideglass:2,sporepod:2},storyText:'潮水退去，旧脚印还在。她在地图上为野兽留了一条绕开营地的路。',perk:'随行时普通野怪的警戒距离降低 25%。'},
 keeper:{name:'烛 · 守火人',color:'#e4b87d',level:2,cost:{wood:6,cooked:2},intro:'他不要求你留下所有旅人，只想让每个路过的人能吃上一口热饭。',job:'炊事',station:'fieldkitchen',input:{mushroom:2,watercrop:1},output:{mushroommeal:1},story:'给归来的人留一盏灯',storyCost:{ration:2,sporepod:2},storyText:'最远的远征结束后，他把炉火留给了下一位尚未归来的人。',perk:'随行时每 30 秒用 1 浆果恢复 5 生命，不超过生命上限。'}
};
export const MODULES={
 scanner:{name:'回声扫描',slot:'gear',level:3,cost:{blueprint:1,crystal:2},text:'观测点额外获得 2 洞见；地图显示远征事件编号。'},
 lightpack:{name:'轻载绑带',slot:'gear',level:2,cost:{grass:5,silk:2},text:'移动速度 +8%，保留原有闪避消耗。'},
 salvage:{name:'回收袋',slot:'gear',level:3,cost:{blueprint:1,board:2},text:'裂隙紧急救援时，普通材料仅损失 15%（原为 30%）。'},
 waterproof:{name:'疏水膜',slot:'gear',level:3,cost:{tideglass:4,grass:4},text:'涨潮涉水湿度增长减少 80%。'},
 calm:{name:'安抚气息',slot:'gear',level:4,cost:{sporepod:4,flower:4},text:'普通野怪警戒距离降低 20%，不影响守卫。'},
 restore:{name:'生态播撒',slot:'gear',level:7,cost:{blueprint:2,sporepod:4},text:'完成观测点额外恢复 2 生态。'},
 partner:{name:'同行徽记',slot:'gear',level:5,cost:{blueprint:1,flower:4},text:'随行伙伴辅助冷却由 30 秒降至 20 秒。'},
 precision:{name:'精准刻槽',slot:'weapon',level:3,cost:{blueprint:1,ingot:2},text:'武器伤害 +15%，攻击冷却 +10%。'},
 reach:{name:'延展握柄',slot:'weapon',level:4,cost:{tideglass:3,board:2},text:'武器射程 +15%。'},
 capacitor:{name:'晶能回路',slot:'weapon',level:6,cost:{blueprint:2,crystal:4},text:'晶能武器耗能降低 25%。'},
 cooler:{name:'散热鳍片',slot:'arms',level:6,cost:{blueprint:1,tideglass:4},text:'投影臂散热速度 +40%。'},
 efficiency:{name:'共振耦合',slot:'arms',level:6,cost:{blueprint:2,sporepod:4},text:'投影臂每次作业耗能降低 25%。'}
};
const facility=(id,name,level,cost,desc)=>({id,name,level,cost,desc,category:'camp',building:id});
export const CO_RECIPES=[
 facility('seedbed','盐生育苗床',3,{wood:8,seed:4,tideglass:2},'植物学者的育苗岗位。投入芦果和种子，培养可食用作物。'),
 facility('repairbench','伙伴维修桌',3,{board:4,stone:6},'工程师维护工具的岗位，真实消耗燧石与树枝。'),
 facility('trailpost','巡林哨亭',3,{wood:8,grass:6},'巡林者用浆果与纤维制作诱饵。'),
 facility('fieldkitchen','共用食堂',3,{stone:10,board:3},'守火人用菌菇和盐生芦果制作菌香行粮。'),
 facility('purifier','孢子净化器',4,{sporepod:6,ingot:3,crystal:2},'在菌窟中每 20 秒用 1 孢囊净化当前观测区；原岛用于修复项目。'),
 facility('tidewell','潮汐蓄水井',4,{tideglass:6,stone:8,board:2},'在群岛中每 20 秒用 1 木材稳定当前潮标区；原岛用于修复项目。'),
 {id:'mushroommeal',name:'菌香行粮',category:'survival',cost:{mushroom:2,watercrop:1},item:'mushroommeal',station:'campfire',desc:'饱食 +55、生命 +12。先在裂隙采集芦果与菌菇。'}
];
export const MEMENTOS=[['shellmobile','潮声风铃'],['funguslamp','菌光夜灯'],['seedplaque','种子铭牌'],['gearstatue','旧齿轮雕塑'],['trailflag','巡林路旗'],['hearthmug','归途茶桌'],['starbench','星光长椅'],['coexistmonument','共生碑']];
CO_RECIPES.push(...MEMENTOS.map(([id,name],i)=>facility(id,name,[3,4,4,5,5,5,6,9][i],{board:2,restoration:1},'收藏装饰 · '+['风铃随风轻摆','菌光在暮色中呼吸','记录种子故事','纪念重新点亮的动力站','标记迁徙路线','为归来者留一个位置','记录星海里的脚步','纪念九级的共建选择'][i])));
const creature=(name,hp,damage,speed,kind,weak,drop,color,behavior,tip,extra={})=>({name,hp,damage,speed,kind,weak,drop,color,behavior,tip,range:kind==='ranged'?240:130,windup:1.2,cooldown:2.8,...extra});
export const CO_CREATURES={
 sandburrow:creature('潜沙獾',70,13,65,'charge','blunt',{tideglass:2},'#bda77f','burrow','接近时地面沙圈提示，等扑击落空再靠近。'),
 tidecaller:creature('鸣潮鹭',55,9,75,'ranged','pierce',{fang:1,tideglass:1},'#91cacc','alarm','叫声会惊动附近同伴；绕行或优先处理警戒鸟。'),
 shellback:creature('礁背龟',130,18,30,'slam','blunt',{shell:2,tideglass:2},'#9baf8e','armor','未发起攻击前保持中立；蓄力后露出甲缝，冷却时护甲减弱。',{armor:true,neutral:true}),
 reedgrazer:creature('芦角鹿',65,10,85,'charge','pierce',{watercrop:3},'#c8bd8e','neutral','不主动攻击；保持距离可安全采芦丛。',{neutral:true}),
 sporebeetle:creature('孢甲虫',100,13,42,'slam','fire',{sporepod:2,shell:1},'#ac99c2','armor','壳面挡住穿刺，喷孢之后反击。',{armor:true}),
 glowmoth:creature('逐光蛾',48,8,85,'ranged','frost',{sporepod:2},'#d2c69d','light','会追逐火炬，熄灯可以降低警戒，但需注意黑夜。'),
 rootstalker:creature('根须伏兽',80,16,52,'charge','fire',{sporepod:2,wood:3},'#918db1','burrow','地面会出现根须圈；不要站在蓄力落点。'),
 mosskeeper:creature('苔灯精',75,11,42,'ring','energy',{sporepod:3},'#8dc9ac','neutral','只守护自己的领地，不会主动追逐旅行者。',{neutral:true}),
 tideguardian:creature('潮汐司衡',380,23,42,'ring','blunt',{tideglass:8},'#91cfc4','guardian','修复三处潮标并校准闸门，或观察三阶段预警战斗。',{boss:true,phases:['ring','charge','slam'],phaseWeak:['blunt','frost','energy']}),
 sporeguardian:creature('菌窟织风者',380,23,46,'beam','fire',{sporepod:8},'#b6a3d3','guardian','让通风轴连通避难所，或在光束、环形与扑击之间反击。',{boss:true,phases:['beam','ring','charge'],phaseWeak:['fire','energy','blunt']})
};
export const ROUTES=[{name:'双湾长堤',offset:0,shortcut:0},{name:'折潮环路',offset:-130,shortcut:1},{name:'三礁回廊',offset:130,shortcut:2}];
// 所有选择都有固定种子与明确后果，离开页面不会刷新选项。
const event=(id,name,text,a,b)=>({id,name,text,options:[{id:'care',...a},{id:'craft',...b}]});
export const RIFT_EVENTS=[
 event('seedboat','漂流的种子舟','幼苗被盐水包围，木舟即将散开。',{name:'用木材补船',cost:{wood:3},drop:{seed:4},eco:3,later:'被救下的苗木在营地扎根。',future:{watercrop:2}},{name:'回收舟上图纸',cost:{grass:2},drop:{blueprint:1},eco:-2,later:'你记录了造船工艺，但没能保住全部幼苗。',future:{board:1}}),
 event('bridge','断桥上的背包','补好桥索，或拆回还能使用的木板。',{name:'修复桥索',cost:{grass:4},drop:{tideglass:3},eco:2,later:'下一位旅行者顺着桥索带来了回礼。',future:{ration:1}},{name:'回收桥板',cost:{},drop:{board:2},eco:-2,later:'断桥重新成为绕路点。',future:{twig:2}}),
 event('nest','芦苇里的新巢','鸣潮鹭围着低处的新巢盘旋。',{name:'垫高巢穴',cost:{twig:4},drop:{watercrop:3},eco:3,later:'潮水过后，新巢仍在高处。',future:{flower:2}},{name:'记录鸣声',cost:{berry:2},drop:{blueprint:1},eco:0,later:'鸣声记录成为巡林手册的一页。',future:{lure:1}}),
 event('well','咸水井','旧井的滤层已经松动。',{name:'换掉滤层',cost:{stone:3,grass:2},drop:{tideglass:4},eco:3,later:'清水让野生芦果重新萌芽。',future:{watercrop:3}},{name:'收集结晶',cost:{twig:2},drop:{tideglass:6},eco:-2,later:'结晶可用，旧井仍待修复。',future:{stone:2}}),
 event('current','逆流风筝','风筝牵着一张旧航线图。',{name:'把航图带回',cost:{grass:3},drop:{blueprint:1},eco:0,later:'航线图帮助营地找到新的补给点。',future:{cooked:2}},{name:'追随鱼群',cost:{berry:2},drop:{fish:3},eco:1,later:'你把观察到的洄游方向画进地图。',future:{seed:2}}),
 event('shell','沉默的贝丘','贝丘仍有生物呼吸的迹象。',{name:'留下观察标记',cost:{twig:2},drop:{flower:3},eco:3,later:'潮汐慢慢带回贝丘的生命。',future:{restoration:1}},{name:'收集空壳',cost:{grass:2},drop:{shell:3},eco:0,later:'你只带走了被潮水淘空的外壳。',future:{stone:2}}),
 event('raft','失向的木筏','独行者在木筏旁等待退潮。',{name:'分享行粮',cost:{ration:1},drop:{blueprint:1},eco:2,later:'独行者把一处安全落脚点留给了你。',future:{tideglass:2}},{name:'修好桨叶',cost:{board:2},drop:{tideglass:4},eco:1,later:'桨叶重新划开海水。',future:{watercrop:2}}),
 event('gauge','失灵潮尺','潮尺刻度断裂，读数失去意义。',{name:'重刻潮尺',cost:{flint:2},drop:{blueprint:1},eco:1,later:'新的刻度留下完整潮汐记录。',future:{tideglass:2}},{name:'建立石标',cost:{stone:4},drop:{tideglass:3},eco:2,later:'石标为下一次涨潮留下参照。',future:{flower:2}}),
 event('reef','受困的礁龟','礁龟被旧渔网缠住。',{name:'解开渔网',cost:{twig:2},drop:{shell:2},eco:4,later:'它带着一身水光回到礁石间。',future:{restoration:1}},{name:'架起避潮台',cost:{wood:4},drop:{blueprint:1},eco:2,later:'高台让受困生物熬过了这一轮潮水。',future:{watercrop:2}}),
 event('vent','堵塞的风井','风井中长满了潮湿菌丝。',{name:'疏通风井',cost:{twig:3,stone:2},drop:{sporepod:4},eco:3,later:'空气开始重新流动。',future:{mushroom:3}},{name:'保留菌丝样本',cost:{grass:3},drop:{blueprint:1},eco:0,later:'样本帮助营地理解孢子的净化能力。',future:{sporepod:2}}),
 event('sprout','无光的幼芽','幼芽朝着不存在的光伸展。',{name:'布置反光片',cost:{crystal:1},drop:{seed:4},eco:3,later:'一片微光照到了它的叶尖。',future:{restoration:1}},{name:'移植到高处',cost:{wood:3},drop:{sporepod:3},eco:2,later:'移植盆成为营地的新客人。',future:{flower:2}}),
 event('echo','回声石室','石壁回应着不规则的敲击声。',{name:'留下回应',cost:{stone:2},drop:{blueprint:1},eco:1,later:'回声记录了一段从未听过的节奏。',future:{crystal:2}},{name:'收集脱落晶体',cost:{twig:3},drop:{crystal:4},eco:-1,later:'石室安静了下来，记录仍在。',future:{stone:3}}),
 event('lostlamp','无人的提灯','提灯里的火即将熄灭。',{name:'添柴等待',cost:{wood:3},drop:{ration:1},eco:1,later:'归来的旅人留下了谢礼。',future:{blueprint:1}},{name:'改成菌光灯',cost:{sporepod:2},drop:{flower:4},eco:2,later:'无需火焰的光点亮了路口。',future:{restoration:1}}),
 event('roots','缠绕的根桥','两岸的根须几乎接在一起。',{name:'编织连接',cost:{grass:4},drop:{sporepod:4},eco:3,later:'根桥成为菌窟的新通道。',future:{wood:3}},{name:'研究根系',cost:{flower:2},drop:{blueprint:1},eco:1,later:'根系的纹路进入了你的设计本。',future:{seed:3}}),
 event('spores','孢子风暴','一小股孢子将要经过避难所。',{name:'设置过滤布',cost:{grass:5},drop:{sporepod:5},eco:3,later:'过滤布留下可培育的菌群。',future:{mushroom:3}},{name:'引向无人支洞',cost:{stone:4},drop:{blueprint:1},eco:0,later:'避难所安静下来，支洞仍需日后修复。',future:{crystal:1}}),
 event('garden','遗落的菌圃','菌圃旁写着尚未完成的食谱。',{name:'照着食谱试做',cost:{watercrop:1},drop:{mushroommeal:2},eco:1,later:'守火人记下了这道食物的做法。',future:{mushroom:2}},{name:'保存菌种',cost:{seed:2},drop:{sporepod:4},eco:3,later:'菌种在新的土壤中重新繁衍。',future:{restoration:1}}),
 event('gear','锈蚀的风轮','旧风轮卡在最后一格。',{name:'修复传动',cost:{ingot:1,wood:2},drop:{blueprint:1},eco:3,later:'工程师听见风轮重新转动。',future:{sporepod:3}},{name:'改用手摇',cost:{board:2},drop:{sporepod:4},eco:1,later:'没有电源，也能暂时维持通风。',future:{twig:3}}),
 event('letter','石缝里的信','信上只画了一个家和一团火。',{name:'沿途寻找收信人',cost:{ration:1},drop:{restoration:1},eco:2,later:'信被送到了仍然亮灯的营地。',future:{blueprint:1}},{name:'留在公开路牌上',cost:{wood:2},drop:{flower:3},eco:1,later:'路过的人知道，有人在等待回信。',future:{sporepod:2}})
];
export const LEVEL_CO_TEXT=['','看懂工具和材料来源，留下一束火。','邀请第一位伙伴，决定谁与你同行。','用回声扫描寻找潮汐群岛，开始模块搭配。','进入菌窟，安排路线、补给和安全撤退。','四个营地岗位开始协作，按目标库存停止工作。','投影臂与晶能武器加装模块，让工程改变采集方式。','通过净化与蓄水项目修复世界，获得共生纪念章。','协调六地请求，把修复经验带给其他营地。','解锁深层远征、共生碑与自由建设，继续留下自己的世界。'];
