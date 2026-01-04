#!/usr/bin/env tsx

// Test script to verify Ollama integration
import { OllamaAgent } from './src/lib/ollama-agent';
import { scrapeWebsite } from './src/lib/scraper';

async function testOllamaConnection() {
  console.log('🔍 Testing Ollama connection...');
  
  const agent = new OllamaAgent();
  const isConnected = await agent.checkOllamaConnection();
  const models = await agent.getAvailableModels();
  
  console.log('Connection status:', isConnected);
  console.log('Available models:', models);
  
  return isConnected;
}

async function testWebScraping() {
  console.log('\n🕷️  Testing web scraping...');
  
  try {
    const pages = await scrapeWebsite('https://httpbin.org/html', {
      maxDepth: 1,
      maxPages: 1
    });
    
    console.log(`Scraped ${pages.length} pages`);
    if (pages.length > 0) {
      console.log('First page title:', pages[0].title);
      console.log('Content length:', pages[0].content.length);
    }
    
    return pages;
  } catch (error) {
    console.error('Scraping failed:', error.message);
    return [];
  }
}

async function testCourseGeneration() {
  console.log('\n🎓 Testing course generation...');
  
  const agent = new OllamaAgent();
  const isConnected = await agent.checkOllamaConnection();
  
  if (!isConnected) {
    console.log('⚠️  Ollama not available, skipping course generation test');
    return;
  }
  
  try {
    // Mock scraped content
    const mockPages = [{
      url: 'https://example.com/docs',
      title: 'Example Documentation',
      content: 'This is a comprehensive guide to web development. Learn HTML, CSS, and JavaScript fundamentals.',
      metadata: {
        headings: ['Introduction', 'HTML Basics', 'CSS Styling', 'JavaScript Programming'],
        links: [],
        images: []
      }
    }];
    
    const course = await agent.generateCourse(mockPages, {
      difficulty: 'beginner',
      includeCodeExamples: true,
      includeQuizzes: true,
      includeProjects: true
    });
    
    console.log('Generated course:', course.title);
    console.log('Levels:', course.levels.length);
    course.levels.forEach((level, index) => {
      console.log(`  ${index + 1}. ${level.title} (${level.type}) - ${level.xp} XP`);
    });
    
  } catch (error) {
    console.error('Course generation failed:', error.message);
  }
}

async function main() {
  console.log('🚀 Testing DocuQuest Ollama Integration\n');
  
  const ollamaConnected = await testOllamaConnection();
  const scrapedPages = await testWebScraping();
  await testCourseGeneration();
  
  console.log('\n✅ Test completed!');
  
  if (!ollamaConnected) {
    console.log('\n📝 Note: Ollama is not running or not accessible.');
    console.log('To use AI-powered course generation, install and start Ollama:');
    console.log('  1. Install Ollama: https://ollama.ai/');
    console.log('  2. Pull a model: ollama pull llama3.2');
    console.log('  3. Start Ollama: ollama serve');
  }
}

main().catch(console.error);
