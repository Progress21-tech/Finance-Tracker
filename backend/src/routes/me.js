import { Router } from 'express';
import { supabase } from '../db/supabase.js';
import { requireAuth, requireAuthOnly } from '../middleware/auth.js';

const router = Router();

// POST /me/sync — called on first login; upserts a users row keyed on auth.uid
router.post('/sync', requireAuthOnly, async (req, res) => {
  try {
    const { id, email } = req.authUser;

    const { data: existing } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (existing) return res.json(existing);

    const { data: created, error } = await supabase
      .from('users')
      .insert({
        id,
        whatsapp_number: null,
        display_name: email?.split('@')[0] ?? null,
        daily_threshold: 10000,
        currency: 'NGN',
        plan: 'beta',
        preferences: {},
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
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
