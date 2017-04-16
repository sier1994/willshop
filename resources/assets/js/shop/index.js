import Vue from 'vue';
import VueRouter from 'vue-router';
import WeVue from 'we-vue';
import 'we-vue/lib/style.css';
import '../../sass/shop.scss';
import axios from 'axios';
import VueAxios from 'vue-axios';
import store from './store/index';
import appConfig from './config';  // 配置
import routes from './route/index.js';

Vue.use(VueRouter);
Vue.use(WeVue);
Vue.use(VueAxios, axios);

const router = new VueRouter({
  mode: 'history',
  base: '/shop/',
  routes
});

router.beforeEach((to, from, next) => {
  store.commit('UPDATE_LOADING', true);

  store.commit('UPDATE_MAINMENU_VISIBLE', !to.meta.hideMainmenu);

  if (to.matched.some(record => record.meta.auth) && !window.localStorage.getItem(appConfig.jwtTokenName)) {
    // 需要登录后访问的页面，redirect 参数用于登录完成后跳转
    next({
      path: '/login',
      query: {redirect: to.fullPath}
    });
  }

  next();
});

router.afterEach((to, from) => {
  // 动态设置页面标题
  document.title = to.meta.title || 'willshop';

  store.commit('UPDATE_LOADING', false);
});

axios.defaults.baseURL = appConfig.apiRoot;
axios.defaults.timeout = appConfig.timeout;

// axios 请求发送前处理
axios.interceptors.request.use((config) => {
  store.commit('UPDATE_LOADING', true);

  let token = window.localStorage.getItem(appConfig.jwtTokenName);
  config.headers.Authorization = 'bearer ' + token;

  return config;
}, (error) => {
  return Promise.reject(error);
});

// axios 得到响应后处理
axios.interceptors.response.use((response) => {
  store.commit('UPDATE_LOADING', false);

  const newToken = response.headers.authorization;
  if (newToken) {
    window.localStorage.setItem(appConfig.jwtTokenName, newToken.replace('bearer ', ''));
  }

  return response;
}, (error) => {
  store.commit('UPDATE_LOADING', false);

  if (error.response) {
    if (error.response.status === 401) {
      window.localStorage.removeItem(appConfig.jwtTokenName);

      router.push('/login');
    } else if (error.response.status === 403) {
      // 无权限时统一提示
      app.error('无操作权限');
      return;
    }
  } else {
    // 请求超时提示
    if (error.code === 'ECONNABORTED') {
      app.error('网络超时，请重试');
    }
  }

  return Promise.reject(error);
});

import {mapState} from 'vuex';

const app = new Vue({
  // 路由器
  router,

  // vuex store
  store,

  components: {
    'mainmenu': require('./components/mainmenu.vue')
  },

  computed: {
    ...mapState({
      isLoading: state => state.isLoading,
      isMainMenuVisible: state => state.isMainMenuVisible
    })
  },

  methods: {
    success (message) {
      WeVue.Toast(message);
    },

    error (message, duration) {
      WeVue.Toast({
        duration: duration,
        message: message,
        icon: 'warn'
      });
    }
  },

  watch: {
    'isLoading': (value) => {
      if (value) {
        WeVue.Indicator.open('loading');
      } else {
        WeVue.Indicator.close();
      }
    }
  }
}).$mount('#app');
