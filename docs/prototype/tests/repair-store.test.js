const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const store = require('../screens/repair-store.js');
const root = path.resolve(__dirname, '..');

class MemoryStorage {
  constructor() { this.items = new Map(); }
  getItem(key) { return this.items.has(key) ? this.items.get(key) : null; }
  setItem(key, value) { this.items.set(key, String(value)); }
  removeItem(key) { this.items.delete(key); }
}

const newRepair = (overrides = {}) => ({
  customerName:'Test Client', phone:'0555 11 22 33', device:'Pixel 8', description:'Cracked screen', accessories:'Case', estimatedCost:12500, ...overrides
});

test('first load seeds the existing demo records once and preserves the full shared dataset on reload', () => {
  const storage = new MemoryStorage(), first = store.loadState(storage), second = store.loadState(storage);
  assert.equal(first.repairs.length, 9);
  assert.equal(second.repairs.length, 9);
  assert.equal(new Set(second.repairs.map(repair => repair.id)).size, 9);
  assert.equal(second.parts.length, 6);
  assert.equal(second.payments.length, 7);
  assert.equal(second.warranties.length, 3);
  assert.equal(second.customers.length, 6);
  const summary = store.dashboardSummary(second, new Date('2026-10-31T12:00:00Z'));
  assert.equal(summary.active, 6);
  assert.equal(summary.ready, 2);
  assert.equal(summary.outstanding, 11500);
  assert.equal(summary.inventory.value, 125800);
  assert.equal(store.reportsSummary(second, 10, 2026).totalReceived, 22500);
});

test('old demo changes migrate without overwriting saved records, settings, or stock edits', () => {
  const storage = new MemoryStorage();
  storage.setItem(store.STORAGE_KEY, JSON.stringify({
    repairs:[{id:'R-1048',customerName:'Saved Customer',phone:'0555 10 20 30',device:'Saved Phone',estimatedCost:3000,status:'Ready for Pickup',receivedAt:'2026-10-30T12:00:00.000Z'}],
    settings:['Saved Shop','021 00 00 00','shop@example.dz','Saved Street, Alger','Saved Owner','owner@example.dz'],
    parts:[{name:'User-added part',category:'Other',stock:4,minimum:2,cost:900}]
  }));
  const state = store.loadState(storage);
  assert.equal(state.repairs.find(repair => repair.id === 'R-1048').customerName, 'Saved Customer');
  assert.equal(state.repairs.length, 3); // The two payment-page examples are migrated once.
  assert.equal(state.shop.name, 'Saved Shop');
  assert.equal(state.profile.name, 'Saved Owner');
  assert.equal(state.parts.find(part => part.name === 'User-added part').stock, 4);
  assert.equal(state.parts.length, 7);
  assert.equal(store.loadState(storage).parts.length, 7);
});

test('explicitly empty collections are preserved instead of being repopulated with samples', () => {
  const storage=new MemoryStorage();
  storage.setItem(store.STORAGE_KEY,JSON.stringify({repairs:[],customers:[],parts:[],payments:[],warranties:[],repairParts:[],stockMovements:[]}));
  const state=store.loadState(storage);
  assert.equal(state.repairs.length,0);
  assert.equal(state.customers.length,0);
  assert.equal(state.parts.length,0);
  assert.equal(state.payments.length,0);
  assert.equal(state.warranties.length,0);
  assert.equal(state.repairParts.length,0);
  assert.equal(state.stockMovements.length,0);
  assert.equal(store.loadState(storage).parts.length,0);
});

test('repair workflow creates unique records, reuses the customer, and persists dashboard data', () => {
  const storage = new MemoryStorage();
  let state = store.loadState(storage);
  state = store.createRepair(state, newRepair(), new Date('2026-10-31T08:20:00.000Z'));
  assert.equal(store.saveState(storage, state), true);
  const created = state.repairs[0];
  assert.equal(created.id, 'R-1049');
  assert.deepEqual({customerName:created.customerName,phone:created.phone,device:created.device,description:created.description,accessories:created.accessories,estimatedCost:created.estimatedCost,status:created.status}, {
    customerName:'Test Client',phone:'0555 11 22 33',device:'Pixel 8',description:'Cracked screen',accessories:'Case',estimatedCost:12500,status:'Received'
  });
  assert.equal(state.customers.filter(customer => customer.phone === created.phone).length, 1);

  state = store.createRepair(state, newRepair({device:'Pixel 8 Pro'}));
  assert.equal(store.saveState(storage,state),true);
  assert.equal(state.repairs[0].id, 'R-1050');
  assert.equal(state.customers.filter(customer => customer.phone === '0555 11 22 33').length, 1);
  const reloaded = store.loadState(storage);
  assert.equal(reloaded.repairs.filter(repair => repair.id === 'R-1049').length, 1);
  assert.equal(reloaded.repairs.length, 11);
  assert.equal(store.recentRepairs(reloaded,1)[0].id, 'R-1050');
  assert.equal(store.dashboardSummary(reloaded).active, 8);
});

