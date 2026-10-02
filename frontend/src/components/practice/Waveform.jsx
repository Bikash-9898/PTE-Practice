import { useEffect, useRef, useState } from "react";
import { FiPlay, FiPause } from "react-icons/fi";

/**
 * Renders a real audio waveform from a recorded blob using the
 * Web Audio API. Falls back to a placeholder bar pattern when decoding
 * fails so the pop-up still looks complete.
 */
export default function Waveform({ blob, fallbackDuration = 30 }) {
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const peaksRef = useRef([]);
  const [peaks, setPeaks] = useState([]);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [ready, setReady] = useState(false);

  const url = blob ? URL.createObjectURL(blob) : null;

  useEffect(() => {
    if (!blob) {
      setPeaks(buildFallbackPeaks(fallbackDuration));
      setDuration(fallbackDuration);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) throw new Error("no audio context");
        const ctx = new AC();
        const arrayBuffer = await blob.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
        if (cancelled) return;

        const channel = audioBuffer.getChannelData(0);
        const samplesPerPeak = Math.max(1, Math.floor(channel.length / 180));
        const out = [];
        for (let i = 0; i < channel.length; i += samplesPerPeak) {
          let max = 0;
          const end = Math.min(i + samplesPerPeak, channel.length);
          for (let j = i; j < end; j += 1) {
            const v = Math.abs(channel[j]);
            if (v > max) max = v;
          }
          out.push(max);
        }
        const max = Math.max(...out, 0.01);
        const normalised = out.map((v) => Math.max(0.05, v / max));
        setPeaks(normalised);
        setDuration(audioBuffer.duration);
        peaksRef.current = normalised;
        setReady(true);
        ctx.close?.();
      } catch {
        if (!cancelled) {
          setPeaks(buildFallbackPeaks(fallbackDuration));
          setDuration(fallbackDuration);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blob]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  };

  const onTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };

  const onEnded = () => {
    setPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) audioRef.current.currentTime = 0;
  };

  const changeRate = () => {
    const next = playbackRate === 1 ? 0.75 : playbackRate === 0.75 ? 1.25 : 1;
    setPlaybackRate(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const handleSeek = (ev) => {
    if (!audioRef.current || !duration) return;
    const rect = ev.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (ev.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = ratio * duration;
    setCurrentTime(audioRef.current.currentTime);
  };

  const progress = duration ? currentTime / duration : 0;

  return (
    <div className="space-y-2">
      <div
        className="relative h-24 flex items-center justify-center cursor-pointer select-none"
        onClick={handleSeek}
      >
        <div className="flex items-center gap-0.5 w-full h-full">
          {peaks.length > 0 ? (
            peaks.map((p, i) => {
              const reached = i / peaks.length <= progress;
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-sm transition-colors ${
                    reached ? "bg-teal-400" : "bg-slate-300 dark:bg-slate-600"
                  }`}
                  style={{
                    height: `${Math.max(8, p * 100)}%`,
                    minWidth: 1.5,
                    maxWidth: 3,
                  }}
                />
              );
            })
          ) : (
            <div className="text-xs text-slate-400">Preparing waveform…</div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          className="w-10 h-10 rounded-full bg-teal-500 text-white flex items-center justify-center hover:bg-teal-600 shrink-0"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <FiPause size={16} /> : <FiPlay size={16} />}
        </button>
        <div className="text-xs text-slate-500 font-mono">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
        {url && (
          <audio
            ref={audioRef}
            src={url}
            onTimeUpdate={onTimeUpdate}
            onEnded={onEnded}
            preload="metadata"
            className="hidden"
          />
        )}
        <div className="ml-auto flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={changeRate}
            className="px-2 py-1 rounded bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 font-semibold"
            aria-label="Change playback speed"
          >
            {playbackRate.toFixed(2).replace(/\.00$/, "")}x
          </button>
          <button
            type="button"
            onClick={toggle}
            aria-label="Volume"
            className="text-teal-500"
          >
            🔊
          </button>
          <div className="w-20 h-1 rounded-full bg-teal-100 overflow-hidden">
            <div className="h-full w-2/3 bg-teal-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

function buildFallbackPeaks(seconds) {
  const peaks = [];
  let prev = 0.5;
  for (let i = 0; i < 180; i += 1) {
    const noise = (Math.random() - 0.5) * 0.6;
    const v = Math.max(0.08, Math.min(1, prev + noise));
    prev = v;
    peaks.push(v);
  }
  return peaks;
}

function formatTime(s) {
  const total = Math.max(0, Math.floor(s || 0));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
