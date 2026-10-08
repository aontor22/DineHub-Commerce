import {readFile} from 'node:fs/promises';
import {pool} from './db.js';
try {const sql=await readFile(new URL('../sql/schema.sql',import.meta.url),'utf8');await pool.query(sql);console.log('Database schema created. Run npm run db:seed -w server');}catch(e){console.error(e);process.exitCode=1}finally{await pool.end()}
