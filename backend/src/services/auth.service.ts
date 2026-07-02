// backend/src/services/auth.service.ts
import { supabase, supabaseAdmin } from '../config/supabase.js';
import prisma from '../config/database.js';
import { User } from '@prisma/client';

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
        emailRedirectTo: 'http://localhost:3000/auth/callback',
      },
    });

    if (error) {
      throw new Error(error.message);
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

  // Forgot password – send reset email
  async forgotPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:3000/auth/reset-password',
    });
    if (error) throw new Error(error.message);
    return { message: 'Password reset email sent.' };
  }

  // Reset password using recovery token and new password
  async resetPassword(token: string, newPassword: string) {
    // Exchange token for a session (verifies the token)
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'recovery',
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Invalid or expired recovery token');
    }

    // Update the user's password using the admin client
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      data.user.id,
      { password: newPassword }
    );

    if (updateError) {
      throw new Error(updateError.message);
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