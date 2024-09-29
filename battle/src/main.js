import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { Quasar } from 'quasar'
// Import icon libraries
import '@quasar/extras/material-icons/material-icons.css'

// Import Quasar css
import 'quasar/src/css/index.sass'

const myapp=createApp(App)


myapp.use(Quasar, {
    plugins: {}, // import Quasar plugins and add here
  })


myapp.mount('#app')
