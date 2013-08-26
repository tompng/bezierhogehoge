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
  var D=Math.pow(0.1,level);
  var rec=0;
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
    return [y0,y1,Math.abs(sumdif/sumc1)];
  }
  var outs=[];
  var last=[];
  function push(t0,t1){
    if(last[1]==t0)last[1]=t1;
    else outs.push(last=[t0,t1]);
  }
  function solve(t0,t1){
    rec++;
    var c=comp(t0,t1);
    if(c==1){
      push(t0,t1);
    }else if(c!=-1){
      var y0=c[0],y1=c[1],dt=c[2];
      if(t1-t0>D){
        if(y0*y1<0){
          var tt=(t0*y1-t1*y0)/(y1-y0);
          var s0=Math.max(tt-dt,t0);
          var s1=Math.min(tt+dt,t1);
          if(s0!=t0&&y0>0)push(t0,s0);
          if(2*(s1-s0)<t1-t0){
            solve(s0,s1);
          }else{
            var sm=(s0+s1)/2;
            solve(s0,sm);
            solve(sm,s1);
          }
          if(s1!=t1&&y1>0)push(s1,t1);
        }else{
          var tm=(t0+t1)/2;
          solve(t0,tm);
          solve(tm,t1);
        }
      }else{
        if(y0>=0&&y1>=0)push(t0,t1);
        else if(y0>0||y1>0){
          var tt=(t1*y1-t0*y0)/(y1-y0);
          if(y0<0)push(tt,t1);
          else push(t0,tt);
        }
      }
    }
  }
  solve(0,1);
  if(rec>10)console.log(rec);
  return outs;
}


function bezierErase(bezier,x,y,r){
  var outs=[];
  var ta=[1,0,-3,2];
  var tb=[0,3,-6,3];
  var tc=[0,0,3,-3];
  var td=[0,0,3,-2];

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

    var xa=p1.x,xb=p1.ln*p1.dx,xc=-p2.lp*p2.dx,xd=p2.x;
    var ya=p1.y,yb=p1.ln*p1.dy,yc=-p2.lp*p2.dy,yd=p2.y;
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
      return r;
    }

    var results=solveAll(r2,10);

    for(var j=0;j<results.length;j++){
      var res=results[j];
      var a,b;
      var t=res[1]-res[0];
      if(res[0]==0)a=p1;
      else{
        a={x:polyAssign(bezx,res[0])+x,y:polyAssign(bezy,res[0])+y,dx:0,dy:0}
        al=dAt(a,res[0]);
        a.ln=al/3;
      }
      if(res[1]==1)b=p2;
      else{
        b={x:polyAssign(bezx,res[1])+x,y:polyAssign(bezy,res[1])+y,dx:0,dy:0}
        bl=dAt(b,res[1]);
        b.lp=bl/3;
      }
      a.ln*=t;
      b.lp*=t;
      push(a,b);
    }
  }
  return outs;
}


