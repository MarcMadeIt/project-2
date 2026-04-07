import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { QuizFile, Quiz, Question } from "../types/quiz";

const router = Router();

const quizzesFilePath = path.join(__dirname, "..", "..", "data", "quizzes.json");

type PublicQuestion =
  | {
      id: string;
      type: "single_choice" | "multiple_choice";
      questionText: string;
      options: { id: string; text: string }[];
    }
  | {
      id: string;
      type: "cloze";
      questionText: string;
      caseSensitive: boolean;
      trimWhitespace: boolean;
    };

function loadQuizzes(): QuizFile {
  const raw = fs.readFileSync(quizzesFilePath, "utf-8");
  return JSON.parse(raw) as QuizFile;
}

function toPublicQuestion(question: Question): PublicQuestion {
  if (question.type === "single_choice" || question.type === "multiple_choice") {
    return {
      id: question.id,
      type: question.type,
      questionText: question.questionText,
      options: question.options,
    };
  }

  return {
    id: question.id,
    type: question.type,
    questionText: question.questionText,
    caseSensitive: question.caseSensitive,
    trimWhitespace: question.trimWhitespace,
  };
}

/**
 * @openapi
 * /quizzes:
 *   get:
 *     summary: Get all quizzes
 *     description: Returns a list of all quizzes with title and link.
 *     tags:
 *       - Quizzes
 *     responses:
 *       200:
 *         description: A list of quizzes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QuizListResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", (_req: Request, res: Response) => {
  try {
    const data = loadQuizzes();

    const quizzes = data.quizzes.map((quiz) => ({
      id: quiz.id,
      title: quiz.title,
      link: `/quizzes/${quiz.id}`,
    }));

    res.json({ quizzes });
  } catch (error) {
    console.error("Could not load quizzes:", error);
    res.status(500).json({ error: "Kunne ikke hente quizzer." });
  }
});

/**
 * @openapi
 * /quizzes/{id}:
 *   get:
 *     summary: Get one quiz without answers
 *     description: Returns quiz metadata and question data, but never the correct answers.
 *     tags:
 *       - Quizzes
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: quiz_datastructures_001
 *     responses:
 *       200:
 *         description: Quiz found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicQuiz'
 *       404:
 *         description: Quiz not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id", (req: Request, res: Response) => {
  try {
    const data = loadQuizzes();
    const quiz = data.quizzes.find((q) => q.id === req.params.id);

    if (!quiz) {
      return res.status(404).json({ error: "Quiz blev ikke fundet." });
    }

    const publicQuiz = {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      category: quiz.category,
      difficulty: quiz.difficulty,
      language: quiz.language,
      shuffleQuestions: quiz.shuffleQuestions,
      shuffleOptions: quiz.shuffleOptions,
      allowedHtmlTags: quiz.allowedHtmlTags,
      allowedHtmlStyles: quiz.allowedHtmlStyles,
      rules: quiz.rules,
      questions: quiz.questions.map(toPublicQuestion),
    };

    return res.json(publicQuiz);
  } catch (error) {
    console.error("Could not load quiz:", error);
    return res.status(500).json({ error: "Kunne ikke hente quizzen." });
  }
});

interface ValidateQuizRequest {
  answers: {
    questionId: string;
    answer: string[] | string;
  }[];
}

function normalizeString(value: string, trimWhitespace: boolean, caseSensitive: boolean): string {
  let result = value;

  if (trimWhitespace) {
    result = result.trim();
  }

  if (!caseSensitive) {
    result = result.toLowerCase();
  }

  return result;
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;

  const sortedA = [...a].sort();
  const sortedB = [...b].sort();

  return sortedA.every((value, index) => value === sortedB[index]);
}

function scoreMultipleChoice(userAnswers: string[], correctAnswers: string[]): number {
  const correctSet = new Set(correctAnswers);
  const userSet = new Set(userAnswers);

  const correctChosen = [...userSet].filter((id) => correctSet.has(id)).length;
  const wrongChosen = [...userSet].filter((id) => !correctSet.has(id)).length;

  const plus = correctChosen / correctAnswers.length;
  const minus = wrongChosen / correctAnswers.length;

  return Math.max(0, Math.min(1, plus - minus));
}

/**
 * @openapi
 * /quizzes/{id}/validate:
 *   post:
 *     summary: Validate quiz answers
 *     description: Validates submitted answers, calculates points, and returns correct answers for wrong responses.
 *     tags:
 *       - Quizzes
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: quiz_datastructures_001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     questionId:
 *                       type: string
 *                     answer:
 *                       oneOf:
 *                         - type: array
 *                           items:
 *                             type: string
 *                         - type: string
 *     responses:
 *       200:
 *         description: Validation result
 *       404:
 *         description: Quiz not found
 *       500:
 *         description: Server error
 */
