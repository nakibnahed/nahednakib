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
