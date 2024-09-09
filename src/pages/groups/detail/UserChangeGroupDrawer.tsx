// SPDX-License-Identifier: MulanPSL-2.0

import { Alert, Button, Drawer, Flex, Radio, Select, Switch } from "antd";
import { UserEntity } from "../../../api/Entities";
import { useConstructor } from "../../../utils/react-functional-helpers";
import { useState } from "react";
import { IResponse, request } from "../../../utils/request";
import { GetGroupsResponseDto } from "../../../api/GroupController";
import { globalHooks } from "../../../common/GlobalData";
import { HttpStatusCode } from "../../../utils/HttpStatusCode";


export interface UserChangeGroupDrawerProps {
    user: UserEntity | null
    onClose: (success: boolean) => void
    fromGroup: number
}


const placeHolderGroup = {
    value: -1,
    label: '无'
}


export function UserChangeGroupDrawer(props: UserChangeGroupDrawerProps) {
    /* states */

    const [loading, setLoading] = useState(false)
    const [toGroup, setToGroup] = useState(-1)
    const [groupList, setGroupList] = useState([placeHolderGroup])
    const [deleteSeatsInsteadOfMove, setDeleteSeatsInsteadOfMove] = useState(false)
    const [ignoreUserAlreadyCreatedError, setIgnoreUserAlreadyCreatedError] = useState(false)

    const [showAlert, setShowAlert] = useState(false)
    const [alertType, setAlertType] = useState<'success' | 'info' | 'warning' | 'error'>('info')
    const [alertMsg, setAlertMsg] = useState('')

    /* methods */

    function close(success: boolean) {
        setToGroup(-1)
        setDeleteSeatsInsteadOfMove(false)
        setIgnoreUserAlreadyCreatedError(false)

        setShowAlert(false)

        props.onClose(success)
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
                placeHolderGroup,
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


    function groupNameOf(id: number): string {
        for (const it of groupList) {
            if (it.value === id)
                return it.label
        }

        return '未知'
    }


    function commit() {
        if (toGroup === placeHolderGroup.value) {
            setShowAlert(true)
            setAlertType('warning')
            setAlertMsg('请填写正确的目标组。')
            return
        }

        setLoading(true)
        setShowAlert(false)
        
        request({
            url: 'group/moveUser',
            method: 'post',
            data: {
                userId: props.user?.id,
                fromGroup: props.fromGroup,
                toGroup: toGroup,
                deleteSeatsInsteadOfMove: deleteSeatsInsteadOfMove,
                ignoreUserAlreadyCreatedError: ignoreUserAlreadyCreatedError
            }
        }).then((res: IResponse<void>) => {
            if (res.code === HttpStatusCode.OK) {
                globalHooks.app.message.success('迁移成功。')
                close(true)
            } else {
                setShowAlert(true)
                setAlertType('error')
                setAlertMsg(res.msg)
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
        destroyOnClose={true}
        onClose={() => close(false)}
        maskClosable={false}
        title={'换组'}
        open={props.user !== null}
    >

        <p>
            将用户从一个组迁移到另一个组。
        </p>

        <p style={{color: "#ee3f4d"}}><b>
            该用户在本组的所有权限将被移除！
            <br/>若要保留权限，请在迁移后到新组重新赋权。
        </b></p>

        <div style={colorBoxStyle}>
            用户：{props.user?.username} ({props.user?.id})
        </div>

        <div style={{ height: 8 }} />

        <div style={colorBoxStyle}>
            当前组：{groupNameOf(props.fromGroup)}
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
                value={toGroup}
                disabled={loading}
                onChange={(value) => {
                    setToGroup(value)
                }}
            />
        </Flex>

        
        <div style={{ height: 8 }} />

        <Flex style={colorBoxStyle}>
            <p>主机处理：</p>
            <Radio.Group 
                defaultValue={deleteSeatsInsteadOfMove} 
                buttonStyle="solid"
                onChange={(e) => {
                    setDeleteSeatsInsteadOfMove(e.target.value)
                }}
            >
                <Radio.Button value={false}>移入新组</Radio.Button>
                <Radio.Button value={true}>直接删除</Radio.Button>
            </Radio.Group>
        </Flex>

        
        <div style={{ height: 8 }} />

        <div style={colorBoxStyle}>
            <Flex style={colorBoxStyle}>
                <p>忽略新建用户失败问题：</p>
                <Radio.Group 
                    defaultValue={ignoreUserAlreadyCreatedError} 
                    buttonStyle="solid"
                    onChange={(e) => {
                        setIgnoreUserAlreadyCreatedError(e.target.value)
                    }}
                >
                    <Radio.Button value={false}>否</Radio.Button>
                    <Radio.Button value={true}>是</Radio.Button>
                </Radio.Group>
            </Flex>

            <p>
                该设置指定当检测到用户已在目标组时，系统应如何做。
                <br />
                当检测到用户已在目标组，<b>是</b>会让系统取消迁移操作；<b>否</b>会让系统继续完成用户迁移。
            </p>
        </div>

        <Button
            type="primary" shape="round" style={{ marginTop: 8, width: '100%' }}
            disabled={loading}
            onClick={commit}
        >
            提交
        </Button>

        {
            showAlert
            &&
            <Alert
                showIcon
                style={{
                    marginTop: 16
                }}
                type={alertType}
                message={alertMsg}
            />
        }

    </Drawer>

}

