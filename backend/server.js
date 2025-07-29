const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// In-memory task storage (you can replace with a database later)
let tasks = [];
let taskIdCounter = 1;

// Pomodoro state
let pomodoroState = {
  isActive: false,
  timeLeft: 25 * 60, // 25 minutes in seconds
  mode: "work", // 'work' or 'break'
  session: 1,
  startTime: null,
  autoBreaks: true, // Enable automatic breaks
};

// File path for persistent storage
const TASKS_FILE = path.join(__dirname, "tasks.json");

// Load tasks from file on startup
async function loadTasks() {
  try {
    const data = await fs.readFile(TASKS_FILE, "utf8");
    const savedData = JSON.parse(data);
    tasks = savedData.tasks || [];
    taskIdCounter = savedData.counter || 1;
    pomodoroState = savedData.pomodoro || {
      isActive: false,
      timeLeft: 25 * 60,
      mode: "work",
      session: 1,
      startTime: null,
      autoBreaks: true,
    };
    console.log(`Loaded ${tasks.length} tasks from file`);
  } catch (error) {
    console.log("No existing tasks file, starting fresh");
    tasks = [];
    taskIdCounter = 1;
    pomodoroState = {
      isActive: false,
      timeLeft: 25 * 60,
      mode: "work",
      session: 1,
      startTime: null,
      autoBreaks: true,
    };
  }
}

// Save tasks to file
async function saveTasks() {
  try {
    const data = {
      tasks: tasks,
      counter: taskIdCounter,
      pomodoro: pomodoroState,
    };
    await fs.writeFile(TASKS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error saving tasks:", error);
  }
}

// API Routes

// Get all tasks
app.get("/api/tasks", (req, res) => {
  res.json(tasks);
});

// Add new task
app.post("/api/tasks", async (req, res) => {
  const { text, username } = req.body;

  if (!text || !username) {
    return res.status(400).json({ error: "Text and username are required" });
  }

  const newTask = {
    id: taskIdCounter++,
    text: text.trim(),
    username: username.toLowerCase(),
    status: "pending", // pending, done
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  tasks.push(newTask);
  await saveTasks();

  // Emit to all connected clients (overlay)
  io.emit("taskAdded", newTask);

  res.json(newTask);
});

// Edit task
app.put("/api/tasks/:id", async (req, res) => {
  const taskId = parseInt(req.params.id);
  const { text, username } = req.body;

  const taskIndex = tasks.findIndex((task) => task.id === taskId);

  if (taskIndex === -1) {
    return res.status(404).json({ error: "Task not found" });
  }

  // Check if user can edit (same user or broadcaster/mod)
  const task = tasks[taskIndex];
  if (task.username !== username.toLowerCase()) {
    return res.status(403).json({ error: "You can only edit your own tasks" });
  }

  if (text) {
    tasks[taskIndex].text = text.trim();
    tasks[taskIndex].updatedAt = new Date().toISOString();
  }

  await saveTasks();

  // Emit to all connected clients
  io.emit("taskUpdated", tasks[taskIndex]);

  res.json(tasks[taskIndex]);
});

// Mark task as done
app.put("/api/tasks/:id/done", async (req, res) => {
  const taskId = parseInt(req.params.id);
  const { username } = req.body;

  const taskIndex = tasks.findIndex((task) => task.id === taskId);

  if (taskIndex === -1) {
    return res.status(404).json({ error: "Task not found" });
  }

  const task = tasks[taskIndex];
  if (task.username !== username.toLowerCase()) {
    return res
      .status(403)
      .json({ error: "You can only mark your own tasks as done" });
  }

  tasks[taskIndex].status = "done";
  tasks[taskIndex].updatedAt = new Date().toISOString();

  await saveTasks();

  // Emit to all connected clients
  io.emit("taskCompleted", tasks[taskIndex]);

  res.json(tasks[taskIndex]);
});

// Delete task
app.delete("/api/tasks/:id", async (req, res) => {
  const taskId = parseInt(req.params.id);
  const { username } = req.body;

  const taskIndex = tasks.findIndex((task) => task.id === taskId);

  if (taskIndex === -1) {
    return res.status(404).json({ error: "Task not found" });
  }

  const task = tasks[taskIndex];
  if (task.username !== username.toLowerCase()) {
    return res
      .status(403)
      .json({ error: "You can only delete your own tasks" });
  }

  const deletedTask = tasks.splice(taskIndex, 1)[0];
  await saveTasks();

  // Emit to all connected clients
  io.emit("taskDeleted", deletedTask);

  res.json({ message: "Task deleted", task: deletedTask });
});

// Clear all completed tasks
app.delete("/api/tasks/completed", async (req, res) => {
  const completedTasks = tasks.filter((task) => task.status === "done");
  tasks = tasks.filter((task) => task.status !== "done");

  await saveTasks();

  // Emit to all connected clients
  io.emit("completedTasksCleared", completedTasks);

  res.json({ message: `Cleared ${completedTasks.length} completed tasks` });
});

// POMODORO API ROUTES

// Start Pomodoro
app.post("/api/pomodoro/start", async (req, res) => {
  const { username, duration = 25 } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  pomodoroState = {
    isActive: true,
    timeLeft: duration * 60, // Convert minutes to seconds
    mode: "work",
    session: pomodoroState.session,
    startTime: Date.now(),
    initiatedBy: username,
  };

  await saveTasks();

  // Emit to all connected clients
  io.emit("pomodoroStarted", pomodoroState);

  res.json({
    message: `Pomodoro started for ${duration} minutes`,
    pomodoro: pomodoroState,
  });
});

// Pause Pomodoro
app.post("/api/pomodoro/pause", async (req, res) => {
  const { username } = req.body;

  if (!pomodoroState.isActive) {
    return res.status(400).json({ error: "No active Pomodoro to pause" });
  }

  pomodoroState.isActive = false;
  await saveTasks();

  // Emit to all connected clients
  io.emit("pomodoroPaused", pomodoroState);

  res.json({
    message: "Pomodoro paused",
    pomodoro: pomodoroState,
  });
});

// Resume Pomodoro
app.post("/api/pomodoro/resume", async (req, res) => {
  const { username } = req.body;

  if (pomodoroState.isActive) {
    return res.status(400).json({ error: "Pomodoro is already active" });
  }

  if (pomodoroState.timeLeft <= 0) {
    return res.status(400).json({ error: "No paused Pomodoro to resume" });
  }

  pomodoroState.isActive = true;
  pomodoroState.startTime = Date.now();
  await saveTasks();

  // Emit to all connected clients
  io.emit("pomodoroResumed", pomodoroState);

  res.json({
    message: "Pomodoro resumed",
    pomodoro: pomodoroState,
  });
});

// Reset Pomodoro
app.post("/api/pomodoro/reset", async (req, res) => {
  const { username } = req.body;

  pomodoroState = {
    isActive: false,
    timeLeft: 25 * 60,
    mode: "work",
    session: pomodoroState.session, // Keep current session count
    startTime: null,
    initiatedBy: username,
    autoBreaks: true,
  };

  await saveTasks();

  // Emit to all connected clients
  io.emit("pomodoroReset", pomodoroState);

  res.json({
    message: "Pomodoro reset",
    pomodoro: pomodoroState,
  });
});

// Get Pomodoro status
app.get("/api/pomodoro/status", (req, res) => {
  const currentSession =
    pomodoroState.mode === "work"
      ? pomodoroState.session
      : pomodoroState.session - 1;
  const nextBreakType = currentSession % 4 === 0 ? "long" : "short";

  res.json({
    timeLeft: pomodoroState.timeLeft,
    isActive: pomodoroState.isActive,
    mode: pomodoroState.mode,
    session: pomodoroState.session,
    initiatedBy: pomodoroState.initiatedBy || null,
    nextBreakType: nextBreakType,
  });
});

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("Client connected to WebSocket");

  // Send current tasks to newly connected client
  socket.emit("tasksLoaded", tasks);

  // Send current pomodoro state
  socket.emit("pomodoroStateLoaded", pomodoroState);

  socket.on("disconnect", () => {
    console.log("Client disconnected from WebSocket");
  });
});

