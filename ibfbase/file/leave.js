export default {
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
<div @click="back">back<div>
<div>leave</div>
`
}