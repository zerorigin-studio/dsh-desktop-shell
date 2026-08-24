// dsh-desktop-shell — minimal desktop wrapper plugin.
// The harness (dsh web) is ALREADY running inside the dsh process — this
// plugin's only job is to open a dedicated desktop window that wraps it
// (Edge --app immersive window, zero extra runtime needed).
//
// Run "dsh web" (or your launcher), and a desktop window with the Harness
// UI appears automatically.

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'

export const name = 'dsh-shell'
// 不声明 inject：本插件只需无依赖地拿进程内监听端口并打开窗口

const LOCAL = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local')

// Edge path candidates (Windows) — kept for reference/testing; the main
// path is the dedicated Wails v3 desktop client (findClient).

// 进程内扫描监听端口：dsh web 与插件同 Node 进程，服务器句柄可见
function findListenPorts() {
  const ports = []
  const seen = new Set()
  const handles = (process._getActiveHandles && process._getActiveHandles()) || []
  for (const h of handles) {
    try {
      if (typeof h.address !== 'function') continue
      const a = h.address()
      if (a && typeof a.port === 'number' && !seen.has(a.port)) {
        seen.add(a.port)
        ports.push(a.port)
      }
    } catch { /* ignore */ }
  }
  return ports
}

// 轮询等待 dsh web 监听（插件 apply 早于 web server 启动）
function waitForPort(maxMs = 30000) {
  return new Promise((resolve) => {
    const t0 = Date.now()
    const tick = () => {
      const ports = findListenPorts()
      if (ports.length > 0) return resolve(ports)
      if (Date.now() - t0 > maxMs) return resolve(ports)
      setTimeout(tick, 1000)
    }
    tick()
  })
}

// 用 HTTP 探测选出真正的 web 端口
async function pickHttpPort(ports) {
  for (const p of [...ports].sort((a, b) => a - b)) {
    try {
      const res = await fetch(`http://127.0.0.1:${p}/`, { signal: AbortSignal.timeout(1500) })
      if (res.ok) return p
    } catch { /* try next */ }
  }
  return null
}

// runtime 树目录（bin.js 上 4 级：lib → dsh → @deepseek-ai → node_modules → 树根）
function inferRuntimeDir() {
  try {
    const bin = process.argv[1] || ''
    return path.join(path.dirname(bin), '..', '..', '..', '..')
  } catch {
    return ''
  }
}

// 读取 harness 官方版本（runtime 树顶层 .dsh-runtime-version，或 @deepseek-ai/dsh package.json）
function readHarnessVersion() {
  try {
    const bin = process.argv[1] || ''
    // bin.js 在 node_modules/@deepseek-ai/dsh/lib/ → 上 4 级 = runtime 树顶层
    const f = path.join(path.dirname(bin), '..', '..', '..', '..', '.dsh-runtime-version')
    if (fs.existsSync(f)) return fs.readFileSync(f, 'utf8').trim()
  } catch {}
  try {
    const p = path.join(path.dirname(bin), '..', 'package.json')
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8')).version
  } catch {}
  return ''
}

// 读取插件自身版本（ESM：用 import.meta.url 定位）
function readPluginVersion() {
  try {
    const p = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'package.json')
    return JSON.parse(fs.readFileSync(p, 'utf8')).version
  } catch {}
  return ''
}
function findClient() {
  const devCandidates = [
    'D:\\WorkSpaces\\dsh-desktop-shell-client.exe',
    'D:\\WorkSpaces\\dsh-desktop-shell\\dsh-desktop-shell.exe',
  ]
  const prodCandidates = [
    path.join(LOCAL, 'Programs', 'dsh-desktop-shell', 'dsh-desktop-shell.exe'),
    path.join(LOCAL, 'Programs', 'DeepSeekHarness', 'dsh-desktop-shell.exe'),
  ]
  for (const p of [...devCandidates, ...prodCandidates]) {
    if (p && fs.existsSync(p)) return p
  }
  return null
}

// 卸载清理：删除桌面/开始菜单快捷方式（客户端启动时创建的）+ 协议文件
function cleanupShortcuts() {
  const home = os.homedir()
  const startMenu = process.env.APPDATA
    ? path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs')
    : ''
  const targets = [
    path.join(home, 'Desktop', 'DeepSeek Harness.lnk'),
    ...(startMenu ? [path.join(startMenu, 'DeepSeek Harness.lnk')] : []),
  ]
  for (const t of targets) {
    try {
      if (fs.existsSync(t)) {
        fs.unlinkSync(t)
        console.log('[dsh-desktop-shell] 已删除快捷方式: ' + t)
      }
    } catch (e) { /* 单个失败不影响其余 */ }
  }
  // 协议文件 = 插件存活标志；删除后客户端启动时会兜底清理快捷方式
  try {
    const marker = path.join(os.homedir(), '.dsh', 'dsh-web-port.json')
    if (fs.existsSync(marker)) {
      fs.unlinkSync(marker)
      console.log('[dsh-desktop-shell] 已删除协议文件（桌面客户端将自动清理快捷方式）')
    }
  } catch (e) { /* ignore */ }
}

export function apply(ctx) {
  const logger = ctx.get('logger')
  void (async () => {
    const ports = await waitForPort()
    // (成功类打点已清理)
    logger?.info(line)

    const port = await pickHttpPort(ports)
    if (!port) {
      logger?.warn('[dsh-desktop-shell] 未找到可用的 web 端口')
      return
    }
    const url = `http://127.0.0.1:${port}`

    // 协议文件：供桌面客户端读取
    try {
      const marker = path.join(os.homedir(), '.dsh', 'dsh-web-port.json')
      fs.writeFileSync(marker, JSON.stringify({
        port, url, pid: process.pid, at: new Date().toISOString(),
        harnessVersion: readHarnessVersion(),
        pluginVersion: readPluginVersion(),
        runtimeDir: inferRuntimeDir(),
      }, null, 2))
    } catch (e) {
      logger?.warn('[dsh-desktop-shell] 写协议文件失败: ' + (e && e.message))
    }

    const client = findClient()
    if (!client) {
      logger?.warn('[dsh-desktop-shell] 未找到桌面客户端 exe，跳过启动窗口')
      console.log('[dsh-desktop-shell] 未找到桌面客户端 exe')
      return
    }
    try {
      const child = spawn(client, [], {
        detached: true,
        stdio: 'ignore',
      })
      child.unref()
        logger?.info(`[dsh-desktop-shell] 已启动桌面客户端 ${url}`)
    } catch (e) {
      console.log('[dsh-desktop-shell] spawn 异常: ' + (e && e.message))
    }
  })()

  // cordis 卸载/停用时调用：清理快捷方式
  return cleanupShortcuts
}