import crypto from "crypto";
import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { parseStringPromise } from "xml2js";
import { QuizFile, Question, ResultsFile, StoredQuizResult, Quiz, CreateQuizRequest, Option, CreateQuestionRequest } from "../types/quiz";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";

const router = Router();
router.use(requireAuth);

const quizzesFilePath = path.join(__dirname, "..", "..", "data", "quizzes.json");

const resultsFilePath = path.join(__dirname, "..", "..", "data", "results.json");

function saveQuizzes(data: QuizFile): void {
  fs.writeFileSync(quizzesFilePath, JSON.stringify(data, null, 2), "utf-8");
}

function isValidQuiz(quiz: Quiz): boolean {
  if (!quiz.id || !quiz.title || !Array.isArray(quiz.questions)) {
    return false;
  }

  for (const question of quiz.questions) {
    if (!question.id || !question.type || !question.questionText) {
      return false;
    }

    if (
      (question.type === "single_choice" || question.type === "multiple_choice") &&
      (!("options" in question) || !Array.isArray(question.options) || !Array.isArray(question.correctAnswers))
    ) {
      return false;
    }

    if (
      question.type === "cloze" &&
      (!("acceptedAnswers" in question) || !Array.isArray(question.acceptedAnswers))
    ) {
      return false;
    }
  }

  return true;
}

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
  if (
    question.type === "single_choice" ||
    question.type === "multiple_choice"
  ) {
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
 *     security:
 *       - bearerAuth: []
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
router.get("/", (_req: AuthenticatedRequest, res: Response) => {
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
 *     security:
 *       - bearerAuth: []
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
  timeTakenSeconds?: number;
}

function normalizeString(
  value: string,
  trimWhitespace: boolean,
  caseSensitive: boolean,
): string {
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

function scoreMultipleChoice(
  userAnswers: string[],
  correctAnswers: string[],
): number {
  const correctSet = new Set(correctAnswers);
  const userSet = new Set(userAnswers);

  const correctChosen = [...userSet].filter((id) => correctSet.has(id)).length;
  const wrongChosen = [...userSet].filter((id) => !correctSet.has(id)).length;

  const plus = correctChosen / correctAnswers.length;
  const minus = wrongChosen / correctAnswers.length;

  return Math.max(0, Math.min(1, plus - minus));
}

function getUserAnswerText(
  question: Question,
  userAnswer: string[] | string,
): string[] | string {
  if (question.type === "single_choice" || question.type === "multiple_choice") {
    if (!Array.isArray(userAnswer)) return []

    return userAnswer.map((answerId) => {
      const option = question.options.find((opt) => opt.id === answerId)
      return option ? option.text : answerId
    })
  }

  return typeof userAnswer === "string" ? userAnswer : ""
}

/**
 * @openapi
 * /quizzes/{id}/validate:
 *   post:
 *     summary: Validate quiz answers
 *     description: Validates submitted answers, calculates points, and returns correct answers for wrong responses.
 *     tags:
 *       - Quizzes
 *     security:
 *       - bearerAuth: []
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
 *               timeTakenSeconds:
 *                 type: number
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
router.post("/:id/validate", (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = loadQuizzes();
    const quiz = data.quizzes.find((q) => q.id === req.params.id);

    if (!quiz) {
      return res.status(404).json({ error: "Quiz blev ikke fundet." });
    }

    const body = req.body as ValidateQuizRequest;

    if (!body.answers || !Array.isArray(body.answers)) {
      return res
        .status(400)
        .json({ error: "Body skal indeholde et answers-array." });
    }

    if (!req.user) {
      return res.status(401).json({ error: "Bruger ikke autentificeret." });
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
        const userAnswer = Array.isArray(submittedAnswer)
          ? submittedAnswer
          : [];
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
          correctAnswer: getCorrectAnswerWithText(question),
        };
      }

      if (question.type === "multiple_choice") {
        const userAnswer = Array.isArray(submittedAnswer)
          ? submittedAnswer
          : [];
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
          correctAnswer: getCorrectAnswerWithText(question),
        };
      }

      const userAnswer =
        typeof submittedAnswer === "string" ? submittedAnswer : "";

      const normalizedUser = normalizeString(
        userAnswer,
        question.trimWhitespace,
        question.caseSensitive,
      );

      const normalizedAcceptedAnswers = question.acceptedAnswers.map(
        (accepted) =>
          normalizeString(
            accepted,
            question.trimWhitespace,
            question.caseSensitive,
          ),
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
        correctAnswer: getCorrectAnswerWithText(question),
      };
    });

    const percentage =
      maxPoints > 0 ? Number(((totalPoints / maxPoints) * 100).toFixed(2)) : 0;

    const wrongAnswers = results
      .filter((result) => !result.correct)
      .map((result) => ({
        questionId: result.questionId,
        userAnswer: result.userAnswer,
        correctAnswer: result.correctAnswer,
        points: result.points,
        maxPoints: result.maxPoints,
      }));

    const storedResult: StoredQuizResult = {
      id: crypto.randomUUID(),
      userId: req.user.id,
      quizId: quiz.id,
      quizTitle: quiz.title,
      totalPoints,
      maxPoints,
      percentage,
      submittedAt: new Date().toISOString(),
      timeTakenSeconds: body.timeTakenSeconds,
      answers: results.map((result) => {
        const originalQuestion = quiz.questions.find(
          (q) => q.id === result.questionId,
        );

        return {
          questionId: result.questionId,
          questionText: originalQuestion?.questionText ?? result.questionId,
          userAnswer: result.userAnswer,
          userAnswerText: originalQuestion
            ? getUserAnswerText(originalQuestion, result.userAnswer)
            : result.userAnswer,
          correct: result.correct,
          points: result.points,
          maxPoints: result.maxPoints,
          correctAnswer: result.correctAnswer,
        };
      }),
    };
    
    const resultsFile = loadResults();
    resultsFile.results.push(storedResult);
    saveResults(resultsFile);

    return res.json({
      quizId: quiz.id,
      title: quiz.title,
      totalPoints,
      maxPoints,
      percentage:
        maxPoints > 0
          ? Number(((totalPoints / maxPoints) * 100).toFixed(2))
          : 0,
      results,
      wrongAnswers,
    });
  } catch (error) {
    console.error("Could not validate quiz:", error);
    return res.status(500).json({ error: "Kunne ikke validere quizzen." });
  }
});

function loadResults(): ResultsFile {
  const raw = fs.readFileSync(resultsFilePath, "utf-8");
  return JSON.parse(raw) as ResultsFile;
}

function saveResults(data: ResultsFile): void {
  fs.writeFileSync(resultsFilePath, JSON.stringify(data, null, 2), "utf-8");
}

function getCorrectAnswerWithText(question: Question): { id: string; text: string }[] | string[] {
  if (question.type === "single_choice" || question.type === "multiple_choice") {
    return question.correctAnswers.map((correctId) => {
      const option = question.options.find((opt) => opt.id === correctId);

      return {
        id: correctId,
        text: option ? option.text : "",
      };
    });
  }

  return question.acceptedAnswers;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function generateQuizId(title: string, existingIds: string[]): string {
  const base = slugify(title) || "quiz";
  let candidate = base;
  let counter = 1;

  while (existingIds.includes(candidate)) {
    counter += 1;
    candidate = `${base}-${counter}`;
  }

  return candidate;
}

function generateQuestionId(index: number): string {
  return `q${index + 1}`;
}

function generateOptionId(index: number): string {
  return String.fromCharCode(97 + index);
}

function validateCreateQuizRequest(body: CreateQuizRequest): string | null {
  if (!body.title?.trim()) {
    return "Quiz skal have en title.";
  }

  if (!body.description?.trim()) {
    return "Quiz skal have en description.";
  }

  if (!body.category?.trim()) {
    return "Quiz skal have en category.";
  }

  if (!body.difficulty?.trim()) {
    return "Quiz skal have en difficulty.";
  }

  if (!Array.isArray(body.questions) || body.questions.length === 0) {
    return "Quiz skal have mindst ét spørgsmål.";
  }

  for (const question of body.questions) {
    if (!question.questionText?.trim()) {
      return "Alle spørgsmål skal have questionText.";
    }

    if (question.type === "single_choice" || question.type === "multiple_choice") {
      if (!Array.isArray(question.options) || question.options.length < 2) {
        return "Choice-spørgsmål skal have mindst 2 svarmuligheder.";
      }

      if (question.options.some((option) => !option.text?.trim())) {
        return "Alle svarmuligheder skal have text.";
      }

      if (!Array.isArray(question.correctAnswers) || question.correctAnswers.length === 0) {
        return "Choice-spørgsmål skal have mindst ét korrekt svar.";
      }

      const maxIndex = question.options.length - 1;
      const hasInvalidIndex = question.correctAnswers.some(
        (index) => !Number.isInteger(index) || index < 0 || index > maxIndex,
      );

      if (hasInvalidIndex) {
        return "correctAnswers indeholder ugyldige option-indeks.";
      }

      if (question.type === "single_choice" && question.correctAnswers.length !== 1) {
        return "single_choice skal have præcis ét korrekt svar.";
      }
    }

    if (question.type === "cloze") {
      if (!Array.isArray(question.acceptedAnswers) || question.acceptedAnswers.length === 0) {
        return "Cloze-spørgsmål skal have mindst ét acceptedAnswers-svar.";
      }

      if (question.acceptedAnswers.some((answer) => !answer.trim())) {
        return "acceptedAnswers må ikke indeholde tomme værdier.";
      }
    }
  }

  return null;
}

function buildStoredQuestion(question: CreateQuestionRequest, index: number) {
  const questionId = generateQuestionId(index);

  if (question.type === "single_choice" || question.type === "multiple_choice") {
    const options: Option[] = question.options.map((option, optionIndex) => ({
      id: generateOptionId(optionIndex),
      text: option.text,
    }));

    const correctAnswers = question.correctAnswers.map(
      (correctIndex) => options[correctIndex].id,
    );

    return {
      id: questionId,
      type: question.type,
      questionText: question.questionText,
      options,
      correctAnswers,
    };
  }

  return {
    id: questionId,
    type: "cloze" as const,
    questionText: question.questionText,
    acceptedAnswers: question.acceptedAnswers,
    caseSensitive: question.caseSensitive ?? false,
    trimWhitespace: question.trimWhitespace ?? true,
  };
}

/**
 * @openapi
 * /quizzes:
 *   post:
 *     summary: Create a new quiz
 *     description: |
 *       Creates a new quiz and stores it in quizzes.json.
 *       Only users with role <strong>admin</strong> can access this endpoint.
 *       
 *       The backend automatically generates:
 *       - quiz id
 *       - question ids
 *       - option ids
 *       - default configuration
 *       
 *       For choice questions:
 *       - correctAnswers uses indexes (0-based) of the options array
 *     tags:
 *       - Quizzes
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - category
 *               - difficulty
 *               - questions
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Algoritmer"
 *               description:
 *                 type: string
 *                 example: "Quiz om grundlæggende algoritmer."
 *               category:
 *                 type: string
 *                 example: "Computer Science"
 *               difficulty:
 *                 type: string
 *                 example: "medium"
 *               questions:
 *                 type: array
 *                 items:
 *                   type: object
 *           example:
 *             title: "Algoritmer"
 *             description: "Quiz om grundlæggende algoritmer."
 *             category: "Computer Science"
 *             difficulty: "medium"
 *             questions:
 *               - type: "single_choice"
 *                 questionText: "Hvad er worst-case tidskompleksiteten for binary search?"
 *                 options:
 *                   - text: "O(n)"
 *                   - text: "O(log n)"
 *                   - text: "O(n log n)"
 *                   - text: "O(1)"
 *                 correctAnswers: [1]
 *               - type: "multiple_choice"
 *                 questionText: "Hvilke af følgende er sorteringsalgoritmer?"
 *                 options:
 *                   - text: "Merge sort"
 *                   - text: "Binary search"
 *                   - text: "Quick sort"
 *                   - text: "Bubble sort"
 *                 correctAnswers: [0, 2, 3]
 *               - type: "cloze"
 *                 questionText: "En algoritme der deler problemet i mindre dele kaldes ofte <strong>____</strong>."
 *                 acceptedAnswers:
 *                   - "divide and conquer"
 *                   - "divide-and-conquer"
 *     responses:
 *       201:
 *         description: Quiz created successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Quiz oprettet."
 *               quiz:
 *                 id: "algoritmer"
 *                 title: "Algoritmer"
 *                 link: "/quizzes/algoritmer"
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             example:
 *               error: "Quiz-format er ugyldigt."
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       403:
 *         description: Forbidden (admin only)
 *       500:
 *         description: Server error
 */
router.post(
  "/",
  requireAuth,
  requireAdmin,
  (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Bruger ikke autentificeret." });
      }

      const body = req.body as CreateQuizRequest;

      const validationError = validateCreateQuizRequest(body);
      if (validationError) {
        return res.status(400).json({ error: validationError });
      }

      const data = loadQuizzes();
      const existingIds = data.quizzes.map((quiz) => quiz.id);
      const quizId = generateQuizId(body.title, existingIds);

      const quiz: Quiz = {
        id: quizId,
        title: body.title,
        description: body.description,
        category: body.category,
        difficulty: body.difficulty,
        language: "da",
        shuffleQuestions: true,
        shuffleOptions: true,
        allowedHtmlTags: ["strong", "br", "span"],
        allowedHtmlStyles: ["font-style: italic", "text-decoration: underline"],
        rules: {
          singleChoicePoints: 1,
          multipleChoicePoints: 1,
          clozePoints: 1,
          multipleChoiceScoring: {
            mode: "partial_with_negative",
            description:
              "Ved spørgsmål med flere korrekte svar gives delvise point for korrekte valg og fratræk for forkerte valg. Point kan ikke blive mindre end 0.",
          },
        },
        questions: body.questions.map(buildStoredQuestion),
      };

      data.quizzes.push(quiz);
      saveQuizzes(data);

      return res.status(201).json({
        message: "Quiz oprettet.",
        quiz: {
          id: quiz.id,
          title: quiz.title,
          link: `/quizzes/${quiz.id}`,
        },
      });
    } catch (error) {
      console.error("Could not create quiz:", error);
      return res.status(500).json({ error: "Kunne ikke oprette quizzen." });
    }
  },
);

// Multer setup for file uploads (memory storage, max 5MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === ".json" || ext === ".xml") {
      cb(null, true);
    } else {
      cb(new Error("Kun .json og .xml filer er tilladt."));
    }
  },
});

