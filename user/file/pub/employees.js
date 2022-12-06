import AlertDialog from "/assets/v3/components/alert_dialog.js"
import Language from "./language.js"

const URL_ADDMBR="/grp/createMember";
const URL_CREATEGRP="/grp/create";
const URL_REMOVEMBR="/grp/removeMember";
const URL_REMOVEGRP="/grp/remove";
const URL_LIST="/grp/listAll";

const l=(typeof os)=='undefined' ? navigator.language : os.language();
const tags = l.indexOf("zh") == 0 ? Language.cn : Language.en;
//简易的用户&群组管理
export default {
data() {return {
    service:this.$route.query.service, //调用来自哪个服务，比如crm
    gid:this.$route.query.gid?this.$route.query.gid:0, //当前群组id
    proxyUrl:this.$route.query.proxy, //代理url
    tags:tags,
    employees:[],
    grps:[],
    roles:{},
    roleOpts:[], //下拉选项
    errMsgs:{},
    newEmployee:{account:'',role:'',password:''},
    newGrp:{name:'',descr:'',owner:''},
    paths:[],
    visible:{employee:false, grp:false}
}},
components:{
    "alert-dialog":AlertDialog
},
created(){
    request({method:"GET",url:"/api/roles"},this.service).then(function(resp){
        if(resp.code!=0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.roles=resp.data;//role:{name:...,rights:[...]}
        var opts=[];
        for(var n in this.roles){
            opts.push({value:n,label:this.roles[n].name})            
        }
        this.roleOpts=opts;
    }.bind(this));
    this.query_sub_eles();
},
methods:{
proxy_req(req){
    var dta={'_service':SERVICE_USER,'_method':req.method,'_url':req.url};
    if(req.method=='POST'&&req.data){
        for(var k in req.data){
            dta[k]=req.data[k];
        }
    }
    return request({method:"POST",url:this.proxyUrl,data:dta}, this.service);
},
query_sub_eles(){//查询子群组及成员
    var url=URL_LIST+"?fid="+this.gid;
    this.proxy_req({method:"GET",url:url}).then(function(resp){
        if(resp.code!=0) {
            return;
        }
        var dt=new Date();

        if(resp.data.members) {
            this.employees=resp.data.members.map(function(m){
                dt.setTime(m.update_time);
                return {uid:m.uid, account:m.account, role:m.role, createAt:dt.toLocaleString()}
            });
        } else {
            this.employees=[];
        }
        if(resp.data.grps) {
            this.grps=resp.data.grps.map(function(g){
                dt.setTime(g.update_time);
                return {id:g.id, name:g.name, createAt:dt.toLocaleString()}
            });
        } else {
            this.grps=[];
        }
    }.bind(this))  
},
add_member() {
    var dta={fid:this.gid,account:this.newEmployee.account,
        role:this.newEmployee.role, password:this.newEmployee.password};
    this.proxy_req({method:"POST",url:URL_ADDMBR,data:dta}).then(function(resp){
        if(resp.code!=0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.query_sub_eles();
        this.visible.employee=false;
        this.newEmployee={account:'',role:'',password:''};
    }.bind(this));
},

create_grp() {
    var dta={fid:this.gid,name:this.newGrp.name,descr:this.newGrp.descr};
    this.proxy_req({method:"POST",url:URL_CREATEGRP,data:dta}).then(function(resp){
        if(resp.code!=0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.query_sub_eles();
        this.visible.grp=false;
        this.newGrp={name:'',descr:''};
    }.bind(this));
},
rmv_grp(id) {
    var dta={id:id};
    this.proxy_req({method:"POST",url:URL_REMOVEGRP,data:dta}).then(function(resp){
        if(resp.code!=0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.query_sub_eles();
    }.bind(this));  
},
rmv_member(id) {
    var dta={fid:this.gid,uid:id};
    this.proxy_req({method:"POST",url:URL_REMOVEMBR,data:dta}).then(function(resp){
        if(resp.code!=0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.query_sub_eles();
    }.bind(this));  
},
open_grp(id,name){
    if(id==this.gid){
        return;
    }

    if(id==0){
        this.paths=[];
        this.gid=0;
    } else {
        for(var i in this.paths){
            if(this.paths[i].id==id){
                this.paths.length=i;//删除后面的
                break;
            }
        }
        this.gid=id;
        this.paths.push({n:name, id:id});
    }
    this.query_sub_eles();
},
go_back() {
    this.$router.back();
}
},
template:`
<q-layout view="lHh lpr lFf" container style="height:100vh">
  <q-header elevated>
   <q-toolbar>
      <q-btn flat round icon="arrow_back" dense @click="go_back"></q-btn>
      <q-toolbar-title>{{tags.app_name}}</q-toolbar-title>
   </q-toolbar>
  </q-header>

  <q-page-container>
    <q-page class="q-pa-md">
<q-breadcrumbs gutter="sm" class="q-pb-md" separator='/' class="text-primary">
    <q-breadcrumbs-el @click="open_grp(0,'')" icon="home"></q-breadcrumbs-el>
    <q-breadcrumbs-el v-for="p in paths" :label="p.n" @click="open_grp(p.id,p.n)"></q-breadcrumbs-el>
</q-breadcrumbs>
  <q-list>
   <q-item v-for="g in grps" clickable @click="open_grp(g.id,g.name)">
    <q-item-section thumbnail><q-icon name="folder"></q-icon></q-item-section>
    <q-item-section>{{g.name}}</q-item-section>
    <q-item-section>{{g.createAt}}</q-item-section>
    <q-item-section thumbnail><q-icon name="cancel" @click.stop="rmv_grp(g.id)" color="red"></q-icon></q-item-section>
   </q-item>
   <q-separator></q-separator>
   <q-item v-for="e in employees">
    <q-item-section thumbnail><q-icon name="person_outline"></q-icon></q-item-section>
    <q-item-section>{{e.account}}({{roles[e.role].name}})</q-item-section>
    <q-item-section>{{e.createAt}}</q-item-section>
    <q-item-section thumbnail><q-icon name="cancel" @click="rmv_member(e.uid)" color="green"></q-icon></q-item-section>
   </q-item>
  </q-list>
  <div align="center">
    <q-btn color="primary" icon="person_add" :label="tags.addMbr" @click="visible.employee=true" class="q-mr-md"></q-btn>
    <q-btn color="primary" icon="create_new_folder" :label="tags.crtGrp" @click="visible.grp=true"></q-btn>
  </div>  
    </q-page>
  </q-page-container>
</q-layout>

<q-dialog v-model="visible.employee">
 <q-card style="min-width:70vw">
  <q-card-section>
      <div class="text-h6">{{tags.addMbr}}</div>
  </q-card-section>
  <q-card-section class="q-pt-none">
    <q-item>
     <q-item-section><q-input :label="tags.account" v-model="newEmployee.account" dense></q-input></q-item-section>
    </q-item>
    <q-item>
     <q-item-section>
       <q-select :label="tags.role" v-model="newEmployee.role" :options="roleOpts" emit-value map-options></q-select>
     </q-item-section>
    </q-item>
    <q-item>
     <q-item-section><q-input :label="tags.pwd" v-model="newEmployee.password" type="password" dense></q-input></q-item-section>
    </q-item>
   </q-list>
  </q-card-section>
  <q-card-actions align="right">
     <q-btn :label="tags.ok" color="primary" @click="add_member"></q-btn>
     <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
  </q-card-actions>
 </q-card>
</q-dialog>

<q-dialog v-model="visible.grp">
 <q-card style="min-width:70vw">
  <q-card-section>
      <div class="text-h6">{{tags.crtGrp}}</div>
  </q-card-section>
  <q-card-section class="q-pt-none">
    <q-item>
     <q-item-section><q-input :label="tags.name" v-model="newGrp.name" dense></q-input></q-item-section>
    </q-item>
    <q-item>
     <q-item-section><q-input :label="tags.descr" v-model="newGrp.descr" dense></q-input></q-item-section>
    </q-item>
   </q-list>
  </q-card-section>
  <q-card-actions align="right">
     <q-btn :label="tags.ok" color="primary" @click="create_grp"></q-btn>
     <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
  </q-card-actions>
 </q-card>
</q-dialog>

<alert-dialog :title="tags.failToCall" :errMsgs="errMsgs" :close="tags.close" ref="errMsg"></alert-dialog>
`
}