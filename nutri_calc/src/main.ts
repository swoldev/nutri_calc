import './assets/main.css'

import { createApp } from 'vue';
import ToastService from 'primevue/toastservice';
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';

import App from './App.vue';

const app = createApp(App);
app.use(ToastService);
app.use(PrimeVue, {
    theme: {
        preset: Aura
    }
});

app.mount('#app');
