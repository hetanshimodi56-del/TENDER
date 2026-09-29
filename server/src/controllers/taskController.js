const db = require('../db/db');
const { logAudit } = require('../middleware/audit');

// Get tasks with optional filters
exports.getTasks = (req, res) => {
  try {
    const userId = req.user.id;
    const { tender_id, status, priority, stage } = req.query;

    let tasks = db.getTable('tender_tasks');

    // Isolate tasks by user unless super_admin
    if (req.user.role !== 'super_admin') {
      tasks = tasks.filter(t => t.user_id === userId || !t.user_id);
    }

    // Filter by tender_id
    if (tender_id && tender_id !== 'all') {
      tasks = tasks.filter(t => t.tender_id === tender_id);
    }

    // Filter by status
    if (status && status !== 'all') {
      tasks = tasks.filter(t => t.status === status);
    }

    // Filter by priority
    if (priority && priority !== 'all') {
      tasks = tasks.filter(t => t.priority === priority);
    }

    // Filter by stage
    if (stage && stage !== 'all') {
      tasks = tasks.filter(t => t.stage === stage);
    }

    // Enrich each task with tender reference
    const enriched = tasks.map(task => {
      const tender = db.findById('tenders', task.tender_id);
      return {
        ...task,
        tender_reference_no: tender ? tender.tender_reference_no : (task.tender_reference_no || 'TND-N/A'),
        tender_title: tender ? tender.title : (task.tender_title || 'General Tender Task'),
        tender_closing_date: tender ? tender.closing_date : null,
        tender_organization: tender ? tender.organization_name : null,
        completed_checklist_count: (task.checklist || []).filter(c => c.completed).length,
        total_checklist_count: (task.checklist || []).length
      };
    });

    // Sort by due date or created_at
    enriched.sort((a, b) => {
      if (a.due_date && b.due_date) {
        return new Date(a.due_date) - new Date(b.due_date);
      }
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

    res.json({
      success: true,
      total: enriched.length,
      data: enriched
    });
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve tender tasks.' });
  }
};

// Create a new task for a tender
exports.createTask = (req, res) => {
  try {
    const userId = req.user.id;
    const {
      tender_id,
      title,
      description = '',
      assigned_to = req.user.name,
      priority = 'medium',
      stage = 'Technical Documentation',
      due_date,
      status = 'todo',
      checklist = []
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Task title is required.' });
    }

    let tender = null;
    if (tender_id) {
      tender = db.findById('tenders', tender_id);
    }

    const newTask = db.insert('tender_tasks', {
      user_id: userId,
      tender_id: tender_id || null,
      tender_reference_no: tender ? tender.tender_reference_no : 'GENERAL',
      tender_title: tender ? tender.title : 'General Bidding Task',
      title: title.trim(),
      description: description.trim(),
      assigned_to: assigned_to || req.user.name,
      priority: priority.toLowerCase(), // critical, high, medium, low
      stage, // Pre-Bid / EMD, Technical Documentation, Financial / BOQ, Compliance, Submission
      status: status.toLowerCase(), // todo, in_progress, in_review, completed
      due_date: due_date || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      checklist: Array.isArray(checklist) ? checklist.map(c => typeof c === 'string' ? { id: Date.now() + Math.random().toString(), text: c, completed: false } : c) : []
    });

    logAudit(userId, 'CREATE_TENDER_TASK', 'TenderTask', newTask.id, {
      title: newTask.title,
      tender_id: newTask.tender_id,
      priority: newTask.priority
    });

    res.status(201).json({
      success: true,
      message: 'Tender task created successfully.',
      data: newTask
    });
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ success: false, message: 'Failed to create tender task.' });
  }
};

// Update task (status, checklist, priority, details)
exports.updateTask = (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const task = db.findById('tender_tasks', id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Tender task not found.' });
    }

    if (task.user_id && task.user_id !== req.user.id && req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: '403 Forbidden: You do not own this task.' });
    }

    const updated = db.updateById('tender_tasks', id, updates);

    logAudit(req.user.id, 'UPDATE_TENDER_TASK', 'TenderTask', id, {
      previous_status: task.status,
      new_status: updates.status || task.status
    });

    res.json({
      success: true,
      message: 'Task updated successfully.',
      data: updated
    });
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ success: false, message: 'Failed to update task.' });
  }
};

// Delete task
exports.deleteTask = (req, res) => {
  try {
    const { id } = req.params;
    const task = db.findById('tender_tasks', id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Tender task not found.' });
    }

    if (task.user_id && task.user_id !== req.user.id && req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: '403 Forbidden: You do not own this task.' });
    }

    db.deleteById('tender_tasks', id);
    logAudit(req.user.id, 'DELETE_TENDER_TASK', 'TenderTask', id);

    res.json({
      success: true,
      message: 'Task removed successfully.'
    });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete task.' });
  }
};
