import fs from 'fs';
import path from 'path';
import os from 'os';
import csv from 'csv-parser';
import axios from 'axios';
import * as cheerio from 'cheerio';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Determine which API to use based on available environment variables
const useOpenAI = !!process.env.OPENAI_API_KEY;
const useClaude = !!process.env.ANTHROPIC_API_KEY;

if (!useOpenAI && !useClaude) {
  console.error('Error: Neither OPENAI_API_KEY nor ANTHROPIC_API_KEY environment variable is set');
  process.exit(1);
}

const apiProvider = useOpenAI ? 'OpenAI' : 'Claude';
console.log(`Using ${apiProvider} API for content generation`);

interface ArticleLink {
  url: string;
}

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

async function fetchArticleContent(url: string): Promise<ArticleContent | null> {
  try {
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
      content: content.substring(0, 4000) // Limit content length
    };
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return null;
  }
}

async function generateDebriefing(article: ArticleContent): Promise<Debriefing | null> {
  try {
    const prompt = CUSTOM_PROMPT
      .replace('{title}', article.title)
      .replace('{content}', article.content);

    let summary: string;

    if (useOpenAI) {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      summary = response.choices[0]?.message?.content?.trim() || 'No summary generated';
    } else {
      // Use Claude API
      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      summary = response.content[0]?.type === 'text' ? response.content[0].text.trim() : 'No summary generated';
    }

    return {
      url: article.url,
      title: article.title,
      summary
    };
  } catch (error) {
    console.error(`Error generating debriefing for ${article.url}:`, error);
    return null;
  }
}

async function readCSVLinks(csvPath: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const links: string[] = [];
    
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        // Try different possible column names
        const url = row.url || row.link || row.URL || row.Link || Object.values(row)[0];
        if (url && typeof url === 'string') {
          links.push(url.trim());
        }
      })
      .on('end', () => {
        resolve(links);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

async function saveDebriefings(debriefings: Debriefing[], outputPath: string): Promise<void> {
  const content = debriefings.map((debriefing, index) => {
    return `
=== ARTICLE ${index + 1} ===
URL: ${debriefing.url}
TITLE: ${debriefing.title}

DEBRIEFING:
${debriefing.summary}

${'='.repeat(80)}
`;
  }).join('\n');

  fs.writeFileSync(outputPath, content, 'utf8');
}

async function main() {
  try {
    // Get current date in dd-MM-YYYY format
    const today = new Date();
    const dateString = today.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '-');

    const homeDir = os.homedir();
    const csvPath = path.join(homeDir, 'Materials', `${dateString}.csv`);
    const outputPath = path.join(homeDir, 'Materials', `${dateString}.txt`);

    console.log(`Reading CSV from: ${csvPath}`);
    console.log(`Output will be saved to: ${outputPath}`);

    // Check if CSV file exists
    if (!fs.existsSync(csvPath)) {
      console.error(`CSV file not found: ${csvPath}`);
      process.exit(1);
    }

    // Read article links from CSV
    const links = await readCSVLinks(csvPath);
    console.log(`Found ${links.length} article links`);

    if (links.length === 0) {
      console.error('No valid links found in CSV file');
      process.exit(1);
    }

    const debriefings: Debriefing[] = [];

    // Process each article
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      console.log(`Processing article ${i + 1}/${links.length}: ${link}`);

      const article = await fetchArticleContent(link);
      if (!article) {
        console.log(`Skipping article ${i + 1} due to fetch error`);
        continue;
      }

      const debriefing = await generateDebriefing(article);
      if (!debriefing) {
        console.log(`Skipping article ${i + 1} due to AI generation error`);
        continue;
      }

      debriefings.push(debriefing);
      console.log(`Successfully processed article ${i + 1}`);

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Save debriefings to file
    await saveDebriefings(debriefings, outputPath);
    console.log(`Debriefings saved to: ${outputPath}`);
    console.log(`Successfully processed ${debriefings.length} out of ${links.length} articles`);

  } catch (error) {
    console.error('Error in main process:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}