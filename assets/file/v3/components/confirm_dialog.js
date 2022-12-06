//--- 确认窗口组件，有确定、取消两个按钮，component-confirm-dialog
export default {
data() {return {
    cfmDlg:false,
    message:'',
    cb:null
}},
props: {
    title:{type:String,default:"注意"},
    ok:{type:String,default:"确定"},
    close:{type:String,default:"关闭"}
},
methods:{
show(msg,callback) {
    this.message=msg;
    this.cfmDlg=true;
    this.cb=callback;
},
confirm(){
    if(this.cb&&typeof(this.cb)=='function'){
        this.cb();
    }
    this.cfmDlg=false;
}
},
template: `
<q-dialog v-model="cfmDlg">
  <q-card>
    <q-card-section><div class="text-h6">{{title}}</div></q-card-section>
    <q-card-section class="q-pt-none">{{message}}</q-card-section>
    <q-card-actions align="right" class="q-pr-md">
     <q-btn :label="ok" color="primary" @click="confirm"></q-btn>
     <q-btn flat :label="close" color="primary" v-close-popup></q-btn>
    </q-card-actions>
  </q-card>
</q-dialog>
`
}