// Parse an uploaded XML quiz file into the internal Quiz format
async function parseXmlQuiz(xmlString: string): Promise<Omit<Quiz, "id">> {
  const parsed = await parseStringPromise(xmlString, {
    explicitArray: false,
    trim: true,
  });

  const root = parsed.quiz;
  if (!root) throw new Error("XML skal have et <quiz> rod-element.");

  const rawQuestions = Array.isArray(root.questions?.question)
    ? root.questions.question
    : root.questions?.question
      ? [root.questions.question]
      : [];

  const questions: Question[] = rawQuestions.map(
    (q: Record<string, any>, idx: number) => {
      const qId = q.$.id || `q${idx + 1}`;
      const type = q.$.type as string;
      const questionText = q.text || q.questionText || "";

      if (type === "cloze") {
        const accepted = Array.isArray(q.acceptedAnswers?.answer)
          ? q.acceptedAnswers.answer
          : q.acceptedAnswers?.answer
            ? [q.acceptedAnswers.answer]
            : [];

        return {
          id: qId,
          type: "cloze" as const,
          questionText,
          acceptedAnswers: accepted.map((a: any) =>
            typeof a === "string" ? a : a._ || a,
          ),
          caseSensitive: q.caseSensitive === "true",
          trimWhitespace: q.trimWhitespace !== "false",
        };
      }

      // single_choice or multiple_choice
      const rawOptions = Array.isArray(q.options?.option)
        ? q.options.option
        : q.options?.option
          ? [q.options.option]
          : [];

      const options: Option[] = rawOptions.map(
        (o: any, oIdx: number) => ({
          id: o.$.id || String.fromCharCode(97 + oIdx),
          text: typeof o === "string" ? o : o._ || o,
        }),
      );

      const rawCorrect = Array.isArray(q.correctAnswers?.answer)
        ? q.correctAnswers.answer
        : q.correctAnswers?.answer
          ? [q.correctAnswers.answer]
          : [];

      const correctAnswers = rawCorrect.map((a: any) =>
        typeof a === "string" ? a : a._ || a,
      );

      return {
        id: qId,
        type: (type === "multiple_choice"
          ? "multiple_choice"
          : "single_choice") as "single_choice" | "multiple_choice",
        questionText,
        options,
        correctAnswers,
      };
    },
  );

  return {
    title: root.title || "Uploadet quiz",
    description: root.description || "",
    category: root.category || "Generel",
    difficulty: root.difficulty || "medium",
    language: root.language || "da",
    shuffleQuestions: true,
    shuffleOptions: true,
    allowedHtmlTags: ["strong", "br", "span"],
    allowedHtmlStyles: ["font-style: italic", "text-decoration: underline"],
    rules: {
      singleChoicePoints: 1,
      multipleChoicePoints: 1,
      clozePoints: 1,
      multipleChoiceScoring: {
        mode: "partial_with_negative",
        description:
          "Ved spørgsmål med flere korrekte svar gives delvise point for korrekte valg og fratræk for forkerte valg.",
      },
    },
    questions,
  };
}