test('repair edits, status changes, and cancellation update history and counts', () => {
  const storage=new MemoryStorage();let state = store.loadState(storage);
  state = store.updateRepair(state, 'R-1048', {customerName:'Nadia Test',phone:'0550 20 30 40',device:'Galaxy A54',description:'Camera glass',diagnosis:'Replace rear glass',accessories:'Case',estimatedCost:9000,finalCost:8800});
  assert.equal(state.repairs.find(repair=>repair.id==='R-1048').diagnosis, 'Replace rear glass');
  assert.equal(store.saveState(storage,state),true);
  state=store.loadState(storage);
  assert.equal(state.repairs.find(repair=>repair.id==='R-1048').diagnosis,'Replace rear glass');
  state = store.setRepairStatus(state, 'R-1048', 'Ready for Pickup');
  assert.equal(store.dashboardSummary(state).ready, 3);
  state = store.setRepairStatus(state, 'R-1048', 'Delivered');
  assert.equal(store.dashboardSummary(state).active, 5);
  assert.equal(state.repairs.find(repair=>repair.id==='R-1048').history.filter(item=>item.type==='status').length, 2);
  state = store.recordPayment(state,'R-1048',1000,'Cash');
  assert.throws(()=>store.updateRepair(state,'R-1048',{finalCost:100}),/lower than payments/);
  assert.throws(()=>store.setRepairStatus(state,'R-1048','Unknown'),/valid repair status/);
});

test('inventory workflow adds and adjusts stock, consumes parts, prevents negatives, and restores cancelled allocations', () => {
  const storage = new MemoryStorage();
  let state = store.loadState(storage);
  state = store.savePart(state,{name:'Test OLED',category:'Screens',description:'Test part',stock:5,minimum:2,cost:3200,sellingPrice:4000});
  const part=state.parts.find(item=>item.name==='Test OLED');
  assert.ok(part);
  state = store.savePart(state,{name:part.name,category:part.category,description:part.description,stock:4,minimum:2,cost:3100,sellingPrice:4000},part.id);
  assert.equal(state.parts.find(item=>item.id===part.id).stock,4);
  state = store.usePart(state,'R-1048',part.id,2,new Date('2026-10-31T09:00:00Z'));
  assert.equal(state.parts.find(item=>item.id===part.id).stock,2);
  assert.equal(state.repairParts.filter(item=>item.repairId==='R-1048').length,1);
  assert.throws(()=>store.usePart(state,'R-1048',part.id,3),/Only 2 in stock/);
  state = store.setRepairStatus(state,'R-1048','Cancelled');
  assert.equal(state.parts.find(item=>item.id===part.id).stock,4);
  assert.equal(store.inventorySummary(state).lowParts.some(item=>item.id===part.id),false);
  state = store.setRepairStatus(state,'R-1048','Received');
  assert.equal(state.parts.find(item=>item.id===part.id).stock,2);
  const allocation=state.repairParts.find(item=>item.repairId==='R-1048');
  state = store.removeRepairPart(state,allocation.id);
  assert.equal(state.parts.find(item=>item.id===part.id).stock,4);
  state = store.deletePart(state,part.id);
  assert.equal(state.parts.some(item=>item.id===part.id),false);
  assert.equal(store.saveState(storage,state),true);
  assert.equal(store.loadState(storage).parts.some(item=>item.id===part.id),false);
});

test('payments track partial and full receipts, reject overpayment, and feed dashboard and reports', () => {
  const storage = new MemoryStorage();let state=store.loadState(storage);
  state=store.createRepair(state,newRepair({estimatedCost:2000}),new Date('2026-10-31T08:00:00Z'));
  const repairId=state.repairs[0].id,now=new Date('2026-10-31T10:00:00Z');
  state=store.saveRepairPayment(state,repairId,2000,600,'Cash',now);
  assert.equal(store.paymentTotal(state,repairId),600);
  assert.equal(store.repairTotal(state.repairs.find(item=>item.id===repairId))-store.paymentTotal(state,repairId),1400);
  assert.throws(()=>store.recordPayment(state,repairId,1401,'Cash',now),/cannot exceed the remaining balance/);
  state=store.saveRepairPayment(state,repairId,2000,1200,'CCP',now);
  assert.equal(state.payments.filter(item=>item.repairId===repairId).length,2);
  state=store.saveRepairPayment(state,repairId,2000,1200,'CCP',now); // Refresh/re-save does not duplicate the recorded amount.
  assert.equal(state.payments.filter(item=>item.repairId===repairId).length,2);
  state=store.recordPayment(state,repairId,800,'Cash',now);
  assert.equal(store.paymentTotal(state,repairId),2000);
  assert.equal(store.dashboardSummary(state,now).collectedToday,2000);
  assert.equal(store.reportsSummary(state,10,2026).totalReceived,24500);
  assert.equal(store.saveState(storage,state),true);
  assert.equal(store.paymentTotal(store.loadState(storage),repairId),2000);
});

