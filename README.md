# 小鱼碰碰乐

面向 2-6 岁儿童的轻互动触屏小游戏。小鱼在海底场景中游动，点击小鱼后会出现气泡和星星反馈，小鱼会随机重新出现。

## 当前功能

- 多条鱼同时游动
- 不同颜色、大小和速度
- 点击 / 触摸交互
- 放大命中范围，适合儿童手指
- 100ms 防连点
- 抓到计数
- 暂停 / 继续
- 重新开始
- 音效开关

## 本地预览

直接用浏览器打开 `index.html`。

## GitHub Pages 发布

1. 在 GitHub 新建一个公开仓库，例如 `fish-game`。
2. 上传本项目里的所有文件。
3. 打开仓库的 `Settings`。
4. 进入 `Pages`。
5. 在 `Build and deployment` 中选择：
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
6. 保存后等待 1-2 分钟。
7. GitHub 会生成类似 `https://你的用户名.github.io/fish-game/` 的链接。

## 文件说明

- `index.html`：页面入口
- `styles.css`：界面样式
- `game.js`：游戏逻辑
- `发布说明.md`：发布步骤说明
