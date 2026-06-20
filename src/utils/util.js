export function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateOtpHtml(otp) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>Email Verification</title>
    </head>
    <body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, Helvetica, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding:40px 20px;">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.08);">

              <!-- Header -->
              <tr>
                <td style="background:#2563eb; padding:24px; text-align:center;">
                  <h1 style="margin:0; color:#ffffff; font-size:24px;">
                    Email Verification
                  </h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding:40px 32px;">
                  <p style="margin:0 0 16px; font-size:16px; color:#333;">
                    Hello,
                  </p>

                  <p style="margin:0 0 24px; font-size:16px; color:#555; line-height:1.6;">
                    Use the following One-Time Password (OTP) to complete your verification process.
                  </p>

                  <div style="
                    background:#f8fafc;
                    border:1px solid #e5e7eb;
                    border-radius:10px;
                    padding:20px;
                    text-align:center;
                    margin:24px 0;
                  ">
                    <span style="
                      font-size:36px;
                      font-weight:700;
                      letter-spacing:8px;
                      color:#2563eb;
                    ">
                      ${otp}
                    </span>
                  </div>

                  <p style="margin:0 0 16px; font-size:15px; color:#555;">
                    This OTP is valid for <strong>10 minutes</strong>.
                  </p>

                  <p style="margin:0; font-size:15px; color:#555; line-height:1.6;">
                    If you did not request this verification code, you can safely ignore this email.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="
                  border-top:1px solid #e5e7eb;
                  padding:20px;
                  text-align:center;
                  font-size:13px;
                  color:#888;
                ">
                  © ${new Date().getFullYear()} Your Company. All rights reserved.
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
