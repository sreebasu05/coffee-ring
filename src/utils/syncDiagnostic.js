/**
 * Supabase Sync Diagnostic Script
 * 
 * Add this temporarily to the app to log exactly what's happening
 * with cloud sync. Attach to window so it can be called from console.
 */
import { supabase, isSupabaseConfigured } from '../db/supabaseClient.js';

export async function diagnoseSyncIssues() {
  const results = [];
  const log = (label, status, detail) => {
    results.push({ label, status, detail });
    console.log(`[SYNC DIAG] ${status} ${label}:`, detail);
  };

  // 1. Check Supabase configured
  log('Supabase configured', isSupabaseConfigured ? 'OK' : 'FAIL', { isSupabaseConfigured });

  if (!isSupabaseConfigured || !supabase) {
    log('Supabase client', 'FAIL', 'supabase is null or not configured');
    return results;
  }

  // 2. Check auth session
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      log('Auth getSession', 'FAIL', error);
    } else if (!session) {
      log('Auth getSession', 'FAIL', 'No active session - user not logged in');
    } else {
      log('Auth getSession', 'OK', { userId: session.user.id, email: session.user.email });
    }
  } catch (e) {
    log('Auth getSession', 'FAIL', e.message);
  }

  // 3. Check getUser (network call)
  let userId = null;
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      log('Auth getUser', 'FAIL', error);
    } else if (!user) {
      log('Auth getUser', 'FAIL', 'getUser returned null');
    } else {
      userId = user.id;
      log('Auth getUser', 'OK', { userId: user.id, email: user.email });
    }
  } catch (e) {
    log('Auth getUser', 'FAIL', e.message);
  }

  if (!userId) {
    log('Remaining tests', 'SKIP', 'No authenticated user');
    return results;
  }

  // 4. Test eva_users read
  try {
    const { data, error } = await supabase
      .from('eva_users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      log('eva_users SELECT', 'FAIL', error);
    } else {
      log('eva_users SELECT', data ? 'OK' : 'EMPTY', data);
    }
  } catch (e) {
    log('eva_users SELECT', 'FAIL', e.message);
  }

  // 5. Test cr_habits read
  try {
    const { data, error } = await supabase
      .from('cr_habits')
      .select('*')
      .eq('user_id', userId);
    if (error) {
      log('cr_habits SELECT', 'FAIL', error);
    } else {
      log('cr_habits SELECT', 'OK', { count: (data || []).length, habits: (data || []).map(h => h.name) });
    }
  } catch (e) {
    log('cr_habits SELECT', 'FAIL', e.message);
  }

  // 6. Test cr_check_ins read
  try {
    const { data, error } = await supabase
      .from('cr_check_ins')
      .select('*')
      .eq('user_id', userId)
      .limit(5);
    if (error) {
      log('cr_check_ins SELECT', 'FAIL', error);
    } else {
      log('cr_check_ins SELECT', 'OK', { count: (data || []).length, columns: data && data[0] ? Object.keys(data[0]) : [] });
    }
  } catch (e) {
    log('cr_check_ins SELECT', 'FAIL', e.message);
  }

  // 7. Test cr_habits WRITE (insert + delete test row)
  const testHabitId = `__sync_test_${Date.now()}`;
  try {
    const { error: insertErr } = await supabase.from('cr_habits').upsert({
      id: testHabitId,
      user_id: userId,
      name: '__sync_test__',
      type: 'boolean',
      category: 'health',
      weekly_target: 1,
      weekly_target_history: [],
      unit: 'times',
      icon: 'heart',
      tags: []
    });
    if (insertErr) {
      log('cr_habits WRITE', 'FAIL', insertErr);
    } else {
      log('cr_habits WRITE', 'OK', 'Test habit inserted');
      // Clean up
      await supabase.from('cr_habits').delete().eq('id', testHabitId);
      log('cr_habits DELETE', 'OK', 'Test habit cleaned up');
    }
  } catch (e) {
    log('cr_habits WRITE', 'FAIL', e.message);
  }

  // 8. Test cr_check_ins WRITE with completed column
  try {
    const { error: ciErr } = await supabase.from('cr_check_ins').upsert({
      user_id: userId,
      habit_id: testHabitId,
      date: '1999-01-01',
      value: null,
      notes: '',
      tags: [],
      completed: true
    }, { onConflict: 'user_id,habit_id,date' });
    if (ciErr) {
      log('cr_check_ins WRITE (with completed)', 'FAIL', ciErr);
      
      // Try without completed column
      const { error: ciErr2 } = await supabase.from('cr_check_ins').upsert({
        user_id: userId,
        habit_id: testHabitId,
        date: '1999-01-01',
        value: null,
        notes: '',
        tags: []
      }, { onConflict: 'user_id,habit_id,date' });
      if (ciErr2) {
        log('cr_check_ins WRITE (without completed)', 'FAIL', ciErr2);
      } else {
        log('cr_check_ins WRITE (without completed)', 'OK', 'completed column does NOT exist in DB');
      }
    } else {
      log('cr_check_ins WRITE (with completed)', 'OK', 'completed column exists in DB');
    }
    // Clean up
    await supabase.from('cr_check_ins').delete().eq('user_id', userId).eq('date', '1999-01-01');
  } catch (e) {
    log('cr_check_ins WRITE', 'FAIL', e.message);
  }

  // 9. Check localStorage state
  const KEYS = {
    USER_PROFILE: 'coffeering_user_profile',
    HABITS: 'coffeering_habits',
    CHECK_INS: 'coffeering_check_ins'
  };
  try {
    const profile = JSON.parse(localStorage.getItem(KEYS.USER_PROFILE));
    const habits = JSON.parse(localStorage.getItem(KEYS.HABITS)) || [];
    const checkIns = JSON.parse(localStorage.getItem(KEYS.CHECK_INS)) || [];
    log('localStorage state', 'OK', {
      profileName: profile?.name,
      habitCount: habits.length,
      checkInCount: checkIns.length
    });
  } catch (e) {
    log('localStorage state', 'FAIL', e.message);
  }

  console.log('\n=== SYNC DIAGNOSTIC SUMMARY ===');
  results.forEach(r => {
    const icon = r.status === 'OK' ? '[PASS]' : r.status === 'FAIL' ? '[FAIL]' : `[${r.status}]`;
    console.log(`${icon} ${r.label}`);
  });

  return results;
}

// Make available from browser console
if (typeof window !== 'undefined') {
  window.diagnoseSyncIssues = diagnoseSyncIssues;
}
