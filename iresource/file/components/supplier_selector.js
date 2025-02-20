//一边输入名称，一边过滤供应商的组件
export default {
data() {return {opts:[],maps:{},v:null}},
props: {
    modelValue:{type:String},
    label:{type:String,required:true}
},
emits: ['update:modelValue'],
methods:{
get_opts(val,update) {
  if(val==='') {
    update(() => {
      this.opts=[]
    })
    return;
  }
  update(() => {
    var opts={method:"GET",url:"/api/supplier/search?limit=10&s="+val};
    request(opts, "iresource").then(resp => {
        if(resp.code!=RetCode.OK) {
            this.opts=[]
            return;
        }
        var opts=[];
        var maps={};
        for(var s of resp.data.list) {
            var name=s.name+'('+s.addr+')';
            opts.push({value:s.id, label:name});
            maps[s.id]=name;
        }
        this.opts=opts;
        this.maps=maps;
    })
  })
},
input_val(val, done) {
  if (val.length > 0) {
     done(val, 'add-unique')
  }
},
changed() {
    if(!this.v)return;
    var id=this.v.value;
    this.$emit('update:modelValue', {id:id, name:this.maps[id]});
}
},
template: `
<q-select v-model="v" :label="label" :options="opts"
  use-input use-chips hide-dropdown-icon input-debounce=200 dense
  @update:model-value="changed"
  @new-value="input_val" @filter="get_opts">
 <template v-slot:selected-item="scope">
  <q-chip removable dense @remove="scope.removeAtIndex(scope.index)"
    :tabindex="scope.tabindex" class="q-ma-none">
    {{scope.opt.label}}
  </q-chip>
 </template>
</q-select>
`
}