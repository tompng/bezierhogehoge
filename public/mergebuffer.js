function genID(){
  return (0x7fffffff*Math.random())|0;
}
function MergeBuffer(listener){
  this.listener=listener;
  this.merged=new OperationBuffer(false);
  this.unmerged=new OperationBuffer(true);
  this.working=new OperationBuffer(true);
}
MergeBuffer.prototype={
  pushMerged:function(data){
    this.merged.push(data);
    this.unmerged.shift(data.id)
    this.unmerged.recalc(this.merged.history.clone());
    this.working.recalc(this.unmerged.history.clone());
    this.listener();
  },
  pushUnmerged:function(data){
    this.unmerged.push(data);
    this.working.recalc(this.unmerged.history.clone());
    this.listener();
  },
  pushWorking:function(data){
    this.working.push(data);
    this.listener();
  },
  drainWorking:function(){
    var data=this.working.compact();
    if(data.operations.length==0)return null;
    this.working=new OperationBuffer(true);
    this.pushUnmerged(data);
    return data;
  },
  snapshot:function(){
    return this.working.snapshot();
  },
  objects:function(){
    var snapshot=this.snapshot();
    return snapshot&&snapshot.objects;
  },
  push:function(data){this.pushMerged(data);}
}

function OperationBuffer(cache,history){
  this.history=history||new OperationHistory;
  if(cache)this.buffer=[];
}
OperationBuffer.prototype={
  snapshot:function(){
    return this.history.snapshot();
  },
  push:function(data){
    if(this.buffer)this.buffer.push(data);
    this.history.consume(data);
  },
  shift:function(id){
    if(this.buffer&&this.buffer[0]&&this.buffer[0].id==id){
      this.buffer.shift();
      return true;
    }
    return false;
  },
  recalc:function(history){
    this.history=history;
    if(!this.buffer)return;
    for(var i=0;i<this.buffer.length;i++){
      this.history.consume(this.buffer[i]);
    }
  },
  compact:function(){
    var operations=[];
    for(var i=0;i<this.buffer.length;i++){
      var ops=this.buffer[i].operations;
      operations=operations.concat(ops);
    }
    return {id:genID(),operations:operations}
  }
}
