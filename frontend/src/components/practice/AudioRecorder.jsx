import { useState, useRef, useEffect } from "react";
import { FiMic, FiSquare, FiTrash2, FiFileText, FiMicOff } from "react-icons/fi";
import Button from "../common/Button";
import { formatTime } from "../../utils/helpers";

/**
 * Records audio with MediaRecorder and, where supported, captures a live
 * speech-recognition transcript so responses can be scored for content.
 */
export default function AudioRecorder({
  onRecordingChange,
  onStart,
  disabled = false,
  maxDuration,
  enableTranscript = true,
}) {
  // idle | requesting | recording | recorded | unsupported
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [audioUrl, setAudioUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [sttSupported, setSttSupported] = useState(true);

  const [devices, setDevices] = useState([]);
  const [activeDeviceId, setActiveDeviceId] = useState("");
  const [activeDeviceLabel, setActiveDeviceLabel] = useState("");
  const [micPickerOpen, setMicPickerOpen] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const audioUrlRef = useRef(null);
  const durationRef = useRef(0);
  const maxDurationRef = useRef(maxDuration);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef("");
  const lastBlobRef = useRef(null);

  useEffect(() => {
    audioUrlRef.current = audioUrl;
  }, [audioUrl]);

  useEffect(() => {
    maxDurationRef.current = maxDuration;
  }, [maxDuration]);

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setStatus("unsupported");
      setError(
        "Microphone recording is not available in this browser. You can still continue practice without an audio recording."
      );
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) setSttSupported(false);

    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh the device list once a stream has been granted (labels are only
  // revealed after permission is given in Chrome/Edge).
  const refreshDevices = async () => {
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      const mics = list.filter((d) => d.kind === "audioinput");
      setDevices(mics);
      const active = streamRef.current?.getAudioTracks?.()[0];
      if (active) {
        setActiveDeviceId(active.getSettings?.().deviceId || "");
        const matched = mics.find((m) => m.deviceId === active.getSettings?.().deviceId);
        setActiveDeviceLabel(
          active.label ||
            matched?.label ||
            "Microphone"
        );
      } else {
        const saved = localStorage.getItem("pte_mic_pref");
        const def = mics.find((m) => m.deviceId === saved);
        setActiveDeviceLabel(def?.label || "System default microphone");
      }
    } catch {
      /* ignore */
    }
  };

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    try {
      recognitionRef.current?.abort();
    } catch {
      /* already stopped */
    }
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
  };

  const emit = () => {
    if (!lastBlobRef.current) return;
    onRecordingChange?.({
      blob: lastBlobRef.current.blob,
      url: lastBlobRef.current.url,
      duration: durationRef.current,
      transcript: transcriptRef.current.trim(),
    });
  };

  const startRecognition = (stream) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || !enableTranscript) return;

    try {
      const recognition = new SR();
      recognition.lang = "en-US";
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        let finalText = "";
        let interimText = "";
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const chunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) finalText += `${chunk} `;
          else interimText += chunk;
        }
        if (finalText) {
          transcriptRef.current += finalText;
          setTranscript(transcriptRef.current.trim());
        }
        setInterim(interimText);
      };

      recognition.onerror = (e) => {
        if (e.error !== "no-speech" && e.error !== "aborted") setSttSupported(false);
      };

      recognition.onend = () => {
        setInterim("");
        emit();
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setSttSupported(false);
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const buildConstraints = (deviceId) => {
    if (!deviceId) return { audio: true };
    return { audio: { deviceId: { exact: deviceId } } };
  };

  const startRecording = async () => {
    if (status === "requesting" || status === "recording") return;

    setError("");
    onStart?.();
    setStatus("requesting");
    setPermissionDenied(false);

    const preferred = localStorage.getItem("pte_mic_pref") || "";

    try {
      const stream = await navigator.mediaDevices.getUserMedia(buildConstraints(preferred));
      streamRef.current = stream;
      chunksRef.current = [];
      transcriptRef.current = "";
      setTranscript("");
      setInterim("");

      const track = stream.getAudioTracks()[0];
      const settings = track.getSettings?.() || {};
      setActiveDeviceId(settings.deviceId || "");
      setActiveDeviceLabel(track.label || "Active microphone");
      try {
        if (settings.deviceId) localStorage.setItem("pte_mic_pref", settings.deviceId);
      } catch {
        /* ignore */
      }
      refreshDevices();

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
        const url = URL.createObjectURL(blob);
        lastBlobRef.current = { blob, url };
        setAudioUrl(url);
        setStatus("recorded");
        emit();
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.onerror = () => {
        setError("Recording stopped unexpectedly. Please try again.");
        setStatus("idle");
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      durationRef.current = 0;
      setDuration(0);
      setStatus("recording");
      onRecordingChange?.(null);
      startRecognition();

      timerRef.current = setInterval(() => {
        durationRef.current += 1;
        setDuration(durationRef.current);
        const limit = maxDurationRef.current;
        if (limit && durationRef.current >= limit) stopRecording();
      }, 1000);
    } catch (err) {
      const name = err?.name;
      if (name === "NotAllowedError" || name === "SecurityError") {
        setPermissionDenied(true);
        setError(
          "Microphone permission was denied. Allow microphone access in your browser settings, then try again."
        );
      } else if (name === "NotFoundError") {
        setError("No microphone was found. Connect a microphone and try again.");
      } else {
        setError("Could not start recording. Check your microphone and try again.");
      }
      setStatus("idle");
    }
  };

  const switchDevice = async (deviceId) => {
    setMicPickerOpen(false);
    if (deviceId === activeDeviceId) return;
    try {
      localStorage.setItem("pte_mic_pref", deviceId);
    } catch {
      /* ignore */
    }

    // If we are recording, stop and restart on the new device.
    const wasRecording = status === "recording";
    if (wasRecording) stopRecording();
    streamRef.current?.getTracks().forEach((t) => t.stop());

    try {
      const stream = await navigator.mediaDevices.getUserMedia(buildConstraints(deviceId));
      streamRef.current = stream;
      const track = stream.getAudioTracks()[0];
      const settings = track.getSettings?.() || {};
      setActiveDeviceId(settings.deviceId || "");
      setActiveDeviceLabel(track.label || "Microphone");

      if (wasRecording) {
        // Rebuild MediaRecorder around the new stream.
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        chunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
          if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
          const url = URL.createObjectURL(blob);
          lastBlobRef.current = { blob, url };
          setAudioUrl(url);
          setStatus("recorded");
          emit();
          stream.getTracks().forEach((t) => t.stop());
        };
        recorder.start();
        setStatus("recording");
      } else {
        // Not recording — close the preview stream so the indicator doesn't hold the mic.
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      refreshDevices();
    } catch (err) {
      setError(
        "Could not switch to that microphone. Make sure it is connected and allowed, then try again."
      );
    }
  };

  const clearRecording = () => {
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    setAudioUrl(null);
    setDuration(0);
    durationRef.current = 0;
    transcriptRef.current = "";
    lastBlobRef.current = null;
    setTranscript("");
    setInterim("");
    setStatus("idle");
    onRecordingChange?.(null);
  };

  if (status === "unsupported") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-200">
        {error}
      </div>
    );
  }

  const micLabel =
    activeDeviceLabel ||
    (permissionDenied ? "Microphone blocked" : devices.length ? "System default microphone" : "Microphone");

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-navy dark:text-white">Your recording</p>
        {status === "recording" && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-red-600">
            <span className="w-2 h-2 rounded-full bg-red-500 recording-pulse" />
            Recording {formatTime(duration)}
            {maxDuration ? ` / ${formatTime(maxDuration)}` : ""}
          </span>
        )}
        {status === "requesting" && (
          <span className="text-xs font-medium text-slate-500">Waiting for microphone…</span>
        )}
        {status === "recorded" && (
          <span className="text-xs text-slate-500">{formatTime(duration)} recorded</span>
        )}
      </div>

      {/* Mic selector */}
      <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 dark:bg-slate-800 px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          {permissionDenied ? (
            <FiMicOff className="text-amber-500 shrink-0" size={14} />
          ) : (
            <FiMic className={status === "recording" ? "text-red-500" : "text-brand"} size={14} />
          )}
          <span className="text-xs text-slate-500">Mic:</span>
          <span className="text-sm font-medium text-navy dark:text-white truncate">{micLabel}</span>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMicPickerOpen((o) => !o)}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-navy-light border border-slate-200 dark:border-slate-600 hover:border-brand/40 px-2.5 py-1 rounded-lg"
            aria-haspopup="listbox"
            aria-expanded={micPickerOpen}
          >
            Change <span className="text-slate-400">▾</span>
          </button>
          {micPickerOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMicPickerOpen(false)}
                aria-hidden="true"
              />
              <ul
                role="listbox"
                className="absolute right-0 mt-1 w-64 max-h-60 overflow-auto bg-white dark:bg-navy-light border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1 z-20 animate-fade-in"
              >
                {devices.length === 0 ? (
                  <li className="px-3 py-3 text-xs text-slate-500">
                    No microphones detected yet. Grant microphone permission and try again.
                  </li>
                ) : (
                  devices.map((d) => {
                    const id = d.deviceId || "default";
                    const label = d.label || `Microphone (${id.slice(0, 6)})`;
                    const active = id === activeDeviceId || (!activeDeviceId && id === "default");
                    return (
                      <li key={id}>
                        <button
                          type="button"
                          onClick={() => switchDevice(id)}
                          className={`w-full text-left px-3 py-2 text-sm flex items-start gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 ${
                            active
                              ? "font-semibold text-brand bg-blue-50 dark:bg-blue-900/20"
                              : "text-slate-700 dark:text-slate-200"
                          }`}
                        >
                          <FiMic size={14} className="mt-0.5 shrink-0" />
                          <span className="truncate">{label}</span>
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            </>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      {status === "recording" && maxDuration ? (
        <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
          <div
            className="h-full bg-red-500 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${Math.min(100, (duration / maxDuration) * 100)}%` }}
          />
        </div>
      ) : null}

      {(status === "recording" || status === "recorded") && enableTranscript && sttSupported && (
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
          <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-1">
            <FiFileText size={12} /> Live transcript
          </p>
          <p className="text-sm text-navy dark:text-slate-200 leading-relaxed">
            {transcript || interim ? (
              <>
                {transcript} <span className="text-slate-400">{interim}</span>
              </>
            ) : (
              <span className="text-slate-400">Listening… start speaking.</span>
            )}
          </p>
        </div>
      )}

      {!sttSupported && enableTranscript && status !== "idle" && (
        <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2">
          Speech recognition is not supported in this browser, so your response cannot be scored for
          content. Your audio is still recorded. Chrome or Edge supports transcript scoring.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {(status === "idle" || status === "requesting") && (
          <Button onClick={startRecording} disabled={disabled} loading={status === "requesting"}>
            {status !== "requesting" && <FiMic size={16} />}
            {status === "requesting" ? "Starting…" : "Start Recording"}
          </Button>
        )}

        {status === "recording" && (
          <Button variant="danger" onClick={stopRecording}>
            <FiSquare size={14} /> Stop Recording
          </Button>
        )}

        {status === "recorded" && (
          <>
            {audioUrl && <audio controls src={audioUrl} className="h-10 max-w-full sm:max-w-xs" />}
            <Button size="sm" onClick={startRecording} disabled={disabled}>
              <FiMic size={14} /> Re-record
            </Button>
            <Button variant="secondary" size="sm" onClick={clearRecording}>
              <FiTrash2 size={14} /> Clear
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
