import fs from 'fs-extra';

await fs.copy('database', 'dist/database');

console.log('Database copied to dist/database');