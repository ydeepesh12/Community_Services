const express = require('express');
const router = express.Router();
const {
  generateInviteCode,
  linkWithCode,
  getRelationships,
  updatePermissions,
  removeRelationship
} = require('../controllers/caregiverController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getRelationships);
router.post('/invite', generateInviteCode);
router.post('/link', linkWithCode);
router.put('/:id', updatePermissions);
router.delete('/:id', removeRelationship);

module.exports = router;
