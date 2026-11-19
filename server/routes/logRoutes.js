const express = require('express');
const router = express.Router();
const {
  getLogs,
  getLogHistory,
  createManualLog,
  updateLog,
  deleteLog
} = require('../controllers/logController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getLogs)
  .post(createManualLog);

router.get('/history', getLogHistory);

router.route('/:id')
  .put(updateLog)
  .delete(deleteLog);

module.exports = router;
