import { and, asc, desc, eq, or } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  userProfiles,
  exercises,
  programs,
  programDays,
  programDayExercises,
  clientAssignments,
  workoutSessions,
  workoutSets,
  nutritionPlans,
  clientNutritionAssignments,
  checkIns,
  conversations,
  messages,
  type InsertUser,
  type User,
  type InsertUserProfile,
  type UserProfile,
  type InsertExercise,
  type Exercise,
  type InsertProgram,
  type Program,
  type InsertProgramDay,
  type ProgramDay,
  type InsertProgramDayExercise,
  type ProgramDayExercise,
  type InsertClientAssignment,
  type ClientAssignment,
  type InsertWorkoutSession,
  type WorkoutSession,
  type InsertWorkoutSet,
  type WorkoutSet,
  type InsertNutritionPlan,
  type NutritionPlan,
  type InsertClientNutritionAssignment,
  type ClientNutritionAssignment,
  type InsertCheckIn,
  type CheckIn,
  type InsertConversation,
  type Conversation,
  type InsertMessage,
  type Message,
} from "@shared/schema";

export class DatabaseStorage {
  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(asc(users.displayName));
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createUser(input: InsertUser): Promise<User> {
    const [row] = await db.insert(users).values(input).returning();
    return row;
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const [row] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return row;
  }

  async getUserProfile(userId: number): Promise<UserProfile | undefined> {
    const [row] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return row;
  }

  async upsertUserProfile(userId: number, input: Partial<InsertUserProfile>): Promise<UserProfile> {
    const existing = await this.getUserProfile(userId);
    if (existing) {
      const [row] = await db.update(userProfiles).set(input).where(eq(userProfiles.userId, userId)).returning();
      return row;
    }
    const [row] = await db.insert(userProfiles).values({ userId, ...input } as InsertUserProfile).returning();
    return row;
  }

  async getExercises(): Promise<Exercise[]> {
    return db.select().from(exercises).orderBy(asc(exercises.name));
  }

  async createExercise(input: InsertExercise): Promise<Exercise> {
    const [row] = await db.insert(exercises).values(input).returning();
    return row;
  }

  async getPrograms(): Promise<Program[]> {
    return db.select().from(programs).orderBy(desc(programs.createdAt));
  }

  async getProgram(id: number): Promise<Program | undefined> {
    const [row] = await db.select().from(programs).where(eq(programs.id, id));
    return row;
  }

  async getProgramsByCoach(coachId: number): Promise<Program[]> {
    return db.select().from(programs).where(eq(programs.coachId, coachId)).orderBy(desc(programs.createdAt));
  }

  async createProgram(input: InsertProgram): Promise<Program> {
    const [row] = await db.insert(programs).values(input).returning();
    return row;
  }

  async updateProgram(id: number, data: Partial<InsertProgram>): Promise<Program | undefined> {
    const [row] = await db.update(programs).set(data).where(eq(programs.id, id)).returning();
    return row;
  }

  async deleteProgram(id: number): Promise<void> {
    const days = await this.getProgramDays(id);
    for (const day of days) {
      await db.delete(programDayExercises).where(eq(programDayExercises.programDayId, day.id));
    }
    await db.delete(programDays).where(eq(programDays.programId, id));
    await db.delete(programs).where(eq(programs.id, id));
  }

  async getProgramDays(programId: number): Promise<ProgramDay[]> {
    return db.select().from(programDays).where(eq(programDays.programId, programId)).orderBy(asc(programDays.sortOrder));
  }

  async createProgramDay(input: InsertProgramDay): Promise<ProgramDay> {
    const [row] = await db.insert(programDays).values(input).returning();
    return row;
  }

  async updateProgramDay(id: number, data: Partial<InsertProgramDay>): Promise<ProgramDay | undefined> {
    const [row] = await db.update(programDays).set(data).where(eq(programDays.id, id)).returning();
    return row;
  }

  async deleteProgramDay(id: number): Promise<void> {
    await db.delete(programDayExercises).where(eq(programDayExercises.programDayId, id));
    await db.delete(programDays).where(eq(programDays.id, id));
  }

  async getProgramDayExercises(programDayId: number): Promise<ProgramDayExercise[]> {
    return db.select().from(programDayExercises).where(eq(programDayExercises.programDayId, programDayId)).orderBy(asc(programDayExercises.sortOrder));
  }

  async createProgramDayExercise(input: InsertProgramDayExercise): Promise<ProgramDayExercise> {
    const [row] = await db.insert(programDayExercises).values(input).returning();
    return row;
  }

  async updateProgramDayExercise(id: number, data: Partial<InsertProgramDayExercise>): Promise<ProgramDayExercise | undefined> {
    const [row] = await db.update(programDayExercises).set(data).where(eq(programDayExercises.id, id)).returning();
    return row;
  }

  async deleteProgramDayExercise(id: number): Promise<void> {
    await db.delete(programDayExercises).where(eq(programDayExercises.id, id));
  }

