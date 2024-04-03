// SPDX-License-Identifier: MulanPSL-2.0

/*
 * AppMain
 * 创建于2024年2月29日 上海市嘉定区
 */

import axios from 'axios'
import React, { useRef } from 'react'
import { BrowserRouter, HashRouter, Route, Routes, useNavigate } from 'react-router-dom'
import MacroDefines from './common/MacroDefines' 
import PageRouteManager from './common/PageRoutes/PageRouteManager' 
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
            <Route path="/" key={ "appmain-route-root" }>{

                PageRouteManager.getRoutes().map((route) => {
                    return <Route
                        path={ route.path }
                        element={ route.element }
                        key={ "appmain-route-".concat(route.path) }
                    />
                })

            }</Route>

            { /* 404 not found. */ }
            <Route path='*' key={ "appmain-route-any" } element={
                <div
                    style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        userSelect: 'none'
                    }}
                >

                    <img
                        src={ 
                            'https://canfish.oss-cn-shanghai.aliyuncs.com/app/vesper-front/20231122_183343.webp' // 嘉图
                        }
                        style={{
                            objectFit: 'cover',
                            width: '100%',
                            height: '100%',
                            position: 'absolute',
                            top: 0,
                            left: 0,
            
                            transitionDuration: '1s',
                            transitionProperty: 'opacity',
                        }}
                    />
                    
                    <div
                        style={{
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                
                            display: 'flex',
                            flexDirection: 'column',
                
                            paddingTop: '4rem',
                            paddingBottom: '4rem',
                            paddingLeft: '2rem',
                            paddingRight: '2rem',
                
                            width: '16rem',
                
                            background: '#8884',
                            borderRadius: 24,
                            boxShadow: '0px 6px 24px #0008',
                
                            backdropFilter: 'blur(8px)',
                            textAlign: 'center',
                            fontSize: 28,
                            color: '#ffff'
                        }}
                    >
                        404 not found.
                    </div>
                    
                </div>
            }/> { /* end of 404 not found. */ }

        </Routes>
    </HashRouter>
    
}
