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
