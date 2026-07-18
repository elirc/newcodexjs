const express = require('express');
const taskController = require('../controllers/taskController');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(taskController.listTasks));
router.get('/stats', asyncHandler(taskController.getTaskStats));
router.get('/:id', asyncHandler(taskController.getTask));
router.post('/', asyncHandler(taskController.createTask));
router.put('/:id', asyncHandler(taskController.updateTask));
router.patch('/:id/toggle', asyncHandler(taskController.toggleTask));
router.delete('/:id', asyncHandler(taskController.deleteTask));

module.exports = router;
