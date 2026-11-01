const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

// ---- 类目分组：同组平铺展示，不折叠 ----
const GROUPS = [
  {name:"术原 · 超导护肤", sy:true, cats:["超导仪器","超导面膜","微通道导入","光疗协同","局部精护","检测定制"]},
  {name:"面部美容与光电", cats:["面部美容仪","光电/激光","LED光疗","美眼仪","清洁仪","皮肤护理仪","皮肤检测仪"]},
  {name:"水光导入与术后修复", cats:["水光仪耗材","医美术后修复"]},
  {name:"身体、头皮与口腔", cats:["身体护理仪","头皮/生发仪","口腔美白"]},
  {name:"女性健康", cats:["女性健康/经期","女性健康/盆底","女性健康/产后","女性健康/私密","女性健康/更年期","女性健康/调理","女性健康/体重管理","女性健康/偏头痛"]},
  {name:"运动康复与身心放松", cats:["运动辅助","运动康复","缓解疲劳","情绪/睡眠"]},
];
const groupOf = c => (GROUPS.find(g => g.cats.includes(c)) || {name:"其他"}).name;
const short = c => c.replace(/^女性健康\//, "");
const isSY = i => !!i.rank;
const BRANDS = ["Ulike","极萌","金茉","术原"];
const VIEWS = [["all","全部"],["group","集团机会新品"],["sy","术原 · 超导护肤"]];
const SUB = {
  all:"Ulike集团 · 女性健康/变美家用仪器机会新品，数据截至2026-10-28",
  group:"Ulike集团 · 女性健康/变美家用仪器机会新品，数据截至2026-10-28",
  sy:"术原 · 超导护肤：用器械ID的创新，解决用户护肤过程中的问题"};
let view = "all";
try { view = localStorage.getItem("ulike-new-products-gpt:view:v1") || "all"; } catch(e) {}
if (!VIEWS.some(v => v[0]===view)) view = "all";
const inView = i => view==="all" || (view==="sy") === isSY(i);
const pool = () => DATA.items.filter(inView);

const dates = [...new Set(DATA.items.map(i => i.date).concat(DATA.days.map(d => d.date)))].sort().reverse();
const latest = dates[0];
let state = {q:"", date:"all", cat:"all", verdict:"all", rank:"all"};
$("#date").innerHTML = `<option value="all">全部日期</option>` + dates.map(d => `<option value="${d}">${d}</option>`).join("");

function renderViews(){
  const n = {all:DATA.items.length, group:DATA.items.filter(i=>!isSY(i)).length, sy:DATA.items.filter(isSY).length};
  $("#views").innerHTML = VIEWS.map(([k,l]) => `<button role="tab" type="button" data-view="${k}" class="${k}" aria-selected="${view===k}">${l} <em>${n[k]}</em>${k==="sy"?'<span class="new">NEW</span>':""}</button>`).join("");
  document.body.classList.toggle("v-sy", view==="sy");
  $("#h1").innerHTML = view==="sy" ? `<span class="symark">术原 <small>SHUYUAN</small></span> 超导护肤新品` : SITE_TITLE;
  $("#sub").textContent = SUB[view];
  const items = pool();
  if (view==="sy"){
    $("#sItems").textContent = items.filter(i=>i.rank==="主推").length; $("#sItemsL").textContent = "主推";
    $("#sDays").textContent = items.filter(i=>i.rank==="次推").length; $("#sDaysL").textContent = "次推";
  } else {
    $("#sItems").textContent = items.length; $("#sItemsL").textContent = "机会新品";
    $("#sDays").textContent = dates.length; $("#sDaysL").textContent = "期";
  }
  $("#sLatest").textContent = latest ? latest.slice(5) : "—";
  renderBand();
}
const isPre = i => (i.launch||{}).status === "未上市";
const lastUpd = i => (i.updates||[]).slice(-1)[0];
const isNewUpd = i => { const u = lastUpd(i); return u && u.date >= latest; };
const updBadge = i => isNewUpd(i) ? `<span class="upd" title="${esc(lastUpd(i).note)}">本期更新</span>` : "";
const preBadge = i => isPre(i) ? `<span class="pre">未上市</span>` : "";
const pickBadge = i => i.picked ? `<span class="picked">意向品</span>` : "";
function renderPre(){
  const pre = DATA.items.filter(isPre);
  $("#plband").innerHTML = pre.length ? `<button class="zone z-pl" type="button" data-openpl><span class="dot"></span><span class="zt"><b>未上市专区</b><span>已收录、还没开卖的新品，标预计上市时间和信息来源，每周回查</span></span><span class="zn">${pre.length} 个</span><span class="za">→</span></button>` : "";
  $("#plgrid").innerHTML = pre.map(i => { const L = i.launch; return `<div class="plcard" data-go="${esc(i.id)}" role="button" tabindex="0">
    ${i.img?`<img src="${i.img}" alt="" loading="lazy">`:`<span class="ph">待上市<br>暂无商品图</span>`}
    <div><h3>${esc(i.name)}</h3><div class="techs">${brandTags(i)}</div>
    <p class="exp">预计上市：${esc(L.expected)}</p>
    ${L.note?`<p>${esc(L.note)}</p>`:""}
    <p class="meta">最近核查：${esc(L.checked||"")}</p>
    <div class="srcs">信息来源：${(L.sources||[]).map(l=>`<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.title)}</a>`).join("")}</div>
    <span class="go">看详情 →</span></div></div>`; }).join("") || `<p class="empty">目前没有未上市的新品。</p>`;
  const ups = DATA.items.filter(isNewUpd);
  const note = $("#updnote");
  note.hidden = !ups.length;
  if (ups.length) note.innerHTML = `<b>本期更新 ${ups.length} 项</b>` + ups.map(i => `<button type="button" data-go="${esc(i.id)}" title="${esc(lastUpd(i).note)}">${esc(i.name.replace(/（.*$/,""))}</button>`).join("");
}
function renderBand(){
  const sy = DATA.items.filter(isSY);
  $("#zonegrid").classList.toggle("syon", view==="sy");
  if (!sy.length) { $("#syband").innerHTML = ""; return; }
  const main = sy.filter(i => i.rank==="主推"), sec = sy.filter(i => i.rank==="次推");
  if (view !== "sy"){
    $("#syband").innerHTML = `<button class="zone z-sy" type="button" data-view="sy"><span class="dot"></span><span class="zt"><b>术原 · 超导护肤</b><span>用器械ID的创新解决护肤痛点，仪器+耗材绑定</span></span><span class="zn">主推 ${main.length} · 次推 ${sec.length}</span><span class="za">→</span></button>`;
    return;
  }
  const pains = {}; sy.forEach(i => (i.pain||[]).forEach(p => pains[p]=(pains[p]||0)+1));
  $("#syband").innerHTML = `<div class="syhero">
    <div class="pos"><span class="symark">超导护肤</span><p>护肤品本身不缺好成分，缺的是"进得去、用得对、坚持得下来"。术原专区只收能用器械ID的创新解决这些问题的产品：仪器负责开通道和推送，耗材负责有效成分，两者绑定形成复购。</p></div>
    <div class="pains"><span>按用户痛点看</span>${Object.entries(pains).sort((a,b)=>b[1]-a[1]).map(([p,n]) => `<button class="pain" type="button" data-pain="${esc(p)}" aria-pressed="${ost.pain===p}">${esc(p)} ${n}</button>`).join("")}</div>
    <div class="strip-h">本期主推 <span class="rank rank-主推">主推 ${main.length}</span></div>
    <div class="strip">${main.map(i => `<button class="scard" type="button" data-go="${esc(i.id)}">${i.img?`<img src="${i.img}" alt="" loading="lazy">`:`<span class="ph none">参考图待补</span>`}<b>${esc(i.name.replace(/^【示例】/,""))}</b><span>创新点：${esc((i.summary||{}).innovation||i.innovation)}</span></button>`).join("")}</div>
  </div>`;
}
function setView(v){
  view = v; try { localStorage.setItem("ulike-new-products-gpt:view:v1", v); } catch(e) {}
  state.cat = "all"; ost.category = "all"; ost.pain = "all";
  renderViews(); buildOFilters(); render(); orender();
}
document.addEventListener("click", e => {
  const v = e.target.closest("[data-view]"); if (v) { setView(v.dataset.view); return; }
  const p = e.target.closest("[data-pain]"); if (p) { ost.pain = ost.pain===p.dataset.pain ? "all" : p.dataset.pain; buildOFilters(); orender(); renderBand(); $("#overview").scrollIntoView({behavior:"smooth"}); }
});

