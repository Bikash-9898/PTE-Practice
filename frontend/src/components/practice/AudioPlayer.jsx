import { useState, useEffect, useRef } from "react";
import { FiPlay, FiPause, FiVolume2, FiSettings } from "react-icons/fi";
import Button from "../common/Button";

/**
 * Tracks whether the user has manually stopped playback. We use this to
 * distinguish "auto-restart after voice change" from "user clicked Pause
 * and would like it to stay paused".
 */
const PAUSE = 0;
const PLAYING = 1;

/**
 * Each preset carries the target language *and* curated lists of known
 * voice names that ship on common OS/browser combos. The picker matches
 * a label against the actual installed voices by name so the gender in
 * the label matches the gender the user hears.
 */
export const VOICE_OPTIONS = [
  {
    id: "female-IN",
    label: "Female (IN)",
    lang: "en-IN",
    gender: "female",
    femaleNames: [
      "Veena",
      "Heera",
      "Google हिन्दी",
      "Microsoft Heera",
      "Microsoft Heera Desktop",
    ],
    maleNames: [
      "Rishi",
      "Microsoft Rishi",
      "Microsoft Rishi Desktop",
    ],
  },
  {
    id: "male-AU",
    label: "Male (AU)",
    lang: "en-AU",
    gender: "male",
    femaleNames: [
      "Karen",
      "Microsoft Linda",
      "Microsoft Linda Desktop",
      "Google AU English Female",
    ],
    maleNames: [
      "Lee",
      "Microsoft James",
      "Microsoft James Desktop",
      "Google AU English Male",
    ],
  },
  {
    id: "male-US",
    label: "Male (US)",
    lang: "en-US",
    gender: "male",
    femaleNames: [
      "Samantha",
      "Zira",
      "Microsoft Zira",
      "Microsoft Zira Desktop",
      "Google US English Female",
      "Ava",
      "Allison",
    ],
    maleNames: [
      "Alex",
      "Daniel",
      "Fred",
      "David",
      "Microsoft David",
      "Microsoft David Desktop",
      "Google US English Male",
    ],
  },
  {
    id: "female-UK",
    label: "Female (UK)",
    lang: "en-GB",
    gender: "female",
    femaleNames: [
      "Kate",
      "Susan",
      "Martha",
      "Serena",
      "Google UK English Female",
      "Microsoft Hazel",
      "Microsoft Hazel Desktop",
      "Microsoft Susan",
      "Microsoft Susan Desktop",
    ],
    maleNames: [
      "Daniel",
      "Oliver",
      "Google UK English Male",
      "Microsoft George",
      "Microsoft George Desktop",
    ],
  },
];

/**
 * Returns a stable key for voice identity so React keys don't churn.
 */
function voiceKey(voice) {
  return `${voice.name}__${voice.lang}`;
}

/**
 * Picks the best matching browser voice for a requested voice preset.
 * Tries, in order:
 *   1. Curated list of voices whose name is known to be the requested gender.
 *   2. Curated list of the opposite gender (better than nothing).
 *   3. Any voice matching the exact language.
 *   4. Any voice with the same language prefix.
 */
function findPresetVoice(preset, allVoices) {
  if (!preset) return null;
  const voices =
    allVoices ||
    (typeof window !== "undefined" && "speechSynthesis" in window
      ? window.speechSynthesis.getVoices()
      : []);
  if (!voices.length) return null;

  const wantedGender = preset.gender;
  const wantedNames = (wantedGender === "female" ? preset.femaleNames : preset.maleNames) || [];
  return (
    wantedNames
      .map((name) =>
        voices.find(
          (voice) =>
            voice.name === name || voice.name.toLowerCase().includes(name.toLowerCase())
        )
      )
      .find(Boolean) || null
  );
}

function pickVoice(preset, allVoices) {
  if (!preset) return null;
  const voices =
    allVoices ||
    (typeof window !== "undefined" && "speechSynthesis" in window
      ? window.speechSynthesis.getVoices()
      : []);
  if (!voices.length) return null;

  const gendered = findPresetVoice(preset, voices);
  if (gendered) return gendered;

  const exactLang = voices.find(
    (v) => v.lang.toLowerCase() === preset.lang.toLowerCase()
  );
  if (exactLang) return exactLang;

  const langPrefix = preset.lang.split("-")[0].toLowerCase();
  const partial = voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix));
  return partial || null;
}

/**
 * Chrome and Edge populate the voice list asynchronously on some systems.
 * Resolves with the voices whenever they become available.
 */