test('warranties require a delivered repair, update without duplicates, and use dates for status', () => {
  const storage=new MemoryStorage();let state=store.loadState(storage);
  assert.throws(()=>store.upsertWarranty(state,'R-1048',{starts:'2026-10-31',expires:'2027-01-28',coverage:'Screen defects'}),/delivered repair/);
  state=store.setRepairStatus(state,'R-1048','Delivered');
  assert.equal(store.warrantyStatus(null,new Date('2026-10-31T12:00:00Z')),'No Warranty');
  assert.equal(store.warrantyStatus({starts:'2026-11-01',expires:'2027-01-28'},new Date('2026-10-31T12:00:00Z')),'No Warranty');
  assert.throws(()=>store.upsertWarranty(state,'R-1048',{starts:'2026-11-01',expires:'2027-01-28',coverage:'Screen defects'},new Date('2026-10-31T12:00:00Z')),/start date cannot be in the future/);
  state=store.upsertWarranty(state,'R-1048',{starts:'2026-10-31',expires:'2027-01-28',coverage:'Screen defects'},new Date('2026-10-31T12:00:00Z'));
  const warranty=state.warranties.find(item=>item.repairId==='R-1048');
  assert.ok(warranty);
  assert.equal(store.warrantyStatus(warranty,new Date('2026-11-01T12:00:00Z')),'Active');
  assert.equal(store.warrantyStatus(warranty,new Date('2027-01-28T12:00:00Z')),'Active');
  assert.equal(store.warrantyStatus(warranty,new Date('2027-01-29T12:00:00Z')),'Expired');
  state=store.upsertWarranty(state,'R-1048',{starts:'2026-01-01',expires:'2026-02-01',coverage:'Updated coverage'});
  assert.equal(state.warranties.filter(item=>item.repairId==='R-1048').length,1);
  assert.equal(store.warrantyStatus(state.warranties.find(item=>item.repairId==='R-1048'),new Date('2026-10-31T12:00:00Z')),'Expired');
  assert.throws(()=>store.upsertWarranty(state,'R-1048',{starts:'2026-12-01',expires:'2026-11-01',coverage:'Invalid dates'}),/expiry must follow/);
  assert.throws(()=>store.upsertWarranty(state,'R-1048',{starts:'2026-02-31',expires:'2026-03-10',coverage:'Invalid dates'}),/expiry must follow/);
  assert.equal(store.saveState(storage,state),true);
  const reopened=store.loadState(storage).warranties.find(item=>item.repairId==='R-1048');
  assert.deepEqual({starts:reopened.starts,expires:reopened.expires,coverage:reopened.coverage},{starts:'2026-01-01',expires:'2026-02-01',coverage:'Updated coverage'});
});

test('shop and profile settings persist in named shared data fields', () => {
  const storage=new MemoryStorage();let state=store.loadState(storage);
  state=store.saveShopProfile(state,{name:'Fixi Central',phone:'021 11 22 33',email:'hello@example.dz',address:'12 Main Street, Oran'},{name:'Amina Owner',email:'amina@example.dz'});
  assert.equal(store.saveState(storage,state),true);
  const loaded=store.loadState(storage);
  assert.equal(loaded.shop.name,'Fixi Central');
  assert.equal(loaded.profile.name,'Amina Owner');
  assert.throws(()=>store.saveShopProfile(loaded,{name:'',phone:'1'},{name:'A',email:'invalid'}),/Shop name and phone/);
  assert.deepEqual(loaded.settings,['Fixi Central','021 11 22 33','hello@example.dz','12 Main Street, Oran','Amina Owner','amina@example.dz']);
});

