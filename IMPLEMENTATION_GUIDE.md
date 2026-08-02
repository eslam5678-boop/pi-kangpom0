# Pharaohs Pi Farm - Implementation Guide

## System Architecture Overview

### 1. State Management (Central Source of Truth)
All game state flows through the FarmContext. No component maintains local state for game data.

**Key Pattern:**
\`\`\`typescript
const { state, completeTask, setLanguage } = useFarm()
// Read from state, call methods to update
\`\`\`

### 2. i18n Localization (Real-Time Updates)

**Translation System:**
- `lib/farm-i18n.ts`: Contains TRANSLATIONS dict (all 5 languages), detectLanguage(), makeT() helper
- `hooks/use-translation.ts`: React hook that returns { t, lang, isRTL }
- Every component uses: `const { t } = useTranslation()`

**How It Works:**
1. User changes language via language menu
2. `setLanguage(newLang)` updates state.preferredLanguage
3. All components subscribed to useFarm() receive new state
4. useTranslation() hook memoizes new t() function for the language
5. Components re-render with translated text automatically

**Adding New Text:**
1. Add key-value pairs to each language in TRANSLATIONS[lang]
2. Use `t("key_name")` in components
3. For variables: `t("key", { xp: 50 })` interpolates {xp} in string

### 3. Persistence & Storage

**Automatic Save Flow:**
1. State changes in FarmContext
2. useEffect (line ~140) detects state change via dependency
3. localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
4. On app load, load() function restores from localStorage

**Daily Resets:**
\`\`\`typescript
// In load() function:
if (parsed.lastAdDate !== today()) {
  parsed.adsWatchedToday = 0  // Reset ads
  parsed.lastAdDate = today()
}
if (parsed.lastTaskResetDate !== today()) {
  parsed.completedTasks = []  // Reset tasks
  parsed.lastTaskResetDate = today()
}
\`\`\`

### 4. Component Binding Rules

**✅ DO:**
- Use `useFarm()` to read state
- Call context methods to update state
- Use `useTranslation()` for all text
- Components automatically re-render on state change

**❌ DON'T:**
- Don't store game data in component useState
- Don't hardcode text strings in JSX
- Don't prop-drill language or state
- Don't call setLanguage multiple times rapidly

### 5. Task System Integration

**Complete Task Flow:**
\`\`\`typescript
const { completeTask } = useFarm()

// User clicks task button
completeTask("feed_chickens")

// Context updates:
// - Adds taskId to completedTasks array
// - Adds XP reward to state.xp
// - Adds coin reward to state.coins
// - All saved to localStorage
\`\`\`

**Task Auto-Reset:**
- Tasks reset at midnight automatically in load()
- lastTaskResetDate compared with today's date
- No manual reset needed

### 6. Key Files Reference

| File | Purpose |
|------|---------|
| `/lib/farm-i18n.ts` | Translation strings (all 5 languages) |
| `/hooks/use-translation.ts` | useTranslation() hook |
| `/contexts/farm-context.tsx` | Central state + methods |
| `/components/farm/farm-app.tsx` | Main shell, navigation |
| `/components/farm/daily-tasks.tsx` | Tasks UI (fully i18n-ified) |
| `/components/farm/onboarding-modal.tsx` | Onboarding (uses useTranslation) |
| `/app/globals.css` | Pharaonic styling |

### 7. Testing Persistence & i18n

**Test Language Switching:**
1. Open app in any language
2. Change language via 🌍 menu
3. All text should update instantly
4. Refresh page - language should persist

**Test Task Reset:**
1. Complete a task
2. Note the date in console: `state.lastTaskResetDate`
3. Tomorrow at midnight (local time), tasks auto-reset
4. Can test by manually calling load() with tomorrow's date

**Test Data Persistence:**
1. Open DevTools > Application > localStorage
2. Look for `pharaohs_pi_farm_v1` key
3. Make game changes (feed asset, complete task)
4. Refresh page - all changes should remain
5. JSON should include xp, completedTasks, etc.

### 8. Common Patterns

**Reading from state:**
\`\`\`typescript
const { state } = useFarm()
console.log(state.xp)  // Direct access
\`\`\`

**Updating state:**
\`\`\`typescript
const { completeTask, addCoins } = useFarm()
completeTask("feed_chickens")
addCoins(10)
\`\`\`

**Using translations:**
\`\`\`typescript
const { t } = useTranslation()
<h1>{t("tasks_title")}</h1>
\`\`\`

**Displaying language-dependent UI:**
\`\`\`typescript
const { isRTL } = useTranslation()
<div dir={isRTL ? "rtl" : "ltr"}>
  {t("some_text")}
</div>
\`\`\`

### 9. Debugging

Enable console logs to trace state changes:
\`\`\`typescript
console.log("[v0] State updated:", state)
console.log("[v0] Task completed, XP:", state.xp)
\`\`\`

Check localStorage: Open DevTools, find pharaohs_pi_farm_v1 in Application tab

---

## Summary
- **All state flows through FarmContext**
- **All text uses useTranslation() for real-time updates**
- **All changes auto-save to localStorage**
- **Daily resets happen automatically via load() function**
- **No prop-drilling, no duplicate state**
