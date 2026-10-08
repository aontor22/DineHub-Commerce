import multer from 'multer';
import {v2 as cloudinary} from 'cloudinary';
import {requireAdmin} from './auth.js';
import {httpError} from './utils.js';
const uploader=multer({storage:multer.memoryStorage(),limits:{fileSize:5*1024*1024,files:1},fileFilter:(req,file,cb)=>cb(null,['image/jpeg','image/png','image/webp'].includes(file.mimetype))});
export function registerUploads(app){
 app.post('/api/admin/upload',requireAdmin,uploader.single('image'),async(req,res)=>{
  if(!req.file)throw httpError(400,'Upload a JPEG, PNG or WebP image up to 5 MB');
  if(!process.env.CLOUDINARY_CLOUD_NAME||!process.env.CLOUDINARY_API_KEY||!process.env.CLOUDINARY_API_SECRET)throw httpError(503,'Image upload is not configured; use an image URL or configure Cloudinary');
  cloudinary.config({cloud_name:process.env.CLOUDINARY_CLOUD_NAME,api_key:process.env.CLOUDINARY_API_KEY,api_secret:process.env.CLOUDINARY_API_SECRET,secure:true});
  const result=await new Promise((resolve,reject)=>{const stream=cloudinary.uploader.upload_stream({folder:'dinehub/products',resource_type:'image',transformation:[{quality:'auto',fetch_format:'auto'}]},(error,result)=>error?reject(error):resolve(result));stream.end(req.file.buffer)});
  res.status(201).json({url:result.secure_url,publicId:result.public_id});
 });
}
