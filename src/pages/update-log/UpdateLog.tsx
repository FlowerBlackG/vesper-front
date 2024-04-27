/* SPDX-License-Identifier: MulanPSL-2.0 */
/*

    创建于2024年4月27日 上海市嘉定区
*/

import { Divider, Flex, Skeleton, Switch } from "antd";
import { ensureGlobalData, globalHooks } from "../../common/GlobalData";
import PageRouteManager from "../../common/PageRoutes/PageRouteManager";
import { useConstructor } from "../../utils/react-functional-helpers";
import { useState } from "react";
import { request } from "../../utils/request";
import moment from "moment";
import DateTimeUtils from "../../utils/DateTimeUtils";


enum VesperSoftware {
    VESPER = "vesper",
    VESPER_LAUNCHER = "vesper-launcher",
    VESPER_CENTER = "vesper-center",
    VESPER_FRONT = "vesper-front",
}

interface UpdateLogData {
    versionName: string
    versionCode: number
    completeTime: string
    updateLog: string
    software: VesperSoftware
}

export function UpdateLogPage() {

    const vesperSoftwares = ["vesper", "vesper-launcher", "vesper-center", "vesper-front"]
    const showCategoryInit = {} as any
    vesperSoftwares.forEach(it => showCategoryInit[it] = true)

    /* states */

    const [data, setData] = useState<UpdateLogData[]>([])
    const [loading, setLoading] = useState(false)
    const [showCategory, setShowCategory] = useState(showCategoryInit)

    /* ctor */

    useConstructor(constructor)
    function constructor() {
        globalHooks.layoutFrame.loadPageEntity(
            PageRouteManager.getRouteEntity('/update-log')
        )

        ensureGlobalData({dontReject: true, dontResolve: true})
        loadData()
    }

    /* methods */
    function loadData() {
        setLoading(true)
        request({
            url: 'vesperCenter/updateLog',
            vfOpts: {
                rejectNonOKResults: true,
                autoHandleNonOKResults: true,
                giveResDataToCaller: true
            }
        }).then(untypedRes => {
            const res = untypedRes as UpdateLogData[]
            res.sort((a, b) => {
                const ta = moment.utc(a.completeTime)
                const tb = moment.utc(b.completeTime)
                if (ta < tb) {
                    return 1
                } else if (ta == tb) {
                    return 0
                } else {
                    return -1
                }
                
            })
            setData(res)
        }).catch(_ => {}).finally(() => {
            setLoading(false)
        })
    }

    /* render */

    function tagBackgroundOf(soft: VesperSoftware) {
        if (soft === VesperSoftware.VESPER) {
            return '#55bb8a'
        } else if (soft === VesperSoftware.VESPER_LAUNCHER) {
            return '#de7897'
        } else if (soft === VesperSoftware.VESPER_CENTER) {
            return '#5698c3'
        } else {  // vesper-front
            return '#fcb70a'
        }
    }


    return <Flex vertical
        style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
        }} className="overflow-y-overlay"
    >
        { loading && <Skeleton active /> }

        {
            !loading &&
            <Flex vertical style={{
                flexShrink: 0,
                marginLeft: 12
            }}>
                {
                    vesperSoftwares.map(it => {
                        return <Flex style={{
                            marginTop: 12,
                        }}>
                            <Switch
                                checked={showCategory[it]}
                                onChange={(checked) => {
                                    showCategory[it] = checked
                                    setShowCategory({...showCategory})
                                }}
                            />
                            <div style={{ marginLeft: 12 }}>
                                展示 {it} 的更新日志
                            </div>
                        </Flex>
                    })
                }
            </Flex>
        }

        {
            data.map(it => {
                if (!showCategory[it.software]) {
                    return null
                }

                return <Flex vertical
                    style={{
                        marginLeft: 12,
                        marginRight: 12,
                        marginTop: 12,
                        boxShadow: '0 0 6px 4px #8882',
                        borderRadius: 6,
                        display: "inline-flex",
                        padding: 8,
                        flexShrink: 0
                    }}
                >
                    <Flex style={{
                        alignItems: 'center',
                        flexShrink: 0,
                        marginTop: 8
                    }}>
                        <div
                            style={{
                                background: tagBackgroundOf(it.software),
                                flexShrink: 0,
                                display: 'inline',
                                padding: 4,
                                borderRadius: 32,
                                color: 'white',
                            }}
                        >
                            {it.software}
                        </div>

                        <Flex style={{ flexShrink: 0, flexGrow: 1, justifyContent: 'right', marginRight: 8 }}>
                            <div>
                                {it.versionName}
                            </div>
                             <div style={{
                                marginLeft: 8,
                                borderRadius: 32,
                                background: tagBackgroundOf(it.software),
                                color: 'white',
                                display: 'inline-block',
                                paddingLeft: 8,
                                paddingRight: 8,
                                flexShrink: 0
                             }}>
                                Build {it.versionCode}
                            </div>
                        </Flex>

                        <div style={{ flexShrink: 0, textAlign: 'right' }}>
                            {DateTimeUtils.iso8601toHumanFriendly(it.completeTime)}
                        </div>
                    </Flex>

                    <div style={{height: 8, flexShrink: 0}} />

                    <div style={{
                        flexShrink: 0,
                        display: 'inline',
                        padding: 4
                    }}>
                        {
                            it.updateLog.split("\n").map(it => {
                                return <span>{it}<br/></span>
                            })
                        }
                    </div>
                    
                </Flex>
            })
        }

        <div style={{ height: 32, flexShrink: 0 }} />

    </Flex>
}
