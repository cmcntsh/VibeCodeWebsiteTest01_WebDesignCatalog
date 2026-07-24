(() => {
  'use strict';

  const forms = [...document.querySelectorAll('[data-contact-form]')];
  const TOKEN_REFRESH_MARGIN_MS = 60_000;
  const REQUEST_TIMEOUT_MS = 30_000;

  const delay = milliseconds => new Promise(resolve => window.setTimeout(resolve, milliseconds));

  forms.forEach(form => {
    const status = form.querySelector('[data-form-status]');
    const submit = form.querySelector('[type="submit"]');
    const tokenField = form.querySelector('[name="csrf_token"]');
    let tokenExpiresAt = 0;
    let tokenUsableAt = 0;
    let tokenPromise = null;

    const setStatus = (message, state = '') => {
      if (!status) return;
      status.textContent = message;
      status.dataset.state = state;
      status.setAttribute('role', state === 'error' ? 'alert' : 'status');
    };

    const getTokenUrl = () => {
      const url = new URL(form.getAttribute('action') || 'contact-handler.php', window.location.href);
      url.searchParams.set('action', 'token');
      return url;
    };

    const requestToken = async (force = false) => {
      if (!tokenField) throw new Error('The protected form is missing its security field.');
      const isFresh = tokenField.value && Date.now() < tokenExpiresAt - TOKEN_REFRESH_MARGIN_MS;
      if (!force && isFresh) return tokenField.value;
      if (!force && tokenPromise) return tokenPromise;

      tokenPromise = (async () => {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        try {
          const response = await fetch(getTokenUrl(), {
            method: 'GET',
            headers: {'Accept': 'application/json'},
            credentials: 'same-origin',
            cache: 'no-store',
            signal: controller.signal,
          });
          let payload = {};
          try { payload = await response.json(); } catch (_) {}
          if (!response.ok || !payload.token) {
            throw new Error(payload.message || 'The form security service is unavailable.');
          }
          const now = Date.now();
          tokenField.value = payload.token;
          tokenExpiresAt = now + Math.max(300, Number(payload.expiresIn) || 7200) * 1000;
          tokenUsableAt = now + Math.max(500, Number(payload.minimumDelayMs) || 2500) + 100;
          return payload.token;
        } finally {
          window.clearTimeout(timeout);
          tokenPromise = null;
        }
      })();

      return tokenPromise;
    };

    const prepareToken = async (force = false) => {
      await requestToken(force);
      const remaining = tokenUsableAt - Date.now();
      if (remaining > 0) await delay(remaining);
    };

    const sendForm = async () => {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const response = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: {'Accept': 'application/json'},
          credentials: 'same-origin',
          signal: controller.signal,
        });
        let payload = {};
        try { payload = await response.json(); } catch (_) {}
        return {response, payload};
      } finally {
        window.clearTimeout(timeout);
      }
    };

    const primeToken = () => {
      requestToken().catch(() => {
        // Defer the visible error until submission so the page remains usable.
      });
    };

    form.addEventListener('focusin', primeToken, {once: true});
    form.addEventListener('pointerdown', primeToken, {once: true});
    primeToken();

    form.addEventListener('submit', async event => {
      event.preventDefault();
      setStatus('');
      if (!form.checkValidity()) {
        form.reportValidity();
        setStatus('Please review the highlighted fields.', 'error');
        return;
      }

      const originalLabel = submit ? submit.textContent : '';
      if (submit) {
        submit.disabled = true;
        submit.setAttribute('aria-busy', 'true');
        submit.textContent = submit.dataset.loadingLabel || 'Sending…';
      }
      form.setAttribute('aria-busy', 'true');

      try {
        await prepareToken();
        let result = await sendForm();
        if (result.response.status === 419) {
          await prepareToken(true);
          result = await sendForm();
        }
        if (!result.response.ok) {
          const reference = result.payload.requestId ? ` Reference: ${result.payload.requestId}.` : '';
          throw new Error((result.payload.message || 'The message could not be sent.') + reference);
        }

        setStatus(result.payload.message || 'Thank you. Your message has been sent.', 'success');
        form.reset();
        tokenField.value = '';
        tokenExpiresAt = 0;
        tokenUsableAt = 0;
        requestToken(true).catch(() => {});
      } catch (error) {
        const message = error?.name === 'AbortError'
          ? 'The request timed out. Check your connection and try again.'
          : error?.message || 'The message could not be sent. Please try again.';
        setStatus(message, 'error');
      } finally {
        if (submit) {
          submit.disabled = false;
          submit.removeAttribute('aria-busy');
          submit.textContent = originalLabel;
        }
        form.removeAttribute('aria-busy');
      }
    });
  });
})();
