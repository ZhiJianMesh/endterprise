import supplierSelector from './components/supplier_selector.js';
import categorySelector from './components/category_selector.js';

export default {
inject:['tags','service'],
components:{supplierSelector,categorySelector},
data(){return{
  products:[],
  ctrl:{cur:1,max:0,search:''},
  showDialog:false,
  isEdit:false,
  form:{id:null,name:'',category:{id:null,name:''},price:0,costPrice:0,stock:0,minStock:10,unit:'件',supplier:{id:null,name:''},remark:''}
}},

created(){
  this.query(1);
},

methods:{
  query(pg){
    this.ctrl.cur=pg;
    var url="/api/product/list?page="+pg+"&pageSize="+this.service.PAGE_SIZE;
    request({method:"GET",url:url},this.service.name).then(resp=>{
      if(resp.code!=RetCode.OK) {
        this.products=[];
        this.ctrl.max=0;
        return
      };
      this.products=resp.data.list||[];
      this.ctrl.max=Math.ceil(resp.data.total/this.service.PAGE_SIZE);
    });
  },

  search(){
    if(this.ctrl.search==''){
      return;
    }
    var url="/api/product/search?keyword="+encodeURIComponent(this.ctrl.search);
    request({method:"GET",url:url},this.service.name).then(resp=>{
      this.ctrl.max=1;
      if(resp.code!=RetCode.OK) {
        this.products=[];
        return;
      }
      this.products=resp.data.list||[];
    });
  },

  resetSearch(){
    this.ctrl.search='';
    this.query(1);
  },

  showAdd(){
    this.isEdit=false;
    this.form={id:null,name:'',category:{id:null,name:''},price:0,costPrice:0,stock:0,minStock:10,unit:'件',supplier:{id:null,name:''},remark:''};
    this.showDialog=true;
  },

  editProduct(row){
    this.isEdit=true;
    this.form={
      id:row.id,
      name:row.name,
      category:{id:row.categoryId,name:row.categoryName||''},
      price:row.price,
      costPrice:row.costPrice,
      stock:row.stock,
      minStock:row.minStock,
      unit:row.unit,
      supplier:{id:row.supplierId,name:row.supplierName||''},
      remark:row.remark||''
    };
    this.showDialog=true;
  },

  saveProduct(){
    var data={
      id:this.form.id,
      name:this.form.name,
      category:this.form.category.id,
      price:this.form.price,
      costPrice:this.form.costPrice,
      stock:this.form.stock,
      minStock:this.form.minStock,
      unit:this.form.unit,
      supplier:this.form.supplier.id,
      remark:this.form.remark
    };
    var url=this.isEdit?'/api/product/update':'/api/product/create';
    var method=this.isEdit?'PUT':"POST";
    request({method:method,url:url,data:data},this.service.name).then(resp=>{
      if(resp.code!=RetCode.OK){
        this.$refs.errMsg.showErr(resp.code,resp.info);
        return;
      }
      this.showDialog=false;
      this.query(this.ctrl.max);
    });
  },

  deleteProduct(id){
    request({method:"DELETE",url:"/api/product/delete?id="+id},this.service.name).then(resp=>{
      if(resp.code!=RetCode.OK){
        this.$refs.errMsg.showErr(resp.code,resp.info);
        return;
      }
      this.query(this.ctrl.cur);
    });
  }
},

template:`
<q-layout view="lHh lpr lFf" container style="height:100vh">
<q-header elevated class="bg-primary text-white">
  <q-toolbar>
    <q-btn flat icon="arrow_back" @click="$router.push('/home')"></q-btn>
    <q-toolbar-title>{{tags.products}}</q-toolbar-title>
  </q-toolbar>
</q-header>

<q-footer class="bg-white q-pa-md">
  <q-input outlined v-model="ctrl.search" :label="tags.search" dense @keyup.enter="search">
    <template v-slot:append>
      <q-icon v-if="ctrl.search!==''" name="close" @click="resetSearch" class="cursor-pointer"></q-icon>
      <q-icon name="search" @click="search"></q-icon>
    </template>
    <template v-slot:after>
      <q-btn round color="primary" icon="add_circle" @click="showAdd"></q-btn>
    </template>
  </q-input>
</q-footer>

<q-page-container>
<q-page padding>
  <!-- 商品管理区域 -->
  <div class="row items-center q-mb-md">
    <div class="text-h5">{{tags.products}}</div>
    <q-space></q-space>
    <q-btn color="primary" icon="add" :label="tags.addProduct" @click="showAdd"></q-btn>
  </div>

  <!-- 商品列表 -->
  <q-table :rows="products" :columns="[
    {name:'name',label:tags.productName,field:'name'},
    {name:'categoryName',label:tags.category,field:'categoryName'},
    {name:'price',label:tags.price,field:'price'},
    {name:'costPrice',label:tags.costPrice,field:'costPrice'},
    {name:'stock',label:tags.stock,field:'stock'},
    {name:'unit',label:tags.unit,field:'unit'},
    {name:'action',label:tags.operation,field:'action'}
  ]" row-key="id" flat hide-bottom>
    <template v-slot:body-cell-stock="props">
      <q-td :props="props">
        <span :class="{'text-negative':props.row.stock<=props.row.minStock}">{{props.row.stock}}</span>
      </q-td>
    </template>
    <template v-slot:body-cell-action="props">
      <q-td :props="props">
        <q-btn flat dense color="primary" icon="edit" @click="editProduct(props.row)"></q-btn>
        <q-btn flat dense color="negative" icon="delete" @click="deleteProduct(props.row.id)"></q-btn>
      </q-td>
    </template>
  </q-table>

  <!-- 分页 -->
  <div class="row justify-center q-mt-md" v-if="ctrl.max>1">
    <q-pagination v-model="ctrl.cur" :max="ctrl.max" :max-pages="10" @update:model-value="query"></q-pagination>
  </div>

  <!-- 添加/编辑商品对话框 -->
  <q-dialog v-model="showDialog" persistent>
    <q-card style="min-width:500px">
      <q-card-section><div class="text-h6">{{isEdit?tags.editProduct:tags.addProduct}}</div></q-card-section>
      <q-card-section class="q-pt-none">
        <q-input v-model="form.name" :label="tags.productName" outlined dense required></q-input>
        <category-selector v-model="form.category" :serviceName="service.name"
        :label="tags.category" class="q-mt-sm"></category-selector>
        <div class="row q-col-gutter-sm q-mt-sm">
          <div class="col"><q-input v-model.number="form.price" :label="tags.price" type="number" outlined dense></q-input></div>
          <div class="col"><q-input v-model.number="form.costPrice" :label="tags.costPrice" type="number" outlined dense></q-input></div>
        </div>
        <div class="row q-col-gutter-sm q-mt-sm">
          <div class="col"><q-input v-model.number="form.stock" :label="tags.stock" type="number" outlined dense></q-input></div>
          <div class="col"><q-input v-model.number="form.minStock" :label="tags.minStock" type="number" outlined dense></q-input></div>
        </div>
        <q-input v-model="form.unit" :label="tags.unit" outlined dense class="q-mt-sm"></q-input>
        <supplier-selector v-model="form.supplier" :serviceName="service.name"
         :label="tags.supplier" class="q-mt-sm"></supplier-selector>
        <q-input v-model="form.remark" :label="tags.remark" type="textarea" outlined dense class="q-mt-sm"></q-input>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat :label="tags.cancel" color="grey" v-close-popup></q-btn>
        <q-btn unelevated :label="tags.save" color="primary" @click="saveProduct"></q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <component-alert-dialog ref="errMsg"></component-alert-dialog>
</q-page>
</q-page-container>
</q-layout>
`
}
