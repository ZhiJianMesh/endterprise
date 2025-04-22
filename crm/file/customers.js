export default {
inject:['service', 'tags'],
data() {return {
    customers:[], //客户列表
    tmpl:{}, //{k:"x",n:"y",t:"z"}...
    search:'',
    newCustDlg:false,
    onlyMine:true,
    page:{cur:1, max:0},
    newCust:{name:'',taxid:'',address:'',business:'',nextSigners:[],ext:{}}
}},
created(){
    this.onlyMine=storageGet('customer_onlyMine') == 'true';
    this.query_custs(1);
    this.service.template('customer').then(function(tmpl) {
        this.tmpl=tmpl;
    }.bind(this));
},
methods:{
fmt_customer_lines(data) {
    var dt=new Date();
    var rows;
    var touchlogs={};
    rows=data.touchlogs;
    for(var row of rows) {
        touchlogs[row[0]]=row; //customer,cmt...
    }
    
    var customers=[];
    var cu,tl;
    var cols=data.cols;
    rows=data.customers;
    for(var row of rows) { //id,name,address,createAt,status,creator
        cu={};
        for(var i in cols) {
            cu[cols[i]]=row[i];
        }
        dt.setTime(cu.createAt*60000);
        cu.createAt=date2str(dt);
        cu.status=this.tags.sta2icon(cu.status);
        tl=touchlogs[cu.id];//客户可以没有最新的接触记录
        if(tl) {//customer,cmt,createAt,creator,contact
            cu['comment']=tl[1]+'@'+tl[4];
            dt.setTime(tl[2]);
            cu['tlCreator']=tl[3]+'@'+date2str(dt);
        }
        customers.push(cu);
    }
    this.customers=customers;
},
query_custs(pg) {
    this.search='';
    var offset=(parseInt(pg)-1)*this.service.N_PAGE;
    var url = this.onlyMine ? "/api/customer/my" : "/api/customer/readable";
    url += "?offset="+offset+"&num="+this.service.N_PAGE;
    request({method:"GET",url:url}, this.service.name).then(resp =>{
        if(resp.code!=RetCode.OK || resp.data.total==0) {
            this.customers=[];
            this.page.max=0;
            this.page.cur=1;
            return;
        }
        this.fmt_customer_lines(resp.data);
        this.page.max=Math.ceil(resp.data.total/this.service.N_PAGE);
    })
},
search_custs() {
    if(this.search=='') {
        this.query_custs(1);
        return;
    }
    var url="/api/customer/search?s="+this.search+"&limit="+this.service.N_PAGE;
    request({method:"GET",url:url}, this.service.name).then(resp => {
        if(resp.code != RetCode.OK) {
            return;
        }
        this.fmt_customer_lines(resp.data);
        this.page.max=1;
    })
},
onlyMineClk() {
    storageSet('customer_onlyMine', this.onlyMine);
    this.page.cur=1;
    this.query_custs(1);
},
create_cust() {
    var dta=copyObj(this.newCust,['name','taxid','address','business','nextSigners']);
    dta['comment']=this.service.encodeExt(this.newCust.ext);
    var url="/api/customer/create";
    request({method:"POST",url:url,data:dta}, this.service.name).then(resp => {
        if(resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.newCustDlg=false;
        this.newCust={name:'',taxid:'',address:'',business:'',nextSigners:[],ext:{}};
        this.query_custs(1);
    })
},
chkCredit(code) {//不能在rules中直接调用原生对象的函数，原因未知
    return JStr.chkCreditCode(code);
}
},
template:`
<q-layout view="hHh lpr fFf" container style="height:100vh">
  <q-header elevated>
   <q-toolbar>
    <q-btn flat round icon="arrow_back" dense @click="service.back"></q-btn>
    <q-toolbar-title>{{tags.home.customers}}</q-toolbar-title>
    <q-btn flat round dense icon="menu">
      <q-menu>
       <q-list style="min-width: 100px">
        <q-item clickable v-close-popup>
          <q-item-section avatar>
           <q-checkbox v-model="onlyMine" @update:model-value="onlyMineClk"></q-checkbox>
          </q-item-section>
          <q-item-section>{{tags.onlyMine}}</q-item-section>
        </q-item>
       </q-list>
      </q-menu>
    </q-btn>
  </q-toolbar>
  </q-header>
  <q-footer class="bg-white q-pa-md">
    <q-input outlined v-model="search" :label="tags.search" dense @keyup.enter="search_custs">
     <template v-slot:append>
      <q-icon v-if="search!==''" name="close" @click="query_custs(1)" class="cursor-pointer"></q-icon>
      <q-icon name="search" @click="search_custs"></q-icon>
     </template>
     <template v-slot:after>
      <q-btn round color="primary" icon="add_circle" @click="newCustDlg=true"></q-btn>
     </template>
    </q-input>
  </q-footer>
  <q-page-container>
    <q-page class="q-pa-md">
<div class="q-pa-sm flex flex-center" v-if="page.max>1">
 <q-pagination v-model="page.cur" color="primary" :max="page.max" max-pages="10"
  boundary-numbers="false" @update:model-value="query_custs"></q-pagination>
</div>
<q-list separator>
 <q-item>
  <q-item-section><q-item-label caption>{{tags.customer.name}}</q-item-label></q-item-section>
  <q-item-section><q-item-label caption>{{tags.customer.address}}</q-item-label></q-item-section>
  <q-item-section><q-item-label caption>{{tags.customer.lastestTl}}</q-item-label></q-item-section>
  <q-item-section thumbnail></q-item-section>
 </q-item>
 <q-item v-for="c in customers" @click="service.goto('/customer?id='+c.id)" clickable>
  <q-item-section>
   <q-item-label>{{c.name}}</q-item-label>
   <q-item-label caption>{{c.creator}}@{{c.createAt}}</q-item-label>
  </q-item-section>
  <q-item-section>{{c.address}}</q-item-section>
  <q-item-section no-wrap>
   <q-item-label caption lines=2>{{c.comment}}</q-item-label>
   <q-item-label caption>{{c.tlCreator}}</q-item-label>
  </q-item-section>
  <q-item-section thumbnail><q-icon :name="c.status" color="primary" size="xs"></q-icon></q-item-section>
 </q-item>
</q-list>
    </q-page>
  </q-page-container>
</q-layout>
<component-alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs" :close="tags.close" ref="errMsg"></component-alert-dialog>

<q-dialog v-model="newCustDlg">
  <q-card style="min-width:70vw">
    <q-card-section>
      <div class="text-h6">{{tags.addCust}}</div>
    </q-card-section>
    <q-card-section class="q-pt-none">
     <q-list>
      <q-item><q-item-section>
       <q-input v-model="newCust.name" :label="tags.customer.name" dense maxlength=100></q-input>
      </q-item-section></q-item>
      <q-item><q-item-section>
       <q-input v-model="newCust.taxid" :label="tags.taxid" dense maxlength=18
       :rules="[v=>chkCredit(v)||tags.taxidPls]"></q-input>
      </q-item-section></q-item>
      <q-item><q-item-section>
       <q-input v-model="newCust.address" :label="tags.address" dense maxlength=100></q-input>
      </q-item-section></q-item>
      <q-item><q-item-section>
       <q-input v-model="newCust.business" :label="tags.business" dense maxlength=100></q-input>
      </q-item-section></q-item>
      <q-item v-for="(tpl,k) in tmpl"><q-item-section>
        <div v-if="tpl.t=='d'">
          <component-date-input :close="tags.ok" :label="tpl.n" v-model="newCust.ext[k]" dense></component-date-input>
        </div>
        <div v-else-if="tpl.t=='b'">
          <q-checkbox v-model="newCust.ext[k]" :label="tpl.n" left-label dense></q-checkbox>
        </div>
        <div v-else>
         <q-input :label="tpl.n" v-model="newCust.ext[k]" dense :autogrow="tpl.t!='n'"
          :type="tpl.t=='n'?'number':'textarea'" dense></q-input>
        </div>
      </q-item-section></q-item>
      <q-item><q-item-section>
       <component-user-selector :label="tags.signers" :accounts="newCust.nextSigners"></component-user-selector>
      </q-item-section></q-item>
     </q-list>
    </q-card-section>
    <q-card-actions align="right">
      <q-btn :label="tags.ok" color="primary" @click="create_cust"></q-btn>
      <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
    </q-card-actions>
  </q-card>
</q-dialog>
`
}