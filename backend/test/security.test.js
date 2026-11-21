import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import jwt from 'jsonwebtoken';
process.env.JWT_SECRET='unit-test-secret-which-is-at-least-32-characters-long';
process.env.JWT_EXPIRES_IN='30m';
process.env.FRONTEND_ORIGIN='https://localhost:3000';
process.env.DATA_FILE='./data/security-test-db.json';
const {default:app}=await import('../src/app.js');
const {db,save}=await import('../src/store.js');
const server=http.createServer(app);
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}/api`;
async function call(route,{method='GET',token,body}={}){const r=await fetch(base+route,{method,headers:{...(token?{Authorization:`Bearer ${token}`}:{ }),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,body:await r.json()};}
async function login(username,password){const r=await call('/auth/login',{method:'POST',body:{username,password}});return r.body.token;}
const customer=await login('customer','Customer123!');const underwriter=await login('underwriter','Underwriter123!');const adjuster=await login('adjuster','Adjuster123!');const agent=await login('agent','Agent123!');const admin=await login('admin','Admin123!');
test('valid login issues a token and invalid login is rejected',async()=>{assert.ok(customer);assert.equal((await call('/auth/login',{method:'POST',body:{username:'customer',password:'wrong'}})).status,401);});
test('missing, invalid, and expired JWTs are rejected',async()=>{assert.equal((await call('/profile')).status,401);assert.equal((await call('/profile',{token:'not-a-jwt'})).status,401);const expired=jwt.sign({sub:'usr-customer-1',username:'customer',roles:['customer']},process.env.JWT_SECRET,{expiresIn:-1,issuer:'northstar-insurance',audience:'northstar-web'});assert.equal((await call('/profile',{token:expired})).status,401);});
test('customer can view profile and only owned policies',async()=>{assert.equal((await call('/profile',{token:customer})).status,200);const own=await call('/policies',{token:customer});assert.equal(own.status,200);assert.ok(own.body.policies.length);assert.ok(own.body.policies.every(p=>p.customerId==='usr-customer-1'));assert.equal((await call('/policies/pol-1003',{token:customer})).status,403);});
test('admin lists users and exclusively manages role assignments',async()=>{assert.equal((await call('/admin/users',{token:admin})).body.users.length,8);const assign=await call('/admin/users/usr-customer-2/roles',{method:'POST',token:admin,body:{role:'customer_service'}});assert.equal(assign.status,200);assert.ok(assign.body.user.roles.includes('customer_service'));const removed=await call('/admin/users/usr-customer-2/roles/customer_service',{method:'DELETE',token:admin});assert.equal(removed.status,200);assert.ok(!removed.body.user.roles.includes('customer_service'));assert.equal((await call('/admin/users/usr-customer-2/roles',{method:'POST',token:customer,body:{role:'admin'}})).status,403);});
test('agent can create a policy but customer cannot',async()=>{const body={customerId:'usr-customer-2',insuranceType:'Home',coverageAmount:310000,premiumAmount:90,effectiveDate:'2026-11-01',expiryDate:'2027-11-01'};assert.equal((await call('/policies',{method:'POST',token:agent,body})).status,201);assert.equal((await call('/policies',{method:'POST',token:customer,body})).status,403);});
test('underwriter can decide amendments and other roles cannot',async()=>{const created=await call('/amendments',{method:'POST',token:customer,body:{policyId:'pol-1001',requestType:'Beneficiary update',currentValue:'Mariam Diallo',requestedValue:'Amina Diallo',reason:'Please update beneficiary details.'}});assert.equal(created.status,201);const route=`/amendments/${created.body.request.id}/decision`;assert.equal((await call(route,{method:'PATCH',token:customer,body:{status:'approved'}})).status,403);const decided=await call(route,{method:'PATCH',token:underwriter,body:{status:'approved',reviewComment:'Verified policyholder request.'}});assert.equal(decided.status,200);assert.equal(decided.body.request.status,'approved');});
test('customer submits claims and only adjuster can decide',async()=>{const made=await call('/claims',{method:'POST',token:customer,body:{policyId:'pol-1002',claimType:'Collision',incidentDate:'2026-10-10',claimAmount:1200,description:'Vehicle was damaged in a parking lot incident.'}});assert.equal(made.status,201);const route=`/claims/${made.body.claim.id}/decision`;assert.equal((await call(route,{method:'PATCH',token:customer,body:{status:'approved',decisionComment:'Claim approved after review.'}})).status,403);const decided=await call(route,{method:'PATCH',token:adjuster,body:{status:'approved',decisionComment:'Claim approved after review.'}});assert.equal(decided.status,200);});
test('disabled account cannot keep using an existing JWT',async()=>{const user=await login('customer2','Customer123!');db().users.find(x=>x.id==='usr-customer-2').status='disabled';save();assert.equal((await call('/profile',{token:user})).status,401);});

test('authorization service checks route access for staff roles',async()=>{assert.equal((await call('/claims',{token:adjuster})).status,200);assert.equal((await call('/admin/roles',{token:adjuster})).status,403);});

test.after(()=>{server.close();const f=new URL('../data/security-test-db.json',import.meta.url);try{fs.unlinkSync(fileURLToPath(f));}catch{}});

test('customer cannot read administrative profile endpoints',async()=>{assert.equal((await call('/admin/users/usr-customer-2',{token:customer})).status,403);});
test('HTTPS health endpoint reports encrypted transport',{skip:!fs.existsSync(new URL('../certs/localhost-key.pem',import.meta.url))},async()=>{const tls=https.createServer({key:fs.readFileSync(new URL('../certs/localhost-key.pem',import.meta.url)),cert:fs.readFileSync(new URL('../certs/localhost-cert.pem',import.meta.url))},app);await new Promise(resolve=>tls.listen(0,'127.0.0.1',resolve));const response=await new Promise((resolve,reject)=>https.get({hostname:'localhost',port:tls.address().port,path:'/api/health',rejectUnauthorized:false},r=>{let text='';r.on('data',c=>text+=c);r.on('end',()=>resolve({status:r.statusCode,body:JSON.parse(text)}));}).on('error',reject));assert.equal(response.status,200);assert.equal(response.body.transport,'https');await new Promise(resolve=>tls.close(resolve));});
