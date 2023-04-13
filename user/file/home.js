export default {
inject:['service', 'tags'],
data() {return {
    gid:-1,
    fname:'',
    members:[],
    grps:[],
    errMsgs:{},
    newMbr:{dlg:false,account:[],title:''},
    newGrp:{dlg:false,name:'',descr:'',admin:''},
    edtGrp:{dlg:false,id:0,fname:{value:null,label:''},name:'',descr:''},
    paths:[],
    resetFun:null //让滑动菜单归位的函数
}},
created(){
    this.open_grp(0, '');
},
methods:{
query_subs(){//查询子群组及成员
    var opts={method:"GET", url:"/grp/listAll?gid="+this.gid}
    request(opts, this.service.name).then(resp => {
        if(resp.code!=RetCode.OK) {
            return;
        }
        var dt=new Date();
        if(resp.data.members) {
            this.members=resp.data.members.map(function(m){
                dt.setTime(m.update_time);
                return {id:m.id, account:m.account, title:m.title,
                 createAt:dt.toLocaleDateString()}
            });
        } else {
            this.members=[];
        }
        if(resp.data.grps) {
            var fname=this.fname;
            this.grps=resp.data.grps.map(function(g){
                dt.setTime(g.update_time);
                var pos=g.name.lastIndexOf('/');
                var n=pos>0?g.name.substring(pos+1):g.name;
                return {id:g.id, name:n, descr:g.descr,createAt:dt.toLocaleDateString(),
                 outdated:g.name.substring(0,pos)!=fname}//组织重构后没有更新下层组织，需要逐层重构
            });
        } else {
            this.grps=[];
        }
    })  
},
create_grp() {
    var dta={fname:this.fname,name:this.newGrp.name,descr:this.newGrp.descr};
    var opts={method:"POST",url:"/grp/create",data:dta};
    request(opts, this.service.name).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.query_subs();
        this.newGrp={dlg:false,name:'',descr:''};
    });
},
rmv_grp(id,i) {
    this.hide_slider();
    var opts={method:"DELETE",url:"/grp/remove?id="+id};
    request(opts, this.service.name).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
        } else {
            this.grps.splice(i,1);
        }
    });
},
update_grp() {
    var g=this.edtGrp;
    var dta={id:g.id,fname:g.fname.value,name:g.name,descr:g.descr};
    var opts={method:"POST",url:"/grp/set",data:dta};
    request(opts, this.service.name).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        if(dta.fname!=this.fname) {//改变了父群组才需要刷新
            this.query_subs();
        }
        this.edtGrp.dlg=false;
    });
},
on_edit_grp(g) {
    this.hide_slider();
    this.edtGrp={dlg:true,id:g.id,
        fname:{value:this.fname,label:this.fname},
        name:g.name,descr:g.descr
    };
},
add_member() {
    var dta={gid:this.gid,uid:this.newMbr.account[0],title:this.newMbr.title};
    var opts={method:"POST",url:"/api/member/add",data:dta};
    request(opts, this.service.name).then(resp =>{
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.query_subs();
        this.newMbr={dlg:false,account:[],title:''};
    });
},
rmv_member(id,i) {
    this.hide_slider();
    var opts={method:"DELETE",url:"/api/member/remove?gid="+this.gid+"&uid="+id};
    request(opts, this.service.name).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.members.splice(i,1);
    });
},
open_grp(id,name){
    if(id==this.gid){
        return;
    }
    this.hide_slider();
    if(id==0){
        this.paths=[];
        this.fname='';
    } else {
        var fn='';
        for(var i in this.paths){
            if(this.paths[i].id==id){
                this.paths.length=i;//删除后面的
                break;
            }
            if(i>0){fn += '/'}
            fn += this.paths[i].n;
        }
        if(fn != '') {fn += '/'}
        this.fname=fn + name;
        this.paths.push({n:name, id:id});
    }
    this.gid=id;
    this.query_subs();
},
on_slide({reset}) {
    this.hide_slider();//关闭已经打开的，如果有
    this.resetFun=reset;
},
hide_slider() {
    if(!this.resetFun || typeof(this.resetFun) !== 'function') {
        return;
    }
    try{
        this.resetFun();
    }catch(e) {
        console.error(e);
    }finally{
        this.resetFun=null;
    }
}
},
template:`
<q-layout view="lHh lpr lFf" container style="height:100vh">
  <q-header elevated>
   <q-toolbar>
    <q-toolbar-title>{{tags.app_name}}</q-toolbar-title>
    <q-btn icon="manage_accounts" flat round @click="service.jumpTo('/users')"></q-btn>
    <q-btn icon="fact_check" flat round @click="service.jumpTo('/authorizes')"></q-btn>    
   </q-toolbar>
  </q-header>
  <q-page-container>
    <q-page class="q-pa-md">
<q-page-sticky position="bottom-right" :offset="[18, 18]" v-show="gid>0">
 <q-fab icon="add" direction="up" color="primary" push>
  <q-fab-action @click="newGrp.dlg=true" color="accent" icon="create_new_folder"></q-fab-action>
  <q-fab-action @click="newMbr.dlg=true" color="accent" icon="person_add"></q-fab-action>
 </q-fab>
</q-page-sticky>
<q-breadcrumbs gutter="sm" class="q-pb-lg" class="text-primary">
  <q-breadcrumbs-el @click="open_grp(0,'')" icon="home"></q-breadcrumbs-el>
  <q-breadcrumbs-el v-for="p in paths" :label="p.n" @click="open_grp(p.id,p.n)"></q-breadcrumbs-el>
</q-breadcrumbs>
<q-list>
  <q-slide-item v-if="gid>0" clickable @right="on_slide" v-for="(g,i) in grps" @click="open_grp(g.id,g.name)" right-color="purple">
   <template v-slot:right>
      <q-icon name="edit" @click="on_edit_grp(g)" class="q-mr-md"></q-icon> 
      <q-icon name="delete_forever" @click="rmv_grp(g.id)"></q-icon> 
   </template>
   <q-item>
    <q-item-section thumbnail><q-icon name="folder"></q-icon></q-item-section>
    <q-item-section>{{g.name}}</q-item-section>
    <q-item-section>{{g.descr}}</q-item-section>
    <q-item-section>{{g.createAt}}</q-item-section>
   </q-item>
  </q-slide-item>
  <q-item v-else clickable v-for="g in grps" @click="open_grp(g.id,g.name)">
   <q-item-section thumbnail><q-icon name="folder"></q-icon></q-item-section>
   <q-item-section>{{g.name}}</q-item-section>
   <q-item-section>{{g.descr}}</q-item-section>
   <q-item-section>{{g.createAt}}</q-item-section>
  </q-item>
  
  <q-separator></q-separator>
  
  <q-slide-item v-for="(m,i) in members" clickable
   @click="service.jumpTo('/user?id='+m.id)" clickable @right="on_slide">
   <template v-slot:right>
      <q-icon name="delete_forever" @click="rmv_member(m.id,i)"></q-icon> 
   </template>
   <q-item>
    <q-item-section thumbnail><q-icon name="person_outline"></q-icon></q-item-section>
    <q-item-section>{{m.account}}</q-item-section>
    <q-item-section>{{m.title}}</q-item-section>
    <q-item-section>{{m.createAt}}</q-item-section>
   </q-item>
  </q-slide-item>
</q-list>
    </q-page>
  </q-page-container>
</q-layout>

<q-dialog v-model="newMbr.dlg">
 <q-card style="min-width:70vw">
  <q-card-section>
      <div class="text-h6">{{tags.addMbr}}</div>
  </q-card-section>
  <q-card-section class="q-pt-none">
    <q-item><q-item-section>
     <component-user-selector :label="tags.user.account"
      :accounts="newMbr.account" multi="false" useid="true"></component-user-selector>
    </q-item-section></q-item>
    <q-item><q-item-section>
     <q-input :label="tags.grp.title" v-model="newMbr.title" dense></q-input>
    </q-item-section></q-item>
   </q-list>
  </q-card-section>
  <q-card-actions align="right">
     <q-btn :label="tags.ok" color="primary" @click="add_member"></q-btn>
     <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
  </q-card-actions>
 </q-card>
</q-dialog>

<q-dialog v-model="newGrp.dlg">
 <q-card style="min-width:70vw">
  <q-card-section>
   <div class="text-h6">{{tags.crtGrp}}</div>
  </q-card-section>
  <q-card-section class="q-pt-none">
   <q-list dense>
    <q-item><q-item-section>
     <q-input :label="tags.grp.name" v-model="newGrp.name" dense></q-input>
    </q-item-section></q-item>
    <q-item><q-item-section>
     <q-input :label="tags.grp.descr" v-model="newGrp.descr" dense></q-input>
    </q-item-section></q-item>
   </q-list>
  </q-card-section>
  <q-card-actions align="right">
     <q-btn :label="tags.ok" color="primary" @click="create_grp"></q-btn>
     <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
  </q-card-actions>
 </q-card>
</q-dialog>

<q-dialog v-model="edtGrp.dlg">
 <q-card style="min-width:70vw">
  <q-card-section>
   <div class="text-h6">{{tags.editGrp}}</div>
  </q-card-section>
  <q-card-section class="q-pt-none">
   <q-list dense>
    <q-item><q-item-section>
     <component-grp-selector :label="tags.grp.fname" v-model="edtGrp.fname"></component-grp-selector>
    </q-item-section></q-item>
    <q-item><q-item-section>
      <q-input v-model="edtGrp.name" :label="tags.grp.name" dense></q-input>
    </q-item-section></q-item>
    <q-item><q-item-section>
      <q-input v-model="edtGrp.descr" :label="tags.grp.name" dense></q-input>
    </q-item-section></q-item>
   </q-list>
  </q-card-section>
  <q-card-actions align="right">
     <q-btn :label="tags.ok" color="primary" @click="update_grp"></q-btn>
     <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
  </q-card-actions>
 </q-card>
</q-dialog>

<component-alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs" :close="tags.close" ref="errMsg"></component-alert-dialog>
`
}