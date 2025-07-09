import fs from 'fs';
import path from 'path';
import os from 'os';
import axios from 'axios';
import * as cheerio from 'cheerio';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

interface ArticleContent {
  url: string;
  title: string;
  content: string;
}

interface Debriefing {
  url: string;
  title: string;
  summary: string;
}

const CUSTOM_PROMPT = `You are an expert analyst reviewing news articles. Please provide a comprehensive debriefing of the following article that includes:

1. A concise summary of the main points
2. Key takeaways and implications
3. Any notable quotes or data points
4. Relevance to current events or trends

Please keep the debriefing informative yet concise, around 200-300 words.

Article Title: {title}
Article Content: {content}`;

// Test URLs - using reliable news sites
const TEST_URLS = [
  'https://www.bbc.com/news',
  'https://www.reuters.com',
  'https://www.npr.org'
];

async function fetchArticleContent(url: string): Promise<ArticleContent | null> {
  try {
    console.log(`Fetching content from: ${url}`);
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    
    // Remove script and style elements
    $('script, style').remove();
    
    // Try to find title
    const title = $('h1').first().text().trim() || 
                 $('title').text().trim() || 
                 'No title found';

    // Try to extract main content
    let content = '';
    const contentSelectors = [
      'article',
      '.content',
      '.article-content',
      '.post-content',
      '.entry-content',
      'main',
      '.main-content'
    ];

    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text().trim();
        break;
      }
    }

    // Fallback to body content if no specific content found
    if (!content) {
      content = $('body').text().trim();
    }

    // Clean up content
    content = content.replace(/\s+/g, ' ').trim();

    return {
      url,
      title,
      content: content.substring(0, 2000) // Limit content length for testing
    };
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return null;
  }
}

async function generateDebriefingWithOpenAI(article: ArticleContent): Promise<Debriefing | null> {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = CUSTOM_PROMPT
      .replace('{title}', article.title)
      .replace('{content}', article.content);

    console.log('Generating debriefing with OpenAI...');
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.7
    });

    const summary = response.choices[0]?.message?.content?.trim() || 'No summary generated';

    return {
      url: article.url,
      title: article.title,
      summary
    };
  } catch (error) {
    console.error(`Error generating OpenAI debriefing:`, error);
    return null;
  }
}

async function generateDebriefingWithClaude(article: ArticleContent): Promise<Debriefing | null> {
  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const prompt = CUSTOM_PROMPT
      .replace('{title}', article.title)
      .replace('{content}', article.content);

    console.log('Generating debriefing with Claude...');
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 300,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const summary = response.content[0]?.type === 'text' ? response.content[0].text.trim() : 'No summary generated';

    return {
      url: article.url,
      title: article.title,
      summary
    };
  } catch (error) {
    console.error(`Error generating Claude debriefing:`, error);
    return null;
  }
}

async function testCSVProcessing(): Promise<boolean> {
  try {
    console.log('\n=== Testing CSV Processing ===');
    
    // Create a temporary CSV file
    const tempDir = os.tmpdir();
    const csvPath = path.join(tempDir, 'test-articles.csv');
    const csvContent = `url
${TEST_URLS[0]}
${TEST_URLS[1]}`;
    
    fs.writeFileSync(csvPath, csvContent);
    console.log(`Created test CSV at: ${csvPath}`);

    // Test CSV reading (simulating the readCSVLinks function)
    const csv = require('csv-parser');
    const links: string[] = [];
    
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row: any) => {
          const url = row.url || row.link || row.URL || row.Link || Object.values(row)[0];
          if (url && typeof url === 'string') {
            links.push(url.trim());
          }
        })
        .on('end', () => {
          resolve();
        })
        .on('error', (error: Error) => {
          reject(error);
        });
    });

    console.log(`Successfully read ${links.length} links from CSV`);
    
    // Clean up
    fs.unlinkSync(csvPath);
    
    return links.length === 2;
  } catch (error) {
    console.error('CSV processing test failed:', error);
    return false;
  }
}

