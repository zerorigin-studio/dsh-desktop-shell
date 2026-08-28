window.__ModuleLoader__.load({ id: "@coldcgh/dsh-desktop-shell", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
var import_jsx_runtime = require("react/jsx-runtime");
var import_client = require("@deepseek-ai/dsh-client-store");

var SHELL_NS = "shell";
var AUTOSTART_FIELD = "autostart";

var ShellPolicy = class {
  autostart = (0, import_client.createSnapshotStore)(false);
  host;
  /** @param host - durable settings scope owned by this plugin (absent compositions stay process-local). */
  constructor(host) {
    this.host = host;
    if (host !== void 0) {
      host.subscribe(() => { this.adopt(host); });
      this.adopt(host);
    }
  }
  setAutostart(next) {
    if (this.autostart.getSnapshot() === next) return;
    this.autostart.set(next);
    void this.host?.set(AUTOSTART_FIELD, next);
  }
  adopt(host) {
    const section = host.getSnapshot().value;
    if (section === void 0 || this.autostart.getSnapshot() === section.autostart) return;
    this.autostart.set(section.autostart);
  }
};

function ShellToggle({ useAutostart, setAutostart }) {
  const on = useAutostart((value) => value);
  const toggle = () => { setAutostart?.(!on); };
  return (0, import_jsx_runtime.jsxs)("div", { style: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    gap: 16, padding: "12px 0", width: "100%", boxSizing: "border-box"
  }, children: [
    (0, import_jsx_runtime.jsxs)("div", { style: { minWidth: 0 }, children: [
      (0, import_jsx_runtime.jsx)("div", { style: { fontSize: 14, fontWeight: 500, lineHeight: "20px", color: "var(--dsw-alias-label-primary)" }, children: "桌面壳" }),
      (0, import_jsx_runtime.jsx)("div", { style: { fontSize: 12, lineHeight: "18px", marginTop: 2, color: "var(--dsw-alias-label-secondary)" }, children: "开机自启：登录 Windows 后自动启动 DeepSeek Harness 桌面客户端。" })
    ] }),
    (0, import_jsx_runtime.jsx)("button", {
      type: "button", role: "switch", "aria-checked": on, "aria-label": "开机自启",
      onClick: toggle,
      style: {
        width: 36, height: 20, borderRadius: 10, border: "none", cursor: "pointer",
        padding: 0, position: "relative", flexShrink: 0,
        background: on ? "var(--dsw-alias-accent)" : "var(--dsw-alias-fill-2)",
        transition: "background 120ms ease"
      },
      children: (0, import_jsx_runtime.jsx)("span", { style: {
        display: "block", width: 16, height: 16, borderRadius: "50%",
        background: "#fff",
        position: "absolute", top: 2,
        left: on ? 18 : 2, transition: "left 120ms ease"
      } })
    })
  ] });
}

var inject = ["slots", "settingsScope"];
function apply(ctx) {
  const scope = ctx.settingsScope.bind({ namespace: SHELL_NS });
  const policy = new ShellPolicy(scope);
  ctx.effect(
    () => ctx.slots.inject("settings.plugin.item", function* () {
      yield ctx.slots.register(
        {
          name: "settings.plugin.item",
          key: "dsh-desktop-shell-autostart",
          id: "dsh-desktop-shell-autostart",
          order: 30,
          label: () => "桌面壳",
          inject: () => ({
            hooks: { autostart: policy.autostart },
            setAutostart: (next) => { policy.setAutostart(next); },
          }),
        },
        ShellToggle,
      )
    }),
    "dsh-desktop-shell: plugin settings card",
  );
}
module.exports = { apply, inject };
return module.exports;
}});