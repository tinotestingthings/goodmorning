(function () {
  "use strict";

  var root = document.getElementById("calendarView");
  if (!root) return;

  var M = null;
  var viewYear, viewMonth, selectedDate = null;
  var viewMode = null;          // month|week|workweek|3day|agenda|myday|done
  var catFilter = "all";        // "all" or a category id
  var searchOpen = false, searchQuery = "";
  var addMode = null;

  var VIEW_KEY = "sbx.cal.view";
  var MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var DOW = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  var WD_FULL = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

  function el(t, cls, txt){ var n=document.createElement(t); if(cls)n.className=cls; if(txt!=null)n.textContent=txt; return n; }
  function pad(n){ return n<10?"0"+n:""+n; }
  function ymd(d){ return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate()); }
  function parseYmd(s){ return new Date(s+"T00:00:00"); }
  function todayStr(){ return ymd(new Date()); }
  function addDays(d,n){ var x=new Date(d.getTime()); x.setDate(x.getDate()+n); return x; }
  function niceDay(ds){ var d=parseYmd(ds); return DOW[(d.getDay()+6)%7]+" "+d.getDate()+" "+MONTHS[d.getMonth()].slice(0,3); }

  function isoWeek(d){
    var date=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));
    var day=(date.getUTCDay()+6)%7; date.setUTCDate(date.getUTCDate()-day+3);
    var ft=date.getTime(); date.setUTCMonth(0,1);
    if(date.getUTCDay()!==4) date.setUTCMonth(0,1+((4-date.getUTCDay())+7)%7);
    return 1+Math.round((ft-date.getTime())/604800000);
  }
  function loadViewMode(){ try{ return localStorage.getItem(VIEW_KEY)||"month"; }catch(e){ return "month"; } }
  function saveViewMode(m){ try{ localStorage.setItem(VIEW_KEY,m); }catch(e){} }

  // ---- data ----
  function catOk(item){ return catFilter==="all" || item.category===catFilter; }

  function todosOn(ds){ return M.loadTodos().filter(function(t){ return t.dueDate===ds && catOk(t); }); }

  // chore occurrence on a single day: 'due' | 'done' | null
  function choreStateOn(chore, ds){
    var d=parseYmd(ds);
    var done=(chore.log||[]).some(function(iso){ return M.localDateStr(new Date(iso))===ds; });
    if(done) return "done";
    if(chore.startDate || chore.pattern==="weekdays" || chore.pattern==="monthly-nth"){
      return M.choreOccursOn(chore,d) ? "due" : null;
    }
    // legacy interval chore (no startDate): show only its rolling next due
    var anchor = chore.lastDone ? M.nudgeToWeekday(M.addInterval(new Date(chore.lastDone),chore.every,chore.unit),chore.weekday) : new Date();
    anchor=parseYmd(ymd(anchor));
    return ymd(anchor)===ds ? "due" : null;
  }

  function choresOn(ds){
    var out=[];
    M.loadChores().forEach(function(c){ if(!catOk(c)) return; var st=choreStateOn(c,ds); if(st) out.push({chore:c,state:st}); });
    return out;
  }

  function marksFor(startStr,endStr){
    var marks={}; var today=todayStr();
    function bump(ds,k){ if(ds<startStr||ds>endStr)return; marks[ds]=marks[ds]||{}; marks[ds][k]=true; if(marks[ds]._cat===undefined)marks[ds]._cat=null; }
    M.loadTodos().forEach(function(t){ if(!t.dueDate||!catOk(t))return;
      if(t.done) bump(t.dueDate,"todoDone"); else { bump(t.dueDate,"todo"); if(t.dueDate<today)bump(t.dueDate,"overdue"); }
      if(t.category&&marks[t.dueDate])marks[t.dueDate]._cat=window.Cats.color(t.category);
    });
    M.loadChores().forEach(function(c){ if(!catOk(c))return;
      var d=parseYmd(startStr);
      for(var i=0;i<420;i++){ var ds=ymd(d); if(ds>endStr)break; var st=choreStateOn(c,ds);
        if(st==="done")bump(ds,"choreDone"); else if(st==="due"){ bump(ds,"choreDue"); if(ds<today)bump(ds,"overdue"); }
        if(st&&c.category&&marks[ds])marks[ds]._cat=window.Cats.color(c.category);
        d=addDays(d,1);
      }
    });
    return marks;
  }

  // ---- render dispatch ----
  function render(){
    if(!M){ M=window.DayModel; if(!M){ root.innerHTML=""; root.appendChild(el("p","dash-empty","Loading…")); return; } }
    if(viewMode==null) viewMode=loadViewMode();
    if(viewYear==null){ var n=new Date(); viewYear=n.getFullYear(); viewMonth=n.getMonth(); selectedDate=todayStr(); }
    root.innerHTML="";
    root.appendChild(buildTopBar());
    root.appendChild(buildFilterChips());
    if(searchOpen){ root.appendChild(buildSearch()); return; }
    if(viewMode==="agenda"){ root.appendChild(buildAgenda()); return; }
    if(viewMode==="myday"){ root.appendChild(buildMyDay()); return; }
    if(viewMode==="done"){ root.appendChild(buildDone()); return; }
    // grid views
    root.appendChild(buildGridHeader());
    root.appendChild(buildGrid());
    root.appendChild(buildDayPanel());
  }

  function buildTopBar(){
    var bar=el("div","cal-topbar");
    var todayBtn=el("button","cal-today-btn","Today"); todayBtn.type="button";
    todayBtn.addEventListener("click",function(){ var n=new Date(); viewYear=n.getFullYear(); viewMonth=n.getMonth(); selectedDate=todayStr(); searchOpen=false; render(); });
    bar.appendChild(todayBtn);

    var sel=document.createElement("select"); sel.className="field-select cal-view-select";
    [["month","Month"],["week","Week"],["workweek","Work week"],["3day","3 days"],["agenda","Agenda"],["myday","My Day"],["done","Done"]].forEach(function(p){
      var o=document.createElement("option"); o.value=p[0]; o.textContent=p[1]; sel.appendChild(o);
    });
    sel.value=viewMode;
    sel.addEventListener("change",function(){ viewMode=sel.value; saveViewMode(viewMode); searchOpen=false; render(); });
    bar.appendChild(sel);

    var searchBtn=el("button","cal-icon-btn", searchOpen?"✕":"🔍"); searchBtn.type="button";
    searchBtn.setAttribute("aria-label","Search");
    searchBtn.addEventListener("click",function(){ searchOpen=!searchOpen; render(); });
    bar.appendChild(searchBtn);
    return bar;
  }

  function buildFilterChips(){
    var row=el("div","cal-chips");
    function chip(id,label,color){
      var b=el("button","cal-chip"+(catFilter===id?" active":""),label); b.type="button";
      if(color){ var dot=el("span","cal-chip-dot"); dot.style.background=color; b.insertBefore(dot,b.firstChild); }
      b.addEventListener("click",function(){ catFilter=id; render(); });
      return b;
    }
    row.appendChild(chip("all","All",null));
    window.Cats.load().forEach(function(c){ row.appendChild(chip(c.id,c.name,c.color)); });
    return row;
  }

  // ---- search ----
  function buildSearch(){
    var wrap=el("div","cal-search");
    var inp=document.createElement("input"); inp.type="text"; inp.className="field-input"; inp.placeholder="Search tasks & chores…"; inp.value=searchQuery;
    inp.addEventListener("input",function(){ searchQuery=inp.value; renderResults(); });
    wrap.appendChild(inp);
    var results=el("div","cal-search-results"); wrap.appendChild(results);
    function renderResults(){
      results.innerHTML="";
      var q=searchQuery.trim().toLowerCase();
      if(!q){ results.appendChild(el("p","cal-empty","Type to search.")); return; }
      var hits=[];
      M.loadTodos().forEach(function(t){ if((t.text||"").toLowerCase().indexOf(q)!==-1) hits.push({type:"todo",title:t.text,sub:(t.dueDate?"To-do · "+t.dueDate:"To-do"),date:t.dueDate,cat:t.category}); });
      M.loadChores().forEach(function(c){ if((c.name||"").toLowerCase().indexOf(q)!==-1) hits.push({type:"chore",title:c.name,sub:"Chore · "+M.freqLabel(c),date:(M.choreProgress(c).nextDue?M.localDateStr(M.choreProgress(c).nextDue):null),cat:c.category}); });
      if(!hits.length){ results.appendChild(el("p","cal-empty","No matches.")); return; }
      hits.forEach(function(h){
        var row=el("div","cal-item");
        if(h.cat){ var b=el("span","cal-cat-bar"); b.style.background=window.Cats.color(h.cat); row.appendChild(b); }
        var body=el("div","cal-item-body");
        body.appendChild(el("div","cal-item-title",h.title));
        body.appendChild(el("div","cal-item-sub",h.sub));
        row.appendChild(body);
        if(h.date){ var go=el("button","cal-link","Go"); go.type="button"; go.addEventListener("click",function(){ selectedDate=h.date; viewMode="month"; saveViewMode("month"); var d=parseYmd(h.date); viewYear=d.getFullYear(); viewMonth=d.getMonth(); searchOpen=false; render(); }); row.appendChild(go); }
        results.appendChild(row);
      });
    }
    renderResults();
    setTimeout(function(){ inp.focus(); },0);
    return wrap;
  }

  // ---- grid header / nav ----
  function gridSpan(){
    // returns {days:[Date...], title, weekNo} for the current grid view
    if(viewMode==="week"||viewMode==="workweek"){
      var sel=parseYmd(selectedDate); var off=(sel.getDay()+6)%7; var mon=addDays(sel,-off);
      var n=viewMode==="workweek"?5:7; var days=[]; for(var i=0;i<n;i++)days.push(addDays(mon,i));
      var last=days[days.length-1];
      return {days:days, title:mon.getDate()+" "+MONTHS[mon.getMonth()].slice(0,3)+" – "+last.getDate()+" "+MONTHS[last.getMonth()].slice(0,3)+" "+last.getFullYear(), weekNo:isoWeek(mon)};
    }
    if(viewMode==="3day"){
      var s=parseYmd(selectedDate); var days3=[s,addDays(s,1),addDays(s,2)];
      return {days:days3, title:s.getDate()+" "+MONTHS[s.getMonth()].slice(0,3)+" – "+days3[2].getDate()+" "+MONTHS[days3[2].getMonth()].slice(0,3), weekNo:isoWeek(s)};
    }
    return null; // month handled separately
  }

  function buildGridHeader(){
    var box=el("div","cal-headbox");
    var head=el("div","cal-head");
    var prev=el("button","cal-nav","‹"); prev.type="button"; prev.addEventListener("click",function(){ shift(-1); });
    var title=el("div","cal-title", viewMode==="month"?MONTHS[viewMonth]+" "+viewYear:gridSpan().title);
    var next=el("button","cal-nav","›"); next.type="button"; next.addEventListener("click",function(){ shift(1); });
    head.appendChild(prev); head.appendChild(title); head.appendChild(next);
    box.appendChild(head);
    return box;
  }

  function shift(delta){
    if(viewMode==="month"){ viewMonth+=delta; if(viewMonth<0){viewMonth=11;viewYear--;} else if(viewMonth>11){viewMonth=0;viewYear++;} render(); return; }
    var step = viewMode==="3day"?3:7;
    var sel=addDays(parseYmd(selectedDate),delta*step); selectedDate=ymd(sel); viewYear=sel.getFullYear(); viewMonth=sel.getMonth(); render();
  }

  function dowHeader(cols){
    var row=el("div","cal-dow"); row.appendChild(el("span","cal-dow-cell cal-wk-head","Wk"));
    for(var i=0;i<cols;i++) row.appendChild(el("span","cal-dow-cell",DOW[i]));
    return row;
  }

  function dayCell(dObj,marks,today,inMonth){
    var ds=ymd(dObj);
    var cell=el("button","cal-cell"); cell.type="button"; cell.setAttribute("data-date",ds);
    if(inMonth===false)cell.classList.add("cal-cell-out");
    if(ds===today)cell.classList.add("cal-cell-today");
    if(ds===selectedDate)cell.classList.add("cal-cell-selected");
    cell.appendChild(el("span","cal-cell-num",String(dObj.getDate())));
    var m=marks[ds];
    if(m){ var dots=el("span","cal-dots");
      if(m.overdue)dots.appendChild(el("span","cal-dot cal-dot-overdue"));
      var td=el("span","cal-dot cal-dot-todo"); if(m._cat)td.style.background=m._cat;
      if(m.todo)dots.appendChild(td);
      if(m.choreDue)dots.appendChild(el("span","cal-dot cal-dot-chore"));
      if((m.todoDone||m.choreDone)&&!m.todo&&!m.choreDue&&!m.overdue)dots.appendChild(el("span","cal-dot cal-dot-done"));
      cell.appendChild(dots);
    }
    cell.addEventListener("click",function(){ selectedDate=ds; render(); });
    return cell;
  }

  function buildGrid(){
    if(viewMode==="month") return buildMonthGrid();
    var span=gridSpan(); var cols=span.days.length;
    var wrap=el("div","cal-grid-wrap"); wrap.appendChild(dowHeader(cols));
    var grid=el("div","cal-grid cal-grid-week"); grid.style.gridTemplateColumns="26px repeat("+cols+",1fr)";
    var marks=marksFor(ymd(span.days[0]),ymd(span.days[cols-1])); var today=todayStr();
    grid.appendChild(el("span","cal-cell cal-wk",String(span.weekNo)));
    span.days.forEach(function(d){ grid.appendChild(dayCell(d,marks,today,d.getMonth()===viewMonth)); });
    wrap.appendChild(grid);
    return wrap;
  }

  function buildMonthGrid(){
    var wrap=el("div","cal-grid-wrap"); wrap.appendChild(dowHeader(7));
    var grid=el("div","cal-grid");
    var first=new Date(viewYear,viewMonth,1); var offset=(first.getDay()+6)%7;
    var dim=new Date(viewYear,viewMonth+1,0).getDate();
    var rows=Math.ceil((offset+dim)/7);
    var startStr=ymd(new Date(viewYear,viewMonth,1-offset));
    var endStr=ymd(new Date(viewYear,viewMonth,1-offset+rows*7-1));
    var marks=marksFor(startStr,endStr); var today=todayStr();
    for(var w=0;w<rows;w++){
      var monday=new Date(viewYear,viewMonth,1-offset+w*7);
      grid.appendChild(el("span","cal-cell cal-wk",String(isoWeek(monday))));
      for(var i=0;i<7;i++){ var dObj=new Date(viewYear,viewMonth,1-offset+w*7+i); grid.appendChild(dayCell(dObj,marks,today,dObj.getMonth()===viewMonth)); }
    }
    wrap.appendChild(grid);
    return wrap;
  }

  // ---- day panel ----
  function buildDayPanel(){
    var panel=el("div","cal-day");
    var head=el("div","cal-day-head");
    head.appendChild(el("h2","cal-day-title", selectedDate===todayStr()?"Today · "+niceDay(selectedDate):niceDay(selectedDate)));
    panel.appendChild(head);
    var chores=choresOn(selectedDate), todos=todosOn(selectedDate);
    if(!chores.length && !todos.length) panel.appendChild(el("p","cal-empty","Nothing scheduled. Add a task below."));
    else { var list=el("div","cal-item-list");
      chores.forEach(function(r){ list.appendChild(choreItem(r.chore,r.state)); });
      todos.forEach(function(t){ list.appendChild(todoItem(t,true)); });
      panel.appendChild(list);
    }
    panel.appendChild(buildAddArea());
    return panel;
  }

  // ---- item rows ----
  function catBar(id){ if(!id)return null; var b=el("span","cal-cat-bar"); b.style.background=window.Cats.color(id); return b; }
  function check(done,onToggle){ var b=el("button","cal-check"+(done?" cal-check-done":"")); b.type="button"; b.innerHTML=done?"&#10003;":""; b.addEventListener("click",onToggle); return b; }
  function bigEditBtn(fn){ var b=el("button","cal-edit cal-edit-big","⋯"); b.type="button"; b.setAttribute("aria-label","Item menu"); b.addEventListener("click",fn); return b; }
  function party(anchor){ if(global_FX()) { window.FX.celebrate(anchor); window.FX.ding(); } }
  function global_FX(){ return typeof window!=="undefined" && window.FX; }

  function todoItem(t,grid){
    var row=el("div","cal-item"); row.setAttribute("data-todo",t.id);
    var cb=catBar(t.category); if(cb)row.appendChild(cb);
    var chk=check(t.done,function(){
      var list=M.loadTodos(); var nowDone=false;
      list.forEach(function(x){ if(x.id===t.id){ x.done=!x.done; nowDone=x.done; if(x.done)M.logTodoHistory(x.text); } });
      M.saveTodos(list); if(nowDone)party(chk); render();
    });
    row.appendChild(chk);
    var body=el("div","cal-item-body");
    var tw=el("div","cal-item-titlewrap");
    tw.appendChild(el("span","cal-item-title"+(t.done?" cal-item-done":""),t.text));
    if(t.snoozes>0)tw.appendChild(el("span","cal-badge-snooze","⏰ postponed "+t.snoozes+"×"));
    if(t.reminderTime)tw.appendChild(el("span","cal-badge-remind","⏰ "+t.reminderTime));
    body.appendChild(tw);
    var sub=["To-do"]; var cat=window.Cats.byId(t.category); if(cat)sub.push(cat.name);
    body.appendChild(el("div","cal-item-sub",sub.join(" · ")));
    row.appendChild(body);
    if(grid && !t.done) row.appendChild(dragHandle(t));
    row.appendChild(bigEditBtn(function(){ openItemMenu(t); }));
    attachHold(row,function(){ openItemMenu(t); });
    return row;
  }

  function choreItem(chore,state){
    var row=el("div","cal-item");
    var cb=catBar(chore.category); if(cb)row.appendChild(cb);
    var doneToday=state==="done";
    var chk=check(doneToday,function(){
      if(selectedDate!==todayStr()){ M.toast("Tick chores off on the day you do them (today)."); return; }
      var list=M.loadChores(); list.forEach(function(c){ if(c.id===chore.id)M.setChoreDoneToday(c,!doneToday); }); M.saveChores(list);
      if(!doneToday)party(chk); render();
    });
    row.appendChild(chk);
    var body=el("div","cal-item-body");
    body.appendChild(el("div","cal-item-title"+(doneToday?" cal-item-done":""),chore.name));
    var sub="Chore · "+M.freqLabel(chore); var cat=window.Cats.byId(chore.category); if(cat)sub+=" · "+cat.name;
    body.appendChild(el("div","cal-item-sub",sub));
    row.appendChild(body);
    row.appendChild(bigEditBtn(function(){ openChoreMenu(chore); }));
    attachHold(row,function(){ openChoreMenu(chore); });
    return row;
  }

  // long-press anywhere on the row (not on a button/handle) opens the menu
  function attachHold(row,onHold){
    var timer=null,sx=0,sy=0;
    function clear(){ if(timer){ clearTimeout(timer); timer=null; } }
    row.addEventListener("pointerdown",function(e){
      if(e.target.closest("button, .cal-drag-handle")) return;
      sx=e.clientX; sy=e.clientY;
      timer=setTimeout(function(){ timer=null; onHold(); },450);
    });
    row.addEventListener("pointermove",function(e){ if(timer && (Math.abs(e.clientX-sx)+Math.abs(e.clientY-sy)>10)) clear(); });
    row.addEventListener("pointerup",clear);
    row.addEventListener("pointercancel",clear);
  }

  function snoozeTodo(id,days){
    var list=M.loadTodos();
    list.forEach(function(t){ if(t.id===id){ var base=t.dueDate?parseYmd(t.dueDate):new Date(); var nd=addDays(base,days); t.dueDate=ymd(nd); t.snoozes=(t.snoozes||0)+1; } });
    M.saveTodos(list); M.toast(days===7?"Pushed to next week":"Pushed to tomorrow"); render();
  }
  function toggleTodoDone(t,done){
    var list=M.loadTodos(); list.forEach(function(x){ if(x.id===t.id){ x.done=done; if(done)M.logTodoHistory(x.text); } }); M.saveTodos(list);
    if(done)party(document.body); render();
  }

  // ---- item menu (hold or the ⋯ button) ----
  function closeMenu(){ var o=document.querySelector(".item-menu-overlay"); if(o)o.remove(); }
  function menuBtn(label,cls,fn){ var b=el("button","item-menu-btn"+(cls?" "+cls:""),label); b.type="button"; b.addEventListener("click",fn); return b; }

  function openItemMenu(t){
    closeMenu();
    var ov=el("div","item-menu-overlay"); ov.addEventListener("click",function(e){ if(e.target===ov)closeMenu(); });
    var sheet=el("div","item-menu");
    sheet.appendChild(el("div","item-menu-title",t.text));
    if(!t.done) sheet.appendChild(menuBtn("✓  Complete","im-done",function(){ closeMenu(); toggleTodoDone(t,true); }));
    else sheet.appendChild(menuBtn("↺  Reopen",null,function(){ closeMenu(); toggleTodoDone(t,false); }));
    sheet.appendChild(postponeBtn(t,1,"Postpone 1 day"));
    sheet.appendChild(postponeBtn(t,7,"Postpone 1 week"));
    sheet.appendChild(menuBtn("✎  Edit details",null,function(){ closeMenu(); openTodoEditor(t); }));
    sheet.appendChild(menuBtn("🗑  Delete","im-danger",function(){ closeMenu(); if(window.confirm("Delete this to-do?")){ M.saveTodos(M.loadTodos().filter(function(x){return x.id!==t.id;})); render(); } }));
    sheet.appendChild(menuBtn("Cancel","im-cancel",function(){ closeMenu(); }));
    ov.appendChild(sheet); document.body.appendChild(ov);
  }

  // postpone always asks a second "Sure?" before acting
  function postponeBtn(t,days,label){
    var wrap=el("div","im-postpone-wrap");
    var b=el("button","item-menu-btn im-postpone","⏰  "+label); b.type="button";
    b.addEventListener("click",function(){
      wrap.innerHTML="";
      var q=el("div","im-confirm");
      q.appendChild(el("div","im-confirm-label","Sure?"));
      var yes=menuBtn("Yes — "+label.toLowerCase(),"im-yes",function(){ closeMenu(); snoozeTodo(t.id,days); });
      var no=menuBtn("No","im-no",function(){ closeMenu(); openItemMenu(t); });
      q.appendChild(yes); q.appendChild(no); wrap.appendChild(q);
    });
    wrap.appendChild(b);
    return wrap;
  }

  function openChoreMenu(chore){
    closeMenu();
    var ov=el("div","item-menu-overlay"); ov.addEventListener("click",function(e){ if(e.target===ov)closeMenu(); });
    var sheet=el("div","item-menu");
    sheet.appendChild(el("div","item-menu-title",chore.name));
    sheet.appendChild(el("div","item-menu-sub",M.freqLabel(chore)));
    sheet.appendChild(menuBtn("✎  Edit chore",null,function(){ closeMenu(); openChoreEditor(chore); }));
    sheet.appendChild(menuBtn("🗑  Delete","im-danger",function(){ closeMenu(); if(window.confirm("Delete \""+chore.name+"\" and stop it recurring?")){ M.saveChores(M.loadChores().filter(function(c){return c.id!==chore.id;})); render(); } }));
    sheet.appendChild(menuBtn("Cancel","im-cancel",function(){ closeMenu(); }));
    ov.appendChild(sheet); document.body.appendChild(ov);
  }

  // ---- drag-to-reschedule (todos, grid views) via a dedicated handle ----
  function cellUnder(x,y){ var e=document.elementFromPoint(x,y); return e?e.closest(".cal-cell[data-date]"):null; }
  function clearDrop(){ [].forEach.call(document.querySelectorAll(".cal-cell-drop"),function(c){c.classList.remove("cal-cell-drop");}); }
  function dragHandle(t){
    var h=el("span","cal-drag-handle","⁙"); h.setAttribute("aria-label","Drag to another day");
    var ghost=null,capturing=false;
    h.addEventListener("pointerdown",function(e){
      e.preventDefault(); e.stopPropagation();
      capturing=true; try{ h.setPointerCapture(e.pointerId); }catch(_){}
    });
    h.addEventListener("pointermove",function(e){
      if(!capturing)return; e.preventDefault();
      if(!ghost){ ghost=el("div","cal-drag-ghost",t.text); document.body.appendChild(ghost); }
      ghost.style.left=e.clientX+"px"; ghost.style.top=e.clientY+"px";
      clearDrop(); var cell=cellUnder(e.clientX,e.clientY); if(cell)cell.classList.add("cal-cell-drop");
    });
    function endDrag(e){
      if(!capturing)return; capturing=false;
      if(ghost){ ghost.remove(); ghost=null; }
      var cell=cellUnder(e.clientX,e.clientY); clearDrop();
      if(cell){ var ds=cell.getAttribute("data-date"); if(ds && ds!==t.dueDate) moveTodo(t.id,ds); }
    }
    h.addEventListener("pointerup",endDrag);
    h.addEventListener("pointercancel",function(){ capturing=false; if(ghost){ghost.remove();ghost=null;} clearDrop(); });
    return h;
  }
  function moveTodo(id,ds){ var list=M.loadTodos(); list.forEach(function(t){ if(t.id===id)t.dueDate=ds; }); M.saveTodos(list); selectedDate=ds; M.toast("Moved to "+niceDay(ds)); render(); }

  // ---- agenda / my day / done ----
  function collectRange(startStr,endStr){
    // returns array of {ds, chores:[], todos:[]} for days with items
    var out=[]; var d=parseYmd(startStr), end=parseYmd(endStr);
    while(d<=end){ var ds=ymd(d); var ch=choresOn(ds), td=todosOn(ds); if(ch.length||td.length)out.push({ds:ds,chores:ch,todos:td}); d=addDays(d,1); }
    return out;
  }
  function buildAgenda(){
    var wrap=el("div","cal-agenda");
    var overdue=overdueTodos();
    if(overdue.length){ wrap.appendChild(el("h3","cal-agenda-head cal-overdue-head","Overdue"));
      var ol=el("div","cal-item-list"); overdue.forEach(function(t){ ol.appendChild(todoItem(t,false)); }); wrap.appendChild(ol);
    }
    var groups=collectRange(todayStr(),ymd(addDays(new Date(),45)));
    if(!groups.length && !overdue.length){ wrap.appendChild(el("p","cal-empty","Nothing coming up.")); return wrap; }
    groups.forEach(function(g){
      wrap.appendChild(el("h3","cal-agenda-head", g.ds===todayStr()?"Today · "+niceDay(g.ds):niceDay(g.ds)));
      var list=el("div","cal-item-list");
      g.chores.forEach(function(r){ list.appendChild(choreItem(r.chore,r.state)); });
      g.todos.forEach(function(t){ list.appendChild(todoItem(t,false)); });
      wrap.appendChild(list);
    });
    return wrap;
  }
  function overdueTodos(){ var today=todayStr(); return M.loadTodos().filter(function(t){ return !t.done && t.dueDate && t.dueDate<today && catOk(t); }); }

  function buildMyDay(){
    var wrap=el("div","cal-agenda");
    wrap.appendChild(el("h2","cal-day-title","My Day · "+niceDay(todayStr())));
    var overdue=overdueTodos();
    if(overdue.length){ wrap.appendChild(el("h3","cal-agenda-head cal-overdue-head","Overdue ("+overdue.length+")"));
      var ol=el("div","cal-item-list"); overdue.forEach(function(t){ ol.appendChild(todoItem(t,false)); }); wrap.appendChild(ol);
    }
    var ch=choresOn(todayStr()), td=todosOn(todayStr());
    wrap.appendChild(el("h3","cal-agenda-head","Today"));
    if(!ch.length&&!td.length) wrap.appendChild(el("p","cal-empty","Nothing scheduled for today."));
    else { var list=el("div","cal-item-list"); ch.forEach(function(r){ list.appendChild(choreItem(r.chore,r.state)); }); td.forEach(function(t){ list.appendChild(todoItem(t,false)); }); wrap.appendChild(list); }
    var addWrap=el("div","cal-add"); var b=el("button","btn btn-primary cal-add-btn","+ Add task today"); b.type="button";
    b.addEventListener("click",function(){ selectedDate=todayStr(); addMode="pick"; viewMode="month"; saveViewMode("month"); render(); });
    addWrap.appendChild(b); wrap.appendChild(addWrap);
    return wrap;
  }

  function choreStreak(chore){
    // consecutive most-recent occurrences that were completed
    var d=new Date(); var streak=0; var guard=0;
    // start from today going back; only count occurrence days
    while(guard<400){ var ds=ymd(d);
      if(chore.startDate && ds<chore.startDate) break;
      if(M.choreOccursOn?M.choreOccursOn(chore,parseYmd(ds)):false){
        var done=(chore.log||[]).some(function(iso){ return M.localDateStr(new Date(iso))===ds; });
        if(done) streak++; else if(ds!==todayStr()) break; // today not-yet-done doesn't break
      }
      d=addDays(d,-1); guard++;
    }
    return streak;
  }
  function buildDone(){
    var wrap=el("div","cal-agenda");
    wrap.appendChild(el("h2","cal-day-title","Done & streaks"));
    // chore streaks
    var chores=M.loadChores().filter(catOk);
    if(chores.length){ wrap.appendChild(el("h3","cal-agenda-head","Chores"));
      var cl=el("div","cal-item-list");
      chores.forEach(function(c){ var row=el("div","cal-item"); var cb=catBar(c.category); if(cb)row.appendChild(cb);
        var body=el("div","cal-item-body"); body.appendChild(el("div","cal-item-title",c.name));
        var n=(c.log||[]).length; var st=choreStreak(c);
        body.appendChild(el("div","cal-item-sub",n+" done total · streak "+st));
        row.appendChild(body); cl.appendChild(row);
      }); wrap.appendChild(cl);
    }
    // completed todos
    var doneTodos=M.loadTodos().filter(function(t){ return t.done && catOk(t); });
    wrap.appendChild(el("h3","cal-agenda-head","Completed to-dos"));
    if(!doneTodos.length) wrap.appendChild(el("p","cal-empty","Nothing completed yet."));
    else { var tl=el("div","cal-item-list"); doneTodos.forEach(function(t){ tl.appendChild(todoItem(t,false)); }); wrap.appendChild(tl); }
    return wrap;
  }

  // ---- add / edit ----
  function buildAddArea(){
    var wrap=el("div","cal-add");
    if(!addMode){ var b=el("button","btn btn-primary cal-add-btn","+ Add task on this day"); b.type="button"; b.addEventListener("click",function(){ addMode="pick"; render(); }); wrap.appendChild(b); return wrap; }
    if(addMode==="pick"){ var q=el("div","cal-pick"); q.appendChild(el("div","cal-pick-label","What kind of task?"));
      var a=el("button","btn btn-ghost","One-off to-do"); a.type="button"; a.addEventListener("click",function(){ openTodoEditor(null); });
      var r=el("button","btn btn-ghost","Recurring chore"); r.type="button"; r.addEventListener("click",function(){ openChoreEditor(null); });
      var c=el("button","cal-link","Cancel"); c.type="button"; c.addEventListener("click",function(){ addMode=null; render(); });
      q.appendChild(a); q.appendChild(r); q.appendChild(c); wrap.appendChild(q); return wrap;
    }
    if(addMode==="todo"){ wrap.appendChild(todoEditor); return wrap; }
    if(addMode==="chore"){ wrap.appendChild(choreEditor); return wrap; }
    return wrap;
  }
  var todoEditor=null, choreEditor=null;
  function field(ph,val){ var i=document.createElement("input"); i.type="text"; i.className="field-input"; i.placeholder=ph; if(val)i.value=val; return i; }
  function catSelect(current){
    var s=document.createElement("select"); s.className="field-select";
    var none=document.createElement("option"); none.value=""; none.textContent="No category"; s.appendChild(none);
    window.Cats.load().forEach(function(c){ var o=document.createElement("option"); o.value=c.id; o.textContent=c.name; s.appendChild(o); });
    if(current)s.value=current; return s;
  }

  function openTodoEditor(existing){
    addMode="todo"; var box=el("div","inline-form");
    var text=field("What needs doing?",existing?existing.text:""); box.appendChild(text);
    var dRow=el("div","inline-form-row"); dRow.appendChild(el("span","inline-form-label","Day"));
    var date=document.createElement("input"); date.type="date"; date.className="field-input"; date.value=existing&&existing.dueDate?existing.dueDate:selectedDate; dRow.appendChild(date); box.appendChild(dRow);
    var cRow=el("div","inline-form-row"); cRow.appendChild(el("span","inline-form-label","Category")); var cat=catSelect(existing?existing.category:""); cRow.appendChild(cat); box.appendChild(cRow);
    var rRow=el("div","inline-form-row"); rRow.appendChild(el("span","inline-form-label","Remind")); var rem=document.createElement("input"); rem.type="time"; rem.className="field-input"; if(existing&&existing.reminderTime)rem.value=existing.reminderTime; rRow.appendChild(rem); rRow.appendChild(el("span","inline-form-hint","optional")); box.appendChild(rRow);
    var actions=el("div","inline-form-row");
    var save=el("button","btn btn-primary",existing?"Save":"+ Add to-do"); save.type="button";
    save.addEventListener("click",function(){ var txt=text.value.trim(); if(!txt){ M.toast("Type something first"); return; }
      var list=M.loadTodos();
      if(existing){ list.forEach(function(x){ if(x.id===existing.id){ x.text=txt; x.dueDate=date.value||null; x.category=cat.value||null; x.reminderTime=rem.value||null; } }); }
      else { list.push({ id:"todo-"+Date.now()+"-"+Math.random().toString(36).slice(2,7), text:txt, dueDate:date.value||null, done:false, category:cat.value||null, reminderTime:rem.value||null, snoozes:0 }); }
      M.saveTodos(list); if(date.value)selectedDate=date.value; addMode=null; render();
    });
    actions.appendChild(save);
    if(existing){ var del=el("button","btn btn-danger","Delete"); del.type="button"; del.addEventListener("click",function(){ if(!window.confirm("Delete this to-do?"))return; M.saveTodos(M.loadTodos().filter(function(x){return x.id!==existing.id;})); addMode=null; render(); }); actions.appendChild(del); }
    var cancel=el("button","cal-link","Cancel"); cancel.type="button"; cancel.addEventListener("click",function(){ addMode=null; render(); }); actions.appendChild(cancel);
    box.appendChild(actions); todoEditor=box; render(); setTimeout(function(){ text.focus(); },0);
  }

  function openChoreEditor(existing){
    addMode="chore"; var box=el("div","inline-form");
    var name=field("Chore name",existing?existing.name:""); box.appendChild(name);
    // recurrence type
    var typeRow=el("div","inline-form-row"); typeRow.appendChild(el("span","inline-form-label","Repeat"));
    var type=document.createElement("select"); type.className="field-select field-select-wide";
    [["interval","Every N days/weeks…"],["weekdays","Every weekday (Mon–Fri)"],["monthly-nth","Monthly (nth weekday)"]].forEach(function(p){ var o=document.createElement("option"); o.value=p[0]; o.textContent=p[1]; type.appendChild(o); });
    type.value=existing?(existing.pattern||"interval"):"interval"; typeRow.appendChild(type); box.appendChild(typeRow);
    // interval fields
    var ivRow=el("div","inline-form-row"); ivRow.appendChild(el("span","inline-form-label","Every"));
    var every=document.createElement("input"); every.type="number"; every.min="1"; every.max="365"; every.className="field-input field-input-narrow"; every.value=existing?String(existing.every||1):"1"; ivRow.appendChild(every);
    var unit=document.createElement("select"); unit.className="field-select"; [["day","days"],["week","weeks"],["month","months"],["year","years"]].forEach(function(p){ var o=document.createElement("option"); o.value=p[0]; o.textContent=p[1]; unit.appendChild(o); }); unit.value=existing?(existing.unit||"week"):"week"; ivRow.appendChild(unit); box.appendChild(ivRow);
    // monthly-nth fields
    var nthRow=el("div","inline-form-row"); nthRow.appendChild(el("span","inline-form-label","On the"));
    var nth=document.createElement("select"); nth.className="field-select"; [["1","1st"],["2","2nd"],["3","3rd"],["4","4th"],["-1","last"]].forEach(function(p){ var o=document.createElement("option"); o.value=p[0]; o.textContent=p[1]; nth.appendChild(o); }); if(existing&&existing.nth!=null)nth.value=String(existing.nth); nthRow.appendChild(nth);
    var wd2=document.createElement("select"); wd2.className="field-select"; WD_FULL.forEach(function(nm,i){ var o=document.createElement("option"); o.value=String(i); o.textContent=nm; wd2.appendChild(o); }); if(existing&&existing.weekday2!=null)wd2.value=String(existing.weekday2); else wd2.value="1"; nthRow.appendChild(wd2); box.appendChild(nthRow);
    // start / end
    var sRow=el("div","inline-form-row"); sRow.appendChild(el("span","inline-form-label","Starts")); var start=document.createElement("input"); start.type="date"; start.className="field-input"; start.value=existing&&existing.startDate?existing.startDate:selectedDate; sRow.appendChild(start); box.appendChild(sRow);
    var eRow=el("div","inline-form-row"); eRow.appendChild(el("span","inline-form-label","Ends")); var ends=document.createElement("select"); ends.className="field-select"; [["never","Never"],["on","On date"]].forEach(function(p){ var o=document.createElement("option"); o.value=p[0]; o.textContent=p[1]; ends.appendChild(o); }); eRow.appendChild(ends);
    var endD=document.createElement("input"); endD.type="date"; endD.className="field-input"; if(existing&&existing.endDate){ ends.value="on"; endD.value=existing.endDate; } else endD.classList.add("hidden"); eRow.appendChild(endD);
    ends.addEventListener("change",function(){ if(ends.value==="on"){ endD.classList.remove("hidden"); if(!endD.value)endD.value=start.value; } else endD.classList.add("hidden"); }); box.appendChild(eRow);
    // category
    var cRow=el("div","inline-form-row"); cRow.appendChild(el("span","inline-form-label","Category")); var cat=catSelect(existing?existing.category:""); cRow.appendChild(cat); box.appendChild(cRow);

    function syncType(){ var v=type.value; ivRow.style.display=(v==="interval")?"":"none"; nthRow.style.display=(v==="monthly-nth")?"":"none"; }
    type.addEventListener("change",syncType); syncType();

    var actions=el("div","inline-form-row");
    var save=el("button","btn btn-primary",existing?"Save":"+ Add chore"); save.type="button";
    save.addEventListener("click",function(){ var nm=name.value.trim(); if(!nm){ M.toast("Give the chore a name first"); return; }
      var startDate=start.value||null; var endDate=(ends.value==="on"&&endD.value)?endD.value:null;
      if(startDate&&endDate&&endDate<startDate){ M.toast("End date is before the start."); return; }
      var pat=type.value;
      var base={ name:nm, category:cat.value||null, startDate:startDate, endDate:endDate, pattern:pat };
      if(pat==="interval"){ base.every=Math.max(1,parseInt(every.value,10)||1); base.unit=unit.value; base.weekday=null; }
      else if(pat==="monthly-nth"){ base.nth=parseInt(nth.value,10); base.weekday2=parseInt(wd2.value,10); }
      var list=M.loadChores();
      if(existing){ list=list.map(function(c){ if(c.id!==existing.id)return c; var merged={id:c.id,lastDone:c.lastDone||null,log:c.log||[]}; for(var k in base)merged[k]=base[k]; return merged; }); }
      else { base.id="chore-"+Date.now()+"-"+Math.random().toString(36).slice(2,7); base.lastDone=null; base.log=[]; list.push(base); }
      M.saveChores(list); if(startDate)selectedDate=startDate; addMode=null; render();
    });
    actions.appendChild(save);
    if(existing){ var del=el("button","btn btn-danger","Delete"); del.type="button"; del.addEventListener("click",function(){ if(!window.confirm("Delete \""+existing.name+"\" and stop it recurring?"))return; M.saveChores(M.loadChores().filter(function(c){return c.id!==existing.id;})); addMode=null; render(); }); actions.appendChild(del); }
    var cancel=el("button","cal-link","Cancel"); cancel.type="button"; cancel.addEventListener("click",function(){ addMode=null; render(); }); actions.appendChild(cancel);
    box.appendChild(actions); choreEditor=box; render(); setTimeout(function(){ name.focus(); },0);
  }

  if(window.App && window.App.onShow) window.App.onShow("calendar",function(){ addMode=null; searchOpen=false; render(); });
})();