// Parse an uploaded JSON quiz file into the internal Quiz format
function parseJsonQuizFile(jsonString: string): Omit<Quiz, "id"> {
  const parsed = JSON.parse(jsonString);

  // If the file already matches our Quiz structure, use it directly
  if (parsed.title && Array.isArray(parsed.questions)) {
    return {
      title: parsed.title,
      description: parsed.description || "",
      category: parsed.category || "Generel",
      difficulty: parsed.difficulty || "medium",
      language: parsed.language || "da",
      shuffleQuestions: parsed.shuffleQuestions ?? true,
      shuffleOptions: parsed.shuffleOptions ?? true,
      allowedHtmlTags: parsed.allowedHtmlTags || ["strong", "br", "span"],
      allowedHtmlStyles: parsed.allowedHtmlStyles || [
        "font-style: italic",
        "text-decoration: underline",
      ],
      rules: parsed.rules || {
        singleChoicePoints: 1,
        multipleChoicePoints: 1,
        clozePoints: 1,
        multipleChoiceScoring: {
          mode: "partial_with_negative",
          description:
            "Ved spørgsmål med flere korrekte svar gives delvise point for korrekte valg og fratræk for forkerte valg.",
        },
      },
      questions: parsed.questions,
    };
  }

  throw new Error(
    "JSON-filen skal have mindst 'title' og 'questions' felter.",
  );
}

