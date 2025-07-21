import {encodeExt,decodeExt} from '/assets/v3/settings/config.js';

export default {
inject:['service', 'tags'],
data() {return {
    id:this.$route.query.id,
    app:this.$route.query.app,
    dtl:{},
    ext:[],
    pwd:{val:'',dlg:false},
    baseChged:false,
    roleNames:{},
    serviceNames:{}
}},
created(){
    this.service.get_services().then(resp=>{
        if(resp.hasOwnProperty('code')) {
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
        this.dtl=resp.data;//account,nickName,mobile,email,loginTime,createAt,birthday,sex,powers[],groups[]
        var dt = new Date(this.dtl.loginTime);
        this.dtl['loginAt']=datetime2str(dt);
        dt.setTime(this.dtl.createAt?this.dtl.createAt:0)//老版本没有此字段
        this.dtl['createAt']=datetime2str(dt);
        dt.setTime(this.dtl.birthday?this.dtl.birthday*86400000:0)
        
        this.dtl['sBirthday']=date2str(dt);
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
        })        
    })
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
        this.pwd.val=resp.data.newPwd;
        this.pwd.dlg=true;
    })
},
save_baseinfo() {
    var opts={method:"POST",url:"/api/user/setBaseInfo",
        data:{
            uid:this.id,
            nickName:this.dtl.nickName,
            mobile:this.dtl.mobile,
            email:this.dtl.email,
            sex:this.dtl.sex,
            type:this.dtl.type,
            birthday:this.dtl.birthday
        }
    }
    request(opts, this.service.name).then(resp => {
        if(resp.code != RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
        } else {
            this.baseChged=false;
        }
    })
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
},
birthChged(v){
    var dt = Date.parse(v);
    this.dtl.birthday=Math.ceil(dt/86400000);
    this.baseChged=true;
},
get_user_tmpl() {
    var tmpl=this.service.getRt("tmpl",{});
    if(Object.keys(tmpl).length>0) {
        return new Promise(resolve=>{
            resolve(tmpl);
        })
    }
    var url="/user/getAppExtTmpl?service=" + this.app;
    return request({method:"GET", url:url}, this.service.name).then(resp=>{
        if(resp.code!=RetCode.OK) {
            return {};
        }
        this.service.setRt("tmpl", resp.data.template);
        return resp.data.template;
    })
},
get_user_ext() {
    if(!this.app)return;
    this.get_user_tmpl().then(tmpl=>{
        var url="/user/getAppExt?service=" + this.app+"&uid="+this.id;
        return request({method:"GET", url:url}, this.service.name).then(resp=>{
            if(resp.code!=RetCode.OK) {
                this.ext=decodeExt("{}", tmpl);
            } else {
                this.ext=decodeExt(resp.data.ext, tmpl);
            }
        })
    })
},
show_ext() {
    if(this.ext.length>0)return;
    this.get_user_ext();
},
save_ext() {
    var ext=encodeExt(this.ext);
    var dta={service:this.app,val:ext,uid:this.id};
    return request({method:"POST", url:"/user/setAppExt", data:dta}, this.service.name).then(resp=>{
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
        }
    })
}
},
template:`
<q-layout view="hHh lpr fFf">
  <q-header elevated>
   <q-toolbar>
    <q-btn flat round icon="arrow_back" dense @click="service.go_back"></q-btn>
    <q-toolbar-title>{{tags.app_name}}</q-toolbar-title>
    <q-btn flat icon="save" v-show="baseChged" @click="save_baseinfo" :label="tags.save"></q-btn>
    <q-btn flat :icon="dtl.status" @click="switch_active" :label="tags.user.status"></q-btn>
    <q-btn flat icon="lock_reset" v-if="id!=1" @click="reset_pwd" :label="tags.user.resetPwd"></q-btn>
   </q-toolbar>
  </q-header>
  <q-page-container>
    <q-page class="q-pa-md">
<q-markup-table flat>
 <tr>
  <th class="text-left">{{tags.user.account}}</th>
  <td>{{dtl.account}}</td>
 </tr>
 <tr>
  <th class="text-left">{{tags.user.nickName}}</th>
  <td>{{dtl.nickName}}
   <q-popup-edit v-model="dtl.nickName" auto-save v-slot="scope" @save="baseChged=true">
      <q-input v-model="scope.value" dense autofocus counter maxlength=80></q-input>
   </q-popup-edit>
  </td>
 </tr>
 <tr>
  <th class="text-left">{{tags.user.sex}}</th>
  <td>
   <q-option-group v-model="dtl.sex" :options="tags.user.sexOpts" inline dense
    color="primary" @update:model-value="baseChged=true"></q-option-group>
  </td>
 </tr>
 <tr>
  <th class="text-left">{{tags.user.type}}</th>
  <td>
   <q-option-group v-model="dtl.type" :options="tags.user.typeOpts" inline dense
    color="primary" @update:model-value="baseChged=true"></q-option-group>
  </td>
 </tr>
 <tr>
  <th class="text-left">{{tags.user.birthday}}</th>
  <td>
   <component-date-input v-model="dtl.sBirthday"
    max="today" min="1900/1/1" @update:modelValue="birthChged"
    class="text-primary"></component-date-input>
  </td>
 </tr>
 <tr>
  <th class="text-left">{{tags.user.mobile}}</th>
  <td>{{dtl.mobile}}
   <q-popup-edit v-model="dtl.mobile" auto-save v-slot="scope" @save="baseChged=true">
    <q-input v-model="scope.value" dense autofocus counter
    :rules="[v=>/^1[0-9]{10}$/.test(v)||tags.mobilePls]" maxlength=11></q-input>
   </q-popup-edit>
  </td>
 </tr>
 <tr>
  <th class="text-left">{{tags.user.email}}</th>
  <td>{{dtl.email}}
   <q-popup-edit v-model="dtl.email" auto-save v-slot="scope" @save="baseChged=true">
    <q-input v-model="scope.value" dense autofocus counter
     :rules="[v=>/^.+@.+$/.test(v)||tags.emailPls]" maxlength=100></q-input>
   </q-popup-edit>
  </td>
 </tr>
 <tr>
  <th class="text-left">{{tags.user.loginAt}}</th>
  <td>{{dtl.loginAt}}</td>
 </tr>
 <tr>
  <th class="text-left">{{tags.user.createAt}}</th>
  <td>{{dtl.createAt}}</td>
 </tr>
</q-markup-table>

<q-list dense separator>
<q-separator></q-separator>
<q-expansion-item icon="extension" :label="tags.user.serviceExt"
 header-class="text-accent" v-if="app" @before-show="show_ext">
 <q-markup-table flat>
 <tr v-for="e in ext">
  <th class="text-left">{{e.n}}</th>
  <td>{{e.v}}</td>
  <q-popup-edit v-model="e.v" auto-save v-slot="scope" @save="save_ext">
   <div v-if="e.t=='d'">
    <component-date-input :close="tags.ok" :label="e.n"
     v-model="scope.value"></component-date-input>
   </div>
   <div v-else-if="e.t=='b'">
    <q-checkbox v-model="scope.value" :label="e.n" left-label></q-checkbox>
   </div>
   <div v-else>
    <q-input borderless :label="e.n" v-model="scope.value" dense
    :autogrow="e.t!='n'" :type="e.t=='n'?'number':'textarea'"></q-input>
   </div>
  </q-popup-edit>
 </tr>
 </q-markup-table>
</q-expansion-item>

<q-expansion-item icon="list" :label="tags.user.power"
 header-class="text-secondary">
 <q-markup-table flat>
 <tr>
  <th class="text-left">{{tags.power.service}}</th>
  <th>{{tags.power.role}}</th>
  <th>{{tags.power.ext}}</th>
  <th></th>
 </tr>
 <tr v-for="(p,i) in dtl.powers">
  <th class="text-left">{{serviceNames[p.service]}}</th>
  <td>{{p.role}}</td>
  <td>{{p.power}}</td>
  <td class="text-right">
   <q-icon name="clear" @click="remove_power(p.service,i)" color="red"></q-icon>
  </td>
 </tr>
 </q-markup-table>
</q-expansion-item>
</q-list>
    </q-page>
  </q-page-container>
</q-layout>

<q-dialog v-model="pwd.dlg">
  <q-card style="min-width:40vw;">
    <q-card-section>
      <div class="text-h6">{{tags.user.pwd}}</div>
    </q-card-section>
    <q-card-section>{{tags.user.pwdReseted}}</q-card-section>
    <q-card-section>{{pwd.val}}</q-card-section>
    <q-card-actions align="right">
      <q-btn flat :label="tags.user.resetPwd" color="secondary" @click="reset_pwd"></q-btn>
      <q-btn :label="tags.close" color="primary" flat v-close-popup></q-btn>
    </q-card-actions>
  </q-card>
</q-dialog>

<component-alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs" ref="errMsg"></component-alert-dialog>
`
}