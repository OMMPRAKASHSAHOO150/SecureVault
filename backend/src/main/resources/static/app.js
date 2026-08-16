const api = '/api/auth';
const state = { email: '', otp: '' };

const els = {
  message: document.getElementById('message'),
  requestForm: document.getElementById('requestForm'),
  verifyForm: document.getElementById('verifyForm'),
  resetForm: document.getElementById('resetForm'),
  backToEmail: document.getElementById('backToEmail'),
  email: document.getElementById('email'),
  otp: document.getElementById('otp'),
  newPassword: document.getElementById('newPassword'),
  confirmPassword: document.getElementById('confirmPassword'),
  steps: [...document.querySelectorAll('[data-step-indicator]')],
};

function showMessage(text, type = 'success') {
  els.message.textContent = text;
  els.message.className = `message ${type}`;
}

function hideMessage() {
  els.message.className = 'message hidden';
  els.message.textContent = '';
}

function setStep(step) {
  els.steps.forEach(el => el.classList.toggle('active', el.dataset.stepIndicator === step));
  els.requestForm.classList.toggle('hidden', step !== 'request');
  els.verifyForm.classList.toggle('hidden', step !== 'verify');
  els.resetForm.classList.toggle('hidden', step !== 'reset');
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload.message || 'Request failed');
  return payload;
}

els.requestForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideMessage();
  state.email = els.email.value.trim();
  try {
    const res = await postJson(`${api}/forgot-password`, { email: state.email });
    showMessage(res.message || 'OTP sent to your email.');
    setStep('verify');
  } catch (err) {
    showMessage(err.message, 'error');
  }
});

els.verifyForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideMessage();
  state.otp = els.otp.value.trim();
  try {
    const res = await postJson(`${api}/verify-reset-otp`, { email: state.email, otp: state.otp });
    showMessage(res.message || 'OTP verified.');
    setStep('reset');
  } catch (err) {
    showMessage(err.message, 'error');
  }
});

els.resetForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideMessage();
  const newPassword = els.newPassword.value;
  const confirmPassword = els.confirmPassword.value;
  if (newPassword !== confirmPassword) {
    showMessage('Passwords do not match.', 'error');
    return;
  }
  try {
    const res = await postJson(`${api}/reset-password`, {
      email: state.email,
      otp: state.otp,
      newPassword,
    });
    showMessage(res.message || 'Password reset successful.');
    els.requestForm.reset();
    els.verifyForm.reset();
    els.resetForm.reset();
    setStep('request');
  } catch (err) {
    showMessage(err.message, 'error');
  }
});

els.backToEmail.addEventListener('click', () => {
  hideMessage();
  state.otp = '';
  els.verifyForm.reset();
  setStep('request');
});

setStep('request');
