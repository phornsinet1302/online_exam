// backend/src/services/auth.service.ts
import { supabase, supabaseAdmin } from '../config/supabase.js';
import prisma from '../config/database.js';
import { User } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

// Defaults mirror the toggles shown in the Settings > Notifications tab.
// Stored per-user as a JSON blob rather than individual columns since it's
// purely a set of on/off preferences read back as-is by the frontend.
export const DEFAULT_NOTIFICATION_PREFS = {
  examAlerts: true,
  flagAlerts: true,
  gradeReady: true,
  weeklyReport: false,
  systemUpdates: true,
  studentJoins: false,
};

// Defaults mirror the toggles shown in the Settings > Privacy tab.
export const DEFAULT_PRIVACY_PREFS = {
  shareUsageData: true,
  showInDirectory: false,
  allowResearch: false,
};

// Where confirmation / recovery links send the user back to. Not hard-coded:
// a fixed localhost address breaks as soon as the app is opened from another
// address (or deployed), and Supabase then drops the user on the home page.
const frontendBase = () => (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');

export class AuthService {
  // Register a new teacher
  async register(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: 'teacher', // explicitly set role in metadata
        },
        // The confirmation link lands on this page, which signs the user in
        // and opens the dashboard — no separate login after confirming.
        emailRedirectTo: `${frontendBase()}/auth/callback`,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    // For an email that already has an account Supabase doesn't error (that
    // would reveal which emails are registered): it returns a user with no
    // identities and sends nothing. Without this check the form would say
    // "check your email" and the person would wait for a message that never comes.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      throw new Error('An account with this email already exists. Please sign in instead.');
    }

    return {
      message: 'Registration successful. Please check your email to verify your account.',
    };
  }

  // Sync user from Supabase to Neon DB
  async syncUser(supabaseUser: any): Promise<User> {
    const existing = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });

    if (existing) {
      return existing;
    }

    return prisma.user.create({
      data: {
        supabaseId: supabaseUser.id,
        email: supabaseUser.email!,
        name: supabaseUser.user_metadata?.name ?? supabaseUser.email!,
        avatarUrl: supabaseUser.user_metadata?.avatar_url,
        role: 'teacher', // always teacher
      },
    });
  }

  // Login with email/password
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user || !data.session) {
      throw new Error('Authentication failed');
    }

    // Sync user to Neon DB (create if not exists)
    const dbUser = await this.syncUser(data.user);

    return {
      message: 'Login successful.',
      user: {
        id: dbUser.supabaseId,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        avatarUrl: dbUser.avatarUrl,
      },
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    };
  }

  // Get current user from Neon DB by Supabase user ID
  async getCurrentUser(supabaseUserId: string) {
    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUserId },
    });
    if (!user) throw new Error('User not found in database');
    return user;
  }

  // Update editable profile fields (name + the extra profile details).
  // Email is intentionally excluded — it's the Supabase login identity, and
  // changing it here would desync it from what the user actually signs in
  // with, without going through Supabase's own verified email-change flow.
  async updateProfile(
    supabaseUserId: string,
    data: { name?: string; phone?: string; institution?: string; department?: string; bio?: string }
  ): Promise<User> {
    const updateData: Record<string, string> = {};
    if (data.name !== undefined && data.name.trim()) updateData.name = data.name.trim();
    if (data.phone !== undefined) updateData.phone = data.phone.trim();
    if (data.institution !== undefined) updateData.institution = data.institution.trim();
    if (data.department !== undefined) updateData.department = data.department.trim();
    if (data.bio !== undefined) updateData.bio = data.bio.trim();

    return prisma.user.update({
      where: { supabaseId: supabaseUserId },
      data: updateData,
    });
  }

  // Update notification preference toggles. Merges onto whatever is already
  // stored (or the defaults, for a user who's never saved prefs before) so a
  // partial update from the frontend doesn't wipe out the other toggles.
  async updateNotificationPrefs(
    supabaseUserId: string,
    prefs: Record<string, boolean>
  ): Promise<User> {
    const existing = await prisma.user.findUnique({ where: { supabaseId: supabaseUserId } });
    if (!existing) throw new Error('User not found in database');

    const current = (existing.notificationPrefs as Record<string, boolean> | null) ?? DEFAULT_NOTIFICATION_PREFS;
    const merged = { ...current, ...prefs };

    return prisma.user.update({
      where: { supabaseId: supabaseUserId },
      data: { notificationPrefs: merged },
    });
  }

  // Update privacy preference toggles. Same merge-onto-defaults approach as
  // updateNotificationPrefs, so a partial update doesn't wipe other toggles.
  async updatePrivacyPrefs(
    supabaseUserId: string,
    prefs: Record<string, boolean>
  ): Promise<User> {
    const existing = await prisma.user.findUnique({ where: { supabaseId: supabaseUserId } });
    if (!existing) throw new Error('User not found in database');

    const current = (existing.privacyPrefs as Record<string, boolean> | null) ?? DEFAULT_PRIVACY_PREFS;
    const merged = { ...current, ...prefs };

    return prisma.user.update({
      where: { supabaseId: supabaseUserId },
      data: { privacyPrefs: merged },
    });
  }

  // Upload/replace the current user's profile photo
  async updateAvatar(supabaseUserId: string, file: Express.Multer.File): Promise<User> {
    const fileExt = file.mimetype === 'image/png' ? 'png'
      : file.mimetype === 'image/webp' ? 'webp'
      : 'jpg';
    const storagePath = `${supabaseUserId}/${uuidv4()}.${fileExt}`;

    let avatarUrl: string;

    // Use the admin client here: this is a trusted server-side write behind
    // our own authMiddleware check, and storage.objects RLS policies (which
    // the anon client is subject to) would otherwise reject the insert even
    // though the bucket itself exists.
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      // Fallback: store the base64 data URI in the DB if storage is unavailable
      console.warn('Supabase Storage upload failed, falling back to base64:', uploadError.message);
      avatarUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    } else {
      const { data: urlData } = supabaseAdmin.storage
        .from('avatars')
        .getPublicUrl(uploadData.path);
      avatarUrl = urlData.publicUrl;
    }

    return prisma.user.update({
      where: { supabaseId: supabaseUserId },
      data: { avatarUrl },
    });
  }

  // Change password for a logged-in user — re-verifies the current password
  // via signInWithPassword before applying the new one with the admin client.
  async changePassword(email: string, currentPassword: string, newPassword: string) {
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (signInError || !data.user) {
      throw new Error('Current password is incorrect.');
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      data.user.id,
      { password: newPassword }
    );

    if (updateError) {
      throw new Error(updateError.message);
    }

    return { message: 'Password updated successfully.' };
  }

  // Forgot password – send reset email
  async forgotPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${frontendBase()}/auth/reset-password`,
    });
    if (error) throw new Error(error.message);
    return { message: 'Password reset email sent.' };
  }

  // Reset password from an emailed recovery link.
  //
  // Supabase's standard recovery email drops the user on the reset page with a
  // short-lived session in the URL, which the page sends here as `accessToken`.
  // (`token` is the alternative token-hash email format.) Either way, the caller
  // has to prove control of the mailbox — a normal logged-in session is refused,
  // otherwise a stolen login token could change the password without knowing it.
  async resetPassword(input: { accessToken?: string; token?: string; newPassword: string }) {
    const { accessToken, token, newPassword } = input;

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters.');
    }
    if (newPassword.length > 72) {
      throw new Error('Password must be 72 characters or fewer.');
    }

    let userId: string | undefined;
    let userEmail: string | undefined;

    if (accessToken) {
      const { data, error } = await supabase.auth.getUser(accessToken);
      if (error || !data.user) {
        throw new Error('This reset link has expired or was already used. Please request a new one.');
      }
      userId = data.user.id;
      userEmail = data.user.email;

      // The token is verified by getUser above, so its claims can be trusted.
      // A session from an emailed link is marked "otp"; a password or Google
      // login is not, and it must be recent (links last about an hour).
      let claims: any = {};
      try { claims = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64url').toString()); } catch { /* handled below */ }
      const latest = Array.isArray(claims.amr) ? claims.amr[0] : undefined;
      const fresh = latest && typeof latest.timestamp === 'number' && Date.now() / 1000 - latest.timestamp < 3600;
      if (!latest || latest.method !== 'otp' || !fresh) {
        throw new Error('Please use the link from your password reset email.');
      }
    } else if (token) {
      // Exchange token for a session (verifies the token)
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'recovery',
      });
      if (error) {
        throw new Error(error.message);
      }
      userId = data.user?.id;
      userEmail = data.user?.email;
    }

    if (!userId) {
      throw new Error('Invalid or expired recovery token');
    }

    // Update the user's password using the admin client
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      throw new Error(updateError.message);
    }

    // Changing a password makes Supabase end every existing session for the
    // account — including the recovery one the reset page was holding — which is
    // what we want after a reset (anyone else who had the old password is out).
    // So sign the user in with the new password and hand back a fresh session:
    // the page can then open the dashboard without asking them to log in again.
    if (userEmail) {
      try {
        const session = await this.login(userEmail, newPassword);
        return { ...session, message: 'Password has been reset successfully.' };
      } catch {
        // Reset itself succeeded; the page falls back to a normal sign-in.
      }
    }

    return { message: 'Password has been reset successfully.' };
  }

  // Refresh access token using refresh token
  async refreshToken(refreshToken: string) {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.session) {
      throw new Error('Failed to refresh session');
    }

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    };
  }

  // Logout – no server action needed, but kept for consistency
  async logout() {
    return { message: 'Logged out successfully.' };
  }
}