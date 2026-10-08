const metaId=import.meta.env.VITE_META_PIXEL_ID,gaId=import.meta.env.VITE_GA4_ID;
export function marketingConfigured(){return !!(metaId||gaId)}
export function marketingConsent(){return localStorage.getItem('dh_marketing_consent')==='yes'}
export function rememberAttribution(search){const p=new URLSearchParams(search);const next={};for(const key of ['utm_source','utm_medium','utm_campaign','utm_content'])if(p.get(key))next[key]=p.get(key).slice(0,120);if(Object.keys(next).length)localStorage.setItem('dh_attribution',JSON.stringify({...getAttribution(),...next}))}
export function getAttribution(){try{return JSON.parse(localStorage.getItem('dh_attribution')||'{}')}catch{return {}}}
let initialized=false;
export function loadTracking(){if(initialized||!marketingConsent())return;initialized=true;
 if(metaId){(function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=true;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=true;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)})(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');window.fbq('init',metaId)}
 if(gaId){window.dataLayer=window.dataLayer||[];window.gtag=function(){window.dataLayer.push(arguments)};window.gtag('js',new Date());window.gtag('config',gaId,{send_page_view:false});const t=document.createElement('script');t.async=true;t.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(gaId);document.head.append(t)}
}
export function track(event,data={}){if(!marketingConsent())return;loadTracking();try{if(window.fbq){window.fbq('track',event,data)}if(window.gtag){const map={PageView:'page_view',ViewContent:'view_item',AddToCart:'add_to_cart',InitiateCheckout:'begin_checkout',Purchase:'purchase'};window.gtag('event',map[event]||event.toLowerCase(),data)}}catch(e){console.warn('Tracking not available',e)}}
