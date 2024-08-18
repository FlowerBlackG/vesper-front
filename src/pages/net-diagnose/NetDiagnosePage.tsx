/* SPDX-License-Identifier: MulanPSL-2.0 */
/*

    created on 2024.8.18 at Yushan, Shangrao, Jiangxi
*/
import { Button, Card, Input, Row, Space } from "antd";
import { ensureGlobalData, globalHooks } from "../../common/GlobalData";
import PageRouteManager from "../../common/PageRoutes/PageRouteManager";
import { useConstructor } from "../../utils/react-functional-helpers";
import axios, { HttpStatusCode } from "axios";
import { useState } from "react";
import { request } from "../../utils/request";
import { CheckOutlined } from "@ant-design/icons";
import { LightIndicator } from "../../components/LightIndicator";
import Config from "../../common/Config";



enum BackendReachability {
    REACHABLE, UNREACHABLE, UNKNOWN
}


export default function NetDiagnosePage() {
    const pageEntity = PageRouteManager.getRouteEntity("/net-diagnose")


    /* hooks */


    /* states */

    const [myIP, setMyIP] = useState("0.0.0.0")
    const [myIPCountry, setMyIPCountry] = useState("--")
    const [backendReachable, setBackendReachable] = useState(BackendReachability.UNKNOWN)
    const [backendAddr, setBackendAddr] = useState(Config.backendRoot)
    const [checkingBackendReachability, setCheckingBackendReachability] = useState(false)


    /* ctor */

    useConstructor(constructor)
    function constructor() {
        request({
            url: 'https://api.country.is/',
            method: 'get'
        }).then(res => {
            if (res.status === HttpStatusCode.Ok) {
                setMyIP(res.data.ip)
                setMyIPCountry(res.data.country)
            }
        }).catch(err => {})

        checkBackendReachability()
    }


    /* methods */

    function backendReachableToIndicatorColor(reach: BackendReachability) {
        if (reach === BackendReachability.REACHABLE) {
            return 'green'
        } else if (reach === BackendReachability.UNKNOWN) {
            return 'grey'
        } else if (reach === BackendReachability.UNREACHABLE) {
            return 'red'
        } else {
            globalHooks.app.message.error('internal error (8e6242c0-9081-4cb9-ad47-ff920c410c4a)')
        }
    }


    function checkBackendReachability() {
        setCheckingBackendReachability(true)
        setBackendReachable(BackendReachability.UNKNOWN)

        request({
            url: 'vesperCenter/ping',
            vfOpts: {
                useDefaultNetworkExceptionHandler: false,
                useDefaultUnauthorizedExceptionHandler: false,
                toNetDiagnosePageOnNetErrWhenCallingOwnApi: false,
                useOriginalResult: true,
                giveResDataToCaller: false,
                autoHandleNonOKResults: false
            },
            method: 'get',
            params: {
                timestamp: new Date().getTime()
            }
        }).then(res => {
            if (res.status !== HttpStatusCode.Ok) {
                setBackendReachable(BackendReachability.UNREACHABLE)
            } else {
                setBackendReachable(BackendReachability.REACHABLE)
            }
        }).catch(err => {
            setBackendReachable(BackendReachability.UNREACHABLE)
        }).finally(() => {
            setCheckingBackendReachability(false)
        })
    }


    /* render */

    return <div
        style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,

            backgroundSize: 'cover',
            backgroundImage: 'url(https://canfish.oss-cn-shanghai.aliyuncs.com/app/vesper-front/20231208_123408.1.webp)',
            backgroundPosition: 'center',
        }}
    >

        <Card 
            hoverable
            style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',

                maxWidth: 450,
                width: '96%'
            }}
        >

            <p>IP地址：{myIP}</p>
            <p>IP属地：{myIPCountry}</p>
            
            <Row style={{alignItems: 'center'}}>
                <p>后端可达：</p>
                <LightIndicator color={backendReachableToIndicatorColor(backendReachable)} />
            </Row>
            
            <p>后端地址</p>
            <Space.Compact style={{ width: '100%' }}>
                <Input
                    style={{
                        flex: 1
                    }}
                    disabled={checkingBackendReachability}
                    value={backendAddr}

                    onInput={(event) => {
                        setBackendAddr(event.currentTarget.value)
                    }}
                />

                <Button
                    type="primary"
                    icon={ <CheckOutlined /> }
                    disabled={checkingBackendReachability}
                    onClick={() => {
                        checkBackendReachability()
                        Config.backendRoot = backendAddr
                    }}
                />
            </Space.Compact>

            <Button
                style={{ marginTop: 16, width: '100%' }}
                type="primary"
                ghost={ backendReachable !== BackendReachability.REACHABLE }
                onClick={() => { globalHooks.app.navigate('/') }}
            >
                回到主页
            </Button>

        </Card>
    </div>

}