const brandTags = i => (i.brands||[]).map(b => `<span class="tag br br-${esc(b)}">${esc(b)}</span>`).join("");
function catMatch(i){
  if (state.cat==="all") return true;
  if (state.cat.startsWith("grp:")) return groupOf(i.category)===state.cat.slice(4);
  return i.category===state.cat;
}
function renderCats(){
  const items = pool(), counts = {};
  items.forEach(i => counts[i.category] = (counts[i.category]||0)+1);
  const extra = Object.keys(counts).filter(c => groupOf(c)==="其他");
  const groups = GROUPS.concat(extra.length ? [{name:"其他", cats:extra}] : []);
  let html = "";
  for (const g of groups){
    const cs = g.cats.filter(c => counts[c]); if (!cs.length) continue;
    const n = cs.reduce((a,c)=>a+counts[c],0);
    html += `<div class="cg${g.sy?" sy":""}"><button class="glabel" data-cat="grp:${esc(g.name)}" aria-pressed="${state.cat==="grp:"+g.name}">${esc(g.name)} ${n}</button><div class="chips">` +
      cs.map(c => `<button class="chip" data-cat="${esc(c)}" aria-pressed="${state.cat===c}">${esc(short(c))} <i>${counts[c]}</i></button>`).join("") + `</div></div>`;
  }
  $("#cats").innerHTML = html;
}
function card(i){
  const sy = isSY(i);
  const L = sy ? {reason:"推荐原因",aud:"目标人群",pts:"核心卖点",links:"竞品参考链接"} : {reason:"理由",aud:"针对人群",pts:"产品卖点",links:"参考链接"};
  return `<article id="item-${esc(i.id)}"${sy?' class="is-sy"':""}>
      <div class="pic">${i.img
        ? `<a class="frame" href="${esc(i.image_page||(i.links[0]||{}).url)}" target="_blank" rel="noopener"><img src="${i.img}" alt="${esc(i.name)} 现有参考图" loading="lazy"></a><small>现有参考图</small>`
        : `<a class="none" href="${esc(i.image_page||(i.links[0]||{}).url)}" target="_blank" rel="noopener">查看参考商品图 ↗</a><small>现有参考图</small>`}</div>
      <div class="body"><div class="top"><h3>${esc(i.name)}</h3><div class="tags">${pickBadge(i)}${updBadge(i)}${preBadge(i)}${sy?`<span class="tag sy">术原</span><span class="rank rank-${esc(i.rank)}">${esc(i.rank)}</span>`:""}${i.direction?`<span class="tag${i.direction.startsWith("医美")?" med":""}">${esc(i.direction)}</span>`:""}<span class="tag cat">${esc(short(i.category))}</span>${i.type?`<span class="tag">${esc(i.type)}</span>`:""}${(i.tech||[]).map(t=>`<span class="tag">${esc(t)}</span>`).join("")}<a class="back" href="#overview">↑ 清单</a></div></div>
      <dl>
        ${i.launch ? `<dt>上市状态</dt><dd><b>${esc(i.launch.status)}</b>${i.launch.expected?` · 预计上市：${esc(i.launch.expected)}`:""}${i.launch.note?`<br>${esc(i.launch.note)}`:""}${(i.launch.sources||[]).length?`<span class="srcs">${i.launch.sources.map(l=>`<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.title)}</a>`).join("")}</span>`:""}</dd>` : ""}
        ${(i.updates||[]).length ? `<dt>更新记录</dt><dd>${i.updates.map(u=>`${esc(u.date)}：${esc(u.note)}`).join("<br>")}</dd>` : ""}
        <dt>${L.reason}</dt><dd>${esc(i.reason)}</dd>
        <dt>${L.aud}</dt><dd>${esc(i.audience)}</dd>
        <dt>${L.pts}</dt><dd>${esc(i.points)}</dd>
        <dt>适配品牌</dt><dd class="platforms">${brandTags(i)}</dd>
        ${i.concept ? `<dt>创新概念</dt><dd class="concept"><b>${esc(i.concept.title)}</b><br>${esc(i.concept.desc)}<div class="cups">${i.concept.primary==="skin"?`<span class="skin">主打护肤品 · 仪器辅助</span>`:""}${(i.concept.kit||[]).map(k=>`<span>配套：${esc(k[1])}</span>`).join("")}${(i.concept.up||[]).map(u=>`<span>${esc(u)}</span>`).join("")}</div></dd>` : ""}
        ${(i.steps||[]).length ? `<dt>操作使用步骤</dt><dd><ol class="steps">${i.steps.map(t=>`<li>${esc(t)}</li>`).join("")}</ol></dd>` : ""}
        ${sy ? `<dt>产品创新点</dt><dd class="innov">${esc(i.innovation)}</dd>
        <dt>解决痛点</dt><dd class="platforms">${(i.pain||[]).map(p=>`<span class="ptag">${esc(p)}</span>`).join("")}</dd>` : ""}
        ${(i.platforms||[]).length ? `<dt>主销售平台</dt><dd class="platforms">${i.platforms.map(p=>`<span class="ptag">${esc(p)}</span>`).join("")}</dd>` : ""}
        ${i.visual && i.visual.idea ? `<dt>宣传可视化方向</dt><dd class="visual">${i.visual.hook?`<b class="vhook">「${esc(i.visual.hook)}」</b>${i.visual.sell?`<span class="vsell">对应卖点：${esc(i.visual.sell)}</span>`:""}<br>`:""}${esc(i.visual.idea)}${(i.visual.links||[]).length?`<span class="srcs">素材参考：${i.visual.links.map(l=>`<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.title)}</a>`).join("")}</span>`:""}</dd>` : ""}
        ${i.market ? `<dt>市场规模</dt><dd>${i.market.tier?`<span class="tier tier-${esc(i.market.tier)}">${esc(i.market.tier)}</span> `:""}${esc(i.market.size)}</dd>
        <dt>增速</dt><dd>${esc(i.market.growth)}</dd>
        <dt>用户需求</dt><dd><span class="lvl lvl-${esc(i.market.demand_level)}">需求${esc(i.market.demand_level)}</span>${esc(i.market.demand)}</dd>` : ""}
        ${i.unmet ? `<dt>需求缺口</dt><dd><b>需求</b> ${esc(i.unmet.demand)}<br><b>没被满足</b> ${esc(i.unmet.gap)}<br><b>怎么解决</b> ${esc(i.unmet.solve)}${(i.unmet.sources||[]).length?`<span class="srcs">${i.unmet.sources.map(l=>`<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.title)}</a>`).join("")}</span>`:""}</dd>` : ""}
        <dt>${L.links}</dt><dd class="links">${(i.links||[]).map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.title)}</a>`).join("")}</dd>
        <dt>推荐理由</dt><dd class="why">${i.market?`<span class="vd vd-${esc(i.market.verdict)}">${esc(i.market.verdict)}</span>`:""}${esc(i.why)}${i.market?`<span class="mview"><b>市场维度</b>${esc(i.market.view)}</span>`:""}</dd>
        ${i.market && i.market.sources && i.market.sources.length ? `<dt>相关资料</dt><dd class="srcs">${i.market.sources.map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.title)}</a>`).join("")}</dd>` : ""}
      </dl></div></article>`;
}
function render(){
  renderCats();
  const q = state.q.trim().toLowerCase(), all = pool();
  const items = all.filter(i =>
    (state.date==="all" || i.date===state.date) && catMatch(i) &&
    (state.verdict==="all" || (i.market||{}).verdict===state.verdict) &&
    (view!=="sy" || state.rank==="all" || i.rank===state.rank) &&
    (!q || JSON.stringify({...i, img:undefined}).toLowerCase().includes(q)));
  $("#count").innerHTML = `显示 ${items.length} / ${all.length} 条` + (state.cat!=="all" ? `<button class="allcat" type="button" data-cat="all">清除类目筛选</button>` : `<span class="allcat" style="text-decoration:none;color:var(--muted)">点分组名可选整组</span>`);
  const shownDates = dates.filter(d => state.date==="all" || d===state.date);
  const filtered = q || state.cat !== "all" || state.verdict !== "all" || view==="sy";
  let html = "";
  for (const d of shownDates){
    let its = items.filter(i => i.date===d);
    if (view==="all") its = its.filter(isSY).concat(its.filter(i=>!isSY(i)));
    if (view==="sy") its.sort((a,b)=>(a.rank==="主推"?0:1)-(b.rank==="主推"?0:1));
    const day = DATA.days.find(x => x.date===d);
    if (filtered && !its.length) continue;
    if (!its.length && !(day && day.brief && day.brief.length)) continue;
    html += `<section class="day"><div class="dayhead"><h2>${d}</h2>${d===latest?'<span class="latest">最新</span>':''}</div>`;
    if (day && day.brief && day.brief.length && !filtered){
      const relOf = b => (b.items||[]).map(id => DATA.items.find(x => x.id===id)).filter(Boolean);
      const nRel = new Set(day.brief.flatMap(b => b.items||[])).size;
      html += `<details class="brief"${d===latest?" open":""}><summary>行业速览<span class="briefn">${day.brief.length} 条动态${nRel?` · 关联本期 ${nRel} 个新品`:""}</span></summary><ul>` +
        day.brief.map(b => { const rel = relOf(b); return `<li><p>${esc(b.text)} <a class="src" href="${esc(b.url)}" target="_blank" rel="noopener">${esc(b.source)}</a></p>${rel.length?`<div class="rel"><span>相关新品</span>${rel.map(i => `<button type="button" data-go="${esc(i.id)}">${esc(i.name.replace(/（.*$/,""))}</button>`).join("")}</div>`:""}</li>`; }).join("") + `</ul></details>`;
    }
    html += its.map(card).join("") + `</section>`;
  }
  $("#list").innerHTML = html || `<p class="empty">没有符合条件的机会新品，换个关键词或类目试试。</p>`;
}
$("#q").addEventListener("input", e => { state.q = e.target.value; render(); });
$("#date").addEventListener("change", e => { state.date = e.target.value; render(); });
$("#verdict").addEventListener("change", e => { state.verdict = e.target.value; render(); });
$("#rank").addEventListener("change", e => { state.rank = e.target.value; render(); });
document.querySelector(".bar").addEventListener("click", e => { const b = e.target.closest("[data-cat]"); if (!b) return; state.cat = b.dataset.cat; render(); });

