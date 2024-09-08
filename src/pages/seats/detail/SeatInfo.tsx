/* SPDX-License-Identifier: MulanPSL-2.0 */

import { Button, Descriptions, Flex } from "antd";
import DateTimeUtils from "../../../utils/DateTimeUtils";
import { SeatEntity } from "../../../api/Entities";
import { LightIndicator } from "../../../components/LightIndicator";
import { globalHooks } from "../../../common/GlobalData";
import { CopyOutlined } from "@ant-design/icons";


export type VesperStatus = 'on' | 'off' | 'unknown'


function systemStatusIndicators(
    linuxLoginStatus: VesperStatus,
    vesperLauncherStatus: VesperStatus,
    vesperCoreStatus: VesperStatus,
    
    inTable: boolean,
) {

    const statusToColor = (status: VesperStatus) => {
        if (status === 'on') {
            return 'green'
        } else if (status === 'off') {
            return 'red'
        } else if (status === 'unknown') {
            return 'grey'
        } else {
            globalHooks.app.message.error("internal error! (9c2139ab-a693-4a01-92a3-50a861b74e8e)")
        }
    }

    const tableStyle = {} as React.CSSProperties
    if (inTable) {
        tableStyle.width = 'auto'
    } else {
        tableStyle.margin = 'auto'
    }

    return <table style={ tableStyle }>
        <tr>
            <td> { /* indicator */ }
                <LightIndicator color={statusToColor(linuxLoginStatus)} />
            </td>
            <td>linux 登录状态</td>
        </tr>
        <tr>
            <td> { /* indicator */ }
                <LightIndicator color={statusToColor(vesperLauncherStatus)} />
            </td>
            <td>落霞引导 (vesper launcher) 状态</td>
        </tr>
        <tr>
            <td> { /* indicator */ }
                <LightIndicator color={statusToColor(vesperCoreStatus)} />
            </td>
            <td>落霞核心 (vesper core) 状态</td>
        </tr>
    </table>
}



export interface SeatInfoProps {
    seatEntity: (SeatEntity & { groupName: string }) | null
    linuxLoginStatus: VesperStatus
    vesperLauncherStatus: VesperStatus
    vesperCoreStatus: VesperStatus
}





export function SeatInfo(props: SeatInfoProps) {
    
    const seatEntity = props.seatEntity

    return <Flex vertical>

        <center style={{ marginTop: 8 }}>
            { `${seatEntity?.nickname} (${seatEntity?.id})` }
        </center>

        <div style={{ height: 16 }} />

        { 
            systemStatusIndicators(
                props.linuxLoginStatus, 
                props.vesperLauncherStatus, 
                props.vesperCoreStatus, 
                false
            ) 
        }

        <Flex style={{ alignItems: "center", justifyContent: 'center' }}>


            <div style={{ width: 16 }} />

            <div></div>
        </Flex>

        <Descriptions bordered
            style={{
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 16,
            }}
        >
            <Descriptions.Item
                label='创建时间'
                children={DateTimeUtils.iso8601toHumanFriendly(seatEntity?.createTime)}
            />

            <Descriptions.Item
                label='上次登录'
                children={seatEntity?.lastLoginTime === null ? '未曾登录' : DateTimeUtils.iso8601toHumanFriendly(seatEntity?.lastLoginTime)}
            />

            <Descriptions.Item
                label='所属群组'
                children={
                    seatEntity?.groupId !== null ? 
                        `${seatEntity?.groupName} (${seatEntity?.groupId})`
                        :
                        '无'
                }
            />

            <Descriptions.Item
                label='linux uid'
                children={seatEntity?.linuxUid}
            />

            <Descriptions.Item
                label='linux 用户名'
                children={seatEntity?.linuxLoginName}
            />

            <Descriptions.Item
                label='linux 登录密码'
                children={
                    <Flex style={{ alignItems: 'center' }}>
                        <p style={{ borderRadius: 4, border: '1px solid #6664', padding: 2, margin: 4 }}>
                            { seatEntity?.linuxPasswdRaw }
                        </p>
                        
                        <Button 
                            shape="circle" type="primary" ghost icon={<CopyOutlined />} 
                            disabled={ seatEntity === null }
                            onClick={() => {
                                navigator.clipboard.writeText(seatEntity!.linuxPasswdRaw).then(() => {
                                    globalHooks.app.message.success('密码已复制到剪切板')
                                }).catch((err) => {
                                    globalHooks.app.message.error(err)
                                })
                            }}
                        />
                    </Flex>
                }
            />

            <Descriptions.Item
                label='备注'
                children={seatEntity?.note}
            />
            
        </Descriptions>
    </Flex>

}
