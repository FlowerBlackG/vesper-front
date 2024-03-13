// SPDX-License-Identifier: MulanPSL-2.0

/*

    创建于2024年3月13日 上海市嘉定区
*/

import { useState } from "react";
import PageRouteManager from "../../common/PageRoutes";
import { useConstructor } from "../../utils/react-functional-helpers";
import { loadPageToLayoutFrame } from "../../components/LayoutFrame/LayoutFrame";
import FluentUIEmojiProxy from "../../utils/FluentUIEmojiProxy";
import { Link } from "react-router-dom";

import styles from './Index.module.css'
import { ensureGlobalData } from "../../common/GlobalData";
import { message } from "antd";


interface IndexPageState {

}

export function IndexPage() {

    const pageEntity = PageRouteManager.getRouteEntity('/')

    const [state, setState] = useState<IndexPageState>({


    })

    useConstructor(constructor)
    function constructor() {

        loadPageToLayoutFrame(pageEntity)

        ensureGlobalData()
            .then(() => {})
            .catch(() => {})
    }

    return <div
        style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            userSelect: 'none'
        }}
    >

        <div style={{
            marginTop: 38,
            display: 'flex',
            alignItems: "center",
            justifyContent: 'center',
            fontSize: 28
        }}>


            <img
                src={FluentUIEmojiProxy.colorSvg('camping_color')}
                style={{
                    width: '1.2em',
                    height: '1.2em'
                }}
            />


            <div style={{ width: '0.4em' }} />

            落霞前厅
            
        </div>

        { /* 功能按钮区。 */ }

        <div 
    
            style={{
                marginTop: 32,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                userSelect: 'none'
            }}

            className='overflow-y-overlay'
            
        > {
        
            PageRouteManager.getRoutes().map((route) => {

                // 不显示本页和登录页。
                if (route.path == '/' || route.path == '/login') {
                    return ''
                }

                // 权限校验。
                
                if (!route.permissionCheckPassed!()) {
                    // 无权限，不显示。
                    return ''
                }
            

                // 显示卡片。
                return <Link 
                    className={ styles.linkCard }
                    to={ route.path }
                >
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                    }}>

                        <img
                            src={ route.icon }
                            style={{
                                width: '2.6em',
                            }}
                        />
                        <div
                            style={{
                                color: '#111c',
                                marginTop: 18,
                                fontSize: 16
                            }}
                        > { route.name } </div>
                        
                    </div>
                </Link>

            })

        } </div>

        
    </div>
}
