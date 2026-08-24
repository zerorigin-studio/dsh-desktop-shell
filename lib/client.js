// dsh-desktop-installer — client-side UI (v3: diagnostics build).
// Shows ctx capability state on the card so we can see exactly where the
// remote call chain breaks.

window.__ModuleLoader__.load({
  id: '@coldcgh/dsh-desktop-installer',
  factory(require) {
    const module = { exports: {} }
    const exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })

    let card = null

    function mount(ctx) {
      const host = document.querySelector('[data-sidebar]') || document.body
      card = document.createElement('div')
      card.id = 'dsh-desktop-installer-card'
      card.style.cssText = [
        'margin:10px 12px;padding:12px;border-radius:10px',
        'border:1px solid rgba(127,153,255,.25);background:rgba(10,13,20,.55)',
        'font:12px/1.6 system-ui;color:#dfe5f5;display:flex;flex-direction:column;gap:8px',
      ].join(';')
      card.innerHTML =
        '<div style="font-weight:600">🖥️ 桌面启动器</div>' +
        '<div id="dsdi-status" style="opacity:.75">初始化…</div>' +
        '<div id="dsdi-actions" style="display:flex;gap:6px;flex-wrap:wrap">' +
        '<button data-a="install" style="padding:4px 10px;border:1px solid #4a5fd0;border-radius:6px;background:#22307a;color:#fff;cursor:pointer">安装</button>' +
        '<button data-a="shortcut" style="padding:4px 10px;border:1px solid #4a5fd0;border-radius:6px;background:#22307a;color:#fff;cursor:pointer">快捷方式</button>' +
        '<button data-a="refresh" style="padding:4px 10px;border:1px solid #888;border-radius:6px;background:transparent;color:#aab;cursor:pointer">刷新</button>' +
        '</div>'
      host.appendChild(card)
      card.addEventListener('click', (e) => {
        const a = e.target && e.target.getAttribute && e.target.getAttribute('data-a')
        if (a) act(ctx, a)
      })
      // 诊断：ctx 能力
      const cap = {
        hasCtx: !!ctx,
        hasRemote: !!(ctx && ctx.remote),
        hasRemoteCommands: !!(ctx && ctx.remote && ctx.remote.commands),
      }
      if (typeof ctx === 'object' && ctx && typeof ctx.remote === 'object' && ctx.remote) {
        cap.remoteKeys = Object.keys(ctx.remote).slice(0, 12).join(',')
      }
      setStatus('待命（' + JSON.stringify(cap) + '）')
      void refresh(ctx)
    }

    function setStatus(t) {
      const el = document.getElementById('dsdi-status')
      if (el) el.textContent = t
    }

    async function call(ctx, line) {
      let r
      try {
        let sid = ''
        try {
          // sessions service 当前会话 id（genui 同款写法）
          const cur = ctx.sessions && ctx.sessions.list && ctx.sessions.list.getSnapshot().current
          sid = (cur && (cur.sessionId || cur.id)) || ''
        } catch { /* sessions 不可用则空会话 */ }
        r = await ctx.remote.commands.execute(sid, line, [])
      } catch (e) {
        return { ok: false, error: '调用异常: ' + (e && e.message ? e.message : JSON.stringify(e)) }
      }
      if (!r || !r.ok) {
        const detail = typeof r.error === 'string' ? r.error : JSON.stringify(r.error || r)
        return { ok: false, error: '错误: ' + detail }
      }
      return { ok: true, value: r.value }
    }

    async function refresh(ctx) {
      const r = await call(ctx, '/launcher-status')
      if (!r.ok) return setStatus('❌ ' + r.error)
      const st = r.value || {}
      if (st.installed) {
        setStatus(
          '✅ 已安装' + (st.runtimeVersion ? ' · runtime ' + st.runtimeVersion : '') +
          (st.shortcutExists ? ' · 快捷方式✓' : ' · 快捷方式✗') +
          (st.latest ? ' · 最新 ' + st.latest.tag : '')
        )
      } else {
        setStatus('未安装' + (st.latest ? ' · 最新 ' + st.latest.tag : ''))
      }
    }

    async function act(ctx, a) {
      if (a === 'install') {
        setStatus('⏳ 正在下载并安装…（约 1-3 分钟）')
        const r = await call(ctx, '/launcher-install')
        setStatus(r.ok ? '✅ 安装完成' + (r.value && r.value.shortcut ? '，快捷方式已创建' : '') : '❌ ' + r.error)
      } else if (a === 'shortcut') {
        setStatus('⏳ 创建快捷方式…')
        const r = await call(ctx, '/launcher-shortcut')
        setStatus(r.ok ? (r.value && r.value.shortcut ? '✅ 快捷方式已创建' : '⚠ 创建失败') : '❌ ' + r.error)
      } else {
        await refresh(ctx)
      }
    }

    exports.apply = function apply(ctx) {
      mount(ctx)
    }
    exports.inject = ['remote', 'remote.commands', 'sessions']

    return module.exports
  },
})