function whenVoicesReady(timeoutMs = 1500) {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve([]);
      return;
    }
    const immediate = window.speechSynthesis.getVoices();
    if (immediate.length) {
      resolve(immediate);
      return;
    }
    let timeout;
    const finish = () => {
      window.speechSynthesis.removeEventListener?.("voiceschanged", handler);
      clearTimeout(timeout);
      resolve(window.speechSynthesis.getVoices() || []);
    };
    const handler = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length) {
        finish();
      }
    };
    timeout = setTimeout(finish, timeoutMs);
    window.speechSynthesis.addEventListener?.("voiceschanged", handler);
  });
}

export default function AudioPlayer({
  text,
  label = "Audio prompt",
  onEnded,
  autoPlay = false,
  showVoiceSelector = false,
}) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [supported, setSupported] = useState(true);
  const [mode, setMode] = useState("speech");
  const [voices, setVoices] = useState([]);
  const [voiceId, setVoiceId] = useState(() => {
    try {
      return localStorage.getItem("pte_voice_pref") || VOICE_OPTIONS[0].id;
    } catch {
      return VOICE_OPTIONS[0].id;
    }
  });
  const [voicePickerOpen, setVoicePickerOpen] = useState(false);

  const utteranceRef = useRef(null);
  const progressTimerRef = useRef(null);
  const playbackIdRef = useRef(0);
  const userIntentRef = useRef(autoPlay ? PLAYING : PAUSE);
  const duration = Math.max(3, Math.ceil((text || "").split(" ").length * 0.4));

  useEffect(() => {
    const ok = typeof window !== "undefined" && "speechSynthesis" in window;
    setSupported(ok);
    setMode(ok ? "speech" : "mock");

    if (!ok) return undefined;

    const refresh = () => setVoices(window.speechSynthesis.getVoices() || []);
    window.speechSynthesis.addEventListener?.("voiceschanged", refresh);
    refresh();
    // Also kick off a small retry for engines that populate late.
    const t = setTimeout(refresh, 200);

    return () => {
      window.speechSynthesis.removeEventListener?.("voiceschanged", refresh);
      clearTimeout(t);
      window.speechSynthesis?.cancel();
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  // When the text or voice changes, restart playback using the current voice.
  // If the user previously clicked Pause, leave it paused instead.
  useEffect(() => {
    stop();
    setProgress(0);
    if (userIntentRef.current === PLAYING) {
      const id = setTimeout(() => play(), 30);
      return () => clearTimeout(id);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, voiceId, autoPlay]);

  useEffect(() => {
    try {
      localStorage.setItem("pte_voice_pref", voiceId);
    } catch {
      /* ignore */
    }
  }, [voiceId]);

  useEffect(() => {
    if (!voices.length) return;
    const selectedPreset = VOICE_OPTIONS.find((preset) => preset.id === voiceId);
    if (findPresetVoice(selectedPreset, voices)) return;
    const firstAvailablePreset = VOICE_OPTIONS.find((preset) =>
      findPresetVoice(preset, voices)
    );
    if (firstAvailablePreset) setVoiceId(firstAvailablePreset.id);
  }, [voices, voiceId]);

  const stop = (userInitiated = false) => {
    playbackIdRef.current += 1;
    window.speechSynthesis?.cancel();
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    setPlaying(false);
    if (userInitiated) userIntentRef.current = PAUSE;
  };

  const playSpeech = async () => {
    if (!text) return;
    const playbackId = ++playbackIdRef.current;
    window.speechSynthesis.cancel();
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    setPlaying(true);
    setProgress(0);
    userIntentRef.current = PLAYING;
    const preset = VOICE_OPTIONS.find((v) => v.id === voiceId) || VOICE_OPTIONS[0];

    // Make sure the voice list is populated before we try to match.
    const available = voices.length ? voices : await whenVoicesReady();
    if (playbackId !== playbackIdRef.current) return;
    if (available.length && !voices.length) setVoices(available);

    const voice = pickVoice(preset, available);

    const u = new SpeechSynthesisUtterance(text);
    u.lang = voice?.lang || preset.lang;
    u.rate = 0.95;
    u.volume = 1;
    if (voice) u.voice = voice;

    u.onend = () => {
      if (playbackId !== playbackIdRef.current) return;
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      setPlaying(false);
      setProgress(100);
      onEnded?.();
    };
    u.onerror = () => {
      if (playbackId !== playbackIdRef.current) return;
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      setPlaying(false);
      setMode("mock");
      playMock();
    };

    utteranceRef.current = u;
    const start = Date.now();
    progressTimerRef.current = setInterval(() => {
      if (playbackId !== playbackIdRef.current) return;
      const p = Math.min(99, ((Date.now() - start) / (duration * 1000)) * 100);
      setProgress(p);
    }, 100);
    window.speechSynthesis.speak(u);
  };

  const playMock = () => {
    const playbackId = ++playbackIdRef.current;
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    setPlaying(true);
    setProgress(0);
    userIntentRef.current = PLAYING;
    const start = Date.now();
    progressTimerRef.current = setInterval(() => {
      if (playbackId !== playbackIdRef.current) return;
      const elapsed = (Date.now() - start) / 1000;
      const p = Math.min(100, (elapsed / duration) * 100);
      setProgress(p);
      if (p >= 100) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
        setPlaying(false);
        onEnded?.();
      }
    }, 100);
  };

  const play = () => {
    if (mode === "speech" && supported) playSpeech();
    else playMock();
  };

  const toggle = () => {
    if (playing) stop(true);
    else {
      userIntentRef.current = PLAYING;
      play();
    }
  };

  const handleVoiceChange = (id) => {
    setVoiceId(id);
    setVoicePickerOpen(false);
    userIntentRef.current = PLAYING;
    setMode(supported ? "speech" : "mock");
  };

  const currentVoice = VOICE_OPTIONS.find((v) => v.id === voiceId) || VOICE_OPTIONS[0];

  // Names of voices that would actually be picked for each preset, used as
  // a "Installed voices" hint inside the picker so users know what will speak.
  const matchedVoiceNames = VOICE_OPTIONS.map((preset) => {
    const v = findPresetVoice(preset, voices);
    return { id: preset.id, name: v?.name || null };
  });

  return (
    <div className="card p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center">
          <FiVolume2 size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-navy dark:text-white">{label}</p>
          <p className="text-xs text-slate-400">
            {mode === "speech"
              ? `Played using browser text-to-speech · ${currentVoice.label}`
              : "Simulated player — no real audio file available in this demo"}
          </p>
        </div>

        {showVoiceSelector && supported && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setVoicePickerOpen((o) => !o)}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-2.5 py-1.5 rounded-lg"
              aria-haspopup="listbox"
              aria-expanded={voicePickerOpen}
            >
              <FiSettings size={12} />
              {currentVoice.label}
              <span className="text-slate-400">▾</span>
            </button>
            {voicePickerOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setVoicePickerOpen(false)}
                  aria-hidden="true"
                />
                <div
                  role="dialog"
                  aria-label="Voice selector"
                  className="absolute right-0 mt-1 w-72 max-h-[60vh] sm:max-h-80 bg-white dark:bg-navy-light border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-20 animate-fade-in flex flex-col overflow-hidden"
                >
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Choose prompt voice
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Available voices depend on your browser and operating system
                    </p>
                  </div>

                  <ul
                    role="listbox"
                    className="flex-1 overflow-y-auto py-1 overscroll-contain"
                    style={{
                      maxHeight: "min(60vh, 320px)",
                      scrollbarWidth: "thin",
                    }}
                  >
                    {VOICE_OPTIONS.map((v) => {
                      const matched = matchedVoiceNames.find((m) => m.id === v.id);
                      const isActive = v.id === voiceId;
                      return (
                        <li key={v.id}>
                          <button
                            type="button"
                            onClick={() => handleVoiceChange(v.id)}
                            disabled={voices.length > 0 && !matched?.name}
                            className={`w-full text-left px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 ${
                              isActive
                                ? "bg-blue-50 dark:bg-blue-900/20"
                                : ""
                            } disabled:cursor-not-allowed disabled:opacity-50`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`text-sm ${
                                  isActive
                                    ? "font-semibold text-brand"
                                    : "text-slate-700 dark:text-slate-200"
                                }`}
                              >
                                {v.label}
                              </span>
                              {isActive && (
                                <span className="text-[10px] uppercase tracking-wide text-brand font-bold">
                                  Active
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                              {matched?.name
                                ? `Will use: ${matched.name}`
                                : voices.length === 0
                                ? "Detecting installed voices…"
                                : `No matching ${v.gender} voice installed`}
                            </p>
                          </button>
                        </li>
                      );
                    })}
                  </ul>

                  {voices.length > 0 && (
                    <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                      <p className="text-[11px] text-slate-500">
                        {voices.length} voice{voices.length === 1 ? "" : "s"} installed in this
                        browser. Install more in your operating system settings to hear different
                        accents.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        <Button size="sm" variant={playing ? "secondary" : "primary"} onClick={toggle}>
          {playing ? <FiPause size={14} /> : <FiPlay size={14} />}
          {playing ? "Pause" : "Play"}
        </Button>
      </div>
      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <div
          className="h-full bg-brand rounded-full transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
