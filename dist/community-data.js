export const COMMUNITY_RECIPES=[
 {id:'trail',name:'碎石小路',category:'camp',cost:{stone:2},building:'trail',level:2,desc:'就近连铺的小路，范围内人和机器人移速 +15%，同类不叠加；不能跨水面。'},
 {id:'outpost',name:'远行前哨站',category:'advanced',cost:{wood:10,board:6,stone:8,grass:8},building:'outpost',level:3,tech:'steward',desc:'每张常驻地图一座：真实储物、行粮休整。四级空间折叠后，可消耗原晶与共鸣前往已建好的前哨。'}
];
export const COMMUNITY_REQUESTS={
 bay:[{name:'为雨天留干柴',text:'禾把干柴搬到屋檐下，希望有人一起补好防雨绳。',cost:{wood:5,grass:4},reward:{cooked:2},level:2},{name:'把热饭送给修械师',text:'把河湾准备的饭篮亲自送到石脊。没有截止日期，先照顾好自己。',cost:{berry:4,wood:2},reward:{carebasket:1},level:2}],
 ridge:[{name:'修好搬运小车',text:'砾正在院子里整理车轮，缺两块板和一段铜轴。',cost:{board:2,ingot:1},reward:{seed:5,crystal:1},level:2},{name:'接过河湾的饭篮',text:'收到饭篮后，修械师愿意一起为公共工坊做一套货箱。',cost:{carebasket:1,board:3},reward:{relicpart:1},level:3}],
 reed:[{name:'换季前的种子匣',text:'芦想留下一盒种子和发光的花，不让下一季从空手开始。',cost:{seed:6,flower:2},reward:{wildpod:2},level:3},{name:'机器人也需要一块园地',text:'和园丁机一起准备公共苗圃。先完成一次真实的播种与收成运回。',cost:{root:3,wood:4},reward:{blueprint:1},level:3,robot:true}]
};
export const COMMUNITY_ITEMS={carebasket:{name:'河湾饭篮',icon:'stew',unique:true}};
export const COMMUNITY_PROJECTS={
 supply:{name:'六地补给约定',level:4,text:'在六张常驻地图各建一座前哨；每地从当地背包交付一次木材与行粮，投入公共补给点；这批物资用于共建，不可从个人仓库取回。',cost:{wood:3,ration:1},reward:{blueprint:2},insight:6},
 beacon:{name:'九级 · 共同体纪念碑',level:9,text:'六地补给约定完成后，分别投入原晶与木板，为六地各留下一个纪念标。',cost:{crystal:2,board:2},reward:{accord:1},insight:10}
};
