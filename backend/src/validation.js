import { z } from 'zod';
const text=(min,max)=>z.string().trim().min(min).max(max);
export const email=z.email().trim().toLowerCase().max(254);
export const password=z.string().min(10).max(72).refine(v=>Buffer.byteLength(v,'utf8')<=72,'Password must fit within 72 UTF-8 bytes');
export const register=z.object({name:text(2,80),email,password});
export const login=z.object({email,password:z.string().min(1).max(200)});
export const property=z.object({title:text(5,120),description:text(30,5000),location:text(2,100),address:text(5,250),type:z.enum(['Apartment','Villa','Independent house','Plot','Commercial']),purpose:z.enum(['Buy','Rent']),price:z.number().positive().max(1e12),area:z.number().positive().max(1e8),bedrooms:z.number().int().min(0).max(50),bathrooms:z.number().int().min(0).max(50),amenities:z.array(text(2,40)).max(15).default([])}).strict();
export const booking=z.object({name:text(2,80),email,phone:z.string().trim().regex(/^\+?[0-9 ()-]{8,20}$/),startsAt:z.iso.datetime().refine(v=>Date.parse(v)>Date.now()+60*60*1000&&Date.parse(v)<Date.now()+90*86400000,'Choose a time from one hour to 90 days ahead').refine(v=>{const d=new Date(Date.parse(v)+330*60000);return d.getUTCMinutes()===0&&d.getUTCHours()>=9&&d.getUTCHours()<=18;},'Viewings start on the hour, 9am-6pm India time')});
export function parse(schema,body){ const r=schema.safeParse(body);if(!r.success){const e=new Error(r.error.issues.map(i=>`${i.path.join('.')||'Input'}: ${i.message}`).join('; '));e.status=400;throw e;}return r.data;}
export function fail(status,message){const e=new Error(message);e.status=status;throw e;}
