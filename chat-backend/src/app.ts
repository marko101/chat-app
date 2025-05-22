import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import adminRoutes from "./routes/admin";
import getAdminRouter from "./routes/admin";

dotenv.config();
const prisma = new PrismaClient();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());
app.use("/api/admin", getAdminRouter(io));

// REST: kreiranje chat sesije (user)
app.post("/api/session", async (req, res) => {
  const { userName } = req.body;
  const session = await prisma.chatSession.create({
    data: { userName }
  });
  // --- OVO DODAJ: Emituj novu sesiju svim agentima
  io.emit("newSession", { sessionId: session.id });
  res.json({ sessionId: session.id });
});

// REST: istorija poruka
app.get("/api/session/:id/messages", async (req, res) => {
  const { id } = req.params;
  const messages = await prisma.message.findMany({
    where: { sessionId: id },
    orderBy: { timestamp: "asc" }
  });
  res.json(messages);
});

// SOCKET.IO: chat komunikacija
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join", ({ sessionId }) => {
    socket.join(sessionId);
    console.log(`Socket ${socket.id} joined session ${sessionId}`);
  });

  socket.on("message", async ({ sessionId, sender, content }) => {
    // Snimi u bazu
    const msg = await prisma.message.create({
      data: {
        sessionId,
        sender,
        content,
      }
    });
    // Emituj svima u toj sobi
    io.to(sessionId).emit("message", { ...msg, sessionId });
  

  // ---- Provera spama SAMO za korisnika:
    if (sender === "user") {
      // Prebroj poruke korisnika od poslednje agentove poruke
      const messages = await prisma.message.findMany({
        where: { sessionId },
        orderBy: { timestamp: "desc" },
      });

      let countUser = 0;
      for (const m of messages) {
        if (m.sender === "user") countUser++;
        else break; // čim naiđeš na agentovu, staješ
      }

      if (countUser > 20) {
        // Zaključi sesiju
        await prisma.chatSession.update({
          where: { id: sessionId },
          data: { closedAt: new Date() },
        });
        // Obavesti korisnika
        io.to(sessionId).emit("sessionClosed", { message: "Sesija je zatvorena zbog potencijalnog spama." });
      }
    }
    

    // --- osveži last activity (koristiš u delu ispod)
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { lastActivity: new Date() },
    });
    });
    


  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

export { app, httpServer };

setInterval(async () => {
  const now = new Date();
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);

  // Nađi sve AKTIVNE sesije koje su poslednji put bile aktivne pre više od 5 minuta
  const inactiveSessions = await prisma.chatSession.findMany({
    where: {
      closedAt: null,
      lastActivity: { lt: fiveMinAgo }
    }
  });

  for (const session of inactiveSessions) {
    await prisma.chatSession.update({
      where: { id: session.id },
      data: { closedAt: new Date() }
    });
    // Emituj info korisniku (i agentima)
    io.to(session.id).emit("sessionClosed", { message: "Sesija je zatvorena usled neaktivnosti." });
  }
}, 60 * 1000); // Proverava svakog minuta
