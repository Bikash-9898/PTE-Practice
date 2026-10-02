import { FiCheck, FiX, FiArrowRight, FiHelpCircle } from "react-icons/fi";

/**
 * Render the answer key + per-item feedback after Check Answer.
 * Works for all task types used by Reading and Listening:
 *   - Multiple Choice (single & multi)
 *   - Reading & Writing: Fill in the Blanks
 *   - Drag-style Fill in the Blanks (word bank)
 *   - Reorder Paragraphs
 *   - Fill in the Blanks (listening, with text inputs)
 *   - Highlight Incorrect Words (listening)
 */
export default function AnswerKey({ question, userAnswer, mode = "reading" }) {
  if (!question) return null;

  switch (question.type) {
    case "Multiple Choice":
      return <McqKey question={question} userAnswer={userAnswer} />;

    case "Reading & Writing Fill in the Blanks":
      return (
        <FibKey
          question={question}
          userAnswer={userAnswer}
          options={question.blanks}
          mode={mode}
        />
      );

    case "Fill in the Blanks":
      if (question.wordBank) {
        return <DragFibKey question={question} userAnswer={userAnswer} />;
      }
      return <ListeningFibKey question={question} userAnswer={userAnswer} />;

    case "Reorder Paragraphs":
      return <ReorderKey question={question} userAnswer={userAnswer} />;

    case "Highlight Incorrect Words":
      return <HiwKey question={question} userAnswer={userAnswer} />;

    case "Multiple Choice, Multiple Answers":
    case "Multiple Choice, Single Answer":
      return <McqKey question={question} userAnswer={userAnswer} />;

    default:
      return null;
  }
}

function Header({ score, summary }) {
  return (
    <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-brand">{score}</span>
        <span className="text-xs text-slate-500">/ 100</span>
      </div>
      <p className="text-sm text-navy dark:text-white font-medium">{summary}</p>
    </div>
  );
}

/* ---------------- Multiple Choice ---------------- */

