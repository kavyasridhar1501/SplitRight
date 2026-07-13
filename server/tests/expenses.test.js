const request = require('supertest');
const { app, registerUser, createGroup } = require('./helpers');

async function setupGroupOfTwo() {
  const { cookie: ownerCookie, user: owner } = await registerUser();
  const { cookie: memberCookie, user: member } = await registerUser();
  const group = await createGroup(ownerCookie);
  await request(app).post('/groups/join').set('Cookie', memberCookie).send({ invite_code: group.invite_code });
  return { ownerCookie, owner, memberCookie, member, group };
}

describe('POST /groups/:id/expenses', () => {
  it('splits an expense equally, giving the remainder cent to the first member', async () => {
    const { ownerCookie, owner, group } = await setupGroupOfTwo();

    const res = await request(app)
      .post(`/groups/${group.id}/expenses`)
      .set('Cookie', ownerCookie)
      .send({ title: 'Groceries', amount: 10.01, paid_by: owner.id, split_type: 'equal' });

    expect(res.status).toBe(201);
    const splits = res.body.data.expense.splits;
    const total = splits.reduce((sum, s) => sum + parseFloat(s.owed_amount), 0);
    expect(total).toBeCloseTo(10.01, 2);
    expect(splits.find((s) => s.owed_amount === '5.01' || s.owed_amount === 5.01)).toBeTruthy();
  });

  it('marks the payer share as pre-settled', async () => {
    const { ownerCookie, owner, group } = await setupGroupOfTwo();
    const res = await request(app)
      .post(`/groups/${group.id}/expenses`)
      .set('Cookie', ownerCookie)
      .send({ title: 'Utilities', amount: 40, paid_by: owner.id, split_type: 'equal' });

    const payerSplit = res.body.data.expense.splits.find((s) => s.user_id === owner.id);
    expect(payerSplit.is_settled).toBe(true);
  });

  it('splits an expense by custom amounts', async () => {
    const { ownerCookie, owner, member, group } = await setupGroupOfTwo();
    const res = await request(app)
      .post(`/groups/${group.id}/expenses`)
      .set('Cookie', ownerCookie)
      .send({
        title: 'Dinner',
        amount: 50,
        paid_by: owner.id,
        split_type: 'custom',
        splits: [
          { user_id: owner.id, value: 30 },
          { user_id: member.id, value: 20 },
        ],
      });

    expect(res.status).toBe(201);
    const memberSplit = res.body.data.expense.splits.find((s) => s.user_id === member.id);
    expect(parseFloat(memberSplit.owed_amount)).toBe(20);
  });

  it('rejects custom splits that do not sum to the total', async () => {
    const { ownerCookie, owner, member, group } = await setupGroupOfTwo();
    const res = await request(app)
      .post(`/groups/${group.id}/expenses`)
      .set('Cookie', ownerCookie)
      .send({
        title: 'Dinner',
        amount: 50,
        paid_by: owner.id,
        split_type: 'custom',
        splits: [
          { user_id: owner.id, value: 10 },
          { user_id: member.id, value: 10 },
        ],
      });
    expect(res.status).toBe(400);
  });

  it('splits an expense by percentage', async () => {
    const { ownerCookie, owner, member, group } = await setupGroupOfTwo();
    const res = await request(app)
      .post(`/groups/${group.id}/expenses`)
      .set('Cookie', ownerCookie)
      .send({
        title: 'Trip',
        amount: 200,
        paid_by: owner.id,
        split_type: 'percentage',
        splits: [
          { user_id: owner.id, value: 75 },
          { user_id: member.id, value: 25 },
        ],
      });

    expect(res.status).toBe(201);
    const memberSplit = res.body.data.expense.splits.find((s) => s.user_id === member.id);
    expect(parseFloat(memberSplit.owed_amount)).toBe(50);
  });

  it('rejects percentages that do not sum to 100', async () => {
    const { ownerCookie, owner, member, group } = await setupGroupOfTwo();
    const res = await request(app)
      .post(`/groups/${group.id}/expenses`)
      .set('Cookie', ownerCookie)
      .send({
        title: 'Trip',
        amount: 200,
        paid_by: owner.id,
        split_type: 'percentage',
        splits: [
          { user_id: owner.id, value: 60 },
          { user_id: member.id, value: 30 },
        ],
      });
    expect(res.status).toBe(400);
  });

  it('rejects an invalid split_type', async () => {
    const { ownerCookie, owner, group } = await setupGroupOfTwo();
    const res = await request(app)
      .post(`/groups/${group.id}/expenses`)
      .set('Cookie', ownerCookie)
      .send({ title: 'Bad', amount: 10, paid_by: owner.id, split_type: 'thirds' });
    expect(res.status).toBe(400);
  });

  it('rejects a non-positive amount', async () => {
    const { ownerCookie, owner, group } = await setupGroupOfTwo();
    const res = await request(app)
      .post(`/groups/${group.id}/expenses`)
      .set('Cookie', ownerCookie)
      .send({ title: 'Bad', amount: -5, paid_by: owner.id });
    expect(res.status).toBe(400);
  });

  it('rejects a payer who is not a group member', async () => {
    const { ownerCookie, group } = await setupGroupOfTwo();
    const { user: outsider } = await registerUser();
    const res = await request(app)
      .post(`/groups/${group.id}/expenses`)
      .set('Cookie', ownerCookie)
      .send({ title: 'Bad', amount: 10, paid_by: outsider.id });
    expect(res.status).toBe(400);
  });

  it('rejects expenses in a single-member group', async () => {
    const { cookie, user } = await registerUser();
    const group = await createGroup(cookie);
    const res = await request(app)
      .post(`/groups/${group.id}/expenses`)
      .set('Cookie', cookie)
      .send({ title: 'Solo', amount: 10, paid_by: user.id });
    expect(res.status).toBe(400);
  });
});

