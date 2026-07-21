(function (global) {
  "use strict";
  // Best-effort reminders (fires while the app is open — no push server).
  // A to-do can have several reminders, each a lead time before it's due.
  // Legacy single `reminderTime` (absolute HH:MM) is still honored.
  var FIRED_KEY = "sbx.reminded";
  function loadFired(){ try{ return JSON.parse(localStorage.getItem(FIRED_KEY))||{}; }catch(e){ return {}; } }
  function saveFired(o){ try{ localStorage.setItem(FIRED_KEY, JSON.stringify(o)); }catch(e){} }
  function pad(n){ return n<10?"0"+n:""+n; }

  function baseDateTime(t){
    if(!t.dueDate) return null;
    var time = t.startTime || t.reminderTime || "09:00";
    return new Date(t.dueDate + "T" + time + ":00");
  }
  function leadsFor(t){
    if(Array.isArray(t.reminders) && t.reminders.length) return t.reminders.slice();
    if(t.reminderTime) return [0]; // legacy: at the reminder time
    return [];
  }

  function check(){
    if(!("Notification" in global) || Notification.permission!=="granted") return;
    var todos; try{ todos=JSON.parse(localStorage.getItem("sbx.todos"))||[]; }catch(e){ return; }
    var now=Date.now(); var fired=loadFired();
    todos.forEach(function(t){
      if(t.done) return;
      var base=baseDateTime(t); if(!base) return;
      leadsFor(t).forEach(function(lead){
        var fireAt=base.getTime()-lead*60000;
        if(now>=fireAt && now-fireAt<12*3600000){ // within 12h window so we don't spam old ones
          var key=t.id+"@"+t.dueDate+"@"+lead;
          if(fired[key]) return;
          var when = lead===0 ? "now" : (lead>=1440 ? (lead/1440)+" day(s) ahead" : (lead>=60 ? (lead/60)+"h ahead" : lead+" min ahead"));
          try{ new Notification("Reminder: "+t.text, { body: (t.startTime?("At "+t.startTime):"Due "+t.dueDate)+" · "+when }); }catch(e){}
          fired[key]=now;
        }
      });
    });
    // prune keys older than 2 days
    Object.keys(fired).forEach(function(k){ if(now-fired[k]>2*864e5) delete fired[k]; });
    saveFired(fired);
  }

  global.Reminders = {
    check: check,
    requestPermission: function(cb){ if(!("Notification" in global)){ cb&&cb("unsupported"); return; } Notification.requestPermission().then(function(p){ cb&&cb(p); }); },
    // preset lead options for the UI
    LEADS: [[0,"At the time"],[10,"10 min before"],[30,"30 min before"],[60,"1 hour before"],[1440,"1 day before"],[2880,"2 days before"]]
  };
  setInterval(check, 30000);
  setTimeout(check, 3000);
})(window);
