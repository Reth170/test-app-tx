import axios from "axios";
import Router from "react-router";

const BASE_URL = "http://127.0.0.1:8081/oc-sys";

axios.defaults.timeout = 5000; // 超时时间设置
axios.defaults.withCredentials = true; // true允许跨域
axios.defaults.baseURL = BASE_URL;
// Content-Type 响应头
axios.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded;charset=UTF-8";

axios.interceptors.request.use(config => {
  const sessionId = localStorage.getItem('JSESSIONID');
  if (sessionId) {
    config.headers['Cookie'] = `JSESSIONID=${sessionId}`;
  }
  return config;
});
// 响应拦截器

axios.interceptors.response.use(response => {
  // 保存 session ID
  const setCookieHeader = response.headers['set-cookie'];
  if (setCookieHeader) {
    const sessionCookie = setCookieHeader.find(cookie => 
      cookie.includes('JSESSIONID')
    );
    
    if (sessionCookie) {
      const sessionId = sessionCookie.split(';')[0].split('=')[1];
      localStorage.setItem('JSESSIONID', sessionId);
    }
  }
  
  return response;
}, error => {
  return Promise.reject(error);
});

axios.interceptors.response.use(
  (response) => {
    // 如果返回的状态码为200，说明接口请求成功，可以正常拿到数据
    // 否则的话抛出错误
    if (response.status === 200) {
      return Promise.resolve(response);
    } else {
      return Promise.reject(response);
    }
  },
  // 服务器状态码不是2开头的的情况
/** 
  (error) => {
    if (error.response.status) {
      switch (error.response.status) {
        // 401: 未登录
        case 401:
          Router.require({
            path: "/",
            query: {
              // redirect: router.currentRoute.fullPath
            },
          });
          break;
        case 403:
          // console.log('管理员权限已修改请重新登录')
          // 跳转登录页面，并将要浏览的页面fullPath传过去，登录成功后跳转需要访问的页面
          setTimeout(() => {
            Router.replace({
              path: "/",
              query: {
                // redirect: router.currentRoute.fullPath
              },
            });
          }, 1000);
          break;

        // 404请求不存在
        case 404:
          // console.log('请求页面飞到火星去了')
          break;
      }
      return Promise.reject(error.response);
    }
  }

*/
);

export function getBaseURL() {
  return BASE_URL;
}

/**
 * 封装get方法
 * @param url
 * @param data
 * @returns {Promise}
 */
export function get(url: string, params?: object) {
  return new Promise((resolve, reject) => {
    axios.get(url, params).then(
      (response) => resolve(response.data),
      (error) => reject(error)
    );
  });
}

/**
 * 封装post请求
 * @param url
 * @param data
 * @returns {Promise}
 */
export function post(url: string, data = {}) {
  return new Promise((resolve, reject) => {
    axios.post(url, data).then(
      (response) => resolve(response.data),
      (error) => reject(error)
    );
  });
}

/**
 * 封装delete请求
 * @param url
 * @param data
 * @returns {Promise}
 */
export function deletes(url: string, data = {}) {
  return new Promise((resolve, reject) => {
    axios.delete(url, data).then(
      (response) => resolve(response.data),
      (error) => reject(error)
    );
  });
}

/**
 * 封装put请求
 * @param url
 * @param data
 * @returns {Promise}
 */
export function put(url: string, data = {}) {
  return new Promise((resolve, reject) => {
    axios.put(url, data).then(
      (response) => resolve(response.data),
      (error) => reject(error)
    );
  });
}