router.post(
  "/upload",
  requireAuth,
  requireAdmin,
  upload.single("quizFile"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Ingen fil uploadet." });
      }

      const fileContent = req.file.buffer.toString("utf-8");
      const ext = path.extname(req.file.originalname).toLowerCase();

      let quizData: Omit<Quiz, "id">;

      if (ext === ".xml") {
        quizData = await parseXmlQuiz(fileContent);
      } else {
        quizData = parseJsonQuizFile(fileContent);
      }

      const data = loadQuizzes();
      const existingIds = data.quizzes.map((q) => q.id);
      const quizId = generateQuizId(quizData.title, existingIds);

      const quiz: Quiz = { id: quizId, ...quizData };

      if (!isValidQuiz(quiz)) {
        return res.status(400).json({
          error:
            "Quizfilen har et ugyldigt format. Tjek at alle spørgsmål har korrekt struktur.",
        });
      }

      data.quizzes.push(quiz);
      saveQuizzes(data);

      return res.status(201).json({
        message: "Quiz uploadet.",
        quiz: {
          id: quiz.id,
          title: quiz.title,
          link: `/quizzes/${quiz.id}`,
          questionsCount: quiz.questions.length,
        },
      });
    } catch (error: any) {
      console.error("Could not upload quiz:", error);
      return res.status(400).json({
        error: error.message || "Kunne ikke uploade quizfilen.",
      });
    }
  },
);

