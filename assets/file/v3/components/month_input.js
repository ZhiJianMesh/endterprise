//月份选择组件month-input
export default{
data(){return {
    maxMonth:0,
    minMonth:0,
    year:'',
    month:'',
    cls:'',
    startYear:0,
    years:[],
    months:[]
}},
props: {
    modelValue:{type:String},
    label:{type:String,required:true},
    min:{type:String,default:''}, //年份
    max:{type:String,default:''},
    color:{type:String,default:''},
    bgColor:{type:String,default:''},
    monthName:{type:String, default:"月"}
},
emits: ['update:modelValue'],
created(){
    var m=this.parse(this.max,{y:9999,m:1});
    this.maxMonth=m.y*12+m.m-1;
    m=this.parse(this.min,{y:0,m:1});
    this.minMonth=m.y*12+m.m-1;
    var dt=new Date();
    m=this.parse(this.modelValue,{y:dt.getFullYear(),m:dt.getMonth()+1})
    this.year=m.y;
    this.month=m.m;
    this.cls=this.color?'row text-'+this.color : 'row';
    if(this.bgColor) {
        this.cls+=' bg-'+this.bgColor;
    }
    this.startYear=this.year-4;
    this.set_array();
},
methods:{
set_array() {
    var v=this.startYear;
    var month;
    var list=[];
    var chked=false;
    var yMax=Math.ceil(this.maxMonth/12);
    var yMin=Math.floor(this.minMonth/12);
    for(var i=0;i<4;i++) {
        var yy=[];
        for(var j=0;j<3;j++) {
            var y={v:v,cls:"col text-center"};
            if(v>yMax||v<yMin) {
                y.cls+=" text-grey";
            } else if(v==this.year) {
                y.cls+=" bg-primary text-white";
                chked=true;
            }
            yy.push(y);
            v++;
        }
        list.push(yy);
    }
    this.years=list;
    
    v=1;
    list=[];
    for(var i=0;i<4;i++) {
        var mm=[];
        for(var j=0;j<3;j++) {
            var m={v:v,cls:"col text-center"};
            if(chked) {//所选年份可见
                month=this.year*12+v-1;
                if(month>this.maxMonth||month<this.minMonth) {
                    m.cls+=" text-grey";
                } else if(v==this.month) {
                    m.cls+=" bg-primary text-white";
                }
            } else {
                m.cls+=" text-grey";
            }
            mm.push(m);
            v++;
        }
        list.push(mm);
    }    
    this.months=list;
},
parse(cfg,def) {
    if(!cfg) {
        return def;
    }
    var y,m;
    if(cfg=="cur") {
        var dt=Date.now();
        y=dt.getFullYear();
        m=dt.getMonth();
    } else {
        var p=cfg.indexOf('/');
        if(p<0)p=cfg.indexOf('-');
        if(p<0)p=cfg.indexOf('.');
        if(p>0) {
            y=parseInt(cfg.substring(0,p));
            m=parseInt(cfg.substring(p+1));
        } else {
            y=parseInt(cfg);
            m=1;
        }
    }
    return {y:y,m:m};
},
pageUp() {
    this.startYear-=12;
    this.set_array();
},
pageDn() {
    this.startYear+=12;
    this.set_array();
},
fore(){
    var v=this.month-1+this.year*12;
    if(v<=this.minMonth)return;
    
    this.month--;
    if(this.month==0) {
        this.year--;
        this.month=12;
    }
    this.$emit('update:modelValue', {year:this.year, month:this.month});
},
next(){
    var v=this.month-1+this.year*12;
    if(v>=this.maxMonth)return;
    
    this.month++;
    if(this.month>12) {
        this.year++;
        this.month=1;
    }
    this.$emit('update:modelValue', {year:this.year, month:this.month});
},
set_year(v) {
    var yMax=Math.ceil(this.maxMonth/12);
    var yMin=Math.floor(this.minMonth/12);
    if(v>yMax||v<yMin) {
        return;
    }
    this.month=1;
    this.year=v;
    this.set_array();
},
set_month(v) {
    if(this.year<this.startYear||this.year>this.startYear+12) {
        return;//未选择年份
    }
    var m=v-1+this.year*12;
    if(m>this.maxMonth||m<this.minMonth) {
        return; //不在有效范围内
    }
    this.month=v;
    this.$emit('update:modelValue', {year:this.year, month:this.month});
    this.$refs._my_dlg.hide();
}
},
computed: {
   value: {
      get() {return this.modelValue},
      set(v) {
          var ym=this.parse(v);
          this.year=ym.y;
          this.month=ym.m;
      }
   }
},
template: `
<div :class="cls">
 <div class="rol q-pr-lg"><q-icon name="navigate_before" @click="fore"></q-icon></div>
 <div class="rol" style="cursor:pointer">
 {{year}} / {{month<10?('0'+month):month}}
 <q-popup-proxy cover @before-show="set_array" ref="_my_dlg">
  <div class="row q-pa-sm" style="min-width:20em;">
   <div class="col self-center">
    <q-icon name="navigate_before" @click="pageUp" size="2em" class="q-px-sm"></q-icon>
   </div>
   <div class="col-8">
    <div class="row" v-for="yy in years">
     <div v-for="y in yy" :class="y.cls" @click="set_year(y.v)"
      style="cursor:pointer">{{y.v}}</div>
    </div>
    <q-separator spaced="md"></q-separator>
    <div class="row" v-for="mm in months">
     <div v-for="m in mm" :class="m.cls" @click="set_month(m.v)"
     style="cursor:pointer">{{m.v}}{{monthName}}</div>
    </div>
   </div>
   <div class="col self-center">
    <q-icon name="navigate_next" @click="pageDn" size="2em" class="q-px-sm"></q-icon>
   </div>
  </div>
 </q-popup-proxy>
 </div>
 <div class="rol q-pl-lg">
  <q-icon name="navigate_next" @click="next"></q-icon>
 </div> 
</div>
`
}