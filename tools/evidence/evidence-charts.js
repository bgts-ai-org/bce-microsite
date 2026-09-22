/* ============================================================
   EVIDENCE — figures.

   Five hand-built SVG figures over one frozen data object. No
   chart library: the page has no dependencies and these charts
   have to obey the instrument palette, the bilingual repaint and
   the reduced-motion rule like every other component here.

   Shared state lives in EV_VIEW so the model and split controls
   can never leave two figures disagreeing.
   ============================================================ */
(function(){
"use strict";
var B=window.__BCE; if(!B||!window.EVIDENCE) return;
var $=B.$, $$=B.$$, el=B.el, h=B.h, L=B.L, RM=B.RM;
var EV=window.EVIDENCE;

/* ---------- small helpers ---------- */
function clear(n){ while(n && n.firstChild) n.removeChild(n.firstChild); }
function css(v){ return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }
function isTR(){ return document.documentElement.lang==="tr"; }
/* Turkish writes a decimal comma, and puts the percent sign in front:
   78.6% in English is %78,6 in Turkish. Numbers are most of this section,
   so getting this wrong would be visible on every figure. */
function fmt(v,d){
  if(v==null) return "—";
  var s=v.toFixed(d==null?1:d);
  return isTR() ? s.replace(".",",") : s;
}
function pct(v){ return v==null ? "—" : (isTR() ? "%"+fmt(v,1) : fmt(v,1)+"%"); }
/* Minus sign, not hyphen: the page uses U+2212 everywhere else. */
function signed(v,d,suf){
  if(v==null) return "—";
  var s=(v<0?"−":"+")+fmt(Math.abs(v),d);
  return s+(suf||"");
}
/* English needs the agreement; Turkish does not pluralise after a number. */
function plural(n,word){ return n+" "+word+(n===1?"":"s"); }
function kfmt(n){
  if(n>=1e6) return (n/1e6).toFixed(2)+"M";
  if(n>=1e3) return Math.round(n/1e3)+"k";
  return String(n);
}
function txt(x,y,s,cls,anchor,size){
  var t=el("text",{x:x,y:y,"text-anchor":anchor||"start","font-size":size||11},s);
  if(cls) t.setAttribute("class",cls);
  return t;
}

/* Segmented control: real buttons, aria-pressed, roving tabindex —
   the same shape as the step controls elsewhere on the page. */
function seg(host,items,get,set){
  var btns=[];
  items.forEach(function(it,i){
    var b=h("button",{type:"button",class:"",tabindex:"-1"});
    b.setAttribute("aria-pressed","false");
    b.dataset.v=String(it.v);
    b.appendChild(h("span",{},it.label()));
    b.addEventListener("click",function(){ set(it.v); });
    b.addEventListener("keydown",function(e){
      var d = e.key==="ArrowRight"||e.key==="ArrowDown" ? 1
            : e.key==="ArrowLeft" ||e.key==="ArrowUp"   ? -1 : 0;
      if(!d) return;
      e.preventDefault();
      var n=(i+d+items.length)%items.length;
      btns[n].focus(); set(items[n].v);
    });
    host.appendChild(b); btns.push(b);
  });
  return {
    sync:function(){
      var cur=get();
      btns.forEach(function(b){
        var on=b.dataset.v===String(cur);
        b.setAttribute("aria-pressed",String(on));
        b.tabIndex=on?0:-1;
      });
    },
    relabel:function(){
      btns.forEach(function(b,i){ b.firstChild.textContent=items[i].label(); });
    }
  };
}

/* Tables are rebuilt rather than patched: one builder, one shape,
   so a table can never drift from the figure above it. */
function table(host,cap,head,rows){
  clear(host);
  var thead=h("thead"), tr=h("tr");
  head.forEach(function(c,i){
    var th=h("th",{scope:"col"},typeof c==="string"?c:c.t);
    if(typeof c!=="string" && c.num) th.className="num";
    if(i===0) th.removeAttribute("scope");
    tr.appendChild(th);
  });
  thead.appendChild(tr); host.appendChild(thead);
  var tb=h("tbody");
  rows.forEach(function(r){
    var t=h("tr");
    r.forEach(function(c,i){
      var cell;
      if(i===0){ cell=h("th",{scope:"row"},typeof c==="string"?c:c.t); }
      else {
        cell=h("td",{},typeof c==="string"?c:c.t);
        cell.className="num"+(c && c.cls?" "+c.cls:"");
      }
      t.appendChild(cell);
    });
    tb.appendChild(t);
  });
  host.appendChild(tb);
  var c=host.querySelector("caption");
  if(!c){ c=h("caption",{class:"sr-only"}); host.insertBefore(c,host.firstChild); }
  c.textContent=cap;
}

var LOSS_COLOR={semantic:"--i-accent",anchor:"--i-cand",expansion:"--i-type",none:"--i-dim"};
var CH_NAME={
  semantic :{en:"semantic",  tr:"anlamsal"},
  anchor   :{en:"anchor",    tr:"çıpa"},
  expansion:{en:"expansion", tr:"graf yürüyüşü"},
  none     :{en:"none",      tr:"hiçbiri"}
};
var FATE_NAME={
  returned:{en:"returned in the list", tr:"listede döndü"},
  narrowed:{en:"in the pool, did not fit K", tr:"havuzdaydı, K'ya sığmadı"},
  never   :{en:"never entered the pool", tr:"havuza hiç girmedi"}
};
var METRIC_NAME={
  recall :{en:"Symbol recall", tr:"Sembol recall"},
  hit    :{en:"Hit rate",      tr:"İsabet oranı"},
  frecall:{en:"File recall",   tr:"Dosya recall"},
  prec   :{en:"Precision",     tr:"Precision"},
  fprec  :{en:"File precision",tr:"Dosya precision"},
  mrr    :{en:"MRR",           tr:"MRR"},
  f1     :{en:"F1",            tr:"F1"}
};
var SPLIT_NAME={
  holdout:{en:"holdout 14", tr:"holdout 14"},
  tune   :{en:"tune 16",    tr:"tune 16"},
  all    :{en:"all 30",     tr:"tümü 30"}
};
function chName(id){ return L(CH_NAME[id].en,CH_NAME[id].tr); }

/* ---------- shared view state ---------- */
var EV_VIEW={model:"voyage",split:"holdout",k:20};
var subs=[];
EV_VIEW.on=function(fn){ subs.push(fn); };
EV_VIEW.set=function(kv){
  var changed=false;
  for(var k in kv){ if(EV_VIEW[k]!==kv[k]){ EV_VIEW[k]=kv[k]; changed=true; } }
  if(changed) subs.forEach(function(f){ f(); });
};
function M(){ return EV.replay.models[EV_VIEW.model]; }

/* ============================================================
   F1 — the K ladder
   Three small multiples so symbol recall and file recall sit on
   one ruler. K is a focus, not a filter: hiding two thirds of the
   data would make the K=5 loss something you have to go looking
   for, and the whole point is that you cannot miss it.
   ============================================================ */
(function(){
  var svg=$("#f1-svg"); if(!svg) return;
  var PANELS=["recall","hit","frecall"], KS=[5,10,20];
  var PW=240, PX=[40,320,600], Y0=300, HT=250, MAXV=80;
  var ctlM=$("#f1-model"), ctlS=$("#f1-split"), ctlK=$("#f1-k");

  var segM=seg(ctlM,[
    {v:"voyage",label:function(){return "voyage-code-4";}},
    {v:"jina",  label:function(){return "jina-1.5b";}}
  ],function(){return EV_VIEW.model;},function(v){EV_VIEW.set({model:v});});
  var segS=seg(ctlS,[
    {v:"holdout",label:function(){return L("holdout 14","holdout 14");}},
    {v:"tune",   label:function(){return L("tune 16","tune 16");}},
    {v:"all",    label:function(){return L("all 30","tümü 30");}}
  ],function(){return EV_VIEW.split;},function(v){EV_VIEW.set({split:v});});
  var segK=seg(ctlK,[
    {v:5, label:function(){return "5";}},
    {v:10,label:function(){return "10";}},
    {v:20,label:function(){return "20";}}
  ],function(){return EV_VIEW.k;},function(v){EV_VIEW.set({k:+v});});

  function y(v){ return Y0-(Math.max(0,Math.min(MAXV,v))/MAXV)*HT; }

  function draw(){
    var m=M(), sp=EV_VIEW.split, k=EV_VIEW.k;
    var mt=m.metrics[sp];
    clear(svg);
    svg.appendChild(el("title",{id:"f1-t"}));
    svg.appendChild(el("desc",{id:"f1-d"}));

    /* gridlines, one ruler for all three panels */
    [0,20,40,60,80].forEach(function(v){
      var g=el("line",{x1:30,x2:860,y1:y(v),y2:y(v),class:"gridline"});
      if(v===0) g.setAttribute("stroke",css("--band-ink-3"));
      svg.appendChild(g);
      svg.appendChild(txt(24,y(v)+4,pct(v).replace(isTR()?",0":".0",""),"",'end',10));
    });

    PANELS.forEach(function(metric,pi){
      var x0=PX[pi], series=mt[metric];
      svg.appendChild(txt(x0,34,L(METRIC_NAME[metric].en,METRIC_NAME[metric].tr),"big","start",13));

      KS.forEach(function(kk,ki){
        var slot=x0+ki*(PW/3), cell=PW/3;
        var d=series&&series[kk];
        var focus=(kk===k);
        var op=focus?1:0.5;

        if(!d){
          /* an honest hole: the report did not publish this cell */
          svg.appendChild(el("rect",{x:slot+cell/2-22,y:Y0-46,width:44,height:46,
            fill:"none",stroke:css("--i-rule"),"stroke-dasharray":"3 3",opacity:op}));
          svg.appendChild(txt(slot+cell/2,Y0-20,L("not","veri"),"", "middle",9));
          svg.appendChild(txt(slot+cell/2,Y0-9,L("published","yok"),"","middle",9));
        } else {
          var base=d[0], bce=d[1], lost=bce<base;
          var bw=26, gap=6, cx=slot+cell/2;
          var xb=cx-bw-gap/2, xe=cx+gap/2;

          var r1=el("rect",{x:xb,y:y(base),width:bw,height:Y0-y(base),
            fill:css("--i-dim"),opacity:op*0.85,rx:2,class:"bar"});
          var r2=el("rect",{x:xe,y:y(bce),width:bw,height:Y0-y(bce),
            fill:css(lost?"--i-error":"--i-accent"),opacity:op,rx:2,class:"bar"});
          svg.appendChild(r1); svg.appendChild(r2);

          var dl=txt(cx,Math.min(y(base),y(bce))-8,
            signed(bce-base,1," pp"),"val","middle",10);
          dl.setAttribute("fill",css(lost?"--i-error":"--i-accent"));
          dl.setAttribute("opacity",op);
          svg.appendChild(dl);

          if(focus){
            svg.appendChild(txt(xb+bw/2,Y0-4+18,fmt(base,1),"val","middle",10));
            svg.appendChild(txt(xe+bw/2,Y0-4+18,fmt(bce,1),"val","middle",10));
          }
        }

        var kl=txt(slot+cell/2,Y0+(d&&kk===k?34:18),"K="+kk,"","middle",focus?12:10);
        if(focus) kl.setAttribute("fill",css("--i-accent"));
        svg.appendChild(kl);

        /* Win-tie-loss for the focused K only: the honest column.
           A few cells come from the reports' K=5/10/20 tables, which
           publish the values but not the per-PR breakdown. Those get the
           bars and no strip, rather than an invented 0-30-0. */
        if(focus && d && d[2]!=null){
          var w=d[2],t=d[3],l=d[4], tot=w+t+l||1;
          var sx=x0, sw=PW, yy=Y0+56;
          var seg1=sw*w/tot, seg2=sw*t/tot, seg3=sw*l/tot;
          svg.appendChild(el("rect",{x:sx,y:yy,width:seg1,height:9,fill:css("--i-accent"),rx:1}));
          svg.appendChild(el("rect",{x:sx+seg1,y:yy,width:seg2,height:9,fill:css("--i-rule")}));
          svg.appendChild(el("rect",{x:sx+seg1+seg2,y:yy,width:seg3,height:9,fill:css("--i-error"),rx:1}));
          svg.appendChild(txt(sx,yy+22,w+" "+L("won","kazanıldı")+" · "+t+" "+L("tied","berabere")+" · "+l+" "+L("lost","kayıp"),"","start",10));
        }
      });
    });

    paintReadout();
  }

  function paintReadout(){
    var m=M(), sp=EV_VIEW.split, k=EV_VIEW.k, mt=m.metrics[sp];
    var rec=mt.recall&&mt.recall[k], fr=mt.frecall&&mt.frecall[k];
    var st=$("#f1-state");
    st.textContent=m.label+" · "+L(SPLIT_NAME[sp].en,SPLIT_NAME[sp].tr)+" · K="+k;

    var read=$("#f1-read"); clear(read);
    var lost=rec&&rec[1]<rec[0];
    var s;
    if(!rec){ s=L("This cell was not published.","Bu hücre yayımlanmadı."); }
    else if(lost){
      /* The two models lose at short lists for different reasons, and
         naming the wrong mechanism would be worse than naming none. */
      var why = m.guardRanks
        ? L("The guard hands the first "+m.guardRanks+" slots to the model, and on this half the model has no targets there — so what the engine did find is pushed down to 11-20.",
            "Guard, ilk "+m.guardRanks+" slotu modele veriyor ve bu yarıda modelin orada hedefi yok — dolayısıyla motorun bulduğu şeyler 11-20 aralığına iniyor.")
        : L("Slot one is always the model's own top hit and the list alternates from there, so a target the model ranked fourth lands seventh.",
            "Birinci slot her zaman modelin kendi en iyisi ve liste oradan itibaren dönüşümlü; modelin dördüncü sıraya koyduğu bir hedef yediye iniyor.");
      s=L(
        "At "+k+" symbols the engine is behind: "+pct(rec[1])+" against the model's "+pct(rec[0])+". "+why+" "+
        plural(rec[4],"pull request")+" lost, "+rec[2]+" won.",
        k+" sembolde motor geride: modelin "+pct(rec[0])+" değerine karşı "+pct(rec[1])+". "+why+" "+
        rec[4]+" pull request kayıp, "+rec[2]+" kazanıldı.");
    } else {
      s=L(
        "At "+k+" symbols the engine finds "+pct(rec[1])+" of what the pull request touched, against the model's "+pct(rec[0])+
        (fr?", and "+pct(fr[1])+" of the right files against "+pct(fr[0]):"")+". "+
        "It won "+rec[2]+" of "+(rec[2]+rec[3]+rec[4])+" pull requests and lost "+(rec[4]===0?"none":String(rec[4]))+".",
        /* Turkish possessive suffixes depend on the last vowel of the number,
           so they cannot be glued on by concatenation. Phrased to avoid them. */
        k+" sembolde motorun sembol recall'ü "+pct(rec[1])+"; modelde "+pct(rec[0])+
        (fr?". Dosya recall'ü "+pct(fr[1])+"; modelde "+pct(fr[0]):"")+". "+
        (rec[2]+rec[3]+rec[4])+" pull request'ten "+rec[2]+" tanesini kazandı, "+(rec[4]===0?"hiçbirini kaybetmedi":rec[4]+" tanesini kaybetti")+".");
    }
    read.appendChild(document.createTextNode(s));
    if(lost) read.className="chart-read bad"; else read.className="chart-read";

    /* the flattering view is the only one that carries a warning label */
    var cap=$("#f1-cap"); clear(cap);
    if(sp==="all"){
      var c=h("span",{class:"ev-chip warn"},
        L("includes the 16 pull requests the constants were fitted on",
          "sabitlerin üzerinde ayarlandığı 16 pull request'i içerir"));
      cap.appendChild(c);
    } else if(sp==="holdout"){
      cap.appendChild(document.createTextNode(
        L("Fourteen pull requests the engine's constants were never fitted on. A holdout this small moves with a single PR — read the win–tie–loss counts before the averages.",
          "Motorun sabitlerinin hiç ayarlanmadığı on dört pull request. Bu büyüklükte bir holdout tek bir PR ile oynar — ortalamalardan önce kazanç–berabere–kayıp sayılarına bakın.")));
    } else {
      cap.appendChild(document.createTextNode(
        L("The sixteen pull requests the engine's constants were fitted on. Read this as an upper bound, not as performance.",
          "Motorun sabitlerinin üzerinde ayarlandığı on altı pull request. Bunu performans değil, üst sınır olarak okuyun.")));
    }

    /* latency + retention tiles follow the model, not the split */
    var lat=m.latency[sp]||m.latency.all;
    $("#f1-lat-base").textContent=fmt(lat[0]/1000,2)+" s";
    $("#f1-lat-bce").textContent=fmt(lat[1]/1000,2)+" s";
    $("#f1-lat-note").textContent=m.engineShareMs
      ? L("of which "+fmt(m.engineShareMs/1000,2)+" s is the engine",
          "bunun "+fmt(m.engineShareMs/1000,2)+" s'si motor")
      : L("roughly 2.3× the model alone","yalnız modelin kabaca 2,3 katı");
    var ret=m.retention[sp];
    $("#f1-ret").textContent=pct(ret);
    $("#f1-ret").className="v"+(ret<100?" no":" ok");

    svg.querySelector("title").textContent=
      L("Symbol recall, hit rate and file recall at K=5, 10 and 20 — "+m.label+", "+sp,
        "K=5, 10 ve 20'de sembol recall, isabet oranı ve dosya recall — "+m.label+", "+sp);
    svg.querySelector("desc").textContent=s;

    buildTable();
    buildPRs();
  }

  function buildTable(){
    var m=M(), sp=EV_VIEW.split, mt=m.metrics[sp];
    var rows=[];
    ["recall","hit","frecall","prec","fprec","mrr","f1"].forEach(function(metric){
      var s=mt[metric]; if(!s) return;
      [5,10,20].forEach(function(kk){
        var d=s[kk]; if(!d) return;
        var dec=(metric==="mrr")?3:1;
        var lost=d[1]<d[0];
        rows.push([
          L(METRIC_NAME[metric].en,METRIC_NAME[metric].tr)+" @"+kk,
          {t:fmt(d[0],dec)},
          {t:fmt(d[1],dec),cls:lost?"bad":"good"},
          {t:signed(d[1]-d[0],dec),cls:lost?"bad":""},
          {t:d[2]==null?"—":d[2]+"–"+d[3]+"–"+d[4]}
        ]);
      });
    });
    table($("#f1-tbl"),
      L("Every published cell for "+m.label+", "+sp+" split",
        m.label+", "+sp+" bölümü için yayımlanan her hücre"),
      [L("metric","metrik"),{t:L("model","model"),num:true},{t:L("+ engine","+ motor"),num:true},
       {t:L("delta","fark"),num:true},{t:"W–T–L",num:true}],
      rows);
  }

  /* Six named pull requests instead of thirty bars of n=1 noise. */
  function buildPRs(){
    var host=$("#f1-prs"); clear(host);
    var m=M();
    host.appendChild(h("span",{class:"cl"},L("NOTABLE","DİKKAT ÇEKEN")));
    m.notable.forEach(function(p){
      var b=h("button",{type:"button"});
      b.setAttribute("aria-pressed","false");
      b.appendChild(h("span",{},"#"+p.pr));
      if(p.loss) b.style.color=css("--i-error");
      b.addEventListener("click",function(){
        var on=b.getAttribute("aria-pressed")==="true";
        $$("#f1-prs button").forEach(function(o){ o.setAttribute("aria-pressed","false"); });
        if(on){ paintReadout(); return; }
        b.setAttribute("aria-pressed","true");
        var r=$("#f1-read"); clear(r);
        r.className="chart-read"+(p.loss?" bad":"");
        r.appendChild(h("b",{},"#"+p.pr+" ("+p.split+") — "));
        r.appendChild(document.createTextNode(L(p.note.en,p.note.tr)));
      });
      host.appendChild(b);
    });
  }

  function sync(){ segM.sync(); segS.sync(); segK.sync(); draw(); }
  function relabel(){ segM.relabel(); segS.relabel(); segK.relabel(); sync(); }
  EV_VIEW.on(sync);
  document.addEventListener("bce:lang",relabel);
  sync();
})();

/* ============================================================
   F2 — where the truths were lost
   A sluice. Four channels on the left, three fates on the right,
   ribbons sized by count, and a dotted line at K=20 that the
   graph-walk ribbon hits and does not cross. That ribbon is the
   figure: twenty found, none returned.
   ============================================================ */
(function(){
  var svg=$("#f2-svg"); if(!svg) return;
  var LX=24, LW=144, RX=712, RW=144, KLINE=690;
  var TOP=56, SPAN=300, GAP=9;
  var sel=null;

  function draw(){
    var m=M(), lo=m.loss, total=m.truths;
    var PXU=SPAN/total;
    clear(svg);
    svg.appendChild(el("title",{id:"f2-t"}));
    svg.appendChild(el("desc",{id:"f2-d"}));

    /* geometry first, so ribbons can address exact sub-slots */
    var chans=lo.channels, y=TOP, chY={};
    chans.forEach(function(c){
      chY[c.id]={y:y,hgt:c.truths*PXU};
      y+=c.truths*PXU+GAP;
    });
    var fates=["returned","narrowed","never"];
    var totals={returned:0,narrowed:0,never:0};
    chans.forEach(function(c){ fates.forEach(function(f){ totals[f]+=c[f]; }); });
    var fy=TOP, fY={};
    fates.forEach(function(f){
      fY[f]={y:fy,hgt:totals[f]*PXU};
      fy+=totals[f]*PXU+GAP;
    });

    /* ribbons under the bands */
    var cCur={}, fCur={};
    chans.forEach(function(c){ cCur[c.id]=chY[c.id].y; });
    fates.forEach(function(f){ fCur[f]=fY[f].y; });

    fates.forEach(function(f){
      chans.forEach(function(c){
        var n=c[f]; if(!n) return;
        var hh=n*PXU;
        var y1=cCur[c.id], y2=fCur[f];
        cCur[c.id]+=hh; fCur[f]+=hh;

        var col=css(LOSS_COLOR[c.id]);
        var x1=LX+LW;
        /* narrowed ribbons stop dead at the K line; they did not get through */
        var x2=(f==="narrowed")?KLINE:RX;
        var c1=x1+(x2-x1)*0.5, c2=x2-(x2-x1)*0.5;
        var d="M"+x1+" "+y1+
              "C"+c1+" "+y1+","+c2+" "+y2+","+x2+" "+y2+
              "L"+x2+" "+(y2+hh)+
              "C"+c2+" "+(y2+hh)+","+c1+" "+(y1+hh)+","+x1+" "+(y1+hh)+"Z";
        var dim=(sel&&sel!==c.id)?0.1:1;
        var p=el("path",{d:d,class:"ribbon",fill:col,
          "fill-opacity":(f==="never"?0:0.22)*dim,
          stroke:col,"stroke-opacity":(f==="never"?0.4:0.55)*dim,"stroke-width":1});
        if(f==="never") p.setAttribute("stroke-dasharray","3 4");
        svg.appendChild(p);

        if(f==="narrowed"){
          svg.appendChild(el("rect",{x:KLINE-3,y:y2,width:4,height:hh,
            fill:css("--i-warn"),opacity:0.85*dim}));
        }
      });
    });

    /* the K cut line, drawn over the ribbons */
    svg.appendChild(el("line",{x1:KLINE,x2:KLINE,y1:30,y2:392,
      stroke:css("--i-accent"),"stroke-width":1,"stroke-dasharray":"2 4",opacity:.9}));
    svg.appendChild(txt(KLINE-7,26,"K = 20","big","end",11));

    /* channel bands */
    chans.forEach(function(c){
      var g=chY[c.id], col=css(LOSS_COLOR[c.id]);
      var dim=(sel&&sel!==c.id)?0.25:1;
      var solid=c.id!=="none";
      var r=el("rect",{x:LX,y:g.y,width:LW,height:g.hgt,rx:3,
        fill:solid?col:"none","fill-opacity":solid?0.14*dim:0,
        stroke:col,"stroke-opacity":(solid?1:0.55)*dim,"stroke-width":1});
      if(!solid) r.setAttribute("stroke-dasharray","4 3");
      svg.appendChild(r);
      var t1=txt(LX+10,g.y+16,chName(c.id),"big","start",12); t1.setAttribute("opacity",dim);
      var t2=txt(LX+10,g.y+31,c.truths+" · "+Math.round(c.truths/total*100)+"%","val","start",10);
      t2.setAttribute("opacity",dim);
      svg.appendChild(t1); svg.appendChild(t2);
    });

    /* fate bands */
    var fcol={returned:"--i-accent",narrowed:"--i-warn",never:"--i-dim"};
    fates.forEach(function(f){
      var g=fY[f], col=css(fcol[f]), solid=f!=="never";
      var r=el("rect",{x:RX,y:g.y,width:RW,height:g.hgt,rx:3,
        fill:solid?col:"none","fill-opacity":solid?0.1:0,
        stroke:col,"stroke-opacity":solid?1:0.55,"stroke-width":1});
      if(!solid) r.setAttribute("stroke-dasharray","4 3");
      svg.appendChild(r);
      svg.appendChild(txt(RX+10,g.y+16,String(totals[f]),"big","start",12));
      var nm=L(FATE_NAME[f].en,FATE_NAME[f].tr).split(",");
      svg.appendChild(txt(RX+10,g.y+30,nm[0],"val","start",9));
      if(nm[1]) svg.appendChild(txt(RX+10,g.y+41,nm[1].trim(),"val","start",9));
    });

    /* The one annotation this section exists to earn the right to print.
       Kept below the bands rather than over them: the ribbons are already
       the argument, and text on top of them would only obscure it. */
    var exp=chans.filter(function(c){return c.id==="expansion";})[0];
    if(exp){
      var a1=txt(440,418,L(exp.truths+" found by the graph walk. 0 made the list.",
        exp.truths+" tanesini graf yürüyüşü buldu. 0 tanesi listeye girdi."),"big","middle",13);
      a1.setAttribute("fill",css("--i-type"));
      svg.appendChild(a1);
      svg.appendChild(txt(440,434,
        L("median rank "+lo.medianPoolRank+" in the candidate pool — the largest open defect, and it is ours",
          "aday havuzunda medyan sıra "+lo.medianPoolRank+" — en büyük açık kusur ve bize ait"),"","middle",10));
    }

    $("#f2-state").textContent=m.label+" · "+total+" "+L("truths","doğru")+" · K=20";
    svg.querySelector("title").textContent=
      L("Where the "+total+" ground-truth symbols ended up, by the channel that found them",
        total+" doğru sembolün, onları bulan kanala göre nereye vardığı");
    svg.querySelector("desc").textContent=chans.map(function(c){
      return chName(c.id)+": "+c.truths+" → "+c.returned+" "+L("returned","döndü")+", "+
             c.narrowed+" "+L("narrowed out","elendi")+", "+c.never+" "+L("never reached","hiç ulaşılmadı");
    }).join(". ");

    readout();
    buildLegend();
    buildTable();
  }

  function readout(){
    var m=M(), lo=m.loss, r=$("#f2-read"); clear(r);
    var c=sel&&lo.channels.filter(function(x){return x.id===sel;})[0];
    if(!c){
      var ret=lo.channels.reduce(function(a,x){return a+x.returned;},0);
      r.appendChild(document.createTextNode(L(
        "Of "+m.truths+" symbols the diffs actually touched, "+ret+" came back in the final twenty. "+
        "Select a channel to follow it.",
        "Diff'lerin gerçekten dokunduğu "+m.truths+" sembolden "+ret+" tanesi son yirmide geri döndü. "+
        "Bir kanalı seçerek izleyin.")));
      return;
    }
    var s;
    if(c.id==="semantic") s=L(
      c.truths+" of "+m.truths+" targets were already in the model's own list. "+c.returned+" came back; "+c.narrowed+" were pushed out in narrowing.",
      m.truths+" hedeften "+c.truths+" tanesi zaten modelin kendi listesindeydi. "+c.returned+" tanesi geri döndü; "+c.narrowed+" tanesi daraltmada dışarı itildi.");
    else if(c.id==="anchor") s=L(
      c.truths+" targets were named — as an identifier or a distinctive word — in the task text itself. "+c.returned+" came back.",
      c.truths+" hedef, görev metninde — bir tanımlayıcı ya da ayırt edici bir kelime olarak — doğrudan geçiyordu. "+c.returned+" tanesi geri döndü.");
    else if(c.id==="expansion") s=L(
      c.truths+" targets were found by walking the code graph out from an anchor. None of them made the final twenty. Their median rank in the candidate pool was "+m.loss.medianPoolRank+". The engine reaches them and cannot rank them — this is our defect, not the model's.",
      c.truths+" hedef, bir çıpadan kod grafı yürünerek bulundu. Hiçbiri son yirmiye giremedi. Aday havuzundaki medyan sıraları "+m.loss.medianPoolRank+". Motor onlara ulaşıyor ama sıralayamıyor — bu modelin değil, bizim kusurumuz.");
    else s=L(
      c.truths+" targets — "+Math.round(c.truths/m.truths*100)+"% — were never reachable at all. Not in the model's list, not named in the task text, not a neighbour of anything that was. No list length fixes this; it is a property of how the task was written.",
      c.truths+" hedefe — %"+Math.round(c.truths/m.truths*100)+" — hiç ulaşılamadı. Ne modelin listesinde, ne görev metninde, ne de bunlardan birinin komşusu. Bunu liste uzunluğu çözmez; görevin nasıl yazıldığına bağlı bir özellik.");
    r.className="chart-read"+(c.id==="expansion"||c.id==="none"?" bad":"");
    r.appendChild(document.createTextNode(s));
  }

  function buildLegend(){
    var host=$("#f2-legend"); clear(host);
    M().loss.channels.forEach(function(c){
      var b=h("button",{type:"button"});
      b.setAttribute("aria-pressed",String(sel===c.id));
      b.style.color=css(LOSS_COLOR[c.id]);
      b.appendChild(h("span",{},chName(c.id)+" · "+c.truths));
      b.addEventListener("click",function(){ sel=(sel===c.id)?null:c.id; draw(); });
      host.appendChild(b);
    });
  }

  function buildTable(){
    var m=M(), lo=m.loss;
    var rows=lo.channels.map(function(c){
      return [chName(c.id),{t:String(c.truths)},
        {t:String(c.returned),cls:c.returned?"good":""},
        {t:String(c.narrowed),cls:c.narrowed?"bad":""},
        {t:String(c.never),cls:c.never?"bad":""}];
    });
    var sum=function(k){ return lo.channels.reduce(function(a,c){return a+c[k];},0); };
    rows.push([L("total","toplam"),{t:String(m.truths)},{t:String(sum("returned"))},
               {t:String(sum("narrowed"))},{t:String(sum("never"))}]);
    table($("#f2-tbl"),
      L("Ground-truth symbols by discovery channel and outcome at K=20, "+m.label,
        "K=20'de keşif kanalına ve sonuca göre doğru semboller, "+m.label),
      [L("channel","kanal"),{t:L("truths","doğru"),num:true},
       {t:L("returned","listede"),num:true},
       {t:L("did not fit K","K'ya sığmadı"),num:true},
       {t:L("never in pool","havuza girmedi"),num:true}],
      rows);
  }

  EV_VIEW.on(function(){ sel=null; draw(); });
  document.addEventListener("bce:lang",draw);
  draw();
})();

/* ============================================================
   F3 — the guard sweep, behind a disclosure.
   The only artifact on the site that shows a tuning decision and
   what it cost: the value shipped is not the best on the half it
   was fitted on.
   ============================================================ */
(function(){
  var wrap=$("#f3-wrap"); if(!wrap) return;
  var body=$("#f3-body"), built=false, gsel=10;

  function build(){
    clear(body);
    if(EV_VIEW.model!=="jina"){
      body.appendChild(h("p",{class:"chart-read"},
        L("voyage-code-4 runs with semantic_guard_ranks = 0. The sweep exists because jina needed one — switch the model above to see it.",
          "voyage-code-4, semantic_guard_ranks = 0 ile koşuyor. Tarama, jina'nın buna ihtiyaç duyması yüzünden var — görmek için yukarıdan modeli değiştirin.")));
      return;
    }
    var g=EV.replay.models.jina.guard;

    var p=h("p",{class:"chart-gloss"},
      L("Engine-only reruns with the model's own lists held fixed. Recall at twenty symbols. The dashed rule is jina on its own on the holdout — the line the engine has to clear.",
        "Modelin kendi listeleri sabit tutularak yapılan, yalnız motoru çalıştıran yeniden koşular. Yirmi sembolde recall. Kesikli çizgi, holdout'ta yalnız jina — motorun geçmesi gereken çizgi."));
    body.appendChild(p);

    var ctl=h("div",{class:"grp",style:"margin-bottom:16px"});
    ctl.appendChild(h("span",{class:"cl"},"semantic_guard_ranks"));
    body.appendChild(h("div",{class:"chart-ctl"})).appendChild(ctl);
    seg(ctl,g.rows.map(function(r){
      return {v:r.g,label:function(){ return String(r.g)+(r.chosen?" ▲":""); }};
    }),function(){return gsel;},function(v){ gsel=+v; paint(); }).sync();

    var plot=h("div",{class:"plot",style:"--ar:700/330"});
    var svg=el("svg",{viewBox:"0 0 700 330",role:"img"});
    svg.appendChild(el("title",{}));
    plot.appendChild(svg); body.appendChild(plot);
    body.appendChild(h("p",{class:"chart-read",id:"f3-read"}));
    var det=h("details",{class:"numbers"});
    det.appendChild(h("summary",{},L("Show the numbers","Sayıları göster")));
    var tw=h("div",{class:"tbl-wrap"}); var tb=h("table",{id:"f3-tbl"});
    tw.appendChild(tb); det.appendChild(tw); body.appendChild(det);

    function paint(){
      clear(svg); svg.appendChild(el("title",{}));
      var X0=60,X1=660,Y0=280,Y1=40,LO=18,HI=46;
      var xs=g.rows.map(function(r,i){ return X0+i*((X1-X0)/(g.rows.length-1)); });
      function y(v){ return Y0-((v-LO)/(HI-LO))*(Y0-Y1); }

      [20,30,40].forEach(function(v){
        svg.appendChild(el("line",{x1:X0-14,x2:X1,y1:y(v),y2:y(v),class:"gridline"}));
        svg.appendChild(txt(X0-20,y(v)+4,v+"%","",'end',10));
      });
      /* the line the engine has to clear */
      svg.appendChild(el("line",{x1:X0-14,x2:X1,y1:y(g.baselineHoldout),y2:y(g.baselineHoldout),
        stroke:css("--i-dim"),"stroke-dasharray":"5 4","stroke-width":1.2}));
      svg.appendChild(txt(X1,y(g.baselineHoldout)-7,
        L("jina alone, holdout — "+g.baselineHoldout+"%","yalnız jina, holdout — %"+g.baselineHoldout),"","end",10));

      [{k:"all",c:"--band-ink-2",w:1.5,d:null},
       {k:"tune",c:"--band-ink-3",w:1.5,d:"4 3"},
       {k:"hold",c:"--i-accent",w:2.2,d:null}].forEach(function(s){
        var pts=g.rows.map(function(r,i){ return xs[i]+","+y(r[s.k]); }).join(" ");
        var pl=el("polyline",{points:pts,fill:"none",stroke:css(s.c),"stroke-width":s.w,class:"ln"});
        if(s.d) pl.setAttribute("stroke-dasharray",s.d);
        svg.appendChild(pl);
        g.rows.forEach(function(r,i){
          var below=(s.k==="hold"&&r[s.k]<g.baselineHoldout);
          svg.appendChild(el("circle",{cx:xs[i],cy:y(r[s.k]),r:s.k==="hold"?4:3,
            fill:css(below?"--i-error":s.c),class:"pt"}));
        });
      });

      g.rows.forEach(function(r,i){
        var on=r.g===gsel;
        if(on) svg.appendChild(el("rect",{x:xs[i]-22,y:Y1-16,width:44,height:Y0-Y1+16,
          fill:css("--i-accent"),opacity:.07}));
        var t=txt(xs[i],Y0+20,String(r.g),"",'middle',on?12:10);
        if(on) t.setAttribute("fill",css("--i-accent"));
        svg.appendChild(t);
        if(r.chosen) svg.appendChild(txt(xs[i],Y0+34,L("shipped","yayımlanan"),"","middle",9));
      });
      svg.appendChild(txt(X0-20,Y0+20,"guard","","end",10));

      var row=g.rows.filter(function(r){return r.g===gsel;})[0];
      var rd=$("#f3-read"); clear(rd);
      rd.className="chart-read"+(row.hold<g.baselineHoldout?" bad":"");
      rd.appendChild(h("b",{},"guard "+row.g+" · holdout "+row.hold+"% · retention "+row.ret+"% — "));
      rd.appendChild(document.createTextNode(L(row.note.en,row.note.tr)));
      svg.querySelector("title").textContent=
        L("Recall at twenty symbols against the semantic guard setting",
          "semantic guard ayarına karşı yirmi sembolde recall");

      table(tb,L("The semantic_guard_ranks sweep","semantic_guard_ranks taraması"),
        ["guard",{t:L("all 30","tümü 30"),num:true},{t:"tune 16",num:true},
         {t:"holdout 14",num:true},{t:"retention",num:true}],
        g.rows.map(function(r){
          return [String(r.g)+(r.chosen?" ▲":""),{t:fmt(r.all,1)},{t:fmt(r.tune,1)},
                  {t:fmt(r.hold,1),cls:r.hold<g.baselineHoldout?"bad":"good"},
                  {t:fmt(r.ret,0)+"%",cls:r.ret<90?"bad":""}];
        }));
    }
    paint();
  }

  wrap.addEventListener("toggle",function(){
    if(wrap.open && !built){ built=true; build(); }
  });
  EV_VIEW.on(function(){ if(built) build(); });
  document.addEventListener("bce:lang",function(){ if(built) build(); });
})();

/* ============================================================
   F4 — what the agent stopped doing
   Diverging ratios against 1.00. Bar = per-run aggregate,
   diamond = per-task median. Where they disagree the aggregate
   is being carried by the heavy tasks, and saying so is the
   difference between a chart and an advertisement.
   ============================================================ */
(function(){
  var svg=$("#f4-svg"); if(!svg) return;
  var GROUPS=[
    {id:"search",name:{en:"Searching",tr:"Arama"}},
    {id:"cost",  name:{en:"Cost",     tr:"Maliyet"}},
    {id:"work",  name:{en:"Work",     tr:"İş"}}
  ];
  var X0=250, X1=740, LO=0.4, HI=1.18, BOT=496;
  function x(v){ return X0+((Math.max(LO,Math.min(HI,v))-LO)/(HI-LO))*(X1-X0); }

  function draw(){
    clear(svg);
    svg.appendChild(el("title",{id:"f4-t"}));
    svg.appendChild(el("desc",{id:"f4-d"}));
    var y=34;

    [0.5,0.75,1.0].forEach(function(v){
      svg.appendChild(el("line",{x1:x(v),x2:x(v),y1:20,y2:BOT,
        stroke:css(v===1?"--band-ink-3":"--i-rule"),"stroke-width":v===1?1.4:1}));
      svg.appendChild(txt(x(v),16,v.toFixed(2),"","middle",10));
    });
    svg.appendChild(txt(x(1),BOT+16,L("1.00 = no change","1,00 = değişim yok"),"","middle",10));

    GROUPS.forEach(function(g){
      svg.appendChild(txt(20,y+4,L(g.name.en,g.name.tr).toUpperCase(),"big","start",11));
      y+=22;
      EV.cursor.agg.filter(function(r){return r.shown&&r.group===g.id;}).forEach(function(r){
        var better=r.ratio<1, medBad=r.med>1;
        var xr=x(r.ratio), x1=x(1);
        svg.appendChild(el("rect",{x:Math.min(xr,x1),y:y-7,width:Math.abs(x1-xr),height:14,rx:2,
          fill:css(better?"--i-accent":"--i-error"),opacity:.85,class:"bar"}));
        /* the median, as an open diamond */
        var mx=x(r.med);
        svg.appendChild(el("path",{d:"M"+mx+" "+(y-8)+"L"+(mx+6)+" "+y+"L"+mx+" "+(y+8)+"L"+(mx-6)+" "+y+"Z",
          fill:"none",stroke:css(medBad?"--i-error":"--band-ink-2"),"stroke-width":1.4}));

        svg.appendChild(txt(238,y+4,L(r.label.en,r.label.tr),"val","end",11));
        var v=txt(X1+8,y+4,r.ratio.toFixed(2),"big","start",11);
        v.setAttribute("fill",css(better?"--i-accent":"--i-error"));
        svg.appendChild(v);
        if(r.won!=null) svg.appendChild(txt(238,y+17,r.won+"/14 "+L("won","kazanıldı"),"","end",9));
        y+=40;
      });
      y+=10;
    });

    /* legend, under the plot */
    var ly=BOT+38;
    svg.appendChild(el("rect",{x:20,y:ly-8,width:16,height:9,rx:2,fill:css("--i-accent"),opacity:.85}));
    svg.appendChild(txt(44,ly,L("per-run aggregate","koşu başına toplam"),"","start",10));
    svg.appendChild(el("path",{d:"M196 "+(ly-12)+"L202 "+(ly-4)+"L196 "+(ly+4)+"L190 "+(ly-4)+"Z",
      fill:"none",stroke:css("--band-ink-2"),"stroke-width":1.4}));
    svg.appendChild(txt(210,ly,L("per-task median","görev bazında medyan"),"","start",10));

    var rd=$("#f4-read"); clear(rd);
    rd.appendChild(document.createTextNode(L(
      "The agent searched about half as much: grep and glob output fell to 0.54 of the plain arm and total tool output to 0.70. Tokens fell to 0.80. Wall clock is the one row to read twice — the aggregate says 0.90, the per-task median says 1.06, which means the time saving comes entirely from the heavy tasks and small ones are slightly slower.",
      "Ajan yaklaşık yarı yarıya daha az arama yaptı: grep ve glob çıktısı sade kolun 0,54'üne, toplam araç çıktısı 0,70'ine indi. Token 0,80'e düştü. İki kez okunması gereken satır süre — toplam 0,90 diyor, görev bazında medyan 1,06; yani süre tasarrufu tamamen ağır görevlerden geliyor ve küçükler bir parça yavaşlıyor.")));

    svg.querySelector("title").textContent=L(
      "Sixteen agent behaviours as a ratio against the plain arm",
      "On altı ajan davranışının sade kola oranı");
    svg.querySelector("desc").textContent=rd.textContent;

    table($("#f4-tbl"),
      L("All measured rows. Cost proxy = uncached input ×1 + cache read ×0.25 + output ×2.5, a relative unit and not a currency amount.",
        "Ölçülen tüm satırlar. Maliyet vekili = cache'siz girdi ×1 + cache okuma ×0,25 + çıktı ×2,5; göreli bir birim, para tutarı değil."),
      [L("metric","metrik"),{t:L("plain","sade"),num:true},{t:L("+ engine","+ motor"),num:true},
       {t:L("ratio","oran"),num:true},{t:L("median","medyan"),num:true},{t:L("won","kazanıldı"),num:true}],
      EV.cursor.agg.map(function(r){
        var u=r.unit?" "+r.unit:"";
        return [L(r.label.en,r.label.tr),
          {t:(r.plain>=1000?kfmt(r.plain):r.plain)+u},
          {t:(r.mcp>=1000?kfmt(r.mcp):r.mcp)+u},
          {t:r.ratio.toFixed(2),cls:r.ratio<1?"good":"bad"},
          {t:r.med.toFixed(2),cls:r.med>1?"bad":""},
          {t:r.won==null?"—":r.won+"/14"}];
      }));
  }
  document.addEventListener("bce:lang",draw);
  draw();
})();

/* ============================================================
   F5 — the gain scales with the task
   Fourteen tasks as fourteen marks, fourteen buttons and one
   card at a time. Never fourteen rows on screen, except in the
   table where all fourteen belong.
   ============================================================ */
(function(){
  var svg=$("#f5-svg"); if(!svg) return;
  var T=EV.cursor.tasks, sel=null;
  var X0=64,X1=600,Y0=344,Y1=34, TLO=Math.log(38), THI=Math.log(380), RLO=0.42, RHI=1.5;
  var VC={win:"--i-accent",slight:"--i-accent",tie:"--i-dim",lossSlight:"--i-error",loss:"--i-error"};
  var VN={
    win:{en:"the engine won",tr:"motor kazandı"},
    slight:{en:"slightly ahead",tr:"az farkla önde"},
    tie:{en:"tie",tr:"berabere"},
    lossSlight:{en:"plain slightly ahead",tr:"sade koşu az farkla önde"},
    loss:{en:"plain ahead",tr:"sade koşu önde"}
  };
  function x(s){ return X0+((Math.log(s)-TLO)/(THI-TLO))*(X1-X0); }
  function y(r){ return Y0-((Math.max(RLO,Math.min(RHI,r))-RLO)/(RHI-RLO))*(Y0-Y1); }
  function ratio(t){ return t.mcp.tok/t.plain.tok; }

  function draw(){
    clear(svg);
    [0.5,0.75,1.0,1.25].forEach(function(v){
      svg.appendChild(el("line",{x1:X0-10,x2:X1+20,y1:y(v),y2:y(v),
        stroke:css(v===1?"--band-ink-3":"--i-rule"),"stroke-width":v===1?1.4:1}));
      svg.appendChild(txt(X0-16,y(v)+4,v.toFixed(2),"","end",10));
    });
    [60,120,240].forEach(function(s){
      svg.appendChild(txt(x(s),Y0+18,s+"s","","middle",10));
    });
    /* the report's own stated threshold, as a labelled claim */
    svg.appendChild(el("line",{x1:x(150),x2:x(150),y1:Y1,y2:Y0,
      stroke:css("--i-warn"),"stroke-dasharray":"3 4","stroke-width":1,opacity:.7}));
    svg.appendChild(txt(x(150)+6,Y1+12,L("above here the gain is real","buradan sonrası gerçek kazanç"),"","start",9));
    svg.appendChild(txt(X0-16,Y1-6,L("tokens, engine ÷ plain","token, motor ÷ sade"),"","start",10));

    var maxTok=Math.max.apply(null,T.map(function(t){return t.plain.tok;}));
    T.forEach(function(t){
      var r=ratio(t), on=(sel===t.id), dim=(sel&&!on)?0.25:1;
      var rad=5+Math.sqrt(t.plain.tok/maxTok)*11;
      var c=el("circle",{cx:x(t.plain.s),cy:y(r),r:on?rad+3:rad,class:"pt",
        fill:css(VC[t.verdict]),"fill-opacity":(t.verdict==="tie"?0:0.5)*dim,
        stroke:css(VC[t.verdict]),"stroke-opacity":dim,"stroke-width":on?2:1.2});
      svg.appendChild(c);
      /* label the outlier, the best and the worst by default */
      if(on||t.id==="T13"||t.id==="T09"||t.id==="T01"){
        var lb=txt(x(t.plain.s),y(r)-rad-6,t.id,"big","middle",on?12:10);
        lb.setAttribute("fill",css(VC[t.verdict]));
        lb.setAttribute("opacity",dim);
        svg.appendChild(lb);
      }
    });
    paintCard(); paintLedger(); paintRead(); buildTable();
  }

  function paintLedger(){
    var host=$("#f5-ledger"); clear(host);
    T.forEach(function(t,i){
      var b=h("button",{type:"button",class:"v-"+t.verdict,tabindex:sel===t.id||(!sel&&i===0)?"0":"-1"});
      b.setAttribute("aria-pressed",String(sel===t.id));
      b.appendChild(h("span",{},t.id));
      b.addEventListener("click",function(){ sel=(sel===t.id)?null:t.id; draw(); });
      b.addEventListener("keydown",function(e){
        var d=e.key==="ArrowRight"?1:e.key==="ArrowLeft"?-1:0;
        if(e.key==="Escape"){ sel=null; draw(); return; }
        if(!d) return;
        e.preventDefault();
        var n=(i+d+T.length)%T.length;
        sel=T[n].id; draw();
        var bs=$$("#f5-ledger button"); if(bs[n]) bs[n].focus();
      });
      host.appendChild(b);
    });
  }

  function pair(k,a,b,better){
    var d=h("div");
    d.appendChild(h("span",{class:"k"},k));
    d.appendChild(h("span",{class:"v"},a+" / "+b));
    if(better!=null) d.appendChild(h("span",{class:"d "+(better<1?"good":"bad")},"×"+better.toFixed(2)));
    return d;
  }

  function paintCard(){
    var card=$("#f5-card"); clear(card);
    var t=sel&&T.filter(function(z){return z.id===sel;})[0];
    if(!t){
      card.appendChild(h("p",{class:"why"},
        L("Select a task to see what changed. Three are labelled on the chart: T01 and T09 are the engine's clearest wins, T13 its worst result.",
          "Ne değiştiğini görmek için bir görev seçin. Üçü grafikte etiketli: T01 ve T09 motorun en açık kazançları, T13 en kötü sonucu.")));
      return;
    }
    var hd=h("div",{class:"hd"});
    hd.appendChild(h("span",{class:"id"},t.id));
    var vc=h("span",{class:"ev-chip"},L(VN[t.verdict].en,VN[t.verdict].tr));
    vc.style.color=css(VC[t.verdict]); vc.style.borderColor=css(VC[t.verdict]);
    hd.appendChild(vc);
    hd.appendChild(h("span",{class:"ev-chip"},t.kind));
    var cc=h("span",{class:"ev-chip"+(t.conf==="high"&&t.verdict==="loss"?" warn":"")},"confidence "+t.conf);
    hd.appendChild(cc);
    card.appendChild(hd);
    card.appendChild(h("h5",{},L(t.title.en,t.title.tr)));

    var g=h("div",{class:"ev-pairs"});
    g.appendChild(pair(L("TIME, ENGINE / PLAIN","SÜRE, MOTOR / SADE"),t.mcp.s+"s",t.plain.s+"s",t.mcp.s/t.plain.s));
    g.appendChild(pair(L("TOKENS","TOKEN"),kfmt(t.mcp.tok),kfmt(t.plain.tok),t.mcp.tok/t.plain.tok));
    g.appendChild(pair(L("MODEL TURNS","MODEL TURU"),t.mcp.turns,t.plain.turns,t.mcp.turns/t.plain.turns));
    g.appendChild(pair(L("SEARCH OUTPUT","ARAMA ÇIKTISI"),t.mcp.search+"KB",t.plain.search+"KB",t.mcp.search/t.plain.search));
    card.appendChild(g);
    card.appendChild(h("p",{class:"why"},L(t.why.en,t.why.tr)));
    if(t.mcp.checks && t.plain.checks && t.plain.checks[0]!==t.plain.checks[1]){
      var w=h("p",{class:"why"});
      w.style.color=css("--i-error");
      w.textContent=L("The plain arm failed an automated check here: "+t.plain.checks[0]+" of "+t.plain.checks[1]+".",
                      "Sade kol burada bir otomatik kontrolü geçemedi: "+t.plain.checks[1]+" üzerinden "+t.plain.checks[0]+".");
      card.appendChild(w);
    }
  }

  function paintRead(){
    var rd=$("#f5-read"); clear(rd);
    var st=$("#f5-state");
    var wins=T.filter(function(t){return t.verdict==="win"||t.verdict==="slight";}).length;
    var losses=T.filter(function(t){return t.verdict==="loss"||t.verdict==="lossSlight";}).length;
    st.textContent=wins+" "+L("ahead","önde")+" · "+(14-wins-losses)+" "+L("tied","berabere")+" · "+losses+" "+L("behind","geride");
    rd.appendChild(document.createTextNode(L(
      "The two heaviest tasks — T09 at 338 seconds and T01 at 200 — are where the engine cuts 45% and 33% of the tokens. T13, a translation task, is its worst: the code graph does not index locale files, so the agent searched for them anyway and spent 40% more.",
      "En ağır iki görev — 338 saniyelik T09 ve 200 saniyelik T01 — motorun tokenin %45 ve %33'ünü kestiği yerler. Bir çeviri görevi olan T13 ise en kötüsü: kod grafı locale dosyalarını indekslemediği için ajan onları yine aradı ve %40 fazla harcadı.")));
  }

  function buildTable(){
    table($("#f5-tbl"),
      L("All fourteen tasks, both arms","On dört görevin tamamı, iki kol"),
      [L("task","görev"),{t:L("verdict","sonuç"),num:true},{t:L("time e/p","süre m/s"),num:true},
       {t:L("tokens e/p","token m/s"),num:true},{t:L("turns e/p","tur m/s"),num:true},
       {t:L("search e/p","arama m/s"),num:true},{t:L("checks e/p","kontrol m/s"),num:true}],
      T.map(function(t){
        var lost=t.verdict==="loss"||t.verdict==="lossSlight";
        return [t.id+" — "+L(t.title.en,t.title.tr),
          {t:L(VN[t.verdict].en,VN[t.verdict].tr),cls:lost?"bad":(t.verdict==="tie"?"":"good")},
          {t:t.mcp.s+"/"+t.plain.s+"s"},
          {t:kfmt(t.mcp.tok)+"/"+kfmt(t.plain.tok)},
          {t:t.mcp.turns+"/"+t.plain.turns},
          {t:t.mcp.search+"/"+t.plain.search+"KB"},
          {t:t.mcp.checks[0]+"/"+t.mcp.checks[1]+" · "+t.plain.checks[0]+"/"+t.plain.checks[1],
           cls:t.plain.checks[0]!==t.plain.checks[1]?"bad":""}];
      }));
  }
  document.addEventListener("bce:lang",draw);
  draw();
})();

/* ============================================================
   Layer 2 tabs — two studies, two agents, two models.
   ============================================================ */
(function(){
  var host=$("#ev-tabs"); if(!host) return;
  var TABS=[
    {id:"cursor",label:{en:"Cursor + grok · 14 tasks",tr:"Cursor + grok · 14 görev"}},
    {id:"claude",label:{en:"Claude opus-5 · 5 refactors",tr:"Claude opus-5 · 5 refactor"}}
  ];
  var cur="cursor", btns=[];

  function build(){
    clear(host); btns=[];
    TABS.forEach(function(t,i){
      var b=h("button",{type:"button",role:"tab",id:"ev-tab-"+t.id+"-b",
        "aria-controls":"ev-tab-"+t.id,tabindex:cur===t.id?"0":"-1"});
      b.setAttribute("aria-selected",String(cur===t.id));
      b.appendChild(h("span",{},L(t.label.en,t.label.tr)));
      b.addEventListener("click",function(){ sel(t.id); });
      b.addEventListener("keydown",function(e){
        var d=e.key==="ArrowRight"?1:e.key==="ArrowLeft"?-1:0;
        if(!d) return;
        e.preventDefault();
        var n=(i+d+TABS.length)%TABS.length;
        sel(TABS[n].id); btns[n].focus();
      });
      host.appendChild(b); btns.push(b);
    });
  }
  function sel(id){
    cur=id;
    TABS.forEach(function(t){
      var p=$("#ev-tab-"+t.id);
      if(p) p.hidden=(t.id!==id);
    });
    build();
  }
  build(); sel("cursor");
  document.addEventListener("bce:lang",build);
})();
})();
