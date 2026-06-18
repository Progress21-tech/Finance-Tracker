import { Router } from 'express';
import { supabase } from '../db/supabase.js';
import { requireAuth, requireAuthOnly } from '../middleware/auth.js';

const router = Router();

// POST /me/sync — upserts a users row keyed on auth.uid.
// Also links old bot-created rows (whatsapp_number matches auth phone) rather
// than creating duplicates.
router.post('/sync', requireAuthOnly, async (req, res) => {
  try {
    const { id, email, phone } = req.authUser;

    // 1. Row already linked to this auth.uid → return immediately
    const { data: existing } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();                     // no error when 0 rows

    if (existing) return res.json(existing);

    // 2. Find an orphan row to adopt (old bot-created row identified by phone)
    let orphan = null;
    if (phone) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('whatsapp_number', phone)
        .maybeSingle();
      orphan = data;
    }

    if (orphan) {
      const oldId = orphan.id;

      // Repoint child rows before rekeying the PK
      await supabase.from('transactions').update({ user_id: id }).eq('user_id', oldId);
      await supabase.from('statements').update({ user_id: id }).eq('user_id', oldId);

      // Try to update the PK in-place (works when FK has ON UPDATE CASCADE)
      const { data: linked, error: linkErr } = await supabase
        .from('users')
        .update({ id })
        .eq('id', oldId)
        .select()
        .single();

      if (!linkErr && linked) {
        console.log(`[/me/sync] Linked old row ${oldId} → auth.uid ${id}`);
        return res.json(linked);
      }

      // Fallback: delete old row and reinsert with auth.uid (preserves profile data)
      const { error: delErr } = await supabase.from('users').delete().eq('id', oldId);
      if (!delErr) {
        const { display_name, whatsapp_number, telegram_chat_id,
                daily_threshold, currency, plan, preferences } = orphan;
        const { data: migrated, error: migrateErr } = await supabase
          .from('users')
          .insert({ id, display_name, whatsapp_number, telegram_chat_id,
                    daily_threshold, currency, plan, preferences })
          .select()
          .single();
        if (!migrateErr) {
          console.log(`[/me/sync] Migrated old row ${oldId} → auth.uid ${id}`);
          return res.json(migrated);
        }
        console.error('[/me/sync] migrate insert failed:', migrateErr.message);
      }
    }

    // 3. Create a fresh user row
    const { data: created, error } = await supabase
      .from('users')
      .insert({
        id,
        display_name: email?.split('@')[0] ?? null,
        daily_threshold: 10000,
        currency: 'NGN',
        plan: 'beta',
        preferences: {},
      })
      .select()
      .single();

    if (error) {
      console.error('[POST /me/sync] insert error:', error);
      return res.status(500).json({ error: error.message });
    }
    res.status(201).json(created);
  } catch (err) {
    console.error('[POST /me/sync]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /me — return the authenticated user's profile
router.get('/', requireAuth, (req, res) => {
  res.json(req.user);
});

// PATCH /me/profile — save onboarding answers and profile fields
router.patch('/profile', requireAuth, async (req, res) => {
  try {
    const {
      display_name,
      currency,
      daily_threshold,
      whatsapp_number,
      telegram_chat_id,
      // Preferences (stored as JSON)
      monthly_income_range,
      top_categories,
      primary_goal,
      onboarding_complete,
    } = req.body;

    const directFields = {};
    if (display_name    !== undefined) directFields.display_name    = display_name;
    if (currency        !== undefined) directFields.currency        = currency;
    if (daily_threshold !== undefined) directFields.daily_threshold = Number(daily_threshold);
    if (whatsapp_number !== undefined) directFields.whatsapp_number = whatsapp_number;
    if (telegram_chat_id!== undefined) directFields.telegram_chat_id= String(telegram_chat_id);

    // Merge into the existing preferences JSON
    const prefUpdates = {};
    if (monthly_income_range !== undefined) prefUpdates.monthly_income_range = monthly_income_range;
    if (top_categories       !== undefined) prefUpdates.top_categories       = top_categories;
    if (primary_goal         !== undefined) prefUpdates.primary_goal         = primary_goal;
    if (onboarding_complete  !== undefined) prefUpdates.onboarding_complete  = onboarding_complete;

    if (Object.keys(prefUpdates).length) {
      directFields.preferences = { ...(req.user.preferences ?? {}), ...prefUpdates };
    }

    if (Object.keys(directFields).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided' });
    }

    const { data, error } = await supabase
      .from('users')
      .update(directFields)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    console.error('[PATCH /me/profile]', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
