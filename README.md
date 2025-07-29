# 🍅 Twitch Task Bot with Pomodoro Timer

A complete Twitch bot system for managing tasks and productivity with real-time overlay display for streamers.

## ✨ Features

- 📋 **Interactive Task Management** - Viewers can add, edit, and complete tasks via chat
- 🍅 **Pomodoro Timer** - Built-in productivity timer with work/break cycles
- 🎨 **Beautiful Overlay** - Purple-themed desktop display with auto-scrolling
- 💬 **Chat Integration** - Full Twitch chat command support
- 🔄 **Real-time Updates** - WebSocket-powered live updates
- 📱 **Responsive Design** - Works on any screen size

## 🎮 Chat Commands

### Task Commands
- `!add <description>` - Add a new task
- `!edit <id> <new text>` - Edit your task
- `!done <id>` - Mark task as complete
- `!mytasks` - List your tasks
- `!cleardone` - Clear completed tasks (mods only)

### Pomodoro Commands  
- `!pomodoro [minutes]` - Start work session (default 25 min)
- `!pause` - Pause active timer
- `!resume` - Resume paused timer
- `!reset` - Reset timer to 25:00
- `!pstatus` - Check timer status
- `!pomohelp` - Show Pomodoro help

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Twitch account for bot
- Twitch OAuth token

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/twitch-task-bot.git
cd twitch-task-bot
```

### 2. Setup Bot Credentials
```bash
cd bot
cp .env.example .env
# Edit .env with your Twitch credentials
```

### 3. Install Dependencies
```bash
# Backend
cd backend
npm install

# Bot  
cd ../bot
npm install

# Overlay
cd ../overlay
npm install
```

### 4. Start Services
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Bot
cd bot && npm run dev  

# Terminal 3 - Overlay
cd overlay && npm start
```

### 5. Setup OBS (Optional)
- Add Browser Source: `http://localhost:3000`
- Width: 450px, Height: 800px
- Perfect for corner overlay!

## 🔧 Configuration

### Getting Twitch Credentials
1. **Bot Username**: Your bot's Twitch username
2. **OAuth Token**: Get from [Twitch Chat OAuth Generator](https://twitchapps.com/tmi/)
3. **Channel Name**: Your streaming channel name

### Environment Variables
```env
BOT_USERNAME=your_bot_username
BOT_OAUTH_TOKEN=oauth:your_token_here
CHANNEL_NAME=your_channel
API_BASE_URL=http://localhost:3001/api
```

## 🎨 Customization

### Colors & Theme
- Edit `overlay/src/App.css` to change colors
- Default: Purple theme with neon effects
- Fully customizable gradients and animations

### Pomodoro Timing
- Work sessions: 25 minutes
- Short breaks: 10 minutes  
- Long breaks: 15 minutes (every 4th session)

### Auto-scroll
- Shows 3 tasks at a time
- Auto-rotates every 4 seconds
- Click dots to jump between pages

## 📁 Project Structure

```
twitch-task-bot/
├── backend/          # Express + Socket.io server
│   ├── server.js
│   └── package.json
├── bot/             # Twitch chat bot
│   ├── bot.js
│   ├── .env.example
│   └── package.json
├── overlay/         # React overlay display
│   ├── src/
│   │   ├── App.js
│   │   └── App.css
│   └── package.json
└── README.md
```

## 🌟 How it Works

1. **Viewers type commands** in Twitch chat (`!add Fix audio`)
2. **Bot processes commands** and sends to backend API
3. **Backend stores data** and emits WebSocket events
4. **React overlay updates** in real-time on your screen/OBS
5. **Pomodoro timer runs** with automatic work/break cycles

## 🤖 Nightbot Integration

Add these commands to Nightbot for easy viewer access:

```
!pomohelp - Response: 🍅 POMODORO COMMANDS: !pomodoro [minutes] | !pause | !resume | !reset | !pstatus | Help $(channel) stay focused! 💪
```

## 🐛 Troubleshooting

### Bot Not Connecting
- Check OAuth token format (must start with `oauth:`)
- Verify channel name (no # symbol)
- Ensure bot has chat permissions

### Overlay Not Updating  
- Check backend server is running on port 3001
- Verify WebSocket connection in browser console
- Refresh overlay if needed

### Commands Not Working
- Confirm backend API is running
- Check bot console for error messages
- Verify API_BASE_URL in bot's .env

## 📊 Features in Detail

### Task Management
- ✅ Add tasks from chat
- ✅ Edit your own tasks  
- ✅ Mark tasks complete
- ✅ Auto-scroll for 3+ tasks
- ✅ User permissions
- ✅ Persistent storage

### Pomodoro System
- ✅ 25/10/15 minute cycles
- ✅ Auto work→break→work flow
- ✅ Visual progress bar
- ✅ Chat notifications
- ✅ Session counting
- ✅ Pause/resume support

### Overlay Design
- ✅ Purple neon theme
- ✅ Smooth animations
- ✅ Draggable window
- ✅ Minimize/expand
- ✅ Auto-scroll tasks
- ✅ Real-time updates

## 🎯 Perfect For

- 🎮 **Gaming streamers** - Stay organized during long streams
- 💻 **Coding streamers** - Pomodoro technique for focus
- 🎨 **Creative streamers** - Track project tasks
- 📚 **Study streamers** - Viewer accountability
- 🎪 **Any streamer** - Interactive engagement tool

## 📈 Roadmap

- [ ] Database integration
- [ ] Task categories/tags  
- [ ] Custom break lengths
- [ ] Productivity analytics
- [ ] Multiple channel support
- [ ] Mobile app companion

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with React, Express, Socket.io
- Twitch API integration via tmi.js
- Purple theme inspired by streaming aesthetics
- Pomodoro Technique by Francesco Cirillo

---

**Made with ❤️ for the streaming community**

*Help streamers stay productive and engaged with their audience!*