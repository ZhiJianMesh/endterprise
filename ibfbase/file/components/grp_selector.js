//一边输入名称，一边过滤群组的组件
export default {
data() {return {grpOpts:[],grp:0}},//选择项，调用search获得
props: {
    label:{type:String,required:true},
    useid:{type:Boolean,required:false,default:true} //是否返回id
},
methods:{
search_grps(val,update) {
  if(val==='') {
    update(() => {
      this.grpOpts=[]
    })
    return;
  }
  update(() => {
    var opts={method:"GET",url:"/api/grp/search?limit=10&s="+val};
    request(opts, "ihr").then(resp => {
        if(resp.code!=RetCode.OK) {
            this.grpOpts=[]
            return;
        }
        var opts=[];
        var gl=resp.data.groups;
        var val;
        for(var i in gl) {
            val=this.useid ? gl[i].id : gl[i].name;
            opts.push({value:val, label:gl[i].name});
        }
        this.grpOpts=opts;
    })
  })
},
input_grp(val, done) {
  if (val.length > 0) {
     done(val, 'add-unique')
  }
}
},
template: `
<q-select v-model="grp" :label="label" :options="grpOpts"
  use-input use-chips
  hide-dropdown-icon input-debounce=200 dense
  @new-value="input_grp" @filter="search_grps">
 <template v-slot:selected-item="scope">
  <q-chip removable dense @remove="scope.removeAtIndex(scope.index)"
    :tabindex="scope.tabindex" class="q-ma-none">
    {{scope.opt.label}}
  </q-chip>
 </template>
</q-select>
`
}