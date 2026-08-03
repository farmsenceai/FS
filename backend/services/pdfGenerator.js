const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function generateTermsPDF(user) {
  return new Promise((resolve, reject) => {
    try {
      const agreementsDir = path.join(__dirname, '../uploads/agreements');
      if (!fs.existsSync(agreementsDir)) {
        fs.mkdirSync(agreementsDir, { recursive: true });
      }

      const fileName = `${user._id}-${Date.now()}.pdf`;
      const filePath = path.join(agreementsDir, fileName);
      const relativePath = `/uploads/agreements/${fileName}`;

      const doc = new PDFDocument();
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      doc.fontSize(20).text('FarmSence — Terms Agreement Record', { align: 'center' });
      doc.moveDown();
      
      doc.fontSize(12).text(`User Email: ${user.email || 'N/A'}`);
      doc.text(`User Phone: ${user.phone || 'N/A'}`);
      doc.text(`Auth Method: ${user.authMethod}`);
      doc.text(`Date/Time Agreed: ${new Date().toLocaleString()}`);
      doc.text(`Terms Version: ${user.termsVersion || '1.0'}`);
      doc.text(`Agreement ID: ${crypto.randomUUID()}`);
      
      doc.moveDown();
      doc.text("By confirming, the user acknowledged FarmSence's Main Services Agreement, End Users Terms of Use, and Privacy Policy.");
      
      doc.moveDown(2);
      doc.fontSize(10).text('Generated automatically by FarmSence.', { align: 'center', color: 'grey' });

      doc.end();

      stream.on('finish', () => {
        resolve(relativePath);
      });

      stream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generateTermsPDF };