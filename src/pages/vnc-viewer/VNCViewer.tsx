// SPDX-License-Identifier: MulanPSL-2.0
/*
 * VNC Viewer
 * 创建于2024年4月15日 上海市嘉定区安亭镇
 */


import { VncScreen } from "react-vnc";
import PageRouteManager from "../../common/PageRoutes/PageRouteManager";
import { useConstructor } from "../../utils/react-functional-helpers";
import { ensureGlobalData, globalHooks } from "../../common/GlobalData";
import { useSearchParams } from "react-router-dom";
import { later } from "../../utils/later";
import { useState } from "react";



export default function VNCViewerPage() {

    const pageEntity = PageRouteManager.getRouteEntity('/vnc-viewer')

    const [searchParams, setSearchParams] = useSearchParams()


    /* states */
    const [vncAddr, setVncAddr] = useState("0.0.0.0")
    const [vncPort, setVncPort] = useState(0)
    const [vncPassword, setVncPassword] = useState("")

    /* ctor */
    useConstructor(constructor)
    function constructor() {
        ensureGlobalData({ dontReject: true, dontResolve: true })
        globalHooks.layoutFrame.loadPageEntity(pageEntity)

        later(() => {
            if (searchParams.has('addr')) {
                setVncAddr(searchParams.get('addr')!)
            } else {
                globalHooks.app.message.error('addr Required!')
            }


            if (searchParams.has('port')) {
                setVncPort(Number(searchParams.get('port')!))
            } else {
                globalHooks.app.message.error('port Required!')
            }


            if (searchParams.has('password')) {
                setVncPassword(searchParams.get('password')!)
            } else {
                globalHooks.app.message.error('password Required!')
            }
        })
    }

    /* render */
    return <div style={{
        width: '100%', height: '100%',
        position: 'absolute'
    }}>
        <VncScreen
            url={`ws://${vncAddr}:${vncPort}`}
            scaleViewport
            style={{
                width: '100%',
                height: '100%',
            }}
            rfbOptions={{
                credentials: {
                    password: vncPassword
                }
            }}
        />
    
    </div>
}

