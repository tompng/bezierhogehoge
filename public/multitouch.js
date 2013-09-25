(function($){
  function Touch(event){
    this.x=event.offsetX;
    this.y=event.offsetY;
    this.points=[{x:this.x,y:this.y}];
  }
  Touch.prototype._move=function(event){
    var prev=this.points[this.points.length-1];
    var point={x:event.offsetX,y:event.offsetY};
    if(prev.x==point.x&&prev.y==point.y)return;
    this.points.push(point);
    if(this.move)this.move(point);
  }
  Touch.prototype._end=function(){
    var point=this.points[this.points.length-1];
    if(this.end)this.end(point);
  }
  Touch.prototype._update=function(){
    var point=this.points[this.points.length-1];
    this.update(point);
  }
  var touchObjects={};
  $.fn.multitouch=function(callback,option){
    function update(){
      if(typeof option=='function')option();
      if(option&&option.beforeupdate)option.beforeupdate();
      for(var id in touchObjects){
        touchObjects[id]._update();
      }
      if(option&&option.beforeupdate)option.afterupdate();
    }
    this.on('touchstart',function(){
      var touches=event.touches;
      for(var i=0;i<touches.length;i++){
        var id=touches[i].identifier;
        if(!touchObjects[id]){
          callback(touchObjects[id]=new Touch(event));
        }
      }
      update();
      return false;
    });
    this.on('touchmove',function(){
      var touches=event.touches;
      for(var i=0;i<touches.length;i++){
        var touch=touches[i];
        touchObjects[touch.identifier]._move(touch);
      }
      update();
      return false;
    });
    this.on('touchend',function(){
      var touches=event.touches,ids={};
      for(var i=0;i<touches.length;i++){
        ids[touches[i].identifier]=true;
      }
      for(var id in touchObjects){
        var obj = touchObjects[id];
        if(!ids[id]){
          obj._end();
          delete touchObjects[id];
        }
      }
      update();
      return false;
    });
    var touch;
    function mupdate(){
      if(typeof option=='function')option();
      if(option&&option.beforeupdate)option.beforeupdate();
      if(touch)touch._update();
      if(option&&option.beforeupdate)option.afterupdate();
    }
    function down(e){
      callback(touch=new Touch(e));
      mupdate();
    }
    function move(e){
      touch._move(e);
      mupdate();
      return false;
    }
    function up(e){
      touch._end(e);
      touch=null;
      mupdate();
      $(document).off('mousemove',move);
      $(document).off('mouseup',up);
      return false;
    }
    var _this=this;
    this.on('mousedown',function(e){
      down(e);
      $(document).on('mousemove',move);
      $(document).on('mouseup',up);
      return false;
    });
  }
})(jQuery)
