/* Shared local-only data store for every FixiDZ demo page. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.FixiRepairStore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const STORAGE_KEY = 'fixidz.demo.v1';
  const STATUS_ORDER = ['Received', 'In Progress', 'Waiting for Parts', 'Ready for Pickup', 'Delivered', 'Cancelled'];
  const ACTIVE_STATUSES = new Set(['Received', 'In Progress', 'Waiting for Parts', 'Ready for Pickup']);
  const DEFAULT_REPAIRS = [
    { id:'R-1048', customerName:'Nadia Aït Ali', phone:'0550 21 47 30', device:'Samsung Galaxy A54', description:'', estimatedCost:8500, finalCost:0, paid:0, status:'Received', receivedAt:'2026-10-26T10:12:00.000Z' },
    { id:'R-1047', customerName:'Yacine Benali', phone:'0555 42 18 90', device:'Samsung Galaxy A52', description:'Cracked front glass; frame intact; powers on.', diagnosis:'OLED assembly damaged. Mainboard and charging circuit tested normally.', accessories:'Black silicone case · no charger', estimatedCost:12000, finalCost:12500, paid:5000, status:'In Progress', receivedAt:'2026-10-24T09:35:00.000Z' },
    { id:'R-1046', customerName:'Amel Haddad', phone:'0550 33 21 08', device:'iPhone 12', description:'', estimatedCost:6500, finalCost:6500, paid:2500, status:'Ready for Pickup', receivedAt:'2026-10-23T10:00:00.000Z' },
    { id:'R-1045', customerName:'Mehdi Saïdi', phone:'0661 58 12 90', device:'Dell Latitude 5420', description:'', estimatedCost:9000, finalCost:0, paid:0, status:'Waiting for Parts', receivedAt:'2026-10-23T09:00:00.000Z' },
    { id:'R-1044', customerName:'Lina Bouzid', phone:'0770 14 66 25', device:'iPad 9th gen', description:'', estimatedCost:8000, finalCost:8000, paid:8000, status:'Ready for Pickup', receivedAt:'2026-10-22T12:00:00.000Z' },
    { id:'R-1043', customerName:'Sofiane Kaci', phone:'0555 90 31 47', device:'Lenovo ThinkPad T14', description:'', estimatedCost:4500, finalCost:0, paid:0, status:'In Progress', receivedAt:'2026-10-22T10:00:00.000Z' },
    { id:'R-1042', customerName:'Yacine Benali', phone:'0555 42 18 90', device:'iPhone 11', description:'Battery replacement', estimatedCost:7000, finalCost:7000, paid:7000, status:'Delivered', receivedAt:'2026-10-21T10:00:00.000Z' },
    /* These two examples were present in the original Payments & Warranties table. */
    { id:'R-1041', customerName:'Amel Haddad', phone:'0550 33 21 08', device:'Galaxy A32', description:'Display replacement', estimatedCost:9000, finalCost:9000, paid:9000, status:'Delivered', receivedAt:'2026-08-01T10:00:00.000Z' },
    { id:'R-1040', customerName:'Mehdi Saïdi', phone:'0661 58 12 90', device:'HP ProBook 450', description:'SSD replacement', estimatedCost:10500, finalCost:10500, paid:10500, status:'Delivered', receivedAt:'2026-07-17T10:00:00.000Z' }
  ];
  const DEFAULT_PARTS = [
    { id:'P-1', name:'A52 OLED display', category:'Screens', description:'Replacement OLED display assembly with touch digitizer. Black frame.', stock:2, minimum:3, cost:4200, sellingPrice:0 },
    { id:'P-2', name:'iPhone 11 battery', category:'Batteries', description:'', stock:1, minimum:3, cost:2400, sellingPrice:0 },
    { id:'P-3', name:'USB-C connector', category:'Connectors', description:'', stock:0, minimum:2, cost:600, sellingPrice:0 },
    { id:'P-4', name:'iPhone 13 display', category:'Screens', description:'', stock:8, minimum:3, cost:9500, sellingPrice:0 },
    { id:'P-5', name:'512GB NVMe SSD', category:'Storage', description:'', stock:6, minimum:2, cost:5500, sellingPrice:0 },
    { id:'P-6', name:'Thermal paste 4g', category:'Consumables', description:'', stock:12, minimum:4, cost:500, sellingPrice:0 }
  ];
  const DEFAULT_WARRANTIES = [
    { id:'W-1', repairId:'R-1042', starts:'2026-10-26', expires:'2027-01-24', durationDays:90, coverage:'Replacement battery defects and installation workmanship.' },
    { id:'W-2', repairId:'R-1041', starts:'2026-08-01', expires:'2026-10-30', durationDays:90, coverage:'Display replacement and installation workmanship.' },
    { id:'W-3', repairId:'R-1040', starts:'2026-07-17', expires:'2026-10-15', durationDays:90, coverage:'SSD replacement and installation workmanship.' }
  ];
  const DEFAULT_REPAIR_PARTS = [
    { id:'A-1', repairId:'R-1047', partId:'P-1', quantity:1, unitCost:4200, restored:false, usedAt:'2026-10-24T10:00:00.000Z' }
  ];
  const DEFAULT_PAYMENT_EVENTS = [
    { id:'PAY-1', repairId:'R-1042', amount:3500, paidAt:'2026-10-21T11:00:00.000Z', method:'Cash' },
    { id:'PAY-2', repairId:'R-1042', amount:3500, paidAt:'2026-10-26T11:00:00.000Z', method:'Cash' },
    { id:'PAY-3', repairId:'R-1047', amount:5000, paidAt:'2026-10-24T12:00:00.000Z', method:'Cash' },
    { id:'PAY-4', repairId:'R-1046', amount:2500, paidAt:'2026-10-26T11:30:00.000Z', method:'Cash' },
    { id:'PAY-5', repairId:'R-1044', amount:8000, paidAt:'2026-10-26T12:00:00.000Z', method:'CCP' },
    { id:'PAY-6', repairId:'R-1041', amount:9000, paidAt:'2026-08-01T11:00:00.000Z', method:'Cash' },
    { id:'PAY-7', repairId:'R-1040', amount:10500, paidAt:'2026-07-17T11:00:00.000Z', method:'Cash' }
  ];
  const DEFAULT_SHOP = { name:'Atlas Mobile', phone:'021 74 18 26', email:'contact@atlasmobile.dz', address:'18 Rue Didouche Mourad, Alger Centre' };
  const DEFAULT_PROFILE = { name:'Samir Boudiaf', email:'samir@atlasmobile.dz' };

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function validObject(value) { return !!value && typeof value === 'object' && !Array.isArray(value); }
  function normalizeDate(value, fallback = new Date().toISOString()) {
    let date = value || fallback;
    if (typeof date === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
      const [day, month, year] = date.split('/'); date = `${year}-${month}-${day}T12:00:00.000Z`;
    } else if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) date += 'T12:00:00.000Z';
    const parsed = Date.parse(date);
    return Number.isFinite(parsed) ? new Date(parsed).toISOString() : fallback;
  }
  function normalizeRepair(record) {
    if (!validObject(record)) return null;
    const id = String(record.id || '').trim();
    const customerName = String(record.customerName || record.name || '').trim();
    const device = String(record.device || '').trim();
    if (!id || !customerName || !device) return null;
    const estimate = Number(record.estimatedCost ?? record.estimate ?? 0);
    const finalCost = Number(record.finalCost || 0);
    return {
      ...record,
      id,
      customerId:String(record.customerId || ''),
      customerName,
      phone:String(record.phone || '').trim(),
      device,
      description:String(record.description ?? record.problem ?? '').trim(),
      diagnosis:String(record.diagnosis || '').trim(),
      accessories:String(record.accessories || '').trim(),
      estimatedCost:Number.isFinite(estimate) ? Math.max(0, estimate) : 0,
      finalCost:Number.isFinite(finalCost) ? Math.max(0, finalCost) : 0,
      paid:Math.max(0, Number(record.paid || 0) || 0),
      status:STATUS_ORDER.includes(record.status) ? record.status : 'Received',
      receivedAt:normalizeDate(record.receivedAt || record.receivedDate || record.date),
      history:Array.isArray(record.history) ? record.history : []
    };
  }
  function idForName(name) {
    const slug = String(name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32);
    return `P-${slug || 'part'}`;
  }
  function normalizePart(part) {
    if (!validObject(part)) return null;
    const name = String(part.name || part.partName || '').trim();
    if (!name) return null;
    const stock = Number(part.stock ?? part.quantity ?? 0), minimum = Number(part.minimum ?? part.minStock ?? 0), cost = Number(part.cost ?? part.unitCost ?? 0);
    if (![stock,minimum,cost].every(Number.isFinite) || stock < 0 || minimum < 0 || cost < 0) return null;
    return { ...part, id:String(part.id || idForName(name)), name, category:String(part.category || 'Other'), description:String(part.description || ''), stock, minimum, cost, sellingPrice:Math.max(0, Number(part.sellingPrice || 0) || 0) };
  }
  function makeUniqueId(prefix, records) {
    const used = new Set((records || []).map(record => String(record.id)));
    const max = Math.max(0, ...(records || []).map(record => Number(String(record.id || '').match(/(\d+)$/)?.[1]) || 0));
    let sequence = max + 1;
    while (used.has(`${prefix}${sequence}`)) sequence++;
    return `${prefix}${sequence}`;
  }
  function findCustomer(state, phone, name) {
    const digits = String(phone || '').replace(/\D/g, '');
    if (digits) return (state.customers || []).find(customer => String(customer.phone || '').replace(/\D/g, '') === digits);
    return (state.customers || []).find(customer => String(customer.name || '').trim().toLowerCase() === String(name || '').trim().toLowerCase());
  }
  function ensureRepairCustomers(state) {
    state.customers = Array.isArray(state.customers) ? state.customers.filter(validObject) : [];
    for (const repair of state.repairs) {
      let customer = state.customers.find(item => item.id === repair.customerId) || findCustomer(state, repair.phone, repair.customerName);
      if (!customer) {
        customer = { id:makeUniqueId('C-', state.customers), name:repair.customerName, phone:repair.phone, email:'' };
        state.customers.push(customer);
      } else {
        if (!customer.name) customer.name = repair.customerName;
        if (!customer.phone) customer.phone = repair.phone;
      }
      if (!customer.email && customer.name === 'Yacine Benali') customer.email = 'yacine.benali@gmail.com';
      repair.customerId = customer.id;
    }
  }
  function paymentTotal(state, repairId) {
    return (state.payments || []).filter(payment => payment.repairId === repairId).reduce((sum, payment) => sum + Math.max(0, Number(payment.amount) || 0), 0);
  }
  function repairTotal(repair) { return Math.max(0, Number(repair.finalCost || repair.estimatedCost || 0)); }
  function dateOnlyOrdinal(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
    if (!match) return NaN;
    const year = Number(match[1]), month = Number(match[2]), day = Number(match[3]);
    if (year < 1000 || month < 1 || month > 12 || day < 1 || day > 31) return NaN;
    const ordinal = Date.UTC(year, month - 1, day), check = new Date(ordinal);
    return check.getUTCFullYear() === year && check.getUTCMonth() === month - 1 && check.getUTCDate() === day ? ordinal : NaN;
  }
  function localDayOrdinal(value = new Date()) {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return NaN;
    return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  }
  function warrantyStatus(warranty, now = new Date()) {
    if (!warranty || !warranty.starts || !warranty.expires) return 'No Warranty';
    const today = localDayOrdinal(now), start = dateOnlyOrdinal(warranty.starts), expiry = dateOnlyOrdinal(warranty.expires);
    if (![today, start, expiry].every(Number.isFinite) || expiry < start) return 'No Warranty';
    if (today > expiry) return 'Expired';
    return today >= start ? 'Active' : 'No Warranty';
  }
  function normalizePayment(payment, index) {
    if (!validObject(payment)) return null;
    const amount = Number(payment.amount || 0);
    if (!Number.isFinite(amount) || amount <= 0 || !payment.repairId) return null;
    return { ...payment, id:String(payment.id || `PAY-${index + 1}`), amount, repairId:String(payment.repairId), paidAt:normalizeDate(payment.paidAt || payment.date), method:String(payment.method || 'Cash') };
  }
  function loadState(storage, key = STORAGE_KEY, now = new Date()) {
    let state = {};
    try { const parsed = JSON.parse(storage.getItem(key) || '{}'); if (validObject(parsed)) state = parsed; } catch (_) { state = {}; }
    const hadRepairs = Array.isArray(state.repairs);
    const repairsById = new Map((hadRepairs ? state.repairs : DEFAULT_REPAIRS).map(item => {
      const repair = normalizeRepair(item); return repair ? [repair.id, repair] : ['', null];
    }).filter(([id]) => !!id));
    if (hadRepairs) DEFAULT_REPAIRS.forEach(sample => {
      const current=repairsById.get(sample.id);
      if(current) repairsById.set(sample.id,normalizeRepair({ ...sample, ...current, diagnosis:current.diagnosis||sample.diagnosis, accessories:current.accessories||sample.accessories }));
    });
    /* The old prototype showed two payment examples that had no repair records. Migrate those once. */
    const containsOldRepairSamples = [...repairsById.keys()].some(id => DEFAULT_REPAIRS.some(sample => sample.id === id));
    if (hadRepairs && !state.paymentExamplesMigrated && containsOldRepairSamples) {
      for (const sample of DEFAULT_REPAIRS.filter(item => ['R-1041','R-1040'].includes(item.id))) if (!repairsById.has(sample.id)) repairsById.set(sample.id, normalizeRepair(sample));
      state.paymentExamplesMigrated = true;
    }
    if (!hadRepairs || (hadRepairs && !containsOldRepairSamples)) state.paymentExamplesMigrated = true;
    state.repairs = [...repairsById.values()];

    /* Migrate the old settings array and edit maps once into named records. */
    const oldSettings = Array.isArray(state.settings) ? state.settings : [];
    const hadShop = validObject(state.shop), hadProfile = validObject(state.profile);
    state.shop = { ...DEFAULT_SHOP, ...(hadShop ? state.shop : {}) };
    state.profile = { ...DEFAULT_PROFILE, ...(hadProfile ? state.profile : {}) };
    if (!hadShop && oldSettings.length) {
      if (oldSettings[0]) state.shop.name = oldSettings[0];
      if (oldSettings[1]) state.shop.phone = oldSettings[1];
      if (oldSettings[2]) state.shop.email = oldSettings[2];
      if (oldSettings[3]) state.shop.address = oldSettings[3];
    }
    if (!hadProfile && oldSettings.length) {
      if (oldSettings[4]) state.profile.name = oldSettings[4];
      if (oldSettings[5]) state.profile.email = oldSettings[5];
    }

    for (const repair of state.repairs) {
      const edit = state.detailEdits?.[repair.id] || (repair.id === 'R-1047' ? state.detailEdit : null);
      if (edit) {
        repair.customerName = String(edit.name || repair.customerName);
        repair.phone = String(edit.phone || repair.phone);
        repair.device = String(edit.device || repair.device);
        repair.diagnosis = String(edit.diagnosis || repair.diagnosis || '');
        repair.description = [edit.condition, edit.diagnosis].filter(Boolean).join(' · ') || repair.description;
        if (edit.estimate != null) repair.estimatedCost = Math.max(0, Number(edit.estimate) || 0);
        if (edit.final != null) repair.finalCost = Math.max(0, Number(edit.final) || 0);
      }
      const paymentEdit = state.paymentEdits?.[`m${state.repairs.indexOf(repair) + 1}`];
      const legacyPayment = state.detailPayments?.[repair.id] || (repair.id === 'R-1047' ? state.detailPayment : null);
      const numbers = paymentEdit?.numbers;
      if (legacyPayment?.total != null) repair.finalCost = Math.max(0, Number(legacyPayment.total) || 0);
      else if (numbers?.[0] != null) repair.finalCost = Math.max(0, Number(numbers[0]) || 0);
    }
    ensureRepairCustomers(state);

    const hadParts = Array.isArray(state.parts);
    const defaultParts = new Map((hadParts ? [] : DEFAULT_PARTS).map(part => [part.id, normalizePart(part)]));
    const priorParts = hadParts ? state.parts : [];
    priorParts.forEach((raw, index) => {
      const part = normalizePart({ ...raw, id:raw?.id || `P-USER-${index + 1}` });
      if (part) defaultParts.set(part.id, part);
    });
    /* Seed missing catalog examples into an older installation exactly once. */
    if (hadParts && priorParts.length && !state.inventorySamplesMigrated) {
      DEFAULT_PARTS.forEach(sample => { if (!defaultParts.has(sample.id)) defaultParts.set(sample.id, normalizePart(sample)); });
      state.inventorySamplesMigrated = true;
    }
    if (!hadParts || (hadParts && !priorParts.length)) state.inventorySamplesMigrated = true;
    state.parts = [...defaultParts.values()];
    if (validObject(state.partEdits)) {
      Object.entries(state.partEdits).forEach(([key, raw]) => {
        const part = state.parts[Number(String(key).slice(1)) - 1];
        const normalized = normalizePart({ ...raw, id:part?.id || idForName(raw?.name) });
        if (part && normalized) Object.assign(part, normalized, { id:part.id });
      });
    }

    /* Payment events are the source of truth; migrate legacy aggregate-paid fields once. */
    const hadPaymentCollection = Array.isArray(state.payments);
    if (hadPaymentCollection) state.payments = state.payments.map(normalizePayment).filter(Boolean);
    else {
      state.payments = clone(DEFAULT_PAYMENT_EVENTS);
      for (const repair of state.repairs) {
        const legacy = state.detailPayments?.[repair.id] || (repair.id === 'R-1047' ? state.detailPayment : null);
        const edited = state.paymentEdits?.[`m${state.repairs.indexOf(repair) + 1}`]?.numbers;
        const targetPaid = Math.max(0, Number(legacy?.paid ?? edited?.[1] ?? repair.paid) || 0);
        const existing = paymentTotal(state, repair.id);
        const difference = targetPaid - existing;
        if (difference > 0) state.payments.push({ id:makeUniqueId('PAY-', state.payments), repairId:repair.id, amount:difference, paidAt:normalizeDate(legacy?.paidAt || repair.receivedAt), method:'Cash' });
        else if (difference < 0) {
          let remaining = targetPaid;
          state.payments = state.payments.filter(payment => {
            if (payment.repairId !== repair.id) return true;
            if (remaining <= 0) return false;
            const keep = Math.min(payment.amount, remaining); remaining -= keep; payment.amount = keep; return keep > 0;
          });
        }
      }
    }
    const repairIds = new Set(state.repairs.map(repair => repair.id));
    state.payments = state.payments.filter(payment => repairIds.has(payment.repairId));
    state.repairs.forEach(repair => { repair.paid = paymentTotal(state, repair.id); });

    state.warranties = Array.isArray(state.warranties) ? state.warranties.filter(validObject) : clone(DEFAULT_WARRANTIES);
    if (!Array.isArray(state.warranties)) state.warranties = [];
    state.warranties = state.warranties.filter(warranty => repairIds.has(warranty.repairId)).map((warranty, index) => ({
      ...warranty, id:String(warranty.id || `W-${index + 1}`), repairId:String(warranty.repairId), starts:String(warranty.starts || ''), expires:String(warranty.expires || ''), durationDays:Math.max(0, Number(warranty.durationDays || 0) || 0), coverage:String(warranty.coverage || '')
    }));
    if (Array.isArray(state.paymentEdits)) state.paymentEdits = {};
    for (const [index, repair] of state.repairs.entries()) {
      const edit = state.paymentEdits?.[`m${index + 1}`];
      if (edit?.dates?.[0] && edit?.dates?.[1] && edit.coverage && repair.status === 'Delivered' && !state.warranties.some(w => w.repairId === repair.id)) {
        state.warranties.push({ id:makeUniqueId('W-', state.warranties), repairId:repair.id, starts:edit.dates[0], expires:edit.dates[1], durationDays:Math.max(0, Math.round((Date.parse(edit.dates[1])-Date.parse(edit.dates[0]))/86400000)), coverage:edit.coverage });
      }
    }

    state.repairParts = Array.isArray(state.repairParts) ? state.repairParts.filter(validObject) : clone(DEFAULT_REPAIR_PARTS);
    state.stockMovements = Array.isArray(state.stockMovements) ? state.stockMovements.filter(validObject) : [{ id:'MOV-1', partId:'P-1', repairId:'R-1047', quantity:1, type:'usage', at:'2026-10-24T10:00:00.000Z', note:'Sample repair allocation; current stock already reflects use.' }];
    if (Array.isArray(state.partUsage) && state.partUsage.length && !state.inventoryUsageMigrated) {
      const codeIds = { a52:'P-1', ip11b:'P-2', usbc:'P-3', ip13:'P-4', ssd:'P-5', paste:'P-6' };
      state.partUsage.forEach((usage, index) => {
        const partId = codeIds[usage.part], part = state.parts.find(item => item.id === partId), quantity = Math.max(0, Number(usage.quantity) || 0);
        if (!part || !quantity) return;
        if (part.stock < quantity) return;
        part.stock -= quantity;
        state.repairParts.push({ id:`A-MIG-${index + 1}`, repairId:'R-1047', partId, quantity, unitCost:part.cost, restored:false, usedAt:normalizeDate() });
        state.stockMovements.push({ id:makeUniqueId('MOV-', state.stockMovements), partId, repairId:'R-1047', quantity, type:'usage', at:normalizeDate(), note:'Migrated previously saved part usage.' });
      });
      state.inventoryUsageMigrated = true;
    }
    state.repairParts = state.repairParts.filter(item => repairIds.has(item.repairId) && state.parts.some(part => part.id === item.partId));
    try { storage.setItem(key, JSON.stringify(state)); } catch (_) { /* the normalized in-memory copy remains usable */ }
    return state;
  }
  function saveState(storage, state, key = STORAGE_KEY) {
    try { storage.setItem(key, JSON.stringify(state)); return true; } catch (_) { return false; }
  }
  function createRepair(state, input, now = new Date()) {
    const name = String(input.customerName || '').trim(), phone = String(input.phone || '').trim();
    const device = String(input.device || '').trim(), description = String(input.description || '').trim();
    const estimate = Number(input.estimatedCost || 0);
    if (!name || phone.replace(/\D/g, '').length !== 10 || !device || !description) throw new Error('Required customer, phone, device, and problem fields are missing or invalid.');
    if (!Number.isFinite(estimate) || estimate < 0) throw new Error('Estimated cost must be a valid non-negative amount.');
    const next = clone(state), id = makeUniqueId('R-', next.repairs);
    let customer = findCustomer(next, phone, name);
    if (!customer) { customer = { id:makeUniqueId('C-', next.customers), name, phone, email:String(input.email || '') }; next.customers.push(customer); }
    else { customer.name = name; customer.phone = phone; if (input.email) customer.email = String(input.email); }
    const record = { id, customerId:customer.id, customerName:name, phone, device, description, diagnosis:'', accessories:String(input.accessories || '').trim(), estimatedCost:estimate, finalCost:0, paid:0, status:'Received', receivedAt:new Date(now).toISOString(), history:[{ type:'created', at:new Date(now).toISOString(), status:'Received' }] };
    next.repairs.unshift(record);
    return next;
  }
  function updateRepair(state, repairId, changes, now = new Date()) {
    const next = clone(state), repair = next.repairs.find(item => item.id === repairId);
    if (!repair) throw new Error('Repair not found.');
    const name = String(changes.customerName ?? repair.customerName).trim(), phone = String(changes.phone ?? repair.phone).trim(), device = String(changes.device ?? repair.device).trim();
    const estimatedCost = Number(changes.estimatedCost ?? repair.estimatedCost), finalCost = Number(changes.finalCost ?? repair.finalCost);
    if (!name || phone.replace(/\D/g, '').length !== 10 || !device) throw new Error('Customer name, a valid 10-digit phone, and device are required.');
    if (![estimatedCost,finalCost].every(value => Number.isFinite(value) && value >= 0)) throw new Error('Repair costs must be valid non-negative amounts.');
    if (finalCost && finalCost < repair.paid) throw new Error('Final cost cannot be lower than payments already recorded.');
    repair.customerName = name; repair.phone = phone; repair.device = device;
    repair.description = String(changes.description ?? repair.description).trim(); repair.diagnosis = String(changes.diagnosis ?? repair.diagnosis).trim(); repair.accessories = String(changes.accessories ?? repair.accessories).trim();
    repair.estimatedCost = estimatedCost; repair.finalCost = finalCost;
    let customer = next.customers.find(item => item.id === repair.customerId) || findCustomer(next, phone, name);
    if (!customer) { customer = { id:makeUniqueId('C-', next.customers), name, phone, email:'' }; next.customers.push(customer); }
    Object.assign(customer, { name, phone }); repair.customerId = customer.id;
    repair.history.push({ type:'updated', at:new Date(now).toISOString(), status:repair.status });
    return next;
  }
  function adjustPartStock(state, partId, quantity, options = {}) {
    const next = clone(state), part = next.parts.find(item => item.id === partId), amount = Number(quantity);
    if (!part) throw new Error('Spare part not found.');
    if (!Number.isInteger(amount) || amount < 0) throw new Error('Stock must be a non-negative whole number.');
    const difference = amount - part.stock;
    part.stock = amount;
    if (difference) next.stockMovements.push({ id:makeUniqueId('MOV-', next.stockMovements), partId, quantity:Math.abs(difference), type:difference > 0 ? 'restock' : 'adjustment', at:new Date(options.now || Date.now()).toISOString(), note:options.note || 'Manual stock adjustment.' });
    return next;
  }
  function savePart(state, input, partId = '', now = new Date()) {
    const name = String(input.name || '').trim(), category = String(input.category || '').trim();
    const stock = Number(input.stock), minimum = Number(input.minimum), cost = Number(input.cost), sellingPrice = Number(input.sellingPrice || 0);
    if (!name || !category || ![stock,minimum,cost,sellingPrice].every(Number.isFinite) || stock < 0 || minimum < 0 || cost < 0 || sellingPrice < 0 || !Number.isInteger(stock) || !Number.isInteger(minimum)) throw new Error('Part name, category, stock, minimum, and valid costs are required.');
    const next = clone(state), current = partId && next.parts.find(part => part.id === partId);
    if (partId && !current) throw new Error('Spare part not found.');
    const part = { id:current?.id || makeUniqueId('P-', next.parts), name, category, description:String(input.description || ''), stock, minimum, cost, sellingPrice };
    if (current) {
      const oldStock = current.stock; Object.assign(current, part);
      if (oldStock !== stock) next.stockMovements.push({ id:makeUniqueId('MOV-', next.stockMovements), partId:current.id, quantity:Math.abs(stock-oldStock), type:stock>oldStock?'restock':'adjustment', at:new Date(now).toISOString(), note:'Part information updated.' });
    } else { next.parts.push(part); next.stockMovements.push({ id:makeUniqueId('MOV-', next.stockMovements), partId:part.id, quantity:stock, type:'restock', at:new Date(now).toISOString(), note:'New part added to stock.' }); }
    return next;
  }
  function deletePart(state, partId) {
    if (state.repairParts.some(item => item.partId === partId && !item.restored)) throw new Error('This part is allocated to a repair and cannot be deleted yet.');
    const next = clone(state); next.parts = next.parts.filter(part => part.id !== partId); return next;
  }
  function usePart(state, repairId, partId, quantity = 1, now = new Date()) {
    const next = clone(state), repair = next.repairs.find(item => item.id === repairId), part = next.parts.find(item => item.id === partId), amount = Number(quantity);
    if (!repair || !part) throw new Error('Choose an existing repair and spare part.');
    if (repair.status === 'Cancelled') throw new Error('Parts cannot be added to a cancelled repair.');
    if (!Number.isInteger(amount) || amount < 1) throw new Error('Quantity must be a positive whole number.');
    if (part.stock < amount) throw new Error(`Only ${part.stock} in stock.`);
    part.stock -= amount;
    const allocation = { id:makeUniqueId('A-', next.repairParts), repairId, partId, quantity:amount, unitCost:part.cost, restored:false, usedAt:new Date(now).toISOString() };
    next.repairParts.push(allocation);
    next.stockMovements.push({ id:makeUniqueId('MOV-', next.stockMovements), partId, repairId, quantity:amount, type:'usage', at:new Date(now).toISOString(), note:`Used on repair ${repairId}.` });
    repair.history.push({ type:'part-used', at:new Date(now).toISOString(), partId, quantity:amount });
    return next;
  }
  function restoreAllocation(next, allocation, now) {
    if (allocation.restored) return;
    const part = next.parts.find(item => item.id === allocation.partId);
    if (!part) return;
    part.stock += allocation.quantity; allocation.restored = true; allocation.restoredAt = new Date(now).toISOString();
    next.stockMovements.push({ id:makeUniqueId('MOV-', next.stockMovements), partId:part.id, repairId:allocation.repairId, quantity:allocation.quantity, type:'restoration', at:new Date(now).toISOString(), note:'Allocated stock restored.' });
  }
  function removeRepairPart(state, allocationId, now = new Date()) {
    const next = clone(state), allocation = next.repairParts.find(item => item.id === allocationId);
    if (!allocation) throw new Error('Repair part allocation not found.');
    restoreAllocation(next, allocation, now);
    const repair = next.repairs.find(item => item.id === allocation.repairId);
    if (repair) repair.history.push({ type:'part-removed', at:new Date(now).toISOString(), partId:allocation.partId, quantity:allocation.quantity });
    next.repairParts = next.repairParts.filter(item => item.id !== allocationId);
    return next;
  }
  function setRepairStatus(state, repairId, status, now = new Date()) {
    if (!STATUS_ORDER.includes(status)) throw new Error('Choose a valid repair status.');
    const next = clone(state), repair = next.repairs.find(item => item.id === repairId);
    if (!repair) throw new Error('Repair not found.');
    const previous = repair.status;
    if (status === 'Cancelled' && previous !== 'Cancelled') next.repairParts.filter(item => item.repairId === repairId).forEach(item => restoreAllocation(next, item, now));
    if (previous === 'Cancelled' && status !== 'Cancelled') {
      const allocations = next.repairParts.filter(item => item.repairId === repairId && item.restored);
      for (const allocation of allocations) {
        const part = next.parts.find(item => item.id === allocation.partId);
        if (!part || part.stock < allocation.quantity) throw new Error(`Insufficient stock to reopen repair; ${part?.name || 'a part'} needs ${allocation.quantity}.`);
      }
      allocations.forEach(allocation => {
        const part = next.parts.find(item => item.id === allocation.partId); part.stock -= allocation.quantity; allocation.restored = false; delete allocation.restoredAt;
        next.stockMovements.push({ id:makeUniqueId('MOV-', next.stockMovements), partId:part.id, repairId, quantity:allocation.quantity, type:'usage', at:new Date(now).toISOString(), note:'Stock consumed again after reopening repair.' });
      });
    }
    repair.status = status; repair.history.push({ type:'status', at:new Date(now).toISOString(), from:previous, status });
    return next;
  }
  function recordPayment(state, repairId, amount, method = 'Cash', now = new Date()) {
    const value = Number(amount), next = clone(state), repair = next.repairs.find(item => item.id === repairId);
    if (!repair) throw new Error('Repair not found.');
    if (!Number.isFinite(value) || value <= 0) throw new Error('Payment must be greater than zero.');
    const remaining = Math.max(0, repairTotal(repair) - paymentTotal(next, repairId));
    if (value > remaining) throw new Error('Payment cannot exceed the remaining balance.');
    const payment = { id:makeUniqueId('PAY-', next.payments), repairId, amount:value, paidAt:new Date(now).toISOString(), method:String(method || 'Cash') };
    next.payments.push(payment); repair.paid = paymentTotal(next, repairId); repair.history.push({ type:'payment', at:payment.paidAt, paymentId:payment.id, amount:value });
    return next;
  }
  function saveRepairPayment(state, repairId, total, targetPaid, method, now = new Date()) {
    const value = Number(total), paid = Number(targetPaid), currentPaid = paymentTotal(state, repairId);
    if (!Number.isFinite(value) || value < 0 || !Number.isFinite(paid) || paid < currentPaid) throw new Error('Payment total is invalid or cannot be reduced below recorded payments.');
    const next = clone(state), repair = next.repairs.find(item => item.id === repairId);
    if (!repair) throw new Error('Repair not found.');
    if (value < paid) throw new Error('Paid amount cannot exceed the total amount.');
    repair.finalCost = value;
    let working = next;
    if (paid > currentPaid) working = recordPayment(next, repairId, paid-currentPaid, method, now);
    working.repairs.find(item => item.id === repairId).finalCost = value;
    return working;
  }
  function upsertWarranty(state, repairId, input, now = new Date()) {
    const repair = state.repairs.find(item => item.id === repairId);
    if (!repair) throw new Error('Repair not found.');
    if (repair.status !== 'Delivered') throw new Error('A warranty can only be issued for a delivered repair.');
    const starts = String(input.starts || ''), expires = String(input.expires || ''), coverage = String(input.coverage || '').trim();
    const startDay = dateOnlyOrdinal(starts), expiryDay = dateOnlyOrdinal(expires), today = localDayOrdinal(now);
    if (!starts || !expires || !coverage || ![startDay, expiryDay, today].every(Number.isFinite)) throw new Error('Warranty dates and coverage are required; expiry must follow the start date.');
    if (expiryDay < startDay) throw new Error('Warranty dates and coverage are required; expiry must follow the start date.');
    if (startDay > today) throw new Error('Warranty start date cannot be in the future.');
    const next = clone(state), existing = next.warranties.find(item => item.repairId === repairId);
    const durationDays = Math.max(1, Math.round((Date.parse(expires)-Date.parse(starts))/86400000)+1);
    const warranty = { id:existing?.id || makeUniqueId('W-', next.warranties), repairId, starts, expires, durationDays, coverage, updatedAt:new Date(now).toISOString() };
    if (existing) Object.assign(existing, warranty); else next.warranties.push(warranty);
    next.repairs.find(item => item.id === repairId).history.push({ type:'warranty', at:new Date(now).toISOString(), warrantyId:warranty.id });
    return next;
  }
  function deleteRepair(state, repairId, now = new Date()) {
    const next = clone(state), repair = next.repairs.find(item => item.id === repairId);
    if (!repair) throw new Error('Repair not found.');
    next.repairParts.filter(item => item.repairId === repairId).forEach(item => restoreAllocation(next, item, now));
    const customerId = repair.customerId;
    next.repairs = next.repairs.filter(item => item.id !== repairId);
    next.repairParts = next.repairParts.filter(item => item.repairId !== repairId);
    next.payments = next.payments.filter(item => item.repairId !== repairId);
    next.warranties = next.warranties.filter(item => item.repairId !== repairId);
    if (!next.repairs.some(item => item.customerId === customerId)) next.customers = next.customers.filter(item => item.id !== customerId);
    return next;
  }
  function saveShopProfile(state, shop, profile) {
    const next = clone(state);
    if (!String(shop.name || '').trim() || !String(shop.phone || '').trim()) throw new Error('Shop name and phone are required.');
    if (!String(profile.name || '').trim() || !String(profile.email || '').trim()) throw new Error('Profile name and email are required.');
    if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) throw new Error('Enter a valid profile email address.');
    next.shop = { ...next.shop, ...shop, name:String(shop.name).trim(), phone:String(shop.phone).trim() };
    next.profile = { ...next.profile, ...profile, name:String(profile.name).trim(), email:String(profile.email).trim() };
    next.settings = [next.shop.name, next.shop.phone, next.shop.email, next.shop.address, next.profile.name, next.profile.email];
    return next;
  }
  function recentRepairs(state, limit = 4) {
    return [...(state.repairs || [])].sort((a,b) => Date.parse(b.receivedAt) - Date.parse(a.receivedAt)).slice(0, limit);
  }
  function inventorySummary(state) {
    const parts = state.parts || [], low = parts.filter(part => part.stock > 0 && part.stock <= part.minimum), out = parts.filter(part => part.stock === 0);
    return { types:parts.length, low:low.length, out:out.length, attention:low.length+out.length, value:parts.reduce((sum,part) => sum+part.stock*part.cost,0), lowParts:parts.filter(part=>part.stock<=part.minimum).sort((a,b)=>a.stock-b.stock) };
  }
  function dashboardSummary(state, now = new Date()) {
    const repairs = state.repairs || [], payments = state.payments || [], byStatus = Object.fromEntries(STATUS_ORDER.map(status => [status, repairs.filter(repair => repair.status === status).length]));
    const finalized = repairs.filter(repair => repair.finalCost > 0 && repair.status !== 'Cancelled');
    const balances = finalized.map(repair => Math.max(0, repair.finalCost-paymentTotal(state, repair.id)));
    const outstandingCustomers = new Set(finalized.filter(repair => repair.finalCost > paymentTotal(state, repair.id)).map(repair => repair.customerId || repair.customerName));
    const today = new Date(now); today.setHours(0,0,0,0); const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
    const collectedToday = payments.filter(payment => { const date=Date.parse(payment.paidAt); return date>=today.getTime()&&date<tomorrow.getTime(); }).reduce((sum,payment)=>sum+payment.amount,0);
    const inventory = inventorySummary(state);
    return {
      total:repairs.length,
      active:repairs.filter(repair => ACTIVE_STATUSES.has(repair.status)).length,
      ready:byStatus['Ready for Pickup'],
      byStatus,
      collectedToday,
      collectedTodayCount:payments.filter(payment => { const date=Date.parse(payment.paidAt); return date>=today.getTime()&&date<tomorrow.getTime(); }).length,
      outstanding:balances.reduce((sum,amount)=>sum+amount,0),
      outstandingRepairs:balances.filter(amount=>amount>0).length,
      outstandingCustomers:outstandingCustomers.size,
      inventory,
      partsNeedingAttention:inventory.attention,
      partsLow:inventory.low,
      partsOut:inventory.out
    };
  }
  function reportsSummary(state, month, year) {
    const payments = (state.payments || []).filter(payment => { const date=new Date(payment.paidAt); return date.getMonth()+1===Number(month)&&date.getFullYear()===Number(year); });
    const movements = (state.stockMovements || []).filter(movement => { const date=new Date(movement.at); return date.getMonth()+1===Number(month)&&date.getFullYear()===Number(year); });
    const daily = {}; payments.forEach(payment => { const day=new Date(payment.paidAt).getDate(); daily[day]=(daily[day]||0)+payment.amount; });
    const used = {}; movements.filter(movement=>movement.type==='usage').forEach(movement=>{ const part=state.parts.find(item=>item.id===movement.partId); if(part)used[part.name]=(used[part.name]||0)+movement.quantity; });
    return { totalReceived:payments.reduce((sum,payment)=>sum+payment.amount,0), paymentCount:payments.length, daily, partsUsed:Object.entries(used).sort((a,b)=>b[1]-a[1]), unitsUsed:Object.values(used).reduce((sum,n)=>sum+n,0) };
  }

  return {
    STORAGE_KEY, STATUS_ORDER, ACTIVE_STATUSES, DEFAULT_REPAIRS, DEFAULT_PARTS, DEFAULT_WARRANTIES, DEFAULT_REPAIR_PARTS, DEFAULT_PAYMENT_EVENTS,
    normalizeRepair, loadState, saveState, createRepair, updateRepair, setRepairStatus, deleteRepair,
    savePart, adjustPartStock, deletePart, usePart, removeRepairPart, recordPayment, saveRepairPayment, upsertWarranty,
    saveShopProfile, findCustomer, paymentTotal, repairTotal, warrantyStatus, recentRepairs, inventorySummary, dashboardSummary, reportsSummary
  };
});
