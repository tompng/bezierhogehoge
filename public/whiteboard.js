function WBZController($el){
  var canvas=$el.get(0);
  this.$el=$el;
  this.canvas=canvas;
  W=canvas.width=$el.width();
  H=canvas.height=$el.height();
  var g=canvas.getContext('2d');
  var bezierD=2;

  var buffer=new MergeBuffer();
  buffer.listener=null;

  var ws;

  $el.multitouch(function(touch){
    new Tool(touch);
  },render);
  render();



  var delayBuffer=[]
  function delay(data){
    delayBuffer.push(data);
    setTimeout(function(){
      buffer.push(delayBuffer.shift());
    },5000*Math.random());
  }

  $(function(){
    ws=io.connect(location.href);
    ws.on('init',function(data){
      for(var i=0;i<data.buffer.length;i++)buffer.pushMerged(data.buffer[i]);
      buffer.pushMerged({type:'revert',dst:data.buffer[data.index].id})
      buffer.listener=render;
      render();
    })
    ws.on('data',function(data){
      //delay(data);
      buffer.push(data)
    });
  })

  function undo(){
    var dst=buffer.working.history.snapshots[buffer.working.history.index-1];
    if(dst)post({id:genID(),type:'revert',dst:dst.id});
  }
  function redo(){
    var dst=buffer.working.history.snapshots[buffer.working.history.index+1];
    if(dst)post({id:genID(),type:'revert',dst:dst.id});
  }
  function save(){
    post({id:genID(),type:'save',operations:buffer.saveOperations()});
  }


  function post(data){
    if(!data)data=buffer.drainWorking();
    else buffer.pushUnmerged(data);
    if(data)ws.emit('data',data);
  }
  function push(data){
    buffer.pushWorking(data);
  }

  function add(obj){
    for(var i=0;i<obj.length;i++){
      var p=obj[i];
      p.x=(p.x*100|0)/100
      p.y=(p.y*100|0)/100
      p.dx=(p.dx*100|0)/100
      p.dy=(p.dy*100|0)/100
      if(p.lp)p.lp=(p.lp*100|0)/100
      if(p.ln)p.ln=(p.ln*100|0)/100
    }
    var data={id:genID(),operations:[{type:'new',id:genID(),data:obj}]};
    post(data);
  }

  function DrawTool(touch){
    touch.move=function(){}
    touch.update=function(point){
      renderLine(touch.points);
      if(dotFlag)renderDot(touch.points);
    }
    touch.end=function(){
      add(BezierConverter.convert(this.points,bezierD));
    }
  }

  function MoveTool(touch){
    var r=32;
    var mids=[];
    var x=touch.x;
    var y=touch.y;
    var objects=buffer.objects();
    for(var id in objects){
      var obj=objects[id];
      if(obj&&bezierIntersect(obj,x,y,r))mids.push(id);
    }
    touch.move=function(point){
      var dx=point.x-x;
      var dy=point.y-y;
      x=point.x;y=point.y;
      var operations=[];
      var objects=buffer.objects();
      for(var i=0;i<mids.length;i++){
        var src=mids[i];
        if(!objects[src])continue;
        var dst=genID();
        operations.push({type:'move',src:src,dst:dst,dx:dx,dy:dy});
        mids[i]=dst;
      }
      if(operations.length)push({id:genID(),operations:operations});
    }
    touch.update=function(point){
      g.globalAlpha=0.1;
      g.beginPath();
      g.arc(point.x,point.y,r,0,2*Math.PI,true);
      g.stroke();
      g.globalAlpha=1;
    }
    touch.end=function(){
      post();
    }
  }

  function EraseTool(touch){
    var R=32;
    function bezierErase(bez,x,y,dx,dy){
      var carr=bezierEraseWith(bez,new CircleEraser(x,y,R));
      if(!dx&&!dy)return carr;
      var rarr=bezierEraseWith(bez,new RectEraser(x,y,dx,dy,2*R));
      if(!carr||!rarr)return carr||rarr;
      var arr=[];
      var last=null;
      var ci=0,ri=0;
      while(ci<carr.length||ri<rarr.length){
        var crange=carr[ci],rrange=rarr[ri];
        var xrange;
        if(crange&&rrange){
          if(crange[0]<rrange[0]){xrange=crange;ci++;}
          else{xrange=rrange;ri++;}
        }else{
          if(crange)ci++;
          else ri++;
          xrange=crange||rrange;
        }
        if(!last){
          last=xrange;
        }else{
          if(last[1]<=xrange[1]){
            if(xrange[0]<last[1])arr.push([xrange[0],last[1]]);
            last=xrange;
          }else{
            arr.push(xrange);
          }
        }
      }
      return arr;
    }
    function erase(x,y,dx,dy){
      var operations=[];
      var objects=buffer.objects();
      for(var id in objects){
        var bezier=objects[id];
        if(!bezier)continue;
        var lefts=bezierErase(bezier,x,y,dx,dy);
        if(!lefts)continue;
        var dst={};
        for(var i=0;i<lefts.length;i++)dst[genID()]=lefts[i];
        operations.push({type:'split',src:id,dst:dst})
      }
      if(operations.length)push({id:genID(),operations:operations});
    }
    erase(touch.x,touch.y);
    touch.move=function(point){
      var prev=touch.points[touch.points.length-2];
      erase(point.x,point.y,prev.x-point.x,prev.y-point.y);
    }
    touch.update=function(point){
      g.globalAlpha=0.1;
      g.beginPath();
      g.arc(point.x,point.y,R,0,2*Math.PI,true);
      g.stroke();
      g.globalAlpha=1;
    }
    touch.end=function(){
      post();
    }
  }
  var Tool=DrawTool;
  var dotFlag=false;

  function render(){
    g.clearRect(0,0,W,H);
    g.fillStyle="cyan"
    g.strokeStyle='black'
    g.lineJoin="round"
    g.lineWidth=2
    g.lineCap='round'
    var objects=buffer.objects();
    for(var id in objects){
      var obj=objects[id];
      if(!obj)continue;
      renderLine(obj);
      if(dotFlag)renderDot(obj);
    }
  }

  function renderDot(points){
    g.beginPath();
    for(var i=0;i<points.length;i++){
      var p=points[i];
      g.moveTo(p.x,p.y);
      g.arc(p.x,p.y,2,0,2*Math.PI,true);
    }
    g.fill();
  }
  function renderLine(line){
    var p=line[0];
    g.beginPath();
    g.moveTo(p.x,p.y);
    for(var i=1;i<line.length;i++){
      var p=line[i-1]
      var q=line[i];
      var ax=p.dx*p.ln||0,ay=p.dy*p.ln||0;
      var bx=q.dx*q.lp||0,by=q.dy*q.lp||0;

      g.bezierCurveTo(p.x+ax,p.y+ay,q.x-bx,q.y-by,q.x,q.y);
    }
    g.stroke();
  }
  function set(mode){
    switch(mode){
      case 'draw':Tool=DrawTool;break;
      case 'move':Tool=MoveTool;break;
      case 'erase':Tool=EraseTool;break;
    }
    $('#tools').attr('class',mode);render();
  }
  this.setMode=set;
  this.save=save;
  this.undo=undo;
  this.redo=redo;
}

$.fn.wbzShare=function(){
  $(this).data('controller',new WBZController($(this)));
}
$.fn.wbzShareSave=function(){$(this).data('controller').save();}
$.fn.wbzShareUndo=function(){$(this).data('controller').undo();}
$.fn.wbzShareRedo=function(){$(this).data('controller').redo();}
$.fn.wbzShareSetMode=function(mode){$(this).data('controller').setMode(mode);}
