import 'dotenv/config';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import app from './app.js';
import {db} from './store.js';
const dir=path.dirname(fileURLToPath(import.meta.url));
if(!process.env.JWT_SECRET||process.env.JWT_SECRET.length<32){console.error('JWT_SECRET must be set to at least 32 characters.');process.exit(1);}
const backendRoot=path.resolve(dir,'..');
const key=path.resolve(backendRoot,process.env.HTTPS_KEY||'./certs/localhost-key.pem');
const cert=path.resolve(backendRoot,process.env.HTTPS_CERT||'./certs/localhost-cert.pem');
if(!fs.existsSync(key)||!fs.existsSync(cert)){console.error('HTTPS certificates missing. Run npm run certs from backend/.');process.exit(1);}
db();
const port=Number(process.env.PORT||4000);https.createServer({key:fs.readFileSync(key),cert:fs.readFileSync(cert)},app).listen(port,process.env.HOST||'localhost',()=>console.log(`NorthStar API listening at https://${process.env.HOST||'localhost'}:${port}`));
