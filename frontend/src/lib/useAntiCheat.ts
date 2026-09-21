"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { studentAntiCheatApi, StudentRule, ViolationResult, QueuedViolation } from "@/lib/api/anticheat";

const IDLE_MS = 120_000;      // no input for 2 minutes => idle
const DEDUPE_MS = 1_500;      // the same event within this window is one event
const EXT_SCHEME = /^(chrome|moz|safari|edge)-extension:\/\//i;
const SEVERITY_ORDER = ["auto_submitted", "blocked", "flagged", "warned"];

export interface AntiCheatAction extends ViolationResult {
  eventType: string;
}

interface Options {
  attemptId: string;
  /** Exam loaded and running — monitoring starts once true. */
  active: boolean;
  /** Runs before each report so an auto-submit grades the student's latest answers. */
  beforeReport?: () => Promise<void>;
  /** A monitored event just happened (before the server answers) — used to lock the screen. */
  onDetected?: (eventType: string) => void;
  /** The server decided on an action (warn / flag / block / auto-submit). */
  onAction: (action: AntiCheatAction) => void;
}

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

/**
 * Watches the exam page for suspicious behaviour and reports it to the
 * server, which applies the teacher's rule (Allow / Warn / Flag / Block /
 * Auto-submit). An event the teacher has set to Allow is neither prevented nor
 * reported, and the matching listener isn't even installed.
 */
