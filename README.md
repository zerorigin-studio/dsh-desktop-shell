# @zerorigin-studio/dsh-desktop-shell

dsh 桌面壳插件：把 DeepSeek Harness 封装成原生 Windows 桌面客户端。

## 功能

- **内置桌面客户端**：`dsh-desktop-shell-client.exe`（Wails v3 + WebView2，~13MB）打包在 npm 包 `bin/` 内——装插件即得桌面窗口，无需单独安装客户端
- **自动拉起桌面客户端**：dsh 启动后，插件探测 web 端口、写协议文件、启动包内 exe——独立桌面窗口包裹 Harness UI（无浏览器痕迹）
- **协议文件**：`~/.dsh/dsh-web-port.json` 写入 `{port, url, pid, harnessVersion, pluginVersion, runtimeDir}`——客户端据此连接，设置页展示版本信息
- **快捷方式**：桌面 + 开始菜单注册；卸载插件时自动删除
- **客户端自动拉起 dsh**：若 harness 未运行，客户端自身会隐形启动（无控制台窗口）
- **开机自启开关**：设置页「桌面壳」开关，写入 HKCU Run 注册表项

## 安装

```bash
dsh plugin --profile web add @zerorigin-studio/dsh-desktop-shell
# 然后手动把 "@zerorigin-studio/dsh-desktop-shell" 追加到
# ~/.dsh/profiles/web/package.json 的 dsh.profile.bundles 数组
# 重启 harness
```
