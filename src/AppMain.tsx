// SPDX-License-Identifier: MulanPSL-2.0

/*
 * AppMain
 * 创建于2024年2月29日 上海市嘉定区
 */

import axios from 'axios'
import React from 'react'
import { BrowserRouter, HashRouter, Route, Routes } from 'react-router-dom'
import MacroDefines from './common/MacroDefines' // todo
import PageRouteManager from './common/PageRoutes' // todo

export default class AppMain extends React.Component {
    constructor(props: any) {
        super(props)

        axios.defaults.withCredentials = false
    }

    override render(): React.ReactNode {
        return <HashRouter basename={
            MacroDefines.WEB_ROOT_PATH
        }>
            <Routes>
                <Route path="/">{

                    PageRouteManager.getRoutes().map((route) => {
                        return <Route
                            path={ route.path }
                            element={ route.element }
                        />
                    })

                }</Route>

                <Route path='*' element={
                    <div
                        style={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            background: '#d0dfe6',
                            userSelect: 'none'
                        }}
                    >
                        <div
                            style={{
                                position: 'absolute',
                                left: '50%',
                                top: '50%',
                                transform: 'translate(-50%, -50%)',
                                borderRadius: 24,
                                background: '#2f90b9',
                                padding: 76,
                                fontSize: 28,
                                color: '#fffc',
                                boxShadow: '0px 6px 12px #5cb3cc'
                            }}
                        >
                            404 not found.
                        </div>
                        
                    </div>
                }/>
            </Routes>
        </HashRouter>
    }
}
