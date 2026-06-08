/**
 * Diagnostic script to debug chat persistence issues
 * Usage: Open DevTools Console and import this, then run the tests
 */

import { supabase } from './supabaseClient';

export async function debugChatPersistence() {
  console.log('=== Chat Persistence Diagnostic Started ===\n');

  // 1. Check Session
  console.log('1️⃣ Checking user session...');
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.error('❌ Session error:', sessionError);
    return;
  }
  const session = sessionData.session;
  if (!session) {
    console.error('❌ No active session. Please log in first.');
    return;
  }
  const userId = session.user.id;
  const userEmail = session.user.email;
  console.log(`✅ Session valid\n   User: ${userEmail}\n   ID: ${userId}\n`);

  // 2. Check if conversations table exists
  console.log('2️⃣ Checking conversations table...');
  const { data: tableData, error: tableError } = await supabase
    .from('conversations')
    .select('*', { count: 'exact' })
    .limit(1);

  if (tableError) {
    console.error('❌ Table access error:', tableError);
    console.error('Details:', tableError.details, tableError.hint);
    return;
  }
  console.log(`✅ Table accessible\n`);

  // 3. Check user's conversations
  console.log('3️⃣ Fetching your conversations...');
  const { data: userChats, error: chatsError } = await supabase
    .from('conversations')
    .select('id, title, created_at, messages')
    .eq('user_id', userId);

  if (chatsError) {
    console.error('❌ Error fetching conversations:', chatsError);
    return;
  }
  console.log(`✅ Found ${userChats?.length || 0} conversations\n`);
  if (userChats?.length) {
    userChats.forEach((chat, idx) => {
      console.log(`   [${idx}] ${chat.title} (${chat.messages?.length || 0} messages)`);
    });
  }

  // 4. Test INSERT
  console.log('\n4️⃣ Testing INSERT permission...');
  const testInsertId = crypto.randomUUID();
  const { error: insertError, data: insertData } = await supabase
    .from('conversations')
    .insert({
      id: testInsertId,
      user_id: userId,
      title: 'Diagnostic Test Chat',
      messages: [
        {
          id: 'test-msg-1',
          sender: 'bot',
          text: 'This is a test message',
          timestamp: new Date().toISOString(),
        },
      ],
      created_at: new Date().toISOString(),
    });

  if (insertError) {
    console.error('❌ INSERT failed:', insertError);
    console.error('Code:', insertError.code);
    console.error('Details:', insertError.details);
    console.error('Hint:', insertError.hint);
  } else {
    console.log('✅ INSERT successful');
    console.log('   Inserted ID:', testInsertId);
  }

  // 5. Test UPDATE/UPSERT
  console.log('\n5️⃣ Testing UPSERT permission...');
  const { error: upsertError } = await supabase
    .from('conversations')
    .upsert(
      {
        id: testInsertId,
        user_id: userId,
        title: 'Diagnostic Test Chat - Updated',
        messages: [
          {
            id: 'test-msg-1',
            sender: 'bot',
            text: 'Original message',
            timestamp: new Date().toISOString(),
          },
          {
            id: 'test-msg-2',
            sender: 'user',
            text: 'User test message',
            timestamp: new Date().toISOString(),
          },
        ],
        created_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

  if (upsertError) {
    console.error('❌ UPSERT failed:', upsertError);
    console.error('Code:', upsertError.code);
    console.error('Details:', upsertError.details);
  } else {
    console.log('✅ UPSERT successful');
  }

  // 6. Verify the upsert result
  console.log('\n6️⃣ Verifying saved data...');
  const { data: verifyData, error: verifyError } = await supabase
    .from('conversations')
    .select('id, title, messages')
    .eq('id', testInsertId)
    .single();

  if (verifyError) {
    console.error('❌ Verification failed:', verifyError);
  } else {
    console.log('✅ Data verified:');
    console.log('   Title:', verifyData?.title);
    console.log('   Message count:', verifyData?.messages?.length);
  }

  // 7. Cleanup test data
  console.log('\n7️⃣ Cleaning up test data...');
  const { error: deleteError } = await supabase
    .from('conversations')
    .delete()
    .eq('id', testInsertId);

  if (deleteError) {
    console.warn('⚠️ Could not delete test data:', deleteError);
  } else {
    console.log('✅ Test data cleaned up');
  }

  console.log('\n=== Diagnostic Complete ===');
  console.log('\n📋 Summary:');
  console.log('If all checks passed ✅, then:');
  console.log('  - Your database and permissions are working');
  console.log('  - Check browser console for Context API logs');
  console.log('  - Messages should appear under "Conversation saved successfully"');
  console.log('\nIf any check failed ❌, then:');
  console.log('  - Check Supabase RLS policies for the conversations table');
  console.log('  - Ensure all required columns exist');
  console.log('  - Verify auth user_id matches');
}

// Export for easy access
console.log(
  '💡 Run: debugChatPersistence() in console to diagnose chat persistence issues'
);
