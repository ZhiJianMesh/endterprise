//滚动选择组件
export default{
data() {return {
  chkIdx:-1,
  top:0,
  opts:[],
  scrTimes:0
}},
props: {
  modelValue:{type:String},
  height:{type:String,required:false,default:"5em"},
  width:{type:String,required:false,default:"10em"},
  autoChkHeadLine:{type:Boolean,required:false,default:false},
  chkedStyle:{type:Object,required:false,default:{'background-color':'blue',color:'white'}},
  itemClass:{type:String,required:false,default:"text-center"},
  options:{type:Array,required:true} //选项[{label:xx,value:yyy}...]
},
emits: ['update:modelValue'],
created(){
    var opts=[];
    for(var i in this.options) {
        var l, o=this.options[i];
        if(o.label&&o.value){o.style={};l=o}
        else l={label:o, value:o, style:{}};
        if(l.value==this.modelValue) {
            this.chkIdx=parseInt(i);//i被当作字符串了
            l.style=this.chkedStyle;
        }
        opts.push(l);
    }
    this.opts=opts;
    if(this.chkIdx<0){
        this.chkIdx=0;
        this.$emit('update:modelValue', opts[this.chkIdx].value);
    }
    this.top=this.chkIdx;
},
mounted() {
    var s=this.$refs._scroll_area.getScroll();
    var v=parseInt(this.top*s.verticalSize/this.opts.length);
    this.$refs._scroll_area.setScrollPosition ('vertical', v); 
},
methods: {
scroll(info) {
    if(!this.autoChkHeadLine)return;
    this.scrTimes++;
    if(this.scrTimes==1) return;//第一次是mounted中setScrollPercentage触发的
    var idx=parseInt(info.verticalPosition*this.opts.length/info.verticalSize);
    this.opts[this.chkIdx].style={};
    this.opts[idx].style=this.chkedStyle;
    this.$emit('update:modelValue', this.opts[idx].value);
    this.chkIdx=idx;
},
select(idx) {
    this.opts[this.chkIdx].style={};
    this.opts[idx].style=this.chkedStyle;
    this.$emit('update:modelValue', this.opts[idx].value);
    this.chkIdx=idx;
}
},
template: `
<q-scroll-area :class="$attrs.class" :thumb-style="{display:'none'}"
 :style="{height:height,width:width}" @scroll="scroll" ref="_scroll_area">
  <div v-for="(opt, i) in opts" :style="opt.style" @click="select(i)" :class="itemClass">
  {{opt.label}}
  </div>
</q-scroll-area>`
}