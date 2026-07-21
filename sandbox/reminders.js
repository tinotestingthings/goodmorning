(function (global) {
  "use strict";
  // Best-effort reminders for timed to-dos. Browsers can't fire true background
  // notifications without a push server, so this fires while the app is open (or
  // the installed PWA is running). Checks every 30s; a reminder fires once per
  // day per to-do (tracked in sbx.reminded).
  var FIRED_KEY = "sbx.reminded";
  function loadFired(){ try{ return JSON.parse(localStorage.getItem(FIRED_KEY))||{}; }catch(e){ return {}; } }
  function saveFired(o){ try{ localStorage.setItem(FIRED_KEY, JSON.stringify(o)); }catch(e){} }
  function pad(n){ return n<10?"0"+n:""+n; }
  function todayStr(){ var d=new Date(); return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate()); }

  function check(){
    if(!("Notification" in global) || Notification.permission!=="granted") return;
    var todos; try{ todos=JSON.parse(localStorage.getItem("sbx.todos"))||[]; }catch(e){ return; }
    var now=new Date(); var hhmm=pad(now.getHours())+":"+pad(now.getMinutes()); var today=todayStr();
    var fired=loadFired();
    todos.forEach(function(t){
      if(t.done||!t.reminderTime||!t.dueDate) return;
      if(t.dueDate>today) return;                 // not due yet
      if(t.reminderTime>hhmm && t.dueDate===today) return; // time not reached today
      var key=t.id+"@"+today;
      if(fired[key]) return;
      try{ new Notification("Reminder: "+t.text, { body: t.dueDate===today?"Due today":"Overdue since "+t.dueDate }); }catch(e){}
      fired[key]=1;
    });
    // prune old keys
    Object.keys(fired).forEach(function(k){ if(k.indexOf("@"+today)===-1) delete fired[k]; });
    saveFired(fired);
  }

  global.Reminders = { check: check, requestPermission: function(cb){
    if(!("Notification" in global)){ cb&&cb("unsupported"); return; }
    Notification.requestPermission().then(function(p){ cb&&cb(p); });
  }};
  setInterval(check, 30000);
  setTimeout(check, 3000);
})(window);
