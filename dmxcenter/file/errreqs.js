export default {
inject:['service', 'tags'],
data() {return {
	page:{cur:1, max:0},
    errreqs:[]
}},
created(){
    this.get_errs(1);
},
methods:{
get_errs(pg) {
	var offset=(parseInt(pg)-1)*+this.service.N_PAGE;
    var url="/api/err/list?offset="+offset+"&num="+this.service.N_PAGE
    request({method:"GET",url:url}, this.service.name).then(resp => {
        if(resp.code != RetCode.OK) {
			this.errreqs=[];
            return;
        }
		var cols=resp.data.cols;
		var colNum=cols.length;
		var errs=[];
		var col=0;
		var d=new Date();
        for(var l of resp.data.errs) {
			var err={};
			col=0;
			for(var i=0;i<colNum;i++) {
				err[cols[i]]=l[i];
			}
			d.setTime(err.update_time);
			err['at']=d.toLocaleString();
			errs.push(err);
		}
		this.errreqs=errs;
		this.page.max=Math.ceil(resp.data.total/this.service.N_PAGE);
    })
},

remove(device) {
    request({method:"delete",url:"/api/err/remove?code="+device}, this.service.name).then(resp => {
        if(resp.code != RetCode.OK) {
            this.$refs.errDlg.showErr(resp.code, resp.info);
        } else {
			this.get_errs(this.page.cur);
		}
    })
}
},
template:`
<q-layout view="hHh lpr fFf" container style="height:100vh">
  <q-header elevated>
   <q-toolbar>
    <q-btn flat icon="arrow_back" dense @click="service.go_back"></q-btn>
    <q-toolbar-title>{{tags.homeMenus.err.name}}</q-toolbar-title>
   </q-toolbar>
  </q-header>
<q-page-container>
    <q-page class="q-pa-md">
	
<div class="q-pa-sm flex flex-center" v-if="page.max>1">
 <q-pagination v-model="page.cur" color="primary" :max="page.max" max-pages="10"
  boundary-numbers="false" @update:model-value="get_errs"></q-pagination>
</div>
<q-list separator>
<q-item v-for="er in errreqs">
 <q-item-section>
    <q-item-label>{{er.device}}</q-item-label>
 </q-item-section>
 <q-item-section>{{er.times}}</q-item-section>
 <q-item-section>{{er.at}}</q-item-section>
 <q-item-section side><q-icon name="delete" color="red" @click="remove(er.device)"></q-icon></q-item-section>
</q-item>
</q-list>
    </q-page>
  </q-page-container>
</q-layout>

<component-alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs" :close="tags.close" ref="errDlg"></component-alert-dialog>
`
}