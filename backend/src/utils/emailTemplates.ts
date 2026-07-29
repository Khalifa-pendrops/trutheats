export const otpEmailTemplate = (
  otp: string,
  purpose: "verify" | "reset",
): string => {
  const title =
    purpose === "verify" ? "Verify Your Email" : "Reset Your Password";
  const message =
    purpose === "verify"
      ? "Use the OTP below to verify your TrustEats account. It expires in <strong>10 minutes</strong>."
      : "Use the OTP below to reset your password. It expires in <strong>10 minutes</strong>.";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding:40px 0;">
            <table width="560" cellpadding="0" cellspacing="0"
              style="background:#ffffff;border-radius:8px;overflow:hidden;">

              <!-- Header -->
              <tr>
                <td style="background:#1B4332;padding:32px;text-align:center;">
                  <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">
                    TrustEats
                  </h1>
                  <p style="margin:8px 0 0;color:#B7E4C7;font-size:14px;">
                    Product Authentication Platform
                  </p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:40px 32px;">
                  <h2 style="margin:0 0 16px;color:#1B4332;font-size:20px;">${title}</h2>
                  <p style="margin:0 0 24px;color:#444444;font-size:15px;line-height:1.6;">
                    ${message}
                  </p>

                  <!-- OTP Box -->
                  <div style="background:#F0FFF4;border:2px solid #1B4332;border-radius:8px;
                    padding:24px;text-align:center;margin:0 0 24px;">
                    <p style="margin:0 0 8px;color:#666666;font-size:13px;text-transform:uppercase;
                      letter-spacing:2px;">Your OTP</p>
                    <p style="margin:0;color:#1B4332;font-size:40px;font-weight:700;
                      letter-spacing:12px;">${otp}</p>
                  </div>

                  <p style="margin:0;color:#888888;font-size:13px;line-height:1.6;">
                    If you did not request this, you can safely ignore this email.
                    Do not share this OTP with anyone.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f9f9f9;padding:24px 32px;border-top:1px solid #eeeeee;">
                  <p style="margin:0;color:#aaaaaa;font-size:12px;text-align:center;">
                    © ${new Date().getFullYear()} TrustEats · Protecting Nigerian Consumers
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

export const manufacturerApprovalTemplate = (companyName: string): string => `
  <!DOCTYPE html>
  <html>
  <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:40px 0;">
          <table width="560" cellpadding="0" cellspacing="0"
            style="background:#ffffff;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="background:#1B4332;padding:32px;text-align:center;">
                <h1 style="margin:0;color:#ffffff;font-size:24px;">TrustEats</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:40px 32px;">
                <h2 style="color:#1B4332;">Your Account has been Approved</h2>
                <p style="color:#444444;font-size:15px;line-height:1.6;">
                  Hi <strong>${companyName}</strong>,
                </p>
                <p style="color:#444444;font-size:15px;line-height:1.6;">
                  Your manufacturer account has been reviewed and approved.
                  You can now log in to create products, manage batches,
                  and generate QR verification codes for your products.
                </p>
                <p style="color:#444444;font-size:15px;line-height:1.6;">
                  Welcome to TrustEats.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#f9f9f9;padding:24px 32px;border-top:1px solid #eeeeee;">
                <p style="margin:0;color:#aaaaaa;font-size:12px;text-align:center;">
                  © ${new Date().getFullYear()} TrustEats
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
`;

export const manufacturerSuspensionTemplate = (
  companyName: string,
  reason: string,
): string => `
  <!DOCTYPE html>
  <html>
  <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:40px 0;">
          <table width="560" cellpadding="0" cellspacing="0"
            style="background:#ffffff;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="background:#1B4332;padding:32px;text-align:center;">
                <h1 style="margin:0;color:#ffffff;font-size:24px;">TrustEats</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:40px 32px;">
                <h2 style="color:#C00000;">Account Suspended</h2>
                <p style="color:#444444;font-size:15px;line-height:1.6;">
                  Hi <strong>${companyName}</strong>,
                </p>
                <p style="color:#444444;font-size:15px;line-height:1.6;">
                  Your TrustEats manufacturer account has been suspended.
                </p>
                <p style="color:#444444;font-size:15px;line-height:1.6;">
                  <strong>Reason:</strong> ${reason}
                </p>
                <p style="color:#444444;font-size:15px;line-height:1.6;">
                  If you believe this is an error, please contact our support team.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#f9f9f9;padding:24px 32px;border-top:1px solid #eeeeee;">
                <p style="margin:0;color:#aaaaaa;font-size:12px;text-align:center;">
                  © ${new Date().getFullYear()} TrustEats
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
`;
