export async function requestAiScore({ skill, question, answer, localResult }) {
  const response = await fetch("/api/ai/score", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ skill, question, answer, localResult }),
  });

  if (!response.ok) throw new Error("AI scoring unavailable");
  const payload = await response.json();
  if (!payload?.data) throw new Error("AI scoring returned no result");
  return payload.data;
}

export async function syncPracticeAttempt({ skill, score, durationSec = 0 }) {
  const response = await fetch("/api/results/practice", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ skill, score, durationSec, totalQuestions: 1 }),
  });
  if (!response.ok) throw new Error("Practice sync unavailable");
  const payload = await response.json();
  window.dispatchEvent(new Event("pte:dashboard-updated"));
  return payload?.data?.id;
}

export async function updatePracticeAttempt(id, score) {
  if (!id) return;
  await fetch(`/api/results/${id}/score`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ score }),
  });
  window.dispatchEvent(new Event("pte:dashboard-updated"));
}

export function mergeAiResult(localResult, aiResult) {
  return {
    ...localResult,
    ...aiResult,
    subScores: Object.fromEntries(
      Object.entries(aiResult.subScores || {}).map(([key, value]) => [
        key,
        {
          ...(localResult.subScores?.[key] || {}),
          value,
          max: 90,
        },
      ])
    ),
    aiScored: true,
  };
}