/**
 * @openapi
 * /quizzes/{id}:
 *   delete:
 *     summary: Delete a quiz
 *     description: Deletes a quiz from quizzes.json. Admin only.
 *     tags:
 *       - Quizzes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: algoritmer
 *     responses:
 *       200:
 *         description: Quiz deleted successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Quiz slettet."
 *               deletedQuiz:
 *                 id: "algoritmer"
 *                 title: "Algoritmer"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 *       404:
 *         description: Quiz not found
 *         content:
 *           application/json:
 *             example:
 *               error: "Quiz blev ikke fundet."
 *       500:
 *         description: Server error
 */
router.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const data = loadQuizzes();
      const quizIndex = data.quizzes.findIndex((quiz) => quiz.id === req.params.id);

      if (quizIndex === -1) {
        return res.status(404).json({
          error: "Quiz blev ikke fundet.",
        });
      }

      const deletedQuiz = data.quizzes[quizIndex];

      data.quizzes.splice(quizIndex, 1);
      saveQuizzes(data);

      return res.status(200).json({
        message: "Quiz slettet.",
        deletedQuiz: {
          id: deletedQuiz.id,
          title: deletedQuiz.title,
        },
      });
    } catch (error) {
      console.error("Could not delete quiz:", error);
      return res.status(500).json({
        error: "Kunne ikke slette quizzen.",
      });
    }
  },
);

export default router;
