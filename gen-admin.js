import('./functions/api/lib/auth.js').then(async (auth) => {
  const hash = await auth.hashPassword('Htmsxzs7');
  const sql = `INSERT OR IGNORE INTO users (id,username,password_hash,role,is_active,created_at,updated_at) VALUES ('user-admin-001','admin','${hash}','admin',1,datetime('now'),datetime('now'));`;
  require('fs').writeFileSync('admin.sql', sql, 'utf8');
});
