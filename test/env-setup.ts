process.env.JWT_SECRET = 'test-secret';
process.env.BOOTSTRAP_USERNAME = 'root';
process.env.BOOTSTRAP_PASSWORD = 'changeme';
process.env.BOOTSTRAP_ORG_ID = 'org-local';
delete process.env.DATABASE_URL;
