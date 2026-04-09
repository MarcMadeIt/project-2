import { Router, Response } from "express";
import fs from "fs";
import path from "path";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { ResultsFile } from "../types/quiz";
import { requireAdmin } from "../middleware/admin";
import { findById } from "../db/users";

const router = Router();
const resultsFilePath = path.join(__dirname, "..", "..", "data", "results.json");

function loadResults(): ResultsFile {
  const raw = fs.readFileSync(resultsFilePath, "utf-8");
  return JSON.parse(raw) as ResultsFile;
}

router.use(requireAuth);

/**
 * @openapi
 * /results:
 *   get:
 *     summary: Get result summaries for the logged-in user
 *     tags:
 *       - Results
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User result summaries
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/", (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Bruger ikke autentificeret." });
    }

    const data = loadResults();

    const userResults = data.results
      .filter((result) => result.userId === req.user!.id)
      .sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
      )
      .map((result) => ({
        id: result.id,
        quizId: result.quizId,
        quizTitle: result.quizTitle,
        totalPoints: result.totalPoints,
        maxPoints: result.maxPoints,
        percentage: result.percentage,
        submittedAt: result.submittedAt,
      }));

    return res.json({
      userId: req.user.id,
      results: userResults,
    });
  } catch (error) {
    console.error("Could not fetch user results:", error);
    return res.status(500).json({ error: "Kunne ikke hente resultater." });
  }
});

/**
 * @openapi
 * /results/{resultId}:
 *   get:
 *     summary: Get one stored result for the logged-in user
 *     tags:
 *       - Results
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resultId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Result details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Result not found
 *       500:
 *         description: Server error
 */
router.get("/:resultId", (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Bruger ikke autentificeret." });
    }

    const data = loadResults();

    const result = data.results.find(
      (item) =>
        item.id === req.params.resultId && item.userId === req.user!.id,
    );

    if (!result) {
      return res.status(404).json({ error: "Resultat blev ikke fundet." });
    }

    return res.json(result);
  } catch (error) {
    console.error("Could not fetch result details:", error);
    return res.status(500).json({ error: "Kunne ikke hente resultatet." });
  }
});

router.get(
  "/admin/all",
  requireAdmin,
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const data = loadResults();

      const allResults = data.results.map((result) => {
        const user = findById(result.userId);

        return {
          id: result.id,
          userId: result.userId,
          userEmail: user?.email ?? "Ukendt bruger",
          quizTitle: result.quizTitle,
          totalPoints: result.totalPoints,
          maxPoints: result.maxPoints,
          percentage: result.percentage,
          submittedAt: result.submittedAt,
        };
      });
      return res.json({ results: allResults });
      
    } catch (error) {
      console.error("Could not fetch admin results:", error);
      return res.status(500).json({ error: "Kunne ikke hente data." });
    }
  },
);

export default router;