export default {
inject:['service', 'tags'],
data() {return {
    creditCode:"",
    companyName:"",
    location:"",
    cid:"",
    dnsAccessCode:"",
    qrCodeDlg:false,
    width:'60vw'
}},
created(){
    var w=document.documentElement.clientWidth;
    var h=document.documentElement.clientHeight;
    if(w>h) {
        this.width=parseInt(h*0.6);
    }else{
        this.width=parseInt(w*0.6);
    }
    this.init();
},
methods:{
init() {
    this.creditCode=Server.creditCode();
    this.companyName=Server.companyName();
    this.cid=Server.companyId();
    this.location=Server.location();
    this.dnsAccessCode=Server.getDnsAccessCode();
},
register(){
    this.$refs.regDlg.show(()=>{
        this.init()
    });
},
resetAccessCode() {
    this.dnsAccessCode = Server.resetDnsAccessCode();
},
showQrCode() {
    var txt = JSON.stringify({
       act:'checkin',
       id:this.cid,
       code:this.dnsAccessCode,
       addr:Server.address()
    });
    new QRCode(this.$refs.qrCodeArea, {
        text: txt, 
        width: this.width,
        height: this.width,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });
},
jump(pg) {
    this.$router.push('/' + pg)
}
},

template: `
<q-layout view="lHh lpr lFf" container style="height:100vh" v-cloak>
<q-header elevated>
   <q-toolbar>
      <q-avatar square><q-icon name="settings"></q-icon></q-avatar>
      <q-toolbar-title>{{tags.settings}}</q-toolbar-title>
      <q-btn round dense flat icon="bug_report" @click="jump('debug')"></q-btn>
   </q-toolbar>
</q-header>
<q-page-container>
 <q-page>
<q-markup-table bordered="false" flat>
 <tr>
   <td>{{tags.creditCode}}</td>
   <td>{{creditCode}}</td>
 </tr>
 <tr>
   <td>{{tags.companyName}}</td>
   <td>{{companyName}}</td>
 </tr>
 <tr>
   <td>{{tags.address}}</td>
   <td>{{location}}</td>
 </tr>
 <tr>
   <td>{{tags.companyId}}</td>
   <td>{{cid}}</td>
 </tr>
 <tr>
   <td>{{tags.dnsAccessCode}}</td>
   <td>
      {{dnsAccessCode}}
      <q-icon name="refresh" class="q-ml-md" color="primary" @click="resetAccessCode" size="1.5em"></q-icon>
   </td>
 </tr>
 <tr v-show="cid>0">
   <td>{{tags.advanced}}</td>
   <td @click="jump('advanced')">{{tags.remoteAccess}}/{{tags.backup}}
      <q-icon name="miscellaneous_services" color="primary"
       size="2em" class="q-ml-md"></q-icon>
   </td>
 </tr>
 <tr>
   <td>
    <q-icon name="qr_code_2" @click="qrCodeDlg=true" size="2.5em" color="primary"></q-icon>
   </td>
   <td>
    <q-btn icon="beenhere" :label="cid?tags.reRegister:tags.register" @click="register" color="primary"></q-btn>
   </td>
 </tr>
</q-markup-table>
 </q-page>
</q-page-container>
</q-layout>
<q-dialog v-model="qrCodeDlg" @show="showQrCode">
  <q-card :style="{'min-width':width+'px'}" bordered><q-card-section>
   <div ref="qrCodeArea" :style="{width:width+'px',height:width+'px'}"></div>
  </q-card-section></q-card>
</q-dialog>
<register-dialog :title="tags.register" :tags="tags" ref="regDlg"></register-dialog>
`
}