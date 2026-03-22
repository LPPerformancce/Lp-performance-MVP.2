import { QueryClientProvider, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
import { queryClient, apiRequest } from "./lib/queryClient";
import { UserProvider, useCurrentUser } from "./lib/userContext";
import { AppLayout } from "./components/layout/AppLayout";
import type {
  ClientAssignment,
  Program,
  ProgramDay,
  ProgramDayExercise,
  NutritionPlan,
  ClientNutritionAssignment,
  CheckIn,
  User,
  Conversation,
  Message,
  Exercise,
  WorkoutSession,
} from "@shared/schema";
import { useMemo, useState } from "react";

function ProgramEditor({ coachId }: { coachId: number }) {
  const qc = useQueryClient();
  const { data: programs = [] } = useQuery<Program[]>({ queryKey: ["/api/programs/coach", String(coachId)] });
  const createProgram = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/programs", {
        title: "New Program",
        description: "Bare-bones training plan",
        daysPerWeek: 3,
        durationWeeks: 8,
        coachId,
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/programs/coach", String(coachId)] }),
  });

  return (
    <section className="stack">
      <div className="section-head">
        <h2>Training programs</h2>
        <button onClick={() => createProgram.mutate()}>New program</button>
      </div>
      {programs.map((program) => (
        <ProgramCard key={program.id} program={program} />
      ))}
    </section>
  );
}

