// backend/src/routes/auth.routes.ts
import { Router } from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  updateAvatar,
  updateNotificationPrefs,
  updatePrivacyPrefs,
  changePassword,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
  googleAuth,
} from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { uploadAvatar } from '../middleware/upload.middleware.js';

const router = Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new teacher account
 *     description: Creates a user in Supabase Auth and sends a verification email. The user will be synced to Neon DB upon first login.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: teacher@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: password123
 *     responses:
 *       200:
 *         description: Registration successful, verification email sent.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Registration successful. Please check your email to verify your account.
 *       400:
 *         description: Invalid input or email already registered.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.post('/register', register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login with email and password
 *     description: Authenticates a teacher using Supabase Auth. On success, the user profile is synchronised to Neon DB (if not already present) and tokens are returned.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: teacher@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful.
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     avatarUrl:
 *                       type: string
 *                 access_token:
 *                   type: string
 *                   description: JWT access token (from Supabase)
 *                 refresh_token:
 *                   type: string
 *       401:
 *         description: Invalid credentials or unverified email.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.post('/login', login);

/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Send password reset email
 *     description: Triggers Supabase to send a password reset email to the provided address.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: teacher@example.com
 *     responses:
 *       200:
 *         description: Password reset email sent.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password reset email sent.
 *       400:
 *         description: Email not found or invalid.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.post('/forgot-password', forgotPassword);

/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Reset password using an emailed recovery link
 *     description: Submits a new password with the session (`access_token`) from the reset link, or with a token hash (`token`). Only sessions that came from an emailed link are accepted. The password must be 8-72 characters, and all other sessions are signed out.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               access_token:
 *                 type: string
 *                 description: The session token from the reset link's URL
 *               token:
 *                 type: string
 *                 description: The recovery token (from the reset link)
 *                 example: abc123def456
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: newSecurePass
 *     responses:
 *       200:
 *         description: Password reset successful.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password has been reset successfully.
 *       400:
 *         description: Invalid or expired token, or password too weak.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.post('/reset-password', resetPassword);

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Refresh access token
 *     description: Exchanges a valid refresh token for a new access token (and a new refresh token).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh_token
 *             properties:
 *               refresh_token:
 *                 type: string
 *                 description: The refresh token obtained during login
 *                 example: refresh_xyz789
 *     responses:
 *       200:
 *         description: New tokens issued.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 access_token:
 *                   type: string
 *                 refresh_token:
 *                   type: string
 *       401:
 *         description: Invalid or expired refresh token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.post('/refresh', refreshToken);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Logout (client-side session destruction)
 *     description: Returns a success message; the client is responsible for clearing tokens and any local session state.
 *     responses:
 *       200:
 *         description: Logged out.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logged out successfully.
 */
router.post('/logout', logout);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Get current user profile
 *     description: Returns the authenticated teacher's profile from the Neon DB. Requires a valid JWT.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 supabaseId:
 *                   type: string
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 avatarUrl:
 *                   type: string
 *                 role:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorised – missing or invalid token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.get('/me', authMiddleware, getMe);

/**
 * @openapi
 * /api/auth/me:
 *   patch:
 *     tags:
 *       - Authentication
 *     summary: Update the current user's editable profile fields
 *     description: Updates name, phone, institution, department, and/or bio. Email is not editable here — it's the Supabase login identity.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               phone: { type: string }
 *               institution: { type: string }
 *               department: { type: string }
 *               bio: { type: string }
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorised – missing or invalid token.
 */
router.patch('/me', authMiddleware, updateProfile);

/**
 * @openapi
 * /api/auth/me/notifications:
 *   patch:
 *     tags:
 *       - Authentication
 *     summary: Update the current user's notification preference toggles
 *     description: Merges the given toggles onto whatever is already stored (or the defaults), so a partial update doesn't reset the others.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               examAlerts: { type: boolean }
 *               flagAlerts: { type: boolean }
 *               gradeReady: { type: boolean }
 *               weeklyReport: { type: boolean }
 *               systemUpdates: { type: boolean }
 *               studentJoins: { type: boolean }
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 *       401:
 *         description: Unauthorised – missing or invalid token.
 */
router.patch('/me/notifications', authMiddleware, updateNotificationPrefs);

/**
 * @openapi
 * /api/auth/me/privacy:
 *   patch:
 *     tags:
 *       - Authentication
 *     summary: Update the current user's privacy preference toggles
 *     description: Merges the given toggles onto whatever is already stored (or the defaults), so a partial update doesn't reset the others.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shareUsageData: { type: boolean }
 *               showInDirectory: { type: boolean }
 *               allowResearch: { type: boolean }
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 *       401:
 *         description: Unauthorised – missing or invalid token.
 */
router.patch('/me/privacy', authMiddleware, updatePrivacyPrefs);

/**
 * @openapi
 * /api/auth/me/avatar:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Upload or replace the current user's profile photo
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: JPG, PNG, or WEBP image, up to 3MB
 *     responses:
 *       200:
 *         description: Profile photo updated successfully
 *       400:
 *         description: Invalid file, or no file provided
 *       401:
 *         description: Unauthorised – missing or invalid token.
 */
router.post('/me/avatar', authMiddleware, uploadAvatar, updateAvatar);

/**
 * @openapi
 * /api/auth/me/password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Change the current user's password
 *     description: Verifies the current password by re-authenticating with Supabase, then updates it to the new password via the admin API.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password updated successfully.
 *       400:
 *         description: Current password incorrect, or new password invalid.
 *       401:
 *         description: Unauthorised – missing or invalid token.
 */
router.post('/me/password', authMiddleware, changePassword);

/**
 * @openapi
 * /api/auth/google:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Authenticate with Google OAuth (after frontend flow)
 *     description: >
 *       The frontend initiates the Google OAuth flow with Supabase, obtains an access token,
 *       then sends it to this endpoint to verify and sync the user in Neon DB.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - access_token
 *             properties:
 *               access_token:
 *                 type: string
 *                 description: The Supabase access token obtained after Google sign-in
 *                 example: eyJhbGciOiJIUzI1NiIs...
 *     responses:
 *       200:
 *         description: Google login successful – user synced.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Google login successful.
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     avatarUrl:
 *                       type: string
 *       401:
 *         description: Invalid or expired token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.post('/google', googleAuth);

export default router;