const request = require('supertest');
const { app, registerUser, createGroup } = require('./helpers');

describe('GET /groups/:id/balances', () => {
  it('computes net balances and a simplified settlement plan', async () => {
    const { cookie: ownerCookie, user: owner } = await registerUser();
    const { cookie: memberCookie, user: member } = await registerUser();
    const group = await createGroup(ownerCookie);
    await request(app).post('/groups/join').set('Cookie', memberCookie).send({ invite_code: group.invite_code });

    await request(app)
      .post(`/groups/${group.id}/expenses`)
      .set('Cookie', ownerCookie)
      .send({ title: 'Rent', amount: 100, paid_by: owner.id, split_type: 'equal' });

    const res = await request(app).get(`/groups/${group.id}/balances`).set('Cookie', ownerCookie);
    expect(res.status).toBe(200);

    const ownerBalance = res.body.data.balances.find((b) => b.user.id === owner.id);
    const memberBalance = res.body.data.balances.find((b) => b.user.id === member.id);
    expect(ownerBalance.netBalance).toBeCloseTo(50, 2);
    expect(memberBalance.netBalance).toBeCloseTo(-50, 2);

    expect(res.body.data.settlements).toHaveLength(1);
    expect(res.body.data.settlements[0].from.id).toBe(member.id);
    expect(res.body.data.settlements[0].to.id).toBe(owner.id);
    expect(res.body.data.settlements[0].amount).toBeCloseTo(50, 2);
  });

  it('excludes settled splits from the balance calculation', async () => {
    const { cookie: ownerCookie, user: owner } = await registerUser();
    const { cookie: memberCookie, user: member } = await registerUser();
    const group = await createGroup(ownerCookie);
    await request(app).post('/groups/join').set('Cookie', memberCookie).send({ invite_code: group.invite_code });

    await request(app)
      .post(`/groups/${group.id}/expenses`)
      .set('Cookie', ownerCookie)
      .send({ title: 'Rent', amount: 100, paid_by: owner.id, split_type: 'equal' });

    await request(app)
      .post(`/groups/${group.id}/settlements`)
      .set('Cookie', memberCookie)
      .send({ from_user_id: member.id, to_user_id: owner.id, amount: 50 });

    const res = await request(app).get(`/groups/${group.id}/balances`).set('Cookie', ownerCookie);
    const ownerBalance = res.body.data.balances.find((b) => b.user.id === owner.id);
    const memberBalance = res.body.data.balances.find((b) => b.user.id === member.id);
    expect(ownerBalance.netBalance).toBeCloseTo(0, 2);
    expect(memberBalance.netBalance).toBeCloseTo(0, 2);
    expect(res.body.data.settlements).toHaveLength(0);
  });

  it('forbids non-members from viewing balances', async () => {
    const { cookie: ownerCookie } = await registerUser();
    const { cookie: outsiderCookie } = await registerUser();
    const group = await createGroup(ownerCookie);

    const res = await request(app).get(`/groups/${group.id}/balances`).set('Cookie', outsiderCookie);
    expect(res.status).toBe(403);
  });
});
