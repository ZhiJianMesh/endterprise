const EMPTY_PERSON={name:'',email:'',addr:'',phone:'',maxEdu:'',firstEdu:'',
            quali:0,birth:'',sex:'M',expSalary:0,cmt:'',createAt:0,uid:0};
export default {
inject:['service', 'tags'],
data() {return {
    list:[], //人才列表
    search:'',
    page:{cur:1, max:0},
    dlg:{title:'',show:false,act:'create'},
    perInfo:{},
    eduOpts:[]
}},
created(){
    copyObjTo(EMPTY_PERSON,this.perInfo);
    this.query(1);
    var opts=[];
    for(var i in this.tags.edu) {
        opts.push({value:i,label:this.tags.edu[i]});
    }
    this.eduOpts=opts;
},
methods:{
fmt_lines(data) {
    var dt=new Date();
    var year=dt.getFullYear();
    var list=[];
    var p; //人才
    var cols=data.cols;
    var rows=data.list;
    //quali,sex,birth,expSalary,maxEdu,firstEdu,name,phone,email,addr,cmt,createAt
    for(var row of rows) {
        p={};
        for(var i in cols) {
            p[cols[i]]=row[i];
        }
        p.sex_s=this.tags.sex[p.sex];
        p.maxEdu_s=this.tags.edu[p.maxEdu];
        p.firstEdu_s=this.tags.edu[p.firstEdu];
        dt.setTime(p.birth*60000);
        p.age=year-dt.getFullYear();
        p.birth_s=this.tags.date2str(dt);
        dt.setTime(p.createAt*60000);
        p.createAt_s=this.tags.date2str(dt);
        dt.setTime(p.update_time);
        p.updateAt=this.tags.date2str(dt);
        list.push(p);
    }
    this.list=list;
},
query(pg) {
    this.search='';
    var offset=(parseInt(pg)-1)*this.service.N_PAGE;
    var url = "/api/pool/list?offset="+offset+"&num="+this.service.N_PAGE;
    request({method:"GET",url:url}, this.service.name).then(resp =>{
        if(resp.code!=RetCode.OK || resp.data.total==0) {
            this.list=[];
            this.page.max=0;
            this.page.cur=1;
            return;
        }
        this.fmt_lines(resp.data);
        this.page.max=Math.ceil(resp.data.total/this.service.N_PAGE);
    })
},
search() {
    if(this.search=='') {
        this.query(1);
        return;
    }
    var url="/api/pool/search?s="+this.search+"&limit="+this.service.N_PAGE;
    request({method:"GET",url:url}, this.service.name).then(resp => {
        if(resp.code != RetCode.OK) {
            return;
        }
        this.fmt_lines(resp.data);
        this.page.max=1;
    })
},
showModify(ln) {
    copyObjTo(this.list[ln], this.perInfo);
    this.perInfo.birth=this.perInfo.birth_s;
    this.dlg.act='modify';
    this.dlg.show=true;
    this.dlg.title=this.tags.modify;
},
showCreate() {
    copyObjTo(EMPTY_PERSON, this.perInfo);
    this.dlg.act='create';
    this.dlg.show=true;
    this.dlg.title=this.tags.add;
},
remove() {
    request({method:"DELETE",url:"/api/pool/remove?uid="+this.perInfo.uid}, this.service.name).then(resp => {
        if(resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.dlg.show=false;
        this.query(this.page.cur);
    });
},
act() {
    var url,dta,method;
    if(this.dlg.act=='create') {
        dta=excCopyObj(this.perInfo,['uid','birth']);
        url="/api/pool/add";
        method="POST";
    } else {
        url="/api/pool/update";
        dta=excCopyObj(this.perInfo,['birth']);
        method="PUT";
    }
    dta.birth=parseInt(new Date(this.perInfo.birth).getTime()/60000);
    
    request({method:method,url:url,data:dta}, this.service.name).then(resp => {
        if(resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.dlg.show=false;
        this.query(this.page.cur);
    });
}
},
template:`
<q-layout view="lHh lpr lFf" container style="height:100vh">
  <q-header elevated>
   <q-toolbar>
    <q-btn flat icon="arrow_back" dense @click="service.go_back"></q-btn>
    <q-toolbar-title>{{tags.pool.title}}</q-toolbar-title>
  </q-toolbar>
  </q-header>
  <q-footer class="bg-white q-px-md q-pt-md">
    <q-input outlined bottom-slots v-model="search" :label="tags.search" dense @keyup.enter="search">
     <template v-slot:append>
      <q-icon v-if="search!==''" name="close" @click="query(1)" class="cursor-pointer"></q-icon>
      <q-icon name="search" @click="search"></q-icon>
     </template>
     <template v-slot:after>
      <q-btn round color="primary" icon="add_circle" @click="showCreate"></q-btn>
     </template>
    </q-input>
  </q-footer>
  <q-page-container>
    <q-page class="q-pa-md">
<div class="q-pa-sm flex flex-center" v-if="page.max>1">
 <q-pagination v-model="page.cur" color="primary" :max="page.max" max-pages="10"
  boundary-numbers="false" @update:model-value="query"></q-pagination>
</div>
<q-list separator>
 <q-item>
  <q-item-section><q-item-label caption>{{tags.pool.name}}</q-item-label></q-item-section>
  <q-item-section><q-item-label caption>{{tags.pool.contact}}</q-item-label></q-item-section>
  <q-item-section><q-item-label caption>{{tags.pool.ability}}</q-item-label></q-item-section>
  <q-item-section thumbnail></q-item-section>
 </q-item>
 <q-item v-for="(p,i) in list" @click="showModify(i)" clickable>
  <q-item-section>
   <q-item-label>{{p.name}} {{p.sex_s}}</q-item-label>
   <q-item-label caption>{{p.age}}{{tags.age}}</q-item-label>
   <q-item-label caption>{{p.updateAt}}/{{p.createAt_s}}</q-item-label>
  </q-item-section>
  <q-item-section>
   <q-item-label>{{p.phone}}</q-item-label>
   <q-item-label caption>{{p.email}}</q-item-label>
   <q-item-label caption>{{p.addr}}</q-item-label>
  </q-item-section>
  <q-item-section>
   <q-item-label caption>{{p.cmt}}</q-item-label>
   <q-item-label caption>{{p.quali}}</q-item-label>
   <q-item-label caption>{{p.maxEdu_s}}/{{p.firstEdu_s}}</q-item-label>
  </q-item-section>
 </q-item>
</q-list>
    </q-page>
  </q-page-container>
</q-layout>

<q-dialog v-model="dlg.show">
  <q-card style="min-width:70vw">
    <q-card-section>
      <div class="text-h6">{{dlg.title}}</div>
    </q-card-section>
    <q-card-section class="q-pt-none">
     <q-list>
      <q-item><q-item-section>
       <q-input v-model="perInfo.name" :label="tags.pool.name" dense maxlength=80>
        <template v-slot:after>
         <q-radio v-model="perInfo.sex" class="text-caption"
         v-for="(s,v) in tags.sex" :val="v" :label="s"></q-radio>
        </template>
       </q-input>
      </q-item-section></q-item>
      <q-item><q-item-section>
       <q-select v-model="perInfo.maxEdu" :options="eduOpts" emit-value
        :label="tags.pool.maxEdu" dense map-options></q-select>
      </q-item-section></q-item>
      <q-item><q-item-section>
       <q-select v-model="perInfo.firstEdu" :options="eduOpts" emit-value
        :label="tags.pool.firstEdu" dense map-options></q-select>
      </q-item-section></q-item>
      <q-item><q-item-section>
       <q-input v-model.number="perInfo.quali" :label="tags.pool.quali" dense></q-input>
      </q-item-section></q-item>
      <q-item><q-item-section>
       <q-input v-model.number="perInfo.expSalary" :label="tags.pool.expSalary" dense></q-input>
      </q-item-section></q-item>
      <q-item><q-item-section>
       <q-input v-model.number="perInfo.phone" :label="tags.pool.phone" dense maxlength=90></q-input>
      </q-item-section></q-item>
      <q-item><q-item-section>
       <date-input :close="tags.ok" :label="tags.pool.birth"
        v-model="perInfo.birth" max="today"></date-input>
      </q-item-section></q-item>
      <q-item><q-item-section>
       <q-input v-model="perInfo.email" :label="tags.pool.email" dense maxlength=80></q-input>
      </q-item-section></q-item>
      <q-item><q-item-section>
       <q-input v-model="perInfo.addr" :label="tags.pool.addr" dense maxlength=80></q-input>
      </q-item-section></q-item>
      <q-item><q-item-section>
       <q-input v-model="perInfo.cmt" :label="tags.pool.cmt" dense maxlength=500></q-input>
      </q-item-section></q-item>
     </q-list>
    </q-card-section>
    <q-card-actions align="right">
      <q-btn flat :label="tags.remove" color="primary" v-close-popup
       v-show="dlg.act=='modify'" @click="remove"></q-btn>
      <q-space></q-space>
      <q-btn :label="tags.ok" color="primary" @click="act"></q-btn>
      <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
    </q-card-actions>
  </q-card>
</q-dialog>

<alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs"
 :close="tags.close" ref="errMsg"></alert-dialog>
`
}