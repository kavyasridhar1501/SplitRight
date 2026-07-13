const request = require('supertest');
const { app, registerUser, createGroup } = require('./helpers');

describe('POST /groups/:id/settlements', () => {
  it('records a settlement and marks matching splits as settled', async () => {
    const { cookie: ownerCookie, user: owner } = await registerUser();
    const { cookie: memberCookie, user: member } = await registerUser();
    const group = await createGroup(ownerCookie);
    await request(app).post('/groups/join').set('Cookie', memberCookie).send({ invite_code: group.invite_code });

    await request(app)
      .post(`/groups/${group.id}/expenses`)
      .set('Cookie', ownerCookie)
      .send({ title: 'Rent', amount: 100, paid_by: owner.id, split_type: 'equal' });

    const res = await request(app)
      .post(`/groups/${group.id}/settlements`)
      .set('Cookie', memberCookie)
      .send({ from_user_id: member.id, to_user_id: owner.id, amount: 50, note: 'Venmo' });

    expect(res.status).toBe(201);
    expect(res.body.data.settlement.note).toBe('Venmo');

    const balances = await request(app).get(`/groups/${group.id}/balances`).set('Cookie', ownerCookie);
    const memberBalance = balances.body.data.balances.find((b) => b.user.id === member.id);
    expect(memberBalance.netBalance).toBeCloseTo(0, 2);
  });

  it('rejects a non-positive amount', async () => {
    const { cookie, user } = await registerUser();
    const group = await createGroup(cookie);
    const res = await request(app)
      .post(`/groups/${group.id}/settlements`)
      .set('Cookie', cookie)
      .send({ from_user_id: user.id, to_user_id: user.id, amount: 0 });
    expect(res.status).toBe(400);
  });

  it('forbids non-members from recording a settlement', async () => {
    const { cookie: ownerCookie, user: owner } = await registerUser();
    const { cookie: outsiderCookie, user: outsider } = await registerUser();
    const group = await createGroup(ownerCookie);

    const res = await request(app)
      .post(`/groups/${group.id}/settlements`)
      .set('Cookie', outsiderCookie)
      .send({ from_user_id: outsider.id, to_user_id: owner.id, amount: 10 });
    expect(res.status).toBe(403);
  });
});

describe('GET /groups/:id/settlements', () => {
  it('returns settlement history newest first', async () => {
    const { cookie: ownerCookie, user: owner } = await registerUser();
    const { cookie: memberCookie, user: member } = await registerUser();
    const group = await createGroup(ownerCookie);
    await request(app).post('/groups/join').set('Cookie', memberCookie).send({ invite_code: group.invite_code });

    await request(app)
      .post(`/groups/${group.id}/settlements`)
      .set('Cookie', memberCookie)
      .send({ from_user_id: member.id, to_user_id: owner.id, amount: 20 });
    await request(app)
      .post(`/groups/${group.id}/settlements`)
      .set('Cookie', memberCookie)
      .send({ from_user_id: member.id, to_user_id: owner.id, amount: 5 });

    const res = await request(app).get(`/groups/${group.id}/settlements`).set('Cookie', ownerCookie);
    expect(res.status).toBe(200);
    expect(res.body.data.settlements).toHaveLength(2);
    expect(parseFloat(res.body.data.settlements[0].amount)).toBe(5);
  });
});
