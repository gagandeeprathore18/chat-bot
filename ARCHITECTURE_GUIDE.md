# 🏗️ Chat Persistence - Architecture & Debugging Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     NEXT.JS APPLICATION                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           src/app/layout.tsx (ROOT)                   │   │
│  │    Wraps with: AuthProvider + ChatProvider            │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                   │
│                           ↓                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │      src/contexts/AuthContext.tsx                     │   │
│  │  • Manages user session (user, session, loading)     │   │
│  │  • Provides: useAuth() hook                           │   │
│  │  • Listens to onAuthStateChange                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                   │
│                           ↓                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │      src/contexts/ChatContext.tsx                     │   │
│  │  • Manages conversations & messages                   │   │
│  │  • Provides: useChat() hook                           │   │
│  │  • Calls saveConversation() on every state change    │   │
│  │  • Communicates with Supabase                         │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                   │
│                           ↓                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │      src/components/ChatInterface.tsx                 │   │
│  │  • Uses useChat() hook to get state                   │   │
│  │  • Renders conversations list & messages              │   │
│  │  • Handles user input & send                          │   │
│  │  • No direct Supabase calls (all via context)        │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                   │
└───────────────────────────┼───────────────────────────────────┘
                            │
                    ┌───────▼────────┐
                    │   SUPABASE     │
                    │   PostgreSQL   │
                    │   Database     │
                    └────────────────┘
```

---

## Data Flow: Sending a Message

```
1. USER TYPES & CLICKS SEND
   ↓
2. ChatInterface calls sendMessage(text)
   ↓
3. ChatContext.sendMessage():
   a) Generate message object with ID, sender='user', text, timestamp
   b) Update local state: setConversations([...userMsg])
   c) UI updates immediately ✅ (user sees message appear)
   ↓
4. SAVE USER MESSAGE TO DATABASE:
   saveConversation({messages: [userMsg]})
   ↓
   ┌─ Supabase Upsert ──┐
   │ IF RLS blocked:    │  ❌ Error logged (code 42501, permission denied)
   │   → Silent fail    │     No message saved to DB
   │ IF RLS allows:     │  ✅ Success logged
   │   → Save to DB     │     Message persisted
   └────────────────────┘
   ↓
5. CALL API FOR BOT RESPONSE:
   fetch('/api/chat', {text})
   ↓
6. BOT RESPONDS:
   data.text = "Hello! How can I help?"
   ↓
7. UPDATE STATE WITH BOT MESSAGE:
   setConversations([...botMsg])
   ↓
8. SAVE BOT MESSAGE TO DATABASE:
   saveConversation({messages: [userMsg, botMsg]})
   ↓
   ┌─ Supabase Upsert ──┐
   │ IF RLS blocked:    │  ❌ Error logged
   │   → Silent fail    │     Bot response not saved
   │ IF RLS allows:     │  ✅ Success logged
   │   → Save to DB     │     Both messages persisted
   └────────────────────┘
   ↓
9. DONE!
   Both messages in state + saved to DB
```

---

## On Page Refresh: Loading Chat History

```
1. PAGE RELOADS
   ↓
2. ChatContext useEffect triggered
   ↓
3. Check if user exists (from AuthContext)
   ↓
   ┌─ If NO user ──┐
   │ Loading = false
   │ Return (wait for login)
   └────────────────┘
   ↓
   ┌─ If user exists ──────────────────┐
   │ setLoading(true)                   │
   │ Query: SELECT * FROM conversations │
   │        WHERE user_id = current_user│
   │        ORDER BY created_at DESC    │
   ↓ ↓
   │ Supabase Response:
   │ ┌─────────────────────────────┐
   │ │ RLS BLOCKS SELECT? (NO)    │  ← 42501 permission denied
   │ │ Then: Error logged, return  │
   │ │                             │
   │ │ RLS ALLOWS SELECT? (YES)   │  ← Allowed, get conversations
   │ │ Then: Map data to state     │
   │ │ conversations = [chat1, ...] │
   │ │ setActiveChatId = first chat │
   │ └─────────────────────────────┘
   │ setLoading(false)
   └────────────────────────────────┘
   ↓
4. ChatInterface renders with loaded conversations
   ↓
5. User sees their chat history ✅
```

---

## Where Chat Persistence Fails

### ❌ Scenario 1: RLS Policy Blocking

```
Supabase Table: conversations
RLS Status: ENABLED
Policies: [NONE - empty]

