const request = require('supertest');
const { app, registerUser, createGroup } = require('./helpers');

describe('POST /groups', () => {
  it('creates a group with the creator as its first member', async () => {
    const { cookie } = await registerUser();
    const res = await request(app).post('/groups').set('Cookie', cookie).send({ name: 'Apt 4B' });

    expect(res.status).toBe(201);
    expect(res.body.data.group.name).toBe('Apt 4B');
    expect(res.body.data.group.member_count).toBe(1);
    expect(res.body.data.group.invite_code).toHaveLength(8);
  });

  it('rejects an empty group name', async () => {
    const { cookie } = await registerUser();
    const res = await request(app).post('/groups').set('Cookie', cookie).send({ name: '   ' });
    expect(res.status).toBe(400);
  });

  it('requires authentication', async () => {
    const res = await request(app).post('/groups').send({ name: 'No Auth' });
    expect(res.status).toBe(401);
  });
});

describe('GET /groups', () => {
  it("lists only the current user's groups", async () => {
    const { cookie: cookieA } = await registerUser();
    const { cookie: cookieB } = await registerUser();
    await createGroup(cookieA, 'Group A');
    await createGroup(cookieB, 'Group B');

    const res = await request(app).get('/groups').set('Cookie', cookieA);
    expect(res.status).toBe(200);
    expect(res.body.data.groups).toHaveLength(1);
    expect(res.body.data.groups[0].name).toBe('Group A');
  });
});

describe('POST /groups/join', () => {
  it('joins a group via invite code', async () => {
    const { cookie: owner } = await registerUser();
    const { cookie: joiner } = await registerUser();
    const group = await createGroup(owner);

    const res = await request(app).post('/groups/join').set('Cookie', joiner).send({ invite_code: group.invite_code });
    expect(res.status).toBe(200);
    expect(res.body.data.group.member_count).toBe(2);
  });

  it('is case-insensitive on invite codes', async () => {
    const { cookie: owner } = await registerUser();
    const { cookie: joiner } = await registerUser();
    const group = await createGroup(owner);

    const res = await request(app)
      .post('/groups/join')
      .set('Cookie', joiner)
      .send({ invite_code: group.invite_code.toLowerCase() });
    expect(res.status).toBe(200);
  });

  it('returns 404 for an unknown invite code', async () => {
    const { cookie } = await registerUser();
    const res = await request(app).post('/groups/join').set('Cookie', cookie).send({ invite_code: 'NOPE0000' });
    expect(res.status).toBe(404);
  });

  it('rejects joining a group twice', async () => {
    const { cookie: owner } = await registerUser();
    const { cookie: joiner } = await registerUser();
    const group = await createGroup(owner);
    await request(app).post('/groups/join').set('Cookie', joiner).send({ invite_code: group.invite_code });

    const res = await request(app).post('/groups/join').set('Cookie', joiner).send({ invite_code: group.invite_code });
    expect(res.status).toBe(409);
  });
});

describe('GET /groups/:id', () => {
  it('returns group details and members for a member', async () => {
    const { cookie } = await registerUser();
    const group = await createGroup(cookie);

    const res = await request(app).get(`/groups/${group.id}`).set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.data.group.id).toBe(group.id);
    expect(res.body.data.members).toHaveLength(1);
  });

  it('forbids access for non-members', async () => {
    const { cookie: owner } = await registerUser();
    const { cookie: outsider } = await registerUser();
    const group = await createGroup(owner);

    const res = await request(app).get(`/groups/${group.id}`).set('Cookie', outsider);
    expect(res.status).toBe(403);
  });
});

describe('DELETE /groups/:id/leave', () => {
  it('allows leaving when fully settled', async () => {
    const { cookie: owner } = await registerUser();
    const { cookie: joiner } = await registerUser();
    const group = await createGroup(owner);
    await request(app).post('/groups/join').set('Cookie', joiner).send({ invite_code: group.invite_code });

    const res = await request(app).delete(`/groups/${group.id}/leave`).set('Cookie', joiner);
    expect(res.status).toBe(200);
  });

  it('blocks leaving with an unsettled balance', async () => {
    const { cookie: owner, user: ownerUser } = await registerUser();
    const { cookie: joiner } = await registerUser();
    const group = await createGroup(owner);
    await request(app).post('/groups/join').set('Cookie', joiner).send({ invite_code: group.invite_code });

    await request(app)
      .post(`/groups/${group.id}/expenses`)
      .set('Cookie', owner)
      .send({ title: 'Rent', amount: 100, paid_by: ownerUser.id, split_type: 'equal' });

    const res = await request(app).delete(`/groups/${group.id}/leave`).set('Cookie', joiner);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/unsettled balance/);
  });
});
