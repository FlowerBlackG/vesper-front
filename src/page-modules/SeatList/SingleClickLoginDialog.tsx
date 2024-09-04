/* SPDX-License-Identifier: MulanPSL-2.0 */

import { useState } from "react"
import { GetSeatsResponseDtoEntry } from "../../api/SeatController"
import { Drawer, Flex, StepProps, Steps } from "antd"
import { request } from "../../utils/request"
import { globalHooks } from "../../common/GlobalData"
import Config from "../../common/Config"
import { later } from "../../utils/later"


export interface SingleClickLoginDialogProps {
    seat: GetSeatsResponseDtoEntry | null
    onClose: () => void
    onSuccess?: () => void
}


const defaultState = {
    steps: [
        {
            title: '检查登录状态', status: 'wait',
        },
        {
            title: '退出登录', status: 'wait'
        },
        {
            title: '登录 Linux', status: 'wait'
        },
        {
            title: '启动 Vesper', status: 'wait'
        },
        {
            title: '连接到 VNC', status: 'wait'
        }
    ] as StepProps[]
}


export function SingleClickLoginDialog(props: SingleClickLoginDialogProps) {

    const [steps, setSteps] = useState<StepProps[]>(structuredClone(defaultState.steps))

    const [closable, setClosable] = useState(false)
    const [seat, setSeat] = useState<GetSeatsResponseDtoEntry | null>(null)

    if (props.seat !== null && props.seat !== seat) {
        setSeat(props.seat)
        stepChainCheckLoginStatus()
    }

    /* steps */

    function stepChainCheckLoginStatus() { // step 0
        steps[0].status = 'process'
        setSteps([...steps])

        type LoginStatusResponse = {
            linux: boolean,
            vesperLaunch: boolean,
            vesper: boolean
        }

        let loginStatus = {
            linux: false,
            vesperLaunch: false,
            vesper: false
        } as LoginStatusResponse

        let error = false

        request({
            url: 'seat/loginStatus',
            params: {
                seatId: props.seat?.id
            },
            vfOpts: {
                rejectNonOKResults: true, 
                autoHandleNonOKResults: true, 
                giveResDataToCaller: true
            }
        }).then(untypedRes => {
            const res = untypedRes as LoginStatusResponse
            steps[0].status = 'finish'
            steps[0].description = <Flex vertical>
                <p>{`linux: ${res.linux ? 'yes' : 'no'}`}</p>
                <p>{`vesper: ${res.vesper ? 'yes' : 'no'}`}</p>
                <p>{`vesper-launcher: ${res.linux ? 'yes' : 'no'}`}</p>
            </Flex>
            loginStatus = res
        }).catch(_ => {
            setClosable(true)
            steps[0].status = 'error'
            error = true
        }).finally(() => {
            setSteps([...steps])

            if (error) {
                return
            }

            if (loginStatus.vesper) {
                stepChainConnectVNC()
            } else if (loginStatus.vesperLaunch) {
                stepChainLaunchVesper()
            } else if (!loginStatus.linux) {
                stepChainLoginLinux()
            } else {
                stepChainLogout()
            }
        })
    }

    function stepChainLogout() { // step 1
        steps[1].status = 'process'
        setSteps([...steps])

        let error = false

        request({
            url: 'seat/shutdown',
            method: 'post',
            data: {
                seatId: props.seat?.id
            },
            vfOpts: {
                rejectNonOKResults: true, autoHandleNonOKResults: true
            }
        }).then(_ => {
            steps[1].status = 'finish'
        }).catch(_ => {
            error = true
            setClosable(true)
            steps[1].status = 'error'
        }).finally(() => {
            setSteps([...steps])

            if (error) 
                return

            setTimeout(stepChainLoginLinux, 50);
        })
    }

    function stepChainLoginLinux() { // step 2
        steps[2].status = 'process'
        setSteps([...steps])

        let error = false

        request({
            url: 'seat/start',
            method: 'post',
            data: {
                seatId: props.seat?.id
            },
            vfOpts: {
                rejectNonOKResults: true,
                autoHandleNonOKResults: true
            }
        }).then(res => {
            steps[2].status = 'finish'
        }).catch(_ => {
            steps[2].status = 'error'
            error = true
            setClosable(true)
        }).finally(() => {
            setSteps([...steps])

            if (error) 
                return

            setTimeout(stepChainLaunchVesper, 1000)
        })

    }

    function stepChainLaunchVesper() { // step 3
        steps[3].status = 'process'
        setSteps([...steps])

        let error = false
        let successRes = null as any

        request({
            url: 'seat/launchVesper',
            method: 'post',
            data: {
                seatId: props.seat?.id
            },
            vfOpts: {
                rejectNonOKResults: true, autoHandleNonOKResults: true, giveResDataToCaller: true
            }
        }).then(res => {
            successRes = res
            steps[3].status = 'finish'
        }).catch(_ => {
            error = true
            steps[3].status = 'error'
            setClosable(true)
        }).finally(() => {
            setSteps([...steps])

            if (error) 
                return

            stepChainConnectVNC(successRes['vesperIP'], successRes['vesperPort'], successRes['vncPassword'])
        })
    }

    function stepChainConnectVNC(
        vncAddr: string | null = null, 
        vncPort: string | null = null, 
        vncPw: string | null = null
    ) { // step 4, itself comes with latency

        steps[4].status = 'process'
        setSteps([...steps])


        const realAddr = (addr: string) => {
            let result = addr
            if (result === '0.0.0.0') {
                let host = Config.backendRoot
                let pos = host.indexOf('//')
                if (pos !== -1) {
                    host = host.substring(pos + 2)
                }
        
                pos = host.lastIndexOf(':')
                if (pos !== -1) {
                    host = host.substring(0, pos)
                }

                result = host
            }
            
            return result
        }


        function connect(addr: string, port: string, pw: string) {
            setClosable(true)

            later(close)

            globalHooks.app.navigate({
                pathname: '/vnc-viewer',
                search: `addr=${realAddr(addr)}&port=${port}&password=${pw}`
            })
        }

        if (vncAddr !== null && vncPort !== null && vncPw !== null) {
            setTimeout(() => connect(vncAddr, vncPort, vncPw), 1000)
        } else {

            request({
                url: 'seat/vncConnectionInfo',
                params: {
                    seatId: props.seat?.id
                },
                vfOpts: {
                    rejectNonOKResults: true, autoHandleNonOKResults: true,
                    giveResDataToCaller: true
                }
            }).then(res => {
                steps[4].status = 'finish'
                setTimeout(() => connect(res['vesperIP'], res['vesperPort'], res['vncPassword']), 20)
            }).catch(_ => {
                setClosable(true)
                steps[4].status = 'error'
            }).finally(() => {
                setSteps([...steps])
            })
        }
    }


    /* other methods */

    function close() {

        setSteps(structuredClone(defaultState.steps))
        setClosable(false)
        setSeat(null)

        if (props.onClose)
            props.onClose()
    }


    /* render */
    return <Drawer
        open={props.seat !== null}
        destroyOnClose={true}
        title={`登录到主机：${props.seat?.nickname}`}
        onClose={close}
        closable={closable}
        maskClosable={closable}
    >
        <Steps
            direction='vertical'
            items={steps}
        />
    </Drawer>
}

