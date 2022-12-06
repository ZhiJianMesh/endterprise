//日期选择组件component-date-input
export default{
props: {
    modelValue:{type:String},
    label:{type:String,required:true},
    min:{type:String},
    max:{type:String},
    dateFormat:{type:String, default:"YYYY/MM/DD"},
    weekDays:{type:Array, default:["日","一","二","三","四","五","六"]},
    months:{type:Array, default:["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"]},
    close:{type:String, default:'关闭'}
},
emits: ['update:modelValue'],
methods:{
rangeFilter(dt) {
    if(this.min && this.min>dt){return false}
    if(this.max && this.max<dt){return false}
    return true
}
},
computed: {
   value: {
      get() {return this.modelValue},
      set(v) {this.$emit('update:modelValue', v)}
   }
},
template: `<q-input dense :label="label" v-model="value" readonly>
<template v-slot:append>
<q-icon name="event" class="cursor-pointer">
 <q-popup-proxy cover transition-show="scale" transition-hide="scale">
  <q-date minimal v-model="value" :mask="dateFormat" emit-immediately
   :locale="{daysShort:weekDays,months:months,monthsShort:months}"
   :options="rangeFilter">
    <div class="row items-center justify-end">
       <q-btn v-close-popup :label="close" color="primary" flat></q-btn>
    </div>
  </q-date>
 </q-popup-proxy>
</q-icon>
</template>
</q-input>`
}