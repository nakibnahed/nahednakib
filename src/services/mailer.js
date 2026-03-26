import nodemailer from "nodemailer";

const sendOwnerNotification = process.env.SEND_OWNER_NOTIFICATION === "true";

export async function sendContactEmail({ name, email, message }) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  if (sendOwnerNotification) {
    // Email to site owner
    const ownerMailOptions = {
      from: `"Contact Form" <${process.env.SMTP_USER}>`,
      to: process.env.CONTACT_RECEIVER_EMAIL,
      subject: "New Contact Form Submission",
      text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
    };
    await transporter.sendMail(ownerMailOptions);
  }

  // Always send welcome email to user
  const userMailOptions = {
    from: `"Nahed Dev" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Thanks for contacting us!",
    text: `Hi ${name},\n\nThank you for reaching out! We have received your message and will get back to you soon.\n\nBest regards,\nNahed Dev Team`,
  };

  await transporter.sendMail(userMailOptions);
}

export async function sendNewsletterWelcomeEmail(email, unsubscribeToken) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const unsubscribeUrl = `${
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000")
  }/api/newsletter/unsubscribe?token=${unsubscribeToken}`;

  const mailOptions = {
    from: `"Nahed Dev Newsletter" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "🎉 Welcome to Nahed Dev Newsletter!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1f2937; margin: 0; font-size: 28px; font-weight: bold;">
              🎉 Welcome to Our Newsletter!
            </h1>
          </div>
          
          <div style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            <p>Hi there!</p>
            
            <p>Thank you for subscribing to the <strong>Nahed Dev Newsletter</strong>! 🚀</p>
            
            <p>You're now part of an exclusive community where you'll receive:</p>
            
            <ul style="margin: 20px 0; padding-left: 20px;">
              <li>🔥 Latest web development tips and tricks</li>
              <li>💻 New project showcases and tutorials</li>
              <li>📚 Coding insights and best practices</li>
              <li>🎯 Industry news and trending technologies</li>
              <li>✨ Exclusive behind-the-scenes content</li>
            </ul>
            
            <p>Stay tuned for amazing content coming your way!</p>
            
            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #3b82f6;">
              <p style="margin: 0; color: #1e40af; font-weight: 500;">
                💡 <strong>Pro Tip:</strong> Make sure to add our email to your contacts so you never miss an update!
              </p>
            </div>
            
            <p>Best regards,<br>
            <strong>Nahed Dev Team</strong></p>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px; text-align: center;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Don't want to receive these emails? 
              <a href="${unsubscribeUrl}" style="color: #3b82f6; text-decoration: none;">Unsubscribe here</a>
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
Welcome to Nahed Dev Newsletter!

Hi there!

Thank you for subscribing to the Nahed Dev Newsletter! 🚀

You're now part of an exclusive community where you'll receive:
- Latest web development tips and tricks
- New project showcases and tutorials  
- Coding insights and best practices
- Industry news and trending technologies
- Exclusive behind-the-scenes content

Stay tuned for amazing content coming your way!

Best regards,
Nahed Dev Team

Don't want to receive these emails? Unsubscribe here: ${unsubscribeUrl}
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendPracticeMeetingEmail({
  requesterName,
  recipientName,
  requesterEmail,
  recipientEmail,
  meetLink,
  suggestedTime,
}) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const subject = "Your Conversation Practice Session is Confirmed";
  const html = `
    <div style="background:#f6f8fc;padding:28px 12px;font-family:Montserrat,Arial,sans-serif;color:#1f2937;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;box-shadow:0 6px 20px rgba(15,23,42,.06);">
        <div style="background:linear-gradient(135deg,#ee681a,#9b4016);padding:18px 24px;">
          <div style="font-size:18px;font-weight:700;color:#ffffff;">Conversation Practice</div>
          <div style="font-size:12px;color:#ffe7d8;margin-top:2px;">Session Confirmation</div>
        </div>

        <div style="padding:24px;">
          <h2 style="margin:0 0 12px;font-size:20px;line-height:1.3;color:#111827;">Your session is confirmed</h2>
          <p style="margin:0 0 14px;font-size:14px;line-height:1.7;color:#374151;">
            Hi <strong>${requesterName}</strong> and <strong>${recipientName}</strong>,<br/>
            your conversation practice request has been accepted.
          </p>

          <div style="margin:16px 0;padding:14px;border:1px solid #fde3d3;background:#fff7f2;border-radius:10px;">
            <div style="font-size:12px;color:#6b7280;margin-bottom:6px;">Scheduled time</div>
            <div style="font-size:14px;font-weight:600;color:#111827;">${suggestedTime || "Not specified"}</div>
          </div>

          <a href="${meetLink}" style="display:inline-block;margin-top:8px;background:#111827;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-size:14px;font-weight:600;">
            Open Google Meet
          </a>

          <p style="margin:14px 0 0;font-size:12px;color:#6b7280;line-height:1.6;">
            This link opens Google Meet's meeting creation page. One of you can create the room and share it instantly.
          </p>
        </div>

        <div style="padding:14px 24px;border-top:1px solid #f3f4f6;background:#fafafa;font-size:12px;color:#6b7280;">
          Sent by Nahed Nakib - Conversation Practice System
        </div>
      </div>
    </div>
  `;

  const text = `Conversation Practice - Session Confirmed\n\nHi ${requesterName} and ${recipientName},\nYour conversation practice request has been accepted.\n\nScheduled time: ${suggestedTime || "Not specified"}\nOpen Google Meet: ${meetLink}\n\nSent by Nahed Nakib - Conversation Practice System`;

  const recipients = [requesterEmail, recipientEmail].filter(Boolean);
  if (!recipients.length) return;

  await transporter.sendMail({
    from: `"Practice Meetings" <${process.env.SMTP_USER}>`,
    to: recipients.join(","),
    subject,
    html,
    text,
  });
}

