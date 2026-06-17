import { supabase } from '../db/supabase.js';

/**
 * requireAuth — verifies the Supabase JWT, resolves the backend user row,
 * and attaches req.user. Returns 401 if the token is missing, invalid, or
 * the user row doesn't exist yet (frontend should call POST /me/sync first).
 */
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  const token = header.slice(7);

  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authUser) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (userError || !user) {
    return res.status(401).json({ error: 'User profile not found. POST /me/sync first.' });
  }

  req.user = user;
  req.authUser = authUser;
  next();
}

/**
 * requireAuthOnly — verifies the JWT but does NOT require a backend user row.
 * Use only on POST /me/sync where the row is being created.
 */
export async function requireAuthOnly(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  const token = header.slice(7);

  const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
  if (error || !authUser) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.authUser = authUser;
  next();
}
