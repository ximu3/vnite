import DefaultTheme from "vitepress/theme"
import { onMounted, watch, nextTick } from 'vue';
import { useRoute } from 'vitepress';
import mediumZoom from "medium-zoom"

import "./custom.css"

export default {
    ...DefaultTheme,

    setup() {
        const route = useRoute();
        const initZoom = () => {
            // mediumZoom('[data-zoomable]', { background: 'var(--vp-c-bg)' });
            mediumZoom('.main img', { background: 'var(--vp-c-bg)' });
        };
        onMounted(() => {
            initZoom();
        });
        watch(
            () => route.path,
            () => nextTick(() => initZoom())
        );
    },
};
