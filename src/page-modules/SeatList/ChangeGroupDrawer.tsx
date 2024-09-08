/* SPDX-License-Identifier: MulanPSL-2.0 */

import { useState } from "react"
import { useConstructor } from "../../utils/react-functional-helpers"
import { Button, Drawer, Flex, Select } from "antd"
import { SeatEntity } from "../../api/Entities"
import { GetSeatsResponseDtoEntry } from "../../api/SeatController"
import { GetGroupsResponseDto, GetGroupsResponseDtoEntry } from "../../api/GroupController"
import { IResponse, request } from "../../utils/request"
import { HttpStatusCode } from "../../utils/HttpStatusCode"
import { globalHooks } from "../../common/GlobalData"


export interface ChangeGroupDrawerProps {
    onClose: (newGroup: number | null) => void
    seat: GetSeatsResponseDtoEntry | null
}


const globalGroup = {
    value: -1,
    label: '无群组'
}


export function ChangeGroupDrawer(props: ChangeGroupDrawerProps) {

    /* states */

    const [loading, setLoading] = useState(false)
    const [groupList, setGroupList] = useState([globalGroup])
    const [targetGroup, setTargetGroup] = useState(-1)


    /* methods */

    function close(newGroup: number | null) {
        setLoading(false)
        setTargetGroup(-1)
        props.onClose(newGroup)
    }


    useConstructor(ctor)
    function ctor() {
        loadGroupList()
    }


    function loadGroupList() {
        setLoading(true)
        request({
            url: 'group/groups',
            vfOpts: {
                giveResDataToCaller: true,
                autoHandleNonOKResults: true,
                rejectNonOKResults: true
            }
        }).then((res: GetGroupsResponseDto) => {

            setGroupList([
                globalGroup,
                ...res.map((it) => {
                    return {
                        label: `${it.groupName} (${it.id})`, 
                        value: it.id
                    }
                })
            ])

        }).catch(err => {}).finally(() => {
            setLoading(false)
        })
    }


    function commit() {

        const toGroup = targetGroup === -1 ? null : targetGroup

        setLoading(true)
        request({
            url: 'seat/changeGroup',
            method: 'post',
            data: {
                seatId: props.seat?.id,
                toGroup: toGroup
            }
        }).then((res: IResponse<void>) => {

            if (res.code === HttpStatusCode.OK) {
                globalHooks.app.message.success('操作成功')
                close(toGroup)
            } else {
                globalHooks.app.message.error(res.msg)
            }

        }).catch(err => {}).finally(() => {
            setLoading(false)
        })
    }


    /* render */
    
    const colorBoxStyle = {
        borderRadius: 8,
        boxSizing: 'border-box',
        padding: 8,
        background: '#1a94bc20',
        alignItems: 'center'
    } as React.CSSProperties

    return <Drawer
        open={props.seat !== null}
        onClose={() => {
            close(props.seat!.groupId)
        }}
        destroyOnClose={true}
        maskClosable={false}
        title={'换组'}
    >
        <p>
            主机：{ props.seat?.nickname } ({ props.seat?.id })
        </p>

        <div style={colorBoxStyle}>
            当前组：{ props.seat?.groupname } ({ props.seat?.groupId })
            
        </div>

        <div style={{ height: 8 }} />

        <Flex style={colorBoxStyle}>
            <p>目标组：</p>
            <Select 
                style={{ 
                    flexGrow: 1,
                    marginLeft: 16
                }}
                variant='filled'
                options={groupList}
                value={targetGroup}
                disabled={loading}
                onChange={(value) => {
                    setTargetGroup(value)
                }}
            />
        </Flex>

        <Button
            type="primary" shape="round" style={{ marginTop: 8, width: '100%' }}
            disabled={loading}
            onClick={commit}
        >
            提交
        </Button>

    </Drawer>
}

