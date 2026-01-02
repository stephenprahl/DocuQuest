# 🗡️ DocuQuest

> Transform boring documentation into epic interactive learning adventures

![DocuQuest Banner](https://img.shields.io/badge/DocuQuest-Interactive%20Learning-purple?style=for-the-badge&logo=react)
![React](https://img.shields.io/badge/React-19.2.0-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue?style=for-the-badge&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7.2.4-orange?style=for-the-badge&logo=vite)

## 🎯 Overview

DocuQuest is a revolutionary web application that gamifies technical documentation learning. Instead of passively reading through dry API docs and tutorials, users embark on interactive RPG-style campaigns where they battle "code bugs," solve programming challenges, and earn XP and badges while mastering new technologies.

### ✨ Key Features

- **🎮 RPG-Style Learning**: Turn any documentation into an interactive adventure with quests, battles, and boss fights
- **🤖 AI-Powered Campaign Generation**: Automatically generate learning campaigns from documentation URLs or custom prompts
- **📊 Progress Tracking**: Monitor your learning journey with XP, levels, and achievement badges
- **💾 Persistent State**: Your progress is saved locally and synced with the backend
- **🎨 Modern UI**: Beautiful, responsive interface built with Tailwind CSS and Lucide icons
- **🔧 Multiple Challenge Types**: Lessons, quizzes, coding challenges, and boss battles

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or bun package manager

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd docuquest

# Install dependencies
bun install  # or npm install

# Start the development server
bun run dev  # or npm run dev
```

The application will be available at `http://localhost:5173`

### Environment Setup

Ensure your backend API is running on `http://localhost:3001` (configured in `src/api/client.ts`)

## 🏗️ Architecture

### Frontend Stack

- **React 19.2.0** - Modern React with latest features
- **TypeScript 5.9.3** - Type-safe development
- **Vite 7.2.4** - Fast development and build tool
- **Tailwind CSS 3.4.19** - Utility-first styling
- **Lucide React** - Beautiful icon library

### Project Structure

```
src/
├── api/
│   └── client.ts          # API client and type definitions
├── assets/
│   └── react.svg          # React logo
├── App.tsx                # Main application component
├── main.tsx              # Application entry point
├── index.css             # Global styles
└── App.css               # Component styles
```

### Core Components

- **Campaign System**: Create and manage learning campaigns from various sources
- **Battle System**: Interactive challenges with different difficulty levels
- **Progress Tracking**: XP, levels, and achievement system
- **User Profile**: Personal dashboard showing learning statistics

## 🎮 How It Works

### 1. Campaign Creation
Users can create learning campaigns by:
- Providing a documentation URL (automatically parsed and gamified)
- Entering a custom learning prompt (AI generates content)
- Choosing from existing public campaigns

### 2. Interactive Learning
Each campaign contains multiple levels:
- **Lessons**: Story-mode content delivery
- **Quizzes**: Knowledge checks with immediate feedback
- **Challenges**: Coding puzzles and problems
- **Boss Battles**: Comprehensive skill tests

### 3. Progress System
- Earn XP for completing challenges
- Level up your developer profile
- Unlock badges and achievements
- Track completion statistics

## 🛠️ Development

### Available Scripts

```bash
# Development server with hot reload
bun run dev

# Build for production
bun run build

# Run ESLint
bun run lint

# Preview production build
bun run preview
```

### Code Style

The project uses ESLint with React and TypeScript configurations. Key patterns:

- Functional components with hooks
- TypeScript interfaces for type safety
- Tailwind CSS for styling
- Custom UI components (Button, Card, Badge)

### API Integration

The frontend communicates with a REST API (`src/api/client.ts`):

```typescript
// Campaign management
api.getCampaigns()
api.generateCampaign(data)
api.deleteCampaign(id)

// Progress tracking
api.getUserProgress(userId)
api.updateUserProgress(userId, data)
```

## 🎯 Use Cases

- **Developer Onboarding**: New team members learn your codebase through gamified adventures
- **API Documentation**: Transform API docs into interactive learning experiences
- **Technical Training**: Create engaging training materials for complex technologies
- **Self-Learning**: Master new frameworks and languages through structured gameplay

## 🔧 Configuration

### Tailwind CSS

Configuration in `tailwind.config.js` with custom color scheme and component styling.

### TypeScript

Strict TypeScript configuration in `tsconfig.json` and `tsconfig.app.json` for type safety.

### Vite

Optimized Vite configuration with React plugin and development settings.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- React team for the amazing framework
- Vite for the lightning-fast build tool
- Tailwind CSS for the utility-first CSS framework
- Lucide for the beautiful icon set

---

**Built with ❤️ for developers who love to learn through play**
