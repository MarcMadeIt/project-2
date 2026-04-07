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

export default router;