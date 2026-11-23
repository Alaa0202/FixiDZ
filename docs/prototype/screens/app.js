/* Page interactions for the FixiDZ local demo. All screens use repair-store.js. */
(function () {
  'use strict';
  const ui = window.FixiDemoRuntime;
  const store = window.FixiRepairStore;
  if (!ui || !store) return;
  const page = ui.page, KEY = ui.KEY;
  let state = ui.getState();
  const lang = ui.lang;
  const tr = (value, code = lang()) => ui.tr(value, code);
  const esc = ui.esc;
  const byId = id => document.getElementById(id);
  const money = amount => `${Math.round(Math.max(0, Number(amount) || 0)).toLocaleString(lang()==='fr'?'fr-FR':lang()==='ar'?'ar-DZ':'en-US')} DA`;
  const statusClass = status => ({'Received':'t-rec','In Progress':'t-prog','Waiting for Parts':'t-wait','Ready for Pickup':'t-ready','Delivered':'t-del','Cancelled':'t-can'})[status] || 't-rec';
  const dateLocale = () => lang()==='fr'?'fr-FR':lang()==='ar'?'ar-DZ':'en-GB';
  const dateInputValue = value => { const date = new Date(value); return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; };
  const dateText = value => value ? new Intl.DateTimeFormat(dateLocale(),{day:'2-digit',month:'short',year:'numeric'}).format(new Date(value)) : '—';
  const dateTimeText = value => value ? new Intl.DateTimeFormat(dateLocale(),{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(value)) : '—';
  const customerFor = repair => state.customers.find(item => item.id === repair.customerId) || state.customers.find(item => String(item.phone||'').replace(/\D/g,'') === String(repair.phone||'').replace(/\D/g,''));
  const warrantyFor = repairId => state.warranties.find(item => item.repairId === repairId);
  const paidFor = repairId => store.paymentTotal(state, repairId);
  const balanceFor = repair => Math.max(0, store.repairTotal(repair)-paidFor(repair.id));
  const persist = next => { try { return store.saveState(window.localStorage,next,KEY); } catch (_) { return false; } };
  const showError = error => {
    let message = error?.message || 'The repair could not be saved.';
    const only = message.match(/^Only (\d+) in stock\.$/);
    if (only) message = tr('Only {n} in stock.').replace('{n}',only[1]);
    const insufficient = message.match(/^Insufficient stock to reopen repair; (.+) needs (\d+)\.$/);
    if (insufficient) message = tr('Insufficient stock to reopen repair; {part} needs {n}.').replace('{part}',insufficient[1]).replace('{n}',insufficient[2]);
    ui.toast(tr(message));
  };
  function commit(next, message, render = true) {
    if (!persist(next)) { ui.toast(tr('Could not save changes to local storage.')); return false; }
    state = next; ui.setState(next);
    if (render) renderCurrentPage();
    if (message) ui.toast(tr(message));
    return true;
  }
  function closeDialog() { const close = byId('r0'); if (close) close.checked = true; }
  function addInteractionStyles() {
    let style = byId('fixidz-interaction-style');
    if (!style) { style = document.createElement('style'); style.id = 'fixidz-interaction-style'; document.head.appendChild(style); }
    style.textContent = `.customer-suggestions{position:absolute;z-index:8;top:100%;left:0;right:0;background:#fff;border:1px solid #CBD5E1;border-radius:8px;box-shadow:0 12px 28px #10233f22;overflow:hidden}.customer-suggestions button{display:block;width:100%;padding:10px 12px;border:0;background:#fff;text-align:left;font:inherit;cursor:pointer}.customer-suggestions button:hover{background:#F1F5F9}.suggestion-wrap{position:relative}.payment-history{background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:12px 14px;margin-top:12px}.payment-history h4{font-size:12px;margin:0 0 8px;color:#64748B;text-transform:uppercase;letter-spacing:.04em}.payment-history p{font-size:12px;margin:4px 0;color:#334155}.repair-row{cursor:pointer}.repair-row:hover{background:#F8FAFC}.delete-part{margin-left:8px}.stock-status{white-space:nowrap}`;
  }
  function applyShopProfile() {
    const shop = state.shop || {}, profile = state.profile || {};
    document.querySelectorAll('.top>div:first-child>b').forEach(el => { el.textContent = shop.name || 'Atlas Mobile'; });
    document.querySelectorAll('.top>div:first-child>span').forEach(el => { el.textContent = shop.address ? ` · ${shop.address.split(',').slice(-1)[0].trim()}` : ' · Alger Centre'; });
    document.querySelectorAll('.um-who b').forEach(el => { el.textContent = profile.name || 'Samir Boudiaf'; });
    document.querySelectorAll('.um-who small').forEach(el => { el.textContent = `${tr('Owner')} · ${shop.name || 'Atlas Mobile'}`; });
    document.querySelectorAll('.shop').forEach(el => {
      if (el.childNodes[0]) el.childNodes[0].nodeValue = `${shop.name || 'Atlas Mobile'} `;
      const small = el.querySelector('small'); if (small) small.textContent = shop.address || 'Alger Centre · Owner';
    });
  }

  function renderDashboard() {
    if (page !== '1-dashboard.html') return;
    const summary = store.dashboardSummary(state);
    const cards = [...document.querySelectorAll('.kpis .kpi')];
    if (cards[0]) { cards[0].querySelector('strong').textContent = summary.active; cards[0].querySelector('span').textContent = tr('{active} active repairs · {ready} ready for pickup').replace('{active}',summary.active).replace('{ready}',summary.ready); cards[0].href='2-repairs-list.html?active=true'; }
    if (cards[1]) { cards[1].querySelector('strong').textContent = summary.ready; cards[1].querySelector('span').textContent=tr('Customers can collect today'); cards[1].href='2-repairs-list.html?status=Ready%20for%20Pickup'; }
    if (cards[2]) { cards[2].querySelector('strong').innerHTML = `${summary.collectedToday.toLocaleString()} <em>DA</em>`; cards[2].querySelector('span').textContent = `${summary.collectedTodayCount} ${tr('receipts · actual payments')}`; cards[2].href='5-payments-warranties.html'; }
    if (cards[3]) { cards[3].querySelector('strong').innerHTML = `${summary.outstanding.toLocaleString()} <em>DA</em>`; cards[3].querySelector('span').textContent=tr('{customers} customers · finalized repairs').replace('{customers}',summary.outstandingCustomers); cards[3].href='5-payments-warranties.html?payment=due'; }
    if (cards[4]) { cards[4].querySelector('strong').textContent=summary.partsNeedingAttention; cards[4].querySelector('span').textContent=`${summary.partsLow} ${tr('Low stock').toLowerCase()} · ${summary.partsOut} ${tr('Out of stock').toLowerCase()}`; cards[4].href='6-inventory.html?status=low'; }
    const body=document.querySelector('.row .card .tw table tbody');
    if(body) {
      const rows=store.recentRepairs(state,4).map(repair=>{
        const row=document.createElement('tr'), href=`3-repair-details.html?id=${encodeURIComponent(repair.id)}`;
        row.className='repair-row';row.dataset.href=href;row.tabIndex=0;row.setAttribute('aria-label',`${tr('Open repair')} ${repair.id} · ${repair.customerName} · ${repair.device}`);
        row.innerHTML=`<td><a href="${href}">${esc(repair.id)}</a></td><td>${esc(repair.customerName)}</td><td>${esc(repair.device)}</td><td><span class="tag ${statusClass(repair.status)}">${esc(tr(repair.status))}</span></td><td>${esc(dateText(repair.receivedAt))}</td><td>${money(repair.finalCost||repair.estimatedCost)} <small>${tr(repair.finalCost?'final':'est.')}</small></td>`;
        return row;
      });
      if(!rows.length){const empty=document.createElement('tr');empty.className='empty-row';empty.innerHTML=`<td colspan="6">${esc(tr('No repairs match these filters.'))}</td>`;rows.push(empty);}
      body.replaceChildren(...rows);
      if(!body.dataset.rowNavigationBound){body.dataset.rowNavigationBound='1';body.addEventListener('click',event=>{const row=event.target.closest('tr[data-href]');if(row&&!event.target.closest('a,button,details'))location.href=row.dataset.href;});body.addEventListener('keydown',event=>{if(event.target.matches('tr[data-href]')&&(event.key==='Enter'||event.key===' ')){event.preventDefault();location.href=event.target.dataset.href;}});}
    }
    const stats=document.querySelector('.stats');
    if(stats) {
      const existing=[...stats.querySelectorAll('.stat')];
      store.STATUS_ORDER.filter(status=>status!=='Cancelled').forEach((status,index)=>{
        let card=existing[index];
        if(!card){card=document.createElement('a');card.className='stat';card.innerHTML='<span class="tag" style="align-self:flex-start"></span><b>0</b>';stats.appendChild(card);existing.splice(index,0,card);}
        const tag=card.querySelector('.tag');tag.textContent=tr(status);tag.className=`tag ${statusClass(status)}`;tag.style.alignSelf='flex-start';tag.dataset.status=status;card.querySelector('b').textContent=summary.byStatus[status]||0;card.href=`2-repairs-list.html?status=${encodeURIComponent(status)}`;
      });
    }
    const overview=document.querySelector('.stats')?.previousElementSibling?.querySelector('.ch p');
    if(overview)overview.textContent=tr('{total} orders · {active} active').replace('{total}',summary.total).replace('{active}',summary.active);
    const low=document.querySelector('.stk');
    if(low){
      const parts=summary.inventory.lowParts.slice(0,4);
      if(!parts.length) low.innerHTML=`<p class="hint">${esc(tr('No stock alerts'))}</p>`;
      else low.innerHTML=parts.map(part=>{
        const out=part.stock===0,label=out?tr('Out of stock'):tr('Low stock'),width=part.minimum?Math.min(100,Math.round(part.stock/part.minimum*100)):100;
        const sub=out?`${tr('Out of stock')} · ${tr('minimum')} ${part.minimum}`:`${part.stock} ${tr('left')} · ${tr('minimum')} ${part.minimum}`;
        return `<div class="part out"><div style="display:flex;justify-content:space-between;align-items:center"><b>${esc(part.name)}</b><span class="tag ${out?'t-can':'t-wait'}">${esc(label)}</span></div><div class="bar"><i style="width:${width}%"></i></div><small>${esc(sub)}</small></div>`;
      }).join('');
    }
    const sub=document.querySelector('.content>div:first-child .sub');
    if(sub){const formatted=new Intl.DateTimeFormat(dateLocale(),{weekday:'long',day:'numeric',month:'long'}).format(new Date());sub.textContent=`${formatted} · ${tr('Here’s what needs your attention today.')}`;}
  }

  function renderRepairsList() {
    if(page!=='2-repairs-list.html')return;
    const tbody=document.querySelector('.scr tbody');if(!tbody)return;
    const rows=store.recentRepairs({...state,repairs:[...state.repairs].sort((a,b)=>Date.parse(b.receivedAt)-Date.parse(a.receivedAt))},state.repairs.length).map(repair=>{
      const row=document.createElement('tr'),href=`3-repair-details.html?id=${encodeURIComponent(repair.id)}`,initials=repair.customerName.split(/\s+/).map(item=>item[0]).join('').slice(0,2).toUpperCase();
      row.dataset.href=href;row.dataset.status=repair.status;row.dataset.received=repair.receivedAt;row.dataset.repairId=repair.id;row.tabIndex=0;
      row.innerHTML=`<td><div class="who"><span class="av2 a1">${esc(initials)}</span><div><b>${esc(repair.customerName)}</b><small>${esc(repair.phone)} · ${esc(repair.id)}</small></div></div></td><td>${esc(repair.device)}</td><td>${esc(dateText(repair.receivedAt))}</td><td><span class="tag ${statusClass(repair.status)}">${esc(tr(repair.status))}</span></td><td><b>${money(repair.finalCost||repair.estimatedCost)}</b> <small>${tr(repair.finalCost?'final':'est.')}</small></td><td class="td-r"><details class="mn"><summary aria-label="${esc(tr('Actions'))}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg></summary><div><a href="${href}&amp;edit=1">${esc(tr('Edit'))}</a><a href="#" data-action="delete">${esc(tr('Delete'))}</a></div></details></td>`;
      return row;
    });
    if(!rows.length){const row=document.createElement('tr');row.className='empty-row';row.innerHTML=`<td colspan="6">${esc(tr('No repairs match these filters.'))}</td>`;rows.push(row);}
    tbody.replaceChildren(...rows);
    const total=document.querySelector('.hd h1 .tag');if(total)total.textContent=`${state.repairs.length} ${tr('total')}`;
    const footer=document.querySelector('.scr')?.parentElement?.querySelector('.ft');if(footer)footer.textContent=tr('Showing {count} repairs').replace('{count}',state.repairs.length);
    if(!tbody.dataset.actionsBound){tbody.dataset.actionsBound='1';tbody.addEventListener('click',event=>{
      const action=event.target.closest('[data-action]');
      if(action){event.preventDefault();event.stopPropagation();const row=action.closest('tr'),id=row?.dataset.repairId;if(!id)return;
        if(action.dataset.action==='delete'&&confirm(tr('This repair and its linked payments, warranty, and parts will be removed. Continue?'))){try{commit(store.deleteRepair(state,id),'Repair deleted.');}catch(error){showError(error);}}
        return;
      }
      const row=event.target.closest('tr[data-href]');if(row&&!event.target.closest('a,button,details'))location.href=row.dataset.href;
    });tbody.addEventListener('keydown',event=>{if(event.target.matches('tr[data-href]')&&(event.key==='Enter'||event.key===' ')){event.preventDefault();location.href=event.target.dataset.href;}});}
  }

  function setupFilters() {
    const search=byId('q');if(!search)return;
    const box=search.closest('.fb'),selects=[...(box?.querySelectorAll('select')||[])],clear=box?.querySelector('a[href="#"]');
    const original=option=>option?.dataset.en||option?.textContent.trim()||'';
    const params=new URLSearchParams(location.search);
    const wantedStatus=params.get('status'), activeOnly=params.get('active')==='true';
    if(params.get('q')&&!search.value)search.value=params.get('q');
    if(wantedStatus&&selects[0]){const i=[...selects[0].options].findIndex(option=>original(option)===wantedStatus);if(i>=0)selects[0].selectedIndex=i;}
    if(params.get('status')==='low'&&page==='6-inventory.html'&&selects[1])selects[1].selectedIndex=2;
    if(params.get('payment')==='due'&&page==='5-payments-warranties.html'&&selects[0])selects[0].selectedIndex=1;
    function run(){
      const query=search.value.trim().toLocaleLowerCase();
      document.querySelectorAll('.scr tbody tr').forEach(row=>{
        if(row.classList.contains('empty-row')){row.hidden=!!query;return;}
        let visible=!query||row.textContent.toLocaleLowerCase().includes(query);
        selects.forEach((select,index)=>{
          const value=original(select.selectedOptions[0]);
          if(!visible||!value||/^all\b|^toute\b|^كل\b/i.test(value))return;
          if(page==='2-repairs-list.html'&&index===0)visible=row.dataset.status===value;
          else if(page==='2-repairs-list.html'&&index===1){const time=Date.parse(row.dataset.received),now=new Date(),today=new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime();if(value==='Today')visible=time>=today&&time<today+86400000;else if(value==='Last 7 days')visible=time>=today-6*86400000;else if(value==='This month')visible=new Date(time).getMonth()===now.getMonth()&&new Date(time).getFullYear()===now.getFullYear();}
          else if(page==='6-inventory.html'&&index===0)visible=row.dataset.category===value;
          else if(page==='6-inventory.html'&&index===1)visible=row.dataset.stockStatus===value;
          else if(page==='5-payments-warranties.html'&&index===0)visible=value==='Balance due'?row.dataset.payment==='due':value==='Paid in full'?row.dataset.payment==='paid':true;
          else if(page==='5-payments-warranties.html'&&index===1)visible=value==='No Warranty'?row.dataset.warranty==='No Warranty':row.dataset.warranty===value;
        });
        if(activeOnly&&page==='2-repairs-list.html')visible=visible&&store.ACTIVE_STATUSES.has(row.dataset.status);
        row.hidden=!visible;
      });
    }
    if(!search.dataset.filterBound){search.dataset.filterBound='1';search.addEventListener('input',run);selects.forEach(select=>select.addEventListener('change',run));if(clear)clear.addEventListener('click',event=>{event.preventDefault();search.value='';selects.forEach(select=>select.selectedIndex=0);run();});}
    run();
  }

  function setupNewRepair() {
    if(page!=='4-new-repair.html')return;
    const submit=byId('cr');if(!submit)return;
    const name=document.querySelector('.dl section:nth-of-type(1) .g2 input[type=text]'),phone=document.querySelector('.dl input[type=tel]'),device=document.querySelector('.dl section:nth-of-type(2) input[type=text]');
    const customerSearch=document.querySelector('.dl input[type=search]'),chips=document.querySelector('.chips[aria-labelledby="pb"]');let busy=false;
    if(customerSearch){
      const wrap=customerSearch.closest('.sfx');wrap?.classList.add('suggestion-wrap');const menu=document.createElement('div');menu.className='customer-suggestions';menu.hidden=true;wrap?.appendChild(menu);
      const update=()=>{const q=customerSearch.value.trim().toLocaleLowerCase();const matches=state.customers.filter(customer=>!q||`${customer.name} ${customer.phone}`.toLocaleLowerCase().includes(q)).slice(0,6);menu.replaceChildren(...matches.map(customer=>{const button=document.createElement('button');button.type='button';button.textContent=`${customer.name} · ${customer.phone}`;button.addEventListener('click',()=>{name.value=customer.name;phone.value=customer.phone;customerSearch.value=customer.name;menu.hidden=true;});return button;}));menu.hidden=!matches.length;};
      customerSearch.addEventListener('input',update);customerSearch.addEventListener('focus',update);document.addEventListener('click',event=>{if(!wrap?.contains(event.target))menu.hidden=true;});
    }
    submit.addEventListener('click',()=>{
      if(busy)return;
      const selected=[...(chips?.querySelectorAll('input:checked')||[])].map(input=>input.parentElement.textContent.trim());
      const invalid=[name,phone,device].filter(input=>!input?.value.trim()||(input===phone&&input.value.replace(/\D/g,'').length!==10));
      if(invalid.length||!selected.length){invalid.forEach(input=>input?.classList.add('bad'));if(chips)chips.classList.toggle('bad',!selected.length);(invalid[0]||chips)?.focus?.();ui.toast(tr('Check the required customer, device, phone and problem fields.'));return;}
      const details=document.querySelector('.dl section:nth-of-type(2) textarea')?.value.trim()||'',description=[selected.join(', '),details].filter(Boolean).join(': ');
      const accessories=[...document.querySelectorAll('.chips[aria-labelledby="ac"] input:checked')].map(input=>input.parentElement.textContent.trim());const other=document.querySelector('.dl section:nth-of-type(2)>label.f:last-of-type input')?.value.trim();if(other)accessories.push(other);
      const costInput=document.querySelector('.dr input[type=number]'),estimatedCost=Number(costInput?.value||0);if(!Number.isFinite(estimatedCost)||estimatedCost<0){costInput?.reportValidity();return;}
      try{
        const next=store.createRepair(state,{customerName:name.value,phone:phone.value,device:device.value,description,accessories:accessories.join(', '),estimatedCost});
        next.lastNotice='Repair saved successfully.';
        if(!persist(next)){ui.toast(tr('Could not save this repair. Check this browser’s local storage and try again.'));return;}
        state=next;ui.setState(next);busy=true;submit.disabled=true;location.href=`3-repair-details.html?id=${encodeURIComponent(next.repairs[0].id)}`;
      }catch(error){showError(error);}
    });
    const received=document.querySelector('.rcv b');if(received)received.textContent=dateTimeText(new Date().toISOString());
  }

  function renderRepairDetail() {
    if(page!=='3-repair-details.html')return null;
    const id=new URLSearchParams(location.search).get('id')||'R-1047',repair=state.repairs.find(item=>item.id===id);
    if(!repair){const title=byId('pgT');if(title)title.textContent=tr('Repair not found');const content=document.querySelector('.content');if(content){const note=document.createElement('section');note.className='card';note.style.padding='24px';note.textContent=tr('This repair is no longer in the demo data.');content.appendChild(note);}return null;}
    const customer=customerFor(repair),warranty=warrantyFor(id),total=repair.finalCost||repair.estimatedCost,paid=paidFor(id),remaining=Math.max(0,total-paid);
    const title=byId('pgT');if(title)title.innerHTML=`${esc(repair.id)} · ${esc(repair.device)} <span class="tag ${statusClass(repair.status)}">${esc(tr(repair.status))}</span>`;
    const headerSub=document.querySelector('.hd .sub');if(headerSub)headerSub.textContent=`${tr('Received')} ${dateTimeText(repair.receivedAt)}`;
    [['cN',repair.customerName],['cP',repair.phone],['dN',repair.device],['dC',repair.description||tr('Not specified')],['dA',repair.accessories||tr('None')],['dg',repair.diagnosis||tr('No diagnosis yet.')]].forEach(([id,value])=>{const el=byId(id);if(el)el.textContent=value;});
    const customerCard=byId('cN')?.closest('.card'),contactLines=customerCard?.querySelectorAll('.ir'),emailEl=contactLines?.[1];if(emailEl)emailEl.textContent=customer?.email||'';
    if(customerCard){let history=byId('customer-history-summary');if(!history){history=document.createElement('div');history.id='customer-history-summary';history.className='hint';customerCard.appendChild(history);}const previous=state.repairs.filter(item=>item.customerId===repair.customerId);history.innerHTML=`${esc(tr('Customer repair history'))} · <a href="2-repairs-list.html?q=${encodeURIComponent(repair.customerName)}">${previous.length} ${esc(tr('repairs'))}</a>`;}
    const statusGroup=document.querySelector('.sg');
    if(statusGroup){
      statusGroup.querySelectorAll('input[name="st"]').forEach(input=>{const status=input.closest('label').querySelector('.nm').textContent.trim()||input.dataset.status;const canonical=input.dataset.status||store.STATUS_ORDER.find(item=>tr(item)===status)||status;input.dataset.status=canonical;input.checked=canonical===repair.status;input.closest('label').querySelector('.nm').textContent=tr(canonical);});
    }
    const amounts=[['fE',repair.estimatedCost],['fF',repair.finalCost||repair.estimatedCost],['fP',paid],['fR',remaining]];amounts.forEach(([id,value])=>{const el=byId(id);if(el)el.textContent=money(value);});
    const editValues={eN:repair.customerName,eP:repair.phone,eD:repair.device,eC:repair.description,eG:repair.diagnosis,eO:repair.accessories,eE:repair.estimatedCost,eF:repair.finalCost||repair.estimatedCost};
    Object.entries(editValues).forEach(([id,value])=>{const el=byId(id);if(el)el.value=value;});
    const editHeader=document.querySelector('#me .mh .sub');if(editHeader)editHeader.textContent=`${repair.id} · ${tr('Update the information, then save.')}`;
    const modal=byId('mp');if(modal){
      const subtitle=modal.querySelector('.mh .sub');if(subtitle)subtitle.textContent=`${repair.id} · ${repair.device}`;
      modal.querySelector('.tot').value=total;modal.querySelector('.pd').value=paid;modal.querySelector('.tot').required=true;modal.querySelector('.pd').required=true;
      const dates=modal.querySelectorAll('input[type=date]');if(dates.length>=2){dates[0].max=dateInputValue(new Date());if(warranty){dates[0].value=warranty.starts;dates[1].value=warranty.expires;}}
      const coverage=modal.querySelector('textarea');if(coverage&&warranty)coverage.value=warranty.coverage;
      const history=paymentHistoryHTML(repair.id);let historyBox=modal.querySelector('.payment-history');if(!historyBox){historyBox=document.createElement('div');historyBox.className='payment-history';modal.querySelector('.ms').appendChild(historyBox);}historyBox.innerHTML=`<p class="hint">${esc(tr('Paid is the total collected so far; an increase records a new receipt.'))}</p>${history}`;
      const warrantyPanel=modal.querySelectorAll('.ms')[1];if(warrantyPanel){const status=warranty?store.warrantyStatus(warranty):'No Warranty';let badge=warrantyPanel.querySelector('.warranty-status');if(!badge){badge=document.createElement('span');badge.className='tag warranty-status';warrantyPanel.querySelector('h3')?.appendChild(badge);}badge.className=`tag warranty-status ${status==='Active'?'t-ready':status==='Expired'?'t-can':'t-wait'}`;badge.textContent=tr(status);const fields=warrantyPanel.querySelectorAll('input[type=date],textarea');fields.forEach(field=>field.disabled=repair.status!=='Delivered'&&!warranty);let note=warrantyPanel.querySelector('.eligibility-note');if(!note){note=document.createElement('small');note.className='hint eligibility-note';warrantyPanel.appendChild(note);}note.textContent=repair.status==='Delivered'?'':tr('This warranty is only available after delivery.');}
    }
    renderRepairParts(repair);
    updateReceiptPreview(repair,warranty,total,paid,remaining);
    let deleteButton=document.querySelector('.hd [data-delete-repair]');if(!deleteButton){const edit=document.querySelector('.hd label[for="re"]');if(edit){deleteButton=document.createElement('button');deleteButton.type='button';deleteButton.className='qb';deleteButton.dataset.deleteRepair='1';deleteButton.textContent=tr('Delete repair');edit.parentElement.insertBefore(deleteButton,edit);}}
    return repair;
  }
  function paymentHistoryHTML(repairId) {
    const list=state.payments.filter(item=>item.repairId===repairId).sort((a,b)=>Date.parse(b.paidAt)-Date.parse(a.paidAt));
    return `<h4>${esc(tr('Payment history'))}</h4>${list.length?list.map(item=>`<p>${esc(dateTimeText(item.paidAt))} · ${esc(item.method)} · <b>${money(item.amount)}</b></p>`).join(''):`<p>${esc(tr('No payments recorded yet.'))}</p>`}`;
  }
  function renderRepairParts(repair) {
    const tbody=byId('ptb');if(!tbody)return;
    const allocations=state.repairParts.filter(item=>item.repairId===repair.id);
    const rows=allocations.map(allocation=>{const part=state.parts.find(item=>item.id===allocation.partId);if(!part)return null;const row=document.createElement('tr');row.innerHTML=`<td>${esc(part.name)}${allocation.restored?` <small>(${esc(tr('restored'))})</small>`:''} ${!allocation.restored?`<button class="qb" type="button" data-remove-allocation="${esc(allocation.id)}">${esc(tr('Remove'))}</button>`:''}</td><td>${allocation.quantity}</td><td>${money(allocation.unitCost)}</td><td class="td-r"><b>${money(allocation.quantity*allocation.unitCost)}</b></td>`;return row;}).filter(Boolean);
    if(!rows.length){const row=document.createElement('tr');row.className='empty-row';row.innerHTML=`<td colspan="4">${esc(tr('No parts recorded for this repair.'))}</td>`;rows.push(row);}tbody.replaceChildren(...rows);
    const select=byId('pp');if(select){const selected=select.value;select.replaceChildren(new Option(tr('Select a part'),''),...state.parts.map(part=>new Option(`${part.name} · ${part.stock} ${tr('in stock')}`,part.id,false,part.id===selected)));select.value=selected;}
    const head=document.querySelector('#mpart .mh .sub');if(head)head.textContent=`${repair.id} · ${repair.device}`;
    const add=byId('pa');if(add)add.disabled=true;
  }
  function updateReceiptPreview(repair,warranty,total,paid,remaining) {
    const data={rcD:repair.device,rcC:repair.customerName,rcPh:repair.phone,rcT:money(total),rcP:money(paid),rcR:money(remaining)};
    Object.entries(data).forEach(([id,value])=>{const el=byId(id);if(el)el.textContent=value;});
    const repairRow=document.querySelector('#mr .paper .pl');if(repairRow?.lastElementChild)repairRow.lastElementChild.textContent=repair.id;
    const shop=document.querySelector('#mr .pt');if(shop){const name=shop.querySelector('b');if(name)name.textContent=state.shop.name;const address=shop.querySelector('span');if(address)address.textContent=`${state.shop.phone} · ${state.shop.address}`;}
    const warrantyBox=byId('rcW');if(warrantyBox)warrantyBox.innerHTML=warranty?`<div class="pl"><span>${esc(tr('Warranty status'))}</span><b>${esc(tr(store.warrantyStatus(warranty)))}</b></div><div class="pl"><span>${esc(tr('Starts'))}</span><b>${esc(warranty.starts)}</b></div><div class="pl"><span>${esc(tr('Expires'))}</span><b>${esc(warranty.expires)}</b></div><div class="pl"><span>${esc(tr('Coverage'))}</span><b>${esc(warranty.coverage)}</b></div>`:`<div class="pl"><span>${esc(tr('No Warranty'))}</span></div>`;
  }
  function setupRepairDetailEvents() {
    if(page!=='3-repair-details.html')return;
    const content=document.querySelector('.content');if(!content||content.dataset.repairEvents)return;content.dataset.repairEvents='1';
    content.addEventListener('click',event=>{
      const remove=event.target.closest('[data-remove-allocation]');if(remove){try{if(commit(store.removeRepairPart(state,remove.dataset.removeAllocation),'Part removed and stock restored.'))renderRepairDetail();}catch(error){showError(error);}return;}
      if(event.target.closest('[data-delete-repair]')){const id=new URLSearchParams(location.search).get('id')||'R-1047';if(confirm(tr('This repair and its linked payments, warranty, and parts will be removed. Continue?'))){try{if(commit(store.deleteRepair(state,id),'Repair deleted.'))location.href='2-repairs-list.html';}catch(error){showError(error);}}return;}
      if(event.target.closest('#eS')){
        const form=byId('ef');if(form&&!form.reportValidity())return;const id=new URLSearchParams(location.search).get('id')||'R-1047';
        const accessories=[...document.querySelectorAll('#me input[name="eacc"]:checked')].map(input=>input.value);const other=byId('eO')?.value.trim();if(other)accessories.push(other);
        try{const next=store.updateRepair(state,id,{customerName:byId('eN').value,phone:byId('eP').value,device:byId('eD').value,description:byId('eC').value,diagnosis:byId('eG').value,accessories:accessories.join(', '),estimatedCost:byId('eE').value,finalCost:byId('eF').value});if(commit(next,'Repair details saved.')){closeDialog();renderRepairDetail();}}catch(error){showError(error);}return;
      }
      if(event.target.closest('#mp .mf .btnp')){
        const id=new URLSearchParams(location.search).get('id')||'R-1047',modal=byId('mp'),repair=state.repairs.find(item=>item.id===id);if(!repair||!modal)return;
        const totalInput=modal.querySelector('.tot'),paidInput=modal.querySelector('.pd');if(!totalInput.reportValidity()||!paidInput.reportValidity())return;const total=Number(totalInput.value),paid=Number(paidInput.value),oldPaid=paidFor(id),dates=[...modal.querySelectorAll('input[type=date]')].map(input=>input.value),coverage=modal.querySelector('textarea')?.value.trim()||'';
        try{
          let next=store.saveRepairPayment(state,id,total,paid,modal.querySelector('[name="payment-method"]')?.value||'Cash');
          if(dates.some(Boolean)||coverage){if(dates.every(Boolean)&&coverage)next=store.upsertWarranty(next,id,{starts:dates[0],expires:dates[1],coverage});else if(dates.some(Boolean)||coverage)throw new Error('Warranty dates and coverage are required; expiry must follow the start date.');}
          if(commit(next,paid>oldPaid?'Payment recorded.':'Payment details saved.')){closeDialog();renderRepairDetail();}
        }catch(error){showError(error);}return;
      }
      if(event.target.closest('#pa')){
        const id=new URLSearchParams(location.search).get('id')||'R-1047',partId=byId('pp')?.value,quantity=Number(byId('pq')?.value||1);
        try{if(commit(store.usePart(state,id,partId,quantity),'Part added to repair.')){closeDialog();renderRepairDetail();}}catch(error){showError(error);}return;
      }
    });
    content.addEventListener('change',event=>{
      const input=event.target.closest('.sg input[name="st"]');if(input&&input.checked){const id=new URLSearchParams(location.search).get('id')||'R-1047';try{if(commit(store.setRepairStatus(state,id,input.dataset.status),'Repair status updated.'))renderRepairDetail();}catch(error){showError(error);renderRepairDetail();}}
      if(event.target.id==='pp'||event.target.id==='pq')updatePartAvailability();
      if(event.target.id==='rc'){const id=new URLSearchParams(location.search).get('id')||'R-1047',repair=state.repairs.find(item=>item.id===id);if(repair)updateReceiptPreview(repair,warrantyFor(id),repair.finalCost||repair.estimatedCost,paidFor(id),balanceFor(repair));}
    });
    content.addEventListener('input',event=>{if(event.target.id==='pp'||event.target.id==='pq')updatePartAvailability();const modal=event.target.closest('#mp');if(modal&&event.target.matches('.tot,.pd'))updatePaymentRemainder(modal);});
    const params=new URLSearchParams(location.search),editQuery=params.get('edit');if(editQuery==='1'&&byId('re'))byId('re').checked=true;if(params.get('receipt')==='1'&&byId('rc'))byId('rc').checked=true;
    if(new URLSearchParams(location.search).get('action')==='status')document.querySelector('.sg')?.scrollIntoView({block:'center'});
  }
  function updatePaymentRemainder(modal) {
    const total=Number(modal.querySelector('.tot')?.value||0),paid=Number(modal.querySelector('.pd')?.value||0),remaining=modal.querySelector('.ro'),error=modal.querySelector('.pe');if(!remaining)return;
    if(paid>total){remaining.className='ro err';remaining.textContent='—';if(error)error.hidden=false;}else{remaining.className='ro';remaining.textContent=money(total-paid);if(error)error.hidden=true;}
  }
  function updatePartAvailability() {
    const select=byId('pp'),quantity=byId('pq'),button=byId('pa'),info=byId('pi');if(!select||!button||!info)return;
    const part=state.parts.find(item=>item.id===select.value),amount=Number(quantity?.value||1);button.disabled=!part||!Number.isInteger(amount)||amount<1||amount>part.stock;
    info.className='pi'+(part&&amount>part.stock?' err':'');info.textContent=part?`${part.stock} ${tr('in stock')} · ${money(part.cost)} ${amount>part.stock?`· ${tr('Only {n} in stock.').replace('{n}',part.stock)}`:''}`:tr('Choose a part to see the stock.');
  }

  function renderPayments() {
    if(page!=='5-payments-warranties.html')return;
    const pw=document.querySelector('.pw'),tbody=pw?.querySelector('tbody');if(!pw||!tbody)return;
    const summary=store.dashboardSummary(state),activeWarranties=state.warranties.filter(warranty=>store.warrantyStatus(warranty)==='Active').length,kpis=[...document.querySelectorAll('.content .k3 .kpi')];
    if(kpis[0]){kpis[0].querySelector('strong').innerHTML=`${summary.collectedToday.toLocaleString()} <em>DA</em>`;kpis[0].querySelector('span').textContent=`${summary.collectedTodayCount} ${tr('posted receipts')}`;}
    if(kpis[1]){kpis[1].querySelector('strong').innerHTML=`${summary.outstanding.toLocaleString()} <em>DA</em>`;kpis[1].querySelector('span').textContent=tr('{customers} customers · finalized repairs').replace('{customers}',summary.outstandingCustomers);}
    if(kpis[2]){kpis[2].querySelector('strong').textContent=activeWarranties;kpis[2].querySelector('span').textContent=tr('Still covered');}
    const repairs=[...state.repairs].sort((a,b)=>Date.parse(b.receivedAt)-Date.parse(a.receivedAt));
    const template=byId('m1');const base=template?.cloneNode(true);pw.querySelectorAll('.mo').forEach(modal=>modal.remove());
    const rows=[],modals=[];
    repairs.forEach((repair,index)=>{
      const number=index+1,rid=`r${number}`,mid=`m${number}`,total=store.repairTotal(repair),paid=paidFor(repair.id),remaining=Math.max(0,total-paid),warranty=warrantyFor(repair.id),wStatus=warranty?store.warrantyStatus(warranty):'No Warranty';
      const row=document.createElement('tr');row.dataset.repairId=repair.id;row.dataset.payment=remaining?'due':'paid';row.dataset.warranty=wStatus;row.innerHTML=`<td><label for="${rid}"><input class="sr" type="radio" name="sel" id="${rid}"><b>${esc(repair.device)}</b><small> · ${esc(repair.id)}</small></label></td><td><label for="${rid}">${esc(repair.customerName)}</label></td><td><label for="${rid}">${money(total)}</label></td><td><label for="${rid}"><span style="color:${remaining?'#B91C1C':'#15803D'};font-weight:600">${money(remaining)}</span></label></td><td><label for="${rid}"><span class="tag ${wStatus==='Active'?'t-ready':wStatus==='Expired'?'t-can':wStatus==='No Warranty'?'t-del':'t-wait'}">${esc(tr(wStatus))}</span></label></td>`;
      rows.push(row);
      if(!base)return;
      const modal=base.cloneNode(true);modal.id=mid;modal.dataset.repairId=repair.id;modal.setAttribute('aria-label',`${tr('Details for')} ${repair.device}`);
      modal.querySelector('.mh .mt').textContent=repair.device;modal.querySelector('.mh .sub').textContent=`${repair.customerName} · ${repair.phone}`;
      const view=modal.querySelector('.mh .lnk');if(view)view.href=`3-repair-details.html?id=${encodeURIComponent(repair.id)}`;
      const totalInput=modal.querySelector('.tot'),paidInput=modal.querySelector('.pd');if(totalInput){totalInput.value=total;totalInput.required=true;}if(paidInput){paidInput.value=paid;paidInput.required=true;}
      const ro=modal.querySelector('.ro');if(ro)ro.textContent=money(remaining);
      const amountHeading=modal.querySelector('.ms h3');if(amountHeading)amountHeading.textContent=tr('Payment');
      const paymentBlock=modal.querySelector('.ms');if(paymentBlock){let history=paymentBlock.querySelector('.payment-history');if(!history){history=document.createElement('div');history.className='payment-history';paymentBlock.appendChild(history);}history.innerHTML=`<p class="hint">${esc(tr('Paid is the total collected so far; an increase records a new receipt.'))}</p>${paymentHistoryHTML(repair.id)}`;}
      let method=modal.querySelector('[name="payment-method"]');if(!method){method=document.createElement('select');method.name='payment-method';method.className='in';method.innerHTML=`<option value="Cash">${esc(tr('Cash'))}</option><option value="CCP">CCP</option>`;const label=document.createElement('label');label.className='f';label.innerHTML=`<span>${esc(tr('Method'))}</span>`;label.appendChild(method);paymentBlock.querySelector('.g3')?.appendChild(label);}const latestPayment=state.payments.filter(payment=>payment.repairId===repair.id).sort((a,b)=>Date.parse(b.paidAt)-Date.parse(a.paidAt))[0];method.value=latestPayment?.method||'Cash';
      const warrantyBlock=modal.querySelectorAll('.ms')[1];if(warrantyBlock){const start=repair.status==='Delivered';warrantyBlock.querySelector('h3').textContent=tr('Warranty');let badge=warrantyBlock.querySelector('.warranty-status');if(!badge){badge=document.createElement('span');badge.className='tag warranty-status';warrantyBlock.querySelector('h3').appendChild(badge);}badge.textContent=tr(wStatus);badge.className=`tag warranty-status ${wStatus==='Active'?'t-ready':wStatus==='Expired'?'t-can':'t-wait'}`;
        const oldMessage=warrantyBlock.querySelector('.nw');if(oldMessage)oldMessage.remove();let dates=warrantyBlock.querySelectorAll('input[type=date]'),coverage=warrantyBlock.querySelector('textarea');
        if(!dates.length){const grid=document.createElement('div');grid.className='g2';grid.innerHTML=`<label class="f"><span>${esc(tr('Starts'))}</span><input class="in" type="date"></label><label class="f"><span>${esc(tr('Expires'))}</span><input class="in" type="date"></label>`;warrantyBlock.appendChild(grid);dates=warrantyBlock.querySelectorAll('input[type=date]');}
        if(!coverage){const label=document.createElement('label');label.className='f';label.style.marginTop='16px';label.innerHTML=`<span>${esc(tr('Coverage'))}</span><textarea class="in ta" style="min-height:72px" placeholder="${esc(tr('Describe warranty coverage'))}"></textarea>`;warrantyBlock.appendChild(label);coverage=label.querySelector('textarea');}
        if(dates.length>=2){dates[0].max=dateInputValue(new Date());dates[0].value=warranty?.starts||'';dates[1].value=warranty?.expires||'';}coverage.value=warranty?.coverage||'';
        dates.forEach(input=>input.disabled=!start&&!warranty);coverage.disabled=!start&&!warranty;
        let note=warrantyBlock.querySelector('.eligibility-note');if(!note){note=document.createElement('small');note.className='hint eligibility-note';warrantyBlock.appendChild(note);}note.textContent=start?'':tr('This warranty is only available after delivery.');
      }
      const save=modal.querySelector('.mf .btnp');if(save){save.dataset.savePayment='1';save.textContent=tr('Save changes');}
      const print=modal.querySelector('.mf .qb');if(print){print.dataset.print='1';print.textContent=tr('Print receipt');}
      const actions=modal.querySelector('.mf>div');if(actions){let del=actions.querySelector('[data-delete-repair]');if(!del){del=document.createElement('button');del.type='button';del.className='qb';del.dataset.deleteRepair='1';del.textContent=tr('Delete repair');actions.insertBefore(del,actions.firstChild);}}
      modals.push(modal);
    });
    tbody.replaceChildren(...rows);
    modals.forEach(modal=>pw.appendChild(modal));
    let styles=byId('fixidz-payments-modal-style');if(!styles){styles=document.createElement('style');styles.id='fixidz-payments-modal-style';document.head.appendChild(styles);}styles.textContent=repairs.map((_,index)=>`.pw:has(#r${index+1}:checked) #m${index+1}{display:flex}`).join('\n');
    const footer=pw.querySelector('.ft');if(footer)footer.textContent=tr('Showing {count} repairs').replace('{count}',repairs.length);
    if(!pw.dataset.paymentEvents){pw.dataset.paymentEvents='1';pw.addEventListener('input',event=>{const modal=event.target.closest('.mo');if(modal&&event.target.matches('.tot,.pd'))updatePaymentRemainder(modal);});pw.addEventListener('click',event=>{
      const del=event.target.closest('[data-delete-repair]');if(del){const modal=del.closest('.mo'),id=modal?.dataset.repairId;if(id&&confirm(tr('This repair and its linked payments, warranty, and parts will be removed. Continue?'))){try{commit(store.deleteRepair(state,id),'Repair deleted.');}catch(error){showError(error);}}return;}
      const print=event.target.closest('[data-print]');if(print){const modal=print.closest('.mo');location.href=`3-repair-details.html?id=${encodeURIComponent(modal?.dataset.repairId||'')}&receipt=1`;return;}
      const save=event.target.closest('[data-save-payment]');if(save){const modal=save.closest('.mo'),id=modal?.dataset.repairId,repair=state.repairs.find(item=>item.id===id);if(!repair)return;
        const totalInput=modal.querySelector('.tot'),paidInput=modal.querySelector('.pd');if(!totalInput.reportValidity()||!paidInput.reportValidity())return;const total=Number(totalInput.value),paid=Number(paidInput.value),current=paidFor(id),dates=[...modal.querySelectorAll('input[type=date]')].map(input=>input.value),coverage=modal.querySelector('textarea')?.value.trim()||'';
        try{let next=store.saveRepairPayment(state,id,total,paid,modal.querySelector('[name="payment-method"]')?.value||'Cash');if(dates.some(Boolean)||coverage){if(dates.every(Boolean)&&coverage)next=store.upsertWarranty(next,id,{starts:dates[0],expires:dates[1],coverage});else throw new Error('Warranty dates and coverage are required; expiry must follow the start date.');}commit(next,paid>current?'Payment recorded.':'Payment details saved.');}catch(error){showError(error);}return;
      }
    });}
    setupFilters();
  }

  function stockStatus(part) { return part.stock===0?'Out of stock':part.stock<=part.minimum?'Low stock':'In stock'; }
  function stockClass(part) { const status=stockStatus(part);return status==='Out of stock'?'t-can':status==='Low stock'?'t-wait':'t-ready'; }
  function renderInventory() {
    if(page!=='6-inventory.html'&&page!=='1-dashboard.html')return;
    if(page==='1-dashboard.html')return;
    const summary=store.inventorySummary(state),cards=[...document.querySelectorAll('.k4 .kpi')];
    if(cards[0])cards[0].querySelector('strong').textContent=summary.types;
    if(cards[1])cards[1].querySelector('strong').textContent=summary.low;
    if(cards[1])cards[1].querySelector('span').textContent=tr('Below the minimum');
    if(cards[2]){cards[2].querySelector('strong').textContent=summary.out;cards[2].querySelector('span').textContent=summary.out?summary.lowParts.filter(part=>part.stock===0).map(part=>part.name).join(', '):tr('No stock alerts');}
    if(cards[3])cards[3].querySelector('strong').innerHTML=`${summary.value.toLocaleString()} <em>DA</em>`;
    const body=document.querySelector('.scr tbody'),content=document.querySelector('.content');if(!body||!content)return;
    body.replaceChildren(...state.parts.map((part,index)=>{
      const number=index+1,radioId=`r${number}`,row=document.createElement('tr');row.dataset.partId=part.id;row.dataset.category=part.category;row.dataset.stockStatus=stockStatus(part);row.innerHTML=`<td><label for="${radioId}"><input class="sr" type="radio" name="sel" id="${radioId}"><b>${esc(part.name)}</b></label></td><td><label for="${radioId}"><span class="tag t-del">${esc(tr(part.category))}</span></label></td><td><label for="${radioId}"><b>${part.stock}</b></label></td><td><label for="${radioId}"><b>${money(part.cost)}</b></label></td><td><label for="${radioId}"><span class="tag stock-status ${stockClass(part)}">${esc(tr(stockStatus(part)))}</span></label></td>`;return row;
    }));
    const template=byId('m1')?.cloneNode(true);content.querySelectorAll('.mo[id^="m"]:not(#ma)').forEach(modal=>modal.remove());
    const modals=[];state.parts.forEach((part,index)=>{if(!template)return;const modal=template.cloneNode(true),n=index+1;modal.id=`m${n}`;modal.dataset.partId=part.id;modal.querySelector('.mh .mt').textContent=tr('Edit spare part');
      const text=modal.querySelector('input[type=text][required]'),select=modal.querySelector('select[required]'),description=modal.querySelector('textarea'),nums=[...modal.querySelectorAll('input[type=number][required]')];if(text)text.value=part.name;if(select){const optionIndex=[...select.options].findIndex(option=>(option.dataset.en||option.textContent.trim())===part.category);if(optionIndex>=0)select.selectedIndex=optionIndex;}if(description)description.value=part.description||'';[part.stock,part.minimum,part.cost].forEach((value,i)=>{if(nums[i])nums[i].value=value;});const modalSub=modal.querySelector('.mh .sub');if(modalSub)modalSub.innerHTML=`${esc(part.name)} <span class="tag ${stockClass(part)}" style="margin-left:6px">${esc(tr(stockStatus(part)))}</span>`;
      const oldMovements=modal.querySelector('.stock-movements');if(oldMovements)oldMovements.remove();const movementBox=document.createElement('div');movementBox.className='stock-movements payment-history';movementBox.innerHTML=`<h4>${esc(tr('Stock movements'))}</h4>`;const movements=state.stockMovements.filter(item=>item.partId===part.id).slice(-4).reverse();movementBox.innerHTML+=movements.length?movements.map(item=>`<p>${esc(dateTimeText(item.at))} · ${esc(tr(item.type))} · ${item.type==='usage'||item.type==='restoration'?'':item.type==='adjustment'?'±':'+'}${item.quantity}</p>`).join(''):`<p>${esc(tr('No stock movements recorded yet.'))}</p>`;modal.querySelectorAll('.ms')[1]?.appendChild(movementBox);
      const save=modal.querySelector('.save');if(save){save.dataset.savePart='1';save.textContent=tr('Save changes');}const actions=modal.querySelector('.mf>div');if(actions&&!actions.querySelector('[data-delete-part]')){const del=document.createElement('button');del.type='button';del.className='qb delete-part';del.dataset.deletePart='1';del.textContent=tr('Delete');actions.insertBefore(del,save||null);}modals.push(modal);
    });modals.forEach(modal=>content.appendChild(modal));
    let styles=byId('fixidz-inventory-modal-style');if(!styles){styles=document.createElement('style');styles.id='fixidz-inventory-modal-style';document.head.appendChild(styles);}styles.textContent=state.parts.map((_,index)=>`.content:has(#r${index+1}:checked) #m${index+1}{display:flex}`).join('\n');
    const add=byId('ma');if(add){const save=add.querySelector('.save');if(save){save.dataset.savePart='1';save.textContent=tr('Save part');}}
    const footer=document.querySelector('.content .scr')?.parentElement?.querySelector('.ft');if(footer)footer.textContent=tr('Showing {count} parts').replace('{count}',state.parts.length);
    if(!content.dataset.inventoryEvents){content.dataset.inventoryEvents='1';content.addEventListener('click',event=>{
      const del=event.target.closest('[data-delete-part]');if(del){const modal=del.closest('.mo'),id=modal?.dataset.partId;if(id&&confirm(tr('Delete this spare part? This cannot be undone.'))){try{commit(store.deletePart(state,id),'Part deleted.');}catch(error){showError(error);}}return;}
      const save=event.target.closest('[data-save-part]');if(!save)return;
      const modal=save.closest('.mo'),inputs=[...modal.querySelectorAll('input[required],select[required]')],invalid=inputs.find(input=>!input.value.trim()||!input.validity.valid);if(invalid){invalid.focus();invalid.reportValidity();return;}
      const nums=[...modal.querySelectorAll('input[type=number][required]')],select=modal.querySelector('select[required]'),category=select?.selectedOptions[0]?.dataset.en||select?.value||'';
      const data={name:modal.querySelector('input[type=text][required]')?.value.trim(),category,description:modal.querySelector('textarea')?.value.trim()||'',stock:Number(nums[0]?.value),minimum:Number(nums[1]?.value),cost:Number(nums[2]?.value),sellingPrice:0};
      try{const id=modal.dataset.partId||'',next=store.savePart(state,data,id);if(commit(next,id?'Part updated.':'Part saved.')){closeDialog();if(modal.id==='ma')modal.querySelectorAll('input,textarea').forEach(input=>input.value='');}}
      catch(error){showError(error);}
    });}
    setupFilters();
  }

  function setupSettings() {
    if(page!=='8-settings.html')return;
    const inputs=[...document.querySelectorAll('.stk1 input:not([type=password])')];const values=[state.shop.name,state.shop.phone,state.shop.email,state.shop.address,state.profile.name,state.profile.email];inputs.forEach((input,index)=>{if(values[index]!=null)input.value=values[index];});
    const save=document.querySelector('.stk1 .act .btnp');if(save&&!save.dataset.bound){save.dataset.bound='1';save.addEventListener('click',()=>{
      const shop={name:inputs[0]?.value.trim(),phone:inputs[1]?.value.trim(),email:inputs[2]?.value.trim(),address:inputs[3]?.value.trim()},profile={name:inputs[4]?.value.trim(),email:inputs[5]?.value.trim()};
      const invalid=inputs.find(input=>input.required&&(!input.value.trim()||!input.validity.valid));if(invalid){invalid.focus();invalid.reportValidity();return;}
      try{if(commit(store.saveShopProfile(state,shop,profile),'Settings saved on this device.'))applyShopProfile();}catch(error){showError(error);}
    });}
    const password=document.querySelector('.stk1 section:nth-of-type(3) .btnp');if(password&&!password.dataset.bound){password.dataset.bound='1';password.addEventListener('click',()=>{const fields=[...document.querySelectorAll('input[type=password]')];if(fields.some(field=>!field.value)){ui.toast(tr('Complete all password fields first.'));return;}if(fields[1].value.length<12||fields[1].value!==fields[2].value){ui.toast(tr('Use 12+ characters and make sure both new passwords match.'));return;}fields.forEach(field=>field.value='');ui.toast(tr('Password updated for this demo session.'));});}
  }

  function reportCompletedCount(month,year) {
    return state.repairs.filter(repair=>{
      if(repair.status!=='Delivered')return false;
      const delivered=[...(repair.history||[])].reverse().find(item=>item.type==='status'&&item.status==='Delivered');
      const date=new Date(delivered?.at||repair.receivedAt);return date.getMonth()+1===Number(month)&&date.getFullYear()===Number(year);
    }).length;
  }
  function renderReportChart(summary,month,year) {
    const svg=document.querySelector('.dat .rp2 svg');if(!svg)return;
    const values=Object.entries(summary.daily).map(([day,amount])=>[Number(day),amount]).sort((a,b)=>a[0]-b[0]),max=Math.max(1,...values.map(item=>item[1])),days=new Date(Number(year),Number(month),0).getDate(),left=56,right=700,top=30,bottom=210;
    const grid=[0,.33,.66,1].map(ratio=>{const y=bottom-(bottom-top)*ratio;return `<line x1="${left}" y1="${y}" x2="${right}" y2="${y}" stroke="#E2E8F0"/><text x="46" y="${y+4}" text-anchor="end" font-size="11" fill="#64748B">${Math.round(max*ratio).toLocaleString()}</text>`;}).join('');
    const x=day=>left+(day-1)/(Math.max(1,days-1))*(right-left),y=amount=>bottom-(amount/max)*(bottom-top);
    const path=values.map(([day,amount],index)=>`${index?'L':'M'}${x(day).toFixed(1)},${y(amount).toFixed(1)}`).join(' ');
    const points=values.map(([day,amount])=>`<circle cx="${x(day).toFixed(1)}" cy="${y(amount).toFixed(1)}" r="4" fill="#fff" stroke="#2563EB" stroke-width="2.5"/><text x="${x(day).toFixed(1)}" y="${Math.max(18,y(amount)-9).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="600" fill="#0F172A">${Math.round(amount).toLocaleString()}</text>`).join('');
    const ticks=[1,Math.ceil(days/4),Math.ceil(days/2),Math.ceil(days*3/4),days].filter((value,index,array)=>array.indexOf(value)===index);
    svg.setAttribute('viewBox','0 0 720 250');svg.innerHTML=`<title>${esc(tr('Payments received per day'))}</title>${grid}${path?`<path d="${path}" fill="none" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`:''}${points}${ticks.map(day=>`<text x="${x(day).toFixed(1)}" y="230" text-anchor="middle" font-size="11" fill="#64748B">${day}</text>`).join('')}<text x="378" y="244" text-anchor="middle" font-size="11" fill="#64748B">${esc(tr('Day of'))} ${esc(tr(new Intl.DateTimeFormat('en',{month:'long'}).format(new Date(Number(year),Number(month)-1,1))))} ${year}</text>`;
  }
  function renderReports() {
    if(page!=='7-reports-analytics.html')return;
    const monthSelect=byId('mo'),yearSelect=byId('yr');if(!monthSelect||!yearSelect)return;
    const now=new Date();if(!monthSelect.dataset.initialized){monthSelect.value=String(now.getMonth()+1);yearSelect.value=String(now.getFullYear());monthSelect.dataset.initialized='1';}if(![...yearSelect.options].some(option=>Number(option.value)===now.getFullYear()))yearSelect.add(new Option(String(now.getFullYear()),String(now.getFullYear())));if(!yearSelect.value)yearSelect.value=String(now.getFullYear());
    const month=Number(monthSelect.value),year=Number(yearSelect.value),summary=store.reportsSummary(state,month,year),dashboard=store.dashboardSummary(state),cards=[...document.querySelectorAll('.dat .k3 .kpi')];
    if(cards[0]){cards[0].querySelector('strong').innerHTML=`${summary.totalReceived.toLocaleString()} <em>DA</em>`;cards[0].querySelector('span').textContent=`${summary.paymentCount} ${tr('posted receipts')}`;}
    if(cards[1]){cards[1].querySelector('strong').textContent=reportCompletedCount(month,year);cards[1].querySelector('span').textContent=tr('Delivered in this month');}
    if(cards[2]){cards[2].querySelector('strong').innerHTML=`${dashboard.outstanding.toLocaleString()} <em>DA</em>`;cards[2].querySelector('span').textContent=tr('Current · all finalized repairs');}
    const chartCard=document.querySelector('.dat .rp2 .card:first-child');if(chartCard){const heading=chartCard.querySelector('.ch p');if(heading)heading.textContent=`${summary.totalReceived.toLocaleString()} DA · ${summary.paymentCount} ${tr('posted receipts')}`;const foot=chartCard.querySelector('.hint');if(foot)foot.textContent=Object.entries(summary.daily).sort((a,b)=>Number(a[0])-Number(b[0])).map(([day,amount])=>`${day} · ${money(amount)}`).join('  ·  ')||tr('No payments recorded yet.');}
    renderReportChart(summary,month,year);
    const partsCard=document.querySelector('.dat .rp2 .card:nth-child(2)'),partsList=partsCard?.querySelector('div[style*="display:flex"]');if(partsList){const max=Math.max(1,...summary.partsUsed.map(([,count])=>count));partsList.innerHTML=summary.partsUsed.length?summary.partsUsed.slice(0,6).map(([name,count])=>`<div class="hb"><span>${esc(name)}</span><div class="trk"><i style="width:${Math.round(count/max*100)}%"></i></div><b>${count}</b></div>`).join(''):`<p class="hint">${esc(tr('No parts used in this period.'))}</p>`;const heading=partsCard.querySelector('.ch p');if(heading)heading.textContent=`${summary.unitsUsed} ${tr('units used')}`;}
    const data=document.querySelector('.dat'),empty=document.querySelector('.rp .emp'),hasData=summary.paymentCount>0||summary.unitsUsed>0;if(data)data.hidden=!hasData;if(empty)empty.hidden=hasData;
    if(empty){const h=empty.querySelector('h2');if(h)h.textContent=tr('No data for this period');}
    if(!monthSelect.dataset.bound){monthSelect.dataset.bound='1';monthSelect.addEventListener('change',renderReports);yearSelect.addEventListener('change',renderReports);}
  }

  function setupCommonActions() {
    document.querySelectorAll('.bell').forEach(button=>{if(button.dataset.bound)return;button.dataset.bound='1';button.addEventListener('click',()=>{const summary=store.dashboardSummary(state);ui.toast(tr('{active} active repairs · {ready} ready for pickup').replace('{active}',summary.active).replace('{ready}',summary.ready));});});
    document.querySelectorAll('.um .out, [data-sign-out]').forEach(button=>{if(button.dataset.bound)return;button.dataset.bound='1';button.addEventListener('click',()=>{const menu=button.closest('.um');if(menu)menu.open=false;ui.toast(tr('Sign-out is simulated in this demo.'));});});
    document.querySelectorAll('button').forEach(button=>{if(/print/i.test(button.textContent)&&!button.dataset.print&&!button.dataset.bound){button.dataset.bound='1';button.addEventListener('click',()=>window.print());}});
    document.addEventListener('keydown',event=>{if(event.key==='Escape')closeDialog();});
  }
  function setupDashboardPartModal() {
    if(page!=='1-dashboard.html')return;
    const modal=byId('ma'),save=modal?.querySelector('.save');if(!modal||!save)return;
    save.addEventListener('click',()=>{
      const required=[...modal.querySelectorAll('input[required],select[required]')],invalid=required.find(input=>!input.value.trim()||!input.validity.valid);if(invalid){invalid.focus();invalid.reportValidity();return;}
      const nums=[...modal.querySelectorAll('input[type=number][required]')],category=modal.querySelector('select[required]')?.selectedOptions[0]?.dataset.en||modal.querySelector('select[required]')?.value||'';
      try{const next=store.savePart(state,{name:modal.querySelector('input[type=text][required]').value.trim(),category,description:modal.querySelector('textarea')?.value.trim()||'',stock:Number(nums[0].value),minimum:Number(nums[1].value),cost:Number(nums[2].value),sellingPrice:0});if(commit(next,'Part saved.')){closeDialog();modal.querySelectorAll('input,textarea').forEach(input=>input.value='');}}
      catch(error){showError(error);}
    });
  }
  function renderCurrentPage() {
    applyShopProfile();
    if(page==='1-dashboard.html')renderDashboard();
    if(page==='2-repairs-list.html')renderRepairsList();
    if(page==='3-repair-details.html')renderRepairDetail();
    if(page==='5-payments-warranties.html')renderPayments();
    if(page==='6-inventory.html')renderInventory();
    if(page==='7-reports-analytics.html')renderReports();
    setupFilters();
  }

  addInteractionStyles();
  renderCurrentPage();
  setupNewRepair();
  setupRepairDetailEvents();
  setupSettings();
  setupDashboardPartModal();
  setupCommonActions();
  window.addEventListener('fixidz:language-changed',()=>renderCurrentPage());
  window.addEventListener('storage',event=>{if(event.key===KEY){state=ui.reloadState();renderCurrentPage();}});
})();
