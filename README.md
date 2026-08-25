# @coldcgh/dsh-desktop-shell

dsh 桌面壳插件：把 DeepSeek Harness 封装成**真正的桌面客户端**（原名 `@coldcgh/dsh-shell`）。

## 功能

- **内置桌面客户端**：`dsh-desktop-shell-client.exe`（Wails v3 + WebView2，~13MB）直接打包在本 npm 包 `bin/` 目录内——装插件即得桌面窗口，无需单独安装客户端
- **自动拉起桌面客户端**：dsh 启动后，插件探测 web 端口、写协议文件、启动包内 exe——独立的桌面窗口包裹 Harness UI（无浏览器痕迹）
- **协议文件**：`~/.dsh/dsh-web-port.json` 写入 `{port, url, pid, harnessVersion, pluginVersion, runtimeDir}`——客户端据此连接，设置页展示版本信息
- **快捷方式**：桌面 + 开始菜单（应用列表）注册；**卸载插件时自动删除**（dispose 清理 + 客户端启动校验双保险）
- **客户端自动拉起 dsh**：若 harness 未运行，客户端自身会隐形启动（`CREATE_NO_WINDOW`，无控制台窗口）——点桌面图标即直达界面
- **开机自启开关**：设置页「桌面壳」开关，写入 HKCU Run 注册表项

## 安装

```bash
dsh plugin --profile web add @coldcgh/dsh-desktop-shell
# 然后手动把 "@coldcgh/dsh-desktop-shell" 追加到
# ~/.dsh/profiles/web/package.json 的 dsh.profile.bundles 数组
# 重启 harness
```

> 从 `@coldcgh/dsh-shell` 升级：移除旧包依赖与 bundles 项、安装新包即可；设置页「桌面壳」开关数据（settings scope `shell`）自动保留。

## 客户端 exe 查找顺序

1. 本插件包 `bin/dsh-desktop-shell-client.exe`（npm 分发，默认命中）
2. 开发机客户端仓库构建 `D:/WorkSpaces/dsh-desktop-shell-client/bin/`
3. 安装版兜底 `%LOCALAPPDATA%\Programs\dsh-desktop-shell\`、`...\DeepSeekHarness\`

## 客户端

`dsh-desktop-shell-client.exe`（Wails v3，仓库见 Gitee `coldcgh/dsh-desktop-shell-client`）：
- 托盘（显示/设置/退出）；设置页显示 客户端/Harness/插件 版本 + 连接地址（点击开浏览器）
- 单例锁防双开；启动时自动注册/校验快捷方式
- runtime 树查找：插件协议 runtimeDir → exe 同目录 `dsh-runtime/` → 开发兜底

## 更新内置 exe

客户端仓库重新构建后，同步到本包：

```bash
bash scripts/update-client.sh
# 或指定路径：bash scripts/update-client.sh D:/WorkSpaces/dsh-desktop-shell-client/bin/dsh-desktop-shell-client.exe
```

exe 随包提交 git（~13MB），改完 bump 版本并 `npm publish --registry=https://registry.npmjs.org/`。

## 开发

```bash
npm pack                                # 本地 tgz
node --expose-internals <runtime>/node_modules/@deepseek-ai/dsh/lib/bin.js plugin --profile web add <tgz>
# 快速迭代：cp lib/index.js 到 ~/.dsh/profiles/web/node_modules/@coldcgh/dsh-desktop-shell/lib/ 后重启 harness
```

**注意**：系统 Node 版本要求 v24+（Hermes 内置的 v22 跑 dsh web 会静默退）；所有 `dsh` CLI 操作都用系统 node。
