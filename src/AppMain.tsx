// SPDX-License-Identifier: MulanPSL-2.0

/*
 * AppMain
 * 创建于2024年2月29日 上海市嘉定区
 */

import axios from 'axios'
import React, { useRef } from 'react'
import { BrowserRouter, HashRouter, Route, Routes, useNavigate } from 'react-router-dom'
import MacroDefines from './common/MacroDefines' 
import PageRouteManager from './common/PageRoutes' 
import { globalData } from './common/GlobalData'
import { LayoutFrameHandle } from './components/LayoutFrame/LayoutFrame'
import { useConstructor } from './utils/react-functional-helpers'
import { GlobalNavigate } from './components/GlobalNavigate'

export default function AppMain() {

    globalData.layoutFrameRef = useRef<LayoutFrameHandle>(null)

    useConstructor(constructor)
    function constructor() {
        axios.defaults.baseURL = MacroDefines.BACKEND_ROOT
        axios.defaults.withCredentials = false
    }

    
    return <HashRouter basename={
        MacroDefines.WEB_ROOT_PATH
    }>
        <GlobalNavigate />
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
