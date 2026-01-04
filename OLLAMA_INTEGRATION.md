# 🤖 Ollama-Powered Course Generation for DocuQuest

This enhancement adds intelligent web scraping and AI-powered course generation to DocuQuest using Ollama.

## 🚀 Features

- **🕷️ Intelligent Web Scraping**: Automatically extracts content from documentation sites and discovers associated pages
- **🤖 AI Course Generation**: Uses Ollama to analyze scraped content and generate structured, gamified courses
- **🎯 Smart Content Analysis**: Identifies key concepts, creates progressive learning paths, and generates appropriate challenges
- **⚙️ Advanced Configuration**: Customizable scraping depth, page limits, difficulty levels, and content types
- **🔄 Fallback Support**: Gracefully falls back to template generation when Ollama is unavailable

## 📋 Prerequisites

### Required
- Node.js 18+
- Ollama (optional but recommended for AI features)

### Optional (for AI features)
- Ollama installed and running
- At least one Ollama model (e.g., `llama3.2`)

## 🛠️ Installation

### 1. Install Dependencies

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies  
cd ..
npm install
```

### 2. Setup Ollama (Optional but Recommended)

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull a model
ollama pull llama3.2

# Start Ollama server
ollama serve
```

### 3. Start the Application

```bash
# Start backend (in one terminal)
cd backend
npm run dev

# Start frontend (in another terminal)
npm run dev
```

## 🎯 Usage

### Web Scraping + AI Generation

1. Open the enhanced campaign creator
2. Select "Web Scrape" mode
3. Enter a documentation URL (e.g., `https://docs.example.com`)
4. Configure advanced options if needed:
   - **Max Depth**: How many levels of links to follow (1-5)
   - **Max Pages**: Maximum number of pages to scrape (5-100)
   - **Difficulty**: Beginner, Intermediate, or Advanced
   - **Content Types**: Code examples, quizzes, projects
5. Click "Create Campaign" to generate an AI-powered course

### AI Prompt Generation

1. Select "AI Prompt" mode
2. Describe what you want to learn (e.g., "I want to learn React hooks and state management")
3. Configure generation options
4. Click "Create Campaign"

## 🏗️ Architecture

### Backend Components

- **`/src/lib/scraper.ts`**: Web scraping engine with Cheerio
- **`/src/lib/ollama-agent.ts`**: Ollama integration for course generation
- **Enhanced API endpoints**: `/api/scrape`, `/api/ollama/status`

### Frontend Components

- **`EnhancedCampaignCreator`**: Advanced UI for campaign creation
- **Updated API client**: New methods for scraping and Ollama

### API Endpoints

#### `POST /api/scrape`
Scrapes a website and returns extracted content.

```json
{
  "url": "https://docs.example.com",
  "options": {
    "maxDepth": 2,
    "maxPages": 30
  }
}
```

#### `GET /api/ollama/status`
Checks Ollama connection and available models.

#### `POST /api/campaigns/generate` (Enhanced)
Now supports scraping and generation options:

```json
{
  "sourceUrl": "https://docs.example.com",
  "createdBy": "user-id",
  "scrapingOptions": {
    "maxDepth": 2,
    "maxPages": 30
  },
  "generationOptions": {
    "difficulty": "beginner",
    "includeCodeExamples": true,
    "model": "llama3.2"
  }
}
```

## 🧪 Testing

Run the test script to verify functionality:

```bash
cd backend
npx tsx test-ollama.ts
```

This will test:
- Ollama connection status
- Web scraping functionality
- Course generation (if Ollama is available)

## 📝 Configuration

### Scraping Options

- **maxDepth**: Maximum link depth to follow (default: 2)
- **maxPages**: Maximum pages to scrape (default: 30)
- **followExternalLinks**: Allow external domain links (default: false)
- **selectors**: Custom CSS selectors for content extraction

### Generation Options

- **model**: Ollama model to use (default: "llama3.2")
- **difficulty**: Course difficulty level
- **focusAreas**: Specific topics to focus on
- **includeCodeExamples**: Include code examples in lessons
- **includeQuizzes**: Generate quiz questions
- **includeProjects**: Include project-based challenges

## 🔄 Fallback Behavior

When Ollama is not available:
- Web scraping still works
- Course generation falls back to template-based approach
- Users are notified about AI limitations

## 🚨 Troubleshooting

### Ollama Connection Issues

1. **Check if Ollama is running**:
   ```bash
   ollama list
   ```

2. **Start Ollama server**:
   ```bash
   ollama serve
   ```

3. **Pull a model**:
   ```bash
   ollama pull llama3.2
   ```

### Scraping Issues

1. **Check URL accessibility**: Ensure the URL is publicly accessible
2. **Verify robots.txt**: Some sites block scraping
3. **Adjust depth/pages**: Reduce `maxDepth` and `maxPages` for large sites

### Performance Tips

- Limit scraping to 30-50 pages for best performance
- Use depth 1-2 for most documentation sites
- Cache frequently scraped content

## 🎮 Example Use Cases

### API Documentation
```typescript
// Scrape React docs
const result = await api.scrapeWebsite('https://react.dev/learn', {
  maxDepth: 2,
  maxPages: 25
})
```

### Tutorial Series
```typescript
// Generate from tutorial site
const campaign = await api.generateCampaign({
  sourceUrl: 'https://www.javascript.info/',
  scrapingOptions: { maxDepth: 1, maxPages: 20 },
  generationOptions: { difficulty: 'intermediate' }
})
```

### Custom Learning
```typescript
// AI-generated from prompt
const campaign = await api.generateCampaign({
  prompt: "I want to learn TypeScript for React development",
  generationOptions: { 
    difficulty: 'beginner',
    includeCodeExamples: true 
  }
})
```

## 🤝 Contributing

To extend the functionality:

1. **Add new scrapers**: Support for different content types
2. **Enhance AI prompts**: Better course generation logic
3. **Improve UI**: Additional configuration options
4. **Add tests**: More comprehensive test coverage

## 📄 License

This enhancement follows the same MIT license as DocuQuest.
