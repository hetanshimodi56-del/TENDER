import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Filter, 
  Calendar, 
  User, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Layers, 
  Kanban, 
  List, 
  Trash2, 
  Edit3, 
  ChevronRight, 
  ChevronLeft,
  Search,
  Sparkles,
  Building2,
  FolderKanban,
  X
} from 'lucide-react';
import { api } from '../services/api';
import confetti from 'canvas-confetti';

const STAGES = [
  'All Stages',
  'Pre-Bid / EMD',
  'Technical Documentation',
  'Financial / BOQ',
  'Compliance & Legal',
  'Submission & Upload'
];

const PRIORITIES = ['all', 'critical', 'high', 'medium', 'low'];

export default function TenderTasksView({ onViewDetailsById, onShowToast }) {
  const [tasks, setTasks] = useState([]);
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'
  
  // Filters
  const [selectedTenderId, setSelectedTenderId] = useState('all');
  const [selectedStage, setSelectedStage] = useState('All Stages');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Task Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTenderId, setNewTenderId] = useState('');
  const [newAssignee, setNewAssignee] = useState('Aarav Mehta (Bid Lead)');
  const [newPriority, setNewPriority] = useState('high');
  const [newStage, setNewStage] = useState('Technical Documentation');
  const [newDueDate, setNewDueDate] = useState('');
  const [checklistInputs, setChecklistInputs] = useState(['', '']);

  useEffect(() => {
    fetchTasksAndTenders();
    // Default due date in 5 days
    const d = new Date(Date.now() + 5 * 86400000);
    setNewDueDate(d.toISOString().split('T')[0]);
  }, []);

  const fetchTasksAndTenders = async () => {
    setLoading(true);
    try {
      const [tasksRes, tendersRes] = await Promise.all([
        api.getTasks(),
        api.getTenders({ limit: 50 })
      ]);
      setTasks(tasksRes.data || []);
      setTenders(tendersRes.data || []);
      if (tendersRes.data && tendersRes.data.length > 0 && !newTenderId) {
        setNewTenderId(tendersRes.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      if (onShowToast) onShowToast('Please enter a task title', 'error');
      return;
    }

    try {
      const validChecklist = checklistInputs
        .filter(c => c && c.trim())
        .map((text, i) => ({ id: `c_${Date.now()}_${i}`, text: text.trim(), completed: false }));

      const payload = {
        tender_id: newTenderId || null,
        title: newTitle.trim(),
        description: newDesc.trim(),
        assigned_to: newAssignee,
        priority: newPriority,
        stage: newStage,
        due_date: newDueDate,
        status: 'todo',
        checklist: validChecklist
      };

      await api.createTask(payload);
      if (onShowToast) onShowToast('Tender task created successfully!', 'success');
      setShowAddModal(false);
      setNewTitle('');
      setNewDesc('');
      setChecklistInputs(['', '']);
      fetchTasksAndTenders();
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Failed to create task', 'error');
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await api.updateTask(taskId, { status: newStatus });
      if (newStatus === 'completed') {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      }
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      if (onShowToast) onShowToast(`Task moved to ${newStatus.replace('_', ' ').toUpperCase()}`);
    } catch (err) {
      if (onShowToast) onShowToast('Failed to update task status', 'error');
    }
  };

  const handleToggleChecklist = async (task, checkIndex) => {
    try {
      const updatedChecklist = [...(task.checklist || [])];
      updatedChecklist[checkIndex].completed = !updatedChecklist[checkIndex].completed;
      
      const allDone = updatedChecklist.length > 0 && updatedChecklist.every(c => c.completed);
      const updates = { checklist: updatedChecklist };
      if (allDone && task.status !== 'completed') {
        updates.status = 'completed';
      }

      await api.updateTask(task.id, updates);
      setTasks(prev => prev.map(t => t.id === task.id ? { 
        ...t, 
        checklist: updatedChecklist,
        status: allDone ? 'completed' : t.status 
      } : t));
    } catch (err) {
      console.error('Failed to update checklist item:', err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to remove this task?')) return;
    try {
      await api.deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      if (onShowToast) onShowToast('Task deleted successfully');
    } catch (err) {
      if (onShowToast) onShowToast('Failed to delete task', 'error');
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    if (selectedTenderId !== 'all' && t.tender_id !== selectedTenderId) return false;
    if (selectedStage !== 'All Stages' && t.stage !== selectedStage) return false;
    if (selectedPriority !== 'all' && t.priority !== selectedPriority) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = t.title.toLowerCase().includes(q) || 
                    (t.description && t.description.toLowerCase().includes(q)) ||
                    (t.tender_reference_no && t.tender_reference_no.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // KPI calculations
  const totalCount = tasks.length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const criticalCount = tasks.filter(t => t.priority === 'critical' && t.status !== 'completed').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const columns = [
    { key: 'todo', label: 'To Do', color: '#64748b', bg: '#f1f5f9' },
    { key: 'in_progress', label: 'In Progress', color: '#0284c7', bg: '#e0f2fe' },
    { key: 'in_review', label: 'In Review', color: '#8b5cf6', bg: '#ede9fe' },
    { key: 'completed', label: 'Completed', color: '#16a34a', bg: '#dcfce7' }
  ];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>
      {/* Top Banner / KPIs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Tender Tasks & Bidding Preparation
            </h1>
            <span className="badge badge-purple" style={{ fontSize: '0.72rem' }}>
              {tasks.length} Active Tasks
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
            Track document requirements, EMD bank guarantees, CA certifications, technical BOQs, and submission milestones.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ display: 'flex', background: '#ffffff', borderRadius: 8, padding: 3, border: '1px solid #cbd5e1' }}>
            <button
              onClick={() => setViewMode('kanban')}
              className={`btn btn-sm ${viewMode === 'kanban' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '5px 10px', borderRadius: 6 }}
            >
              <Kanban size={14} /> Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '5px 10px', borderRadius: 6 }}
            >
              <List size={14} /> List
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
              boxShadow: '0 2px 10px rgba(79, 70, 229, 0.3)'
            }}
          >
            <Plus size={16} /> + Add Tender Task
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16,
        marginBottom: 20
      }}>
        <div className="saas-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
            Total Bidding Tasks
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>
            {totalCount}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
            Across {new Set(tasks.map(t => t.tender_id)).size} active tenders
          </div>
        </div>

        <div className="saas-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 700, textTransform: 'uppercase' }}>
            In Progress
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0284c7', margin: '4px 0' }}>
            {inProgressCount}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
            Active document drafts & approvals
          </div>
        </div>

        <div className="saas-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 700, textTransform: 'uppercase' }}>
            Critical Priority
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#dc2626', margin: '4px 0' }}>
            {criticalCount}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
            High urgency submission items
          </div>
        </div>

        <div className="saas-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700, textTransform: 'uppercase' }}>
            Milestones Completed
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#16a34a', margin: '4px 0' }}>
            {completionRate}%
          </div>
          <div style={{
            height: 6,
            background: '#e2e8f0',
            borderRadius: 3,
            overflow: 'hidden',
            marginTop: 6
          }}>
            <div style={{ width: `${completionRate}%`, height: '100%', background: '#16a34a', transition: 'width 0.3s' }} />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: '12px 18px',
        marginBottom: 20,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', flex: 1 }}>
          {/* Quick Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 6, padding: '4px 10px', width: 220 }}>
            <Search size={14} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.8rem', width: '100%' }}
            />
          </div>

          {/* Tender Filter */}
          <select
            className="form-select"
            value={selectedTenderId}
            onChange={e => setSelectedTenderId(e.target.value)}
            style={{ width: 220, padding: '5px 8px', fontSize: '0.8rem' }}
          >
            <option value="all">📁 All Associated Tenders</option>
            {tenders.map(t => (
              <option key={t.id} value={t.id}>
                {t.tender_reference_no} - {t.title.slice(0, 24)}...
              </option>
            ))}
          </select>

          {/* Stage Filter */}
          <select
            className="form-select"
            value={selectedStage}
            onChange={e => setSelectedStage(e.target.value)}
            style={{ width: 180, padding: '5px 8px', fontSize: '0.8rem' }}
          >
            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Priority Filter */}
          <select
            className="form-select"
            value={selectedPriority}
            onChange={e => setSelectedPriority(e.target.value)}
            style={{ width: 140, padding: '5px 8px', fontSize: '0.8rem' }}
          >
            <option value="all">⚡ All Priorities</option>
            <option value="critical">🔴 Critical</option>
            <option value="high">🟠 High</option>
            <option value="medium">🔵 Medium</option>
            <option value="low">⚪ Low</option>
          </select>
        </div>

        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
          Showing <strong>{filteredTasks.length}</strong> of {tasks.length} tasks
        </div>
      </div>

      {/* Main View Area: KANBAN BOARD */}
      {viewMode === 'kanban' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          alignItems: 'start'
        }}>
          {columns.map(col => {
            const colTasks = filteredTasks.filter(t => t.status === col.key);

            return (
              <div 
                key={col.key}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: 12,
                  minHeight: 480,
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Column Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '6px 8px 12px',
                  borderBottom: '1px solid #e2e8f0',
                  marginBottom: 12
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: col.color }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
                      {col.label}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: col.bg,
                    color: col.color,
                    padding: '2px 8px',
                    borderRadius: 9999
                  }}>
                    {colTasks.length}
                  </span>
                </div>

                {/* Task Cards in Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                  {colTasks.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '30px 10px',
                      color: '#94a3b8',
                      fontSize: '0.75rem',
                      fontStyle: 'italic',
                      border: '1px dashed #cbd5e1',
                      borderRadius: 8
                    }}>
                      No tasks in {col.label}
                    </div>
                  ) : (
                    colTasks.map(task => {
                      const priorityColor = task.priority === 'critical' ? '#dc2626' : 
                                            task.priority === 'high' ? '#d97706' : 
                                            task.priority === 'medium' ? '#0284c7' : '#64748b';
                      const priorityBg = task.priority === 'critical' ? '#fee2e2' : 
                                         task.priority === 'high' ? '#fef3c7' : 
                                         task.priority === 'medium' ? '#e0f2fe' : '#f1f5f9';

                      return (
                        <div
                          key={task.id}
                          className="saas-card"
                          style={{
                            padding: '14px',
                            borderLeft: `4px solid ${priorityColor}`,
                            background: '#ffffff'
                          }}
                        >
                          {/* Card Badges */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                            <span style={{
                              fontSize: '0.67rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '2px 6px',
                              borderRadius: 4,
                              background: priorityBg,
                              color: priorityColor
                            }}>
                              {task.priority}
                            </span>

                            <div style={{ display: 'flex', gap: 4 }}>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2 }}
                                title="Delete task"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          {/* Tender Reference Tag */}
                          {task.tender_reference_no && (
                            <div 
                              onClick={() => task.tender_id && onViewDetailsById && onViewDetailsById(task.tender_id)}
                              style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                color: '#0284c7',
                                fontFamily: 'monospace',
                                cursor: 'pointer',
                                marginBottom: 4
                              }}
                              title="Click to view tender"
                            >
                              {task.tender_reference_no}
                            </div>
                          )}

                          {/* Task Title */}
                          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.35, marginBottom: 6 }}>
                            {task.title}
                          </div>

                          {/* Stage Tag */}
                          <div style={{ fontSize: '0.7rem', color: '#475569', background: '#f8fafc', padding: '2px 6px', borderRadius: 4, display: 'inline-block', marginBottom: 8, border: '1px solid #e2e8f0' }}>
                            {task.stage}
                          </div>

                          {/* Description if any */}
                          {task.description && (
                            <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4, marginBottom: 8 }}>
                              {task.description}
                            </div>
                          )}

                          {/* Sub-task checklist */}
                          {task.checklist && task.checklist.length > 0 && (
                            <div style={{
                              background: '#f8fafc',
                              borderRadius: 6,
                              padding: '6px 8px',
                              marginBottom: 10,
                              border: '1px solid #f1f5f9'
                            }}>
                              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                                <span>Checklist</span>
                                <span>{task.checklist.filter(c => c.completed).length} / {task.checklist.length}</span>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {task.checklist.map((item, cIdx) => (
                                  <label 
                                    key={item.id || cIdx} 
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 6,
                                      fontSize: '0.72rem',
                                      cursor: 'pointer',
                                      color: item.completed ? '#94a3b8' : '#334155',
                                      textDecoration: item.completed ? 'line-through' : 'none'
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={!!item.completed}
                                      onChange={() => handleToggleChecklist(task, cIdx)}
                                      style={{ accentColor: '#16a34a' }}
                                    />
                                    <span>{item.text}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Assignee & Due Date Footer */}
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.7rem',
                            color: '#64748b',
                            paddingTop: 8,
                            borderTop: '1px solid #f1f5f9'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <User size={12} color="#94a3b8" />
                              <span>{task.assigned_to?.split(' ')[0] || 'Team'}</span>
                            </div>

                            {task.due_date && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: new Date(task.due_date) < new Date() && task.status !== 'completed' ? '#dc2626' : '#64748b' }}>
                                <Clock size={12} />
                                <span>{new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                              </div>
                            )}
                          </div>

                          {/* Quick Advance Workflow Stepper Buttons */}
                          <div style={{ display: 'flex', gap: 4, marginTop: 8, paddingTop: 6, borderTop: '1px solid #f1f5f9' }}>
                            {col.key !== 'todo' && (
                              <button
                                onClick={() => {
                                  const prevMap = { in_progress: 'todo', in_review: 'in_progress', completed: 'in_review' };
                                  handleUpdateStatus(task.id, prevMap[col.key]);
                                }}
                                style={{ flex: 1, padding: '3px 6px', fontSize: '0.67rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 4, cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}
                                title="Move back"
                              >
                                <ChevronLeft size={12} /> Back
                              </button>
                            )}

                            {col.key !== 'completed' && (
                              <button
                                onClick={() => {
                                  const nextMap = { todo: 'in_progress', in_progress: 'in_review', in_review: 'completed' };
                                  handleUpdateStatus(task.id, nextMap[col.key]);
                                }}
                                style={{ flex: 1, padding: '3px 6px', fontSize: '0.67rem', background: '#4f46e5', border: 'none', borderRadius: 4, cursor: 'pointer', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, fontWeight: 600 }}
                                title="Advance status"
                              >
                                Advance <ChevronRight size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main View Area: TABLE LIST VIEW */}
      {viewMode === 'list' && (
        <div className="saas-card" style={{ overflow: 'hidden' }}>
          <table className="saas-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', fontSize: '0.75rem', color: '#64748b' }}>
                <th style={{ padding: '12px 16px' }}>Task Title & Scope</th>
                <th style={{ padding: '12px 16px' }}>Related Tender</th>
                <th style={{ padding: '12px 16px' }}>Stage</th>
                <th style={{ padding: '12px 16px' }}>Priority</th>
                <th style={{ padding: '12px 16px' }}>Assigned To</th>
                <th style={{ padding: '12px 16px' }}>Due Date</th>
                <th style={{ padding: '12px 16px' }}>Checklist</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No tasks found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTasks.map(task => (
                  <tr key={task.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.82rem' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{task.title}</div>
                      {task.description && <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>{task.description}</div>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#0284c7', background: '#e0f2fe', padding: '2px 6px', borderRadius: 4 }}>
                        {task.tender_reference_no}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#475569' }}>{task.stage}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: task.priority === 'critical' ? '#fee2e2' : task.priority === 'high' ? '#fef3c7' : '#e0f2fe',
                        color: task.priority === 'critical' ? '#dc2626' : task.priority === 'high' ? '#d97706' : '#0284c7'
                      }}>
                        {task.priority}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#334155' }}>
                      {task.assigned_to}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>
                      {task.due_date ? new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {task.checklist && task.checklist.length > 0 ? (
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
                          {task.checklist.filter(c => c.completed).length}/{task.checklist.length} Done
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>None</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <select
                        className="form-select"
                        value={task.status}
                        onChange={e => handleUpdateStatus(task.id, e.target.value)}
                        style={{ padding: '4px 8px', fontSize: '0.75rem', width: 130 }}
                      >
                        <option value="todo">📋 To Do</option>
                        <option value="in_progress">⚡ In Progress</option>
                        <option value="in_review">🔍 In Review</option>
                        <option value="completed">✅ Completed</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="btn btn-sm btn-danger"
                        style={{ padding: '4px 8px' }}
                        title="Delete task"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)} style={{ zIndex: 1000 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div style={{
              padding: '18px 24px',
              background: 'linear-gradient(135deg, #0f172a, #1e293b)',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #334155'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckSquare size={18} color="#818cf8" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                  Add Tender Task / Checklist Item
                </h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                  Related Tender Opportunity *
                </label>
                <select
                  className="form-select"
                  value={newTenderId}
                  onChange={e => setNewTenderId(e.target.value)}
                  required
                >
                  {tenders.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.tender_reference_no} - {t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                  Task Title *
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Procure Bank Guarantee / EMD ₹90 Lakhs"
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                  Description / Action Items
                </label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Specific instructions or requirements for this milestone..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                    Stage Category
                  </label>
                  <select
                    className="form-select"
                    value={newStage}
                    onChange={e => setNewStage(e.target.value)}
                  >
                    <option value="Pre-Bid / EMD">Pre-Bid / EMD</option>
                    <option value="Technical Documentation">Technical Documentation</option>
                    <option value="Financial / BOQ">Financial / BOQ</option>
                    <option value="Compliance & Legal">Compliance & Legal</option>
                    <option value="Submission & Upload">Submission & Upload</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                    Priority
                  </label>
                  <select
                    className="form-select"
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value)}
                  >
                    <option value="critical">🔴 Critical</option>
                    <option value="high">🟠 High</option>
                    <option value="medium">🔵 Medium</option>
                    <option value="low">⚪ Low</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                    Assignee / Lead
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={newAssignee}
                    onChange={e => setNewAssignee(e.target.value)}
                    placeholder="e.g. CA Rahul Verma"
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                    Due Date
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={newDueDate}
                    onChange={e => setNewDueDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Sub-checklists */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', margin: 0 }}>
                    Checklist Sub-items (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={() => setChecklistInputs([...checklistInputs, ''])}
                    style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    + Add Item
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {checklistInputs.map((val, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 6 }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder={`Sub-item ${idx + 1}`}
                        value={val}
                        onChange={e => {
                          const updated = [...checklistInputs];
                          updated[idx] = e.target.value;
                          setChecklistInputs(updated);
                        }}
                        style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                      />
                      {checklistInputs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setChecklistInputs(checklistInputs.filter((_, i) => i !== idx))}
                          style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 4 }}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10, paddingTop: 14, borderTop: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Create Tender Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
