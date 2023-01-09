export default {
inject:['service', 'tags'],
data() {return {
    employees:[],
    roles:{},
    roleOpts:[],
    newEmployee:{account:'',role:'',password:'',gid:0},
    newEmployeeDlg:false
}},
created(){
    var opts1={method:"GET",url:"/api/roles", private:false};
    request(opts1, this.service.name).then(resp=>{
        if(resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.roles=resp.data;
        var opts=[];
        for(var n in this.roles){
            opts.push({value:n,label:this.roles[n].name})
        }
        this.roleOpts=opts;
    });
    
    this.proxy_req({method:"GET",url:"/grp/listAll?gid=0"}).then(resp => {
        if(resp.code != RetCode.OK) {
            if(resp.code != RetCode.NOT_EXISTS) {
                this.$refs.errMsg.showErr(resp.code, resp.info);
            }
            return;
        }
        this.employees=resp.data.members;
    })  
},
methods:{
proxy_req(req){
    var dta={'_service':SERVICE_USER,'_method':req.method,'_url':req.url};
    if(req.method=='POST'&&req.data){
        for(var k in req.data){
            dta[k]=req.data[k];
        }
    }
    return request({method:"POST",url:"/api/proxy/employee",data:dta}, this.service.name);
},
add_member() {
    for(var e in this.employees) {
        if(this.employees[e].account==this.newEmployee.account){
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
    }
    
    var opts={method:"POST",url:"/grp/createMember",data:this.newEmployee};
    this.proxy_req(opts).then(resp =>{
        if(resp.code != RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.employees.push({uid:resp.data.id,account:this.newEmployee.account,role:this.newEmployee.role});
        this.newEmployee={account:'',role:'',password:''};
        this.newEmployeeDlg=false;
    });
},
rmv_member(i) {
    var opts={method:"POST",url:"/grp/removeMember",data:{gid:0,uid:this.employees[i].uid}};
    this.proxy_req(opts).then(resp=>{
        if(resp.code != RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.employees.splice(i,1);
    });  
}
},

template:`
<q-layout view="lHh lpr lFf" container style="height:100vh">
  <q-header elevated>
   <q-toolbar>
      <q-btn flat round icon="arrow_back" dense @click="service.go_back"></q-btn>
      <q-toolbar-title>{{tags.employees}}</q-toolbar-title>
   </q-toolbar>
  </q-header>
  <q-page-container>
    <q-page class="q-pa-md">
<q-list>
 <q-item>
  <q-item-section><q-item-label caption>{{tags.account}}</q-item-label></q-item-section>
  <q-item-section><q-item-label caption>{{tags.role}}</q-item-label></q-item-section>
  <q-item-section avatar></q-item-section>
 </q-item>
 <q-separator></q-separator>
 <q-item v-for="(e,i) in employees">
  <q-item-section>{{e.account}}</q-item-section>
  <q-item-section>{{roles[e.role].name}}</q-item-section>
  <q-item-section avatar><q-icon name="cancel" @click="rmv_member(i)" color="green"></q-icon></q-item-section>
 </q-item>
</q-list>
<div align="center">
  <q-btn color="primary" icon="person_add" :label="tags.add"
   @click="newEmployee={account:'',role:'',password:'',gid:0};newEmployeeDlg=true"></q-btn>
</div> 
    </q-page>
  </q-page-container>
</q-layout>

<q-dialog v-model="newEmployeeDlg">
 <q-card style="min-width:70vw">
  <q-card-section>
      <div class="text-h6">{{tags.addEmployee}}</div>
  </q-card-section>
  <q-card-section class="q-pt-none">
    <q-item><q-item-section>
     <q-input v-model="newEmployee.account" dense :label="tags.account"></q-input>
    </q-item-section></q-item>
    <q-item><q-item-section>
      <q-select v-model="newEmployee.role" :options="roleOpts" :label="tags.role" emit-value map-options></q-select>
    </q-item-section></q-item>
    <q-item><q-item-section>
     <q-input v-model="newEmployee.password" type="password" :label="tags.pwd" dense></q-input>
    </q-item-section></q-item>
   </q-list>
  </q-card-section>
  <q-card-actions align="right">
     <q-btn flat :label="tags.ok" color="primary" @click="add_member"></q-btn>
     <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
  </q-card-actions>
 </q-card>
</q-dialog>
<component-alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs" :close="tags.close" ref="errMsg"></component-alert-dialog>
`
}