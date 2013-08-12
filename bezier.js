BezierConverter={}
BezierConverter.BSearch=function(min,max){
  if(min==undefined)min=0;
  if(max==undefined)max=Infinity;
  this.index=min;
  this.ok=min-1;
  this.ng=null;
  this.result=function(result){
    if(result)this.ok=this.index;
    else this.ng=this.index;
    if(this.ng){
      if(this.ok+1==this.ng)return this.ok;
      this.index=Math.floor((this.ok+this.ng)/2);
    }else{
      if(this.ok==max)return this.ok;
      this.index=2*(this.index-min)+1+min;
      if(max!=undefined&&this.index>max)this.index=max;
    }
    return null;
  }
}

BezierConverter.smooth=function(line,r){
  var out=[];
  var N=line.length;
  for(var i=0;i<N;i++)out[i]={x:line[i].x,y:line[i].y}
  if(N<4)return out;
  for(var n=0;n<10;n++){
    for(var i=1;i<N-1;i++){
      var p=line[i],o=out[i];
      var x,y;
      if(i==1){
        x=(3*out[2].x+out[0].x-out[3].x)/3
        y=(3*out[2].y+out[0].y-out[3].y)/3
      }else if(i==N-2){
        x=(3*out[N-3].x+out[N-1].x-out[N-4].x)/3
        y=(3*out[N-3].y+out[N-1].y-out[N-4].y)/3
      }else{
        var x1=(out[i-1].x+out[i+1].x)/2;
        var y1=(out[i-1].y+out[i+1].y)/2;
        var x2=(out[i-2].x+out[i+2].x)/2;
        var y2=(out[i-2].y+out[i+2].y)/2;
        x=(x1*4-x2)/3;
        y=(y1*4-y2)/3;
      }
      var dx=x-p.x;
      var dy=y-p.y;
      var r2=dx*dx+dy*dy;
      if(r2>r*r){
        var dr=Math.sqrt(r2);
        dx*=r/dr;dy*=r/dr;
      }
      o.x=p.x+dx;
      o.y=p.y+dy;
    }
  }
  return out;
}

BezierConverter.grad=function(line){
  var out=[];
  for(var i=0;i<line.length;i++){p=line[i];out[i]={x:p.x,y:p.y,i:i};}
  for(var i=1;i<out.length-1;i++){
    out[i].dx=(out[i+1].x-out[i-1].x)/2;
    out[i].dy=(out[i+1].y-out[i-1].y)/2;
  }
  var n=out.length;
  if(n==1){
    out[0].dx=out[0].dy=0;
  }else if(n==2){
    out[0].dx=out[1].dx=out[1].x-out[0].x;
    out[0].dy=out[1].dy=out[1].y-out[0].y;
  }else{
    // out[0].dx=(4*out[1].x-3*out[0].x-out[2].x)/2;
    // out[0].dy=(4*out[1].y-3*out[0].y-out[2].y)/2;
    // out[n-1].dx=(3*out[n-1].x+out[n-3].x-4*out[n-2].x)/2;
    // out[n-1].dy=(3*out[n-1].y+out[n-3].y-4*out[n-2].y)/2;
    out[0].dx=out[1].x-out[0].x;
    out[0].dy=out[1].y-out[0].y;
    out[n-1].dx=out[n-1].x-out[n-2].x;
    out[n-1].dy=out[n-1].y-out[n-2].y;
  }
  for(var i=0;i<out.length;i++){
    var dx=out[i].dx,dy=out[i].dy;
    var dr=Math.sqrt(dx*dx+dy*dy);
    if(dr==0)dr=1;
    out[i].dx/=dr;
    out[i].dy/=dr;
  }
  return out;
}

BezierConverter.bezier=function(line,d){
  var olen=line.length;
  line=BezierConverter.grad(line);
  var out=[line[0]];
  while(line.length>1){
    var i=1;
    var p=line[0];
    var bs=new BezierConverter.BSearch(2,line.length-1);
    while(true){
      if(line.length<=2)break;
      var j=bs.index;
      var q=line[j];
      var flag=true;
      var dx=q.x-p.x,dy=q.y-p.y
      var len=Math.sqrt(dx*dx+dy*dy)
      for(var k=1;k<j;k++){
        var r=line[k];
        var dmin=1/0;
        var t=k/j;
        var xa=p.x,xb=3*p.x+len*p.dx,xc=3*q.x-len*q.dx,xd=q.x;
        var ya=p.y,yb=3*p.y+len*p.dy,yc=3*q.y-len*q.dy,yd=q.y;
        var ta=(1-t)*(1-t)*(1-t);
        var tb=(1-t)*(1-t)*t;
        var tc=(1-t)*t*t;
        var td=t*t*t;
        for(var l=0;l<4;l++){
          var dx=xa*ta+xb*tb+xc*tc+xd*td-r.x;
          var dy=ya*ta+yb*tb+yc*tc+yd*td-r.y;
          if(dx*dx+dy*dy<d*d)break;
          // minimize dx*dx+dy*dy
          // f(t)=dx*dxdt+dy*dydt=0
          // t-=f(t)/f'(t)
          // f'(t)=dxdt^2+dx*dxdtt+dydt^2+dy*dydtt
          var dxdt=-3*xa*(1-t)*(1-t)+xb*(3*t-1)*(t-1)+xc*(2-3*t)*t+3*xd*t*t;
          var dydt=-3*ya*(1-t)*(1-t)+yb*(3*t-1)*(t-1)+yc*(2-3*t)*t+3*yd*t*t;
          var dxdtt=-6*xa*(t-1)+xb*(6*t-4)+xc*(2-6*t)+6*xd*t;
          var dydtt=-6*ya*(t-1)+yb*(6*t-4)+yc*(2-6*t)+6*yd*t;
          t-=(dx*dxdt+dy*dydt)/(dxdt*dxdt+dx*dxdtt+dydt*dydt+dy*dydtt);
          if(t<0)t=0;if(t>1)t=1;
          ta=(1-t)*(1-t)*(1-t);
          tb=(1-t)*(1-t)*t;
          tc=(1-t)*t*t;
          td=t*t*t;
        }
        var dx=xa*ta+xb*tb+xc*tc+xd*td-r.x;
        var dy=ya*ta+yb*tb+yc*tc+yd*td-r.y;
        if(dx*dx+dy*dy>d*d){flag=false;break;}
      }
      i=bs.result(flag);
      if(i!=null)break;
    }
    for(var j=0;j<i;j++)line.shift();
    out.push(line[0]);
  }
  console.log(olen,out.length)
  return out;
}

BezierConverter.convert=function(line,d){
  var sline=BezierConverter.smooth(line,d*2/3);
  var bline=BezierConverter.bezier(sline,d/3);
  return bline;
}
