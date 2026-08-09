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

    // 5. Fetch habits and check-ins for users to notify
    const todayLocalStrings = {}
    validSubscriptions.forEach(sub => {
      todayLocalStrings[sub.user_id] = new Date().toLocaleDateString('en-CA', { timeZone: sub.timezone }) // YYYY-MM-DD
    })

    // Fetch all habits for target users
    const { data: habits, error: habitsError } = await supabase
      .from('cr_habits')
      .select('id, user_id, days')
      .in('user_id', Array.from(usersToNotify))

    if (habitsError) throw habitsError

    // Fetch completed check-ins for target users on their specific local dates
    const todayDates = Array.from(new Set(Object.values(todayLocalStrings)))
    const { data: todayCheckIns, error: checkInError } = await supabase
      .from('cr_check_ins')
      .select('user_id, habit_id, date, completed')
      .in('user_id', Array.from(usersToNotify))
      .in('date', todayDates)
      .eq('completed', true)

    if (checkInError) throw checkInError

    // Determine remaining habits per user
    const remainingCountByUser = {}
    const completedCountByUser = {}
    
    for (const userId of Array.from(usersToNotify)) {
      const userSub = validSubscriptions.find(s => s.user_id === userId)
      const userTimezone = userSub ? userSub.timezone : 'UTC'
      const userLocalDate = new Date(new Date().toLocaleString("en-US", { timeZone: userTimezone }))
      const userDayOfWeek = userLocalDate.getDay() // 0 = Sunday, 1 = Monday, etc.
      const userLocalDateStr = todayLocalStrings[userId]

      // Get habits for this user active today
      const userHabits = (habits || []).filter(h => {
        if (h.user_id !== userId) return false
        if (!h.days || h.days.length === 0) return true // Default to active daily if no specific days
        return h.days.includes(userDayOfWeek)
      })

      // Get completed check-ins specifically for today's local date
      const completedToday = (todayCheckIns || []).filter(c => c.user_id === userId && c.date === userLocalDateStr)
      const completedHabitIds = new Set(completedToday.map(c => c.habit_id))

      // Filter active habits not completed
      const incompleteActive = userHabits.filter(h => !completedHabitIds.has(h.id))
      remainingCountByUser[userId] = incompleteActive.length
      completedCountByUser[userId] = completedToday.length
    }

    // 6. Send notifications
    const sendPromises = validSubscriptions.map(async (sub) => {
      const remaining = remainingCountByUser[sub.user_id] || 0
      const completedCount = completedCountByUser[sub.user_id] || 0
      
      // Skip if they have no incomplete active habits for today
      if (remaining <= 0) {
        return { status: 'skipped', userId: sub.user_id }
      }

      // Fun wording generators
      const zeroHabitsTemplates = [
        `Haven't started today yet? You have ${remaining} habits waiting for you!`,
        `Time to build that routine. ${remaining} habits are waiting for your check-in.`,
        `No habits logged yet today! Let's get started on your ${remaining} goals.`,
        `Start your check-ins! ${remaining} habits are ready to go.`
      ]

      const singleHabitTemplates = [
        "Only 1 habit left to complete your day! You got this.",
        "Almost there! 1 last habit to close your rings tonight.",
        "Finish strong! Just 1 habit remains.",
        "One final tick stands between you and a perfect day!"
      ]

      const multiHabitsTemplates = [
        `Don't break the chain! You have ${remaining} habits left to complete.`,
        `Future you is watching. Finish your ${remaining} remaining habits!`,
        `Ring check! Fill up your remaining ${remaining} habits.`,
        `Keep the streak alive! ${remaining} habits left to log today.`
      ]

      const randomTemplate = (templates: string[]) => {
        return templates[Math.floor(Math.random() * templates.length)]
      }

      // Check if they completed nothing today, exactly 1 remaining, or multiple remaining
      const bodyText = completedCount === 0
        ? randomTemplate(zeroHabitsTemplates)
        : (remaining === 1 
          ? randomTemplate(singleHabitTemplates)
          : randomTemplate(multiHabitsTemplates))

      const pushSub = sub.subscription_json
      const payload = JSON.stringify({
        title: 'Daily Check-in',
        body: bodyText
      })

      try {
        await webpush.sendNotification(pushSub, payload)
        return { status: 'success', userId: sub.user_id }
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
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