export function useAntiCheat(options: Options) {
  const { attemptId, active } = options;
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const rulesRef = useRef<Map<string, StudentRule>>(new Map());
  const requireCameraRef = useRef(false);
  const lastSentRef = useRef<Record<string, number>>({});
  const streamsRef = useRef<MediaStream[]>([]);
  const mediaPromptRef = useRef(false);
  const lastFullscreenChangeRef = useRef(0);

  const [ready, setReady] = useState(false);
  const [offline, setOffline] = useState(false);
  const [mediaBlocked, setMediaBlocked] = useState(false);

  // Until told otherwise (or if the config can't be fetched) every event counts.
  const isActive = useCallback((eventType: string) => {
    const rule = rulesRef.current.get(eventType);
    return !rule || (rule.enabled && rule.action !== "ignore");
  }, []);

  // ── Rules ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!attemptId) return;
    let cancelled = false;
    studentAntiCheatApi.getConfig(attemptId)
      .then(cfg => {
        if (cancelled) return;
        rulesRef.current = new Map(cfg.rules.map(r => [r.eventType, r]));
        requireCameraRef.current = cfg.requireCamera;
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setReady(true); });
    return () => { cancelled = true; };
  }, [attemptId]);

  // ── Reporting + offline queue ────────────────────────────────────────────
  const queueKey = `ac_queue_${attemptId}`;
  const readQueue = (): QueuedViolation[] => {
    try { return JSON.parse(localStorage.getItem(queueKey) || "[]"); } catch { return []; }
  };
  const enqueue = (item: QueuedViolation) => {
    localStorage.setItem(queueKey, JSON.stringify([...readQueue(), item].slice(-50)));
  };

  const deliver = (result: ViolationResult, eventType: string) => {
    if (result.actionTaken !== "ignored") optionsRef.current.onAction({ ...result, eventType });
  };

  const flushQueue = useCallback(async () => {
    if (!attemptId || !navigator.onLine) return;
    const queue = readQueue();
    if (queue.length === 0) return;
    try {
      const { results } = await studentAntiCheatApi.flushOfflineQueue(attemptId, queue);
      localStorage.removeItem(queueKey);
      // One notice for the whole batch: the most serious outcome.
      const worst = SEVERITY_ORDER.map(a => results.find(r => r.actionTaken === a)).find(Boolean);
      if (worst) deliver(worst, "offline");
    } catch (e) {
      if (!(e instanceof TypeError)) localStorage.removeItem(queueKey); // e.g. already submitted
    }
  }, [attemptId]);

  const report = useCallback(async (eventType: string, detail?: string) => {
    if (!isActive(eventType)) return;
    const now = Date.now();
    if (now - (lastSentRef.current[eventType] ?? 0) < DEDUPE_MS) return;
    lastSentRef.current[eventType] = now;

    optionsRef.current.onDetected?.(eventType);

    const item: QueuedViolation = { eventType, detail, occurredAt: new Date().toISOString() };
    if (!navigator.onLine) { enqueue(item); return; }
    try {
      await Promise.race([optionsRef.current.beforeReport?.(), sleep(1_500)]);
      deliver(await studentAntiCheatApi.reportViolation(attemptId, eventType, detail), eventType);
    } catch (e) {
      if (e instanceof TypeError || !navigator.onLine) enqueue(item);
    }
  }, [attemptId, isActive]);

  // ── Camera / microphone ──────────────────────────────────────────────────
  const watchTrack = useCallback((track: MediaStreamTrack, eventType: "disconnect_camera" | "disconnect_mic") => {
    let muteTimer: number | undefined;
    track.addEventListener("ended", () => {
      if (eventType === "disconnect_camera") setMediaBlocked(true);
      report(eventType, "Device disconnected");
    });
    // A brief mute is normal; a feed that stays muted is not.
    track.addEventListener("mute", () => { muteTimer = window.setTimeout(() => report(eventType, "Feed stopped"), 4_000); });
    track.addEventListener("unmute", () => window.clearTimeout(muteTimer));
  }, [report]);

  const setupMedia = useCallback(async () => {
    if (!requireCameraRef.current || !navigator.mediaDevices?.getUserMedia) return;
    streamsRef.current.forEach(s => s.getTracks().forEach(t => t.stop()));
    streamsRef.current = [];
    mediaPromptRef.current = true; // the browser's permission prompt steals focus — don't count it
    try {
      const video = await navigator.mediaDevices.getUserMedia({ video: true });
      streamsRef.current.push(video);
      video.getVideoTracks().forEach(t => watchTrack(t, "disconnect_camera"));
      setMediaBlocked(false);
      if (isActive("disconnect_mic")) {
        try {
          const audio = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamsRef.current.push(audio);
          audio.getAudioTracks().forEach(t => watchTrack(t, "disconnect_mic"));
        } catch {
          report("disconnect_mic", "Microphone access denied");
        }
      }
    } catch {
      setMediaBlocked(true);
      report("disconnect_camera", "Camera access denied or unavailable");
    } finally {
      mediaPromptRef.current = false;
    }
  }, [isActive, report, watchTrack]);

  // ── Listeners ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!active || !ready || !attemptId) return;
    const cleanups: Array<() => void> = [];
    const on = <T extends EventTarget>(target: T, type: string, handler: (e: any) => void, opts?: boolean | AddEventListenerOptions) => {
      target.addEventListener(type, handler, opts);
      cleanups.push(() => target.removeEventListener(type, handler, opts));
    };
    let lastTabSwitch = 0;

    // Tab switching / other applications
    on(document, "visibilitychange", () => {
      if (document.hidden) { lastTabSwitch = Date.now(); report("tab_switch", "Left the exam tab"); }
    });
    on(window, "blur", () => {
      window.setTimeout(() => {
        if (document.hidden || document.hasFocus() || mediaPromptRef.current) return;
        if (Date.now() - lastTabSwitch < 1_000) return; // already reported as a tab switch
        report("window_blur", "Exam window lost focus");
      }, 300);
    });

    // Full screen
    on(document, "fullscreenchange", () => {
      lastFullscreenChangeRef.current = Date.now();
      if (!document.fullscreenElement) report("fullscreen_exit", "Left fullscreen");
    });

    // Right-click, copy, paste — blocked unless the teacher allows them
    on(document, "contextmenu", (e: Event) => { if (isActive("right_click")) { e.preventDefault(); report("right_click"); } });
    const blockClipboard = (type: "copy" | "paste") => (e: Event) => {
      if (isActive(type)) { e.preventDefault(); e.stopPropagation(); report(type); }
    };
    on(document, "copy", blockClipboard("copy"));
    on(document, "cut", blockClipboard("copy"));
    on(document, "paste", blockClipboard("paste"));
    // Selecting/dragging text is only a way to copy it — block quietly, no event.
    const quietBlock = (e: Event) => { if (isActive("copy")) e.preventDefault(); };
    on(document, "selectstart", quietBlock);
    on(document, "dragstart", quietBlock);
    on(document, "drop", quietBlock);

    // Keyboard shortcuts
    on(document, "keydown", (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const meta = e.ctrlKey || e.metaKey;
      let type: string | null = null;
      if (meta && (key === "c" || key === "x")) type = "copy";
      else if (meta && key === "v") type = "paste";
      else if (
        (meta && ["a", "f", "l", "n", "p", "r", "s", "t", "u", "w"].includes(key)) ||
        (meta && e.shiftKey && ["c", "i", "j"].includes(key)) || key === "f12" ||
        (e.altKey && ["arrowleft", "arrowright", "tab"].includes(key))
      ) type = "keyboard_shortcut";
      if (type && isActive(type)) {
        e.preventDefault();
        e.stopPropagation();
        report(type, `Key: ${e.ctrlKey ? "Ctrl+" : ""}${e.shiftKey ? "Shift+" : ""}${e.altKey ? "Alt+" : ""}${e.key}`);
      }
    }, true);
    if (isActive("print_screen")) {
      on(document, "keyup", (e: KeyboardEvent) => {
        if (e.key === "PrintScreen") {
          navigator.clipboard?.writeText("").catch(() => {}); // wipe what the screenshot put on the clipboard
          report("print_screen");
        }
      });
    }

    // Internet connection
    on(window, "offline", () => { setOffline(true); report("disconnect_internet", "Connection lost"); });
    on(window, "online", () => { setOffline(false); flushQueue(); });
    if (!navigator.onLine) setOffline(true);
    flushQueue(); // anything left over from an earlier page load

    // Idle
    if (isActive("idle")) {
      let idleTimer = 0, lastReset = 0;
      const arm = () => {
        window.clearTimeout(idleTimer);
        idleTimer = window.setTimeout(() => report("idle", `No activity for ${IDLE_MS / 1000}s`), IDLE_MS);
      };
      const activity = () => { const n = Date.now(); if (n - lastReset > 1_000) { lastReset = n; arm(); } };
      ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "wheel"].forEach(t => on(window, t, activity, { passive: true, capture: true }));
      arm();
      cleanups.push(() => window.clearTimeout(idleTimer));
    }

    // Resizing (ignoring the resize that entering/leaving fullscreen causes)
    if (isActive("resize")) {
      let resizeTimer = 0;
      on(window, "resize", () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => {
          if (Date.now() - lastFullscreenChangeRef.current < 1_500) return;
          report("resize", `${window.innerWidth}x${window.innerHeight}`);
        }, 700);
      });
      cleanups.push(() => window.clearTimeout(resizeTimer));
    }

    // Developer tools — a heuristic: docked tools shrink the viewport
    if (isActive("devtools")) {
      let open = false;
      const timer = window.setInterval(() => {
        const shrunk = document.fullscreenElement
          ? window.innerWidth < screen.width - 160 || window.innerHeight < screen.height - 160
          : window.outerWidth - window.innerWidth > 200 || window.outerHeight - window.innerHeight > 200;
        if (shrunk && !open) report("devtools", "Developer tools appear to be open");
        open = shrunk;
      }, 2_500);
      cleanups.push(() => window.clearInterval(timer));
    }

    // Exam open in more than one window/tab — the newer one notices the older
    if (isActive("multiple_windows") && "BroadcastChannel" in window) {
      const channel = new BroadcastChannel(`exam-window-${attemptId}`);
      const me = Math.random().toString(36).slice(2);
      channel.onmessage = (ev) => {
        if (ev.data?.id === me) return;
        if (ev.data?.type === "hello") channel.postMessage({ type: "here", id: me });
        if (ev.data?.type === "here") report("multiple_windows", "Exam is open in another window or tab");
      };
      channel.postMessage({ type: "hello", id: me });
      cleanups.push(() => channel.close());
    }

    // Browser extensions — heuristic: extensions inject recognisable elements
    if (isActive("extension_detected")) {
      const looksInjected = (el: Element) =>
        /extension/i.test(el.tagName) || /^(grammarly|lastpass|dashlane|honey)/i.test(el.tagName) ||
        EXT_SCHEME.test(el.getAttribute("src") || "") || EXT_SCHEME.test(el.getAttribute("href") || "") ||
        Array.from(el.attributes).some(a => /extension/i.test(a.name));
      const check = (el: Element) => {
        if (looksInjected(el)) { report("extension_detected", el.tagName.toLowerCase()); return true; }
        return false;
      };
      const observer = new MutationObserver(mutations => {
        for (const m of mutations) {
          m.addedNodes.forEach(n => {
            if (n.nodeType !== 1) return;
            const el = n as Element;
            if (!check(el)) {
              const inner = el.querySelector("[src*='-extension://'], [href*='-extension://']");
              if (inner) check(inner);
            }
          });
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
      cleanups.push(() => observer.disconnect());
      document.querySelectorAll("grammarly-extension, grammarly-desktop-integration, [src*='-extension://']").forEach(check);
    }

    // Camera / microphone (only exams that require a camera)
    setupMedia();
    cleanups.push(() => { streamsRef.current.forEach(s => s.getTracks().forEach(t => t.stop())); streamsRef.current = []; });

    return () => cleanups.forEach(fn => fn());
  }, [active, ready, attemptId, isActive, report, flushQueue, setupMedia]);

  const recheckConnection = useCallback(() => {
    if (navigator.onLine) { setOffline(false); flushQueue(); }
  }, [flushQueue]);

  return { offline, mediaBlocked, retryMedia: setupMedia, recheckConnection };
}
