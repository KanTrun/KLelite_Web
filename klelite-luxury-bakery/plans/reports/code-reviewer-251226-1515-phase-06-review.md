## Code Review Summary

### Scope
- **Files reviewed**: Backend services (Chatbot, Recommendation), Controllers, Models (UserActivity, FAQ), Jobs, Frontend components (Chat, Recommendations).
- **Focus**: Phase 06 (AI Recommendations & Chatbot) changes.
- **Key Concerns**: Security (XSS, Injection), Performance (Aggregations), logic correctness.

### Overall Assessment
The implementation provides a solid functional baseline for AI features. The recommendation logic allows for fallbacks, ensuring users always see products. The chatbot integration with OpenAI is straightforward. However, there is a **Critical XSS vulnerability** in the frontend chat component and **High performance risks** due to real-time aggregations without caching.

### Critical Issues
1.  **XSS Vulnerability in ChatWindow.tsx**
    -   **Location**: `frontend/src/components/Chat/ChatWindow.tsx` lines 102.
    -   **Issue**: User input is rendered directly using `dangerouslySetInnerHTML` after simple newline replacement.
    -   **Risk**: A user can input `<img src=x onerror=alert(1)>` (Self-XSS). If chat history were ever stored/viewed by admins, this would become Stored XSS.
    -   **Fix**: Use standard React text rendering (which escapes HTML by default) and only use `dangerouslySetInnerHTML` for trusted content, or use a sanitization library like `dompurify`.
    ```tsx
    // Vulnerable
    <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>') }} />

    // Fix (Simple)
    <div className={styles.bubble}>
      {msg.content.split('\n').map((line, i) => (
        <React.Fragment key={i}>
          {line}
          {i < msg.content.split('\n').length - 1 && <br />}
        </React.Fragment>
      ))}
    </div>
    ```

### High Priority Findings
1.  **Real-time Aggregation Performance**
    -   **Location**: `recommendationService.ts` (`getTrending`, `getSimilarProducts`).
    -   **Issue**: Complex aggregations (grouping, sorting) run on *every* request. `getTrending` scans `UserActivity` (last 7 days) on every call.
    -   **Impact**: High database load as traffic increases.
    -   **Recommendation**: Cache results in Redis or a dedicated collection. The cron job `computeRecommendations.ts` already calculates trending but discards the result.

2.  **Redundant Cron Job Logic**
    -   **Location**: `backend/src/jobs/computeRecommendations.ts`.
    -   **Issue**: The job calculates trending products daily but only logs them (`console.log`). It relies on the service to calculate them on-the-fly.
    -   **Recommendation**: Update the job to save trending product IDs to a cache (Redis) or a `TrendingProducts` collection, and have the service read from there.

### Medium Priority Improvements
1.  **Missing Indexes for Specific Queries**
    -   **Location**: `UserActivity.ts`.
    -   **Issue**: `getTrending` queries `{ activityType: 'purchase', createdAt: { $gte: ... } }`.
    -   **Recommendation**: Add compound index `UserActivitySchema.index({ activityType: 1, createdAt: -1 });` to optimize the trending query if real-time calculation is kept.

2.  **Chatbot Intent Regex Limitations**
    -   **Location**: `chatbotService.ts`.
    -   **Issue**: Simple regex matching for "order status" matches any 6+ char word as an ID.
    -   **Recommendation**: Tighten regex to match specific ID format (e.g., `KL\d{8}`).

### Low Priority Suggestions
1.  **Hardcoded Fallback Values**
    -   **Location**: `recommendationService.ts`.
    -   **Issue**: Limits (e.g., `limit=6`) are hardcoded or passed from controller, but fallbacks loop might need tuning.
    -   **Suggestion**: Extract constants for configuration.

2.  **Type Safety in Aggregation**
    -   **Location**: `recommendationService.ts`.
    -   **Issue**: `any` casting in `(a.productId as any).category`.
    -   **Suggestion**: Define a populated interface for UserActivity to avoid casting.

### Recommended Actions
1.  **IMMEDIATE**: Patch `ChatWindow.tsx` to remove `dangerouslySetInnerHTML` or sanitize input.
2.  **Short-term**: Implement caching for `getTrending` and `getSimilarProducts` (1-hour cache or daily via cron).
3.  **Short-term**: Update `computeRecommendations.ts` to actually persist the calculated data.
4.  **Medium-term**: Add stricter types for Aggregation results.

### Metrics
- **Security**: 1 Critical (XSS).
- **Performance**: 2 High (Uncached Aggregations).
- **Code Quality**: Good structure, consistent style.
