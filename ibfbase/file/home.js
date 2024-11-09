import IBFHome from './ibfhome.js'
export default {
inject:['service', 'tags'],
components: { // 局部注册组件
    'ibf-home':IBFHome
},
data() {return {
}},
created(){
},
methods:{
},

template:`
<ibf-home></ibf-home>
`
}