What happens:
• User sends message
• ChatContext tries: INSERT into conversations
• Supabase checks RLS policy
• No policy found → BLOCK operation (silently)
• Error NOT shown to user, but logged in console as: code 42501
• Message appears in UI (state updated)
• Message NOT in DB
• On refresh → Chat history gone ❌
```

**Fix:** Add 4 RLS policies (see QUICK_FIX_CHECKLIST.md)

### ❌ Scenario 2: Table Doesn't Exist

```
Supabase Database
Conversations table: [NOT CREATED]

What happens:
• User sends message
• ChatContext tries: INSERT into conversations
• Supabase returns: code PGRST301 "relation conversations does not exist"
• Message appears in UI (state updated)
• Message NOT in DB (can't insert to missing table)
• On refresh → Chat history gone ❌
```

**Fix:** Create table with correct schema (id, user_id, title, messages, created_at)

### ❌ Scenario 3: Auth Not Initialized

```
AuthContext
User state: null (still loading)

What happens:
• User types message while auth loading
• ChatContext checks: if (!user) return;
• Returns early without saving
• Message appears in UI
• Never attempts to save to DB
• On refresh → Chat history gone ❌
```

**Fix:** Wait for loading = false before showing chat UI

### ✅ Working Scenario: Everything Set Up

```
Supabase:
✓ conversations table exists
✓ RLS enabled with 4 policies
✓ user_id column references auth.users

Auth:
✓ User logged in, session valid, user.id available

App:
✓ AuthProvider initialized first
✓ ChatProvider gets user from AuthContext
✓ saveConversation checks for user before saving

Result:
• Send message → logged in, RLS allows → DB saves ✅
• Refresh → user still exists, RLS allows → loads history ✅
• Chat history persists! 🎉
```

---

## Console Logs: What to Look For

### ✅ Good Console Output
```
// On initial load:
(No errors or "Error loading conversations" if first time)

// When user sends message:
"Conversation saved successfully: { 
  id: 'uuid-1', 
  messageCount: 1 
}"

// After bot responds:
"Conversation saved successfully: { 
  id: 'uuid-1', 
  messageCount: 2 
}"

// On refresh:
(Conversations load without errors)
```

### ❌ Bad Console Output (With Fixes)
```
// ❌ Before fix: "Error saving conversation: xyz"
// ✅ After fix: "Error saving conversation: { 
//                 code: '42501',
//                 message: 'permission denied',
//                 details: null,
//                 hint: null
//               }"
// Now you know it's RLS!

// ❌ Before fix: "Cannot read property 'messages' of undefined"
// ✅ After fix: Uses [...(chat.messages || [])] - won't crash
```

---

## Verification Checklist

After applying fixes:

- [ ] RLS policies added to `conversations` table
- [ ] Browser console shows "Conversation saved successfully" after sending message
- [ ] Browser refresh loads the message again
- [ ] Multiple chats can be created
- [ ] Chat titles update correctly
- [ ] Bot responses appear and save
- [ ] Error logs show proper error codes (not cryptic)

---

## Quick Diagnosis

**Run in browser console after sending a message:**

```javascript
// 1. Check if chat is in state
const { conversations } = useChat();
console.log('Local state:', conversations);

// 2. Check what's in database
const { data } = await supabase
  .from('conversations')
  .select('*');
console.log('Database:', data);

// 3. Compare
// If in state but not in DB → RLS blocked the save
// If in both → ✅ Persistence working
```

---

## Architecture Decision: Context API

**Why Context API instead of other options:**

```
❌ Prop Drilling        ❌ localStorage      ✅ Context API
├─ Props through      ├─ Data in browser    ├─ Global state
│  every component     │  Exposed to user    │  Type-safe
├─ Hard to maintain    ├─ No auth sync      ├─ Syncs with DB
├─ Props conflict      ├─ Data loss on      ├─ Real-time
└─ Not scalable       │  clear cache        │  updates
                      └─ No security        └─ Scalable
```

**How Context API works here:**

```
AuthProvider
  └─ Session state
     └─ Available to: All children via useAuth()

    ChatProvider  
      └─ Conversations state
         └─ Available to: All children via useChat()
            └─ Can call: sendMessage(), createNewChat()
               └─ Automatically saves to Supabase
                  └─ Other components instantly see updates
```

This is why when you send a message, it appears immediately in the UI even before Supabase responds!
