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

function polyApprox(arr,t0,t1){
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
  return [sumc0,sumc1,sumdif]
}

function RangeList(){
  this.array=[];
  this.last=[];
}
RangeList.prototype.push=function(t0,t1){
  if(this.last[1]==t0){
    this.last[1]=t1;
  }else{
    this.array.push(this.last=[t0,t1]);
  }
}

function solveAll(arr,level){
  var D=Math.pow(0.1,level);
  var rec=0;
  function comp(t0,t1){
    var tmp=polyApprox(arr,t0,t1);
    var c0=tmp[0],c1=tmp[1],dif=tmp[2];
    var y0=c0+c1*t0;
    var y1=c0+c1*t1;
    var ymin=Math.min(y0,y1);
    var ymax=Math.max(y0,y1);
    if(ymin>dif)return 1;
    if(ymax<-dif)return -1;
    return [y0,y1,Math.abs(dif/c1)];
  }

  var range=new RangeList();

  function solve(t0,t1){
    rec++;
    var c=comp(t0,t1);
    if(c==1){
      range.push(t0,t1);
    }else if(c!=-1){
      var y0=c[0],y1=c[1],dt=c[2];
      if(t1-t0>D){
        if(y0*y1<0){
          var tt=(t0*y1-t1*y0)/(y1-y0);
          var s0=Math.max(tt-dt,t0);
          var s1=Math.min(tt+dt,t1);
          if(s0!=t0&&y0>0)range.push(t0,s0);
          if(2*(s1-s0)<t1-t0){
            solve(s0,s1);
          }else{
            var sm=(s0+s1)/2;
            solve(s0,sm);
            solve(sm,s1);
          }
          if(s1!=t1&&y1>0)range.push(s1,t1);
        }else{
          var tm=(t0+t1)/2;
          solve(t0,tm);
          solve(tm,t1);
        }
      }else{
        if(y0>=0&&y1>=0)range.push(t0,t1);
        else if(y0>0||y1>0){
          var tt=(t1*y1-t0*y0)/(y1-y0);
          if(y0<0)range.push(tt,t1);
          else range.push(t0,tt);
        }
      }
    }
  }
  solve(0,1);
  if(rec>10)console.log('b'+rec);
  return range.array;
}

function bezierSplit(bezier,start,end){
  var ta=[1,0,-3,2];
  var tb=[0,3,-6,3];
  var tc=[0,0,3,-3];
  var td=[0,0,3,-2];

  var outs=[];
  var last=null;

  var range=new RangeList();
  var istart=Math.ceil(start);
  var iend=Math.floor(end);
  var tstart=start+1-istart;
  var tend=end-iend;
  function dAt(p,p1,p2,t){
    var xa=p1.x,xb=p1.ln*p1.dx,xc=-p2.lp*p2.dx,xd=p2.x;
    var ya=p1.y,yb=p1.ln*p1.dy,yc=-p2.lp*p2.dy,yd=p2.y;
    var bezx=polyAdd4(4,xa,ta,xb,tb,xc,tc,xd,td);
    var bezy=polyAdd4(4,ya,ta,yb,tb,yc,tc,yd,td);
    p.x=polyAssign(bezx,t);
    p.y=polyAssign(bezy,t);
    var dx=polyAssign(polyDerivate(bezx),t)
    var dy=polyAssign(polyDerivate(bezy),t)
    var dr=Math.sqrt(dx*dx+dy*dy);
    p.dx=dx/dr;
    p.dy=dy/dr;
    return dr;
  }

  if(iend<istart){
    var t=tend-tstart;
    var p1=bezier[iend],p2=bezier[istart];
    var q1={},q2={}
    var dr1=dAt(q1,p1,p2,tstart);
    var dr2=dAt(q2,p1,p2,tend);
    q1.ln=dr1*t/3;
    q2.lp=dr2*t/3;
    return [q1,q2];
  }
  var out=[];
  var prev;
  if(tstart<1){
    var t=1-tstart;
    var p1=bezier[istart-1],p2=bezier[istart];
    var q={};
    var dr=dAt(q,p1,p2,tstart);
    q.ln=dr*t/3;
    out.push(q);
    prev={x:p2.x,y:p2.y,dx:p2.dx,dy:p2.dy,lp:p2.lp*t};
  }else{
    var p=bezier[istart];
    prev={x:p.x,y:p.y,dx:p.dx,dy:p.dy};
  }
  out.push(prev);
  for(var i=istart;i<iend;i++){
    var p1=bezier[i];
    var p2=bezier[i+1];
    prev.ln=p1.ln;
    prev={x:p2.x,y:p2.y,dx:p2.dx,dy:p2.dy,lp:p2.lp};
    out.push(prev);
  }
  if(0<tend){
    var t=tend;
    var p1=bezier[iend],p2=bezier[iend+1];
    var q={};
    var dr=dAt(q,p1,p2,tend);
    q.lp=dr*t/3;
    prev.ln=p1.ln*t;
    out.push(q);
  }
  return out;
}

