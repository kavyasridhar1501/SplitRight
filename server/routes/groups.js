const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../lib/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Generate random 8-char invite code
function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// GET /groups — all groups for current user
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT g.id, g.name, g.invite_code, g.created_at,
        (SELECT COUNT(*) FROM group_members gm2 WHERE gm2.group_id = g.id) AS member_count
       FROM groups g
       JOIN group_members gm ON gm.group_id = g.id
       WHERE gm.user_id = $1
       ORDER BY g.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: { groups: result.rows } });
  } catch (err) {
    console.error('Get groups error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch groups' });
  }
});

// POST /groups — create group
router.post('/', verifyToken, async (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Group name is required' });
  }

  try {
    // Generate unique invite code
    let invite_code;
    let attempts = 0;
    do {
      invite_code = generateInviteCode();
      const existing = await db.query('SELECT id FROM groups WHERE invite_code = $1', [invite_code]);
      if (existing.rows.length === 0) break;
      attempts++;
    } while (attempts < 10);

    const groupResult = await db.query(
      'INSERT INTO groups (name, invite_code, created_by) VALUES ($1, $2, $3) RETURNING *',
      [name.trim(), invite_code, req.user.id]
    );

    const group = groupResult.rows[0];

    // Add creator as member
    await db.query(
      'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)',
      [group.id, req.user.id]
    );

    res.status(201).json({ success: true, data: { group: { ...group, member_count: 1 } } });
  } catch (err) {
    console.error('Create group error:', err);
    res.status(500).json({ success: false, error: 'Failed to create group' });
  }
});

// POST /groups/join — join via invite code
router.post('/join', verifyToken, async (req, res) => {
  const { invite_code } = req.body;

  if (!invite_code) {
    return res.status(400).json({ success: false, error: 'Invite code is required' });
  }

  try {
    const groupResult = await db.query(
      'SELECT * FROM groups WHERE invite_code = $1',
      [invite_code.toUpperCase().trim()]
    );

    if (groupResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'No group found with that code' });
    }

    const group = groupResult.rows[0];

    // Check if already a member
    const memberCheck = await db.query(
      'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
      [group.id, req.user.id]
    );

    if (memberCheck.rows.length > 0) {
      return res.status(409).json({ success: false, error: 'You are already a member of this group' });
    }

    await db.query(
      'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)',
      [group.id, req.user.id]
    );

    const memberCount = await db.query(
      'SELECT COUNT(*) FROM group_members WHERE group_id = $1',
      [group.id]
    );

    res.json({ success: true, data: { group: { ...group, member_count: parseInt(memberCount.rows[0].count) } } });
  } catch (err) {
    console.error('Join group error:', err);
    res.status(500).json({ success: false, error: 'Failed to join group' });
  }
});

// GET /groups/:id — group details + members
router.get('/:id', verifyToken, async (req, res) => {
  try {
    // Verify membership
    const memberCheck = await db.query(
      'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ success: false, error: 'Not a member of this group' });
    }

    const groupResult = await db.query('SELECT * FROM groups WHERE id = $1', [req.params.id]);
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    const membersResult = await db.query(
      `SELECT u.id, u.name, u.email, u.avatar_color, gm.joined_at
       FROM users u
       JOIN group_members gm ON gm.user_id = u.id
       WHERE gm.group_id = $1
       ORDER BY gm.joined_at ASC`,
      [req.params.id]
    );

    res.json({
      success: true,
      data: {
        group: groupResult.rows[0],
        members: membersResult.rows,
      },
    });
  } catch (err) {
    console.error('Get group error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch group' });
  }
});

// DELETE /groups/:id/leave — leave a group
router.delete('/:id/leave', verifyToken, async (req, res) => {
  try {
    // Check for unsettled balances
    const unsettledResult = await db.query(
      `SELECT COALESCE(SUM(
        CASE WHEN e.paid_by = $1 THEN es.owed_amount ELSE -es.owed_amount END
       ), 0) AS net_balance
       FROM expense_splits es
       JOIN expenses e ON e.id = es.expense_id
       WHERE e.group_id = $2
         AND es.is_settled = FALSE
         AND (e.paid_by = $1 OR es.user_id = $1)
         AND (e.paid_by != es.user_id)`,
      [req.user.id, req.params.id]
    );

    const netBalance = parseFloat(unsettledResult.rows[0].net_balance);
    if (Math.abs(netBalance) > 0.01) {
      return res.status(400).json({
        success: false,
        error: `You have an unsettled balance of $${Math.abs(netBalance).toFixed(2)}. Please settle up before leaving.`,
      });
    }

    await db.query(
      'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    res.json({ success: true, data: { message: 'Left group successfully' } });
  } catch (err) {
    console.error('Leave group error:', err);
    res.status(500).json({ success: false, error: 'Failed to leave group' });
  }
});

module.exports = router;
