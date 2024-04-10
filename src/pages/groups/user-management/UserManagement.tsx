// SPDX-License-Identifier: MulanPSL-2.0
/*
 *
 * 创建于 2024年4月1日 上海市嘉定区
 */

import { Button, Drawer, FloatButton, Modal, Space, Spin, Table, message } from "antd"
import { ensureGlobalData, globalData, globalHooks } from "../../../common/GlobalData"
import PageRouteManager from "../../../common/PageRoutes/PageRouteManager"
import { loadPageToLayoutFrame } from "../../../components/LayoutFrame/LayoutFrame"
import { useConstructor } from "../../../utils/react-functional-helpers"
import { useState } from "react"
import { IResponse, request } from "../../../utils/request"
import { HttpStatusCode } from "../../../utils/HttpStatusCode"
import { useSearchParams } from "react-router-dom"
import { later } from "../../../utils/later"
import DateTimeUtils from "../../../utils/DateTimeUtils"
import { UserEntity } from "../../../api/Entities"
import { GroupPermission } from "../../../api/Permissions"
import { PlusOutlined, UserAddOutlined, UsergroupAddOutlined } from "@ant-design/icons"


export function UserManagementPage() {

    const pageEntity = PageRouteManager.getRouteEntity("/groups/user-management")

    /* states */

    const [pageLoading, setPageLoading] = useState(false)
    const [tableDataSource, setTableDataSource] = useState([])


    const [addUserDialogOpen, setAddUserDialogOpen] = useState(false)
    const [addUsersDialogOpen, setAddUsersDialogOpen] = useState(false)
    const [addUserDialogConfirmLoading, setAddUserDialogConfirmLoading] = useState(false)
    const [addUsersDialogConfirmLoading, setAddUsersDialogConfirmLoading] = useState(false)


    const [addSeatDrawerOpen, setAddSeatDrawerOpen] = useState(false)
    const [addSeatDrawerTargetUser, setAddSeatDrawerTargetUser] = useState(-1)

    /* hooks */

    const [searchParams, setSearchParams] = useSearchParams()


    /* data */

    const groupId = Number(searchParams.get('groupId'))


    /* table columns */

    const tableColumns = [
        {
            title: '用户',
            dataIndex: 'username',
            key: 'username',
            render(_: any, record: UserEntity) {
                return `${record.username} (${record.id})`
            }
        },
        {
            title: '上次登录时间',
            dataIndex: 'lastLoginTime',
            key: 'lastLoginTime',
            render(it: string) {
                return DateTimeUtils.iso8601toHumanFriendly(it)
            }
        },

        {
            title: '操作',
            dataIndex: 'op',
            key: 'op',
            render: (_: any, record: UserEntity) => {

                let buttons = [] as any[]

                const hasPermission = (permission: GroupPermission) => {
                    return globalData.groupPermissions.has(groupId, permission)
                }

                const btnStyle = {
                    margin: 4,
                } as React.CSSProperties

                if (hasPermission(GroupPermission.CREATE_OR_DELETE_SEAT)) {
                    buttons.push(
                        <Button
                            type="primary"
                            icon={ <PlusOutlined /> }
                            onClick={() => {
                                setAddSeatDrawerTargetUser(record.id)
                                setAddSeatDrawerOpen(true)
                            }}
                        >
                            主机环境
                        </Button>
                    )
                }

                return <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                    }}
                >
                    { buttons }
                </div>
            },
        }
    ]

    /* ctor */
    useConstructor(constructor)
    function constructor() {

        ensureGlobalData({ resolveLater: true, dontReject: true }).then(res => {

            loadPageToLayoutFrame(pageEntity)

            if (!searchParams.has('groupId')) {
                message.warning('groupId required')
                globalHooks.app.navigate!({ pathname: '/groups' })
                return
            }

            fetchData()

        })
    }

    /* methods */
    function fetchData() {
        setPageLoading(true)
        request({

            url: 'group/users',
            params: {
                'groupId': Number(searchParams.get('groupId'))
            },


            vfOpts: {
                autoHandleNonOKResults: true,
                rejectNonOKResults: true,
                giveResDataToCaller: true
            }

        }).then(res => {
            
            setTableDataSource(res as any)

        }).catch(() => {})
        .finally(() => {
            setPageLoading(false)
        })
    }

    /* render */

    function usersTable() {
        return <Table
            columns={ tableColumns }
            dataSource={ tableDataSource }
        />
    }

    
    function addUserFloatingButtonGroup() {
        return <FloatButton.Group shape="circle"
            trigger="hover"
            type="primary"
            icon={ <UserAddOutlined /> }
        >
            <FloatButton icon={<UserAddOutlined />} type='default' onClick={ () => { setAddUserDialogOpen(true) } } />

            <FloatButton icon={<UsergroupAddOutlined />} type='default' onClick={ () => { setAddUsersDialogOpen(true) } } />
        </FloatButton.Group>
    }


    function addUserDialog() {
        return <Modal
            title='添加用户'
            centered={true}
            closable={true}
            open={addUserDialogOpen}
            destroyOnClose={true}
            confirmLoading={addUserDialogConfirmLoading}
            onCancel={() => setAddUserDialogOpen(false)}
        >
            { /* todo */ }
        </Modal>
    }

    function addUsersDialog() {
        return <Modal
            title='批量添加用户'
            centered={true}
            closable={true}
            open={addUsersDialogOpen}
            destroyOnClose={true}
            confirmLoading={addUsersDialogConfirmLoading}
            onCancel={() => setAddUsersDialogOpen(false)}
        >
            敬请期待
        </Modal>
    }


    function addSeatDrawer() {
        return <Drawer title="添加桌面环境"
            open={ addSeatDrawerOpen }
            
            onClose={() => setAddSeatDrawerOpen(false)}
            destroyOnClose={ true }
            extra={
                <Space>
                    <Button 
                        onClick={() => setAddSeatDrawerOpen(false)}
                    >
                        取消
                    </Button>
                    <Button 
                        type="primary"
                        onClick={() => {
                            // todo
                            request({
                                url: 'seat/new',
                                data: {
                                    group: groupId,
                                    users: [addSeatDrawerTargetUser],
                                    note: `desktop env for user: ${addSeatDrawerTargetUser}`
                                },
                                method: 'post',
                                vfOpts: {
                                    rejectNonOKResults: true,
                                    autoHandleNonOKResults: true,
                                    giveResDataToCaller: true
                                }
                            }).then(res => {
                                // todo
                                
                            }).catch(() => {}).finally(() => {
                                setAddSeatDrawerOpen(false)
                            })
                        }}

                    >
                        添加
                    </Button>
                </Space>
            }
        >

        </Drawer>
    }


    return <div
    
    ><Spin spinning={pageLoading}>
        
        { usersTable() }

        {
            globalData.groupPermissions?.has(groupId, GroupPermission.ADD_OR_REMOVE_USER) 
            
            &&

            addUserFloatingButtonGroup() 
        }

        { addUserDialog() }
        { addUsersDialog() }
        { addSeatDrawer() }

    </Spin></div>
}

