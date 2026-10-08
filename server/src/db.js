import 'dotenv/config';
import pg from 'pg';
export const pool = new pg.Pool({connectionString:process.env.DATABASE_URL, max:10, ssl:process.env.DATABASE_URL?.includes('sslmode=require')?{rejectUnauthorized:true}:undefined});
export const query = (sql,params=[])=>pool.query(sql,params);
export async function tx(work){const client=await pool.connect();try{await client.query('BEGIN');const out=await work(client);await client.query('COMMIT');return out}catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}}
