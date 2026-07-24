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
    if(window.Ics){ var de=parseYmd(startStr); while(ymd(de)<=endStr){ if(icsOn(ymd(de)).length)bump(ymd(de),"event"); de=addDays(de,1); } }
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
    if(viewMode==="day"){ root.appendChild(buildDayHeader()); root.appendChild(buildDayTimeline()); return; }
    if(viewMode==="week"||viewMode==="workweek"||viewMode==="3day"){ var wdays=daysForView(); root.appendChild(buildTimelineHeader(wdays)); root.appendChild(buildWeekTimeline(wdays)); return; }
    // grid views (month only now)
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
    [["month","Month"],["week","Week"],["workweek","Work week"],["3day","3 days"],["day","Day"],["agenda","Agenda"],["myday","My Day"],["done","Done"]].forEach(function(p){
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
    var step = viewMode==="day"?1:(viewMode==="3day"?3:7);
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
      if(m.event)dots.appendChild(el("span","cal-dot cal-dot-event"));
      if((m.todoDone||m.choreDone)&&!m.todo&&!m.choreDue&&!m.overdue&&!m.event)dots.appendChild(el("span","cal-dot cal-dot-done"));
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
    var chores=choresOn(selectedDate), todos=todosOn(selectedDate), events=icsOn(selectedDate);
    if(!chores.length && !todos.length && !events.length) panel.appendChild(el("p","cal-empty","Nothing scheduled. Add a task below."));
    else { var list=el("div","cal-item-list");
      chores.forEach(function(r){ list.appendChild(choreItem(r.chore,r.state,selectedDate)); });
      todos.forEach(function(t){ list.appendChild(todoItem(t,true)); });
      events.forEach(function(ev){ list.appendChild(icsItem(ev)); });
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

  function completeTodoToggle(t,anchor){
    var list=M.loadTodos(); var nowDone=false;
    list.forEach(function(x){ if(x.id===t.id){ x.done=!x.done; nowDone=x.done; if(x.done)M.logTodoHistory(x.text); } });
    M.saveTodos(list); if(nowDone)party(anchor); render();
  }
  function linkChip(url){ var a=document.createElement("a"); a.className="cal-link-chip"; a.href=url; a.target="_blank"; a.rel="noopener noreferrer"; a.textContent="🔗"; a.addEventListener("click",function(e){ e.stopPropagation(); }); return a; }
  function todoItem(t,grid,swipe){
    var row=el("div","cal-item"); row.setAttribute("data-todo",t.id);
    var cb=catBar(t.category); if(cb)row.appendChild(cb);
    var chk=check(t.done,function(){ completeTodoToggle(t,chk); });
    row.appendChild(chk);
    var body=el("div","cal-item-body");
    var tw=el("div","cal-item-titlewrap");
    tw.appendChild(el("span","cal-item-title"+(t.done?" cal-item-done":""),t.text));
    if(t.snoozes>0)tw.appendChild(el("span","cal-badge-snooze","⏰ postponed "+t.snoozes+"×"));
    if((t.reminders&&t.reminders.length)||t.reminderTime)tw.appendChild(el("span","cal-badge-remind","🔔"));
    if(t.url)tw.appendChild(linkChip(t.url));
    body.appendChild(tw);
    var sub=[]; if(t.startTime)sub.push(t.startTime+(t.endTime?"–"+t.endTime:"")+(t.tz?" ("+t.tz+")":"")); sub.push("To-do"); var cat=window.Cats.byId(t.category); if(cat)sub.push(cat.name);
    body.appendChild(el("div","cal-item-sub",sub.join(" · ")));
    if(t.note)body.appendChild(el("div","cal-item-note",t.note));
    row.appendChild(body);
    if(grid && !t.done) row.appendChild(dragHandle(t));
    row.appendChild(bigEditBtn(function(){ openItemMenu(t); }));
    attachHold(row,function(){ openItemMenu(t); });
    if(swipe && !t.done) enableAgendaSwipe(row,t);
    return row;
  }
  // swipe on list-view items: right = complete, left = postpone 1 day
  function enableAgendaSwipe(row,t){
    var x0=0,y0=0,drag=false,axis=null;
    row.classList.add("cal-swipeable"); row.style.touchAction="pan-y";
    row.addEventListener("pointerdown",function(e){ if(e.target.closest("button,a,.cal-drag-handle"))return; x0=e.clientX;y0=e.clientY;drag=true;axis=null; row.style.transition=""; });
    row.addEventListener("pointermove",function(e){ if(!drag)return; var dx=e.clientX-x0,dy=e.clientY-y0;
      if(!axis){ if(Math.abs(dx)<8&&Math.abs(dy)<8)return; axis=Math.abs(dx)>Math.abs(dy)?"x":"y"; if(axis==="x"){ try{row.setPointerCapture(e.pointerId);}catch(_){} } else { drag=false; return; } }
      if(axis==="x"){ if(e.cancelable)e.preventDefault(); row.style.transform="translateX("+dx+"px)"; row.style.background=dx>0?"rgba(47,174,102,0.12)":"rgba(217,164,65,0.12)"; }
    });
    function end(e){ if(!drag)return; drag=false; if(axis!=="x"){ return; } var dx=e.clientX-x0;
      row.style.transition="transform .2s ease"; row.style.transform=""; row.style.background="";
      if(Math.abs(dx)>90){ if(dx>0) completeTodoToggle(t,row); else snoozeTodo(t.id,1); } }
    row.addEventListener("pointerup",end);
    row.addEventListener("pointercancel",function(){ drag=false; row.style.transform=""; row.style.background=""; });
  }
  function choreItem(chore,state,occDate){
    occDate=occDate||selectedDate;
    var row=el("div","cal-item");
    var cb=catBar(chore.category); if(cb)row.appendChild(cb);
    var doneToday=state==="done";
    var chk=check(doneToday,function(){
      if(occDate!==todayStr()){ M.toast("Tick chores off on the day you do them (today)."); return; }
      var list=M.loadChores(); list.forEach(function(c){ if(c.id===chore.id)M.setChoreDoneToday(c,!doneToday); }); M.saveChores(list);
      if(!doneToday)party(chk); render();
    });
    row.appendChild(chk);
    var body=el("div","cal-item-body");
    var tw=el("div","cal-item-titlewrap");
    tw.appendChild(el("span","cal-item-title"+(doneToday?" cal-item-done":""),chore.name));
    if(chore.url)tw.appendChild(linkChip(chore.url));
    body.appendChild(tw);
    var sub="Chore · "+M.freqLabel(chore); var cat=window.Cats.byId(chore.category); if(cat)sub+=" · "+cat.name;
    body.appendChild(el("div","cal-item-sub",sub));
    if(chore.note)body.appendChild(el("div","cal-item-note",chore.note));
    row.appendChild(body);
    row.appendChild(bigEditBtn(function(){ openChoreMenu(chore,occDate); }));
    attachHold(row,function(){ openChoreMenu(chore,occDate); });
    return row;
  }
  function icsItem(ev){
    var row=el("div","cal-item cal-item-ics");
    row.appendChild(el("span","cal-ics-bar"));
    var body=el("div","cal-item-body");
    body.appendChild(el("div","cal-item-title",ev.title));
    body.appendChild(el("div","cal-item-sub",(ev.allDay?"All day":(ev.startTime||""))+" · Subscribed"));
    row.appendChild(body); return row;
  }
  function icsOn(ds){ return window.Ics?window.Ics.eventsOn(ds):[]; }

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
    sheet.appendChild(menuBtn("⧉  Duplicate",null,function(){ closeMenu(); duplicateTodo(t); }));
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

  function openChoreMenu(chore,occDate){
    occDate=occDate||selectedDate;
    closeMenu();
    var ov=el("div","item-menu-overlay"); ov.addEventListener("click",function(e){ if(e.target===ov)closeMenu(); });
    var sheet=el("div","item-menu");
    sheet.appendChild(el("div","item-menu-title",chore.name));
    sheet.appendChild(el("div","item-menu-sub",niceDay(occDate)+" · "+M.freqLabel(chore)));
    // postpone only THIS occurrence (an exception), leaving the series intact
    sheet.appendChild(chorePostponeBtn(chore,occDate,1,"Postpone this day 1 day"));
    sheet.appendChild(chorePostponeBtn(chore,occDate,7,"Postpone this day 1 week"));
    sheet.appendChild(menuBtn("✎  Edit whole chore",null,function(){ closeMenu(); openChoreEditor(chore); }));
    sheet.appendChild(menuBtn("⧉  Duplicate",null,function(){ closeMenu(); duplicateChore(chore); }));
    sheet.appendChild(menuBtn("🗑  Delete series","im-danger",function(){ closeMenu(); if(window.confirm("Delete \""+chore.name+"\" and stop it recurring?")){ M.saveChores(M.loadChores().filter(function(c){return c.id!==chore.id;})); render(); } }));
    sheet.appendChild(menuBtn("Cancel","im-cancel",function(){ closeMenu(); }));
    ov.appendChild(sheet); document.body.appendChild(ov);
  }
  function chorePostponeBtn(chore,occDate,days,label){
    var wrap=el("div","im-postpone-wrap");
    var b=el("button","item-menu-btn im-postpone","⏰  "+label); b.type="button";
    b.addEventListener("click",function(){ wrap.innerHTML="";
      var q=el("div","im-confirm"); q.appendChild(el("div","im-confirm-label","Move just this one occurrence?"));
      var yes=menuBtn("Yes — "+label.toLowerCase(),"im-yes",function(){ closeMenu(); postponeChoreOccurrence(chore,occDate,days); });
      var no=menuBtn("No","im-no",function(){ closeMenu(); openChoreMenu(chore,occDate); });
      q.appendChild(yes); q.appendChild(no); wrap.appendChild(q);
    });
    wrap.appendChild(b); return wrap;
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
    while(d<=end){ var ds=ymd(d); var ch=choresOn(ds), td=todosOn(ds), ev=icsOn(ds); if(ch.length||td.length||ev.length)out.push({ds:ds,chores:ch,todos:td,events:ev}); d=addDays(d,1); }
    return out;
  }
  function buildAgenda(){
    var wrap=el("div","cal-agenda");
    var overdue=overdueTodos();
    if(overdue.length){ wrap.appendChild(el("h3","cal-agenda-head cal-overdue-head","Overdue"));
      var ol=el("div","cal-item-list"); overdue.forEach(function(t){ ol.appendChild(todoItem(t,false,true)); }); wrap.appendChild(ol);
    }
    var groups=collectRange(todayStr(),ymd(addDays(new Date(),45)));
    if(!groups.length && !overdue.length){ wrap.appendChild(el("p","cal-empty","Nothing coming up.")); return wrap; }
    groups.forEach(function(g){
      wrap.appendChild(el("h3","cal-agenda-head", g.ds===todayStr()?"Today · "+niceDay(g.ds):niceDay(g.ds)));
      var list=el("div","cal-item-list");
      g.chores.forEach(function(r){ list.appendChild(choreItem(r.chore,r.state,g.ds)); });
      g.todos.forEach(function(t){ list.appendChild(todoItem(t,false,true)); });
      (g.events||[]).forEach(function(ev){ list.appendChild(icsItem(ev)); });
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
      var ol=el("div","cal-item-list"); overdue.forEach(function(t){ ol.appendChild(todoItem(t,false,true)); }); wrap.appendChild(ol);
    }
    var ch=choresOn(todayStr()), td=todosOn(todayStr()), evs=icsOn(todayStr());
    wrap.appendChild(el("h3","cal-agenda-head","Today"));
    if(!ch.length&&!td.length&&!evs.length) wrap.appendChild(el("p","cal-empty","Nothing scheduled for today."));
    else { var list=el("div","cal-item-list"); ch.forEach(function(r){ list.appendChild(choreItem(r.chore,r.state,todayStr())); }); td.forEach(function(t){ list.appendChild(todoItem(t,false,true)); }); evs.forEach(function(ev){ list.appendChild(icsItem(ev)); }); wrap.appendChild(list); }
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

  var TZS=["Local","UTC","Europe/Amsterdam","Europe/London","America/New_York","America/Los_Angeles","Asia/Tokyo","Australia/Sydney"];
  function openTodoEditor(existing,prefillTime){
    addMode="todo"; var box=el("div","inline-form");
    var text=field("What needs doing?",existing?existing.text:""); box.appendChild(text);
    var dRow=el("div","inline-form-row"); dRow.appendChild(el("span","inline-form-label","Day"));
    var date=document.createElement("input"); date.type="date"; date.className="field-input"; date.value=existing&&existing.dueDate?existing.dueDate:selectedDate; dRow.appendChild(date); box.appendChild(dRow);
    // Less-used fields live behind "More options" — the everyday flow is just
    // text + day + reminder. (An existing item with any of these set opens
    // with the section expanded so nothing looks lost.)
    var moreBox=el("div","inline-form-more hidden");
    var hasMore=!!(existing&&(existing.startTime||existing.endTime||existing.tz||existing.category||existing.url||existing.note));
    // time (optional -> timed event)
    var tRow=el("div","inline-form-row"); tRow.appendChild(el("span","inline-form-label","Time"));
    var st=document.createElement("input"); st.type="time"; st.className="field-input"; if(existing&&existing.startTime)st.value=existing.startTime; else if(prefillTime)st.value=prefillTime; tRow.appendChild(st);
    tRow.appendChild(el("span","inline-form-hint","to")); var et=document.createElement("input"); et.type="time"; et.className="field-input"; if(existing&&existing.endTime)et.value=existing.endTime; tRow.appendChild(et); moreBox.appendChild(tRow);
    // timezone
    var zRow=el("div","inline-form-row"); zRow.appendChild(el("span","inline-form-label","Zone")); var tz=document.createElement("select"); tz.className="field-select field-select-wide"; TZS.forEach(function(z){ var o=document.createElement("option"); o.value=z==="Local"?"":z; o.textContent=z; tz.appendChild(o); }); if(existing&&existing.tz)tz.value=existing.tz; zRow.appendChild(tz); moreBox.appendChild(zRow);
    // category
    var cRow=el("div","inline-form-row"); cRow.appendChild(el("span","inline-form-label","Category")); var cat=catSelect(existing?existing.category:""); cRow.appendChild(cat); moreBox.appendChild(cRow);
    // reminders (multiple)
    var remWrap=el("div","inline-form-col"); remWrap.appendChild(el("span","inline-form-label","Reminders"));
    var rems=(existing&&Array.isArray(existing.reminders))?existing.reminders.slice():[];
    var chips=el("div","rem-chips");
    function leadLabel(m){ var f=(window.Reminders&&window.Reminders.LEADS)||[]; for(var i=0;i<f.length;i++)if(f[i][0]===m)return f[i][1]; return m+" min"; }
    function drawChips(){ chips.innerHTML=""; rems.forEach(function(m,idx){ var chip=el("span","rem-chip",leadLabel(m)); var x=el("button","rem-chip-x","×"); x.type="button"; x.addEventListener("click",function(){ rems.splice(idx,1); drawChips(); }); chip.appendChild(x); chips.appendChild(chip); }); }
    drawChips(); remWrap.appendChild(chips);
    var addRem=document.createElement("select"); addRem.className="field-select";
    var ph=document.createElement("option"); ph.value=""; ph.textContent="+ Add reminder"; addRem.appendChild(ph);
    ((window.Reminders&&window.Reminders.LEADS)||[]).forEach(function(p){ var o=document.createElement("option"); o.value=String(p[0]); o.textContent=p[1]; addRem.appendChild(o); });
    addRem.addEventListener("change",function(){ if(addRem.value!==""){ var m=parseInt(addRem.value,10); if(rems.indexOf(m)===-1)rems.push(m); rems.sort(function(a,b){return a-b;}); drawChips(); addRem.value=""; } });
    remWrap.appendChild(addRem); box.appendChild(remWrap);
    // link + note
    var lRow=el("div","inline-form-row"); lRow.appendChild(el("span","inline-form-label","Link")); var url=field("https://…",existing?existing.url:""); lRow.appendChild(url); moreBox.appendChild(lRow);
    var note=document.createElement("textarea"); note.className="field-input"; note.rows=2; note.placeholder="Note (optional)"; if(existing&&existing.note)note.value=existing.note; moreBox.appendChild(note);

    var moreToggle=el("button","inline-form-moretoggle","More options ▾"); moreToggle.type="button";
    moreToggle.addEventListener("click",function(){ var open=moreBox.classList.toggle("hidden"); moreToggle.textContent=open?"More options ▾":"Fewer options ▴"; });
    box.appendChild(moreToggle); box.appendChild(moreBox);
    if(hasMore){ moreBox.classList.remove("hidden"); moreToggle.textContent="Fewer options ▴"; }

    var actions=el("div","inline-form-row");
    var save=el("button","btn btn-primary",existing?"Save":"+ Add to-do"); save.type="button";
    save.addEventListener("click",function(){ var txt=text.value.trim(); if(!txt){ M.toast("Type something first"); return; }
      var fields={ text:txt, dueDate:date.value||null, startTime:st.value||null, endTime:et.value||null, tz:tz.value||null, category:cat.value||null, reminders:rems.slice(), url:url.value.trim()||null, note:note.value.trim()||null };
      var list=M.loadTodos();
      if(existing){ list.forEach(function(x){ if(x.id===existing.id){ for(var k in fields)x[k]=fields[k]; } }); }
      else { fields.id="todo-"+Date.now()+"-"+Math.random().toString(36).slice(2,7); fields.done=false; fields.snoozes=0; list.push(fields); }
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

  // ---- duplicate ----
  function duplicateTodo(t){
    var list=M.loadTodos();
    var copy={}; for(var k in t)copy[k]=t[k];
    copy.id="todo-"+Date.now()+"-"+Math.random().toString(36).slice(2,7);
    copy.text=(t.text||"")+" (copy)"; copy.done=false; copy.snoozes=0;
    list.push(copy); M.saveTodos(list); M.toast("Duplicated"); render();
  }
  function duplicateChore(chore){
    var list=M.loadChores();
    var copy={}; for(var k in chore)copy[k]=chore[k];
    copy.id="chore-"+Date.now()+"-"+Math.random().toString(36).slice(2,7);
    copy.name=(chore.name||"")+" (copy)"; copy.lastDone=null; copy.log=[]; copy.exceptions={};
    list.push(copy); M.saveChores(list); M.toast("Duplicated"); render();
  }
  function postponeChoreOccurrence(chore,occDate,days){
    var newDs=ymd(addDays(parseYmd(occDate),days));
    var list=M.loadChores();
    list.forEach(function(c){ if(c.id===chore.id){ c.exceptions=c.exceptions||{}; c.exceptions[occDate]=newDs; } });
    M.saveChores(list); selectedDate=newDs; M.toast("This occurrence moved to "+niceDay(newDs)); render();
  }

  // ---- day view (hourly timeline) ----
  function toMin(hhmm){ var p=(hhmm||"0:0").split(":"); return (+p[0])*60+(+p[1]); }
  function buildDayHeader(){
    var box=el("div","cal-headbox"); var head=el("div","cal-head");
    var prev=el("button","cal-nav","‹"); prev.type="button"; prev.addEventListener("click",function(){ shift(-1); });
    var title=el("div","cal-title", selectedDate===todayStr()?"Today · "+niceDay(selectedDate):niceDay(selectedDate));
    var next=el("button","cal-nav","›"); next.type="button"; next.addEventListener("click",function(){ shift(1); });
    head.appendChild(prev); head.appendChild(title); head.appendChild(next); box.appendChild(head); return box;
  }
  function buildDayTimeline(){
    var wrap=el("div","cal-dayview");
    var chores=choresOn(selectedDate), todos=todosOn(selectedDate), events=icsOn(selectedDate);
    var allTodos=todos.filter(function(t){ return !t.startTime; });
    var timed=todos.filter(function(t){ return t.startTime; }).sort(function(a,b){ return a.startTime<b.startTime?-1:1; });
    var allEv=events.filter(function(e){ return e.allDay; }), timedEv=events.filter(function(e){ return !e.allDay&&e.startTime; });
    if(chores.length||allTodos.length||allEv.length){
      var strip=el("div","cal-allday"); strip.appendChild(el("div","cal-allday-label","All day"));
      var l=el("div","cal-item-list");
      chores.forEach(function(r){ l.appendChild(choreItem(r.chore,r.state,selectedDate)); });
      allTodos.forEach(function(t){ l.appendChild(todoItem(t,false)); });
      allEv.forEach(function(e){ l.appendChild(icsItem(e)); });
      strip.appendChild(l); wrap.appendChild(strip);
    }
    var HH=loadHH(); var grid=el("div","cal-hours"); grid.style.height=(24*HH)+"px";
    for(var h=0;h<24;h++){ var hr=el("div","cal-hour"); hr.style.top=(h*HH)+"px"; hr.appendChild(el("span","cal-hour-label",(h<10?"0":"")+h+":00"));
      (function(hour){ hr.addEventListener("click",function(e){ if(e.target.closest(".cal-ev"))return; openTodoEditor(null,(hour<10?"0":"")+hour+":00"); }); })(h);
      grid.appendChild(hr);
    }
    timed.forEach(function(t){ var m=toMin(t.startTime); var dur=t.endTime?Math.max(15,toMin(t.endTime)-m):60;
      var b=el("div","cal-ev"); b.style.top=(m/60*HH)+"px"; b.style.height=Math.max(24,dur/60*HH)+"px"; if(t.category)b.style.borderLeftColor=window.Cats.color(t.category);
      b.appendChild(el("div","cal-ev-time",t.startTime+(t.endTime?"–"+t.endTime:""))); b.appendChild(el("div","cal-ev-title",t.text));
      b.addEventListener("click",function(e){ e.stopPropagation(); openItemMenu(t); }); grid.appendChild(b);
    });
    timedEv.forEach(function(e){ var m=toMin(e.startTime); var b=el("div","cal-ev cal-ev-ics"); b.style.top=(m/60*HH)+"px"; b.style.height="30px"; b.appendChild(el("div","cal-ev-time",e.startTime)); b.appendChild(el("div","cal-ev-title",e.title)); grid.appendChild(b); });
    wrap.appendChild(grid);
    wrap.appendChild(buildAddArea());
    return wrap;
  }

  // ============================================================
  // Outlook-style week time-grid: 7 (or 5 / 3) day columns over a
  // full 24h timeline. Vertical zoom, drag a block day↔day + up/down
  // to reschedule, and drag its top/bottom edge to resize (15-min snap).
  // ============================================================
  var HH_KEY="sbx.cal.hh";
  function loadHH(){ try{ var v=parseInt(localStorage.getItem(HH_KEY),10); return (v>=24&&v<=140)?v:46; }catch(e){ return 46; } }
  function saveHH(v){ try{ localStorage.setItem(HH_KEY, String(Math.max(24,Math.min(140,v)))); }catch(e){} }
  function minHH(m){ m=Math.max(0,Math.min(1440,Math.round(m))); var h=Math.floor(m/60), mm=m%60; return (h<10?"0":"")+h+":"+(mm<10?"0":"")+mm; }
  function snap15(m){ return Math.round(m/15)*15; }

  function zoomControls(){
    var z=el("div","cal-zoom");
    var out=el("button","cal-zoom-btn","−"); out.type="button"; out.setAttribute("aria-label","Shorter rows"); out.addEventListener("click",function(){ saveHH(loadHH()-12); render(); });
    var inn=el("button","cal-zoom-btn","+"); inn.type="button"; inn.setAttribute("aria-label","Taller rows"); inn.addEventListener("click",function(){ saveHH(loadHH()+12); render(); });
    z.appendChild(out); z.appendChild(inn); return z;
  }

  function daysForView(){
    var sel=parseYmd(selectedDate);
    if(viewMode==="3day"){ return [sel,addDays(sel,1),addDays(sel,2)]; }
    var off=(sel.getDay()+6)%7; var mon=addDays(sel,-off);
    var n=(viewMode==="workweek")?5:7; var arr=[]; for(var i=0;i<n;i++)arr.push(addDays(mon,i)); return arr;
  }

  function buildTimelineHeader(days){
    var box=el("div","cal-headbox"); var head=el("div","cal-head");
    var prev=el("button","cal-nav","‹"); prev.type="button"; prev.addEventListener("click",function(){ shift(-1); });
    var title=el("div","cal-title", niceDay(ymd(days[0]))+" – "+niceDay(ymd(days[days.length-1])));
    var next=el("button","cal-nav","›"); next.type="button"; next.addEventListener("click",function(){ shift(1); });
    head.appendChild(prev); head.appendChild(title); head.appendChild(next);
    box.appendChild(head); box.appendChild(zoomControls());
    return box;
  }

  function buildWeekTimeline(days){
    var HH=loadHH();
    var cols="48px repeat("+days.length+",minmax(0,1fr))";
    var wrap=el("div","cal-week");
    var scroll=el("div","cal-week-scroll");

    // sticky day-header row
    var headRow=el("div","cal-week-head"); headRow.style.gridTemplateColumns=cols;
    headRow.appendChild(el("div","cal-week-corner",""));
    days.forEach(function(dt){ var ds=ymd(dt);
      var h=el("div","cal-week-dhead"+(ds===todayStr()?" cal-week-today":""));
      h.appendChild(el("div","cal-week-dow",["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][(dt.getDay()+6)%7]));
      h.appendChild(el("div","cal-week-dnum",String(dt.getDate())));
      h.addEventListener("click",function(){ selectedDate=ds; viewMode="day"; saveViewMode("day"); render(); });
      headRow.appendChild(h);
    });
    scroll.appendChild(headRow);

    // all-day strip (chores + untimed todos)
    var allRow=el("div","cal-week-allday"); allRow.style.gridTemplateColumns=cols;
    allRow.appendChild(el("div","cal-week-allday-label","all-day"));
    days.forEach(function(dt){ var ds=ymd(dt);
      var cell=el("div","cal-week-allday-cell");
      choresOn(ds).forEach(function(r){ var c=el("div","cal-allday-chip cal-allday-chore",r.chore.name); c.addEventListener("click",function(e){ e.stopPropagation(); selectedDate=ds; viewMode="day"; saveViewMode("day"); render(); }); cell.appendChild(c); });
      todosOn(ds).filter(function(t){ return !t.startTime; }).forEach(function(t){ var c=el("div","cal-allday-chip"+(t.done?" done":""),t.text); c.addEventListener("click",function(e){ e.stopPropagation(); openItemMenu(t); }); cell.appendChild(c); });
      cell.addEventListener("click",function(){ selectedDate=ds; openTodoEditor(null); });
      allRow.appendChild(cell);
    });
    scroll.appendChild(allRow);

    // time grid body
    var body=el("div","cal-week-body"); body.style.gridTemplateColumns=cols;
    var gutter=el("div","cal-week-gutter"); gutter.style.height=(24*HH)+"px";
    for(var g=0;g<24;g++){ var lab=el("div","cal-week-hourlabel",(g<10?"0":"")+g+":00"); lab.style.top=(g*HH)+"px"; gutter.appendChild(lab); }
    body.appendChild(gutter);

    var colEls=[];
    days.forEach(function(dt,idx){ var ds=ymd(dt);
      var col=el("div","cal-week-col"+(ds===todayStr()?" cal-week-coltoday":"")); col.style.height=(24*HH)+"px";
      for(var hh=0;hh<24;hh++){ var line=el("div","cal-week-hline"); line.style.top=(hh*HH)+"px"; col.appendChild(line); }
      (function(day){ col.addEventListener("click",function(e){ if(e.target!==col)return; var top=e.clientY-col.getBoundingClientRect().top; selectedDate=ymd(day); openTodoEditor(null, minHH(snap15(top/HH*60))); }); })(dt);
      colEls.push(col); body.appendChild(col);
    });

    // place timed to-dos as draggable/resizable blocks
    days.forEach(function(dt,idx){ var ds=ymd(dt);
      todosOn(ds).filter(function(t){ return t.startTime; }).forEach(function(t){
        var b=makeWeekBlock(t, HH); colEls[idx].appendChild(b);
        wireBlock(b, t, HH, days, colEls);
      });
      icsOn(ds).filter(function(e){ return !e.allDay&&e.startTime; }).forEach(function(ev){
        var m=toMin(ev.startTime); var b=el("div","cal-ev cal-ev-ics cal-week-ev"); b.style.top=(m/60*HH)+"px"; b.style.height="26px";
        b.appendChild(el("div","cal-ev-time",ev.startTime)); b.appendChild(el("div","cal-ev-title",ev.title)); colEls[idx].appendChild(b);
      });
    });

    scroll.appendChild(body); wrap.appendChild(scroll);
    // scroll to ~7am on open
    setTimeout(function(){ scroll.scrollTop=Math.max(0,7*HH-20); },0);
    return wrap;
  }

  function makeWeekBlock(t, HH){
    var m=toMin(t.startTime); var dur=t.endTime?Math.max(15,toMin(t.endTime)-m):60;
    var b=el("div","cal-ev cal-week-ev"+(t.done?" done":"")); b.style.top=(m/60*HH)+"px"; b.style.height=Math.max(18,dur/60*HH)+"px";
    if(t.category)b.style.borderLeftColor=window.Cats.color(t.category);
    b.appendChild(el("div","cal-ev-time",t.startTime+(t.endTime?"–"+t.endTime:"")));
    b.appendChild(el("div","cal-ev-title",t.text));
    b.appendChild(el("div","cal-ev-resize cal-ev-resize-top"));
    b.appendChild(el("div","cal-ev-resize cal-ev-resize-bot"));
    return b;
  }

  function wireBlock(b, t, HH, days, colEls){
    var mode=null, gridTop=0, startMin=0, endMin=0, dur=0, moved=false, pid=null, targetIdx=0;
    function colUnder(x){ for(var i=0;i<colEls.length;i++){ var r=colEls[i].getBoundingClientRect(); if(x>=r.left&&x<=r.right)return i; } return targetIdx; }
    function begin(e, which){
      mode=which; pid=e.pointerId; moved=false;
      startMin=toMin(t.startTime); endMin=t.endTime?toMin(t.endTime):startMin+60; dur=endMin-startMin;
      gridTop=colEls[0].getBoundingClientRect().top;
      targetIdx=colEls.indexOf(b.parentNode);
      try{ b.setPointerCapture(pid); }catch(_){ }
      b.classList.add("dragging"); e.preventDefault(); e.stopPropagation();
    }
    function move(e){
      if(!mode)return; if(Math.abs(e.movementX)+Math.abs(e.movementY)>0) moved=true;
      var yMin=(e.clientY-gridTop)/HH*60;
      if(mode==="move"){
        var newStart=snap15(yMin - (dur/2)); // grab near center feels natural
        newStart=Math.max(0,Math.min(1440-dur,newStart));
        var ci=colUnder(e.clientX);
        if(ci!==targetIdx){ targetIdx=ci; colEls[ci].appendChild(b); }
        b.style.top=(newStart/60*HH)+"px";
        b._ns=newStart;
      } else if(mode==="top"){
        var ns=Math.max(0,Math.min(endMin-15,snap15(yMin)));
        b.style.top=(ns/60*HH)+"px"; b.style.height=((endMin-ns)/60*HH)+"px"; b._ns=ns; b._ne=endMin;
      } else if(mode==="bot"){
        var ne=Math.min(1440,Math.max(startMin+15,snap15(yMin)));
        b.style.height=((ne-startMin)/60*HH)+"px"; b._ne=ne; b._ns=startMin;
      }
    }
    function up(){
      if(!mode)return; var m=mode; mode=null; b.classList.remove("dragging");
      if(m==="move" && !moved){ openItemMenu(t); return; }
      var list=M.loadTodos();
      list.forEach(function(x){ if(x.id!==t.id)return;
        if(m==="move"){ x.dueDate=ymd(days[targetIdx]); x.startTime=minHH(b._ns); x.endTime=minHH(b._ns+dur); }
        else if(m==="top"){ x.startTime=minHH(b._ns); x.endTime=minHH(b._ne); }
        else if(m==="bot"){ x.startTime=minHH(b._ns); x.endTime=minHH(b._ne); }
      });
      M.saveTodos(list); render();
    }
    b.addEventListener("pointerdown",function(e){ if(e.target.classList.contains("cal-ev-resize"))return; begin(e,"move"); });
    b.querySelector(".cal-ev-resize-top").addEventListener("pointerdown",function(e){ begin(e,"top"); });
    b.querySelector(".cal-ev-resize-bot").addEventListener("pointerdown",function(e){ begin(e,"bot"); });
    b.addEventListener("pointermove",move);
    b.addEventListener("pointerup",up);
    b.addEventListener("pointercancel",function(){ mode=null; b.classList.remove("dragging"); });
  }

  window.CalEditors = {
    editTodo: function(t){ if(t&&t.dueDate){ var d=parseYmd(t.dueDate); viewYear=d.getFullYear(); viewMonth=d.getMonth(); selectedDate=t.dueDate; } openTodoEditor(t); },
    editChore: function(c){ openChoreEditor(c); }
  };
  if(window.App && window.App.onShow) window.App.onShow("calendar",function(){ addMode=null; searchOpen=false; render(); });
})();
