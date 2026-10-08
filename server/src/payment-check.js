/** Validate SSLCommerz merchant API result against the immutable server-side order record. */
export function matchesPayment(result,order,storeId){
 const status=String(result?.status||'').toUpperCase();
 const amount=Number(result?.amount);
 return ['VALID','VALIDATED'].includes(status)
  && String(result?.tran_id||'')===order.transaction_id
  && Number.isFinite(amount)
  && Math.abs(amount-order.total)<0.01
  && String(result?.currency||result?.currency_type||'').toUpperCase()==='BDT'
  && (!result.store_id||result.store_id===storeId)
  && String(result?.risk_level??'0')!=='1';
}

/** Release an SSL reserved order only after merchant transaction query confirms terminal non-payment. */
export function providerConfirmsNonPayment(query){return String(query?.APIConnect||'').toUpperCase()==='DONE'&&['FAILED','CANCELLED','EXPIRED','UNATTEMPTED'].includes(String(query?.status||'').toUpperCase())}
