UPDATE users
SET
  password_hash = 'pbkdf2$100000$B151QCcXDZ7r-gBBSZ3CSQ$1SSYwvXpKs9Hb8T-YtZOPAM1sCMR2SqUUbglEDyS_38',
  updated_at = CURRENT_TIMESTAMP
WHERE username = 'admin';
