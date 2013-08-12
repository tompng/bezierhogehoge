function polyAdd4(N,a,arr1,b,arr2,c,arr3,d,arr4){
  var out=[];
  for(var i=0;i<N;i++){
    out[i]=a*arr1[i]+b*arr2[i]+c*arr3[i]+d*arr4[i];
  }
  return out;
}


function polyAdd(arr1,arr2){
  var len=Math.max(arr1.length,arr2.length);
  var out=[];
  for(var i=0;i<len;i++){
    out[i]=(arr1[i]||0)+(arr2[i]||0);
  }
  return out;
}
function polyMult(arr1,arr2){
  var out=[];
  for(var i=0;i<arr1.length;i++)for(var j=0;j<arr2.length;j++){
    out[i+j]=(out[i+j]||0)+arr1[i]*arr2[j];
  }
  return out;
}
function polyScale(a,arr){
  var out=[];
  for(var i=0;i<arr.length;i++)out[i]=a*arr[i];
  return out;
}

function polyAssign(arr,t){
  var tn=1,out=0;
  for(var i=0;i<arr.length;i++){
    out+=tn*arr[i];
    tn*=t;
  }
  return out;
}

function polyDerivate(arr){
  var out=[];
  for(var i=1;i<arr.length;i++){
    out[i-1]=i*arr[i];
  }
  return out;
}

function polySolve(arr,t,step){
  var darr=polyDerivate(arr);
  for(var i=0;i<step;i++){
    var y=polyAssign(arr,t);
    var dy=polyAssign(darr,t);
    t-=y/dy;
  }
  return t;
}


function solveAll(arr,level){
  var rec=0;
  // function comp(t0,t1){
  //   var tmin=1,tmax=1;
  //   var min=0,max=0;
  //   for(var i=0;i<arr.length;i++){
  //     var y0=arr[i]*tmin,y1=arr[i]*tmax;
  //     min+=Math.min(y0,y1);
  //     max+=Math.max(y0,y1);
  //     tmin*=t0;tmax*=t1;
  //   }
  //   if(min>0)return 1;
  //   if(max<0)return -1;
  //   return 0;
  // }
  function comp(t0,t1){
    var min=0,max=0;
    var sumdif=0,sumc0=arr[0],sumc1=arr[1];
    var t0n=t0,t1n=t1;
    for(var n=2;n<arr.length;n++){
      t0n*=t0;t1n*=t1;
      var c1=(t1n-t0n)/(t1-t0);
      var cmin=c1*Math.pow(c1/n,1/(n-1))*(1/n-1);
      var cmax=t0n-t0*c1;
      sumc0+=arr[n]*(cmax+cmin)/2;
      sumc1+=arr[n]*c1;
      sumdif+=Math.abs(arr[n]*(cmax-cmin)/2);
    }
    var y0=sumc0+sumc1*t0;
    var y1=sumc0+sumc1*t1;
    var ymin=Math.min(y0,y1);
    var ymax=Math.max(y0,y1);
    if(ymin>sumdif)return 1;
    if(ymax<-sumdif)return -1;
    return 0;
  }
  var outs=[];
  var last=[];
  function push(t0,t1){
    if(last[1]==t0)last[1]=t1;
    else outs.push(last=[t0,t1]);
  }
  function solve(t0,t1,i){
    rec++;
    var c=comp(t0,t1);
    if(c>0){
      push(t0,t1);
    }else if(c==0){
      if(i<level){
        var tm=(t0+t1)/2;
        solve(t0,tm,i+1);
        solve(tm,t1,i+1);
      }else{
        var y0=polyAssign(arr,t0);
        var y1=polyAssign(arr,t1);
        if(y0>=0&&y1>=0)push(t0,t1);
        else if(y0>0||y1>0){
          var tt=(t1*y1-t0*y0)/(y1-y0);
          if(y0<0)push(tt,t1);
          else push(t0,tt);
        }
      }
    }
  }
  solve(0,1,0);
  if(rec)console.log(rec);
  return outs;
}


