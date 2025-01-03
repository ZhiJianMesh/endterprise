//一边输入名称，一边过滤项目的组件
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
    var opts={method:"GET",url:"/api/project/search?limit=10&s="+val};
    request(opts, "iproject").then(resp => {
        if(resp.code!=RetCode.OK) {
            this.opts=[]
            return;
        }
        var opts=[];
        var maps={};
        for(var p of resp.data.list) {
            opts.push({value:p.id, label:p.name});
            maps[p.id]=p.name;
        }
        this.opts=opts;
        this.maps=maps;
    })
  })
},
input_prj(val, done) {
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
  @new-value="input_prj" @filter="get_opts">
 <template v-slot:selected-item="scope">
  <q-chip removable dense @remove="scope.removeAtIndex(scope.index)"
    :tabindex="scope.tabindex" class="q-ma-none">
    {{scope.opt.label}}
  </q-chip>
 </template>
</q-select>
`
}