import { Router, Request, Response } from "express";
import * as users from "../db/users";
import { loginLimiter } from "../middleware/rateLimit";

const router = Router();

// Bruges i frontend login-request.
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

// Bruges i frontend register-request.
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

export default router;