export async function sendPracticeIncomingRequestEmail({
  recipientName,
  recipientEmail,
  requesterName,
  requestsPageUrl,
}) {
  if (!recipientEmail) return;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const subject = "New Conversation Practice Request";
  const html = `
    <div style="background:#f6f8fc;padding:28px 12px;font-family:Montserrat,Arial,sans-serif;color:#1f2937;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;box-shadow:0 6px 20px rgba(15,23,42,.06);">
        <div style="background:linear-gradient(135deg,#ee681a,#9b4016);padding:18px 24px;">
          <div style="font-size:18px;font-weight:700;color:#ffffff;">Conversation Practice</div>
          <div style="font-size:12px;color:#ffe7d8;margin-top:2px;">Incoming Request</div>
        </div>

        <div style="padding:24px;">
          <h2 style="margin:0 0 12px;font-size:20px;line-height:1.3;color:#111827;">You have a new request</h2>
          <p style="margin:0 0 14px;font-size:14px;line-height:1.7;color:#374151;">
            Hi <strong>${recipientName || "Student"}</strong>,<br/>
            <strong>${requesterName || "A student"}</strong> sent you a new conversation practice request.
          </p>

          <a href="${requestsPageUrl}" style="display:inline-block;margin-top:8px;background:#111827;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-size:14px;font-weight:600;">
            Open Incoming Requests
          </a>

          <p style="margin:14px 0 0;font-size:12px;color:#6b7280;line-height:1.6;">
            If the button does not work, use this link:<br/>
            <a href="${requestsPageUrl}" style="color:#ee681a;text-decoration:none;">${requestsPageUrl}</a>
          </p>
        </div>

        <div style="padding:14px 24px;border-top:1px solid #f3f4f6;background:#fafafa;font-size:12px;color:#6b7280;">
          Sent by Nahed Nakib - Conversation Practice System
        </div>
      </div>
    </div>
  `;

  const text = `New Conversation Practice Request\n\nHi ${recipientName || "Student"},\n${requesterName || "A student"} sent you a new conversation practice request.\n\nOpen incoming requests: ${requestsPageUrl}\n\nSent by Nahed Nakib - Conversation Practice System`;

  await transporter.sendMail({
    from: `"Practice Meetings" <${process.env.SMTP_USER}>`,
    to: recipientEmail,
    subject,
    html,
    text,
  });
}
