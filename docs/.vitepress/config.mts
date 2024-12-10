import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Vnite',
  description: 'A Game Management Software',
  head: [['link', { rel: 'icon', href: '/icon.png' }]],
  cleanUrls: true,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: '/icon.png',

    search: {
      provider: 'local'
    },

    nav: [
      { text: '主页', link: '/' },
      { text: '软件指南', link: '/guide/what-is-vnite' }
    ],

    sidebar: [
      {
        text: '简介',
        items: [
          { text: '什么是 Vnite?', link: '/guide/what-is-vnite' },
          { text: '快速开始', link: '/guide/getting-started' }
        ]
      },
      {
        text: '基本',
        items: [
          { text: '添加游戏', link: '/guide/adding-games' },
          { text: '从第三方导入', link: '/guide/importing-games' },
          { text: '元数据', link: '/guide/metadata' },
          { text: '云同步', link: '/guide/cloud-sync' },
          { text: '存档', link: '/guide/archive' },
          { text: '备份', link: '/guide/backup' },
          { text: '联动', link: '/guide/linkage' }
        ]
      },
      {
        text: '高级',
        items: [
          { text: '自定义主题', link: '/guide/custom-theme' },
          { text: '链接唤醒', link: '/guide/link-wakeup' },
          { text: '启动器', link: '/guide/launcher' }
        ]
      },
      {
        text: '其它',
        items: [{ text: '从 v1 迁移', link: '/guide/migration-from-v1' }]
      }
    ],

    socialLinks: [{ icon: 'github', link: 'https://github.com/ximu3/vnite' }],

    footer: {
      message:
        'Powered by <a target="_blank" href="https://vitepress.dev">VitePress</a> & Released under the <a target="_blank" href="https://www.gnu.org/licenses/gpl-3.0.html">GPL3 License</a>.',
      copyright:
        'Copyright © 2024-present <a target="_blank" href="https://github.com/ximu3">ximu</a>'
    }
  }
})
