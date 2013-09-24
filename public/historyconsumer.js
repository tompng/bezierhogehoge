function OperationHistory(snapshots,index){
  this.snapshots=snapshots||[];
  this.index=index>=0?index:-1;
}
OperationHistory.prototype={
  snapshot:function(){
    return this.snapshots[this.index];
  },
  clone:function(){
    return new OperationHistory(this.snapshots.concat(),this.index);
  },
  consume:function (data){
    if(data.type=='revert')this.consumeRevert(data);
    else if(data.type=='save')this.consumeSave(data);
    else this.consumeData(data);
  },
  consumeRevert:function(data){
    for(var i=0;i<this.snapshots.length;i++){
      if(this.snapshots[i].id==data.dst){
        this.index=i;
        return;
      }
    }
  },
  consumeSave:function(data){
    this.snapshots=[];
    this.index=-1;
    consumeData(data);
  },
  consumeData:function(data){
    var before=this.snapshots[this.index];
    var objects={};
    if(before)for(var i in before.objects){objects[i]=before.objects[i];}
    this.snapshots[++this.index]={id:data.id,objects:objects}
    while(this.snapshots.length>this.index+1)this.snapshots.pop();
    for(var i=0;i<data.operations.length;i++){
      var op=data.operations[i];
      if(op.src&&!objects[op.src])continue;
      switch(op.type){
        case 'move':{
          var obj=objects[op.src];
          var obj2=[];
          for(var j=0;j<obj.length;j++){
            var p=obj[j];
            obj2[j]={
              x:p.x+op.dx,y:p.y+op.dy,
              dx:p.dx,dy:p.dy,
              ln:p.ln,lp:p.lp
            };
          }
          delete objects[op.src];
          objects[op.dst]=obj2;
        }break;
        case 'split':{
          var obj=objects[op.src];
          delete objects[op.src];
          for(var id in op.dst){
            var range=op.dst[id];
            objects[id]=bezierSplit(obj,range[0],range[1]);
          }
        }break;
        case 'new':{
          objects[op.id]=op.data;
        }break;
      }
    }
  }
}
