const express = require('express');
const db = require('../lib/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// POST /groups/:id/settlements
router.post('/:id/settlements', verifyToken, async (req, res) => {
  const { from_user_id, to_user_id, amount, note } = req.body;

  if (!from_user_id || !to_user_id || !amount) {
    return res.status(400).json({ success: false, error: 'from_user_id, to_user_id, and amount are required' });
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ success: false, error: 'Amount must be a positive number' });
  }

  try {
    // Verify membership
    const memberCheck = await db.query(
      'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ success: false, error: 'Not a member of this group' });
    }

    // Record settlement
    const settlementResult = await db.query(
      'INSERT INTO settlements (group_id, from_user_id, to_user_id, amount, note) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.params.id, from_user_id, to_user_id, parsedAmount, note || null]
    );

    // Mark relevant expense splits as settled
    // From user's outstanding splits where to_user_id was the payer
    await db.query(
      `UPDATE expense_splits es
       SET is_settled = TRUE, settled_at = NOW()
       FROM expenses e
       WHERE es.expense_id = e.id
         AND e.group_id = $1
         AND es.user_id = $2
         AND e.paid_by = $3
         AND es.is_settled = FALSE`,
      [req.params.id, from_user_id, to_user_id]
    );

    res.status(201).json({
      success: true,
      data: { settlement: settlementResult.rows[0] },
    });
  } catch (err) {
    console.error('Create settlement error:', err);
    res.status(500).json({ success: false, error: 'Failed to record settlement' });
  }
});

// GET /groups/:id/settlements — settlement history
router.get('/:id/settlements', verifyToken, async (req, res) => {
  try {
    const memberCheck = await db.query(
      'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ success: false, error: 'Not a member of this group' });
    }

    const result = await db.query(
      `SELECT s.*,
        fu.name AS from_name, fu.avatar_color AS from_avatar_color,
        tu.name AS to_name, tu.avatar_color AS to_avatar_color
       FROM settlements s
       JOIN users fu ON fu.id = s.from_user_id
       JOIN users tu ON tu.id = s.to_user_id
       WHERE s.group_id = $1
       ORDER BY s.created_at DESC`,
      [req.params.id]
    );

    res.json({ success: true, data: { settlements: result.rows } });
  } catch (err) {
    console.error('Get settlements error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch settlements' });
  }
});

module.exports = router;
