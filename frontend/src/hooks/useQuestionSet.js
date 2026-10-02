import { useState, useMemo, useCallback, useEffect, useRef } from "react";

/**
 * Shared paging + task-type filtering for a skill's question bank.
 * Keeps the current index valid whenever the filter changes.
 */
export default function useQuestionSet(allQuestions, options = {}) {
  const initialType = options.initialType || "All";
  const initialIndex = Math.max(
    0,
    options.initialId
      ? allQuestions.findIndex((q) => q.id === options.initialId)
      : 0
  );

  const [typeFilter, setTypeFilter] = useState(initialType);
  const [index, setIndex] = useState(initialIndex);

  // The question list can load asynchronously (backend questions arriving
  // after the local bank). Jump to the requested `start` question once it is
  // actually present so deep links from the category page still work.
  const hasJumped = useRef(false);
  useEffect(() => {
    if (hasJumped.current || !options.initialId) return;
    if (!allQuestions.length) return;
    const idx = allQuestions.findIndex((q) => q.id === options.initialId);
    if (idx < 0) return;
    setIndex(idx);
    if (typeFilter === "All" && allQuestions[idx]?.type) {
      setTypeFilter(allQuestions[idx].type);
    }
    hasJumped.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allQuestions]);

  const types = useMemo(
    () => [...new Set(allQuestions.map((q) => q.type))],
    [allQuestions]
  );

  const counts = useMemo(() => {
    return allQuestions.reduce((acc, q) => {
      acc[q.type] = (acc[q.type] || 0) + 1;
      return acc;
    }, {});
  }, [allQuestions]);

  const questions = useMemo(
    () =>
      typeFilter === "All"
        ? allQuestions
        : allQuestions.filter((q) => q.type === typeFilter),
    [allQuestions, typeFilter]
  );

  const changeFilter = useCallback((next) => {
    setTypeFilter(next);
    setIndex(0);
  }, []);

  const safeIndex = Math.min(index, Math.max(0, questions.length - 1));
  const question = questions[safeIndex];

  const next = useCallback(() => {
    setIndex((i) => Math.min(i + 1, questions.length - 1));
  }, [questions.length]);

  const prev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  return {
    questions,
    question,
    index: safeIndex,
    setIndex,
    next,
    prev,
    total: questions.length,
    totalAll: allQuestions.length,
    types,
    counts,
    typeFilter,
    changeFilter,
    isFirst: safeIndex === 0,
    isLast: safeIndex >= questions.length - 1,
    progress: questions.length ? ((safeIndex + 1) / questions.length) * 100 : 0,
  };
}
