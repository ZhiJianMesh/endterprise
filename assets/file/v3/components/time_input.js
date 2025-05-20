import ScrollSelect from "./scroll_select.js"
//时间选择组件
export default{
components:{
    "scroll-select":ScrollSelect
},
data(){return {
    val:{h:0,m:0,s:0},
    old:{h:0,m:0,s:0},
    style:{cursor:'pointer',width:'12em'},
    hours:Array.from({length:24}, (_, i) => i>9?i:'0'+i),
    ms:Array.from({length:60}, (_, i) => i>9?i:'0'+i) //分&秒
}},
props: {
    modelValue:{type:Object},
    showSecond:{type:Boolean, default:true}
},
emits: ['update:modelValue'],
created(){
    if(!this.showSecond){
        this.style.width='9em';
    }
    if(this.modelValue) {
        this.val=this.parse(this.modelValue);
    } else {
        var dt=new Date();
        this.val={h:dt.getHours(),m:dt.getMinutes(),s:dt.getSeconds()};
        var dtl={hour:this.val.h, minute:this.val.m, second:this.val.s};
        this.$emit('update:modelValue',{value:this.value,details:dtl});
    }
    var v=this.val;
    this.old={h:v.h, m:v.m, s:v.s};
},
methods:{
parse(t) {
    if((typeof t) === 'string') {
        var ss=t.split(':');
        var hour=parseInt(ss[0]);
        var minute=parseInt(ss[1]);
        var second=ss.length>2?parseInt(ss[2]):0;
        return {h:hour,m:minute,s:second};
    }
    var d=t.details;
    return {h:d.hour, m:d.minute, s:d.second};
},
confirm() {
    var v=this.val;
    this.old={h:v.h,m:v.m,s:v.s};
    var dtl={hour:v.h, minute:v.m, second:v.s};
    this.$emit('update:modelValue',{value:this.value,details:dtl});
    this.$refs._tm_ipt_dlg.hide();
}
},
computed: {
   value: {
      get() {
        var v=this.old;
        var i=parseInt(v.h);
        var s=(i<10?'0'+i:i)+':'
        i=parseInt(v.m);
        s += (i<10?'0'+i:i);
        if(this.showSecond){
            i=parseInt(v.s);
            s+=':'+(i<10?'0'+i:i);
        }
        return s;
      }
   }
},
template: `
<div :style="style" :class="$attrs.class">{{value}}
 <q-popup-proxy cover ref="_tm_ipt_dlg" @hide="confirm">
  <q-card><q-card-section>
  <div class="row">
   <div class="col">
    <scroll-select v-model="val.h" :options="hours" width="3em" class="q-px-sm q-py-none"></scroll-select>
   </div>
   <div class="col">
    <scroll-select v-model="val.m" :options="ms" width="3em" class="q-px-sm q-py-none"></scroll-select>
   </div>
   <div class="col" v-if="showSecond">
    <scroll-select v-model="val.s" :options="ms" width="3em" class="q-px-sm q-py-none"></scroll-select>
   </div>
  </div>
  </q-card-section></q-card>
 </q-popup-proxy>
</div>`
}