import 'dotenv/config';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import {rateLimit} from 'express-rate-limit';
import {authOptional,registerAuth} from './auth.js';
import {registerStore} from './routes.js';
import {registerOrders,expireOldPayments} from './orders.js';
import {registerPayments} from './payments.js';
import {registerAdmin} from './admin.js';
import {registerUploads} from './uploads.js';
if(!process.env.JWT_SECRET||process.env.JWT_SECRET.length<32){console.error('Set a JWT_SECRET of at least 32 characters in server/.env');process.exit(1)}
const app=express();app.disable('x-powered-by');app.set('trust proxy',1);
const origins=(process.env.WEB_ORIGIN||'http://localhost:5173').split(',').map(s=>s.trim().replace(/\/$/,''));
app.use(helmet());app.use(cors({origin:(origin,cb)=>cb(null,!origin||origins.includes(origin)),credentials:true}));
// Reject cross-origin state changes even when SameSite rules differ across browsers.
app.use((req,res,next)=>{if(['GET','HEAD','OPTIONS'].includes(req.method)||req.path.startsWith('/api/payments/ssl/'))return next();const origin=req.get('Origin');if(origin&&!origins.includes(origin))return res.status(403).json({error:'Invalid request origin'});if(!origin&&process.env.COOKIE_SAMESITE==='none'&&req.get('Cookie')?.includes('dinehub_session'))return res.status(403).json({error:'Origin header required'});next()});
app.use(express.json({limit:'100kb'}));app.use(express.urlencoded({extended:false,limit:'100kb'}));app.use(cookieParser());
app.use('/api/auth',rateLimit({windowMs:15*60*1000,limit:80,standardHeaders:'draft-7',legacyHeaders:false}));
app.use('/api/auth/login',rateLimit({windowMs:15*60*1000,limit:10,standardHeaders:'draft-7',legacyHeaders:false}));
app.use('/api/orders',rateLimit({windowMs:15*60*1000,limit:100,standardHeaders:'draft-7',legacyHeaders:false}));
app.use(authOptional);registerAuth(app);registerStore(app);registerOrders(app);registerPayments(app);registerAdmin(app);registerUploads(app);
app.post('/api/internal/expire-payments',async(req,res)=>{if(!process.env.CRON_SECRET||req.get('Authorization')!==`Bearer ${process.env.CRON_SECRET}`)return res.status(403).json({error:'Forbidden'});await expireOldPayments();res.json({ok:true})});
app.use((req,res)=>res.status(404).json({error:'Endpoint not found'}));
app.use((error,req,res,next)=>{if(error.code==='LIMIT_FILE_SIZE')return res.status(413).json({error:'Maximum image size is 5 MB'});if(error.code==='23505')return res.status(409).json({error:'Record already exists'});if(error.code==='23503')return res.status(400).json({error:'Related category/product missing'});if(error.code==='22P02')return res.status(400).json({error:'Invalid identifier'});console.error(error);res.status(error.status||500).json({error:error.status?error.message:'Internal server error'})});
const port=Number(process.env.PORT||4000);app.listen(port,()=>console.log(`DineHub API listening on http://localhost:${port}`));
