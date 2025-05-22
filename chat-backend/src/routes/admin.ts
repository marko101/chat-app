// src/routes/admin.ts
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "tajna";

router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  const exists = await prisma.admin.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ error: "Email već postoji" });
  const hash = await bcrypt.hash(password, 10);
  const admin = await prisma.admin.create({ data: { email, password: hash } });
  res.json({ id: admin.id, email: admin.email });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) return res.status(401).json({ error: "Neispravan email ili lozinka" });
  const valid = await bcrypt.compare(password, admin.password);
  if (!valid) return res.status(401).json({ error: "Neispravan email ili lozinka" });
  const token = jwt.sign({ id: admin.id, email: admin.email, role: admin.role }, JWT_SECRET, { expiresIn: "8h" });
  res.json({ token, admin: { id: admin.id, email: admin.email } });
});

export default router;