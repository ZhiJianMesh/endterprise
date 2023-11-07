//告警窗口组件,component-alert-dialog
export default {
data() {return {
    dlg:false,
    message:''
}},
props: {
    title:{type:String,default:"警告"},
    close:{type:String,default:"关闭"}
},
created(){
    for(var c in this.errMsgs){
        this.errors[c]=this.errMsgs[c];
    }
},
methods:{
show(msg) {
    this.message=msg;
    this.dlg=true;
},
showErr(code,info) {
    this.message=formatErr(code,info); //必须import errors.xx.js
    this.dlg=true;
}
},
template: `
<q-dialog v-model="dlg">
  <q-card>
    <q-card-section><div class="text-h6">{{title}}</div></q-card-section>
    <q-card-section class="q-pt-none" v-html="message"></q-card-section>
    <q-card-actions align="right" class="q-pr-md">
     <q-btn flat :label="close" color="primary" v-close-popup></q-btn>
    </q-card-actions>
  </q-card>
</q-dialog>
`
}