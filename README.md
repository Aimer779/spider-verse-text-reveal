# Spider-Verse text reveal

根据用户提供的 Rajat Sethi 视频重建文字动效。
使用 HTML、CSS、JavaScript 和内联 SVG。
没有运行时依赖或外部资源请求。

## 打开

在线演示：https://aimer779.github.io/spider-verse-text-reveal/

直接打开 `index.html`，或使用本地服务：

```powershell
devserver start spider-text --project .
```

访问 http://127.0.0.1:18186 。
未安装 devserver 时，可在本目录运行 `python -m http.server 18186`。
页面自动循环播放。右下角可暂停和重播。
系统启用减少动态效果时，页面显示静态全文。

点击右下角「参数」打开面板。
暂停后调整参数，可检查同一帧的变化。

- 排版：文字大小、字重、行高、字距。
- 配色：背景、正文、四种贴纸颜色。
- 动效：播放速度、单词特效时长、套色偏移、贴纸旋转、网点与碎片强度。

调整立即生效，并通过 localStorage 保存在本机。
「恢复视频默认值」重置全部参数。
Escape 关闭面板，键盘焦点返回「参数」按钮。
手机面板位于底部，上方保留动画预览。

## 验证

在本目录运行：

```powershell
node verify.mjs
```

该检查覆盖语法、资源引用和时间线边界。
本地已执行浏览器交互与视觉检查。
本机取证截图和检查记录不随公开仓库发布。

## 文件

- `timeline.js`：27 个词的出入场时间与停留期变化。
- `script.js`：SVG 拼贴、确定性扰动和播放控制。
- `settings.js`：参数定义、实时调整与本地保存。
- `styles.css`：排版、套色与响应式规则。

浏览器控制台可用 `reveal.seek(5)` 定格。
使用 `reveal.play()` 恢复播放。

参考视频的视觉设计归原作者所有。
本项目是学习性质的独立重建，与 Marvel 或 Sony 无关联。
Inter 字体采用 SIL OFL 1.1，许可在 `assets/Inter-OFL.txt`。

## GitHub Pages

站点从 `main` 分支根目录发布。
推送到 `main` 后，GitHub Pages 自动更新。
`.nojekyll` 让 Pages 直接发布静态文件。
