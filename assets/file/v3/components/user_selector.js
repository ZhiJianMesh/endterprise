//一边输入帐号，一边过滤用户的组件
export default {
data() {return {accOptions:[]}},//选择项，调用search获得
props: {
    accounts:{type:Array,required:true}, //复杂对象，可以直接在组件中修改
    label:{type:String,required:true},
    multi:{type:Boolean,required:false,default:true}
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
    var opts={method:"GET",url:"/api/search?limit=10&s="+val};
    request(opts, "user").then(function(resp){
        if(resp.code!=0) {
            this.accOptions=[]
            return;
        }
        var opts=[];
        var ul=resp.data.users;
        for(var i in ul) {
            opts.push({value:ul[i].account,label:ul[i].account+' '+ul[i].nickName});
        }
        this.accOptions=opts;
    }.bind(this))
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
  use-input :multiple="multi" use-chips emit-value
  hide-dropdown-icon input-debounce=200 dense
  @new-value="input_user" @filter="search_users"></q-select>
`
}