import Vue from 'vue';
import VueRouter from 'vue-router';

import App from './App.vue';
import DeckIndex from './DeckIndex.vue';
import Editor from './Editor.vue';

Vue.use(VueRouter);

const router = new VueRouter({
  routes: [
    {path: '/', component: DeckIndex},
    {path: '/edit/:deckName', component: Editor, props: true},
  ],
});

new Vue({
  el: '#charSheet',
  render: h => h(App),
  router,
});
