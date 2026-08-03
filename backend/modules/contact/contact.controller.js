const contactService = require('./contact.service');

async function submitContact(req, res) {
  try {
    await contactService.submitContact(req.body);
    res.json({ success: true, message: 'Message received! We will get back to you.' });
  } catch (err) {
    console.error('Contact Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

async function getAllContacts(req, res) {
  try {
    const contacts = await contactService.getAllContacts();
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getAllContacts,
  submitContact
};