function solveRect(a1,a2,level){
  var rec=0;
  function rcomp(a,t0,t1){
    var min=0,max=0;
    var sumdif=0,sumc0=a[0],sumc1=a[1];
    var t0n=t0,t1n=t1;
    for(var n=2;n<a.length;n++){
      t0n*=t0;t1n*=t1;
      var c1=(t1n-t0n)/(t1-t0);
      var cmin=c1*Math.pow(c1/n,1/(n-1))*(1/n-1);
      var cmax=t0n-t0*c1;
      sumc0+=a[n]*(cmax+cmin)/2;
      sumc1+=a[n]*c1;
      sumdif+=Math.abs(a[n]*(cmax-cmin)/2);
    }
    var y0=sumc0+sumc1*t0;
    var y1=sumc0+sumc1*t1;
    var ymin=Math.min(y0,y1);
    var ymax=Math.max(y0,y1);
    if(-1+sumdif<ymin&&ymax<1-sumdif)return -1;
    if(ymax<-1-sumdif||1+sumdif<ymin)return 1;
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
    var c1=rcomp(a1,t0,t1);
    var c2=rcomp(a2,t0,t1);
    var c=c1==1||c2==1?1:c1==-1&&c2==-1?-1:0;
    if(c>0){
      push(t0,t1);
    }else if(c==0){
      if(i<level){
        var tm=(t0+t1)/2;
        solve(t0,tm,i+1);
        solve(tm,t1,i+1);
      }else{
        return;
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
  if(rec>10)console.log(rec);
  return outs;
}

function bezierEraseRect(bezier,x,y,rx,ry,width){
  var outs=[];
  var ta=[1,0,-3,2];
  var tb=[0,3,-6,3];
  var tc=[0,0,3,-3];
  var td=[0,0,3,-2];

  var length=Math.sqrt(rx*rx+ry*ry);
  rx/=length;
  ry/=length;

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

    var xa=p1.x,xb=p1.ln*p1.dx,xc=-p2.lp*p2.dx,xd=p2.x;
    var ya=p1.y,yb=p1.ln*p1.dy,yc=-p2.lp*p2.dy,yd=p2.y;
    var bezx=polyAdd4(4,xa,ta,xb,tb,xc,tc,xd,td);
    var bezy=polyAdd4(4,ya,ta,yb,tb,yc,tc,yd,td);
    bezx[0]-=x+rx*length/2;
    bezy[0]-=y+ry*length/2;

    
    var rl=polyAdd(polyScale(2*rx/length,bezx),polyScale(2*ry/length,bezy));
    var rw=polyAdd(polyScale(2*ry/width,bezx),polyScale(-2*rx/width,bezy));

    function dAt(p,t){
      var dx=polyAssign(polyDerivate(bezx),t)
      var dy=polyAssign(polyDerivate(bezy),t)
      var r=Math.sqrt(dx*dx+dy*dy);
      p.dx=dx/r,p.dy=dy/r;
      return r;
    }

    var results=solveRect(rw,rl,10);
    for(var j=0;j<results.length;j++){
      var res=results[j];
      var a,b;
      var t=res[1]-res[0];
      if(res[0]==0)a=p1;
      else{
        a={x:polyAssign(bezx,res[0])+x+rx*length/2,y:polyAssign(bezy,res[0])+y+ry*length/2,dx:0,dy:0}
        al=dAt(a,res[0]);
        a.ln=al/3;
      }
      if(res[1]==1)b=p2;
      else{
        b={x:polyAssign(bezx,res[1])+x+rx*length/2,y:polyAssign(bezy,res[1])+y+ry*length/2,dx:0,dy:0}
        bl=dAt(b,res[1]);
        b.lp=bl/3;
      }
      a.ln*=t;
      b.lp*=t;
      push(a,b);
    }
  }
  return outs;
}

function bezierIntersect(bezier,x,y,r){
  var ta=[1,0,-3,2];
  var tb=[0,3,-6,3];
  var tc=[0,0,3,-3];
  var td=[0,0,3,-2];

  for(var i=0;i<bezier.length-1;i++){
    var p1=bezier[i],p2=bezier[i+1];

    var xa=p1.x,xb=p1.ln*p1.dx,xc=-p2.lp*p2.dx,xd=p2.x;
    var ya=p1.y,yb=p1.ln*p1.dy,yc=-p2.lp*p2.dy,yd=p2.y;
    var bezx=polyAdd4(4,xa,ta,xb,tb,xc,tc,xd,td);
    var bezy=polyAdd4(4,ya,ta,yb,tb,yc,tc,yd,td);
    bezx[0]-=x;
    bezy[0]-=y;

    var r2=polyAdd(polyMult(bezx,bezx),polyMult(bezy,bezy));
    r2[0]-=r*r;

    var results=solveAll(r2,10);
    if(results.length!=1||results[0][0]!=0||results[0][1]!=1)return true;
  }
  return false;
}
