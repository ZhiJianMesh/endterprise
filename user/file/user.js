export default {
inject:['service', 'tags'],
data() {return {
    id:this.$route.query.id,
    dtl:{},
    infos:[],
    newPwd:'',
    baseChged:false,
    roleNames:{},
    serviceNames:{}
}},
created(){
    this.service.get_services().then(resp=>{
        if(resp['code']) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.serviceNames=resp.names;
        this.detail();
    })
},
methods:{
detail() {
    var url="/api/user/getbaseInfo?uid="+this.id;
    request({method:"GET", url:url}, this.service.name).then(resp=>{
        if(resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.dtl=resp.data;//account,nickName,mobile,email,loginTime,powers[],groups[]
        var dt = new Date(this.dtl.loginTime);
        this.dtl['loginAt']=dt.toLocaleString();
        this.dtl['status']=this.dtl.ustatus=='N'?'person':'person_off';
        this.dtl.powers=resp.data.powers.map(p => {
            var pn='';
            if(p.power && p.power.length>=2) {
                var t=JStr.base64CharCode(p.power.charAt(0));
                var v=JStr.base64CharCode(p.power.charAt(1));
                if(t == 0 && v == 1) { //当前只有一个权限
                    pn=this.tags.power.pubAccess;
                }
            }
            return {service:p.service,role:p.role,power:pn}//service,role,power
        });
        
    });
},
switch_active(){
    var url=this.dtl.ustatus=='N' ? "/api/user/deactive" : "/api/user/active";
    var opts={method:"POST",url:url,data:{uid:this.id}};
    request(opts, this.service.name).then(resp => {
        if(resp.code != RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.dtl.ustatus=this.dtl.ustatus=='N'?'L':'N';
        this.dtl.status=this.dtl.ustatus=='N'?'person':'person_off';
    });
},
reset_pwd() {
    var opts={method:"POST",url:"/api/user/resetPwd",data:{uid:this.id}};
    request(opts, this.service.name).then(resp => {
        if(resp.code != RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.newPwd=resp.data.newPwd;
    });
},
save_baseinfo() {
    var opts={method:"POST",url:"/api/user/setBaseInfo",
        data:{uid:this.id,nickName:this.dtl.nickName,
        mobile:this.dtl.mobile, email:this.dtl.email}};
    request(opts, this.service.name).then(resp => {
        if(resp.code != RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
        } else {
            this.baseChged=false;
        }
    });
},
remove_member(gid,i) {
    var opts={method:"DELETE",url:"/api/member/remove?uid="+ this.id +"&gid="+ gid};
    request(opts, this.service.name).then(resp => {
        if(resp.code != RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
        } else {
            this.dtl.groups.splice(i, 1);
        }
    });
},
remove_power(service,i) {
    var opts={method:"DELETE",url:"/power/remove?uid="+this.id+"&service=" + service};
    request(opts, this.service.name).then(resp=>{
        if(resp.code != RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
        } else {
            this.dtl.powers.splice(i, 1);
        }
    });
}
},
template:`
<q-layout view="lHh lpr lFf" container style="height:100vh">
  <q-header elevated>
   <q-toolbar>
      <q-btn flat round icon="arrow_back" dense @click="service.go_back"></q-btn>
      <q-toolbar-title>{{tags.app_name}}</q-toolbar-title>
   </q-toolbar>
  </q-header>
  <q-page-container>
    <q-page class="q-pa-md">
<q-list dense>
 <q-item>
  <q-item-section><q-item-label caption>{{tags.user.account}}</q-item-label></q-item-section>
  <q-item-section>{{dtl.account}}</q-item-section>
 </q-item>
 <q-item>
  <q-item-section><q-item-label caption>{{tags.user.nickName}}</q-item-label></q-item-section>
  <q-item-section>{{dtl.nickName}}
   <q-popup-edit v-model="dtl.nickName" auto-save v-slot="scope" @save="baseChged=true">
      <q-input v-model="scope.value" dense autofocus counter maxlength=80></q-input>
   </q-popup-edit>
  </q-item-section>
 </q-item>
 <q-item>
  <q-item-section><q-item-label caption>{{tags.user.mobile}}</q-item-label></q-item-section>
  <q-item-section>{{dtl.mobile}}
   <q-popup-edit v-model="dtl.mobile" auto-save v-slot="scope" @save="baseChged=true">
      <q-input v-model="scope.value" dense autofocus counter
      :rules="[v=>/^1[0-9]{10}$/.test(v)||tags.mobilePls]" maxlength=11></q-input>
   </q-popup-edit>
  </q-item-section>
 </q-item>
 <q-item>
  <q-item-section><q-item-label caption>{{tags.user.email}}</q-item-label></q-item-section>
  <q-item-section>{{dtl.email}}
   <q-popup-edit v-model="dtl.email" auto-save v-slot="scope" @save="baseChged=true">
      <q-input v-model="scope.value" dense autofocus counter
      :rules="[v=>/^.+@.+$/.test(v)||tags.emailPls]" maxlength=100></q-input>
   </q-popup-edit>
  </q-item-section>
 </q-item>
 <q-item>
  <q-item-section><q-item-label caption>{{tags.user.loginAt}}</q-item-label></q-item-section>
  <q-item-section>{{dtl.loginAt}}</q-item-section>
 </q-item>
 <q-item>
  <q-item-section><q-item-label caption>{{tags.user.pwd}}</q-item-label></q-item-section>
  <q-item-section class="text-red">{{newPwd}}</q-item-section>
 </q-item>
</q-list>
<div class="text-right">
 <q-chip clickable color="primary" text-color="white" icon="save" v-show="baseChged"  @click="save_baseinfo">{{tags.save}}</q-chip>
 <q-chip clickable color="orange" text-color="white" :icon-right="dtl.status" @click="switch_active">{{tags.user.status}}</q-chip>
 <q-chip clickable color="orange" text-color="white" icon-right="lock_reset" @click="reset_pwd">{{tags.user.resetPwd}}</q-chip>
</div>
<q-banner dense class="q-mb-sm text-dark bg-blue-grey-1">
{{tags.user.groups}}
</q-banner>
<q-list dense>
 <q-item>
  <q-item-section><q-item-label caption>{{tags.grp.name}}</q-item-label></q-item-section>
  <q-item-section><q-item-label caption>{{tags.grp.title}}</q-item-label></q-item-section>
  <q-item-section thumbnail><q-item-label caption></q-item-label></q-item-section>
 </q-item>
 <q-item v-for="(g,i) in dtl.groups">
  <q-item-section>{{g.name}}</q-item-section>
  <q-item-section>{{g.title}}</q-item-section>
  <q-item-section thumbnail><q-icon name="clear" @click="remove_member(g.id,i)" color="red"></q-icon></q-item-section>
 </q-item>
</q-list>
<q-banner dense class="q-mb-sm text-dark bg-blue-grey-1">
{{tags.user.power}}
</q-banner>
<q-list dense>
 <q-item>
  <q-item-section><q-item-label caption>{{tags.power.service}}</q-item-label></q-item-section>
  <q-item-section><q-item-label caption>{{tags.power.role}}</q-item-label></q-item-section>
  <q-item-section><q-item-label caption>{{tags.power.ext}}</q-item-label></q-item-section>
  <q-item-section thumbnail><q-item-label caption></q-item-label></q-item-section>
 </q-item>
 <q-item v-for="(p,i) in dtl.powers">
  <q-item-section>{{serviceNames[p.service]}}</q-item-section>
  <q-item-section>{{p.role}}</q-item-section>
  <q-item-section>{{p.power}}</q-item-section>
  <q-item-section thumbnail><q-icon name="clear" @click="remove_power(p.service,i)" color="red"></q-icon></q-item-section>
 </q-item>
</q-list>
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
     <q-input v-model="newEmployee.account" dense :label="tags.user.account"></q-input>
    </q-item-section></q-item>
    <q-item><q-item-section>
      <q-select v-model="newEmployee.role" :options="roleOpts" :label="tags.power.role" emit-value map-options></q-select>
    </q-item-section></q-item>
    <q-item><q-item-section>
     <q-input v-model="newEmployee.password" type="password" :label="tags.user.pwd" dense></q-input>
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