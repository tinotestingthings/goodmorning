(function (global) {
  "use strict";
  // Read-only .ics subscriptions (holidays, another calendar). Fetches the URL
  // in the browser, parses VEVENTs (incl. simple RRULE), caches the expanded
  // occurrences. Cross-origin URLs need CORS enabled by the host, else the
  // fetch is blocked by the browser (reported to the user).
  var FEEDS_KEY = "dd.icsFeeds", CACHE_KEY = "dd.icsCache";

  function loadFeeds(){ try{ return JSON.parse(localStorage.getItem(FEEDS_KEY))||[]; }catch(e){ return []; } }
  function saveFeeds(f){ try{ localStorage.setItem(FEEDS_KEY, JSON.stringify(f)); }catch(e){} }
  function loadCache(){ try{ return JSON.parse(localStorage.getItem(CACHE_KEY))||{}; }catch(e){ return {}; } }
  function saveCache(c){ try{ localStorage.setItem(CACHE_KEY, JSON.stringify(c)); }catch(e){} }

  function pad(n){ return n<10?"0"+n:""+n; }
  function ymd(d){ return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate()); }

  function unfold(text){ return text.replace(/\r\n[ \t]/g,"").replace(/\n[ \t]/g,""); }
  function parseDate(val){
    // returns { date:'YYYY-MM-DD', time:'HH:MM'|null }
    var m=val.match(/(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2}))?/);
    if(!m) return null;
    return { date:m[1]+"-"+m[2]+"-"+m[3], time:m[4]?m[4]+":"+m[5]:null };
  }

  function parseICS(text){
    text=unfold(text);
    var lines=text.split(/\r\n|\n|\r/);
    var events=[], cur=null;
    lines.forEach(function(line){
      if(line==="BEGIN:VEVENT"){ cur={}; return; }
      if(line==="END:VEVENT"){ if(cur&&cur.start)events.push(cur); cur=null; return; }
      if(!cur) return;
      var idx=line.indexOf(":"); if(idx===-1) return;
      var key=line.slice(0,idx), val=line.slice(idx+1);
      var name=key.split(";")[0];
      if(name==="SUMMARY") cur.title=val;
      else if(name==="DTSTART"){ var p=parseDate(val); if(p){ cur.start=p.date; cur.startTime=p.time; cur.allDay=key.indexOf("VALUE=DATE")!==-1||!p.time; } }
      else if(name==="DTEND"){ var e=parseDate(val); if(e){ cur.end=e.date; cur.endTime=e.time; } }
      else if(name==="RRULE") cur.rrule=val;
      else if(name==="UID") cur.uid=val;
    });
    return events;
  }

  function parseRule(rrule){
    var o={}; (rrule||"").split(";").forEach(function(kv){ var p=kv.split("="); if(p[0])o[p[0]]=p[1]; });
    return o;
  }

  // expand one event into concrete date occurrences within [from,to]
  function expand(ev, from, to){
    var out=[];
    function push(dateStr){ out.push({ title:ev.title||"(untitled)", date:dateStr, allDay:ev.allDay!==false, startTime:ev.startTime||null, endTime:ev.endTime||null }); }
    if(!ev.rrule){ if(ev.start>=ymd(from)&&ev.start<=ymd(to)) push(ev.start); return out; }
    var r=parseRule(ev.rrule);
    var freq=r.FREQ, interval=parseInt(r.INTERVAL||"1",10)||1;
    var until=r.UNTIL?parseDate(r.UNTIL).date:null;
    var count=r.COUNT?parseInt(r.COUNT,10):null;
    var base=new Date(ev.start+"T00:00:00");
    var d=new Date(base.getTime()); var n=0, guard=0;
    while(guard<1200){ guard++;
      var ds=ymd(d);
      if(until&&ds>until)break; if(count&&n>=count)break;
      if(d>to)break;
      if(d>=from) push(ds);
      n++;
      if(freq==="DAILY") d.setDate(d.getDate()+interval);
      else if(freq==="WEEKLY") d.setDate(d.getDate()+7*interval);
      else if(freq==="MONTHLY") d.setMonth(d.getMonth()+interval);
      else if(freq==="YEARLY") d.setFullYear(d.getFullYear()+interval);
      else break;
    }
    return out;
  }

  function refresh(cb){
    var feeds=loadFeeds(); if(!feeds.length){ cb&&cb({ok:true,count:0}); return; }
    var from=new Date(Date.now()-30*864e5), to=new Date(Date.now()+400*864e5);
    var cache=loadCache(); var pending=feeds.length, anyErr=null, total=0;
    feeds.forEach(function(url){
      var fetchUrl=url.replace(/^webcal:/i,"https:");
      fetch(fetchUrl,{cache:"no-store"}).then(function(r){ if(!r.ok)throw new Error("HTTP "+r.status); return r.text(); })
        .then(function(txt){ var evs=parseICS(txt); var occ=[]; evs.forEach(function(ev){ occ=occ.concat(expand(ev,from,to)); }); cache[url]=occ; total+=occ.length; })
        .catch(function(e){ anyErr=e.message||"fetch failed"; })
        .then(function(){ if(--pending===0){ saveCache(cache); cb&&cb({ok:!anyErr,error:anyErr,count:total}); } });
    });
  }

  function allOccurrences(){ var c=loadCache(), out=[]; Object.keys(c).forEach(function(u){ (c[u]||[]).forEach(function(e){ out.push(e); }); }); return out; }
  function eventsOn(ds){ return allOccurrences().filter(function(e){ return e.date===ds; }); }

  global.Ics={
    loadFeeds:loadFeeds,
    addFeed:function(url){ var f=loadFeeds(); if(f.indexOf(url)===-1)f.push(url); saveFeeds(f); },
    removeFeed:function(url){ saveFeeds(loadFeeds().filter(function(u){return u!==url;})); var c=loadCache(); delete c[url]; saveCache(c); },
    refresh:refresh, eventsOn:eventsOn, parseICS:parseICS, expand:expand
  };
})(window);
