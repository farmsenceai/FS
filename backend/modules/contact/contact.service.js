const nodemailer = require('nodemailer');
const Contact = require('../../models/Contact.model');

function createMailTransport() {
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  });
}

async function sendContactEmail({ name, email, phone, subject, message }) {
  const transporter = createMailTransport();

  await transporter.sendMail({
    from: `"FarmsenceAI" <${process.env.MAIL_USER}>`,
    to: process.env.MAIL_USER,
    subject: `New Contact: ${subject || 'No Subject'}`,
    html: `
      <h2>New Contact Form Submission</h2>
      <p><b>Name:</b> ${name}</p>
      <p><b>Email:</b> ${email}</p>
      <p><b>Phone:</b> ${phone || 'N/A'}</p>
      <p><b>Message:</b> ${message}</p>
    `
  });
}

async function submitContact(payload) {
  const { name, email, phone, subject, message } = payload;
  const contact = new Contact({ name, email, phone, subject, message });
  await contact.save();
  await sendContactEmail({ name, email, phone, subject, message });
  return contact;
}

async function getAllContacts() {
  return Contact.find().sort({ createdAt: -1 });
}

module.exports = {
  getAllContacts,
  sendContactEmail,
  submitContact
};
