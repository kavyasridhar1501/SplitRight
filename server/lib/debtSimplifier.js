/**
 * Debt Simplification Algorithm
 * Input: array of { userId, netBalance }
 *   positive netBalance = owed to them (creditor)
 *   negative netBalance = they owe (debtor)
 * Output: array of { from, to, amount } — minimum transactions to settle all debts
 */
function simplifyDebts(balances) {
  const creditors = balances
    .filter((b) => b.netBalance > 0.01)
    .sort((a, b) => b.netBalance - a.netBalance);

  const debtors = balances
    .filter((b) => b.netBalance < -0.01)
    .sort((a, b) => a.netBalance - b.netBalance);

  const transactions = [];
  let i = 0;
  let j = 0;

  while (i < creditors.length && j < debtors.length) {
    const amount = Math.min(creditors[i].netBalance, -debtors[j].netBalance);
    transactions.push({
      from: debtors[j].userId,
      to: creditors[i].userId,
      amount: Math.round(amount * 100) / 100,
    });
    creditors[i].netBalance -= amount;
    debtors[j].netBalance += amount;
    if (Math.abs(creditors[i].netBalance) < 0.01) i++;
    if (Math.abs(debtors[j].netBalance) < 0.01) j++;
  }

  return transactions;
}

module.exports = { simplifyDebts };
