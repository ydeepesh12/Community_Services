const express = require('express');
const router = express.Router();
const {
  getMedicines,
  getMedicine,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  togglePauseMedicine
} = require('../controllers/medicineController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getMedicines)
  .post(createMedicine);

router.route('/:id')
  .get(getMedicine)
  .put(updateMedicine)
  .delete(deleteMedicine);

router.patch('/:id/pause', togglePauseMedicine);

module.exports = router;
