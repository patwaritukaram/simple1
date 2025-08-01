// filename: ecarehealth-api-flow.spec.js

const { test, expect, request } = require('@playwright/test');

test('eCareHealth Full API Execution Flow', async ({ playwright }) => {
  const apiContext = await request.newContext({
    baseURL: 'https://stage-api.ecarehealth.com',
    extraHTTPHeaders: {
      'Content-Type': 'application/json'
    }
  });

  // 1. Login
  const loginRes = await apiContext.post('/api/master/login', {
    data: {
      username: 'rose.gomez@jourrapide.com',
      password: 'Pass@123',
      xTENANTID: 'stage_aithinkitive'
    }
  });
  expect(loginRes.status()).toBe(200);
  const { access_token } = await loginRes.json();

  const authHeaders = {
    Authorization: `Bearer ${access_token}`,
    'Content-Type': 'application/json',
    'xTENANTID': 'stage_aithinkitive'
  };

  // 2. Add Provider
  const providerData = {
    code: 'ENTITY',
    name: 'Steven Miller',
    gender: 'Male',
    email: `steven${Date.now()}@test.com`,
    phone: '9876543210',
    specialization: 'General Physician',
    experience: 5
  };

  const addProviderRes = await apiContext.post('/api/master/provider', {
    headers: authHeaders,
    data: providerData
  });
  expect(addProviderRes.status()).toBe(201);
  const addProviderBody = await addProviderRes.json();
  expect(addProviderBody.message).toContain('Provider created successfully.');

  // 3. Get Provider UUID
  const getProvidersRes = await apiContext.get('/api/master/provider?page=0&size=20', {
    headers: authHeaders
  });
  expect(getProvidersRes.status()).toBe(200);
  const { data: providers } = await getProvidersRes.json();
  const provider = providers.find(p => p.name === 'Steven Miller');
  const providerUUID = provider?.uuid;
  expect(providerUUID).toBeTruthy();

  // 4. Set Availability (Tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0]; // yyyy-mm-dd

  const availabilityPayload = {
    providerUUID,
    availability: [
      {
        date: dateStr,
        timeSlots: ['10:00', '10:30']
      }
    ]
  };

  const availabilityRes = await apiContext.post('/api/appointment/availability', {
    headers: authHeaders,
    data: availabilityPayload
  });
  const availabilityBody = await availabilityRes.json();
  expect(availabilityRes.status()).toBe(200);
  expect(availabilityBody.message).toContain('Availability added successfully');

  // 5. Create Patient
  const patientData = {
    firstName: 'John',
    lastName: 'Doe',
    email: `john${Date.now()}@test.com`,
    phone: '9876543211',
    gender: 'Male',
    age: 30
  };

  const createPatientRes = await apiContext.post('/api/patient', {
    headers: authHeaders,
    data: patientData
  });
  expect(createPatientRes.status()).toBe(201);
  const createPatientBody = await createPatientRes.json();
  expect(createPatientBody.message).toContain('Patient Details Added Successfully.');

  // 6. Get Patient UUID
  const getPatientsRes = await apiContext.get('/api/patient?page=0&size=20', {
    headers: authHeaders
  });
  expect(getPatientsRes.status()).toBe(200);
  const { data: patients } = await getPatientsRes.json();
  const patient = patients.find(p => p.email === patientData.email);
  const patientUUID = patient?.uuid;
  expect(patientUUID).toBeTruthy();

  // 7. Book Appointment
  const appointmentPayload = {
    providerUUID,
    patientUUID,
    date: dateStr,
    slot: '10:00'
  };

  const appointmentRes = await apiContext.post('/api/appointment/book', {
    headers: authHeaders,
    data: appointmentPayload
  });
  expect(appointmentRes.status()).toBe(200);
  const appointmentBody = await appointmentRes.json();
  expect(appointmentBody.message).toContain('Appointment booked successfully.');

  console.log('\n✅ All API steps completed and validated successfully!');
});
