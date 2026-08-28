# AGENTS.md — dsh-desktop-shell

`@coldcgh/dsh-desktop-shell`（原名 `@coldcgh/dsh-shell`）：dsh **web 平台桌面壳插件**。把已在 dsh 进程内运行的 harness 包装成真正的 Windows 桌面客户端——装插件即得桌面窗口，无需单独安装客户端。本插件**不修改、不重编译、不替换** harness，只做「探测 → 协议文件 → 拉起客户端 → 自启/清理」。

## 角色边界

- **是**：dsh 宿主侧插件（server：探测端口、写协议文件、spawn 客户端、settings 自启开关；client：设置页卡片）。
- **不是**：harness 的替代品；**不改动 deepseek-harness/ 任何代码**（见根 AGENTS.md 铁律）。
- 客户端 exe（`dsh-desktop-shell-client.exe`）是独立 Wails v3 项目产物，只在本包 **bin/** 做分发副本。

## 工作流（server 端 apply）

1. `waitForPort()`：用 `process._getActiveHandles()` 扫描本进程监听端口（插件 apply 早于 web server 启动，需轮询，默认 30s）；
2. `pickHttpPort()`：对候选端口发 HTTP 请求，选出真正的 web 端口；
3. 写协议文件 `~/.dsh/dsh-web-port.json`：
   `{ port, url, pid, at, harnessVersion, pluginVersion, runtimeDir }`；
4. `findClient()` 按顺序找 exe（见下），找到则 `spawn(client, [], { detached: true, stdio: "ignore" })` + `child.unref()`；
5. 注册 settings 命名空间 `shell`（字段 `autostart`，`applies: "live"`），写 HKCU Run 注册表项 `DeepSeek Harness`；
6. 返回 `cleanupShortcuts` 作为 dispose：删除桌面/开始菜单快捷方式 + 协议文件（协议文件是客户端判断插件存活的标志）。

## 协议文件（跨插件/客户端的唯一契约）

- 路径：`~/.dsh/dsh-web-port.json`；
- 客户端按其中的 `runtimeDir` 找 runtime 树、按 `url` 连接、按 `pid` 判活；
- **删除/丢失即视为插件卸载** → 客户端清理快捷方式。保持字段名向后兼容（客户端同时兼容缺字段）。

## 客户端 exe 查找顺序（findClient）

1. 本插件包 `bin/dsh-desktop-shell-client.exe`（npm 分发，默认命中）；
2. 开发机客户端仓库构建 `D:/WorkSpaces/DeepSeekHerness/dsh-desktop-shell-client/bin/`（含 `test-build.exe`）；
3. 安装版兜底 `%LOCALAPPDATA%\Programs\dsh-desktop-shell\`、`...\DeepSeekHarness\`。

## client 端（lib/client.js）

- 注入 `["slots", "settingsScope"]`；设置页「插件配置：桌面壳」卡片（自启开关），开关数据存 settings scope `shell`。
- 从 `@coldcgh/dsh-shell` 升级时该数据自动保留。

## 更新内置 exe

客户端仓库重新构建后同步：

```bash
bash scripts/update-client.sh
# 或指定路径：bash scripts/update-client.sh D:/WorkSpaces/DeepSeekHerness/dsh-desktop-shell-client/bin/dsh-desktop-shell-client.exe
```

exe 随包提交 git（~13MB），改完必须 bump `package.json` 版本并更新 README。

## 构建 / 安装 / 开发

```bash
npm pack   # 本地 tgz
# 安装（注意手动把 @coldcgh/dsh-desktop-shell 追加到 ~/.dsh/profiles/web/package.json 的 dsh.profile.bundles）
dsh plugin --profile web add ./dsh-desktop-shell-<v>.tgz
# 快速迭代：cp lib/index.js 到 ~/.dsh/profiles/web/node_modules/@coldcgh/dsh-desktop-shell/lib/ 后重启 harness
```

- **Node 版本**：系统 Node 必须 v24+（Hermes 内置 v22 跑 dsh web 会静默退出）；客户端拉起 dsh 时同样只认系统 Node。
- 卸载路径：插件的 dispose 清理快捷方式 + 协议文件；客户端启动时也做双重校验清理。

## 已知坑

- 协议文件的 `runtimeDir` 用于客户端拉起 dsh，旧协议可能带错误后缀，客户端侧有校验兜底；插件侧写入时尽量给真实 runtime 树路径。
