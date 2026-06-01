INSERT INTO users (id, username, email, name, role, password_hash, active)
SELECT
  'usr_default_admin',
  'admin',
  'admin@meijia-dental.local',
  'admin',
  'admin',
  'pbkdf2$100000$B151QCcXDZ7r-gBBSZ3CSQ$1SSYwvXpKs9Hb8T-YtZOPAM1sCMR2SqUUbglEDyS_38',
  1
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE username = 'admin'
);
