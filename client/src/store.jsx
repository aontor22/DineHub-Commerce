import{track}from'./analytics.js';
import React,{createContext,useCallback,useContext,useEffect,useMemo,useState} from 'react';
const Ctx=createContext(null);
const API=(import.meta.env.VITE_API_URL||'/api').replace(/\/$/,'');
export async function api(path,options={}){let response;try{response=await fetch(API+path,{credentials:'include',...options,headers:{...(options.body?{'Content-Type':'application/json'}:{}),...options.headers}})}catch{throw new Error('Cannot reach server. Check your internet and API connection.')}let data;try{data=await response.json()}catch{data={}}if(!response.ok)throw new Error(data.error||`Request failed (${response.status})`);return data}
function local(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}}
export const money=(n)=>`৳ ${Number(n||0).toLocaleString('en-BD')}`;
export function StoreProvider({children}){const [user,setUser]=useState(null),[authLoading,setAuthLoading]=useState(true),[cart,setCart]=useState(()=>local('dh_cart',[])),[wishlist,setWishlist]=useState(()=>local('dh_wishlist',[])),[toast,setToast]=useState(''),[onlinePayment,setOnlinePayment]=useState(false);
 useEffect(()=>{api('/auth/me').then(d=>{setUser(d.user);setOnlinePayment(!!d.onlinePaymentEnabled);if(d.user)api('/wishlist').then(x=>setWishlist(x.productIds)).catch(()=>{})}).catch(()=>{}).finally(()=>setAuthLoading(false))},[]);
 useEffect(()=>localStorage.setItem('dh_cart',JSON.stringify(cart)),[cart]);useEffect(()=>localStorage.setItem('dh_wishlist',JSON.stringify(wishlist)),[wishlist]);
 useEffect(()=>{if(!toast)return;const id=setTimeout(()=>setToast(''),3600);return()=>clearTimeout(id)},[toast]);
 const addToCart=useCallback((product,variant,qty=1)=>{if(!variant||variant.stock<1){setToast('Sorry, this variant is out of stock');return}const amount=Math.max(1,Math.min(20,qty));setCart(old=>{const found=old.find(x=>x.variantId===variant.id);if(found)return old.map(x=>x.variantId===variant.id?{...x,quantity:Math.min(variant.stock,20,x.quantity+amount),stock:variant.stock,price:variant.price}:x);return [...old,{variantId:variant.id,productId:product.id,slug:product.slug,name:product.name,variantName:variant.name,image:product.image,price:variant.price,stock:variant.stock,quantity:Math.min(amount,variant.stock)}]});setToast(`${product.name} added to cart`);track('AddToCart',{currency:'BDT',value:variant.price*amount,content_ids:[product.sku],content_name:product.name})},[]);
 const changeQty=(variantId,quantity)=>setCart(old=>old.map(x=>x.variantId===variantId?{...x,quantity:Math.min(x.stock,20,Math.max(1,quantity))}:x));
 const removeCart=variantId=>setCart(old=>old.filter(x=>x.variantId!==variantId));
 const toggleWish=async(id)=>{const has=wishlist.includes(id);setWishlist(old=>has?old.filter(x=>x!==id):[...old,id]);if(user){try{await api('/wishlist/'+id,{method:has?'DELETE':'PUT'})}catch(e){setToast(e.message);setWishlist(old=>has?[...old,id]:old.filter(x=>x!==id))}}else setToast('Saved to your wishlist on this device')};
 const loginUser=u=>{setUser(u);if(u)api('/wishlist').then(({productIds})=>{const all=[...new Set([...wishlist,...productIds])];setWishlist(all);for(const id of wishlist)if(!productIds.includes(id))api('/wishlist/'+id,{method:'PUT'}).catch(()=>{})}).catch(()=>{})};
 const logout=async()=>{await api('/auth/logout',{method:'POST'});setUser(null);setWishlist([]);setToast('Signed out')};
 const value=useMemo(()=>({user,setUser,authLoading,cart,setCart,addToCart,changeQty,removeCart,wishlist,toggleWish,toast,setToast,loginUser,logout,onlinePayment,cartCount:cart.reduce((s,x)=>s+x.quantity,0)}),[user,authLoading,cart,wishlist,toast,onlinePayment]);
 return <Ctx.Provider value={value}>{children}{toast&&<div className="toast" role="status">{toast}<button aria-label="Dismiss" onClick={()=>setToast('')}>×</button></div>}</Ctx.Provider>
}
export const useStore=()=>{const c=useContext(Ctx);if(!c)throw Error('Missing StoreProvider');return c};