function McqKey({ question, userAnswer }) {
  const isMulti = Array.isArray(question.answer);
  const correctSet = new Set(isMulti ? question.answer : [question.answer]);
  const userSet = new Set(
    isMulti
      ? Array.isArray(userAnswer)
        ? userAnswer
        : []
      : userAnswer !== undefined
      ? [userAnswer]
      : []
  );

  return (
    <div className="space-y-3">
      <Header
        score={isEqualSets(correctSet, userSet) ? 100 : 0}
        summary={
          isMulti
            ? isEqualSets(correctSet, userSet)
              ? "All correct answers selected."
              : "Compare your selection with the correct set below."
            : userSet.has(question.answer)
            ? "Correct answer selected."
            : "Wrong answer selected — see the correct option below."
        }
      />

      <ul className="space-y-2" role="list">
        {question.options.map((opt, i) => {
          const isCorrect = correctSet.has(i);
          const isPicked = userSet.has(i);
          return (
            <li
              key={i}
              className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 text-sm ${
                isCorrect
                  ? "border-green-300 bg-green-50 dark:bg-green-900/20"
                  : isPicked
                  ? "border-red-300 bg-red-50 dark:bg-red-900/20"
                  : "border-slate-200 dark:border-slate-700"
              }`}
            >
              <span
                className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                  isCorrect
                    ? "bg-green-500 text-white"
                    : isPicked
                    ? "bg-red-500 text-white"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-700"
                }`}
                aria-hidden="true"
              >
                {String.fromCharCode(65 + i)}
              </span>
              <div className="flex-1">
                <p className="text-slate-700 dark:text-slate-200">{opt}</p>
              </div>
              <div className="text-xs font-semibold flex items-center gap-1 shrink-0">
                {isCorrect && isPicked && (
                  <span className="text-green-700 dark:text-green-300 flex items-center gap-1">
                    <FiCheck size={14} /> Your pick · Correct
                  </span>
                )}
                {isCorrect && !isPicked && (
                  <span className="text-green-700 dark:text-green-300 flex items-center gap-1">
                    <FiCheck size={14} /> Correct
                  </span>
                )}
                {!isCorrect && isPicked && (
                  <span className="text-red-600 dark:text-red-300 flex items-center gap-1">
                    <FiX size={14} /> Your pick · Wrong
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {question.explanation && (
        <p className="text-sm text-slate-600 dark:text-slate-300 rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
          <strong className="text-navy dark:text-white">Why:</strong>{" "}
          {question.explanation}
        </p>
      )}
    </div>
  );
}

/* ---------------- Reading & Writing: Fill in the Blanks ---------------- */

function FibKey({ question, userAnswer, options, mode = "reading" }) {
  const userObj = userAnswer || {};
  const blanks = options || question.blanks;

  let correct = 0;
  blanks.forEach((b) => {
    const userW = (userObj[b.id] || "").trim();
    const rightW = (b.answer || "").trim();
    if (userW && userW.toLowerCase() === rightW.toLowerCase()) correct += 1;
  });
  const total = blanks.length;
  const score = total === 0 ? 0 : Math.round((correct / total) * 100);

  // Render the passage with all blanks showing user answer AND correct answer.
  const parts = question.passage.split(/(___\d___)/);

  return (
    <div className="space-y-3">
      <Header
        score={score}
        summary={`${correct} of ${total} blank${total === 1 ? "" : "s"} correct.`}
      />

      <div className="rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 leading-relaxed text-navy dark:text-slate-100">
        <p className="flex flex-wrap items-center gap-1.5">
          {parts.map((part, i) => {
            const m = part.match(/___(\d)___/);
            if (!m) return <span key={i}>{part}</span>;
            const id = Number(m[1]);
            const blank = blanks.find((b) => b.id === id);
            const userW = (userObj[id] || "").trim();
            const rightW = (blank?.answer || "").trim();
            const ok = userW && userW.toLowerCase() === rightW.toLowerCase();
            return (
              <span
                key={i}
                className={`inline-flex flex-col items-stretch px-2 py-0.5 rounded-lg border ${
                  ok
                    ? "border-green-300 bg-green-50 dark:bg-green-900/20"
                    : userW
                    ? "border-red-300 bg-red-50 dark:bg-red-900/20"
                    : "border-slate-300 bg-white dark:bg-slate-800"
                }`}
              >
                <span className="text-[10px] uppercase tracking-wide text-slate-400 font-bold">
                  Blank {id}
                </span>
                <span
                  className={`text-sm font-semibold ${
                    ok ? "text-green-700 dark:text-green-300" : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {userW || "—"}
                  {!ok && (
                    <span className="ml-1 text-green-700 dark:text-green-300 font-normal">
                      <FiArrowRight className="inline" size={12} /> {rightW}
                    </span>
                  )}
                </span>
              </span>
            );
          })}
        </p>
      </div>

      <table className="w-full text-sm border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden">
        <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="text-left px-3 py-2">Blank</th>
            <th className="text-left px-3 py-2">Your answer</th>
            <th className="text-left px-3 py-2">Correct</th>
            <th className="text-left px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
          {blanks.map((b) => {
            const userW = (userObj[b.id] || "").trim();
            const rightW = (b.answer || "").trim();
            const ok = userW && userW.toLowerCase() === rightW.toLowerCase();
            return (
              <tr key={b.id}>
                <td className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200">
                  #{b.id}
                </td>
                <td
                  className={`px-3 py-2 ${
                    ok
                      ? "text-green-700 dark:text-green-300"
                      : userW
                      ? "text-red-600 dark:text-red-400"
                      : "text-slate-400"
                  }`}
                >
                  {userW || "—"}
                </td>
                <td className="px-3 py-2 text-slate-700 dark:text-slate-200">
                  {rightW}
                </td>
                <td className="px-3 py-2">
                  {ok ? (
                    <span className="badge bg-green-100 text-green-700 inline-flex items-center gap-1">
                      <FiCheck size={12} /> Correct
                    </span>
                  ) : (
                    <span className="badge bg-red-100 text-red-700 inline-flex items-center gap-1">
                      <FiX size={12} /> Wrong
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {question.explanation && (
        <p className="text-sm text-slate-600 dark:text-slate-300 rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
          <strong className="text-navy dark:text-white">Why:</strong>{" "}
          {question.explanation}
        </p>
      )}
    </div>
  );
}

/* ---------------- Drag-style Fill in the Blanks ---------------- */

function DragFibKey({ question, userAnswer }) {
  return <FibKey question={question} userAnswer={userAnswer} options={deriveBlanks(question)} />;
}

function deriveBlanks(question) {
  const matches = [...question.passage.matchAll(/__(\d)__/g)];
  return matches.map((m, idx) => ({
    id: idx + 1,
    answer: question.answers?.[Number(m[1])],
  }));
}

/* ---------------- Listening Fill in the Blanks (text inputs) ---------------- */

function ListeningFibKey({ question, userAnswer }) {
  const userObj = userAnswer || {};
  const answers = question.answers || {};
  const ids = Object.keys(answers);
  let correct = 0;
  ids.forEach((id) => {
    const u = (userObj[id] || "").trim().toLowerCase();
    const r = (answers[id] || "").trim().toLowerCase();
    if (u && u === r) correct += 1;
  });
  const total = ids.length;
  const score = total === 0 ? 0 : Math.round((correct / total) * 100);

  const parts = (question.passage || "").split(/(___\d___)/);

  return (
    <div className="space-y-3">
      <Header
        score={score}
        summary={`${correct} of ${total} blank${total === 1 ? "" : "s"} correct.`}
      />

      <div className="rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 leading-relaxed text-navy dark:text-slate-100">
        <p className="flex flex-wrap items-center gap-1.5">
          {parts.map((part, i) => {
            const m = part.match(/___(\d)___/);
            if (!m) return <span key={i}>{part}</span>;
            const id = Number(m[1]);
            const userW = (userObj[id] || "").trim();
            const rightW = (answers[id] || "").trim();
            const ok = userW && userW.toLowerCase() === rightW.toLowerCase();
            return (
              <span
                key={i}
                className={`inline-block px-2 py-0.5 rounded-md border text-sm font-semibold ${
                  ok
                    ? "border-green-300 bg-green-50 text-green-700 dark:bg-green-900/20"
                    : userW
                    ? "border-red-300 bg-red-50 text-red-600 dark:bg-red-900/20"
                    : "border-slate-300 bg-white dark:bg-slate-800"
                }`}
              >
                {userW || "—"}
                {!ok && rightW && (
                  <span className="ml-1 text-green-700 dark:text-green-300 font-normal">
                    <FiArrowRight className="inline" size={12} /> {rightW}
                  </span>
                )}
              </span>
            );
          })}
        </p>
      </div>

      <ul className="space-y-2">
        {ids.map((id) => {
          const u = (userObj[id] || "").trim();
          const r = (answers[id] || "").trim();
          const ok = u && u.toLowerCase() === r.toLowerCase();
          return (
            <li
              key={id}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-sm ${
                ok
                  ? "border-green-300 bg-green-50 dark:bg-green-900/20"
                  : "border-red-300 bg-red-50 dark:bg-red-900/20"
              }`}
            >
              <span
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  ok ? "bg-green-500 text-white" : "bg-red-500 text-white"
                }`}
              >
                {ok ? <FiCheck size={14} /> : <FiX size={14} />}
              </span>
              <span className="text-xs text-slate-500 font-mono">#{id}</span>
              <span className="flex-1">
                <span
                  className={
                    ok
                      ? "text-green-700 dark:text-green-300 font-semibold"
                      : "text-red-600 dark:text-red-400 font-semibold"
                  }
                >
                  {u || "—"}
                </span>
                {!ok && (
                  <span className="ml-2 text-green-700 dark:text-green-300">
                    <FiArrowRight className="inline" size={12} /> {r}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------------- Reorder Paragraphs ---------------- */

function ReorderKey({ question, userAnswer }) {
  const byId = Object.fromEntries(question.paragraphs.map((p) => [p.id, p]));
  const userOrder =
    Array.isArray(userAnswer) && userAnswer.length
      ? userAnswer
      : question.paragraphs.map((p) => p.id);
  const correct = question.correctOrder;
  let matched = 0;
  correct.forEach((id, i) => {
    if (userOrder[i] === id) matched += 1;
  });
  const score = correct.length ? Math.round((matched / correct.length) * 100) : 0;

  return (
    <div className="space-y-3">
      <Header
        score={score}
        summary={
          score === 100
            ? "Perfect paragraph order."
            : `${matched} of ${correct.length} paragraphs in the correct position.`
        }
      />

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <p className="text-xs uppercase font-bold text-slate-500 mb-2">
            Your order
          </p>
          <ol className="space-y-2">
            {userOrder.map((id, i) => {
              const isRight = correct[i] === id;
              return (
                <li
                  key={`u-${i}-${id}`}
                  className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                    isRight
                      ? "border-green-300 bg-green-50 dark:bg-green-900/20"
                      : "border-red-300 bg-red-50 dark:bg-red-900/20"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                      isRight ? "bg-green-500 text-white" : "bg-red-500 text-white"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="text-slate-700 dark:text-slate-200">
                    {byId[id]?.text}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        <div>
          <p className="text-xs uppercase font-bold text-slate-500 mb-2">
            Correct order
          </p>
          <ol className="space-y-2">
            {correct.map((id, i) => (
              <li
                key={`c-${i}-${id}`}
                className="flex items-start gap-2 rounded-lg border border-green-300 bg-green-50 dark:bg-green-900/20 px-3 py-2 text-sm"
              >
                <span className="w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 bg-green-500 text-white">
                  {i + 1}
                </span>
                <span className="text-slate-700 dark:text-slate-200">
                  {byId[id]?.text}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {question.explanation && (
        <p className="text-sm text-slate-600 dark:text-slate-300 rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
          <strong className="text-navy dark:text-white">Why:</strong>{" "}
          {question.explanation}
        </p>
      )}
    </div>
  );
}

/* ---------------- Highlight Incorrect Words ---------------- */

function HiwKey({ question, userAnswer }) {
  const selected = new Set(
    (Array.isArray(userAnswer) ? userAnswer : []).map((w) =>
      String(w).toLowerCase()
    )
  );
  const incorrect = new Set(
    (question.incorrectWords || []).map((w) => String(w).toLowerCase())
  );
  const correct = new Set(
    (question.correctWords || []).map((w) => String(w).toLowerCase())
  );
  const hits = [...selected].filter((w) => incorrect.has(w)).length;
  const misses = [...incorrect].filter((w) => !selected.has(w)).length;
  const falsePositives = [...selected].filter((w) => !incorrect.has(w)).length;
  const total = incorrect.size || 1;
  const score = Math.max(
    0,
    Math.round(((hits - falsePositives * 0.5) / total) * 100)
  );

  const words = (question.displayText || "").split(/\s+/);

  return (
    <div className="space-y-3">
      <Header
        score={Math.max(0, score)}
        summary={`${hits} correct picks · ${falsePositives} false picks · ${misses} missed.`}
      />

      <div className="rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 leading-loose">
        {words.map((w, i) => {
          const clean = w.replace(/[.,]/g, "").toLowerCase();
          const isSelected = selected.has(clean);
          const isIncorrect = incorrect.has(clean);
          const isCorrectSpoken = correct.has(clean);
          const tone = isSelected
            ? isIncorrect
              ? "bg-red-100 text-red-700 border-red-300"
              : "bg-red-50 text-red-500 border-red-200"
            : isIncorrect
            ? "bg-amber-100 text-amber-700 border-amber-300"
            : isCorrectSpoken
            ? "bg-green-50 text-green-700 border-green-300"
            : "";
          return (
            <span
              key={i}
              className={`inline-block mx-0.5 px-1.5 py-0.5 rounded border text-base ${tone}`}
            >
              {w}
            </span>
          );
        })}
      </div>

      <div className="grid sm:grid-cols-3 gap-2 text-sm">
        <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3">
          <p className="text-xs uppercase tracking-wide font-bold text-green-700 dark:text-green-300 mb-1">
            Correct words
          </p>
          <p className="text-slate-700 dark:text-slate-200">
            {(question.correctWords || []).join(", ")}
          </p>
        </div>
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
          <p className="text-xs uppercase tracking-wide font-bold text-red-700 dark:text-red-300 mb-1">
            Incorrect words
          </p>
          <p className="text-slate-700 dark:text-slate-200">
            {(question.incorrectWords || []).join(", ")}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
          <p className="text-xs uppercase tracking-wide font-bold text-slate-600 dark:text-slate-300 mb-1">
            Your picks
          </p>
          <p className="text-slate-700 dark:text-slate-200">
            {(Array.isArray(userAnswer) ? userAnswer : []).join(", ") || "None"}
          </p>
        </div>
      </div>

      {question.explanation && (
        <p className="text-sm text-slate-600 dark:text-slate-300 rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
          <strong className="text-navy dark:text-white">Why:</strong>{" "}
          {question.explanation}
        </p>
      )}
    </div>
  );
}

function isEqualSets(a, b) {
  if (a.size !== b.size) return false;
  for (const item of a) {
    if (!b.has(item)) return false;
  }
  return true;
}
