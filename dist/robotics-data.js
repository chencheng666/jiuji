export const ROBOT_TECH={id:'robotics',name:'营地机械助手',branch:'matter',level:2,requires:['drilling','observe'],cost:{insight:5,ingot:2,flower:2},text:'建造机器人工作站，组装独立拾荒机。按已探索区域作业，真实卸货与充能；遇险返程。'};
export const ROBOT_RECIPE={id:'robotdock',name:'机器人工作站',category:'advanced',level:2,tech:'robotics',cost:{wood:8,stone:6,ingot:2,crystal:2},building:'robotdock',desc:'每图最多一座。组装拾荒机器人、储存采集物与晶能；靠近时仓内材料可直接用于合成。'};
export const ROBOT_COST={ingot:3,board:2,crystal:2,grass:3};
export const ROBOT_TYPES={twig:{name:'树枝',item:'twig'},flint:{name:'燧石',item:'flint'},grass:{name:'纤维',item:'grass'},bush:{name:'浆果',item:'berry'}};
export const ROBOT_CAPACITY=16;
export const ROBOT_STATES={idle:'营地待命',outbound:'前往资源',gathering:'正在采集',returning:'返程卸货',charging:'正在充电',waiting:'等待条件'};
