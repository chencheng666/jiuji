// 蒸汽阶段用真实木材与仓储连接手工制作和后期晶能工业。
export const STEAM_TECH={id:'steamcraft',name:'蒸汽传动',branch:'matter',level:3,requires:['smelting','steward'],cost:{ingot:4,board:4,insight:10,resonance:3},text:'解锁蒸汽工坊。木柴驱动锯切、冶炼与饲料加工，搬运机器人可自动供料取货。'};
export const STEAM_RECIPE={id:'steamworks',name:'蒸汽工坊',building:'steamworks',category:'advanced',tech:'steamcraft',level:3,cost:{ingot:8,board:8,stone:10},desc:'三级基础自动生产：原料和燃料都从本机库存扣除。木材 1 份提供 24 秒工作热量；当前地图运行时加工，切图、面板与离线暂停。'};
export const STEAM_JOBS={board:{name:'锯切木板',cost:{wood:3},drop:{board:1},seconds:12},ingot:{name:'冶炼铜锭',cost:{ore:3,wood:1},drop:{ingot:1},seconds:18},feed:{name:'研磨谷籽饲料',cost:{seed:2,grass:4},drop:{feed:2},seconds:10}};
