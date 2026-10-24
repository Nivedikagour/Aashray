import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { sendConfirmationEmail, isResendConfigured } from './resend.server';
import { createClient } from '@supabase/supabase-js';

export const getSystemConfigStatus = createServerFn({ method: 'GET' })
  .handler(async () => {
    return {
      resendConfigured: isResendConfigured(),
      geminiConfigured: Boolean(process.env['GEMINI_API_KEY']),
      openaiConfigured: Boolean(process.env['OPENAI_API_KEY']),
    };
  });

export const sendSignupConfirmationWithResend = createServerFn({ method: 'POST' })
  .validator((d) => z.object({
    email: z.string().email(),
    password: z.string().min(6).optional(),
    confirmationUrl: z.string().url().optional(),
    userName: z.string().optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    if (!isResendConfigured()) {
      return {
        sent: false,
        reason: 'RESEND_API_KEY_NOT_SET',
        message: 'Resend API key is not configured in .env. Supabase built-in email or custom SMTP will handle delivery.',
      };
    }

    const supabaseUrl = process.env['SUPABASE_URL'] || process.env['VITE_SUPABASE_URL'];
    const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

    let actionLink = data.confirmationUrl;

    // If service role key is available, generate official Supabase signup confirmation link
    if (supabaseUrl && serviceRoleKey && data.password) {
      try {
        const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });

        const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
          type: 'signup',
          email: data.email,
          password: data.password,
          options: {
            redirectTo: data.confirmationUrl || `${supabaseUrl}/auth/v1/verify`,
          },
        });

        if (!linkError && linkData?.properties?.action_link) {
          actionLink = linkData.properties.action_link;
        }
      } catch (adminErr) {
        console.warn('[Resend Auth] Could not generate admin link, using fallback redirect URL:', adminErr);
      }
    }

    const result = await sendConfirmationEmail({
      to: data.email,
      confirmationUrl: actionLink || 'https://aashray.app/auth',
      userName: data.userName,
    });

    if (!result.success) {
      return {
        sent: false,
        reason: 'RESEND_API_ERROR',
        message: result.error || 'Failed to dispatch email via Resend API.',
      };
    }

    return {
      sent: true,
      id: result.id,
      message: 'Confirmation email successfully dispatched via Resend API!',
    };
  });
