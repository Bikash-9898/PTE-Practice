export function countWords(text) {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(m).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
}

export function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function normalizeAnswer(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function scoreDictation(userAnswer, sampleAnswer) {
  const userWords = normalizeAnswer(userAnswer).split(" ").filter(Boolean);
  const sampleWords = normalizeAnswer(sampleAnswer).split(" ").filter(Boolean);
  if (sampleWords.length === 0) return 0;
  let matches = 0;
  const used = new Set();
  sampleWords.forEach((sw) => {
    const idx = userWords.findIndex((uw, i) => uw === sw && !used.has(i));
    if (idx >= 0) {
      used.add(idx);
      matches++;
    }
  });
  return Math.round((matches / sampleWords.length) * 100);
}

export function scoreMultipleChoice(selected, correct, multiSelect = false) {
  if (multiSelect) {
    const sel = Array.isArray(selected) ? [...selected].sort().join(",") : "";
    const cor = Array.isArray(correct) ? [...correct].sort().join(",") : "";
    return sel === cor ? 100 : 0;
  }
  return selected === correct ? 100 : 0;
}

export function scoreFillBlanks(userAnswers, correctAnswers) {
  const keys = Object.keys(correctAnswers);
  if (keys.length === 0) return 0;
  let correct = 0;
  keys.forEach((k) => {
    const u = normalizeAnswer(userAnswers[k] || "");
    const c = normalizeAnswer(correctAnswers[k] || "");
    if (u === c) correct++;
  });
  return Math.round((correct / keys.length) * 100);
}

export function scoreReorder(userOrder, correctOrder) {
  if (!userOrder || userOrder.length !== correctOrder.length) return 0;
  let correct = 0;
  userOrder.forEach((id, i) => {
    if (id === correctOrder[i]) correct++;
  });
  return Math.round((correct / correctOrder.length) * 100);
}

export function scoreHighlightIncorrect(selected, incorrectWords) {
  const sel = new Set((selected || []).map((w) => w.toLowerCase()));
  const inc = new Set((incorrectWords || []).map((w) => w.toLowerCase()));
  if (inc.size === 0) return 0;
  let hits = 0;
  let falsePos = 0;
  sel.forEach((w) => {
    if (inc.has(w)) hits++;
    else falsePos++;
  });
  const recall = hits / inc.size;
  const penalty = falsePos * 0.15;
  return Math.max(0, Math.round((recall - penalty) * 100));
}

export function scoreWritingByLength(text, wordMin, wordMax) {
  const words = countWords(text);
  if (words === 0) return 0;
  if (words >= wordMin && words <= wordMax) return 75;
  if (words < wordMin) return Math.max(20, Math.round((words / wordMin) * 60));
  return Math.max(40, 75 - (words - wordMax));
}

export function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota */
  }
}

export function loadFromStorage(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return fallback;
}

export function getSavedQuestions() {
  return loadFromStorage("pte_saved_questions", []);
}

export function toggleSavedQuestion(question) {
  const saved = getSavedQuestions();
  const idx = saved.findIndex((q) => q.id === question.id);
  if (idx >= 0) {
    saved.splice(idx, 1);
  } else {
    saved.push({
      id: question.id,
      type: question.type,
      skill: question.skill,
      prompt: (question.prompt || question.question || "").slice(0, 120),
      savedAt: new Date().toISOString(),
    });
  }
  saveToStorage("pte_saved_questions", saved);
  return saved;
}

export function isQuestionSaved(id) {
  return getSavedQuestions().some((q) => q.id === id);
}

export function getTestHistory() {
  return loadFromStorage("pte_test_history", []);
}

export function addTestHistory(entry) {
  const history = getTestHistory();
  history.unshift({
    id: `h-${Date.now()}`,
    date: new Date().toISOString(),
    ...entry,
  });
  saveToStorage("pte_test_history", history.slice(0, 50));
  return history;
}

/**
 * Per-skill submission history for the "My Score" panel. Each entry
 * mirrors the local session and is what the panel renders directly.
 */
export function getSkillHistory(skill) {
  return loadFromStorage(`pte_${skill}_history`, []);
}

export function addSkillHistory(skill, entry) {
  const history = getSkillHistory(skill);
  const item = {
    id: entry.id || `${skill}-${Date.now()}`,
    takenAt: new Date().toISOString(),
    ...entry,
  };
  history.unshift(item);
  saveToStorage(`pte_${skill}_history`, history.slice(0, 20));
  return history;
}

export function getPracticeStats() {
  return loadFromStorage("pte_practice_stats", {
    speaking: 0,
    writing: 0,
    reading: 0,
    listening: 0,
    total: 0,
    streak: 0,
    lastPractice: null,
  });
}

export function incrementPractice(skill) {
  const stats = getPracticeStats();
  stats[skill] = (stats[skill] || 0) + 1;
  stats.total = (stats.total || 0) + 1;
  const today = new Date().toISOString().slice(0, 10);
  if (stats.lastPractice !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    stats.streak = stats.lastPractice === yesterday ? (stats.streak || 0) + 1 : 1;
    stats.lastPractice = today;
  }
  saveToStorage("pte_practice_stats", stats);
  return stats;
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password) {
  if (!password || password.length < 6) {
    return "Password must be at least 6 characters";
  }
  return null;
}

export function difficultyColor(d) {
  const map = {
    Easy: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    Medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    Hard: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    Mixed: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  };
  return map[d] || map.Mixed;
}
