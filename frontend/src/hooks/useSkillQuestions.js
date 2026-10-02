import { useEffect, useMemo, useState } from "react";
import { getQuestionsBySkill } from "../data/questions";
import { normaliseBackendQuestion } from "../utils/questionLoader";

/**
 * Loads the published questions a question admin created/published for a
 * given skill from the backend (GET /api/questions/skill/:skill), merges
 * them ahead of the built-in local bank, and exposes a stable array for the
 * practice pages.
 *
 * Guests or an unreachable backend simply fall back to the local bank, so
 * practice always has content.
 */
export default function useSkillQuestions(skill) {
  const [backendQuestions, setBackendQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setOnline(false);

    fetch(`/api/questions/skill/${skill}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load questions");
        return res.json();
      })
      .then((payload) => {
        if (!active) return;
        const items = (payload?.data?.items || []).map(normaliseBackendQuestion);
        setBackendQuestions(items);
        setOnline(true);
      })
      .catch(() => {
        if (!active) return;
        setBackendQuestions([]);
        setOnline(false);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [skill]);

  const localQuestions = useMemo(() => getQuestionsBySkill(skill), [skill]);

  const questions = useMemo(
    () => [...backendQuestions, ...localQuestions],
    [backendQuestions, localQuestions]
  );

  return { questions, backendQuestions, localQuestions, loading, online };
}