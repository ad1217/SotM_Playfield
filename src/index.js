import Vue from 'vue';
import VueRouter from 'vue-router';
import VueHeadful from 'vue-headful';

import App from './App.vue';
import DeckIndex from './DeckIndex.vue';
import Editor from './Editor.vue';
import Err404 from './404.vue';

Vue.use(VueRouter);
Vue.component('headful', VueHeadful);

const router = new VueRouter({
  mode: 'history',
  routes: [
    { path: '/', component: DeckIndex },
    { path: '/edit/:deckID', component: Editor, props: true },
    { path: '*', component: Err404 },
  ],
});

new Vue({
  el: '#charSheet',
  render: h => h(App),
  router,
});
