# @coldcgh/dsh-desktop-installer

dsh 桌面壳插件：把 DeepSeek Harness 封装成**真正的桌面客户端**。

## 功能

- **自动拉起桌面客户端**：dsh 启动后，插件自动启动 `dsh-desktop-shell-client.exe`（Wails v3 + WebView2）——独立的桌面窗口包裹 Harness UI（无浏览器痕迹）
- **协议文件**：`~/.dsh/dsh-web-port.json` 写入 `{port, url, pid, harnessVersion, pluginVersion, runtimeDir}`——客户端据此连接，设置页展示版本信息
- **快捷方式**：桌面 + 开始菜单（应用列表）注册；**卸载插件时自动删除**（dispose 清理 + 客户端启动校验双保险）
- **客户端自动拉起 dsh**：若 harness 未运行，客户端自身会隐形启动（`CREATE_NO_WINDOW`，无控制台窗口）——点桌面图标即直达界面

## 安装

```bash
dsh plugin --profile web add @coldcgh/dsh-desktop-installer
# 然后手动把 "@coldcgh/dsh-desktop-installer" 追加到
# ~/.dsh/profiles/web/package.json 的 dsh.profile.bundles 数组
# 重启 harness
```

## 客户端

`dsh-desktop-shell-client.exe`（独立发布物，见 Gitee `coldcgh/dsh-desktop-shell-client` release）：
- 托盘（显示/设置/退出）；设置页显示 客户端/Harness/插件 版本 + 连接地址（点击开浏览器）
- 单例锁防双开；启动时自动注册/校验快捷方式
- runtime 树查找：插件协议 runtimeDir → exe 同目录 `dsh-runtime/` → 开发兜底

## 开发

```bash
npm pack                                # 本地 tgz
node --expose-internals <runtime>/node_modules/@deepseek-ai/dsh/lib/bin.js plugin --profile web add <tgz>
# 快速迭代：cp lib/index.js 到 ~/.dsh/profiles/web/node_modules/@coldcgh/dsh-desktop-installer/lib/ 后重启 harness
```

**注意**：系统 Node 版本要求 v24+（Hermes 内置的 v22 跑 dsh web 会静默退）；所有 `dsh` CLI 操作都用系统 node。