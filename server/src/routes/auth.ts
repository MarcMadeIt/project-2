import { Router, Request, Response } from "express";
import * as users from "../db/users";
import { loginLimiter } from "../middleware/rateLimit";

const router = Router();

/**
 * POST /auth/login
 * Body: { email, password }
 * Returns: { user, token }
 */
router.post("/login", loginLimiter, async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email og password er påkrævet." });
  }
  const result = await users.verifyLogin(email, password);
  if (result.error) {
    return res.status(401).json({ error: result.error });
  }
  res.json({ user: result.user, token: result.token });
});

/**
 * POST /auth/register
 * Body: { email, password }
 * Returns: { user }
 */
router.post("/register", async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email og password er påkrævet." });
  }
  const result = await users.createUser(email, password);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  res.status(201).json({ user: result.user });
});

/**
 * GET /auth/me
 * Header: Authorization: Bearer <token>
 * Returns: { user } or 401
 */
router.get("/me", (req: Request, res: Response) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Ikke autoriseret." });
  }
  const token = header.slice(7);
  const userId = users.getUserIdFromToken(token);
  if (!userId) {
    return res.status(401).json({ error: "Ugyldig eller udløbet token." });
  }
  const user = users.findById(userId);
  if (!user) {
    return res.status(401).json({ error: "Bruger ikke fundet." });
  }
  const { passwordHash: _, ...publicUser } = user;
  res.json({ user: publicUser });
});

export default router;