function ProgramCard({ program }: { program: Program }) {
  const qc = useQueryClient();
  const { data: days = [] } = useQuery<ProgramDay[]>({ queryKey: ["/api/programs", String(program.id), "days"] });
  const { data: exercises = [] } = useQuery<Exercise[]>({ queryKey: ["/api/exercises"] });
  const [selectedDayId, setSelectedDayId] = useState<number | null>(null);
  const { data: dayExercises = [] } = useQuery<ProgramDayExercise[]>({
    queryKey: ["/api/program-days", String(selectedDayId ?? 0), "exercises"],
    enabled: !!selectedDayId,
  });

  const addDay = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/program-days", {
        programId: program.id,
        dayName: `Day ${days.length + 1}`,
        sortOrder: days.length + 1,
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/programs", String(program.id), "days"] }),
  });

  const addExercise = useMutation({
    mutationFn: async () => {
      const first = exercises[0];
      if (!first || !selectedDayId) return null;
      const res = await apiRequest("POST", "/api/program-day-exercises", {
        programDayId: selectedDayId,
        exerciseId: first.id,
        sets: 3,
        repsMin: 8,
        repsMax: 10,
        rpeTarget: 7,
        notes: "",
        sortOrder: dayExercises.length + 1,
      });
      return res.json();
    },
    onSuccess: () => selectedDayId && qc.invalidateQueries({ queryKey: ["/api/program-days", String(selectedDayId), "exercises"] }),
  });

  return (
    <article className="card stack">
      <div className="section-head">
        <div>
          <strong>{program.title}</strong>
          <div className="muted">{program.daysPerWeek} days · {program.durationWeeks} weeks</div>
        </div>
        <button onClick={() => addDay.mutate()}>Add day</button>
      </div>
      <div className="chips">
        {days.map((day) => (
          <button key={day.id} className={selectedDayId === day.id ? "chip active" : "chip"} onClick={() => setSelectedDayId(day.id)}>
            {day.dayName}
          </button>
        ))}
      </div>
      {selectedDayId && (
        <div className="stack">
          <div className="section-head">
            <strong>Exercises</strong>
            <button onClick={() => addExercise.mutate()}>Add exercise</button>
          </div>
          {dayExercises.map((row) => {
            const exercise = exercises.find((item) => item.id === row.exerciseId);
            return (
              <div className="list-row" key={row.id}>
                <div>
                  <strong>{exercise?.name ?? `Exercise ${row.exerciseId}`}</strong>
                  <div className="muted">{row.sets} x {row.repsMin}-{row.repsMax} · RPE {row.rpeTarget ?? "-"}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}

function CoachClients() {
  const { currentUser } = useCurrentUser();
  const coachId = currentUser!.id;
  const { data: users = [] } = useQuery<User[]>({ queryKey: ["/api/users"] });
  const { data: assignments = [] } = useQuery<ClientAssignment[]>({ queryKey: ["/api/client-assignments/coach", String(coachId)] });
  const { data: programs = [] } = useQuery<Program[]>({ queryKey: ["/api/programs/coach", String(coachId)] });
  const qc = useQueryClient();

  const assignProgram = useMutation({
    mutationFn: async (clientId: number) => {
      const programId = programs[0]?.id;
      if (!programId) throw new Error("Create a program first");
      const existing = assignments.find((item) => item.clientId === clientId);
      if (existing) {
        const res = await apiRequest("PATCH", `/api/client-assignments/${existing.id}`, { programId, active: true });
        return res.json();
      }
      const res = await apiRequest("POST", "/api/client-assignments", { coachId, clientId, programId, active: true });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/client-assignments/coach", String(coachId)] }),
  });

  const clients = users.filter((user) => user.role === "client");

  return (
    <section className="stack">
      <div className="section-head"><h2>Clients</h2></div>
      {clients.map((client) => {
        const assignment = assignments.find((item) => item.clientId === client.id);
        const program = programs.find((item) => item.id === assignment?.programId);
        return (
          <article className="card" key={client.id}>
            <div className="section-head">
              <div>
                <strong>{client.displayName}</strong>
                <div className="muted">{program?.title ?? "No training plan assigned"}</div>
              </div>
              <button onClick={() => assignProgram.mutate(client.id)}>Assign first plan</button>
            </div>
          </article>
        );
      })}
    </section>
  );
}

function CoachNutrition() {
  const { currentUser } = useCurrentUser();
  const coachId = currentUser!.id;
  const { data: plans = [] } = useQuery<NutritionPlan[]>({ queryKey: ["/api/nutrition-plans/coach", String(coachId)] });
  const qc = useQueryClient();
  const createPlan = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/nutrition-plans", {
        coachId,
        title: "New nutrition plan",
        description: "Simple assigned targets",
        caloriesTarget: 2400,
        proteinTarget: 180,
        carbsTarget: 220,
        fatsTarget: 70,
        guidance: "Keep meals repeatable and protein high.",
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/nutrition-plans/coach", String(coachId)] }),
  });

  return (
    <section className="stack">
      <div className="section-head"><h2>Nutrition plans</h2><button onClick={() => createPlan.mutate()}>New plan</button></div>
      {plans.map((plan) => (
        <article className="card" key={plan.id}>
          <strong>{plan.title}</strong>
          <div className="muted">{plan.caloriesTarget} kcal · P {plan.proteinTarget} · C {plan.carbsTarget} · F {plan.fatsTarget}</div>
          <p>{plan.guidance}</p>
        </article>
      ))}
    </section>
  );
}

function CoachCheckIns() {
  const { currentUser } = useCurrentUser();
  const coachId = currentUser!.id;
  const qc = useQueryClient();
  const { data: checkIns = [] } = useQuery<CheckIn[]>({ queryKey: ["/api/check-ins/coach", String(coachId)] });
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [reply, setReply] = useState("");
  const sendReply = useMutation({
    mutationFn: async () => {
      if (!replyingTo) return null;
      const res = await apiRequest("PATCH", `/api/check-ins/${replyingTo}/reply`, { coachReply: reply });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/check-ins/coach", String(coachId)] });
      setReply("");
      setReplyingTo(null);
    },
  });

  return (
    <section className="stack">
      <div className="section-head"><h2>Check-ins</h2></div>
      {checkIns.map((item) => (
        <article className="card stack" key={item.id}>
          <div className="section-head">
            <strong>{item.summary}</strong>
            <span className="muted">Energy {item.energy}/5 · Sleep {item.sleep}/5 · Adherence {item.adherence}/5</span>
          </div>
          <p>{item.notes}</p>
          <div className="muted">Body weight: {item.bodyWeight ?? "n/a"}</div>
          <div className="muted">Coach reply: {item.coachReply ?? "None yet"}</div>
          {replyingTo === item.id ? (
            <div className="stack">
              <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={3} />
              <button onClick={() => sendReply.mutate()}>Save reply</button>
            </div>
          ) : (
            <button onClick={() => { setReplyingTo(item.id); setReply(item.coachReply ?? ""); }}>Reply</button>
          )}
        </article>
      ))}
    </section>
  );
}

function Thread() {
  const { currentUser } = useCurrentUser();
  const me = currentUser!;
  const coachId = me.role === "coach" ? me.id : 1;
  const clientId = me.role === "client" ? me.id : 2;
  const qc = useQueryClient();
  const { data } = useQuery<{ conversation: Conversation; messages: Message[] }>({ queryKey: ["/api/conversations", String(coachId), String(clientId)] });
  const [body, setBody] = useState("");
  const send = useMutation({
    mutationFn: async () => {
      if (!data || !body.trim()) return null;
      const res = await apiRequest("POST", "/api/messages", {
        conversationId: data.conversation.id,
        senderId: me.id,
        body,
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/conversations", String(coachId), String(clientId)] });
      setBody("");
    },
  });

  return (
    <section className="stack">
      <div className="section-head"><h2>Messages</h2></div>
      <div className="card stack">
        {(data?.messages ?? []).map((message) => (
          <div className={message.senderId === me.id ? "bubble mine" : "bubble"} key={message.id}>{message.body}</div>
        ))}
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="Type a message" />
        <button onClick={() => send.mutate()}>Send</button>
      </div>
    </section>
  );
}

function ClientHome() {
  const { currentUser } = useCurrentUser();
  const userId = currentUser!.id;
  const { data: sessions = [] } = useQuery<WorkoutSession[]>({ queryKey: ["/api/workout-sessions/user", String(userId)] });
  const { data: assignment } = useQuery<ClientAssignment>({ queryKey: ["/api/client-assignments/client", String(userId)] });
  const { data: program } = useQuery<Program>({ queryKey: ["/api/programs", String(assignment?.programId ?? 0)], enabled: !!assignment?.programId });

  return (
    <section className="stack">
      <article className="card stack">
        <div className="eyebrow">Assigned training</div>
        <strong>{program?.title ?? "No training plan assigned"}</strong>
        <div className="muted">{program?.description ?? "Coach assignment will appear here."}</div>
      </article>
      <article className="card stack">
        <div className="eyebrow">Recent sessions</div>
        <strong>{sessions.length}</strong>
        <div className="muted">Logged training sessions</div>
      </article>
    </section>
  );
}

function ClientTraining() {
  const { currentUser } = useCurrentUser();
  const userId = currentUser!.id;
  const qc = useQueryClient();
  const { data: assignment } = useQuery<ClientAssignment>({ queryKey: ["/api/client-assignments/client", String(userId)] });
  const { data: program } = useQuery<Program>({ queryKey: ["/api/programs", String(assignment?.programId ?? 0)], enabled: !!assignment?.programId });
  const { data: days = [] } = useQuery<ProgramDay[]>({ queryKey: ["/api/programs", String(program?.id ?? 0), "days"], enabled: !!program?.id });
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const { data: rows = [] } = useQuery<ProgramDayExercise[]>({ queryKey: ["/api/program-days", String(selectedDay ?? 0), "exercises"], enabled: !!selectedDay });
  const { data: exerciseBank = [] } = useQuery<Exercise[]>({ queryKey: ["/api/exercises"] });
  const [notes, setNotes] = useState("");
  const logSession = useMutation({
    mutationFn: async () => {
      const create = await apiRequest("POST", "/api/workout-sessions", {
        userId,
        programId: program?.id,
        title: `${program?.title ?? "Training"} - ${days.find((d) => d.id === selectedDay)?.dayName ?? "Session"}`,
      });
      const session = await create.json();
      for (const [index, row] of rows.entries()) {
        await apiRequest("POST", "/api/workout-sets", {
          sessionId: session.id,
          exerciseId: row.exerciseId,
          setNumber: 1,
          weight: 0,
          reps: row.repsMin,
          rpe: row.rpeTarget,
          completed: true,
          exerciseOrder: index + 1,
        });
      }
      const update = await apiRequest("PATCH", `/api/workout-sessions/${session.id}`, {
        completedAt: new Date().toISOString(),
        durationSeconds: 2700,
        totalVolume: 0,
        notes,
      });
      return update.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/workout-sessions/user", String(userId)] });
      setNotes("");
    },
  });

  return (
    <section className="stack">
      <div className="section-head"><h2>Training</h2></div>
      <article className="card stack">
        <strong>{program?.title ?? "No plan assigned"}</strong>
        <div className="chips">
          {days.map((day) => (
            <button key={day.id} className={selectedDay === day.id ? "chip active" : "chip"} onClick={() => setSelectedDay(day.id)}>{day.dayName}</button>
          ))}
        </div>
        {rows.map((row) => {
          const exercise = exerciseBank.find((item) => item.id === row.exerciseId);
          return (
            <div className="list-row" key={row.id}>
              <div>
                <strong>{exercise?.name ?? row.exerciseId}</strong>
                <div className="muted">{row.sets} x {row.repsMin}-{row.repsMax} · RPE {row.rpeTarget}</div>
              </div>
            </div>
          );
        })}
        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Session notes" />
        <button disabled={!selectedDay} onClick={() => logSession.mutate()}>Log completed session</button>
      </article>
    </section>
  );
}

function ClientNutrition() {
  const { currentUser } = useCurrentUser();
  const userId = currentUser!.id;
  const { data: assignment } = useQuery<ClientNutritionAssignment>({ queryKey: ["/api/nutrition-assignments/client", String(userId)] });
  const { data: coachPlans = [] } = useQuery<NutritionPlan[]>({ queryKey: ["/api/nutrition-plans/coach", String(assignment?.coachId ?? 0)], enabled: !!assignment?.coachId });
  const plan = useMemo(() => coachPlans.find((item) => item.id === assignment?.nutritionPlanId), [coachPlans, assignment]);

  return (
    <section className="stack">
      <div className="section-head"><h2>Nutrition</h2></div>
      <article className="card stack">
        <strong>{plan?.title ?? "No nutrition plan assigned"}</strong>
        {plan && (
          <>
            <div className="stats-grid">
              <div><span>Calories</span><strong>{plan.caloriesTarget}</strong></div>
              <div><span>Protein</span><strong>{plan.proteinTarget}g</strong></div>
              <div><span>Carbs</span><strong>{plan.carbsTarget}g</strong></div>
              <div><span>Fats</span><strong>{plan.fatsTarget}g</strong></div>
            </div>
            <p>{plan.guidance}</p>
          </>
        )}
      </article>
    </section>
  );
}

function ClientCheckIns() {
  const { currentUser } = useCurrentUser();
  const clientId = currentUser!.id;
  const coachId = 1;
  const qc = useQueryClient();
  const { data: checkIns = [] } = useQuery<CheckIn[]>({ queryKey: ["/api/check-ins/client", String(clientId)] });
  const [form, setForm] = useState({ summary: "Weekly check-in", energy: 3, sleep: 3, adherence: 3, bodyWeight: "", notes: "" });
  const submit = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/check-ins", {
        clientId,
        coachId,
        ...form,
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/check-ins/client", String(clientId)] });
      setForm({ summary: "Weekly check-in", energy: 3, sleep: 3, adherence: 3, bodyWeight: "", notes: "" });
    },
  });

  return (
    <section className="stack">
      <div className="section-head"><h2>Check-in</h2></div>
      <article className="card stack">
        <input value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="Summary" />
        <input value={form.bodyWeight} onChange={(e) => setForm({ ...form, bodyWeight: e.target.value })} placeholder="Body weight" />
        <div className="stats-grid sliders">
          <label>Energy<input type="range" min="1" max="5" value={form.energy} onChange={(e) => setForm({ ...form, energy: Number(e.target.value) })} /></label>
          <label>Sleep<input type="range" min="1" max="5" value={form.sleep} onChange={(e) => setForm({ ...form, sleep: Number(e.target.value) })} /></label>
          <label>Adherence<input type="range" min="1" max="5" value={form.adherence} onChange={(e) => setForm({ ...form, adherence: Number(e.target.value) })} /></label>
        </div>
        <textarea rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="How did the week go?" />
        <button onClick={() => submit.mutate()}>Submit check-in</button>
      </article>
      {checkIns.map((item) => (
        <article className="card stack" key={item.id}>
          <strong>{item.summary}</strong>
          <div className="muted">Energy {item.energy}/5 · Sleep {item.sleep}/5 · Adherence {item.adherence}/5</div>
          <p>{item.notes}</p>
          <div className="muted">Coach reply: {item.coachReply ?? "No reply yet"}</div>
        </article>
      ))}
    </section>
  );
}

function Profile() {
  const { currentUser } = useCurrentUser();
  return (
    <section className="stack">
      <div className="section-head"><h2>Profile</h2></div>
      <article className="card stack">
        <strong>{currentUser?.displayName}</strong>
        <div className="muted">Role: {currentUser?.role}</div>
      </article>
    </section>
  );
}

function RouterBody() {
  const { currentUser } = useCurrentUser();

  if (!currentUser) return <div className="page-shell"><div className="card">Loading users…</div></div>;

  const isCoach = currentUser.role === "coach";

  return (
    <AppLayout>
      <Switch>
        <Route path="/">{isCoach ? <CoachClients /> : <ClientHome />}</Route>
        <Route path="/programs">{isCoach ? <ProgramEditor coachId={currentUser.id} /> : <ClientTraining />}</Route>
        <Route path="/training"><ClientTraining /></Route>
        <Route path="/nutrition">{isCoach ? <CoachNutrition /> : <ClientNutrition />}</Route>
        <Route path="/check-ins">{isCoach ? <CoachCheckIns /> : <ClientCheckIns />}</Route>
        <Route path="/messages"><Thread /></Route>
        <Route path="/profile"><Profile /></Route>
        <Route>Not found</Route>
      </Switch>
    </AppLayout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <RouterBody />
      </UserProvider>
    </QueryClientProvider>
  );
}
