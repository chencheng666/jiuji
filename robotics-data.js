export const ROBOT_TECH={id:'robotics',name:'营地机械助手',branch:'matter',level:2,requires:['drilling','observe'],cost:{insight:5,ingot:2,flower:2},text:'组装拾荒、园丁与搬运机。真实领料、运输与充能；遇险返程，不补算离线生产。'};
export const ROBOT_RECIPE={id:'robotdock',name:'机器人工作站',category:'advanced',level:2,tech:'robotics',cost:{wood:8,stone:6,ingot:2,crystal:2},building:'robotdock',desc:'每图一座，各型号一台。存放种料、收成与搬运货物；补充原晶后机器人自行充电。'};
export const ROBOT_COST={ingot:3,board:2,crystal:2,grass:3};
export const ROBOT_MODELS={
 gather:{name:'拾荒机',sprite:'gatherbot',level:2,cost:ROBOT_COST,text:'收集已探索的树枝、燧石、纤维或浆果。'},
 gardener:{name:'园丁机',sprite:'gardenbot',level:2,tech:'steward',cost:{ingot:3,board:3,crystal:2,seed:4},text:'从工作站领取种料，照料育苗床，带回真实收成。'},
 hauler:{name:'搬运机',sprite:'haulbot',level:3,cost:{ingot:4,board:4,crystal:3},text:'连接两座本地设施；保留源仓储备，按目标库存运送。'}
};
export const ROBOT_UPGRADES={cargo:{name:'加宽货箱',cost:{ingot:2,board:2},text:'货箱 16 → 24 份。'},range:{name:'远行导航',cost:{crystal:3,flower:2},text:'所选作业半径增加 240 步，仍只走已探索陆地。'}};
export const ROBOT_TYPES={twig:{name:'树枝',item:'twig'},flint:{name:'燧石',item:'flint'},grass:{name:'纤维',item:'grass'},bush:{name:'浆果',item:'berry'}};
export const ROBOT_CAPACITY=16;
export const ROBOT_STATES={idle:'营地待命',outbound:'前往目标',gathering:'正在作业',delivering:'运往目的地',returning:'返程卸货',charging:'正在充电',waiting:'等待条件'};
