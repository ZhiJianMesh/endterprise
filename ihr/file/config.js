export default {
inject:['tags','service'],
data() {return {
}},
created(){
},
methods:{
back() {
    this.$router.back();
}
},

template:`
<div @click="service.go_back">back<div>
<div>my</div>
`
}