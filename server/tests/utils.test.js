import test from 'node:test';import assert from 'node:assert/strict';import {shippingFor,discountFor,cleanEmail} from '../src/utils.js';
test('shipping uses Dhaka rate only in Dhaka',()=>{assert.equal(shippingFor('Dhaka'),80);assert.equal(shippingFor('Chattogram'),140)});
test('coupon percent and fixed discounts cap at subtotal',()=>{assert.equal(discountFor({active:true,type:'PERCENT',value:15,min_subtotal:100,used_count:0},1000),150);assert.equal(discountFor({active:true,type:'FIXED',value:5000,min_subtotal:0,used_count:0},1000),1000)});
test('expired, exhausted and below minimum coupons fail',()=>{assert.equal(discountFor({active:true,type:'PERCENT',value:50,min_subtotal:1000,used_count:0},500),0);assert.equal(discountFor({active:true,type:'PERCENT',value:50,min_subtotal:0,max_uses:3,used_count:3},2000),0)});
test('normalized email',()=>assert.equal(cleanEmail('  SHOP@Example.COM  '),'shop@example.com'));
