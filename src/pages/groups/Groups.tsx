// SPDX-License-Identifier: MulanPSL-2.0
/*
 *
 * 创建于 2024年3月28日 上海市嘉定区
 */

import { Button, FloatButton, Input, Modal, Popover, Table, Tooltip, message } from "antd";
import { ensureGlobalData, globalData, globalHooks } from "../../common/GlobalData";
import PageRouteManager from "../../common/PageRoutes/PageRouteManager";
import { loadPageToLayoutFrame } from "../../components/LayoutFrame/LayoutFrame";
import { useConstructor } from "../../utils/react-functional-helpers";
import { GroupPermission, Permission } from "../../api/Permissions";
import { DeleteOutlined, GroupOutlined, PlusOutlined, UserOutlined } from "@ant-design/icons";
import React, { useState } from "react";

import { Typography } from "antd"
import { IResponse, request } from "../../utils/request";
import { HttpStatusCode } from "../../utils/HttpStatusCode";
import DateTimeUtils from "../../utils/DateTimeUtils";

const { Title, Text } = Typography
const { TextArea } = Input


export default function GroupsPage() {

    const pageEntity = PageRouteManager.getRouteEntity('/groups')


    /* states */

    const [pageLoading, setPageLoading] = useState(false)

    const [addGroupModalOpen, setAddGroupModalOpen] = useState(false)
    const [addGroupModalConfirmLoading, setAddGroupModalConfirmLoading] = useState(false)

    const [tableDataSource, setTableDataSource] = useState([])

    // remove group modal

    const [removeGroupConfirmLoading, setRemoveGroupConfirmLoading] = useState(false)

    // set to null so the modal will not shown.
    const [groupToBeRemoved, setGroupToBeRemoved] = useState<any>(null)
    const [removeGroupConfirmTextTyped, setRemoveGroupConfirmTextTyped] = useState("")

    /* constructor */

    useConstructor(constructor)
    function constructor() {
        
        ensureGlobalData().then(() => {

            loadPageToLayoutFrame(pageEntity)
            fetchData()
        
        }).catch(() => {})
    
    }

    /* table columns */

    const tableColumns = [
        {
            title: '群组',
            dataIndex: 'groupName',
            key: 'groupName',
            render: (_: any, record: any) => {
                return `${record.id} - ${record.groupName}`
            }
        },
        {
            title: '创建时间',
            dataIndex: 'createTime',
            key: 'createTime',
            render: (it: string) => {
                return DateTimeUtils.iso8601toHumanFriendly(it)
            }
        },
        {
            title: '成员数',
            dataIndex: 'membersCount',
            key: 'membersCount',
        },
        {
            title: '备注',
            dataIndex: 'note',
            key: 'note',
            render: (it: string) => {
                return <Popover content={it}>
                    <p 
                        style={{
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            maxWidth: 80
                        }}
                    >
                        { it }
                    </p>
                </Popover>
            }
        },

        {
            title: '操作',
            key: 'op',
            dataIndex: 'op',
            render: (_: any, record: any) => {
                let buttons = [] as any[]

                const hasPermission = (groupId: number, permission: GroupPermission) => {
                    return globalData.groupPermissions.contains(groupId, permission)
                }
                
                const btnStyle = {
                    margin: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                } as React.CSSProperties

                if (hasPermission(record.id, GroupPermission.ADD_OR_REMOVE_USER)) {
                    buttons.push(
                        <Tooltip title='用户管理'>
                            <Button
                                style={ btnStyle }
                                type="primary"
                                shape="circle"

                                icon={ <UserOutlined /> }
                                onClick={() => {
                                    globalHooks.app.navigate!({ pathname: '/groups/user-management' })
                                }}
                            />
                        </Tooltip>
                        
                    )
                }

                if (hasPermission(record.id, GroupPermission.DROP_GROUP)) {
                    buttons.push(
                        <Tooltip title='删除群组'>
                            <Button
                                style={ btnStyle }
                                type="primary"
                                shape="circle"
                                danger
                                icon={ <DeleteOutlined /> }
                                onClick={ () => {
                                    setGroupToBeRemoved(record)
                                    console.log(groupToBeRemoved)
                                }}
                            />
                        </Tooltip>
                    )
                }

                return buttons
            }
        }
    ] as any[]


    /* methods */


    function fetchData() {
        setPageLoading(true)
        request({
            url: 'group/groups'
        }).then(res => {
            res = res as IResponse
            if (res.code !== HttpStatusCode.OK) {
                message.error(res.msg)
                return
            }

            setTableDataSource(res.data)
        }).catch(() => {

        }).finally(() => {
            setPageLoading(false)
        })
    }


    
    /* render */


    function addGroupModal() {
        const formData = {
            name: "",
            note: ""
        }

        const GROUP_NOTE_MAX_LENGTH = 200

        return <Modal
            open={ addGroupModalOpen }
            confirmLoading={ addGroupModalConfirmLoading }
            centered={ true }
            onCancel={ () => setAddGroupModalOpen(false) }
            onOk={() => {
                setAddGroupModalConfirmLoading(true)
                request({
                    url: 'group/create',
                    method: 'post',
                    data: {
                        name: formData.name,
                        note: formData.note
                    }
                }).then(res => {
                    res = res as IResponse
                    if (res.code !== HttpStatusCode.OK) {
                        message.error(res.msg)
                        return
                    }

                    setAddGroupModalOpen(false)

                    ensureGlobalData({
                        dontReject: true, 
                        forceReloadGroupPermissions: true
                    }).then(() => {
                        fetchData()
                    })
                }).catch(() => {
                    // do nothing.
                }).finally(() => {
                    setAddGroupModalConfirmLoading(false)
                    
                })
            }}
            maskClosable={ false }
            closable={ true }
            destroyOnClose={ true }
            title="新建群组"
        > { /* modal context begin */ }
            <Text>名称</Text>
            <Input
                onChange={(event) => {
                    formData.name = event.target.value
                }}
            />

            <div style={{ height: 16 }} />

            <Text>备注</Text>
            <TextArea
                maxLength={ GROUP_NOTE_MAX_LENGTH }
                count={{
                    show: true,
                    max: GROUP_NOTE_MAX_LENGTH
                }}
                onChange={(event) => {
                    formData.note = event.target.value
                }}
            />

            <div style={{ height: 16 }} />
            { /* modal context end */ }
        </Modal>
    }


    function addGroupFloatingButton(): React.JSX.Element | string | null {
        if ( !globalData.userPermissions.contains(Permission.CREATE_GROUP) ) {
            return null
        }

        return <FloatButton
            icon={ <PlusOutlined /> }
            type="primary"
            onClick={() => setAddGroupModalOpen(true) }
        />
    }


    function groupsTable() {

        return <Table
            columns={ tableColumns }
            dataSource={ tableDataSource }
        />
    }


    function removeGroupModal() {

        const removeGroupConfirmText = `${groupToBeRemoved.groupName}`

        return <Modal
            title={ `删除群组：${groupToBeRemoved.groupName} (${groupToBeRemoved.id})` }
            confirmLoading={ removeGroupConfirmLoading }
            destroyOnClose={ true }
            centered={ true }
            onCancel={() => setGroupToBeRemoved(null)}
            open={ groupToBeRemoved !== null }
            onOk={() => {
                if (removeGroupConfirmTextTyped !== removeGroupConfirmText)
                    return

                setRemoveGroupConfirmLoading(true)
                request({
                    url: 'group/remove',
                    method: 'post',
                    data: {
                        groupId: groupToBeRemoved.id
                    }
                }).then(res => {
                    res = res as IResponse
                    if (res.code !== HttpStatusCode.OK) {
                        message.error(res.msg)
                        return
                    }

                    message.success(`已删除：${groupToBeRemoved.groupName}`)
                    setGroupToBeRemoved(null)
                    setRemoveGroupConfirmTextTyped("")
                    fetchData()
                }).catch(() => {

                }).finally(() => {
                    setRemoveGroupConfirmLoading(false)
                })
            }}
        >
            <p>所有组员将被移出群组。组内的所有桌面环境将被删除。</p>
            <p>请输入<b>{removeGroupConfirmText}</b>以继续。</p>

            <Input 
                placeholder={ `在此输入：${removeGroupConfirmText}` }
                onChange={(event) => {
                    setRemoveGroupConfirmTextTyped(event.target.value)
                }}
                status={ removeGroupConfirmTextTyped === removeGroupConfirmText ? "" : "error" }
            />
        </Modal>
    }


    return <div style={{
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        display: 'flex',
        flexDirection: 'column',
        
    }}>

        { /* floating components */ }
        { addGroupFloatingButton() }
        { addGroupModal() }
        { groupToBeRemoved !== null && removeGroupModal() }

        { groupsTable() }


    </div>

}