function bezierEraseWith(bezier, eraser){

  var ta=[1,0,-3,2];
  var tb=[0,3,-6,3];
  var tc=[0,0,3,-3];
  var td=[0,0,3,-2];

  var range=new RangeList();

  for(var i=0;i<bezier.length-1;i++){
    var p1=bezier[i],p2=bezier[i+1];
    var dx=p2.x-p1.x,dy=p2.y-p1.y;

    var xa=p1.x,xb=p1.ln*p1.dx,xc=-p2.lp*p2.dx,xd=p2.x;
    var ya=p1.y,yb=p1.ln*p1.dy,yc=-p2.lp*p2.dy,yd=p2.y;
    var bezx=polyAdd4(4,xa,ta,xb,tb,xc,tc,xd,td);
    var bezy=polyAdd4(4,ya,ta,yb,tb,yc,tc,yd,td);

    var results=eraser.erase(bezx,bezy);
    for(var j=0;j<results.length;j++){
      range.push(i+results[j][0],i+results[j][1])
    }
  }
  if(range.array[0]&&range.array[0][0]==0&&range.array[0][1]==bezier.length-1){
    return null;
  }
  return range.array;
}

function CircleEraser(x,y,r){
  this.erase=function(bezx,bezy){
    var bezx0=bezx[0],bezy0=bezy[0];
    bezx[0]-=x;bezy[0]-=y;
    var r2=polyAdd(polyMult(bezx,bezx),polyMult(bezy,bezy));
    r2[0]-=r*r;
    bezx[0]=bezx0;bezy[0]=bezy0;
    return solveAll(r2,5);
  }
}

function solveRect(a1,a2,level){
  var rec=0;
  function rcomp(a,t0,t1){
    var tmp=polyApprox(a,t0,t1);
    var c0=tmp[0],c1=tmp[1],dif=tmp[2];
    var y0=c0+c1*t0;
    var y1=c0+c1*t1;
    var ymin=Math.min(y0,y1);
    var ymax=Math.max(y0,y1);
    if(-1+dif<ymin&&ymax<1-dif)return -1;
    if(ymax<-1-dif||1+dif<ymin)return 1;
    return 0;
  }
  var range=new RangeList();
  function solve(t0,t1,i){
    rec++;
    var c1=rcomp(a1,t0,t1);
    var c2=rcomp(a2,t0,t1);
    var c=c1==1||c2==1?1:c1==-1&&c2==-1?-1:0;
    if(c>0){
      range.push(t0,t1);
    }else if(c==0){
      if(i<level){
        var tm=(t0+t1)/2;
        solve(t0,tm,i+1);
        solve(tm,t1,i+1);
      }else{
        return;
        var y0=polyAssign(arr,t0);
        var y1=polyAssign(arr,t1);
        if(y0>=0&&y1>=0)range.push(t0,t1);
        else if(y0>0||y1>0){
          var tt=(t1*y1-t0*y0)/(y1-y0);
          if(y0<0)range.push(tt,t1);
          else range.push(t0,tt);
        }
      }
    }
  }
  solve(0,1,0);
  if(rec>10)console.log('a'+rec);
  return range.array;
}


function RectEraser(x,y,rx,ry,width){
  var length=Math.sqrt(rx*rx+ry*ry);
  var cx=x+rx/2,cy=y+ry/2;
  rx/=length;ry/=length;

  this.erase=function(bezx,bezy){
    var bezx0=bezx[0],bezy0=bezy[0];
    bezx[0]-=cx;bezy[0]-=cy;
    var rl=polyAdd(polyScale(2*rx/length,bezx),polyScale(2*ry/length,bezy));
    var rw=polyAdd(polyScale(2*ry/width,bezx),polyScale(-2*rx/width,bezy));
    bezx[0]=bezx0;bezy[0]=bezy0;
    return solveRect(rw,rl,10);
  }
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

    var results=solveAll(r2,5);
    if(results.length!=1||results[0][0]!=0||results[0][1]!=1)return true;
  }
  return false;
}
