// SPDX-License-Identifier: MulanPSL-2.0

/*
 * index.tsx
 * 创建于2024年2月29日 上海市嘉定区
 */

import ReactDOM from "react-dom/client";
import AppMain from './AppMain';

import './index.css'
import PageRouteManager from "./common/PageRoutes"; // todo

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
)

root.render(
    <ConfigProvider
        theme={{
            token: {
                // 设置主题色。
                colorPrimary: '#20a162'
            }
        }}
    >
        <AppMain />
    </ConfigProvider> // todo
)
