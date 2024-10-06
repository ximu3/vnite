import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Vnite",
  description: "A VisualNovels Manager",
  head: [
    ['link', { rel: 'icon', href: '/icon.png' }], // 指定 favicon.ico
  ],
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
          { text: '导入游戏', link: '/guide/importing-games' },
          { text: '元数据', link: '/guide/metadata' },
          { text: '云同步', link: '/guide/cloud-sync' },
          { text: '存档', link: '/guide/archive' },
          { text: '备份', link: '/guide/backup' },
          { text: '联动', link: '/guide/linkage' },
          { text: '更新', link: '/guide/update' },
        ]
      },
      {
        text: '进阶',
        items: [
          { text: '数据库', link: '/guide/database' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/ximu3/vnite' }
    ],

    footer: {
      message: 'Powered by <a target="_blank" href="https://vitepress.dev">VitePress</a> & Released under the <a target="_blank" href="https://www.gnu.org/licenses/gpl-3.0.html">GPL3 License</a>.',
      copyright: 'Copyright © 2024-present <a target="_blank" href="https://github.com/ximu3">ximu</a>'
    }
  }
})