function bezierErase(bezier,x,y,r){
  var outs=[];
  var ta=[1,-3,3,-1];
  var tb=[0,1,-2,1];
  var tc=[0,0,1,-1];
  var td=[0,0,0,1];

  var last=null;
  function push(p1,p2){
    if(last&&last[last.length-1]==p1){
      last.push(p2);
    }else{
      last=[p1,p2];
      outs.push(last);
    }
  }

  for(var i=0;i<bezier.length-1;i++){
    var p1=bezier[i],p2=bezier[i+1];
    var dx=p2.x-p1.x,dy=p2.y-p1.y;
    var len=Math.sqrt(dx*dx+dy*dy);

    var xa=p1.x,xb=3*p1.x+len*p1.dx,xc=3*p2.x-len*p2.dx,xd=p2.x;
    var ya=p1.y,yb=3*p1.y+len*p1.dy,yc=3*p2.y-len*p2.dy,yd=p2.y;
    var bezx=polyAdd4(4,xa,ta,xb,tb,xc,tc,xd,td);
    var bezy=polyAdd4(4,ya,ta,yb,tb,yc,tc,yd,td);
    bezx[0]-=x;
    bezy[0]-=y;

    var r2=polyAdd(polyMult(bezx,bezx),polyMult(bezy,bezy));
    r2[0]-=r*r;

    function dAt(p,t){
      var dx=polyAssign(polyDerivate(bezx),t)
      var dy=polyAssign(polyDerivate(bezy),t)
      var r=Math.sqrt(dx*dx+dy*dy);
      p.dx=dx/r,p.dy=dy/r;
    }

    var results=solveAll(r2,10);

    for(var j=0;j<results.length;j++){
      var res=results[j];
      var a,b;
      if(res[0]==0)a=p1;
      else{
        a={x:polyAssign(bezx,res[0])+x,y:polyAssign(bezy,res[0])+y,dx:0,dy:0}
        dAt(a,res[0])
      }
      if(res[1]==1)b=p2;
      else{
        b={x:polyAssign(bezx,res[1])+x,y:polyAssign(bezy,res[1])+y,dx:0,dy:0}
        dAt(b,res[1])
      }
      push(a,b);
    }

    // var t1=polySolve(r2,0,10);
    // var tm=polySolve(r2,0.5,10);
    // var t2=polySolve(r2,1,10);

    // var mt=polySolve(polyDerivate(r2),0.5,10);

    // var f1=polyAssign(r2,0)<0;
    // var f2=polyAssign(r2,1)<0;

    // if(f1&&f2)continue;
    // if(f1){
    //   var q={x:polyAssign(bezx,tm)+x,y:polyAssign(bezy,tm)+y,dx:0,dy:0}
    //   dAt(q,tm)
    //   push(q,p2)
    // }else if(f2){
    //   var q={x:polyAssign(bezx,tm)+x,y:polyAssign(bezy,tm)+y,dx:0,dy:0}
    //   dAt(q,tm)
    //   push(p1,q)
    // }else if(0<t1&&t1<1&&0<t2&&t2<1&&t1<t2){
    //   var tm=(t1+t2)/2;
    //   if(polyAssign(r2,tm)>0){
    //     push(p1,p2);
    //     continue;
    //   }
    //   var q1={x:polyAssign(bezx,t1)+x,y:polyAssign(bezy,t1)+y,dx:0,dy:0}
    //   var q2={x:polyAssign(bezx,t2)+x,y:polyAssign(bezy,t2)+y,dx:0,dy:0}
    //   dAt(q1,t1)
    //   dAt(q2,t2)
    //   if(mt<0||1<mt)console.log(mt)
    //   push(p1,q1)
    //   push(q2,p2)
    // }else{
    //   push(p1,p2);
    // }
  }
  return outs;
}
