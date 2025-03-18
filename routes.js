const express = require('express');
const router = express.Router();

router.get('/api/data', (req, res) => {
  res.json({ message: 'Voici vos données!' });
});

module.exports = router;
