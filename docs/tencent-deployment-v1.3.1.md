# 腾讯云 1.3.1 发布与验收

2026-11-02，《九级》1.3「归途新生」已以修订版 1.3.1 更新腾讯云、GitHub main、GitHub Pages 和 Release。1.3.1 同步匿名统计版本标识；保留已公开 1.3.0 标签。

- [国内试玩](https://www.daguojueqi.site/jiuji/) · [备用试玩](https://chencheng666.github.io/jiuji/) · [源码](https://github.com/chencheng666/jiuji) · [发行包](https://github.com/chencheng666/jiuji/releases/tag/v1.3.1)。
- 当前目录 `/opt/jiuji/releases/v1.3.1-bede639-20261102/site`；备份 `/opt/jiuji/backups/v1.3.1-bede639-20261102`，上一个 1.2.0 目录保留。
- 发布前获取同机五个页面、两份配置、两个服务的 PID/版本/build 基线。通过共同发布锁、整包和逐文件 SHA256 校验后原子切换《九级》链接。
- 《大国崛起》的五个页面、两份配置哈希未变；双人与六人服务 PID 分别保持 655917 / 655918，健康接口仍为 `2.0.2 / 20261031-fan-bugs6`。路由配置相同，本次没有重载 Nginx，主进程也未变化。
- 两站各 113 个文件逐一完整读取、比对哈希，运行 ZIP 完整下载解压测试通过，缺失脚本返回 404。
- 本地 81 项规则测试、正常资源四至七级经营闭环、九级双结局、荒野钓鱼烹饪与远征守卫流程通过。
- 国内浏览器实际完成遭遇选择与回信，刷新保留；育苗追肥生效；四级订单刷新保留；六级织造启动；七级援助刷新保留。390px 经营页无横向溢出和失败图片，本地另验证 320px。移动测试为浏览器尺寸模拟，不宣称 iPhone Safari 真机认证。
- 《大国崛起》实际浏览器欢迎页、阵营入口和图片正常，仅作只读检查，未开启对战。
- GitHub 游戏 CI `41400951780`、Pages `41401042183`、Linux 构建 `41400951779` 均成功。Linux / 统信候选包的 control 和应用 info 版本均为 1.3.1、amd64，已提供发行下载；未重新提交商店，也未作统信真机适配认证。

浏览器录屏/截图与正常操作检查点保存在忽略目录 `artifacts/v1.3-qa/`；公开哈希清单见 `tencent-verification-v1.3.1.json`、`pages-verification-v1.3.1.json`，摘要见 `verification-v1.3.1.json`。

本地源码、公开源码与 Pages 使用不同提交历史，游戏内容相同。运行包需要 Node.js 18+，不是双击 HTML 或 Windows 安装器。联机、微信小游戏/小程序与主动营地袭击仍为独立后续里程碑。
