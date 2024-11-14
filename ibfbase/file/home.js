import IBF from './ibf.js'
export default {
inject:['service', 'tags'],
components: { // 局部注册组件
    'ibf':IBF
},
data() {return {
}},
created(){
},
methods:{
},

template:`
<ibf></ibf>
`
}