  async getClientAssignmentsByCoach(coachId: number): Promise<ClientAssignment[]> {
    return db.select().from(clientAssignments).where(eq(clientAssignments.coachId, coachId)).orderBy(desc(clientAssignments.assignedAt));
  }

  async getClientAssignment(clientId: number): Promise<ClientAssignment | undefined> {
    const [row] = await db.select().from(clientAssignments).where(and(eq(clientAssignments.clientId, clientId), eq(clientAssignments.active, true))).orderBy(desc(clientAssignments.assignedAt));
    return row;
  }

  async createClientAssignment(input: InsertClientAssignment): Promise<ClientAssignment> {
    const [row] = await db.insert(clientAssignments).values(input).returning();
    return row;
  }

  async updateClientAssignment(id: number, data: Partial<InsertClientAssignment>): Promise<ClientAssignment | undefined> {
    const [row] = await db.update(clientAssignments).set(data).where(eq(clientAssignments.id, id)).returning();
    return row;
  }

  async getWorkoutSessions(userId: number): Promise<WorkoutSession[]> {
    return db.select().from(workoutSessions).where(eq(workoutSessions.userId, userId)).orderBy(desc(workoutSessions.startedAt));
  }

  async createWorkoutSession(input: InsertWorkoutSession): Promise<WorkoutSession> {
    const [row] = await db.insert(workoutSessions).values(input).returning();
    return row;
  }

  async updateWorkoutSession(id: number, data: Partial<InsertWorkoutSession>): Promise<WorkoutSession | undefined> {
    const [row] = await db.update(workoutSessions).set(data).where(eq(workoutSessions.id, id)).returning();
    return row;
  }

  async getWorkoutSets(sessionId: number): Promise<WorkoutSet[]> {
    return db.select().from(workoutSets).where(eq(workoutSets.sessionId, sessionId)).orderBy(asc(workoutSets.exerciseOrder), asc(workoutSets.setNumber));
  }

  async createWorkoutSet(input: InsertWorkoutSet): Promise<WorkoutSet> {
    const [row] = await db.insert(workoutSets).values(input).returning();
    return row;
  }

  async createNutritionPlan(input: InsertNutritionPlan): Promise<NutritionPlan> {
    const [row] = await db.insert(nutritionPlans).values(input).returning();
    return row;
  }

  async getNutritionPlansByCoach(coachId: number): Promise<NutritionPlan[]> {
    return db.select().from(nutritionPlans).where(eq(nutritionPlans.coachId, coachId)).orderBy(desc(nutritionPlans.createdAt));
  }

  async updateNutritionPlan(id: number, data: Partial<InsertNutritionPlan>): Promise<NutritionPlan | undefined> {
    const [row] = await db.update(nutritionPlans).set(data).where(eq(nutritionPlans.id, id)).returning();
    return row;
  }

  async getNutritionAssignmentForClient(clientId: number): Promise<ClientNutritionAssignment | undefined> {
    const [row] = await db.select().from(clientNutritionAssignments).where(and(eq(clientNutritionAssignments.clientId, clientId), eq(clientNutritionAssignments.active, true))).orderBy(desc(clientNutritionAssignments.assignedAt));
    return row;
  }

  async createNutritionAssignment(input: InsertClientNutritionAssignment): Promise<ClientNutritionAssignment> {
    const [row] = await db.insert(clientNutritionAssignments).values(input).returning();
    return row;
  }

  async getCheckInsByCoach(coachId: number): Promise<CheckIn[]> {
    return db.select().from(checkIns).where(eq(checkIns.coachId, coachId)).orderBy(desc(checkIns.createdAt));
  }

  async getCheckInsByClient(clientId: number): Promise<CheckIn[]> {
    return db.select().from(checkIns).where(eq(checkIns.clientId, clientId)).orderBy(desc(checkIns.createdAt));
  }

  async createCheckIn(input: InsertCheckIn): Promise<CheckIn> {
    const [row] = await db.insert(checkIns).values(input).returning();
    return row;
  }

  async replyToCheckIn(id: number, coachReply: string): Promise<CheckIn | undefined> {
    const [row] = await db.update(checkIns).set({ coachReply }).where(eq(checkIns.id, id)).returning();
    return row;
  }

  async getOrCreateConversation(coachId: number, clientId: number): Promise<Conversation> {
    const [existing] = await db.select().from(conversations).where(
      or(
        and(eq(conversations.coachId, coachId), eq(conversations.clientId, clientId)),
        and(eq(conversations.coachId, clientId), eq(conversations.clientId, coachId))
      )
    );
    if (existing) return existing;
    const [row] = await db.insert(conversations).values({ coachId, clientId } as InsertConversation).returning();
    return row;
  }

  async getConversationMessages(conversationId: number): Promise<Message[]> {
    return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(asc(messages.createdAt));
  }

  async createMessage(input: InsertMessage): Promise<Message> {
    const [row] = await db.insert(messages).values(input).returning();
    return row;
  }
}

export const storage = new DatabaseStorage();
