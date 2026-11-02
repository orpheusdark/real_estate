import mongoose from 'mongoose';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { models } from './models.js';
const clone = x => JSON.parse(JSON.stringify(x));
function matches(row, query) {
 return Object.entries(query).every(([k,v]) => {
  if (v && typeof v === 'object') return Object.entries(v).every(([op,val]) => op === '$gt' ? new Date(row[k]) > new Date(val) : op === '$ne' ? row[k] !== val : false);
  return row[k] === v;
 });
}
export async function createStore(config) {
 if (!config.demo) {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  await Promise.all(Object.values(models).map(m => m.init()));
  return {
   find: (table,q={}) => models[table].find(q).lean(),
   one: (table,q) => models[table].findOne(q).lean(),
   create: async (table,data) => (await models[table].create({...data,_id:randomUUID()})).toObject(),
   update: (table,q,patch,unset={}) => models[table].findOneAndUpdate(q,{$set:patch,$unset:unset},{new:true,runValidators:true}).lean(),
   close: () => mongoose.disconnect()
  };
 }
 await mkdir(config.dataDir,{recursive:true});
 const file=path.join(config.dataDir,'estateiq.json');
 let db;
 try { db=JSON.parse(await readFile(file,'utf8')); } catch(e) { if(e.code!=='ENOENT') throw e; db={users:[],properties:[],appointments:[]}; }
 let writes=Promise.resolve();
 function persist() { const snapshot=JSON.stringify(db,null,2); writes=writes.then(async()=>{await writeFile(file+'.tmp',snapshot);await rename(file+'.tmp',file);});return writes; }
 return {
  find: async(table,q={})=>clone(db[table].filter(x=>matches(x,q))),
  one: async(table,q)=>clone(db[table].find(x=>matches(x,q))||null),
  create: async(table,data)=>{
   if(table==='users'&&db.users.some(x=>x.email===data.email)||table==='appointments'&&data.slotKey&&db.appointments.some(x=>x.slotKey===data.slotKey)){const e=new Error('Duplicate');e.code=11000;throw e;}
   const row={...data,_id:randomUUID(),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}; db[table].push(row);await persist();return clone(row);
  },
  update: async(table,q,patch,unset={})=>{const row=db[table].find(x=>matches(x,q));if(!row)return null;Object.assign(row,patch,{updatedAt:new Date().toISOString()});Object.keys(unset).forEach(k=>delete row[k]);await persist();return clone(row);},
  close:()=>writes
 };
}