// Pomodoro timer interval
setInterval(async () => {
  if (pomodoroState.isActive && pomodoroState.timeLeft > 0) {
    pomodoroState.timeLeft--;

    // Emit update every 10 seconds to reduce network traffic
    if (pomodoroState.timeLeft % 10 === 0) {
      io.emit("pomodoroTick", pomodoroState);
    }

    // Handle timer completion
    if (pomodoroState.timeLeft === 0) {
      pomodoroState.isActive = false;

      if (pomodoroState.mode === "work") {
        // Work session completed - start break automatically
        pomodoroState.mode = "break";

        // Determine break length based on session count
        const isLongBreak = pomodoroState.session % 4 === 0; // Every 4th session gets long break
        const breakDuration = isLongBreak ? 15 * 60 : 10 * 60; // 15 min or 10 min break

        pomodoroState.timeLeft = breakDuration;
        pomodoroState.isActive = true; // Auto-start the break

        io.emit("pomodoroWorkCompleted", {
          message: isLongBreak
            ? `🎉 Work session ${pomodoroState.session} completed! Time for a 15-minute long break! 🛋️`
            : `🎉 Work session ${pomodoroState.session} completed! Time for a 10-minute break! ☕`,
          pomodoro: pomodoroState,
          breakType: isLongBreak ? "long" : "short",
        });
      } else {
        // Break completed - ready for next work session
        pomodoroState.mode = "work";
        pomodoroState.timeLeft = 25 * 60; // 25 minute work session
        pomodoroState.session++; // Increment session after break
        pomodoroState.isActive = false; // Don't auto-start work, let user decide

        io.emit("pomodoroBreakCompleted", {
          message: `✨ Break over! Ready for work session ${pomodoroState.session}? Use !pomodoro to start! 💪`,
          pomodoro: pomodoroState,
        });
      }

      await saveTasks();
    }
  }
}, 1000); // Update every second

// Load tasks on startup
loadTasks();

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});