// ---- 新品清单 ----
const OK = ["rank","pain","picked","platform","date","direction","brand","category","verdict","tier","tech"];
const oget = (i,k) => k==="verdict"||k==="tier" ? [(i.market||{})[k]] : k==="tech" ? (i.tech||[]) : k==="pain" ? (i.pain||[]) : k==="platform" ? (i.platforms||[]) : k==="brand" ? (i.brands||[]) : k==="picked" ? [i.picked?"已选意向品":"其他"] : [i[k]];
const OALL = {picked:"全部",rank:"全部层级",pain:"全部痛点",platform:"全部平台",brand:"全部品牌",date:"全部日期",direction:"全部方向",category:"全部品类",verdict:"全部",tier:"全部梯队",tech:"全部技术"};
const OORDER = {picked:["已选意向品","其他"],brand:BRANDS, rank:["主推","次推"], verdict:["推荐","谨慎推荐","观望"], tier:["第一梯队","第二梯队","第三梯队","暂无统计"]};
let ost = Object.fromEntries(OK.map(k=>[k,"all"]));
function buildOFilters(){
  const items = pool();
  document.querySelectorAll("#ofilters select").forEach(sel => {
    const k = sel.dataset.k, counts = {};
    items.forEach(i => oget(i,k).forEach(v => { if (v) counts[v]=(counts[v]||0)+1; }));
    let vals = Object.keys(counts);
    if (ost[k]!=="all" && !vals.includes(ost[k])) ost[k]="all";
    const opt = v => `<option value="${esc(v)}">${esc(k==="category"?short(v):v)}（${counts[v]}）</option>`;
    if (k==="category"){
      sel.innerHTML = `<option value="all">${OALL[k]}</option>` + GROUPS.concat([{name:"其他",cats:vals.filter(c=>groupOf(c)==="其他")}])
        .map(g => { const cs = g.cats.filter(c=>counts[c]); return cs.length ? `<optgroup label="${esc(g.name)}">${cs.map(opt).join("")}</optgroup>` : ""; }).join("");
    } else {
      vals = k==="date" ? vals.sort().reverse() : OORDER[k] ? OORDER[k].filter(v=>counts[v]) : vals.sort((a,b)=>counts[b]-counts[a]);
      sel.innerHTML = `<option value="all">${OALL[k]}</option>` + vals.map(opt).join("");
    }
    sel.value = ost[k];
  });
}
document.querySelectorAll("#ofilters select").forEach(sel => sel.addEventListener("change", e => { ost[sel.dataset.k]=e.target.value; orender(); if (sel.dataset.k==="pain") renderBand(); }));
$("#oreset").addEventListener("click", () => { OK.forEach(k=>ost[k]="all"); buildOFilters(); orender(); renderBand(); });
function cols(){
  const c = [["机会新品"],["新品方向"],["适配品牌"],["主销平台"],["品类"],["使用技术"],["理由"],["针对人群"],["产品卖点"],["市场规模"],["增速"],["用户需求"],["推荐理由"],["明细"]];
  if (view==="sy") return [["机会新品"],["推荐层级"],["新品方向"],["适配品牌"],["主销平台"],["品类"],["使用技术"],["推荐原因"],["目标人群"],["核心卖点"],["产品创新点"],["市场规模"],["增速"],["用户需求"],["推荐理由"],["明细"]];
  return c;
}
function orender(){
  $("#othead").innerHTML = cols().map(c=>`<th>${c[0]}</th>`).join("");
  const all = pool();
  const rows = all.filter(i => OK.every(k => ost[k]==="all" || oget(i,k).includes(ost[k])));
  if (view==="all") rows.sort((a,b)=>(isSY(b)-isSY(a)) || 0);
  if (view==="sy") rows.sort((a,b)=>(a.rank==="主推"?0:1)-(b.rank==="主推"?0:1));
  $("#ocount").textContent = `共 ${rows.length} / ${all.length} 个`;
  $("#otbody").innerHTML = rows.map(i => { const s=i.summary||{}, m=i.market||{}, sy=isSY(i); return `<tr>
    <td class="nm"><div class="nmrow">${i.img?`<img src="${i.img}" alt="" loading="lazy">`:`<span class="ph"></span>`}<div><b>${esc(i.name)}</b><small>${esc(i.date)}</small> ${pickBadge(i)}${updBadge(i)}${preBadge(i)}${sy&&view!=="sy"?` <span class="tag sy">术原·${esc(i.rank)}</span>`:""}</div></div></td>
    ${view==="sy" ? `<td class="w1"><span class="rank rank-${esc(i.rank)}">${esc(i.rank)}</span></td>` : ""}
    <td class="w1"><span class="tag${(i.direction||"").startsWith("医美")?" med":""}">${esc(i.direction)}</span></td>
    <td class="w1"><div class="techs">${brandTags(i)}</div></td>
    <td class="w1"><div class="techs">${(i.platforms||[]).map(p=>`<span class="tag">${esc(p)}</span>`).join("")}</div></td>
    <td class="w1"><span class="tag cat">${esc(short(i.category))}</span></td>
    <td class="w1"><div class="techs">${(i.tech||[]).map(t=>`<span class="tag">${esc(t)}</span>`).join("")}</div></td>
    <td class="w3">${esc(s.reason||i.reason)}</td>
    <td class="w2">${esc(s.audience||i.audience)}</td>
    <td class="w2">${esc(s.points||i.points)}</td>
    ${view==="sy" ? `<td class="w3">${esc(s.innovation||i.innovation)}</td>` : ""}
    <td class="w3">${m.tier?`<span class="tier tier-${esc(m.tier)}">${esc(m.tier)}</span><br>`:""}${esc(s.size||m.size)}</td>
    <td class="w2">${esc(s.growth||m.growth)}</td>
    <td class="w2">${m.demand_level?`<span class="lvl lvl-${esc(m.demand_level)}">需求${esc(m.demand_level)}</span>`:""}${esc(s.demand||m.demand)}</td>
    <td class="w3">${m.verdict?`<span class="vd vd-${esc(m.verdict)}">${esc(m.verdict)}</span>`:""}${esc(s.why||i.why)}</td>
    <td><button class="go" type="button" data-go="${esc(i.id)}">看明细 ↓</button></td></tr>`; }).join("")
    || `<tr><td colspan="16" class="empty">没有符合条件的新品，换个筛选试试。</td></tr>`;
}
document.addEventListener("click", e => {
  if (e.target.closest("[data-openpl]")) { $("#pldlg").showModal(); return; }
  if (e.target.id === "plclose" || e.target === $("#pldlg")) { $("#pldlg").close(); return; }
  const b = e.target.closest("[data-go]"); if (!b) return;
  if ($("#pldlg").open) $("#pldlg").close();
  let el = document.getElementById("item-"+b.dataset.go);
  if (!el) { state = {q:"",date:"all",cat:"all",verdict:"all",rank:"all"}; $("#q").value=""; $("#date").value="all"; $("#verdict").value="all"; $("#rank").value="all"; render(); el = document.getElementById("item-"+b.dataset.go); }
  if (!el && view !== "all") { setView("all"); el = document.getElementById("item-"+b.dataset.go); }
  if (!el) return;
  el.scrollIntoView({behavior:"smooth", block:"start"});
  el.classList.add("flash"); setTimeout(()=>el.classList.remove("flash"), 1800);
});
renderViews(); buildOFilters(); render(); orender(); renderPre();
// 明细筛选吸顶状态 + 目录当前位置
(() => {
  const bar = $("#bar"), sent = $("#barsent"), secs = ["zones","overview","details"].map(id => document.getElementById(id));
  const toc = $(".toc");
  const tick = () => {
    const nh = toc.offsetHeight; document.documentElement.style.setProperty("--navh", nh + "px"); document.documentElement.style.setProperty("--barh", bar.offsetHeight + "px");
    toc.classList.toggle("stuck", toc.getBoundingClientRect().top <= 1 && scrollY > 10);
    bar.classList.toggle("stuck", sent.getBoundingClientRect().top < nh && bar.getBoundingClientRect().top <= nh + 1);
    let cur = secs[0].id; secs.forEach(s => { if (s.getBoundingClientRect().top < nh + 120) cur = s.id; });
    document.querySelectorAll(".toc a").forEach(a => a.setAttribute("aria-current", a.dataset.sec === cur));
  };
  addEventListener("scroll", tick, {passive:true}); addEventListener("resize", tick); tick();
})();
