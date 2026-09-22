// Shared display helpers for ViolationLog.eventType / actionTaken / severity
// values, which are stored as raw snake_case strings — see
// backend/src/services/anti-cheat.service.ts for the canonical list.

const EVENT_LABELS: Record<string, string> = {
  tab_switch: "Tab switch",
  copy: "Copy attempt",
  paste: "Paste attempt",
  right_click: "Right-click attempt",
  keyboard_shortcut: "Keyboard shortcut",
  fullscreen_exit: "Fullscreen exit",
  window_blur: "Window blur",
  devtools: "DevTools opened",
  print_screen: "Screenshot attempt",
  idle: "Idle timeout",
  disconnect_internet: "Internet disconnected",
  disconnect_camera: "Camera disconnected",
  disconnect_mic: "Mic disconnected",
  resize: "Window resized",
  multiple_windows: "Multiple windows",
  extension_detected: "Extension detected",
};

export function eventLabel(type: string): string {
  return EVENT_LABELS[type] || type.replace(/_/g, " ").replace(/^\w/, c => c.toUpperCase());
}

const ACTION_LABELS: Record<string, string> = {
  ignored: "Ignored",
  warned: "Warning sent",
  flagged: "Flagged",
  blocked: "Blocked",
  auto_submitted: "Auto-submitted",
};

export function actionLabel(action: string | null): string {
  if (!action) return "—";
  return ACTION_LABELS[action] || action;
}
