import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import {
  insertProgramSchema,
  insertProgramDaySchema,
  insertProgramDayExerciseSchema,
  insertWorkoutSessionSchema,
  insertWorkoutSetSchema,
  insertClientAssignmentSchema,
  insertNutritionPlanSchema,
  insertClientNutritionAssignmentSchema,
  insertCheckInSchema,
  insertMessageSchema,
} from "@shared/schema";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.get("/api/users", async (_req, res) => {
    const rows = await storage.getAllUsers();
    res.json(rows.map(({ password, ...user }) => user));
  });

  app.get("/api/users/:id", async (req, res) => {
    const row = await storage.getUser(Number(req.params.id));
    if (!row) return res.status(404).json({ message: "User not found" });
    const { password, ...user } = row;
    res.json(user);
  });

  app.get("/api/user-profiles/:userId", async (req, res) => {
    const row = await storage.getUserProfile(Number(req.params.userId));
    if (!row) return res.status(404).json({ message: "Profile not found" });
    res.json(row);
  });

  app.patch("/api/user-profiles/:userId", async (req, res) => {
    const row = await storage.upsertUserProfile(Number(req.params.userId), req.body);
    res.json(row);
  });

  app.get("/api/exercises", async (_req, res) => {
    res.json(await storage.getExercises());
  });

  app.get("/api/programs", async (_req, res) => {
    res.json(await storage.getPrograms());
  });

  app.get("/api/programs/coach/:coachId", async (req, res) => {
    res.json(await storage.getProgramsByCoach(Number(req.params.coachId)));
  });

  app.get("/api/programs/:id", async (req, res) => {
    const row = await storage.getProgram(Number(req.params.id));
    if (!row) return res.status(404).json({ message: "Program not found" });
    res.json(row);
  });

  app.post("/api/programs", async (req, res) => {
    const parsed = insertProgramSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    res.status(201).json(await storage.createProgram(parsed.data));
  });

  app.patch("/api/programs/:id", async (req, res) => {
    const row = await storage.updateProgram(Number(req.params.id), req.body);
    if (!row) return res.status(404).json({ message: "Program not found" });
    res.json(row);
  });

  app.delete("/api/programs/:id", async (req, res) => {
    await storage.deleteProgram(Number(req.params.id));
    res.status(204).send();
  });

  app.get("/api/programs/:programId/days", async (req, res) => {
    res.json(await storage.getProgramDays(Number(req.params.programId)));
  });

  app.post("/api/program-days", async (req, res) => {
    const parsed = insertProgramDaySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    res.status(201).json(await storage.createProgramDay(parsed.data));
  });

  app.patch("/api/program-days/:id", async (req, res) => {
    const row = await storage.updateProgramDay(Number(req.params.id), req.body);
    if (!row) return res.status(404).json({ message: "Program day not found" });
    res.json(row);
  });

  app.delete("/api/program-days/:id", async (req, res) => {
    await storage.deleteProgramDay(Number(req.params.id));
    res.status(204).send();
  });

  app.get("/api/program-days/:dayId/exercises", async (req, res) => {
    res.json(await storage.getProgramDayExercises(Number(req.params.dayId)));
  });

  app.post("/api/program-day-exercises", async (req, res) => {
    const parsed = insertProgramDayExerciseSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    res.status(201).json(await storage.createProgramDayExercise(parsed.data));
  });

  app.patch("/api/program-day-exercises/:id", async (req, res) => {
    const row = await storage.updateProgramDayExercise(Number(req.params.id), req.body);
    if (!row) return res.status(404).json({ message: "Program exercise not found" });
    res.json(row);
  });

  app.delete("/api/program-day-exercises/:id", async (req, res) => {
    await storage.deleteProgramDayExercise(Number(req.params.id));
    res.status(204).send();
  });

  app.get("/api/client-assignments/coach/:coachId", async (req, res) => {
    res.json(await storage.getClientAssignmentsByCoach(Number(req.params.coachId)));
  });

  app.get("/api/client-assignments/client/:clientId", async (req, res) => {
    const row = await storage.getClientAssignment(Number(req.params.clientId));
    if (!row) return res.status(404).json({ message: "Assignment not found" });
    res.json(row);
  });

  app.post("/api/client-assignments", async (req, res) => {
    const parsed = insertClientAssignmentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    res.status(201).json(await storage.createClientAssignment(parsed.data));
  });

  app.patch("/api/client-assignments/:id", async (req, res) => {
    const row = await storage.updateClientAssignment(Number(req.params.id), req.body);
    if (!row) return res.status(404).json({ message: "Assignment not found" });
    res.json(row);
  });

  app.get("/api/workout-sessions/user/:userId", async (req, res) => {
    res.json(await storage.getWorkoutSessions(Number(req.params.userId)));
  });

  app.post("/api/workout-sessions", async (req, res) => {
    const parsed = insertWorkoutSessionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    res.status(201).json(await storage.createWorkoutSession(parsed.data));
  });

  app.patch("/api/workout-sessions/:id", async (req, res) => {
    const row = await storage.updateWorkoutSession(Number(req.params.id), req.body);
    if (!row) return res.status(404).json({ message: "Session not found" });
    res.json(row);
  });

  app.get("/api/workout-sets/session/:sessionId", async (req, res) => {
    res.json(await storage.getWorkoutSets(Number(req.params.sessionId)));
  });

  app.post("/api/workout-sets", async (req, res) => {
    const parsed = insertWorkoutSetSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    res.status(201).json(await storage.createWorkoutSet(parsed.data));
  });

  app.get("/api/nutrition-plans/coach/:coachId", async (req, res) => {
    res.json(await storage.getNutritionPlansByCoach(Number(req.params.coachId)));
  });

  app.post("/api/nutrition-plans", async (req, res) => {
    const parsed = insertNutritionPlanSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    res.status(201).json(await storage.createNutritionPlan(parsed.data));
  });

  app.patch("/api/nutrition-plans/:id", async (req, res) => {
    const row = await storage.updateNutritionPlan(Number(req.params.id), req.body);
    if (!row) return res.status(404).json({ message: "Nutrition plan not found" });
    res.json(row);
  });

  app.get("/api/nutrition-assignments/client/:clientId", async (req, res) => {
    const row = await storage.getNutritionAssignmentForClient(Number(req.params.clientId));
    if (!row) return res.status(404).json({ message: "Nutrition assignment not found" });
    res.json(row);
  });

  app.post("/api/nutrition-assignments", async (req, res) => {
    const parsed = insertClientNutritionAssignmentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    res.status(201).json(await storage.createNutritionAssignment(parsed.data));
  });

  app.get("/api/check-ins/coach/:coachId", async (req, res) => {
    res.json(await storage.getCheckInsByCoach(Number(req.params.coachId)));
  });

  app.get("/api/check-ins/client/:clientId", async (req, res) => {
    res.json(await storage.getCheckInsByClient(Number(req.params.clientId)));
  });

  app.post("/api/check-ins", async (req, res) => {
    const parsed = insertCheckInSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    res.status(201).json(await storage.createCheckIn(parsed.data));
  });

  app.patch("/api/check-ins/:id/reply", async (req, res) => {
    const row = await storage.replyToCheckIn(Number(req.params.id), req.body.coachReply);
    if (!row) return res.status(404).json({ message: "Check-in not found" });
    res.json(row);
  });

  app.get("/api/conversations/:coachId/:clientId", async (req, res) => {
    const conversation = await storage.getOrCreateConversation(Number(req.params.coachId), Number(req.params.clientId));
    const thread = await storage.getConversationMessages(conversation.id);
    res.json({ conversation, messages: thread });
  });

  app.post("/api/messages", async (req, res) => {
    const parsed = insertMessageSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    res.status(201).json(await storage.createMessage(parsed.data));
  });

  return httpServer;
}