describe('GET /groups/:id/expenses', () => {
  it("lists a group's expenses with the caller's share", async () => {
    const { ownerCookie, owner, memberCookie, group } = await setupGroupOfTwo();
    await request(app)
      .post(`/groups/${group.id}/expenses`)
      .set('Cookie', ownerCookie)
      .send({ title: 'Groceries', amount: 20, paid_by: owner.id, split_type: 'equal' });

    const res = await request(app).get(`/groups/${group.id}/expenses`).set('Cookie', memberCookie);
    expect(res.status).toBe(200);
    expect(res.body.data.expenses).toHaveLength(1);
    expect(parseFloat(res.body.data.expenses[0].your_share)).toBe(10);
  });
});

describe('GET /groups/:id/expenses/:eid', () => {
  it('returns a single expense with its splits', async () => {
    const { ownerCookie, owner, group } = await setupGroupOfTwo();
    const created = await request(app)
      .post(`/groups/${group.id}/expenses`)
      .set('Cookie', ownerCookie)
      .send({ title: 'Wifi', amount: 30, paid_by: owner.id, split_type: 'equal' });

    const res = await request(app)
      .get(`/groups/${group.id}/expenses/${created.body.data.expense.id}`)
      .set('Cookie', ownerCookie);
    expect(res.status).toBe(200);
    expect(res.body.data.expense.title).toBe('Wifi');
    expect(res.body.data.expense.splits).toHaveLength(2);
  });

  it('returns 404 for an expense in another group', async () => {
    const { ownerCookie, group } = await setupGroupOfTwo();
    const res = await request(app)
      .get(`/groups/${group.id}/expenses/00000000-0000-0000-0000-000000000000`)
      .set('Cookie', ownerCookie);
    expect(res.status).toBe(404);
  });

  it('forbids non-members from viewing an expense', async () => {
    const { ownerCookie, owner, group } = await setupGroupOfTwo();
    const { cookie: outsiderCookie } = await registerUser();
    const created = await request(app)
      .post(`/groups/${group.id}/expenses`)
      .set('Cookie', ownerCookie)
      .send({ title: 'Wifi', amount: 30, paid_by: owner.id, split_type: 'equal' });

    const res = await request(app)
      .get(`/groups/${group.id}/expenses/${created.body.data.expense.id}`)
      .set('Cookie', outsiderCookie);
    expect(res.status).toBe(403);
  });
});

describe('DELETE /groups/:id/expenses/:eid', () => {
  it('allows the payer to delete their own expense', async () => {
    const { ownerCookie, owner, group } = await setupGroupOfTwo();
    const created = await request(app)
      .post(`/groups/${group.id}/expenses`)
      .set('Cookie', ownerCookie)
      .send({ title: 'Snacks', amount: 5, paid_by: owner.id, split_type: 'equal' });

    const res = await request(app)
      .delete(`/groups/${group.id}/expenses/${created.body.data.expense.id}`)
      .set('Cookie', ownerCookie);
    expect(res.status).toBe(200);
  });

  it('forbids a non-payer from deleting the expense', async () => {
    const { ownerCookie, owner, memberCookie, group } = await setupGroupOfTwo();
    const created = await request(app)
      .post(`/groups/${group.id}/expenses`)
      .set('Cookie', ownerCookie)
      .send({ title: 'Snacks', amount: 5, paid_by: owner.id, split_type: 'equal' });

    const res = await request(app)
      .delete(`/groups/${group.id}/expenses/${created.body.data.expense.id}`)
      .set('Cookie', memberCookie);
    expect(res.status).toBe(403);
  });

  it('returns 404 for a non-existent expense', async () => {
    const { ownerCookie, group } = await setupGroupOfTwo();
    const res = await request(app)
      .delete(`/groups/${group.id}/expenses/00000000-0000-0000-0000-000000000000`)
      .set('Cookie', ownerCookie);
    expect(res.status).toBe(404);
  });
});