test('deleting a repair cascades linked records and remains deleted after refresh', () => {
  const storage=new MemoryStorage();let state=store.loadState(storage);
  const repair=state.repairs.find(item=>item.id==='R-1047');
  const customerId=repair.customerId,stock=state.parts.find(item=>item.id==='P-1').stock;
  state=store.deleteRepair(state,repair.id,new Date('2026-10-31T12:00:00Z'));
  assert.equal(state.repairs.some(item=>item.id===repair.id),false);
  assert.equal(state.payments.some(item=>item.repairId===repair.id),false);
  assert.equal(state.warranties.some(item=>item.repairId===repair.id),false);
  assert.equal(state.parts.find(item=>item.id==='P-1').stock,stock+1);
  assert.ok(state.customers.some(item=>item.id===customerId)); // Yacine has another repair.
  assert.equal(store.saveState(storage,state),true);
  const reloaded=store.loadState(storage);
  assert.equal(reloaded.repairs.some(item=>item.id===repair.id),false);
  assert.equal(reloaded.repairs.length,8);
});

test('legacy repair objects migrate safely without replacing a custom repair list', () => {
  const storage=new MemoryStorage();
  storage.setItem(store.STORAGE_KEY,JSON.stringify({repairs:[{id:'R-1051',name:'Legacy Client',phone:'0555 00 00 00',device:'Laptop',problem:'No power',estimate:3000,status:'Received',date:'31/10/2026'}]}));
  const state=store.loadState(storage),legacy=state.repairs.find(item=>item.id==='R-1051');
  assert.equal(state.repairs.length,1);
  assert.equal(legacy.customerName,'Legacy Client');
  assert.equal(legacy.description,'No power');
  assert.equal(legacy.estimatedCost,3000);
  assert.equal(new Date(legacy.receivedAt).toISOString(),'2026-10-31T12:00:00.000Z');
  assert.equal(state.parts.length,6);
});

test('invalid input and storage failures do not report successful writes', () => {
  const state=store.loadState(new MemoryStorage());
  assert.throws(()=>store.createRepair(state,newRepair({phone:'123',description:''})),/missing or invalid/);
  assert.throws(()=>store.savePart(state,{name:'Bad',category:'Other',stock:-1,minimum:2,cost:100}),/valid costs/);
  assert.equal(state.repairs.length,9);
  const broken={getItem:()=>null,setItem:()=>{throw new Error('quota');}};
  assert.equal(store.saveState(broken,{repairs:[]}),false);
});

test('all screens load the same store, language layer, and interactive page module', () => {
  const screens=fs.readdirSync(path.join(root,'screens')).filter(file=>file.endsWith('.html'));
  assert.equal(screens.length,8);
  for(const file of screens){
    const html=fs.readFileSync(path.join(root,'screens',file),'utf8');
    assert.match(html,/<script src="repair-store\.js"><\/script><script src="prototype\.js"><\/script><script src="app\.js"><\/script>/);
  }
  const app=fs.readFileSync(path.join(root,'screens/app.js'),'utf8');
  for(const feature of ['renderDashboard','renderRepairsList','renderRepairDetail','renderPayments','renderInventory','renderReports','setupSettings','setupNewRepair'])assert.ok(app.includes(`function ${feature}(`),`missing ${feature}`);
  assert.match(app,/window\.addEventListener\('storage'/);
  assert.match(app,/fixidz:language-changed/);
  for(const file of ['1-dashboard.html','2-repairs-list.html','5-payments-warranties.html','6-inventory.html']){
    const html=fs.readFileSync(path.join(root,'screens',file),'utf8');
    assert.match(html,/<tbody><\/tbody>/,`${file} should render rows from the shared store`);
  }
  const dashboard=fs.readFileSync(path.join(root,'screens/1-dashboard.html'),'utf8');
  const repairs=fs.readFileSync(path.join(root,'screens/2-repairs-list.html'),'utf8');
  const details=fs.readFileSync(path.join(root,'screens/3-repair-details.html'),'utf8');
  const payments=fs.readFileSync(path.join(root,'screens/5-payments-warranties.html'),'utf8');
  const settings=fs.readFileSync(path.join(root,'screens/8-settings.html'),'utf8');
  const prototype=fs.readFileSync(path.join(root,'screens/prototype.js'),'utf8');
  assert.doesNotMatch(dashboard,/All orders|Cancelled/i);
  assert.doesNotMatch(repairs,/Cancelled/i);
  assert.match(app,/row\.dataset\.href=href/);
  assert.match(app,/data-action="delete"/);
  assert.doesNotMatch(details,/Repair history|Technician · Karim Benali|Technician diagnosis · Karim Benali/i);
  assert.match(details,/<span>Diagnosis<\/span>/);
  assert.match(payments,/type="date"/);
  assert.doesNotMatch(payments,/Upcoming/);
  assert.match(payments,/No Warranty/);
  assert.doesNotMatch(settings,/Reset Demo Data|Sign out other sessions/i);
  assert.doesNotMatch(prototype,/Upcoming|demo-reset|Reset demo data|Sign out other sessions/i);
});
