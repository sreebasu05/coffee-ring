import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.4'

serve(async (req) => {
  try {
    // 1. Setup Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 2. Setup Web Push
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
    const vapidSubject = 'mailto:hello@coffeering.app' // Must be a URL or mailto

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error('Missing VAPID keys in environment.')
    }

    webpush.setVapidDetails(
      vapidSubject,
      vapidPublicKey,
      vapidPrivateKey
    )

    // 3. Fetch all subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('cr_push_subscriptions')
      .select('*')

    if (subError) throw subError

    // 4. Determine who to notify
    const usersToNotify = new Set()
    const validSubscriptions = []

    for (const sub of subscriptions) {
      try {
        // Calculate the user's current local hour
        const userTime = new Date().toLocaleString("en-US", { 
          timeZone: sub.timezone, 
          hour12: false, 
          hour: "numeric" 
        });
        const currentHour = parseInt(userTime, 10);

        // Check if it's between 6 PM (18) and 10 PM (22) inclusive
        if (currentHour >= 18 && currentHour <= 22) {
          usersToNotify.add(sub.user_id)
          validSubscriptions.push(sub)
        }
      } catch (err) {
        console.warn(`Invalid timezone ${sub.timezone} for user ${sub.user_id}`)
      }
    }

    if (validSubscriptions.length === 0) {
      return new Response(JSON.stringify({ message: 'No users in the 6-10 PM window.' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // 5. Check if they have already checked in all their habits today
    // For simplicity in this reminder, we'll notify anyone who hasn't logged 
    // at least 1 check-in today. (A more robust version would check if ALL active habits are done).
    
    // Get today's date string for each user (roughly, assuming UTC date for DB query is close enough for simple check)
    // To be perfectly accurate, we should check check-ins matching today's date string in their local timezone.
    const todayLocalStrings = {}
    validSubscriptions.forEach(sub => {
      todayLocalStrings[sub.user_id] = new Date().toLocaleDateString('en-CA', { timeZone: sub.timezone }) // YYYY-MM-DD
    })

    const { data: todayCheckIns, error: checkInError } = await supabase
      .from('cr_check_ins')
      .select('user_id, date, completed')
      .in('user_id', Array.from(usersToNotify))
      .eq('completed', true)

    if (checkInError) throw checkInError

    // Map of users who HAVE completed at least something today
    const usersWithCheckInsToday = new Set()
    todayCheckIns.forEach(c => {
      if (c.date === todayLocalStrings[c.user_id]) {
        usersWithCheckInsToday.add(c.user_id)
      }
    })

    // 6. Send notifications
    const sendPromises = validSubscriptions.map(async (sub) => {
      // Skip if they already checked in something today
      if (usersWithCheckInsToday.has(sub.user_id)) {
        return { status: 'skipped', userId: sub.user_id }
      }

      const pushSub = sub.subscription_json
      const payload = JSON.stringify({
        title: 'Coffee Ring Reminder',
        body: 'Time to log your habits for today! Keep that streak going.'
      })

      try {
        await webpush.sendNotification(pushSub, payload)
        return { status: 'success', userId: sub.user_id }
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          // Subscription expired or was unsubscribed. Delete it from DB.
          await supabase.from('cr_push_subscriptions').delete().eq('id', sub.id)
          return { status: 'deleted', userId: sub.user_id }
        }
        console.error(`Failed to send to user ${sub.user_id}`, err)
        return { status: 'error', userId: sub.user_id, error: err.message }
      }
    })

    const results = await Promise.all(sendPromises)

    return new Response(JSON.stringify({ results }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
