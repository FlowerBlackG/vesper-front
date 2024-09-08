/* SPDX-License-Identifier: MulanPSL-2.0 */
/*

    创建于2024年4月9日 上海市嘉定区
*/

import React, { useEffect, useState } from "react"
import { ensureGlobalData, globalHooks } from "../../../common/GlobalData"
import PageRouteManager from "../../../common/PageRoutes/PageRouteManager"
import { useConstructor } from "../../../utils/react-functional-helpers"
import { SeatEntity } from "../../../api/Entities"
import { request } from "../../../utils/request"
import { useSearchParams } from "react-router-dom"
import { Button, Card, Descriptions, Flex, Input, Popover, Space, Spin, Tooltip, message } from "antd"
import { DesktopOutlined, KeyOutlined, LinkOutlined, PlayCircleOutlined, PoweroffOutlined, ReloadOutlined } from "@ant-design/icons"
import Config from "../../../common/Config"
import { SeatInfo, VesperStatus } from "./SeatInfo"
import { UploadSSHKeyDrawer } from "./UploadSSHKeyDrawer"




const data = {
    pageActive: true
}

const pageConfig = {
    vesperHeartBeatIntervalMs: 3000
}


export default function DetailPage() {

    const pageEntity = PageRouteManager.getRouteEntity('/seats/detail')
    const [searchParams, setSearchParams] = useSearchParams()

    const seatId = Number(searchParams.get('seatId'))
    

    /* states */

    const [seatEntity, setSeatEntity] = useState<(SeatEntity & { groupName: string }) | null>(null)
    const [seatEntityLoading, setSeatEntityLoading] = useState(false)
    const [vesperCoreStatus, setVesperCoreStatus] = useState<VesperStatus>('unknown')
    const [vesperLauncherStatus, setVesperLauncherStatus] = useState<VesperStatus>('unknown')
    const [linuxLoginStatus, setLinuxLoginStatus] = useState<VesperStatus>('unknown')

    const [opBtnReady, setOpBtnReady] = useState(true)

    const [vncPort, setVncPort] = useState(0)
    const [vncIPAddr, setVncIPAddr] = useState('0.0.0.0')
    const [vncPasswd, setVncPasswd] = useState('******')
    const [vncInfoLoaded, setVncInfoLoaded] = useState(false)
    
    const [vncConnInfoRefreshing, setVncConnInfoRefreshing] = useState(false)


    const [launchVesperDisplayWidth, setLaunchVesperDisplayWidth] = useState(1440)
    const [launchVesperDisplayHeight, setLaunchVesperDisplayHeight] = useState(900)

    const [uploadSSHKeyDrawerOpen, setUploadSSHKeyDrawerOpen] = useState(false)

    /* ctor */
    function constructor() {
        ensureGlobalData({dontReject: true, resolveLater: true}).then(() => {

            data.pageActive = true

            if (!searchParams.has('seatId')) {
                message.warning('seatId required')
                globalHooks.app.navigate!({ pathname: '/seats' })
                return
            }

            loadDefaultVNCIPAddress()
            loadData()
        })
    }
    useConstructor(constructor)

    /* methods */

    function loadDefaultVNCIPAddress() {
        let host = Config.backendRoot
        let pos = host.indexOf('//')
        if (pos !== -1) {
            host = host.substring(pos + 2)
        }

        pos = host.lastIndexOf(':')
        if (pos !== -1) {
            host = host.substring(0, pos)
        }

        setVncIPAddr(host)
    }

    function loadData() {
        loadSeatEntity()
        loopCheckVesperHeartBeat()
    }

    function loopCheckVesperHeartBeat() {
        if (!data.pageActive) {
            return
        }

        checkVesperHeartBeat()
        
        setTimeout(
            loopCheckVesperHeartBeat, 
            pageConfig.vesperHeartBeatIntervalMs
        );
    }

    function checkVesperHeartBeat() {
        loadVesperCoreStatus()
        loadVesperLauncherStatus()
        loadLinuxLoginStatus()
    }

    const handleBeforeUnload = () => {
        data.pageActive = false
    }

    useEffect(() => {
        window.addEventListener("beforeunload", handleBeforeUnload)

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload)

            handleBeforeUnload()
        }
    }, [])

    function loadSeatEntity() {
        setSeatEntityLoading(true)
        request({
            url: 'seat/detail',
            params: {
                seatId: seatId
            },
            vfOpts: {
                giveResDataToCaller: true,
                rejectNonOKResults: true,
                autoHandleNonOKResults: true
            }
        }).then(res => {
            setSeatEntity(res)
        }).catch(err => {}).finally(() => {
            setSeatEntityLoading(false)
        })
    }

    function loadLinuxLoginStatus() {
        request({
            url: 'seat/userLoggedIn',
            params: {
                'seatId': seatId
            },
            vfOpts: {
                giveResDataToCaller: true,
                rejectNonOKResults: true,
                autoHandleNonOKResults: true
            }
        }).then(ok => {
            ok = ok as boolean
            setLinuxLoginStatus(ok ? 'on' : 'off')
        }).catch(err => {})
    }

    function loadVesperLauncherStatus() {
        request({
            url: 'seat/vesperLauncherLive',
            params: {
                'seatIds': seatId
            },
            vfOpts: {
                giveResDataToCaller: true,
                rejectNonOKResults: true,
                autoHandleNonOKResults: true
            }
        }).then(ok => {
            ok = ok as boolean[]
            setVesperLauncherStatus(ok[`${seatId}`] ? 'on' : 'off')
        }).catch(err => {})
    }


    function loadVesperCoreStatus() {
        request({
            url: 'seat/vesperLive',
            params: {
                'seatIds': seatId
            },
            vfOpts: {
                giveResDataToCaller: true,
                rejectNonOKResults: true,
                autoHandleNonOKResults: true
            }
        }).then(ok => {
            ok = ok as boolean[]
            setVesperCoreStatus(ok[`${seatId}`] ? 'on' : 'off')
        }).catch(err => {})
    }


    /* render */


    function vncInfo() {
        return <Descriptions 
            title='VNC 信息' 
            style={{marginTop: 16}}
            bordered
            contentStyle={{
                fontFamily: 'JetBrains Mono'
            }}
        >
            <Descriptions.Item
                label='IP地址'
                children={vncIPAddr}
            />
            <Descriptions.Item
                label='端口'
                children={vncPort}
            />
            <Descriptions.Item
                label='连接地址'
                children={`${vncIPAddr}:${vncPort}`}
            />
            <Descriptions.Item
                label='临时密码'
                children={`${vncPasswd}`}
            />
            <Descriptions.Item
                label='刷新信息'
                children={
                    <Button
                        icon={<ReloadOutlined />}
                        shape="circle"
                        type="primary"
                        ghost
                        disabled={vncConnInfoRefreshing}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onClick={() => {
                            setVncConnInfoRefreshing(true)
                            request({
                                url: 'seat/vncConnectionInfo',
                                params: {
                                    seatId: seatId
                                },
                                vfOpts: {
                                    giveResDataToCaller: true,
                                    rejectNonOKResults: true,
                                    autoHandleNonOKResults: true
                                }
                            }).then(res => {
                                if (res.vesperIP !== '0.0.0.0') {
                                    setVncIPAddr(res.vesperIP)
                                }
                                setVncPort(res.vesperPort)
                                setVncPasswd(res.vncPassword)
                                setVncInfoLoaded(true)
                            }).catch(err => {}).finally(() => {
                                setVncConnInfoRefreshing(false)
                            })
                        }}
                    />
                }
            />
        </Descriptions>
    }


    function operationButtons() {
        let buttons = []

        // 开机
        buttons.push(
            <Button
                type="primary"
                shape="round"
                disabled={!opBtnReady}
                icon={ <PlayCircleOutlined /> }
                onClick={() => {
                    setLinuxLoginStatus('unknown')
                    setVesperLauncherStatus('unknown')
                    setOpBtnReady(false)
                    request({
                        url: 'seat/start',
                        method: 'post',
                        data: {
                            seatId: seatId
                        },
                        vfOpts: {
                            giveResDataToCaller: true,
                            rejectNonOKResults: true,
                            autoHandleNonOKResults: true
                        }
                    }).then(res => {

                    }).catch(err => {}).finally(() => {
                        setOpBtnReady(true)
                    })
                }}
            >
                开机
            </Button>
        )

        // 启动 vesper
        buttons.push(
            <Popover content={
                <Flex vertical>
                    <p>分辨率</p>
                    <Flex style={{alignItems: 'center'}}>
                        <Input
                            type='number'
                            value={launchVesperDisplayWidth}
                            onChange={(event) => {
                                setLaunchVesperDisplayWidth(Number(event.target.value))
                            }}
                        />
                        <div style={{ margin: 4 }}>×</div>
                        <Input
                            type='number'
                            value={launchVesperDisplayHeight}
                            onChange={(event) => {
                                setLaunchVesperDisplayHeight(Number(event.target.value))
                            }}
                        />
                    </Flex>
                </Flex>
            }>

                <Button
                    type="primary"
                    shape="round"
                    disabled={!opBtnReady}
                    icon={ <DesktopOutlined /> }
                    onClick={() => {
                        setOpBtnReady(false)
                        setVesperCoreStatus('unknown')
                        setVesperLauncherStatus('unknown')
                        request({
                            url: 'seat/launchVesper',
                            method: 'post',
                            data: {
                                seatId: seatId,
                                displayWidth: launchVesperDisplayWidth,
                                displayHeight: launchVesperDisplayHeight
                            },
                            vfOpts: {
                                giveResDataToCaller: true,
                                rejectNonOKResults: true,
                                autoHandleNonOKResults: true
                            }
                        }).then(res => {
                            if (res.vesperIP !== '0.0.0.0') {
                                setVncIPAddr(res.vesperIP)
                            }
                            setVncPort(res.vesperPort)
                            setVncPasswd(res.vncPassword)
                            setVncInfoLoaded(true)
                        }).catch(err => {}).finally(() => {
                            setOpBtnReady(true)
                        })
                    }}
                >
                    启动 vesper
                </Button>
            </Popover>
        )

        // 关机
        buttons.push(
            <Button danger
                type="primary"
                shape="round"
                disabled={!opBtnReady}
                icon={ <PoweroffOutlined /> }onClick={() => {
                    setOpBtnReady(false)
                    setLinuxLoginStatus('unknown')
                    setVesperLauncherStatus('unknown')
                    setVesperCoreStatus('unknown')
                    request({
                        url: 'seat/shutdown',
                        method: 'post',
                        data: {
                            seatId: seatId
                        },
                        vfOpts: {
                            giveResDataToCaller: true,
                            rejectNonOKResults: true,
                            autoHandleNonOKResults: true
                        }
                    }).then(res => {

                    }).catch(err => {}).finally(() => {
                        setOpBtnReady(true)
                    })
                }}
            >
                关机
            </Button>
        )


        // 使用内置vnc连接
        buttons.push(
            <Tooltip title={
                vncInfoLoaded ? '内置 VNC Viewer 性能较差。建议下载安装并使用 RealVNC VNC Viewer 连接。' : ''
            }>
                <Button type="primary" shape="round"
                    disabled={!vncInfoLoaded}
                    icon={<LinkOutlined />}
                    onClick={() => {
                        globalHooks.app.navigate({
                            pathname: '/vnc-viewer',
                            search: `addr=${vncIPAddr}&port=${vncPort}&password=${vncPasswd}`
                        })
                    }}
                >
                    用内置VNC Viewer连接
                </Button>
            </Tooltip>
        )


        // 上传ssh公钥
        buttons.push(
            <Button type="primary" shape="round" ghost
                icon={<KeyOutlined />}
                onClick={() => {
                    setUploadSSHKeyDrawerOpen(true)
                }}
            >
                上传SSH公钥
            </Button>
        )

        return <Space style={{
            marginTop: 8
        }}>
            {buttons}
        </Space>
    }


    return <Flex vertical
        style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            boxSizing: 'border-box',
            padding: 8
        }}
        className="overflow-y-overlay"
    >
        <Spin spinning={seatEntityLoading}
            style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)'
            }}
        />

        { /* 基本信息 */ }
        <SeatInfo
            seatEntity={seatEntity}
            linuxLoginStatus={linuxLoginStatus}
            vesperLauncherStatus={vesperLauncherStatus}
            vesperCoreStatus={vesperCoreStatus}
        />

        { /* vnc 信息 */ }
        { vncInfo() }

        
        { /* 操作按钮 */ }
        { operationButtons() }
        {
            seatEntity !== null
            &&
            <UploadSSHKeyDrawer
                seat={seatEntity}
                open={uploadSSHKeyDrawerOpen}
                onClose={() => {
                    setUploadSSHKeyDrawerOpen(false)
                }}
            />
        }
        
    
    </Flex>
}
