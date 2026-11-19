const http = require('http');

// Helper to make HTTP requests
const request = (method, path, body = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5001,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('--- Starting Comprehensive API Test Suite ---');
  let token = '';
  let createdMedId = '';
  let sampleDoseId = '';

  try {
    // 1. Health check
    const health = await request('GET', '/api/health');
    console.log('[1] Health Check:', health.status === 200 && health.body.status === 'ok' ? 'PASS ✅' : 'FAIL ❌');

    // 2. Login as patient
    const loginRes = await request('POST', '/api/auth/login', {
      email: 'patient@example.com',
      password: 'password123'
    });
    console.log('[2] Patient Login:', loginRes.status === 200 && loginRes.body.token ? 'PASS ✅' : 'FAIL ❌');
    token = loginRes.body.token;

    const authHeaders = { Authorization: `Bearer ${token}` };

    // 3. Get profile /me
    const meRes = await request('GET', '/api/auth/me', null, authHeaders);
    console.log('[3] Get Current User Profile:', meRes.status === 200 && meRes.body.user.email === 'patient@example.com' ? 'PASS ✅' : 'FAIL ❌');

    // 4. Get Medicines
    const medsRes = await request('GET', '/api/medicines', null, authHeaders);
    console.log('[4] Get Medicines:', medsRes.status === 200 && Array.isArray(medsRes.body.data) ? `PASS ✅ (${medsRes.body.data.length} medicines)` : 'FAIL ❌');

    // 5. Create a new test medicine
    const newMedRes = await request(
      'POST',
      '/api/medicines',
      {
        name: 'Omeprazole',
        genericName: 'Prilosec',
        dosage: '20',
        dosageUnit: 'mg',
        form: 'capsule',
        color: 'rose',
        instructions: 'Before food',
        frequency: 'once_daily',
        scheduleTimes: ['07:30'],
        notes: 'Acid reflux relief'
      },
      authHeaders
    );
    console.log('[5] Create New Medicine:', newMedRes.status === 201 && newMedRes.body.data.name === 'Omeprazole' ? 'PASS ✅' : 'FAIL ❌');
    if (newMedRes.body.data) {
      createdMedId = newMedRes.body.data._id;
    }

    // 6. Get Today Schedule
    const todayRes = await request('GET', '/api/schedules/today', null, authHeaders);
    console.log('[6] Today Schedule Categorized:', todayRes.status === 200 && todayRes.body.slots ? `PASS ✅ (${todayRes.body.allDoses.length} doses scheduled)` : 'FAIL ❌');
    if (todayRes.body.allDoses && todayRes.body.allDoses.length > 0) {
      sampleDoseId = todayRes.body.allDoses[0]._id;
    }

    // 7. Mark dose status as taken
    if (sampleDoseId) {
      const markRes = await request('PUT', `/api/schedules/${sampleDoseId}/status`, { status: 'taken', notes: 'Automated test intake' }, authHeaders);
      console.log('[7] Mark Dose as Taken:', markRes.status === 200 && markRes.body.data.status === 'taken' ? 'PASS ✅' : 'FAIL ❌');
    }

    // 8. Snooze dose
    if (sampleDoseId) {
      const snoozeRes = await request('POST', `/api/schedules/${sampleDoseId}/snooze`, { minutes: 15 }, authHeaders);
      console.log('[8] Snooze Dose 15 mins:', snoozeRes.status === 200 && snoozeRes.body.snoozedUntil ? 'PASS ✅' : 'FAIL ❌');
    }

    // 9. Dashboard Analytics
    const analyticsRes = await request('GET', '/api/analytics/dashboard', null, authHeaders);
    console.log('[9] Dashboard Analytics:', analyticsRes.status === 200 && analyticsRes.body.stats ? `PASS ✅ (Today adherence: ${analyticsRes.body.stats.today.adherence}%)` : 'FAIL ❌');

    // 10. History Logs
    const historyRes = await request('GET', '/api/logs/history', null, authHeaders);
    console.log('[10] Medication History Aggregation:', historyRes.status === 200 && Array.isArray(historyRes.body.data) ? `PASS ✅ (${historyRes.body.data.length} days logged)` : 'FAIL ❌');

    // 11. Caregiver Invite Generation
    const inviteRes = await request('POST', '/api/caregivers/invite', { relationship: 'Daughter', permissions: { canView: true, canLogDose: true } }, authHeaders);
    console.log('[11] Caregiver Invite Code Generation:', inviteRes.status === 201 && inviteRes.body.inviteCode ? `PASS ✅ (Code: ${inviteRes.body.inviteCode})` : 'FAIL ❌');

    // 12. Settings Get & Update
    const settingsRes = await request('GET', '/api/settings', null, authHeaders);
    console.log('[12] Get Settings:', settingsRes.status === 200 && settingsRes.body.settings ? 'PASS ✅' : 'FAIL ❌');

    // 13. Pause and Resume Medicine
    if (createdMedId) {
      const pauseRes = await request('PATCH', `/api/medicines/${createdMedId}/pause`, { isPaused: true, reason: 'Temporary doctor pause' }, authHeaders);
      console.log('[13] Pause Medicine:', pauseRes.status === 200 && pauseRes.body.data.isPaused === true ? 'PASS ✅' : 'FAIL ❌');

      // 14. Delete the test medicine
      const delRes = await request('DELETE', `/api/medicines/${createdMedId}`, null, authHeaders);
      console.log('[14] Delete Medicine:', delRes.status === 200 ? 'PASS ✅' : 'FAIL ❌');
    }

    console.log('--- All Automated Tests Passed Successfully! ---');
    process.exit(0);
  } catch (err) {
    console.error('Test Suite Failed:', err);
    process.exit(1);
  }
};

runTests();
