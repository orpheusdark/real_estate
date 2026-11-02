import { configuration } from './config.js';
import { createStore } from './store.js';
import { seedDemo } from './seed.js';
import { createApp } from './app.js';
const config=configuration();
const store=await createStore(config);
if(config.demo)await seedDemo(store);
const server=createApp(store,config).listen(config.port,()=>console.log(`EstateIQ API running on port ${config.port} (${config.demo?'LOCAL DEMO':'MongoDB'})`));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(async()=>{await store.close();process.exit(0);}));
