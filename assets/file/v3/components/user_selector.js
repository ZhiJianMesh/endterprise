//一边输入帐号，一边过滤用户的组件
export default {
data() {return {
    accOptions:[],//选择项，调用search获得
    values:null //选中项，不能赋值[]，会显示一个空选项
}},
props: {
    accounts:{type:Array,required:true}, //复杂对象，可以直接在组件中修改
    label:{type:String,required:true},
    multi:{type:Boolean,required:false,default:true}, //:multi="false"
    service:{type:String,required:false,default:''}, //不为空时，只查服务授权过的用户
    roles:{type:Array,required:false,default:[]}, //不为空时，只返回指定角色，需service配合
    useid:{type:Boolean,required:false,default:false} //是否返回用户ID,:useid="true"
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
    var url;
    if(this.service=='') {
      url="/api/user/search?limit=10&s="+val;
    } else {
      url="/api/power/search?limit=10&service="+this.service+"&s="+val;
    }
    request({method:"GET",url:url}, SERVICE_USER).then(resp => {
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
            if(user.role) {
                if(this.roles.length>0&&!this.roles.includes(user.role)) {
                    continue;//未包括此角色
                }
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
},
changed() {
    //因为无label，用emit-value会导致selected-item无法显示
    //所以接受改变的事件，将选中项的value存入accounts属性
    //因为accounts是数组，所以此属性可以更改，尽管不优雅，但是管用，不必$emit
    this.accounts.splice(0, this.accounts.length)
    if(this.multi) {
        for(var c of this.values) {
            this.accounts.push(c.value);
        }
    } else if(this.values){ //单选时，values不是数组
        this.accounts.push(this.values.value);
    }
}
},
template: `
<q-select v-model="values" :label="label" :options="accOptions"
  use-input use-chips :multiple="multi"
  hide-dropdown-icon input-debounce=200 dense
  @new-value="input_user" @filter="search_users"
  @update:model-value="changed">
 <template v-slot:selected-item="scope">
  <q-chip removable dense @remove="scope.removeAtIndex(scope.index)"
    :tabindex="scope.tabindex" class="q-ma-none">
    {{scope.opt.label}}
  </q-chip>
 </template>
</q-select>
`
}