// NOTE: This test requires Jest or Mocha. Install types if needed:
// npm i --save-dev @types/jest or @types/mocha

// Dynamically import convertTextToSpeech for the test
let convertTextToSpeech: ((textPath: string) => Promise<string | null>) | undefined;

beforeAll(async () => {
  const src = await import('../src/index');
  convertTextToSpeech = src.convertTextToSpeech;
});

describe('ElevenLabs TTS Integration', () => {
  const tempDir = os.tmpdir();
  const testTextPath = path.join(tempDir, 'test-tts.txt');
  const testMp3Path = path.join(tempDir, 'test-tts.mp3');

  beforeAll(() => {
    fs.writeFileSync(testTextPath, 'This is a test of ElevenLabs text to speech integration.');
  });

  afterAll(() => {
    if (fs.existsSync(testTextPath)) fs.unlinkSync(testTextPath);
    if (fs.existsSync(testMp3Path)) fs.unlinkSync(testMp3Path);
  });

  it('should generate a non-empty MP3 file from text', async () => {
    if (!convertTextToSpeech) throw new Error('convertTextToSpeech not loaded');
    const mp3Path = await convertTextToSpeech(testTextPath);
    expect(mp3Path).toBe(testMp3Path);
    expect(fs.existsSync(mp3Path!)).toBe(true);
    const stats = fs.statSync(mp3Path!);
    expect(stats.size).toBeGreaterThan(1000); // Should be non-trivial size
  }, 20000); // Increased timeout to 20 seconds
});

async function runIntegrationTest(): Promise<void> {
  console.log('🚀 Starting Integration Test');
  console.log('============================');

  // Check environment variables
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasClaude = !!process.env.ANTHROPIC_API_KEY;

  console.log(`OpenAI API Key: ${hasOpenAI ? '✅ Set' : '❌ Not set'}`);
  console.log(`Claude API Key: ${hasClaude ? '✅ Set' : '❌ Not set'}`);

  if (!hasOpenAI && !hasClaude) {
    console.error('❌ No API keys found. Please set OPENAI_API_KEY and/or ANTHROPIC_API_KEY');
    process.exit(1);
  }

  // Test CSV processing
  const csvTestPassed = await testCSVProcessing();
  console.log(`CSV Processing: ${csvTestPassed ? '✅ Passed' : '❌ Failed'}`);

  // Test fetching article content
  console.log('\n=== Testing Article Content Fetching ===');
  const testArticle = await fetchArticleContent(TEST_URLS[0]);
  
  if (!testArticle) {
    console.error('❌ Failed to fetch article content');
    process.exit(1);
  }

  console.log('✅ Successfully fetched article content');
  console.log(`Title: ${testArticle.title.substring(0, 100)}...`);
  console.log(`Content length: ${testArticle.content.length} characters`);

  // Test OpenAI integration
  if (hasOpenAI) {
    console.log('\n=== Testing OpenAI Integration ===');
    const openaiDebriefing = await generateDebriefingWithOpenAI(testArticle);
    
    if (!openaiDebriefing) {
      console.error('❌ OpenAI debriefing failed');
    } else {
      console.log('✅ OpenAI debriefing successful');
      console.log(`Summary length: ${openaiDebriefing.summary.length} characters`);
      console.log(`Summary preview: ${openaiDebriefing.summary.substring(0, 150)}...`);
    }
  }

  // Test Claude integration
  if (hasClaude) {
    console.log('\n=== Testing Claude Integration ===');
    const claudeDebriefing = await generateDebriefingWithClaude(testArticle);
    
    if (!claudeDebriefing) {
      console.error('❌ Claude debriefing failed');
    } else {
      console.log('✅ Claude debriefing successful');
      console.log(`Summary length: ${claudeDebriefing.summary.length} characters`);
      console.log(`Summary preview: ${claudeDebriefing.summary.substring(0, 150)}...`);
    }
  }

  console.log('\n🎉 Integration test completed!');
  console.log('============================');
}

// Run the test
if (require.main === module) {
  runIntegrationTest().catch(console.error);
} 