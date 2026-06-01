function requireEnv(env, name) {
  if (!env[name]) {
    throw new Response(JSON.stringify({ ok: false, error: `Missing environment variable: ${name}` }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  }

  return env[name];
}

function textToBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToText(base64) {
  const binary = atob(base64.replace(/\s/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new TextDecoder().decode(bytes);
}

function repoConfig(env) {
  return {
    owner: env.GITHUB_OWNER || "raylee30",
    repo: env.GITHUB_REPO || "media-dental",
    branch: env.GITHUB_BRANCH || "main",
    token: requireEnv(env, "GITHUB_TOKEN")
  };
}

async function githubRequest(env, path, options = {}) {
  const { owner, repo, token } = repoConfig(env);
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}${path}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "meijia-dental-admin",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers || {})
    }
  });

  if (response.status === 404) {
    return null;
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Response(JSON.stringify({ ok: false, error: data?.message || "GitHub API request failed." }), {
      status: response.status,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  }

  return data;
}

export async function getFile(env, path) {
  const { branch } = repoConfig(env);
  const data = await githubRequest(env, `/contents/${encodeURIComponentPath(path)}?ref=${encodeURIComponent(branch)}`);

  if (!data) {
    return null;
  }

  return {
    sha: data.sha,
    content: base64ToText(data.content || "")
  };
}

export async function putTextFile(env, path, content, message) {
  const { branch } = repoConfig(env);
  const current = await getFile(env, path);
  const body = {
    message,
    content: textToBase64(content),
    branch
  };

  if (current?.sha) {
    body.sha = current.sha;
  }

  return githubRequest(env, `/contents/${encodeURIComponentPath(path)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

export async function putBase64File(env, path, base64Content, message) {
  const { branch } = repoConfig(env);
  const current = await getFile(env, path);
  const body = {
    message,
    content: base64Content,
    branch
  };

  if (current?.sha) {
    body.sha = current.sha;
  }

  return githubRequest(env, `/contents/${encodeURIComponentPath(path)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

export async function deleteFile(env, path, message) {
  const { branch } = repoConfig(env);
  const current = await getFile(env, path);

  if (!current?.sha) {
    return null;
  }

  return githubRequest(env, `/contents/${encodeURIComponentPath(path)}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      sha: current.sha,
      branch
    })
  });
}

export async function getJsonFile(env, path) {
  const file = await getFile(env, path);
  return file ? JSON.parse(file.content) : null;
}

export async function putJsonFile(env, path, data, message) {
  return putTextFile(env, path, `${JSON.stringify(data, null, 2)}\n`, message);
}

export async function listDirectory(env, path) {
  const { branch } = repoConfig(env);
  const data = await githubRequest(env, `/contents/${encodeURIComponentPath(path)}?ref=${encodeURIComponent(branch)}`);

  return Array.isArray(data) ? data : [];
}

export async function listJsonFiles(env, path) {
  const files = await listDirectory(env, path);
  const jsonFiles = files.filter((item) => item.type === "file" && item.name.endsWith(".json"));
  const result = [];

  for (const file of jsonFiles) {
    const item = await getJsonFile(env, `${path}/${file.name}`);
    result.push(item);
  }

  return result;
}

export function encodeURIComponentPath(path) {
  return path.split("/").map((part) => encodeURIComponent(part)).join("/");
}
