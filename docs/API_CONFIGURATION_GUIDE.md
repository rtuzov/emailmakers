# API Configuration Guide for Email-Makers

## Overview

Email-Makers requires several API keys to function properly. The system follows a **NO FALLBACK** policy - if required API keys are missing or invalid, the system will fail immediately with clear error messages.

## Required API Keys

### 1. OpenAI API Key (REQUIRED)
- **Purpose**: AI content generation, image analysis, and asset selection
- **Variable**: `OPENAI_API_KEY`
- **Format**: `sk-proj-...` (starts with sk-proj-)
- **How to get**: https://platform.openai.com/api-keys

### 2. Unsplash API Key (REQUIRED for External Images)
- **Purpose**: Fetching real external images for email campaigns
- **Variable**: `UNSPLASH_ACCESS_KEY`
- **Format**: 30+ character alphanumeric string
- **How to get**: https://unsplash.com/developers

## Configuration Steps

### Step 1: Get Your Unsplash API Key

1. Go to https://unsplash.com/developers
2. Create a new application or use existing one
3. Copy your "Access Key" (NOT the Secret Key)
4. The key should be ~30 characters long

### Step 2: Update .env.local

Open `.env.local` in the project root and update:

```bash
# Replace the placeholder with your real Unsplash key
UNSPLASH_ACCESS_KEY=your_actual_unsplash_access_key_here

# Ensure OpenAI key is properly set
OPENAI_API_KEY=sk-proj-your_actual_openai_key
```

### Step 3: Restart the Development Server

```bash
npm run dev
```

## Error Messages and Solutions

### ❌ UNSPLASH_ACCESS_KEY not configured
**Error**: `UNSPLASH_ACCESS_KEY environment variable is required for external image generation`

**Solution**: 
1. Get your Unsplash API key from https://unsplash.com/developers
2. Update `UNSPLASH_ACCESS_KEY` in `.env.local`
3. Restart the server

### ❌ 401 Unauthorized from Unsplash
**Error**: `API AUTHENTICATION FAILED: Invalid or expired Unsplash API key`

**Solution**:
1. Verify your Unsplash API key is correct
2. Check if the key has been deactivated in your Unsplash developer dashboard
3. Generate a new key if needed

### ❌ OPENAI_API_KEY not configured
**Error**: `OPENAI_API_KEY environment variable is required for AI analysis`

**Solution**:
1. Get your OpenAI API key from https://platform.openai.com/api-keys
2. Update `OPENAI_API_KEY` in `.env.local`
3. Ensure you have sufficient credits in your OpenAI account

## Testing Configuration

To test if your API keys are working:

1. **Create a new campaign** via the web interface
2. **Check the logs** for successful API calls:
   - `✅ AI generated X external images` (confirms Unsplash works)
   - `✅ Successfully generated comprehensive AI asset manifest` (confirms full flow)

## NO FALLBACK Policy

This system strictly follows a **NO FALLBACK** policy:

- ❌ No placeholder images if Unsplash fails
- ❌ No default content if OpenAI fails  
- ❌ No backup APIs or services
- ✅ Clear error messages for missing configuration
- ✅ Fast failure with specific instructions

This ensures data quality and prevents silent degradation of functionality.

## Security Notes

- Never commit real API keys to version control
- API keys in `.env.local` are automatically ignored by git
- Use different keys for development and production
- Rotate keys regularly for security

## Production Deployment

For production, set these environment variables in your deployment platform:
- `OPENAI_API_KEY`
- `UNSPLASH_ACCESS_KEY`

Do not use `.env.local` in production environments. 