import {query} from './db.js';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>`৳ ${Number(n||0).toLocaleString('en-BD')}`;
export async function sendOrderEmails(orderNo,event='placed'){
 if(!process.env.RESEND_API_KEY||!process.env.MAIL_FROM)return;
 const {rows}=await query('SELECT o.order_no,o.customer_name,o.email,o.phone,o.address,o.city,o.area,o.total,o.payment_method,o.payment_status, json_agg(json_build_object(\'name\',i.product_name,\'variant\',i.variant_name,\'quantity\',i.quantity)) items FROM orders o JOIN order_items i ON i.order_id=o.id WHERE o.order_no=$1 GROUP BY o.id',[orderNo]);
 if(!rows.length)return;const o=rows[0];const rowsHtml=o.items.map(i=>`<li>${esc(i.name)} (${esc(i.variant)}) × ${Number(i.quantity)}</li>`).join('');
 const subject=event==='paid'?`Payment confirmed: ${o.order_no}`:`Order received: ${o.order_no}`;
 const html=`<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#23402e"><h1 style="color:#174b33">DineHub</h1><h2>${event==='paid'?'Payment confirmed':'Thank you for your order'}</h2><p>Hello ${esc(o.customer_name)}, your order <b>${esc(o.order_no)}</b> has been ${event==='paid'?'paid successfully':'received'}.</p><ul>${rowsHtml}</ul><p><b>Total: ${money(o.total)}</b></p><p>Payment: ${esc(o.payment_method)} (${esc(o.payment_status)})</p><p>Delivery: ${esc(o.address)}, ${esc(o.area)}, ${esc(o.city)}</p><p>Keep your order ID for tracking.</p></div>`;
 const recipients=[o.email,process.env.ADMIN_NOTIFY_EMAIL].filter(Boolean);
 await Promise.allSettled(recipients.map(async(email)=>{const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{'Authorization':`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`dinehub-${orderNo}-${event}-${Buffer.from(email).toString('hex').slice(0,40)}`},body:JSON.stringify({from:process.env.MAIL_FROM,to:[email],subject,html}),signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error(`Resend ${r.status}: ${await r.text()}`)})).then(results=>results.forEach(r=>{if(r.status==='rejected')console.error('Email notification failed:',r.reason?.message)}));
}
