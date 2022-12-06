//一边输入地址，一边过滤地址的组件
export default {
data() {return {
    addrOpts:[],
    addrs:[]
}},//选择项，调用search获得
props: {
    modelValue:{type:Object},
    label:{type:String,required:true}
},
emits: ['update:modelValue'],
methods:{
search_addrs(val,update) {
  if(val==='') {
    update(() => {
      this.addrOpts=[]
    })
    return;
  }
  update(() => {
    var opts={method:"GET",url:"/api/search?limit=10&s="+val,private:false};
    request(opts, "address").then(resp=>{
        if(resp.code!=0) {
            this.addrOpts=[]
            return;
        }
        var opts=[];
        var al=resp.data.addrs;
        for(var i in al) {
            opts.push({value:i,label:al[i].fName+'('+al[i].zip+')'});
        }
        this.addrs=al;
        this.addrOpts=opts;
    })
  })
},
input_addr(val, done) {
  if (val.length > 0) {
     done(val, 'add-unique')
  }
}
},
computed: {
value: {
  get() {
    var m=this.modelValue;
    if(!m.province) {
        return null;
    }
    return m.province+' '+m.city+' '+m.county;
  },
  set(v) {
    if(!v) {
        this.$emit('update:modelValue', {province:'',city:'',county:'',code:''});
    } else {
        var a=this.addrs[v];
        var ss=a.fName.split(' ');
        var addr={code:a.code,province:'',city:'',county:''}
        if(ss.length>0) {
            addr['province']=ss[0];
        }
        if(ss.length>1) {
            addr['city']=ss[1];
        }
        if(ss.length>2) {
            addr['county']=ss[2];
        }
        this.$emit('update:modelValue', addr);
    }
  }
}
},
template: `<q-select :label="label" :options="addrOpts" v-model="value"
  use-input use-chips emit-value
  hide-dropdown-icon input-debounce=200 dense
  @new-value="input_addr" @filter="search_addrs"></q-select>`
}