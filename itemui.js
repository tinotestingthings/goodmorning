(function (global) {
  "use strict";
  // Interactive to-do / chore row + bottom-sheet menu, callback-driven so any
  // screen (calendar day panel, home "Today") can render items with the same
  // behaviour: tap the box to complete, swipe (right = complete, left =
  // postpone 1 day), or hold / tap ⋯ for the full menu. opts:
  //   { refresh(), editTodo(t), editChore(c) }
  function M(){ return global.DayModel; }
  function el(t,cls,txt){ var n=document.createElement(t); if(cls)n.className=cls; if(txt!=null)n.textContent=txt; return n; }
  function pad(n){ return n<10?"0"+n:""+n; }
  function ymd(d){ return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate()); }
  function parseYmd(s){ return new Date(s+"T00:00:00"); }
  function todayStr(){ return ymd(new Date()); }
  function addDays(d,n){ var x=new Date(d.getTime()); x.setDate(x.getDate()+n); return x; }
  function niceDay(ds){ var d=parseYmd(ds); var DOW=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]; var MO=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]; return DOW[(d.getDay()+6)%7]+" "+d.getDate()+" "+MO[d.getMonth()]; }
  function party(a){ if(global.FX){ global.FX.celebrate(a); global.FX.ding(); } }
  function catBar(id){ if(!id||!global.Cats)return null; var b=el("span","cal-cat-bar"); b.style.background=global.Cats.color(id); return b; }
  function check(done,onToggle){ var b=el("button","cal-check"+(done?" cal-check-done":"")); b.type="button"; b.innerHTML=done?"&#10003;":""; b.addEventListener("click",onToggle); return b; }
  function bigEditBtn(fn){ var b=el("button","cal-edit cal-edit-big","⋯"); b.type="button"; b.setAttribute("aria-label","Item menu"); b.addEventListener("click",fn); return b; }
  function linkChip(url){ var a=document.createElement("a"); a.className="cal-link-chip"; a.href=url; a.target="_blank"; a.rel="noopener noreferrer"; a.textContent="🔗"; a.addEventListener("click",function(e){ e.stopPropagation(); }); return a; }

  function completeTodo(t,anchor,opts){
    var list=M().loadTodos(); var nowDone=false;
    list.forEach(function(x){ if(x.id===t.id){ x.done=!x.done; nowDone=x.done; if(x.done)M().logTodoHistory(x.text); } });
    M().saveTodos(list); if(nowDone)party(anchor); opts.refresh();
  }
  function setTodoDone(t,done,opts){ var list=M().loadTodos(); list.forEach(function(x){ if(x.id===t.id){ x.done=done; if(done)M().logTodoHistory(x.text); } }); M().saveTodos(list); if(done)party(document.body); opts.refresh(); }
  function snoozeTodo(id,days,opts){ var list=M().loadTodos(); list.forEach(function(t){ if(t.id===id){ var base=t.dueDate?parseYmd(t.dueDate):new Date(); t.dueDate=ymd(addDays(base,days)); t.snoozes=(t.snoozes||0)+1; } }); M().saveTodos(list); M().toast(days===7?"Pushed to next week":"Pushed to tomorrow"); opts.refresh(); }
  function duplicateTodo(t,opts){ var list=M().loadTodos(); var copy={}; for(var k in t)copy[k]=t[k]; copy.id="todo-"+Date.now()+"-"+Math.random().toString(36).slice(2,7); copy.text=(t.text||"")+" (copy)"; copy.done=false; copy.snoozes=0; list.push(copy); M().saveTodos(list); M().toast("Duplicated"); opts.refresh(); }
  function duplicateChore(chore,opts){ var list=M().loadChores(); var copy={}; for(var k in chore)copy[k]=chore[k]; copy.id="chore-"+Date.now()+"-"+Math.random().toString(36).slice(2,7); copy.name=(chore.name||"")+" (copy)"; copy.lastDone=null; copy.log=[]; copy.exceptions={}; list.push(copy); M().saveChores(list); M().toast("Duplicated"); opts.refresh(); }
  function postponeChoreOccurrence(chore,occDate,days,opts){ var newDs=ymd(addDays(parseYmd(occDate),days)); var list=M().loadChores(); list.forEach(function(c){ if(c.id===chore.id){ c.exceptions=c.exceptions||{}; c.exceptions[occDate]=newDs; } }); M().saveChores(list); M().toast("This occurrence moved to "+niceDay(newDs)); opts.refresh(); }

  function attachHold(row,onHold){
    var timer=null,sx=0,sy=0;
    function clr(){ if(timer){ clearTimeout(timer); timer=null; } }
    row.addEventListener("pointerdown",function(e){ if(e.target.closest("button, a, .cal-drag-handle"))return; sx=e.clientX; sy=e.clientY; timer=setTimeout(function(){ timer=null; onHold(); },450); });
    row.addEventListener("pointermove",function(e){ if(timer && (Math.abs(e.clientX-sx)+Math.abs(e.clientY-sy)>10)) clr(); });
    row.addEventListener("pointerup",clr); row.addEventListener("pointercancel",clr);
  }
  function attachSwipe(row,t,opts){
    var x0=0,y0=0,drag=false,axis=null;
    row.style.touchAction="pan-y";
    row.addEventListener("pointerdown",function(e){ if(e.target.closest("button,a,.cal-drag-handle"))return; x0=e.clientX;y0=e.clientY;drag=true;axis=null; row.style.transition=""; });
    row.addEventListener("pointermove",function(e){ if(!drag)return; var dx=e.clientX-x0,dy=e.clientY-y0;
      if(!axis){ if(Math.abs(dx)<8&&Math.abs(dy)<8)return; axis=Math.abs(dx)>Math.abs(dy)?"x":"y"; if(axis==="x"){ try{row.setPointerCapture(e.pointerId);}catch(_){} } else { drag=false; return; } }
      if(axis==="x"){ if(e.cancelable)e.preventDefault(); row.style.transform="translateX("+dx+"px)"; row.style.background=dx>0?"rgba(47,174,102,0.14)":"rgba(217,164,65,0.14)"; }
    });
    function end(e){ if(!drag)return; drag=false; row.style.transition="transform .2s ease"; row.style.transform=""; row.style.background=""; if(axis!=="x")return; var dx=e.clientX-x0; if(Math.abs(dx)>90){ if(dx>0) completeTodo(t,row,opts); else snoozeTodo(t.id,1,opts); } }
    row.addEventListener("pointerup",end);
    row.addEventListener("pointercancel",function(){ drag=false; row.style.transform=""; row.style.background=""; });
  }

  function todoRow(t,opts){
    opts=opts||{}; opts.refresh=opts.refresh||function(){};
    var row=el("div","cal-item"); row.setAttribute("data-todo",t.id);
    var cb=catBar(t.category); if(cb)row.appendChild(cb);
    var chk=check(t.done,function(){ completeTodo(t,chk,opts); });
    row.appendChild(chk);
    var body=el("div","cal-item-body");
    var tw=el("div","cal-item-titlewrap");
    tw.appendChild(el("span","cal-item-title"+(t.done?" cal-item-done":""),t.text));
    if(t.snoozes>0)tw.appendChild(el("span","cal-badge-snooze","⏰ postponed "+t.snoozes+"×"));
    if((t.reminders&&t.reminders.length)||t.reminderTime)tw.appendChild(el("span","cal-badge-remind","🔔"));
    if(t.url)tw.appendChild(linkChip(t.url));
    body.appendChild(tw);
    var sub=[]; if(t.startTime)sub.push(t.startTime+(t.endTime?"–"+t.endTime:"")); sub.push("To-do"); var cat=global.Cats&&global.Cats.byId(t.category); if(cat)sub.push(cat.name);
    body.appendChild(el("div","cal-item-sub",sub.join(" · ")));
    if(t.note)body.appendChild(el("div","cal-item-note",t.note));
    row.appendChild(body);
    if(opts.handle)row.appendChild(opts.handle);
    row.appendChild(bigEditBtn(function(){ openTodoMenu(t,opts); }));
    attachHold(row,function(){ openTodoMenu(t,opts); });
    if(opts.swipe && !t.done) attachSwipe(row,t,opts);
    return row;
  }

  function choreRow(chore,state,occDate,opts){
    opts=opts||{}; opts.refresh=opts.refresh||function(){}; occDate=occDate||todayStr();
    var row=el("div","cal-item");
    var cb=catBar(chore.category); if(cb)row.appendChild(cb);
    var doneToday=state==="done";
    var chk=check(doneToday,function(){ if(occDate!==todayStr()){ M().toast("Tick chores off on the day you do them (today)."); return; } var list=M().loadChores(); list.forEach(function(c){ if(c.id===chore.id)M().setChoreDoneToday(c,!doneToday); }); M().saveChores(list); if(!doneToday)party(chk); opts.refresh(); });
    row.appendChild(chk);
    var body=el("div","cal-item-body");
    var tw=el("div","cal-item-titlewrap"); tw.appendChild(el("span","cal-item-title"+(doneToday?" cal-item-done":""),chore.name)); if(chore.url)tw.appendChild(linkChip(chore.url)); body.appendChild(tw);
    var sub="Chore · "+M().freqLabel(chore); var cat=global.Cats&&global.Cats.byId(chore.category); if(cat)sub+=" · "+cat.name;
    body.appendChild(el("div","cal-item-sub",sub));
    if(chore.note)body.appendChild(el("div","cal-item-note",chore.note));
    row.appendChild(body);
    row.appendChild(bigEditBtn(function(){ openChoreMenu(chore,occDate,opts); }));
    attachHold(row,function(){ openChoreMenu(chore,occDate,opts); });
    return row;
  }

  function closeMenu(){ var o=document.querySelector(".item-menu-overlay"); if(o)o.remove(); }
  function menuBtn(label,cls,fn){ var b=el("button","item-menu-btn"+(cls?" "+cls:""),label); b.type="button"; b.addEventListener("click",fn); return b; }
  function overlay(){ var ov=el("div","item-menu-overlay"); ov.addEventListener("click",function(e){ if(e.target===ov)closeMenu(); }); return ov; }

  function openTodoMenu(t,opts){
    closeMenu(); var ov=overlay(); var sheet=el("div","item-menu");
    sheet.appendChild(el("div","item-menu-title",t.text));
    if(!t.done) sheet.appendChild(menuBtn("✓  Complete","im-done",function(){ closeMenu(); setTodoDone(t,true,opts); }));
    else sheet.appendChild(menuBtn("↺  Reopen",null,function(){ closeMenu(); setTodoDone(t,false,opts); }));
    sheet.appendChild(postponeBtn(t,1,"Postpone 1 day",opts));
    sheet.appendChild(postponeBtn(t,7,"Postpone 1 week",opts));
    if(opts.editTodo) sheet.appendChild(menuBtn("✎  Edit details",null,function(){ closeMenu(); opts.editTodo(t); }));
    sheet.appendChild(menuBtn("⧉  Duplicate",null,function(){ closeMenu(); duplicateTodo(t,opts); }));
    sheet.appendChild(menuBtn("🗑  Delete","im-danger",function(){ closeMenu(); if(window.confirm("Delete this to-do?")){ M().saveTodos(M().loadTodos().filter(function(x){return x.id!==t.id;})); opts.refresh(); } }));
    sheet.appendChild(menuBtn("Cancel","im-cancel",function(){ closeMenu(); }));
    ov.appendChild(sheet); document.body.appendChild(ov);
  }
  function postponeBtn(t,days,label,opts){
    var wrap=el("div","im-postpone-wrap"); var b=el("button","item-menu-btn im-postpone","⏰  "+label); b.type="button";
    b.addEventListener("click",function(){ wrap.innerHTML=""; var q=el("div","im-confirm"); q.appendChild(el("div","im-confirm-label","Sure?"));
      q.appendChild(menuBtn("Yes — "+label.toLowerCase(),"im-yes",function(){ closeMenu(); snoozeTodo(t.id,days,opts); }));
      q.appendChild(menuBtn("No","im-no",function(){ closeMenu(); openTodoMenu(t,opts); })); wrap.appendChild(q);
    }); wrap.appendChild(b); return wrap;
  }
  function openChoreMenu(chore,occDate,opts){
    closeMenu(); var ov=overlay(); var sheet=el("div","item-menu");
    sheet.appendChild(el("div","item-menu-title",chore.name));
    sheet.appendChild(el("div","item-menu-sub",niceDay(occDate)+" · "+M().freqLabel(chore)));
    sheet.appendChild(chorePostponeBtn(chore,occDate,1,"Postpone this day 1 day",opts));
    sheet.appendChild(chorePostponeBtn(chore,occDate,7,"Postpone this day 1 week",opts));
    if(opts.editChore) sheet.appendChild(menuBtn("✎  Edit whole chore",null,function(){ closeMenu(); opts.editChore(chore); }));
    sheet.appendChild(menuBtn("⧉  Duplicate",null,function(){ closeMenu(); duplicateChore(chore,opts); }));
    sheet.appendChild(menuBtn("🗑  Delete series","im-danger",function(){ closeMenu(); if(window.confirm("Delete \""+chore.name+"\" and stop it recurring?")){ M().saveChores(M().loadChores().filter(function(c){return c.id!==chore.id;})); opts.refresh(); } }));
    sheet.appendChild(menuBtn("Cancel","im-cancel",function(){ closeMenu(); }));
    ov.appendChild(sheet); document.body.appendChild(ov);
  }
  function chorePostponeBtn(chore,occDate,days,label,opts){
    var wrap=el("div","im-postpone-wrap"); var b=el("button","item-menu-btn im-postpone","⏰  "+label); b.type="button";
    b.addEventListener("click",function(){ wrap.innerHTML=""; var q=el("div","im-confirm"); q.appendChild(el("div","im-confirm-label","Move just this one occurrence?"));
      q.appendChild(menuBtn("Yes — "+label.toLowerCase(),"im-yes",function(){ closeMenu(); postponeChoreOccurrence(chore,occDate,days,opts); }));
      q.appendChild(menuBtn("No","im-no",function(){ closeMenu(); openChoreMenu(chore,occDate,opts); })); wrap.appendChild(q);
    }); wrap.appendChild(b); return wrap;
  }

  global.ItemUI = { todoRow: todoRow, choreRow: choreRow, openTodoMenu: openTodoMenu, openChoreMenu: openChoreMenu };
})(window);
