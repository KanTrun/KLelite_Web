# Gemini API Configuration Guide

## Quick Setup

1. **Get API Key**
   - Visit: https://aistudio.google.com/app/apikey
   - Click "Create API key"
   - Copy the key (starts with `AIzaSy...`)

2. **Add to .env File**
   ```bash
   GEMINI_API_KEY=AIzaSyDQdyNndMW-V5p4OVXe2wUxHm-b1n4d0GU
   ```

3. **Restart Backend Server**
   ```bash
   npm run dev
   ```

## Supported Models (2025)

✅ **Recommended Models:**
- `gemini-2.0-flash` - Fast, efficient (default in our code)
- `gemini-2.5-pro` - Higher quality, slower
- `gemini-2.5-flash` - Balanced performance

❌ **Deprecated Models:**
- `gemini-pro` - Removed in 2024
- `gemini-1.5-pro` - Use 2.x versions instead

## Free Tier Limits

**Rate Limits:**
- 15 requests per minute
- 1,500 requests per day
- 1 million tokens per minute

**When Quota Exceeded:**
- Error 429: RESOURCE_EXHAUSTED
- Wait for quota reset (resets per minute)
- Or upgrade to paid tier

## Common Issues

### Issue 1: "API không phản hồi" (API not responding)

**Cause**: Quota exceeded or invalid API key

**Fix**:
```bash
# Check server logs for errors
npm run dev

# Look for:
# - "quota" or "429" → Wait for quota reset
# - "API key" or "401" → Check API key validity
```

### Issue 2: Model Not Found (404)

**Cause**: Using deprecated model name

**Fix**: Code already updated to use `gemini-2.0-flash`

### Issue 3: Silent Failures

**Cause**: Environment variable not loaded

**Fix**:
```bash
# 1. Check .env file exists
ls -la .env

# 2. Verify API key is set
cat .env | grep GEMINI

# 3. Restart server to reload env
npm run dev
```

## Testing the Chatbot

1. **Start Backend**
   ```bash
   cd klelite-luxury-bakery/backend
   npm run dev
   ```

2. **Test via Frontend**
   - Open chat widget
   - Ask: "Bạn là ai?" (Who are you?)
   - Should get AI response in Vietnamese

3. **Expected Response**
   ```
   Tôi là trợ lý ảo của KL'elite Luxury Bakery...
   ```

## How It Works

```
User Message → chatbotService.ts
    ↓
Intent Classification (FAQ, Order, Product, etc.)
    ↓
Unknown Intent → handleWithGemini()
    ↓
Gemini API (gemini-2.0-flash)
    ↓
AI Response in Vietnamese
```

## Code Location

- **Service**: `src/services/chatbotService.ts`
- **Controller**: `src/controllers/chatbotController.ts`
- **Routes**: `src/routes/chatbotRoutes.ts`

## Monitoring Usage

Check your quota at: https://aistudio.google.com/app/apikey

**Quota Dashboard shows:**
- Requests per minute used
- Daily requests remaining
- Token usage

## Production Recommendations

1. **Upgrade to Paid Tier**
   - Higher rate limits
   - Better SLA
   - Production support

2. **Add Caching**
   - Cache common FAQ responses
   - Reduce API calls
   - Save quota

3. **Implement Fallbacks**
   - Use rule-based responses when quota exceeded
   - Queue requests during high traffic

4. **Monitor Errors**
   - Log all Gemini API errors
   - Alert on quota warnings
   - Track response times

## Support

- Gemini API Docs: https://ai.google.dev/docs
- API Key Management: https://aistudio.google.com/app/apikey
- Pricing: https://ai.google.dev/pricing

## Changelog

- **2025-12-28**: Updated to gemini-2.0-flash (fixed deprecated model)
- **2025-12-28**: Added detailed error logging and quota handling
