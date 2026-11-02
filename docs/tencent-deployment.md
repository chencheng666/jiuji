# 腾讯云发布与验收

当前版本为 1.3.1（2026-11-02），见 [1.3.1 部署与验收](tencent-deployment-v1.3.1.md)。下文保留 1.0.0 历史记录。

## 1.0.0 历史记录

2026-10-28，《九级》1.0.0 已部署。源码、GitHub Pages 与 Release 同步完成。

## 入口和版本

- 国内试玩：https://www.daguojueqi.site/jiuji/
- 开源试玩：https://chencheng666.github.io/jiuji/
- 开源版本：https://github.com/chencheng666/jiuji/releases/tag/v1.0.0
- 国内运行包：https://www.daguojueqi.site/jiuji/downloads/Jiuji-v1.0.0.zip
- 版本清单：https://www.daguojueqi.site/jiuji/version.json

运行包需要 Node.js 18+，解压运行 `npm run dev`，无需第三方依赖，不是双击 HTML 版。

- 本地游戏源码提交：`3742152047d085c3860691a9ff5458d468346e1a`。
- 公开源码提交：`f2e89246f1e63e860af18c2a8f03c77f74ab1bbd`。
- Pages 提交：`e91d3f70929fa071869c47f01796a54248b23778`。
- 站点部署包 SHA256：`ea3f284c83d190ce112f101b1c606ea102baf43671624cd432afaa52376d79a2`。
- 运行包 SHA256：`170627f43137bea98cde57f791253fde682d193526ce1cd021dce34d096feb8f`。

公开仓库沿用自己的提交历史，因此源码 SHA 与本地不同。Pages 和腾讯云使用同一份发布包内容。

## 服务器隔离与回退

腾讯云上海实例 `lhins-o9hec09y`，公网 IP `150.158.159.121`。通过腾讯云 OrcaTerm 免密终端连接，MFA 由用户完成。

- 新版：`/opt/jiuji/releases/v1.0.0-3742152-20261028/site`。
- 当前链接：`/opt/jiuji/current`。
- 备份：`/opt/jiuji/backups/v1.0.0-3742152-20261028`。
- 上一版：`/opt/jiuji/releases/v0.4.0-dcd6f54-20261022/site`，已保留。
- 版本报告：`/opt/jiuji/deployment.json`。
- 路由：`/www/server/panel/vhost/nginx/extension/www.daguojueqi.site/30-jiuji.conf`。

发布使用 `scripts/deploy-tencent.py`：确认实例与站点归属、共同发布锁、包哈希、逐文件哈希，备份后原子切换链接，Nginx 检查通过后平滑重载。主站配置和《大国崛起》路由配置的哈希不变。

大国崛起双人服务 `great-powers-domestic` PID 为 `504338`，六方服务 `great-powers-domestic-six` PID 为 `504339`，部署前后均为 2.0.1，PID 未变化。未重启原游戏进程、未修改其数据目录或游戏内容。

回退时读取本次备份中的 `previous.json`，原子将 `/opt/jiuji/current` 切回旧版 `site`，恢复该备份内的 `30-jiuji.conf`，通过 Nginx 配置检查后平滑重载；不要回退《大国崛起》配置。

## 公网校验

- 腾讯云与 GitHub Pages 各 61 个文件完整读取，SHA256 与同一发布包一致。
- 国内运行 ZIP 完整下载、哈希及 ZIP 内部完整性检查通过。
- 缺失脚本返回 404，`/jiuji` 跳转正常。
- `/`、`/play/`、`/candidate/`、`/downloads/`、`/resume/` 五个页面部署前后内容 SHA256 一致。
- `/api/health`、`/candidate/api/health` 均正常，版本及 build 保持 `2.0.1 / 20261027-carrier-deck-fastload`。
- GitHub Actions 游戏规则验证与 Pages 构建均成功；GitHub Pages 浏览器实际打开欢迎页和1.0生存手册成功，显示新芽春，图片无加载失败。

公网文件证据：`docs/tencent-verification.json`。原站基线与浏览器截图在忽略目录 `artifacts/release-v1/`。

## 浏览器实际试玩

国内使用隔离存档槽验收：新开局采集得到 3 树枝；通过原生导入载入真实规则旅程检查点，实际钓鱼后溪鱼从 4 增至 6、次数从 3 增至 4、耐久从 37 降至 36；点击工具手册奖励浆果从 25 增至 29，按钮禁用。刷新后鱼和已领取记录保留。

390×844 手册与合成页可用，窗口与文档宽度同为390，没有横向溢出或图片加载失败。移动测试为浏览器尺寸模拟，未宣称 iPhone Safari 真机验收。证据截图位于 `artifacts/release-v1/online-mobile-handbook.png`、`online-mobile-craft.png`。

## 存档与范围

同域名保留 v4 存档键，兼容 0.2/0.3/0.4 生存存档。腾讯云和 GitHub Pages 不跨域共享进度，需要手动导出/导入。尚无云存档、联机或微信小游戏版本。

本轮不重复人工全程玩完九级；本地 38 项规则测试、完整九级双结局与荒野流程见 `verification-v1.0.md`。

## 历史

0.4.0 发布记录：`tencent-deployment-v0.4.md`、`tencent-verification-v0.4.json`。0.3.0 记录同样保留。
