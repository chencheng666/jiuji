# 九级 3.4.0 发布与线上核对

2026-11-10，游戏、GitHub 和官网均已更新为 3.4.0。

- [国内试玩](https://www.daguojueqi.site/jiuji/)
- [官网及三平台下载](https://www.daguojueqi.site/jiuji/official/#downloads)
- [GitHub 发行](https://github.com/chencheng666/jiuji/releases/tag/v3.4.0)
- [GitHub Pages](https://chencheng666.github.io/jiuji/)

源码为 `a5199bda1711c445a5cb66c8ee2b9d3f22528c57`，Pages 发布提交 `3fc3c4e`。本地开发提交 `0b85087` 与公开源码沿用各自历史，游戏文件内容一致。

## 核对结果

- 游戏 234 文件、官网 97 文件、Pages 234 文件逐一摘要通过，缺失脚本正确返回 404。
- 公众号反馈涉及的 2K 优化、武器表现与五课避战演练已包含在实际线上包中。手机短横屏实际完成五课，未出现横向溢出或图片加载失败。
- 官网 390 像素宽下载页没有横向溢出；真实点击下载 ZIP，177 文件完整性与 SHA256 正确。
- ZIP、Windows x64、macOS 通用版的完整下载文件与本地 SHA256 一致；GitHub 六个发行文件的服务端摘要与本地一致。
- 226 项规则检查通过，Windows/macOS 构建成功。macOS 版本为 3.4.0，包含 x86_64 与 arm64，签名完整性和 DMG 校验通过。本轮未做反馈手机真机、Windows 安装或 macOS 原生试玩。

## 共享服务器范围

使用已有共享发布锁，游戏和官网各自切换独立指针。本轮两个路由内容没有变化，未重载 Nginx。

- 游戏：`/opt/jiuji/releases/3.4.0-a5199bd-20261110/site`。
- 游戏备份：`/opt/jiuji/backups/3.4.0-a5199bd-20261110`。
- 官网：`/opt/jiuji/official/releases/3.4.0-20261110-downloads/site`。
- 官网备份：`/opt/jiuji/official/backups/3.4.0-20261110-downloads`。

《大国崛起》两个服务 PID 均保持 `998487 / 998488`，版本和构建号仍为 `3.3.0 / 20261110-carrier-nature-r2`。`/`、`/play/`、`/candidate/`、`/downloads/`、`/resume/` 的内容 SHA256 与发布前完全一致，双人及六人健康入口均正常。未操作其游戏目录、进程与存档。

若需回退，分别读取游戏或官网备份内 `previous.json`，在共享发布锁下仅恢复对应 `current` 指针；路由未变化时不需要重载 Nginx。不要回退或修改《大国崛起》的目录、配置与进程。

详细文件哈希、浏览器与安装包边界见 [3.4 发布记录](releases/v3.4.0/发布记录.json)。商店审核与更新不在本次发布范围内。
