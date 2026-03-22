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
} from "@shared/schema";

const exerciseSeed = [
  ["Barbell Back Squat", "Quads", "Compound", "Barbell", "Squat with controlled descent and a solid brace."],
  ["Romanian Deadlift", "Hamstrings", "Compound", "Barbell", "Hinge pattern with tension through the posterior chain."],
  ["Incline Dumbbell Press", "Chest", "Compound", "Dumbbell", "Press with control and stable shoulder position."],
  ["Seated Cable Row", "Back", "Compound", "Cable", "Row to the lower ribs and squeeze the shoulder blades."],
  ["Lat Pulldown", "Lats", "Compound", "Machine", "Drive elbows down and keep the ribcage stacked."],
  ["Leg Press", "Quads", "Compound", "Machine", "Full range with controlled tempo."],
  ["Lateral Raise", "Shoulders", "Isolation", "Dumbbell", "Raise to the side with soft elbows."],
  ["Tricep Pushdown", "Triceps", "Isolation", "Cable", "Lock the elbows in and extend cleanly."],
  ["Barbell Curl", "Biceps", "Isolation", "Barbell", "Curl without swinging through the hips."],
  ["Plank", "Core", "Core", "Bodyweight", "Maintain a straight line and brace hard."],
] as const;

export async function seed() {
  const existing = await db.select().from(users);
  if (existing.length > 0) return;

  const [coach] = await db.insert(users).values({
    username: "coach_lee",
    password: "coach123",
    displayName: "Coach Lee Perry",
    role: "coach",
    avatarInitials: "LP",
  }).returning();

  const [clientA] = await db.insert(users).values({
    username: "james_davis",
    password: "user123",
    displayName: "James Davis",
    role: "client",
    avatarInitials: "JD",
  }).returning();

  const [clientB] = await db.insert(users).values({
    username: "sarah_jenkins",
    password: "user123",
    displayName: "Sarah Jenkins",
    role: "client",
    avatarInitials: "SJ",
  }).returning();

  await db.insert(userProfiles).values([
    { userId: clientA.id, goal: "Build strength and consistency", experienceLevel: "Intermediate", trainingFrequency: "3 days", injuries: "None", equipmentAccess: "Commercial gym", dietaryPreferences: "High protein" },
    { userId: clientB.id, goal: "Fat loss with better routine adherence", experienceLevel: "Beginner", trainingFrequency: "3 days", injuries: "Lower back history", equipmentAccess: "Commercial gym", dietaryPreferences: "Balanced diet" },
  ]);

  const exerciseRows = await db.insert(exercises).values(
    exerciseSeed.map(([name, target, category, equipment, description]) => ({
      name,
      target,
      category,
      equipment,
      description,
      isCustom: false,
      createdBy: coach.id,
    }))
  ).returning();

  const [program] = await db.insert(programs).values({
    coachId: coach.id,
    title: "Foundation Full Body",
    description: "Three-day foundation plan focused on strength, consistency, and good execution.",
    daysPerWeek: 3,
    durationWeeks: 8,
  }).returning();

  const [day1] = await db.insert(programDays).values({ programId: program.id, dayName: "Day 1", sortOrder: 1 }).returning();
  const [day2] = await db.insert(programDays).values({ programId: program.id, dayName: "Day 2", sortOrder: 2 }).returning();
  const [day3] = await db.insert(programDays).values({ programId: program.id, dayName: "Day 3", sortOrder: 3 }).returning();

  const findId = (name: string) => exerciseRows.find((row) => row.name === name)!.id;

  await db.insert(programDayExercises).values([
    { programDayId: day1.id, exerciseId: findId("Barbell Back Squat"), sets: 3, repsMin: 6, repsMax: 8, rpeTarget: 7, notes: "Own the position.", sortOrder: 1 },
    { programDayId: day1.id, exerciseId: findId("Incline Dumbbell Press"), sets: 3, repsMin: 8, repsMax: 10, rpeTarget: 8, notes: "Control the lowering phase.", sortOrder: 2 },
    { programDayId: day1.id, exerciseId: findId("Seated Cable Row"), sets: 3, repsMin: 10, repsMax: 12, rpeTarget: 8, notes: "Pause at the chest.", sortOrder: 3 },
    { programDayId: day2.id, exerciseId: findId("Romanian Deadlift"), sets: 3, repsMin: 6, repsMax: 8, rpeTarget: 7, notes: "Keep the bar close.", sortOrder: 1 },
    { programDayId: day2.id, exerciseId: findId("Lat Pulldown"), sets: 3, repsMin: 8, repsMax: 10, rpeTarget: 8, notes: "Drive elbows down.", sortOrder: 2 },
    { programDayId: day2.id, exerciseId: findId("Lateral Raise"), sets: 3, repsMin: 12, repsMax: 15, rpeTarget: 8, notes: "Smooth tempo.", sortOrder: 3 },
    { programDayId: day3.id, exerciseId: findId("Leg Press"), sets: 3, repsMin: 10, repsMax: 12, rpeTarget: 8, notes: "Full range.", sortOrder: 1 },
    { programDayId: day3.id, exerciseId: findId("Tricep Pushdown"), sets: 3, repsMin: 10, repsMax: 12, rpeTarget: 8, notes: "Lockout hard.", sortOrder: 2 },
    { programDayId: day3.id, exerciseId: findId("Plank"), sets: 3, repsMin: 30, repsMax: 45, rpeTarget: 7, notes: "Brace and breathe.", sortOrder: 3 },
  ]);

  await db.insert(clientAssignments).values([
    { coachId: coach.id, clientId: clientA.id, programId: program.id, active: true },
    { coachId: coach.id, clientId: clientB.id, programId: program.id, active: true },
  ]);

  const [nutritionPlan] = await db.insert(nutritionPlans).values({
    coachId: coach.id,
    title: "High Protein Baseline",
    description: "Simple daily macro targets with meal structure.",
    caloriesTarget: 2600,
    proteinTarget: 180,
    carbsTarget: 260,
    fatsTarget: 70,
    guidance: "Hit protein first, keep meals repeatable, and build most carbs around training.",
  }).returning();

  await db.insert(clientNutritionAssignments).values([
    { coachId: coach.id, clientId: clientA.id, nutritionPlanId: nutritionPlan.id, active: true },
    { coachId: coach.id, clientId: clientB.id, nutritionPlanId: nutritionPlan.id, active: true },
  ]);

  await db.insert(checkIns).values([
    { clientId: clientA.id, coachId: coach.id, summary: "Weekly check-in", energy: 4, sleep: 3, adherence: 4, bodyWeight: "81.2 kg", notes: "Training went well, food was good on five days.", coachReply: "Good week overall. Keep protein tight and push the first lift harder next week." },
  ]);

  const [conversation] = await db.insert(conversations).values({ coachId: coach.id, clientId: clientA.id }).returning();
  await db.insert(messages).values([
    { conversationId: conversation.id, senderId: coach.id, body: "How did the first day of the plan feel?" },
    { conversationId: conversation.id, senderId: clientA.id, body: "Solid overall. Squats felt better than last week." },
  ]);

  const [session] = await db.insert(workoutSessions).values({
    userId: clientA.id,
    programId: program.id,
    title: "Foundation Full Body - Day 1",
    durationSeconds: 3200,
    totalVolume: 9450,
    notes: "Moved well and kept effort sensible.",
    completedAt: new Date(Date.now() - 86400000),
  }).returning();

  await db.insert(workoutSets).values([
    { sessionId: session.id, exerciseId: findId("Barbell Back Squat"), setNumber: 1, weight: 100, reps: 8, rpe: 7, completed: true, exerciseOrder: 1 },
    { sessionId: session.id, exerciseId: findId("Barbell Back Squat"), setNumber: 2, weight: 100, reps: 8, rpe: 7, completed: true, exerciseOrder: 1 },
    { sessionId: session.id, exerciseId: findId("Incline Dumbbell Press"), setNumber: 1, weight: 30, reps: 10, rpe: 8, completed: true, exerciseOrder: 2 },
  ]);
}
