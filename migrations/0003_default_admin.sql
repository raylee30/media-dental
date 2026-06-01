INSERT INTO users (id, username, email, name, role, password_hash, active)
SELECT
  'usr_default_admin',
  'admin',
  'admin@meijia-dental.local',
  'admin',
  'admin',
  'pbkdf2$120000$rphcJYTw7qdXVR46PTYR2g$id1hMA02RytzPlcNkjkK9YiKj51Td5WXYoVEr9eSlh8',
  1
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE username = 'admin'
);
