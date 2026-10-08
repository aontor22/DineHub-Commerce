import 'dotenv/config';
import bcrypt from 'bcryptjs';
import {pool,tx} from './db.js';
const img=name=>`/images/${name}.webp`;
const categories=[
 ['Dinner Sets','dinner-sets','ceramic-dinner-set'],['Plates & Bowls','plates-bowls','sage-bowls'],['Mugs & Cups','mugs-cups','cups'],['Cutlery','cutlery','cutlery'],['Serveware','serveware','wood-tray'],['Table Decor','table-decor','serving-plate'],['Glassware','glassware','glass-jug'],['Storage','storage','stoneware']];
const products=[
 ['dinner-sets','Ceramic Dinner Set – Floral Collection','ceramic-dinner-set',2490,3120,'Premium ceramic dinnerware with a hand-painted floral motif for your everyday dining and special occasions.','Ceramic',true,[['24 Pcs (Full Set)',2490,44],['18 Pcs',1890,30],['12 Pcs',1390,55]]],
 ['plates-bowls','Sage Green Ceramic Soup Bowl','sage-bowls',350,490,'Smooth sage green ceramic soup bowl with a naturally styled glaze.','Ceramic',true,[['Single Bowl',350,120],['Set of 4',1250,45]]],
 ['plates-bowls','Ivory Porcelain Dinner Plate','porcelain-plate',450,590,'Understated porcelain dinner plate for modern tables.','Porcelain',true,[['10 inch',450,99],['12 inch',590,80]]],
 ['plates-bowls','Artisan Stoneware Bowl Set','stoneware',1250,1570,'Earthy stoneware bowls with beautiful hand-finished details.','Stoneware',false,[['4 Pcs',1250,65],['6 Pcs',1750,48]]],
 ['plates-bowls','Matte Black Minimal Plate','matte-plate',420,550,'Modern matte black plate to elevate your presentation.','Ceramic',false,[['9 inch',420,75],['11 inch',520,55]]],
 ['plates-bowls','Olive Glaze Salad Bowl','salad-bowl',890,1100,'Deep rounded salad bowl finished in olive glaze.','Ceramic',true,[['Medium',890,61],['Large',1120,39]]],
 ['plates-bowls','Midnight Noodle Bowl','noodle-bowl',390,490,'A deep bowl perfect for noodles, soups, and hearty meals.','Ceramic',false,[['Single Bowl',390,100]]],
 ['glassware','Glass Water Jug – Classic','glass-jug',690,890,'An elegant glass water jug for daily use and entertaining.','Glass',true,[['1.5 Litre',690,80],['2 Litre',850,55]]],
 ['cutlery','Stainless Steel Cutlery Set','cutlery',990,1290,'A timeless polished cutlery collection for everyday dining.','Stainless Steel',true,[['24 Pcs',990,62],['16 Pcs',760,38]]],
 ['serveware','Wooden Serving Tray Set','wood-tray',1090,1390,'Warm toned serving trays to bring a natural accent to the table.','Wood',true,[['Set of 3',1090,55],['Single Large Tray',590,44]]],
 ['glassware','Transparent Glass Dessert Bowls','glass-bowls',750,950,'Lightweight crystal-clear dessert bowls for family gatherings.','Glass',false,[['6 Pcs',750,50]]],
 ['plates-bowls','Round Textured Serving Plate','serving-plate',680,820,'Textured serving plate that brings a relaxed look to every gathering.','Ceramic',false,[['12 inch',680,59]]],
 ['plates-bowls','Pastel Kids Bowl','kids-bowl',320,450,'Bright and playful bowl for little ones.','Ceramic',false,[['Single Bowl',320,60],['Set of 2',590,37]]],
 ['mugs-cups','Botanical Tea Cup Pair','cups',590,720,'Cozy cups for relaxed moments and afternoon tea.','Porcelain',true,[['Pair of 2',590,90],['Set of 4',1080,55]]]
];
try{
 await tx(async db=>{
 for(let i=0;i<categories.length;i++){const [name,slug,image]=categories[i];await db.query('INSERT INTO categories(name,slug,image,position) VALUES($1,$2,$3,$4) ON CONFLICT(slug) DO NOTHING',[name,slug,img(image),i])}
 for(let i=0;i<products.length;i++){
 const [cat,name,image,price,compare,description,material,featured,vs]=products[i];const slug=name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');const sku=`DH-P${String(i+1).padStart(3,'0')}`;
 const {rows}=await db.query('INSERT INTO products(category_id,name,slug,sku,description,image,gallery,material,base_price,compare_price,featured,tags) SELECT id,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12 FROM categories WHERE slug=$1 ON CONFLICT(slug) DO UPDATE SET name=EXCLUDED.name RETURNING id',[cat,name,slug,sku,description,img(image),JSON.stringify([img(image)]),material,price,compare,featured,[material,'Dinnerware']]);
 for(let j=0;j<vs.length;j++){const [label,vPrice,stock]=vs[j];await db.query('INSERT INTO variants(product_id,name,sku,price,stock,options) VALUES($1,$2,$3,$4,$5,$6::jsonb) ON CONFLICT(sku) DO NOTHING',[rows[0].id,label,`${sku}-V${j+1}`,vPrice,stock,JSON.stringify({size:label})])}
 }
 await db.query("INSERT INTO coupons(code,type,value,min_subtotal,max_uses) VALUES('WELCOME10','PERCENT',10,1000,300) ON CONFLICT(code) DO NOTHING");
 if(process.env.ADMIN_EMAIL&&process.env.ADMIN_PASSWORD){if(process.env.ADMIN_PASSWORD.length<12)throw Error('ADMIN_PASSWORD must have at least 12 characters');const hash=await bcrypt.hash(process.env.ADMIN_PASSWORD,12);await db.query("INSERT INTO users(name,email,password_hash,role) VALUES('Store Administrator',$1,$2,'ADMIN') ON CONFLICT(email) DO UPDATE SET role='ADMIN',password_hash=$2",[process.env.ADMIN_EMAIL.trim().toLowerCase(),hash]);console.log('Admin created/updated:',process.env.ADMIN_EMAIL)}
 });console.log('Demo categories, products and coupon ready');
}catch(e){console.error(e);process.exitCode=1}finally{await pool.end()}