router.post("/:id/validate", (req: Request, res: Response) => {
  try {
    const data = loadQuizzes();
    const quiz = data.quizzes.find((q) => q.id === req.params.id);

    if (!quiz) {
      return res.status(404).json({ error: "Quiz blev ikke fundet." });
    }

    const body = req.body as ValidateQuizRequest;

    if (!body.answers || !Array.isArray(body.answers)) {
      return res.status(400).json({ error: "Body skal indeholde et answers-array." });
    }

    const submittedAnswersMap = new Map(
      body.answers.map((item) => [item.questionId, item.answer]),
    );

    let totalPoints = 0;
    let maxPoints = 0;

    const results = quiz.questions.map((question) => {
      maxPoints += 1;

      const submittedAnswer = submittedAnswersMap.get(question.id);

      if (question.type === "single_choice") {
        const userAnswer = Array.isArray(submittedAnswer) ? submittedAnswer : [];
        const correct = arraysEqual(userAnswer, question.correctAnswers);
        const points = correct ? 1 : 0;

        totalPoints += points;

        return {
          questionId: question.id,
          type: question.type,
          correct,
          points,
          maxPoints: 1,
          userAnswer,
          correctAnswer: question.correctAnswers,
        };
      }

      if (question.type === "multiple_choice") {
        const userAnswer = Array.isArray(submittedAnswer) ? submittedAnswer : [];
        const points = scoreMultipleChoice(userAnswer, question.correctAnswers);
        const correct = points === 1;

        totalPoints += points;

        return {
          questionId: question.id,
          type: question.type,
          correct,
          points,
          maxPoints: 1,
          userAnswer,
          correctAnswer: question.correctAnswers,
        };
      }

      const userAnswer = typeof submittedAnswer === "string" ? submittedAnswer : "";

      const normalizedUser = normalizeString(
        userAnswer,
        question.trimWhitespace,
        question.caseSensitive,
      );

      const normalizedAcceptedAnswers = question.acceptedAnswers.map((accepted) =>
        normalizeString(accepted, question.trimWhitespace, question.caseSensitive),
      );

      const correct = normalizedAcceptedAnswers.includes(normalizedUser);
      const points = correct ? 1 : 0;

      totalPoints += points;

      return {
        questionId: question.id,
        type: question.type,
        correct,
        points,
        maxPoints: 1,
        userAnswer,
        correctAnswer: question.acceptedAnswers,
      };
    });

    const wrongAnswers = results
      .filter((result) => !result.correct)
      .map((result) => ({
        questionId: result.questionId,
        userAnswer: result.userAnswer,
        correctAnswer: result.correctAnswer,
        points: result.points,
        maxPoints: result.maxPoints,
      }));

    return res.json({
      quizId: quiz.id,
      title: quiz.title,
      totalPoints,
      maxPoints,
      percentage: maxPoints > 0 ? Number(((totalPoints / maxPoints) * 100).toFixed(2)) : 0,
      results,
      wrongAnswers,
    });
  } catch (error) {
    console.error("Could not validate quiz:", error);
    return res.status(500).json({ error: "Kunne ikke validere quizzen." });
  }
});

export default router;