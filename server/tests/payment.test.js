import test from 'node:test';import assert from 'node:assert/strict';import {matchesPayment,providerConfirmsNonPayment} from '../src/payment-check.js';
const o={transaction_id:'DH_abc123',total:2490};
const valid={status:'VALID',tran_id:'DH_abc123',amount:'2490.00',currency:'BDT',store_id:'shop123',risk_level:'0'};
test('accepts a merchant-validated matching transaction',()=>assert.equal(matchesPayment(valid,o,'shop123'),true));
test('rejects forged or altered payment amount',()=>assert.equal(matchesPayment({...valid,amount:10},o,'shop123'),false));
test('rejects different transaction ID',()=>assert.equal(matchesPayment({...valid,tran_id:'DH_other'},o,'shop123'),false));
test('rejects failed or risky payments',()=>{assert.equal(matchesPayment({...valid,status:'FAILED'},o,'shop123'),false);assert.equal(matchesPayment({...valid,risk_level:'1'},o,'shop123'),false)});
test('rejects other currencies and merchant stores',()=>{assert.equal(matchesPayment({...valid,currency:'USD'},o,'shop123'),false);assert.equal(matchesPayment({...valid,store_id:'attacker'},o,'shop123'),false)});
test('stock release requires explicit terminal nonpayment confirmation',()=>{assert.equal(providerConfirmsNonPayment({APIConnect:'DONE',status:'FAILED'}),true);assert.equal(providerConfirmsNonPayment({APIConnect:'DONE',status:'PENDING'}),false);assert.equal(providerConfirmsNonPayment({APIConnect:'FAILED',status:'FAILED'}),false);assert.equal(providerConfirmsNonPayment({APIConnect:'DONE',status:'VALID'}),false)});
