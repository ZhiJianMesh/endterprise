//一边输入地址，一边过滤地址的组件
export default {
data() {return {
    addr:{province:'',city:'',county:''},
    provinces:[],
    cities:[],
    counties:[]
}},//选择项，调用search获得
props: {
    modelValue:{type:Object},
    label:{type:String,required:true}
},
emits: ['update:modelValue'],
created(){
    this.subs(156,list=>{
        this.provinces=list;
        this.addr.province=list[0];
        this.chgProvince(list[0]);
    });
},
methods:{
subs(fid,cb) {
    var opts={method:"GET",url:"/api/sub?fid="+fid+"&offset=0&num=1000",private:false};
    request(opts, SERVICE_ADDR).then(resp=>{
        if(resp.code!=RetCode.OK) {
            cb([]);
        } else {
            var opts=[];
            for(var i in resp.data.addrs) {
                var addr=resp.data.addrs[i];
                opts.push({label:addr.name,value:addr.id,zip:addr.zip})
            }
            cb(opts);
        }
    })    
},
chgProvince(p) {
    this.subs(p.value,list=>{
        this.cities=list;
        if(list.length>0) {
            this.addr.city=list[0];
            this.chgCity(list[0]);
        } else {
            this.addr.city={};
            this.counties=[];
        }
    });
},
chgCity(c) {
    this.subs(c.value,list=>{
        this.counties=list;
        if(list.length>0) {
            this.addr.county=list[0];
        } else {
            this.addr.county={};
        }
        this.chgCounty();
    });
},
chgCounty() {
    var addr={
        code:this.addr.county.zip,
        province:this.addr.province.label,
        city:this.addr.city.label,
        county:this.addr.county.label
    }
    this.$emit('update:modelValue', addr);
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
        var addr={
            code:this.addr.county.zip,
            province:this.addr.province.name,
            city:this.addr.city.name,
            county:this.addr.county.name
        }
        this.$emit('update:modelValue', addr);
    }
  }
}
},
template: `
<div class="row justify-start items-center q-gutter-lg">
 <div>{{label}}</div>
 <div class="row justify-start">
  <q-select v-model="addr.province" :options="provinces" @update:model-value="chgProvince(addr.province)"></q-select>
  <q-select v-model="addr.city" :options="cities" @update:model-value="chgCity(addr.city)"></q-select>
  <q-select v-model="addr.county" :options="counties" @update:model-value="chgCounty()"></q-select>
 </div>
</div> 
`
}