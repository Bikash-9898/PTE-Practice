import asyncHandler from "express-async-handler";
import { badRequest, ok, serverError } from "../utils/responses.js";

const SCORE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["overall", "subScores", "feedback"],
  properties: {
    overall: { type: "number", minimum: 0, maximum: 90 },
    subScores: {
      type: "object",
      additionalProperties: false,
      required: ["content", "fluency", "pronunciation"],
      properties: {
        content: { type: "number", minimum: 0, maximum: 90 },
        fluency: { type: "number", minimum: 0, maximum: 90 },
        pronunciation: { type: "number", minimum: 0, maximum: 90 },
      },
    },
    feedback: { type: "string", maxLength: 1000 },
  },
};

function clampScore(value) {
  return Math.max(0, Math.min(90, Math.round(Number(value) || 0)));
}

/** POST /api/ai/score */
export const scoreWithAi = asyncHandler(async (req, res) => {
  const { skill, question, answer, localResult } = req.body || {};
  if (!skill || !question || answer == null) {
    return badRequest(res, "skill, question, and answer are required");
  }
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ success: false, message: "AI scoring is not configured" });
  }

  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.1,
      response_format: { type: "json_schema", json_schema: { name: "pte_score", strict: true, schema: SCORE_SCHEMA } },
      messages: [
        {
          role: "system",
          content:
            "You are a PTE practice evaluator. Score only the submitted answer against the question. Return concise, objective practice feedback. Scores are unofficial and must be integers from 0 to 90.",
        },
        {
          role: "user",
          content: JSON.stringify({ skill, question, answer, localResult }),
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    return serverError(res, `AI provider failed: ${detail.slice(0, 200)}`);
  }

  const payload = await response.json();
  let result;
  try {
    result = JSON.parse(payload.choices?.[0]?.message?.content || "{}");
  } catch {
    return serverError(res, "AI provider returned invalid scoring data");
  }

  return ok(res, {
    overall: clampScore(result.overall),
    subScores: {
      content: clampScore(result.subScores?.content),
      fluency: clampScore(result.subScores?.fluency),
      pronunciation: clampScore(result.subScores?.pronunciation),
    },
    feedback: String(result.feedback || "AI feedback unavailable").slice(0, 1000),
  });
});