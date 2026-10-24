export type SendEmailOptions = {
  to: string;
  confirmationUrl: string;
  userName?: string | undefined;
};

export type ResendResult = {
  success: boolean;
  id?: string | undefined;
  error?: string | undefined;
};

export function isResendConfigured(): boolean {
  return Boolean(process.env['RESEND_API_KEY']);
}

export async function sendConfirmationEmail(options: SendEmailOptions): Promise<ResendResult> {
  const apiKey = process.env['RESEND_API_KEY'];
  if (!apiKey) {
    return {
      success: false,
      error: 'RESEND_API_KEY is not configured in environment variables.',
    };
  }

  const fromEmail = process.env['RESEND_FROM_EMAIL'] || 'Aashray <onboarding@resend.dev>';
  const greeting = options.userName ? `Hello ${options.userName},` : 'Hello,';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm your email</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      margin: 0;
      padding: 32px 16px;
      color: #1e293b;
    }
    .card {
      max-width: 520px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 36px 32px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
    }
    .logo {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
      margin-bottom: 24px;
    }
    .logo-badge {
      font-size: 11px;
      color: #2e7d32;
      background: #e8f5e9;
      padding: 2px 7px;
      border-radius: 999px;
      margin-left: 4px;
      font-weight: 700;
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 12px;
      line-height: 1.3;
    }
    p {
      font-size: 14px;
      line-height: 1.6;
      color: #475569;
      margin: 0 0 20px;
    }
    .btn-container {
      margin: 28px 0;
      text-align: center;
    }
    .btn {
      display: inline-block;
      background-color: #1b4332;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      padding: 13px 28px;
      border-radius: 8px;
      letter-spacing: 0.2px;
    }
    .fallback-box {
      background: #f1f5f9;
      padding: 14px;
      border-radius: 8px;
      margin-top: 24px;
      word-break: break-all;
    }
    .fallback-text {
      font-size: 11px;
      color: #64748b;
      margin-bottom: 6px;
    }
    .fallback-link {
      font-size: 11px;
      color: #1b4332;
      text-decoration: underline;
    }
    .footer {
      margin-top: 32px;
      padding-top: 18px;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #94a3b8;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">
      aashray<span class="logo-badge">AI</span>
    </div>
    <h1>Confirm your email address</h1>
    <p>${greeting}</p>
    <p>Welcome to <strong>Aashray</strong>. To complete your sign-up and activate your design & planning workspace, please verify your email address by clicking the button below:</p>
    <div class="btn-container">
      <a href="${options.confirmationUrl}" target="_blank" class="btn">Confirm Email Address</a>
    </div>
    <p>This verification link is valid for 24 hours. If you did not create an account on Aashray, you can safely ignore this email.</p>
    <div class="fallback-box">
      <div class="fallback-text">Button not working? Copy and paste this URL into your browser:</div>
      <a href="${options.confirmationUrl}" class="fallback-link">${options.confirmationUrl}</a>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} Aashray · Intelligent Architecture, Interior Design & Budget Planning
    </div>
  </div>
</body>
</html>
  `.trim();

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [options.to],
        subject: 'Confirm your email · Aashray AI',
        html,
      }),
    });

    const data = (await response.json()) as { id?: string; message?: string; name?: string };

    if (!response.ok) {
      return {
        success: false,
        error: data.message || `Resend API failed with status ${response.status}`,
      };
    }

    return {
      success: true,
      id: data.id,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown network error calling Resend API',
    };
  }
}
