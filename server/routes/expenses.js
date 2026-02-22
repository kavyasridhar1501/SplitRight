const express = require('express');
const db = require('../lib/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Verify group membership helper
async function checkMembership(groupId, userId) {
  const result = await db.query(
    'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
    [groupId, userId]
  );
  return result.rows.length > 0;
}

// GET /groups/:id/expenses
router.get('/:id/expenses', verifyToken, async (req, res) => {
  try {
    const isMember = await checkMembership(req.params.id, req.user.id);
    if (!isMember) {
      return res.status(403).json({ success: false, error: 'Not a member of this group' });
    }

    const result = await db.query(
      `SELECT e.id, e.title, e.amount, e.split_type, e.created_at,
        e.paid_by,
        u.name AS paid_by_name,
        u.avatar_color AS paid_by_avatar_color,
        COALESCE(
          (SELECT es.owed_amount FROM expense_splits es WHERE es.expense_id = e.id AND es.user_id = $2),
          0
        ) AS your_share,
        COALESCE(
          (SELECT es.is_settled FROM expense_splits es WHERE es.expense_id = e.id AND es.user_id = $2),
          FALSE
        ) AS your_share_settled
       FROM expenses e
       JOIN users u ON u.id = e.paid_by
       WHERE e.group_id = $1
       ORDER BY e.created_at DESC`,
      [req.params.id, req.user.id]
    );

    res.json({ success: true, data: { expenses: result.rows } });
  } catch (err) {
    console.error('Get expenses error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch expenses' });
  }
});

// POST /groups/:id/expenses
router.post('/:id/expenses', verifyToken, async (req, res) => {
  const { title, amount, paid_by, split_type = 'equal', splits } = req.body;

  if (!title || !amount || !paid_by) {
    return res.status(400).json({ success: false, error: 'Title, amount, and paid_by are required' });
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ success: false, error: 'Amount must be a positive number' });
  }

  try {
    const isMember = await checkMembership(req.params.id, req.user.id);
    if (!isMember) {
      return res.status(403).json({ success: false, error: 'Not a member of this group' });
    }

    // Verify payer is a group member
    const payerCheck = await checkMembership(req.params.id, paid_by);
    if (!payerCheck) {
      return res.status(400).json({ success: false, error: 'Payer must be a group member' });
    }

    // Get group members for equal split
    const membersResult = await db.query(
      'SELECT user_id FROM group_members WHERE group_id = $1',
      [req.params.id]
    );
    const memberIds = membersResult.rows.map((r) => r.user_id);

    if (memberIds.length < 2) {
      return res.status(400).json({ success: false, error: 'Cannot add expense to a group with only one member' });
    }

    // Build splits array
    let computedSplits = [];

    if (split_type === 'equal') {
      const share = Math.floor((parsedAmount / memberIds.length) * 100) / 100;
      const remainder = Math.round((parsedAmount - share * memberIds.length) * 100) / 100;
      computedSplits = memberIds.map((uid, idx) => ({
        user_id: uid,
        owed_amount: idx === 0 ? share + remainder : share,
      }));
    } else if (split_type === 'custom' || split_type === 'percentage') {
      if (!splits || !Array.isArray(splits) || splits.length === 0) {
        return res.status(400).json({ success: false, error: 'Splits array is required for custom/percentage split' });
      }

      if (split_type === 'percentage') {
        const totalPct = splits.reduce((sum, s) => sum + parseFloat(s.value || 0), 0);
        if (Math.abs(totalPct - 100) > 0.01) {
          return res.status(400).json({ success: false, error: 'Percentages must sum to 100%' });
        }
        computedSplits = splits.map((s) => ({
          user_id: s.user_id,
          owed_amount: Math.round((parsedAmount * parseFloat(s.value)) / 100 * 100) / 100,
        }));
      } else {
        const totalCustom = splits.reduce((sum, s) => sum + parseFloat(s.value || 0), 0);
        if (Math.abs(totalCustom - parsedAmount) > 0.01) {
          return res.status(400).json({ success: false, error: `Split amounts must sum to $${parsedAmount.toFixed(2)}` });
        }
        computedSplits = splits.map((s) => ({
          user_id: s.user_id,
          owed_amount: parseFloat(s.value),
        }));
      }
    } else {
      return res.status(400).json({ success: false, error: 'Invalid split_type. Use: equal, custom, or percentage' });
    }

    // Validate all split users are group members
    for (const s of computedSplits) {
      if (!memberIds.includes(s.user_id)) {
        return res.status(400).json({ success: false, error: 'All split users must be group members' });
      }
    }

    // Insert expense
    const expenseResult = await db.query(
      'INSERT INTO expenses (group_id, paid_by, title, amount, split_type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.params.id, paid_by, title.trim(), parsedAmount, split_type]
    );

    const expense = expenseResult.rows[0];

    // Insert splits
    for (const split of computedSplits) {
      // Payer's own share is pre-settled
      const is_settled = split.user_id === paid_by;
      await db.query(
        'INSERT INTO expense_splits (expense_id, user_id, owed_amount, is_settled, settled_at) VALUES ($1, $2, $3, $4, $5)',
        [expense.id, split.user_id, split.owed_amount, is_settled, is_settled ? new Date() : null]
      );
    }

    // Return with splits included
    const splitsResult = await db.query(
      `SELECT es.*, u.name AS user_name, u.avatar_color
       FROM expense_splits es
       JOIN users u ON u.id = es.user_id
       WHERE es.expense_id = $1`,
      [expense.id]
    );

    res.status(201).json({
      success: true,
      data: { expense: { ...expense, splits: splitsResult.rows } },
    });
  } catch (err) {
    console.error('Create expense error:', err);
    res.status(500).json({ success: false, error: 'Failed to create expense' });
  }
});

