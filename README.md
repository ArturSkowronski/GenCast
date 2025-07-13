# GenCast - Article Debriefing Generator

A TypeScript application that reads article links from a CSV file, fetches their content, and generates AI-powered debriefings using OpenAI or Claude. Now supports text-to-speech (TTS) conversion to MP3 using ElevenLabs.

---

## Project Vision: Personal HackerNews Podcast-Reader

This project is evolving into a personal morning HackerNews Podcast-Reader. The ultimate goal is to:

- **Every morning, automatically fetch the Top 20 Hacker News articles.**
- **Generate 10 minutes of content** summarizing what each article is about (perfect for a morning commute with my daughter).
- **Deliver the audio summary to a private RSS feed** for podcasts, so I can listen easily.
- **Provide a UI with a checklist** to quickly select articles for a deeper dive.
- **While getting ready (e.g., putting on shoes), generate another 10 minutes**: deeper summaries of selected articles and their discussions.
- **Add selected articles to Instapaper** for later, so if something is truly useful, I can deep-dive further.

This is shared for inspiration! I tested ElvenReader, but it was not customizable enough, so I decided to build my own solution.

---

## Hacker News Integration

- The function `fetchAndSaveTopHackerNewsArticles()` (exported from `src/index.ts`) will download the top 10 articles from Hacker News and save their URLs to a CSV file in your `~/Materials` directory, named `{dateString}-hn.csv` (e.g., `08-07-2025-hn.csv`).
- This CSV can then be used as input for the rest of the GenCast pipeline.
- An integration test is provided to verify this functionality.

---

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Add your OpenAI API key to the `OPENAI_API_KEY` variable
   - (Optional) Add your Anthropic Claude API key to `ANTHROPIC_API_KEY`
   - (Optional) Add your ElevenLabs API key to `ELEVENLABS_API_KEY` for TTS

3. Build the project:
   ```bash
   npm run build
   ```

## Usage

1. Create a CSV file with article links at `~/Materials/dd-MM-YYYY.csv` (e.g., `~/Materials/08-07-2025.csv`)
   - The CSV should contain URLs in a column named `url`, `link`, `URL`, or `Link`
   - Or the URLs can be in the first column
   - Or, use the Hacker News integration to generate a CSV automatically.

2. Run the script:
   ```bash
   npm run dev
   ```

3. The debriefings will be saved to `~/Materials/dd-MM-YYYY.txt`
   - (Optional) To convert the output text file to MP3, use the `convertTextToSpeech` function in your workflow or run the provided integration test.

## Features

- Reads article links from date-formatted CSV files
- Fetches article content using web scraping
- Generates comprehensive debriefings using OpenAI GPT-3.5-turbo or Claude
- Saves results to formatted text files
- **NEW:** Converts debriefing text files to MP3 using ElevenLabs TTS
- **NEW:** Downloads top Hacker News articles to CSV for automated workflows
- Handles errors gracefully and provides progress feedback

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key (required for OpenAI integration)
- `ANTHROPIC_API_KEY`: Your Anthropic Claude API key (optional, for Claude integration)
- `ELEVENLABS_API_KEY`: Your ElevenLabs API key (optional, for TTS integration)

## CSV Format

The CSV file should contain article URLs. Supported column names:
- `url`
- `link` 
- `URL`
- `Link`

Or URLs can be in the first column without headers.

## ElevenLabs TTS Integration

- The function `convertTextToSpeech(textPath: string)` (exported from `src/index.ts`) will convert a text file to an MP3 file using ElevenLabs.
- The output MP3 will be saved alongside the text file, with the same name but `.mp3` extension.
- Requires the `ELEVENLABS_API_KEY` environment variable.

## Integration Tests

- Integration tests are located in `tests/integration.test.ts`.
- To run the Hacker News integration test:
  1. Run `npm run test:integration` (or `npx jest`).
  2. The test will verify that the top 10 Hacker News articles are downloaded and saved to a CSV.
- To run the ElevenLabs TTS integration test:
  1. Ensure you have set `ELEVENLABS_API_KEY` in your environment.
  2. Build the project: `npm run build`
  3. Run the test with your preferred test runner (e.g., Jest or Mocha).
     - Example for Jest:
       ```bash
       npx jest tests/integration.test.ts
       ```
     - Example for Mocha:
       ```bash
       npx mocha tests/integration.test.ts
       ```

## Cost Considerations

Running this test will make actual API calls and may incur small costs:
- OpenAI: ~$0.002 per test run (GPT-3.5-turbo)
- ElevenLabs: TTS API usage may incur costs depending on your ElevenLabs plan

---

For more details, see the comments in the code and tests.