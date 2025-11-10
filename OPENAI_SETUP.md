# OpenAI API Setup Guide

## Overview
The AI Chatbot feature requires an OpenAI API key to function. This guide will walk you through setting it up.

## Steps to Configure

### 1. Get Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to **API Keys** section
4. Click **Create new secret key**
5. Copy the generated API key (you won't be able to see it again!)

### 2. Add API Key to Environment Variables

Open your `.env` file in the root directory and update:

```env
# OpenAI API Key (for AI Chatbot)
EXPO_PUBLIC_OPENAI_API_KEY=sk-proj-your-actual-api-key-here
```

**Replace** `your_openai_api_key_here` with your actual OpenAI API key.

### 3. Restart Development Server

After updating the `.env` file, restart your development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm start
# or
bun start
```

### 4. Test the AI Chatbot

1. Open the customer menu page (`/menu`)
2. Click the AI Chatbot button
3. Send a test message
4. You should receive a response from the AI assistant

## Features

The AI Chatbot (Baran) can:
- Answer questions in English, Kurdish (Sorani), and Arabic
- Help customers place orders
- Provide menu recommendations
- Track order status
- Call staff when needed
- Explain Kurdish dishes and traditions

## API Usage and Costs

- **Model Used**: GPT-3.5 Turbo
- **Cost**: ~$0.002 per 1K tokens (check current pricing on OpenAI)
- **Rate Limits**: Depends on your OpenAI account tier

### Cost Estimation
- Average conversation: ~500-1000 tokens
- Cost per conversation: ~$0.001-0.002
- 1000 conversations: ~$1-2

## Troubleshooting

### Error: "OpenAI API key is not configured"
- Make sure you've added the key to `.env` file
- Restart your development server
- Check that the key starts with `sk-`

### Error: "Invalid API key"
- Verify your API key is correct
- Check if the key is still active in OpenAI dashboard
- Make sure there are no extra spaces in the `.env` file

### Error: "Rate limit exceeded"
- You've hit your API usage limit
- Check your OpenAI account billing and usage
- Consider upgrading your OpenAI plan

### No Response from AI
- Check your internet connection
- Verify OpenAI API status
- Check browser console for errors

## Security Best Practices

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Use environment variables** - Never hardcode API keys
3. **Rotate keys regularly** - Generate new keys periodically
4. **Monitor usage** - Keep track of API calls and costs
5. **Set usage limits** - Configure limits in OpenAI dashboard

## Alternative Options

If you don't want to use OpenAI:

### Option 1: Disable AI Chatbot
Remove or hide the AI Chatbot button from the menu page.

### Option 2: Use Rork's AI Tools
The system also includes Rork's AI SDK that can be used as an alternative:

```typescript
import { generateText } from "@rork-ai/toolkit-sdk";

const response = await generateText({
  messages: [{ role: "user", content: "Hello!" }]
});
```

### Option 3: Mock Responses
For testing, you can create mock responses instead of API calls.

## Support

For issues related to:
- **OpenAI API**: Contact OpenAI support
- **System Integration**: Check application logs and console
- **Billing**: Manage in OpenAI dashboard

## References

- [OpenAI Platform](https://platform.openai.com/)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [OpenAI Pricing](https://openai.com/api/pricing/)
- [OpenAI Rate Limits](https://platform.openai.com/docs/guides/rate-limits)
