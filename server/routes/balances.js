const express = require('express');
const db = require('../lib/db');
const { verifyToken } = require('../middleware/auth');
const { simplifyDebts } = require('../lib/debtSimplifier');

const router = express.Router();

// GET /groups/:id/balances — net balances + simplified settlement list
router.get('/:id/balances', verifyToken, async (req, res) => {
  try {
    // Verify membership
    const memberCheck = await db.query(
      'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ success: false, error: 'Not a member of this group' });
    }

    // Get all members
    const membersResult = await db.query(
      `SELECT u.id, u.name, u.avatar_color
       FROM users u
       JOIN group_members gm ON gm.user_id = u.id
       WHERE gm.group_id = $1`,
      [req.params.id]
    );
    const members = membersResult.rows;
    const memberMap = {};
    members.forEach((m) => { memberMap[m.id] = m; });

    // Calculate net balance per user
    // Amount paid by user (as payer): sum of (expense.amount - their own split)
    // Amount owed by user (as split member): sum of unsettled owed_amount where they are NOT the payer
    const balanceResult = await db.query(
      `SELECT
        u.id AS user_id,
        COALESCE(SUM(
          CASE
            WHEN e.paid_by = u.id AND es.user_id != u.id AND es.is_settled = FALSE
              THEN es.owed_amount
            WHEN e.paid_by != u.id AND es.user_id = u.id AND es.is_settled = FALSE
              THEN -es.owed_amount
            ELSE 0
          END
        ), 0) AS net_balance
       FROM users u
       JOIN group_members gm ON gm.user_id = u.id
       LEFT JOIN expense_splits es ON es.expense_id IN (SELECT id FROM expenses WHERE group_id = $1)
       LEFT JOIN expenses e ON e.id = es.expense_id
       WHERE gm.group_id = $1
         AND (es.id IS NULL OR es.user_id = u.id OR e.paid_by = u.id)
       GROUP BY u.id`,
      [req.params.id]
    );

    const rawBalances = balanceResult.rows.map((r) => ({
      userId: r.user_id,
      netBalance: parseFloat(r.net_balance),
    }));

    // Run debt simplification
    const settlements = simplifyDebts(rawBalances.map((b) => ({ ...b })));

    // Enrich with user data
    const enrichedBalances = rawBalances.map((b) => ({
      user: memberMap[b.userId],
      netBalance: b.netBalance,
    }));

    const enrichedSettlements = settlements.map((s) => ({
      from: memberMap[s.from],
      to: memberMap[s.to],
      amount: s.amount,
    }));

    res.json({
      success: true,
      data: {
        balances: enrichedBalances,
        settlements: enrichedSettlements,
      },
    });
  } catch (err) {
    console.error('Get balances error:', err);
    res.status(500).json({ success: false, error: 'Failed to calculate balances' });
  }
});

module.exports = router;
