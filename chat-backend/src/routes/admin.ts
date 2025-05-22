// src/routes/admin.ts
import express from "express";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { verifyAdminJWT } from "../middleware/auth";
import { PrismaClient } from "@prisma/client";



export default function getAdminRouter(io: any) {
  const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "tajna";

router.post("/register", async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  const exists = await prisma.admin.findUnique({ where: { email } });
  if (exists) res.status(409).json({ error: "Email već postoji" });
  const hash = await bcrypt.hash(password, 10);
  const admin = await prisma.admin.create({ data: { email, password: hash } });
  res.json({ id: admin.id, email: admin.email });
});

router.post("/login", async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) {
    res.status(401).json({ error: "Neispravan email ili lozinka" });
    return; // <<< OVO JE VAŽNO
  }
  const valid = await bcrypt.compare(password, admin.password);
  if (!valid) {
    res.status(401).json({ error: "Neispravan email ili lozinka" });
    return;
  }
  const token = jwt.sign({ id: admin.id, email: admin.email, role: admin.role }, JWT_SECRET, { expiresIn: "8h" });
  res.json({ token, admin: { id: admin.id, email: admin.email } });
});

// Prikaz svih chat sesija (primer: sve, ali možeš filtrirati po "active")
router.get("/sessions", verifyAdminJWT, async (req: Request, res: Response) => {
  const sessions = await prisma.chatSession.findMany({
    where: { closedAt: null }, // SAMO AKTIVNE!
    orderBy: { createdAt: "desc" },
    include: { messages: true },
  });
  res.json(sessions);
});

// Poruke za jednu sesiju
router.get("/session/:id/messages", verifyAdminJWT, async (req: Request, res: Response) => {
  const { id } = req.params;
  const messages = await prisma.message.findMany({
    where: { sessionId: id },
    orderBy: { timestamp: "asc" }
  });
  res.json(messages);
});

// PATCH /api/admin/session/:id/close
router.patch("/session/:id/close", verifyAdminJWT, async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.chatSession.update({
    where: { id },
    data: { closedAt: new Date() }
  });
  // EMITUJ event user-u u toj sobi
  io.to(id).emit("sessionClosed", { message: "Sesija je zatvorena od strane operatera." });
  res.json({ ok: true });
});

// Dohvati jednu sesiju (za nove user-e kad se pojave)
router.get("/session/:id", verifyAdminJWT, async (req: Request, res: Response) => {
  const { id } = req.params;
  const session = await prisma.chatSession.findUnique({
    where: { id },
    include: { messages: true }
  });
  res.json(session);
});

return router;
}