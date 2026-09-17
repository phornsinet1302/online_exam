// backend/src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { AuthService, DEFAULT_NOTIFICATION_PREFS, DEFAULT_PRIVACY_PREFS } from '../services/auth.service.js';
import { supabase } from '../config/supabase.js';

const authService = new AuthService();

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const result = await authService.register(email, password, name);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user; // from authMiddleware
    const dbUser = await authService.getCurrentUser(user.id);
    res.status(200).json(dbUser);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user; // from authMiddleware
    const { name, phone, institution, department, bio } = req.body;
    const dbUser = await authService.updateProfile(user.id, { name, phone, institution, department, bio });
    res.status(200).json({
      message: 'Profile updated.',
      user: {
        id: dbUser.supabaseId,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        avatarUrl: dbUser.avatarUrl,
        phone: dbUser.phone,
        institution: dbUser.institution,
        department: dbUser.department,
        bio: dbUser.bio,
      },
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateNotificationPrefs = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user; // from authMiddleware
    const prefs = req.body || {};
    const allowedKeys = Object.keys(DEFAULT_NOTIFICATION_PREFS);
    const sanitized: Record<string, boolean> = {};
    for (const key of allowedKeys) {
      if (typeof prefs[key] === 'boolean') sanitized[key] = prefs[key];
    }
    const dbUser = await authService.updateNotificationPrefs(user.id, sanitized);
    res.status(200).json({
      message: 'Notification preferences updated.',
      notificationPrefs: dbUser.notificationPrefs,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updatePrivacyPrefs = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user; // from authMiddleware
    const prefs = req.body || {};
    const allowedKeys = Object.keys(DEFAULT_PRIVACY_PREFS);
    const sanitized: Record<string, boolean> = {};
    for (const key of allowedKeys) {
      if (typeof prefs[key] === 'boolean') sanitized[key] = prefs[key];
    }
    const dbUser = await authService.updatePrivacyPrefs(user.id, sanitized);
    res.status(200).json({
      message: 'Privacy preferences updated.',
      privacyPrefs: dbUser.privacyPrefs,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateAvatar = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user; // from authMiddleware
    const file = (req as any).file; // from uploadAvatar (multer)
    if (!file) {
      return res.status(400).json({ message: 'No image file was uploaded.' });
    }
    const dbUser = await authService.updateAvatar(user.id, file);
    res.status(200).json({
      message: 'Profile photo updated.',
      user: {
        id: dbUser.supabaseId,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        avatarUrl: dbUser.avatarUrl,
      },
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user; // from authMiddleware
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters.' });
    }
    const result = await authService.changePassword(user.email, currentPassword, newPassword);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    const result = await authService.resetPassword(token, newPassword);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body;
    const result = await authService.refreshToken(refresh_token);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const result = await authService.logout();
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { access_token } = req.body; // Frontend sends the Supabase session access_token

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(access_token);
    if (error || !user) {
      return res.status(401).json({ message: 'Invalid Google token.' });
    }

    // Sync user to Neon DB
    const dbUser = await authService.syncUser(user);

    // Optionally, you can also refresh the session if needed, but the frontend already has tokens.
    // We'll just return the user and a success message.
    res.status(200).json({
      message: 'Google login successful.',
      user: {
        id: dbUser.supabaseId,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        avatarUrl: dbUser.avatarUrl,
      },
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};