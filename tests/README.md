# Integration Tests

This directory contains integration tests that verify the complete functionality of the GenCast application with real internet connectivity and AI API integrations.

## ⚠️ Important Note

**These tests are NOT run automatically** during the build process because they:
- Require internet connectivity
- Make actual API calls to OpenAI and/or Claude
- May incur costs for API usage
- Are dependent on external services

## Prerequisites

Before running the integration tests, ensure you have:

1. **Internet connectivity** - Tests fetch content from real websites
2. **API Keys** - At least one of the following environment variables set:
   - `OPENAI_API_KEY` - For OpenAI GPT integration
   - `ANTHROPIC_API_KEY` - For Claude AI integration

## Running the Integration Test

To run the integration test manually:

```bash
npm run test:integration
```

This command will:
1. Compile the TypeScript code
2. Run the integration test
3. Display detailed results in the console

## What the Integration Test Covers

The integration test verifies:

### 1. Environment Setup
- ✅ Checks if API keys are properly configured
- ✅ Validates that at least one AI service is available

### 2. CSV Processing
- ✅ Creates a temporary CSV file with test URLs
- ✅ Tests reading and parsing CSV content
- ✅ Validates URL extraction functionality

### 3. Article Content Fetching
- ✅ Tests fetching content from real websites (BBC, Reuters, NPR)
- ✅ Validates HTML parsing and content extraction
- ✅ Ensures proper handling of different website structures

### 4. OpenAI Integration (if `OPENAI_API_KEY` is set)
- ✅ Tests OpenAI API connectivity
- ✅ Validates GPT-3.5-turbo model usage
- ✅ Confirms proper prompt formatting and response parsing

### 5. Claude Integration (if `ANTHROPIC_API_KEY` is set)
- ✅ Tests Claude API connectivity
- ✅ Validates Claude 3 Haiku model usage
- ✅ Confirms proper prompt formatting and response parsing

## Expected Output

When running successfully, you should see output like:

```
🚀 Starting Integration Test
============================
OpenAI API Key: ✅ Set
Claude API Key: ✅ Set

=== Testing CSV Processing ===
Created test CSV at: /tmp/test-articles.csv
Successfully read 2 links from CSV
CSV Processing: ✅ Passed

=== Testing Article Content Fetching ===
Fetching content from: https://www.bbc.com/news
✅ Successfully fetched article content
Title: BBC News - Home...
Content length: 2000 characters

=== Testing OpenAI Integration ===
Generating debriefing with OpenAI...
✅ OpenAI debriefing successful
Summary length: 285 characters
Summary preview: This article discusses recent developments in...

=== Testing Claude Integration ===
Generating debriefing with Claude...
✅ Claude debriefing successful
Summary length: 298 characters
Summary preview: The article provides an overview of current...

🎉 Integration test completed!
============================
```

## Troubleshooting

### Common Issues

1. **No API Keys Found**
   ```
   ❌ No API keys found. Please set OPENAI_API_KEY and/or ANTHROPIC_API_KEY
   ```
   **Solution**: Set at least one of the required environment variables

2. **Network Issues**
   ```
   ❌ Failed to fetch article content
   ```
   **Solution**: Check your internet connection and ensure the test URLs are accessible

3. **API Rate Limits**
   ```
   Error generating debriefing: Rate limit exceeded
   ```
   **Solution**: Wait a few minutes and try again, or check your API usage limits

### Setting Environment Variables

**For OpenAI:**
```bash
export OPENAI_API_KEY="your-openai-api-key-here"
```

**For Claude:**
```bash
export ANTHROPIC_API_KEY="your-anthropic-api-key-here"
```

**For permanent setup**, add these to your shell profile (`.bashrc`, `.zshrc`, etc.)

## Cost Considerations

Running this test will make actual API calls and may incur small costs:
- OpenAI: ~$0.002 per test run (GPT-3.5-turbo)
- Claude: ~$0.0008 per test run (Claude 3 Haiku)

The test uses short content samples to minimize costs while still validating functionality. 