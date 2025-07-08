# GenCast - Article Debriefing Generator

A TypeScript application that reads article links from a CSV file, fetches their content, and generates AI-powered debriefings using OpenAI.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Add your OpenAI API key to the `OPENAI_API_KEY` variable

3. Build the project:
   ```bash
   npm run build
   ```

## Usage

1. Create a CSV file with article links at `~/Materials/dd-MM-YYYY.csv` (e.g., `~/Materials/08-07-2025.csv`)
   - The CSV should contain URLs in a column named `url`, `link`, `URL`, or `Link`
   - Or the URLs can be in the first column

2. Run the script:
   ```bash
   npm run dev
   ```

3. The debriefings will be saved to `~/Materials/dd-MM-YYYY.txt`

## Features

- Reads article links from date-formatted CSV files
- Fetches article content using web scraping
- Generates comprehensive debriefings using OpenAI GPT-3.5-turbo
- Saves results to formatted text files
- Handles errors gracefully and provides progress feedback

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key (required)

## CSV Format

The CSV file should contain article URLs. Supported column names:
- `url`
- `link` 
- `URL`
- `Link`

Or URLs can be in the first column without headers.