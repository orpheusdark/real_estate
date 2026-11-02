import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes, createHash } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { parse, register, login, email, password, fail } from './validation.js';
export const hashToken=t=>createHash('sha256').update(t).digest('hex');
export const publicUser=u=>({id:u._id,name:u.name,email:u.email});
export function authTools(store,config){
 const authenticate=async(req,res,next)=>{
  try{
   const raw=req.get('authorization')?.replace(/^Bearer /,'')||req.cookies?.session;
   if(!raw)fail(401,'Please sign in to continue');
   const payload=jwt.verify(raw,config.secret,{algorithms:['HS256'],issuer:'estateiq',audience:'estateiq-web'});
   const user=await store.one('users',{_id:payload.sub});
   if(!user||user.tokenVersion!==payload.ver)fail(401,'Your session has expired');
   req.user=user;next();
  }catch(e){next(e.status?e:Object.assign(new Error('Please sign in again'),{status:401}));}
 };
 const session=(res,user)=>{const token=jwt.sign({ver:user.tokenVersion},config.secret,{subject:user._id,expiresIn:'8h',issuer:'estateiq',audience:'estateiq-web'});res.cookie('session',token,{httpOnly:true,secure:config.production,sameSite:config.production?'none':'lax',maxAge:8*3600000,path:'/api'});return {user:publicUser(user),token};};
 return {authenticate,session};
}
export function authRouter(store,config,mail,auth){
 const router=Router();
 router.post('/register',async(req,res)=>{const data=parse(register,req.body);const u=await store.create('users',{name:data.name,email:data.email,passwordHash:await bcrypt.hash(data.password,12),tokenVersion:0});res.status(201).json(auth.session(res,u));});
 router.post('/login',async(req,res)=>{const data=parse(login,req.body);const u=await store.one('users',{email:data.email});const valid=await bcrypt.compare(data.password,u?.passwordHash||'$2b$12$TdtgJq1qHzC0RzuxRqMpZO2RlYVDOy4CNg3yruev83jkR4TVKznr2');if(!u||!valid)fail(401,'Email or password is incorrect');res.json(auth.session(res,u));});
 router.post('/logout',auth.authenticate,async(req,res)=>{await store.update('users',{_id:req.user._id},{tokenVersion:req.user.tokenVersion+1});res.clearCookie('session',{path:'/api',httpOnly:true,secure:config.production,sameSite:config.production?'none':'lax'});res.json({message:'Signed out'});});
 router.post('/forgot-password',async(req,res)=>{const data=parse(z.object({email}),req.body);const u=await store.one('users',{email:data.email});if(u){const token=randomBytes(32).toString('hex');await store.update('users',{_id:u._id},{resetHash:hashToken(token),resetExpires:new Date(Date.now()+30*60000)});try{await mail({to:u.email,subject:'Reset your EstateIQ password',text:`Reset your password within 30 minutes: ${config.frontend}/reset-password?token=${token}\nIgnore this email if you did not request it.`});}catch{console.error('Password reset email delivery failed');}}res.json({message:'If that email is registered, a reset link has been sent.'});});
 router.post('/reset-password',async(req,res)=>{const data=parse(z.object({token:z.string().regex(/^[a-f0-9]{64}$/),password}),req.body);const u=await store.one('users',{resetHash:hashToken(data.token),resetExpires:{$gt:new Date()}});if(!u)fail(400,'This reset link is invalid or expired');const updated=await store.update('users',{_id:u._id,resetHash:hashToken(data.token),resetExpires:{$gt:new Date()}},{passwordHash:await bcrypt.hash(data.password,12),tokenVersion:u.tokenVersion+1},{resetHash:1,resetExpires:1});if(!updated)fail(400,'This reset link is invalid or expired');res.json({message:'Password updated. Please sign in.'});});
 return router;
}
