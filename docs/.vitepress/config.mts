import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Vnite',
  description: 'A Game Management Software',
  head: [['link', { rel: 'icon', href: '/icon.png' }]],
  cleanUrls: true,

  // Internationalized configuration, English by default
  locales: {
    root: {
      label: 'English',
      lang: 'en',
      description: 'A Game Management Software',
      themeConfig: {
        nav: [
          { text: 'Home', link: '/' },
          { text: 'Guide', link: '/guide/what-is-vnite' }
        ],
        sidebar: [
          {
            text: 'Introduction',
            items: [
              { text: 'What is Vnite?', link: '/guide/what-is-vnite' },
              { text: 'Getting Started', link: '/guide/getting-started' }
            ]
          },
          {
            text: 'Basics',
            items: [
              { text: 'Adding Games', link: '/guide/adding-games' },
              { text: 'Importing from Third Party', link: '/guide/importing-games' },
              { text: 'Metadata', link: '/guide/metadata' },
              { text: 'Cloud Sync', link: '/guide/cloud-sync' },
              { text: 'Save', link: '/guide/save' },
              { text: 'Memory', link: '/guide/memory' },
              { text: 'Backup', link: '/guide/backup' },
              { text: 'Linkage', link: '/guide/linkage' }
            ]
          },
          {
            text: 'Advanced',
            items: [
              { text: 'Custom Theme', link: '/guide/custom-theme' },
              { text: 'Link Wake-up', link: '/guide/link-wakeup' },
              { text: 'Portable Mode', link: '/guide/portable' },
              { text: 'Launcher', link: '/guide/launcher' }
            ]
          },
          {
            text: 'Others',
            items: [{ text: 'Migration from v2', link: '/guide/migration-from-v2' }]
          }
        ]
      }
    },
    'zh-CN': {
      label: '简体中文',
      lang: 'zh-CN',
      description: '一款游戏管理软件',
      link: '/zh-CN/',
      themeConfig: {
        nav: [
          { text: '主页', link: '/zh-CN/' },
          { text: '软件指南', link: '/zh-CN/guide/what-is-vnite' }
        ],
        sidebar: [
          {
            text: '简介',
            items: [
              { text: '什么是 Vnite?', link: '/zh-CN/guide/what-is-vnite' },
              { text: '快速开始', link: '/zh-CN/guide/getting-started' }
            ]
          },
          {
            text: '基本',
            items: [
              { text: '添加游戏', link: '/zh-CN/guide/adding-games' },
              { text: '从第三方导入', link: '/zh-CN/guide/importing-games' },
              { text: '元数据', link: '/zh-CN/guide/metadata' },
              { text: '云同步', link: '/zh-CN/guide/cloud-sync' },
              { text: '存档', link: '/zh-CN/guide/save' },
              { text: '回忆', link: '/zh-CN/guide/memory' },
              { text: '备份', link: '/zh-CN/guide/backup' },
              { text: '联动', link: '/zh-CN/guide/linkage' }
            ]
          },
          {
            text: '高级',
            items: [
              { text: '自定义主题', link: '/zh-CN/guide/custom-theme' },
              { text: '链接唤醒', link: '/zh-CN/guide/link-wakeup' },
              { text: '便携模式', link: '/zh-CN/guide/portable' },
              { text: '启动器', link: '/zh-CN/guide/launcher' }
            ]
          },
          {
            text: '其它',
            items: [{ text: '从 v2 迁移', link: '/zh-CN/guide/migration-from-v2' }]
          }
        ]
      }
    },
    ja: {
      label: '日本語',
      lang: 'ja',
      description: 'ゲーム管理ソフトウェア',
      link: '/ja/',
      themeConfig: {
        nav: [
          { text: 'ホーム', link: '/ja/' },
          { text: 'ガイド', link: '/ja/guide/what-is-vnite' }
        ],
        sidebar: [
          {
            text: '紹介',
            items: [
              { text: 'Vniteとは？', link: '/ja/guide/what-is-vnite' },
              { text: 'クイックスタート', link: '/ja/guide/getting-started' }
            ]
          },
          {
            text: '基本',
            items: [
              { text: 'ゲームを追加', link: '/ja/guide/adding-games' },
              { text: 'サードパーティからインポート', link: '/ja/guide/importing-games' },
              { text: 'メタデータ', link: '/ja/guide/metadata' },
              { text: 'クラウド同期', link: '/ja/guide/cloud-sync' },
              { text: 'アーカイブ', link: '/ja/guide/save' },
              { text: 'メモリー', link: '/ja/guide/memory' },
              { text: 'バックアップ', link: '/ja/guide/backup' },
              { text: 'リンケージ', link: '/ja/guide/linkage' }
            ]
          },
          {
            text: '高度な設定',
            items: [
              { text: 'カスタムテーマ', link: '/ja/guide/custom-theme' },
              { text: 'リンクウェイクアップ', link: '/ja/guide/link-wakeup' },
              { text: 'ポータブルモード', link: '/ja/guide/portable' },
              { text: 'ランチャー', link: '/ja/guide/launcher' }
            ]
          },
          {
            text: 'その他',
            items: [{ text: 'v2からの移行', link: '/ja/guide/migration-from-v2' }]
          }
        ]
      }
    }
  },

  themeConfig: {
    // Shared Theme Configuration
    logo: '/icon.png',
    search: {
      provider: 'local'
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/ximu3/vnite' }],
    footer: {
      message:
        'Powered by <a target="_blank" href="https://vitepress.dev">VitePress</a> & Released under the <a target="_blank" href="https://www.gnu.org/licenses/gpl-3.0.html">GPL3 License</a>.',
      copyright:
        'Copyright © 2024-present <a target="_blank" href="https://github.com/ximu3">ximu</a>'
    }
  }
})
