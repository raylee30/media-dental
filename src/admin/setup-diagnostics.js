(() => {
  const send = window.fetch.bind(window);
  const output = document.getElementById('setup-diagnostics');
  const setupEndpoint = 'https://cms-auth.mjsmiles.com/v1/setup/github';

  const showError = (message) => {
    output.textContent = message;
    output.hidden = false;
    Object.assign(output.style, {
      position: 'fixed',
      right: '1rem',
      bottom: '1rem',
      left: '1rem',
      zIndex: '10000',
      padding: '0.75rem 1rem',
      border: '1px solid #a11',
      borderRadius: '0.5rem',
      color: '#781515',
      background: '#fff4f4',
      font: '16px/1.5 system-ui',
      overflowWrap: 'anywhere',
    });
  };

  window.fetch = async (resource, options) => {
    if (String(resource) !== setupEndpoint || options?.method !== 'POST') {
      return send(resource, options);
    }

    output.hidden = true;
    let request = options;

    if (typeof options.body === 'string') {
      const body = JSON.parse(options.body);
      if (body.repo === 'raylee30/media-dental') {
        // This repository is owned by a personal GitHub account.
        request = { ...options, body: JSON.stringify({ ...body, owner_type: 'User' }) };
      }
    }

    try {
      const response = await send(resource, request);
      if (!response.ok) {
        const result = await response.clone().json().catch(() => null);
        const detail = result?.error?.message ?? '服务没有返回详细说明';
        showError(`连接 GitHub 失败（HTTP ${response.status}）：${detail}`);
      }
      return response;
    } catch (error) {
      showError('预览后台无法连接登录服务。请检查浏览器网络连接。');
      throw error;
    }
  };
})();
