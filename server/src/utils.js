import {randomBytes} from 'node:crypto';
export const newid=()=>randomBytes(15).toString('hex');
export const bdMoney=n=>`৳ ${Number(n||0).toLocaleString('en-BD')}`;
export function shippingFor(city){return String(city||'').trim().toLowerCase()==='dhaka'?Number(process.env.SHIPPING_DHAKA||80):Number(process.env.SHIPPING_OUTSIDE||140)}
export function discountFor(coupon,subtotal){if(!coupon||!coupon.active||subtotal<coupon.min_subtotal||coupon.expires_at&&new Date(coupon.expires_at)<new Date()||coupon.max_uses!=null&&coupon.used_count>=coupon.max_uses)return 0;return Math.min(subtotal,coupon.type==='PERCENT'?Math.floor(subtotal*coupon.value/100):coupon.value)}
export const httpError=(status,message)=>Object.assign(new Error(message),{status});
export function safeUser(u){return u?{id:u.id,name:u.name,email:u.email,phone:u.phone,role:u.role}:null}
export const cleanEmail=s=>String(s||'').trim().toLowerCase();
