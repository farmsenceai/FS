const express = require('express');
const router = express.Router();
const multer = require('multer');

const DemoRequest = require('../models/DemoRequest');

const storage = multer.diskStorage({

  destination: (req, file, cb) => {

    if (file.fieldname === 'selfie') {
      cb(null, 'uploads/selfies');
    } else {
      cb(null, 'uploads/shops');
    }
  },

  filename: (req, file, cb) => {

    cb(
      null,
      Date.now() + '-' + file.originalname
    );
  }
});

const upload = multer({ storage });

router.post(
  '/book-demo',

  upload.fields([
    {
      name: 'selfie',
      maxCount: 1
    },
    {
      name: 'shopImage',
      maxCount: 1
    }
  ]),

  async (req, res) => {

    try {

      const demo = new DemoRequest({

        fullName: req.body.fullName,
        phone: req.body.phone,
        email: req.body.email,
        breed: req.body.breed,
        quantity: req.body.quantity,
        address: req.body.address,
        country: req.body.country,
        state: req.body.state,

        selfieImage:
          req.files.selfie?.[0]?.filename || '',

        shopImage:
          req.files.shopImage?.[0]?.filename || ''
      });

      await demo.save();

      res.json({
        success: true,
        message: 'Demo request submitted'
      });

    } catch (err) {

      console.error('BOOK DEMO ERROR:', err);

      res.status(500).json({
      success: false,
      message: err.message
    });
    }
  }
);

module.exports = router;