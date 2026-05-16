const nodemailer = require('nodemailer')

const createTransport = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    family: 4,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

const sendVerificationEmail = async (toAddress, code) => {
  const transporter = createTransport()

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6f3; padding: 40px 0;">
      <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">

        <!-- Header -->
        <div style="background: #2d5a27; padding: 28px 32px;">
          <div style="color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.3px;">
            🚪 KnockKnock.prof
          </div>
          <div style="color: #a8d5a2; font-size: 13px; margin-top: 4px;">
            Open the door to better consultations
          </div>
        </div>

        <!-- Body -->
        <div style="padding: 36px 32px;">
          <h2 style="color: #1a2e18; font-size: 20px; margin: 0 0 12px;">Verify your Wits email address</h2>
          <p style="color: #4a5568; font-size: 15px; line-height: 1.6; margin: 0 0 28px;">
            Use the code below to verify your Wits email address and activate your account.
          </p>

          <!-- Code box -->
          <div style="background: #f0f7ee; border: 2px solid #2d5a27; border-radius: 10px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <div style="font-size: 42px; font-weight: 800; letter-spacing: 10px; color: #2d5a27; font-variant-numeric: tabular-nums;">
              ${code}
            </div>
          </div>

          <p style="color: #718096; font-size: 13px; text-align: center; margin: 0 0 8px;">
            ⏱ This code expires in <strong>30 minutes</strong>.
          </p>
          <p style="color: #718096; font-size: 13px; text-align: center; margin: 0;">
            Enter it on the verification page to complete your signup.
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #f4f6f3; padding: 20px 32px; border-top: 1px solid #e2e8df;">
          <p style="color: #a0aec0; font-size: 12px; margin: 0; text-align: center;">
            If you did not create an account on KnockKnock.prof, you can safely ignore this email.
          </p>
        </div>

      </div>
    </div>
  `

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"KnockKnock.prof" <no-reply@knockknock.prof>',
    to: toAddress,
    subject: 'KnockKnock.prof — Verify your email',
    html,
  })
}

const sendLoginWarningEmail = async (toAddress, pin) => {
  const transporter = createTransport()

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #fdf4f4; padding: 40px 0;">
      <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">

        <!-- Header -->
        <div style="background: #b91c1c; padding: 28px 32px;">
          <div style="color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.3px;">
            KnockKnock.prof — Security Alert
          </div>
          <div style="color: #fca5a5; font-size: 13px; margin-top: 4px;">
            Unusual login activity detected
          </div>
        </div>

        <!-- Body -->
        <div style="padding: 36px 32px;">
          <h2 style="color: #7f1d1d; font-size: 20px; margin: 0 0 12px;">Multiple failed login attempts</h2>
          <p style="color: #4a5568; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
            We detected 4 consecutive failed login attempts on your KnockKnock.prof account.
            To protect your account, a one-time PIN is now required for your next login.
          </p>

          <!-- PIN box -->
          <div style="background: #fff1f2; border: 2px solid #b91c1c; border-radius: 10px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <div style="font-size: 13px; color: #7f1d1d; margin-bottom: 8px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;">Your one-time PIN</div>
            <div style="font-size: 42px; font-weight: 800; letter-spacing: 10px; color: #b91c1c; font-variant-numeric: tabular-nums;">
              ${pin}
            </div>
          </div>

          <p style="color: #718096; font-size: 13px; text-align: center; margin: 0 0 8px;">
            Enter this PIN alongside your password on your next login.
          </p>
          <p style="color: #718096; font-size: 13px; text-align: center; margin: 0;">
            If this wasn't you, contact your system administrator immediately.
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #fff1f2; padding: 20px 32px; border-top: 1px solid #fecaca;">
          <p style="color: #a0aec0; font-size: 12px; margin: 0; text-align: center;">
            This is an automated security alert from KnockKnock.prof. Do not share this PIN with anyone.
          </p>
        </div>

      </div>
    </div>
  `

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"KnockKnock.prof" <no-reply@knockknock.prof>',
    to: toAddress,
    subject: 'KnockKnock.prof — Security Alert: Multiple failed login attempts',
    html,
  })
}

const sendPasswordResetEmail = async (toAddress, resetLink) => {
  const transporter = createTransport()

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6f3; padding: 40px 0;">
      <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">

        <div style="background: #2d5a27; padding: 28px 32px;">
          <div style="color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.3px;">
            KnockKnock.prof
          </div>
          <div style="color: #a8d5a2; font-size: 13px; margin-top: 4px;">
            Open the door to better consultations
          </div>
        </div>

        <div style="padding: 36px 32px;">
          <h2 style="color: #1a2e18; font-size: 20px; margin: 0 0 12px;">Reset your password</h2>
          <p style="color: #4a5568; font-size: 15px; line-height: 1.6; margin: 0 0 28px;">
            We received a request to reset your KnockKnock.prof password. Click the button below to choose a new one.
          </p>

          <div style="text-align: center; margin-bottom: 28px;">
            <a href="${resetLink}" style="background: #2d5a27; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; display: inline-block;">
              Reset Password
            </a>
          </div>

          <p style="color: #718096; font-size: 13px; text-align: center; margin: 0 0 8px;">
            ⏱ This link expires in <strong>1 hour</strong>.
          </p>
          <p style="color: #718096; font-size: 13px; text-align: center; margin: 0;">
            If you did not request a password reset, you can safely ignore this email.
          </p>
        </div>

        <div style="background: #f4f6f3; padding: 20px 32px; border-top: 1px solid #e2e8df;">
          <p style="color: #a0aec0; font-size: 12px; margin: 0; text-align: center;">
            Do not share this link with anyone.
          </p>
        </div>

      </div>
    </div>
  `

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"KnockKnock.prof" <no-reply@knockknock.prof>',
    to: toAddress,
    subject: 'KnockKnock.prof — Reset your password',
    html,
  })
}

module.exports = { sendVerificationEmail, sendLoginWarningEmail, sendPasswordResetEmail }