// GET /groups/:id/expenses/:eid
router.get('/:id/expenses/:eid', verifyToken, async (req, res) => {
  try {
    const isMember = await checkMembership(req.params.id, req.user.id);
    if (!isMember) {
      return res.status(403).json({ success: false, error: 'Not a member of this group' });
    }

    const expenseResult = await db.query(
      `SELECT e.*, u.name AS paid_by_name, u.avatar_color AS paid_by_avatar_color
       FROM expenses e
       JOIN users u ON u.id = e.paid_by
       WHERE e.id = $1 AND e.group_id = $2`,
      [req.params.eid, req.params.id]
    );

    if (expenseResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }

    const splitsResult = await db.query(
      `SELECT es.*, u.name AS user_name, u.avatar_color
       FROM expense_splits es
       JOIN users u ON u.id = es.user_id
       WHERE es.expense_id = $1`,
      [req.params.eid]
    );

    res.json({
      success: true,
      data: { expense: { ...expenseResult.rows[0], splits: splitsResult.rows } },
    });
  } catch (err) {
    console.error('Get expense error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch expense' });
  }
});

// DELETE /groups/:id/expenses/:eid
router.delete('/:id/expenses/:eid', verifyToken, async (req, res) => {
  try {
    const isMember = await checkMembership(req.params.id, req.user.id);
    if (!isMember) {
      return res.status(403).json({ success: false, error: 'Not a member of this group' });
    }

    const expenseResult = await db.query(
      'SELECT * FROM expenses WHERE id = $1 AND group_id = $2',
      [req.params.eid, req.params.id]
    );

    if (expenseResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }

    const expense = expenseResult.rows[0];
    if (expense.paid_by !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Only the payer can delete this expense' });
    }

    await db.query('DELETE FROM expenses WHERE id = $1', [req.params.eid]);

    res.json({ success: true, data: { message: 'Expense deleted successfully' } });
  } catch (err) {
    console.error('Delete expense error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete expense' });
  }
});

module.exports = router;
