const tmi = require("tmi.js");
const axios = require("axios");
require("dotenv").config();

// Configuration
const config = {
  identity: {
    username: process.env.BOT_USERNAME,
    password: process.env.BOT_OAUTH_TOKEN,
  },
  channels: [process.env.CHANNEL_NAME],
};

// Backend API URL
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3001/api";

// Create TMI client
const client = new tmi.Client(config);

// Helper function to make API calls
async function makeApiCall(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (data) {
      config.data = data;
    }

    console.log(`Making API call: ${method} ${config.url}`);
    console.log("Data:", data);

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`API call failed: ${error.message}`);
    console.error("URL:", `${API_BASE_URL}${endpoint}`);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
    return null;
  }
}

// Command handlers
const commands = {
  // Add task command: !add <task description>
  add: async (channel, userstate, message) => {
    const username = userstate.username;
    const taskText = message.trim();

    if (!taskText) {
      client.say(channel, `@${username} Usage: !add <task description>`);
      return;
    }

    const result = await makeApiCall("POST", "/tasks", {
      text: taskText,
      username: username,
    });

    if (result) {
      client.say(
        channel,
        `@${username} Task added: "${result.text}" (ID: ${result.id})`
      );
    } else {
      client.say(channel, `@${username} Failed to add task. Please try again.`);
    }
  },

  // Edit task command: !edit <task_id> <new description>
  edit: async (channel, userstate, message) => {
    const username = userstate.username;
    const parts = message.trim().split(" ");

    if (parts.length < 2) {
      client.say(
        channel,
        `@${username} Usage: !edit <task_id> <new description>`
      );
      return;
    }

    const taskId = parseInt(parts[0]);
    const newText = parts.slice(1).join(" ");

    if (!taskId) {
      client.say(channel, `@${username} Please provide a valid task ID`);
      return;
    }

    const result = await makeApiCall("PUT", `/tasks/${taskId}`, {
      text: newText,
      username: username,
    });

    if (result) {
      client.say(
        channel,
        `@${username} Task ${taskId} updated: "${result.text}"`
      );
    } else {
      client.say(
        channel,
        `@${username} Failed to edit task. Make sure the task ID exists and you own it.`
      );
    }
  },

  // Mark task as done: !done <task_id>
  done: async (channel, userstate, message) => {
    const username = userstate.username;
    const taskId = parseInt(message.trim());

    if (!taskId) {
      client.say(channel, `@${username} Usage: !done <task_id>`);
      return;
    }

    const result = await makeApiCall("PUT", `/tasks/${taskId}/done`, {
      username: username,
    });

    if (result) {
      client.say(
        channel,
        `@${username} Task ${taskId} marked as completed! ✅`
      );
    } else {
      client.say(
        channel,
        `@${username} Failed to complete task. Make sure the task ID exists and you own it.`
      );
    }
  },

  // List user's tasks: !mytasks
  mytasks: async (channel, userstate) => {
    const username = userstate.username;

    try {
      const tasks = await makeApiCall("GET", "/tasks");
      if (!tasks) {
        client.say(channel, `@${username} Failed to fetch tasks.`);
        return;
      }

      const userTasks = tasks.filter(
        (task) => task.username === username.toLowerCase()
      );

      if (userTasks.length === 0) {
        client.say(channel, `@${username} You have no tasks.`);
        return;
      }

      const pendingTasks = userTasks.filter(
        (task) => task.status === "pending"
      );
      const completedTasks = userTasks.filter((task) => task.status === "done");

      let message = `@${username} Your tasks: `;

      if (pendingTasks.length > 0) {
        const pendingList = pendingTasks
          .map(
            (task) =>
              `${task.id}: ${task.text.substring(0, 30)}${
                task.text.length > 30 ? "..." : ""
              }`
          )
          .join(", ");
        message += `Pending: ${pendingList}`;
      }

      if (completedTasks.length > 0) {
        message += ` | Completed: ${completedTasks.length}`;
      }

      client.say(channel, message);
    } catch (error) {
      client.say(channel, `@${username} Error fetching your tasks.`);
    }
  },

  // Clear completed tasks (broadcaster/mod only): !cleardone
  cleardone: async (channel, userstate) => {
    const username = userstate.username;

    // Check if user is broadcaster or mod
    if (
      !userstate.badges ||
      (!userstate.badges.broadcaster && !userstate.badges.moderator)
    ) {
      client.say(
        channel,
        `@${username} Only the broadcaster or moderators can clear completed tasks.`
      );
      return;
    }

    const result = await makeApiCall("DELETE", "/tasks/completed");

    if (result) {
      client.say(channel, `@${username} ${result.message}`);
    } else {
      client.say(channel, `@${username} Failed to clear completed tasks.`);
    }
  },

  // Pomodoro start command: !pomodoro or !pomo
  pomodoro: async (channel, userstate, message) => {
    const username = userstate.username;
    const args = message.trim().split(" ");

    if (args.length === 0 || args[0] === "") {
      // Start default 25-minute pomodoro
      const result = await makeApiCall("POST", "/pomodoro/start", {
        username: username,
        duration: 25,
      });

      if (result) {
        client.say(
          channel,
          `@${username} 🍅 Pomodoro started! 25 minutes of focused work time. Good luck! ✨`
        );
      } else {
        client.say(
          channel,
          `@${username} Failed to start Pomodoro. Please try again.`
        );
      }
    } else {
      const duration = parseInt(args[0]);
      if (duration && duration > 0 && duration <= 60) {
        const result = await makeApiCall("POST", "/pomodoro/start", {
          username: username,
          duration: duration,
        });

        if (result) {
          client.say(
            channel,
            `@${username} 🍅 Custom Pomodoro started! ${duration} minutes of focused work time. Let's go! 💪`
          );
        } else {
          client.say(
            channel,
            `@${username} Failed to start Pomodoro. Please try again.`
          );
        }
      } else {
        client.say(
          channel,
          `@${username} Usage: !pomodoro [minutes] (1-60). Example: !pomodoro 25`
        );
      }
    }
  },

  // Pomodoro pause command: !pause
  pause: async (channel, userstate) => {
    const username = userstate.username;

    const result = await makeApiCall("POST", "/pomodoro/pause", {
      username: username,
    });

    if (result) {
      client.say(
        channel,
        `@${username} ⏸️ Pomodoro paused. Use !resume to continue or !reset to start over.`
      );
    } else {
      client.say(
        channel,
        `@${username} No active Pomodoro to pause or failed to pause.`
      );
    }
  },

  // Pomodoro resume command: !resume
  resume: async (channel, userstate) => {
    const username = userstate.username;

    const result = await makeApiCall("POST", "/pomodoro/resume", {
      username: username,
    });

    if (result) {
      client.say(
        channel,
        `@${username} ▶️ Pomodoro resumed! Keep up the great work! 🔥`
      );
    } else {
      client.say(
        channel,
        `@${username} No paused Pomodoro to resume or failed to resume.`
      );
    }
  },

  // Pomodoro reset command: !reset
  reset: async (channel, userstate) => {
    const username = userstate.username;

    const result = await makeApiCall("POST", "/pomodoro/reset", {
      username: username,
    });

    if (result) {
      client.say(
        channel,
        `@${username} 🔄 Pomodoro reset! Ready for a fresh start when you are.`
      );
    } else {
      client.say(channel, `@${username} Failed to reset Pomodoro.`);
    }
  },

  // Pomodoro status command: !pstatus
  pstatus: async (channel, userstate) => {
    const username = userstate.username;

    const result = await makeApiCall("GET", "/pomodoro/status");

    if (result) {
      const { timeLeft, isActive, mode, session, nextBreakType } = result;
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      const timeString = `${minutes}:${seconds.toString().padStart(2, "0")}`;

      if (isActive) {
        if (mode === "work") {
          const breakText =
            nextBreakType === "long" ? "15-min long break" : "10-min break";
          client.say(
            channel,
            `@${username} 🍅 Work session ${session}: ${timeString} remaining → then ${breakText}`
          );
        } else {
          client.say(
            channel,
            `@${username} ☕ Break time: ${timeString} remaining → then work session ${session}`
          );
        }
      } else {
        if (mode === "work") {
          client.say(
            channel,
            `@${username} Ready for work session ${session}. Use !pomodoro to start! 💪`
          );
        } else {
          client.say(
            channel,
            `@${username} Break time is ready. Will auto-start when work session ends! ☕`
          );
        }
      }
    } else {
      client.say(channel, `@${username} Failed to get Pomodoro status.`);
    }
  },

  // Short alias for pomodoro
  pomo: function (channel, userstate, message) {
    return this.pomodoro(channel, userstate, message);
  },

  // Help command: !taskhelp
  taskhelp: (channel, userstate) => {
    const username = userstate.username;
    client.say(
      channel,
      `@${username} Task commands: !add <description> | !edit <id> <new description> | !done <id> | !mytasks | !taskhelp`
    );
  },

  // Pomodoro help command: !pomohelp
  pomohelp: (channel, userstate) => {
    const username = userstate.username;
    client.say(
      channel,
      `@${username} Pomodoro commands: !pomodoro [minutes] | !pause | !resume | !reset | !pstatus | !pomohelp`
    );
  },
};

// Event handlers
client.on("message", (channel, userstate, message, self) => {
  // Ignore messages from the bot itself
  if (self) return;

  // Check if message starts with !
  if (!message.startsWith("!")) return;

  // Parse command
  const args = message.slice(1).split(" ");
  const command = args[0].toLowerCase();
  const commandMessage = args.slice(1).join(" ");

  // Execute command if it exists
  if (commands[command]) {
    console.log(`Executing command: ${command} by ${userstate.username}`);
    commands[command](channel, userstate, commandMessage);
  }
});

client.on("connected", (addr, port) => {
  console.log(`Bot connected to ${addr}:${port}`);
  console.log(`Joined channels: ${config.channels.join(", ")}`);
  console.log(
    "Available commands: !add, !edit, !done, !mytasks, !cleardone, !taskhelp"
  );
});

client.on("disconnected", (reason) => {
  console.log(`Bot disconnected: ${reason}`);
});

// Connect to Twitch
client.connect().catch(console.error);
