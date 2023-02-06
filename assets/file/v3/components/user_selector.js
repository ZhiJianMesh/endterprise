//一边输入帐号，一边过滤用户的组件
export default {
data() {return {accOptions:[]}},//选择项，调用search获得
props: {
    accounts:{type:Array,required:true}, //复杂对象，可以直接在组件中修改
    label:{type:String,required:true},
    multi:{type:Boolean,required:false,default:true},
    useid:{type:Boolean,required:false,default:false}
},
methods:{
search_users(val,update) {
  if(val==='') {
    update(() => {
      this.accOptions=[]
    })
    return;
  }
  update(() => {
    var opts={method:"GET",url:"/api/user/search?limit=10&s="+val};
    request(opts, SERVICE_USER).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.accOptions=[]
            return;
        }

        var opts=[];
        var user, val;
        var cols=resp.data.cols;
        for(var u of resp.data.users) {
            user={};
            for(var i in cols) {
                user[cols[i]]=u[i];
            }
            val=this.useid ? user.id : user.account;
            opts.push({value:val, label:user.account+' '+user.nickName});
        }
        this.accOptions=opts;
    })
  })
},
input_user(val, done) {
  if (val.length > 0) {
     done(val, 'add-unique')
  }
}
},
template: `
<q-select v-model="accounts" :label="label" :options="accOptions"
  use-input :multiple="multi" use-chips emit-value="!useid"
  hide-dropdown-icon input-debounce=200 dense
  @new-value="input_user" @filter="search_users">
 <template v-slot:selected-item="scope">
  <q-chip removable dense @remove="scope.removeAtIndex(scope.index)"
    :tabindex="scope.tabindex" class="q-ma-none">
    {{scope.opt.label}}
  </q-chip>
 </template>
</q-select>
`
}