// SPDX-License-Identifier: MulanPSL-2.0
/*
 *
 * 创建于 2024年4月1日 上海市嘉定区
 */

import { Button, Divider, Drawer, Flex, FloatButton, Image, Modal, Popconfirm, Select, Space, Spin, Switch, Table, Tooltip, message } from "antd"
import { ensureGlobalData, globalData, globalHooks } from "../../../common/GlobalData"
import PageRouteManager from "../../../common/PageRoutes/PageRouteManager"
import { useConstructor } from "../../../utils/react-functional-helpers"
import { useState } from "react"
import { IResponse, request } from "../../../utils/request"
import { HttpStatusCode } from "../../../utils/HttpStatusCode"
import { useSearchParams } from "react-router-dom"
import { later } from "../../../utils/later"
import DateTimeUtils from "../../../utils/DateTimeUtils"
import { GroupPermissionEntity, GroupPermissionGrantEntity, SeatEntity, UserEntity, UserGroupEntity } from "../../../api/Entities"
import { GroupPermission } from "../../../api/Permissions"
import { PlusOutlined, UploadOutlined, UserAddOutlined, UsergroupAddOutlined } from "@ant-design/icons"

import '../../../index.css'
import Dragger from "antd/es/upload/Dragger"
import CSVSheet from "../../../utils/CSVSheet"
import { CreateSeatsResponseDto } from "../../../api/SeatController"

import styles from './UserManagement.module.css'


interface UserManagementProps {
    groupId: number | null | undefined
    afterAddSeats?: () => void
}

export function UserManagement(props: UserManagementProps) {

    /* states */

    const [pageLoading, setPageLoading] = useState(false)
    const [tableDataSource, setTableDataSource] = useState([])


    const [addUserDialogOpen, setAddUserDialogOpen] = useState(false)
    const [addUsersDialogOpen, setAddUsersDialogOpen] = useState(false)
    const [addUserDialogConfirmLoading, setAddUserDialogConfirmLoading] = useState(false)
    const [addUsersDialogConfirmLoading, setAddUsersDialogConfirmLoading] = useState(false)

    const [addSeatDrawerTargetUser, setAddSeatDrawerTargetUser] = useState<UserEntity | null>(null)

    const [permissionViewerTargetUser, setPermissionViewerTargetUser] = useState<UserEntity | null>(null)


    /* hooks */



    /* data */



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
                    return globalData.groupPermissions.has(props.groupId, permission)
                }

                const btnStyle = {
                    margin: 4,
                } as React.CSSProperties

                if (hasPermission(GroupPermission.CREATE_OR_DELETE_SEAT)) {
                    buttons.push(
                        <Button ghost style={{margin: 2}}
                            type="primary" shape="round"
                            icon={ <PlusOutlined /> }
                            onClick={() => {
                                setAddSeatDrawerTargetUser(record)
                            }}
                        >
                            创建环境
                        </Button>
                    )
                }

                buttons.push(
                    <Button style={{ margin: 2 }}
                        type="primary"
                        shape="round" ghost
                        onClick={() => {
                            setPermissionViewerTargetUser(record)
                        }}
                    >
                        权限
                    </Button>
                )

                if (hasPermission(GroupPermission.ADD_OR_REMOVE_USER)) {
                    buttons.push(
                        <Popconfirm title='确定？' cancelText='算了' okText='嗯！'
                            style={{
                                margin: 2
                            }}
                            onConfirm={() => {
                                setPageLoading(true)
                                request({
                                    url: 'group/removeUser',
                                    data: {
                                        userId: record.id,
                                        groupId: props.groupId
                                    },
                                    method: 'post',
                                    vfOpts: {
                                        rejectNonOKResults: true,
                                        autoHandleNonOKResults: true,
                                        giveResDataToCaller: true
                                    }
                                }).then(res => {
                                    globalHooks.app.message.success('操作成功')
                                    fetchData()
                                    if (props.afterAddSeats) {
                                        props.afterAddSeats()
                                    }
                                }).catch(_ => {
                                    setPageLoading(false)
                                })
                            }}
                        >
                            <Button danger type="primary" shape="round" ghost>
                                踢掉
                            </Button>
                        </Popconfirm>
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
        if (props.groupId === null || props.groupId === undefined) {
            return
        }

        ensureGlobalData({ resolveLater: true, dontReject: true }).then(res => {

            fetchData()

        })
    }

    /* methods */
    function fetchData() {
        setPageLoading(true)
        request({

            url: 'group/users',
            params: {
                'groupId': props.groupId
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

    if (props.groupId === null || props.groupId === undefined) {
        return null
    }

    function usersTable() {
        return <Table
            columns={ tableColumns }
            dataSource={ tableDataSource }
        />
    }

    
    function addUserFloatingButtonGroup() {

        return [
            <Tooltip title='添加用户'>
                <Button
                    icon={<UserAddOutlined />}
                    shape="circle" ghost
                    type="primary"
                    onClick={() => setAddUserDialogOpen(true)}
                />
            </Tooltip>,
            
            <Tooltip title='批量添加用户'>
                <Button style={{ marginLeft: 8 }}
                    icon={<UsergroupAddOutlined />}
                    shape="circle" ghost
                    type="primary"
                    onClick={() => setAddUsersDialogOpen(true)}
                />
            </Tooltip>,
        ]
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
            暂不支持
        </Modal>
    }


    const toolboxHeight = '48px'
    return <Flex
        vertical
        style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
        }}
    >
        <div style={{
            flexGrow: 1,
            flexShrink: 0,
            height: `calc(100% - ${toolboxHeight})`
        }} className="overflow-y-overlay">
            <Spin spinning={pageLoading}>
                { usersTable() }
            </Spin>
        </div>
        
        { /* toolbox */ }
        <Flex style={{
            height: toolboxHeight,
            flexShrink: 0,
            display: 'inline-block',
            padding: 8,
        }}>
            {
                globalData.groupPermissions?.has(props.groupId, GroupPermission.ADD_OR_REMOVE_USER) 
                
                &&

                addUserFloatingButtonGroup() 
            }
        </Flex>

        { addUserDialog() }
        <AddMultipleUsersDialog
            groupId={props.groupId}
            open={addUsersDialogOpen}
            onClose={() => {
                setAddUsersDialogOpen(false)
            }}
            afterAddSeats={props.afterAddSeats}
        />

        <AddSingleSeatDialog
            onClose={() => setAddSeatDrawerTargetUser(null)}
            user={addSeatDrawerTargetUser}
            groupId={props.groupId}
            afterAddSeats={props.afterAddSeats}
        />

        <PermissionViewer 
            groupId={props.groupId}    
            onClose={() => {setPermissionViewerTargetUser(null)}}
            user={permissionViewerTargetUser}
        />

    </Flex>
} // export function UserManagement(props: UserManagementProps)


/* ================ shared components ================ */

// use template

interface SeatTemplateSelectorProps {
    withTopMargin: boolean
    groupId: number
    show: boolean
    onSelect: (templateSeatId: number) => any
}
function SeatTemplateSelector(props: SeatTemplateSelectorProps) {
    
    // states

    const dropdownEntryForNoTemplate = {
        label: '不使用模板',
        value: -1
    }

    const [templateSeatId, setTemplateSeatId] = useState(-1)
    const [loading, setLoading] = useState(false)
    const [dropdownEntries, setDropdownEntries] = useState([dropdownEntryForNoTemplate])

    // ctor

    useConstructor(constructor)
    function constructor() {
        loadSeatTemplates()
    }

    function loadSeatTemplates() {
        request({
            url: 'seat/seats',
            params: {
                groupId: props.groupId,
                viewAllSeatsInGroup: false,
                alsoSeatsInNonGroupMode: true,
            },
            vfOpts: {
                giveResDataToCaller: true,
                rejectNonOKResults: true,
                autoHandleNonOKResults: true
            }
        }).then(res => {
            dropdownEntries.length = 0
            dropdownEntries.push(dropdownEntryForNoTemplate)
            for (const it of res) {
                dropdownEntries.push({
                    label: `${it.id}: ${it.nickname}`,
                    value: it.id
                })
            }
            setDropdownEntries([...dropdownEntries])
        }).catch(err => {}).finally(() => {
            // do nothing...
        })
    }

    // render

    return <Flex
        style={{
            marginTop: (props.withTopMargin && props.show) ? 16 : 0,
            width: '100%',
            height: props.show ? 32 : 0,
            overflow: 'hidden',
            transition: '0.2s',
            alignItems: 'center'
        }}
    >
        <p>模板</p>
        <Select 
            style={{ 
                flexGrow: 1,
                marginLeft: 16
            }}
            variant='filled'
            options={dropdownEntries}
            value={templateSeatId}
            disabled={!props.show}
            onChange={(value) => {
                setTemplateSeatId(value)
                props.onSelect(value)
            }}
        />
    </Flex>
}


/* ------------ add single seat dialog ------------ */

interface AddSingleSeatDialogProps {
    onClose: () => void
    user: UserEntity | null
    groupId: number
    afterAddSeats?: () => void
}

function AddSingleSeatDialog(props: AddSingleSeatDialogProps) {
    const [loading, setLoading] = useState(false)
    const [templateSeatId, setTemplateSeatId] = useState(-1)

    return <Drawer
        title="创建桌面环境"
        size='large'
        onClose={props.onClose}
        open={props.user !== null}
        destroyOnClose={true}
    >
        <p>目标用户：{props.user?.username}</p>
        
        <Divider />

        <SeatTemplateSelector
            show withTopMargin={false} groupId={props.groupId}
            onSelect={(value) => {
                setTemplateSeatId(value)
            }}
        />

        <Divider />

        <Spin spinning={loading}>
            <Button
                style={{
                    width: '100%'
                }}
                disabled={loading}
                type="primary" shape="round"
                onClick={() => {
                    setLoading(true)
                    request({
                        url: 'seat/new',
                        data: {
                            group: props.groupId,
                            users: [props.user?.id],
                            skel: templateSeatId === -1 ? undefined : templateSeatId,
                            note: `${props.user?.username}在第${props.groupId}组的桌面环境`
                        },
                        method: 'post',
                        vfOpts: {
                            rejectNonOKResults: true,
                            autoHandleNonOKResults: true,
                            giveResDataToCaller: true
                        }
                    }).then(_ => {
                        globalHooks.app.message.success('创建成功')
                        if (props.afterAddSeats) {
                            props.afterAddSeats()
                        }
                        
                    }).catch(() => {}).finally(() => {
                        setLoading(false)
                        props.onClose()
                    })
                }}
            >
                创建
            </Button>
        </Spin>

    </Drawer>
}


/* ------------ add multiple users dialog ------------ */

interface AddMultipleUsersDialogProps {
    groupId: number
    open: boolean
    onClose: () => void
    afterAddSeats?: () => void
}


interface AddMultipleUsersTableEntry {
    userId: number | null
    username: string
    seatId: number | null
    status: 'pending' | 'success' | 'failed'
    msg: string
}

function AddMultipleUsersDialog(props: AddMultipleUsersDialogProps) {

    /* states */

    const [confirmLoading, setConfirmLoading] = useState(false)
    const [tableDataSource, setTableDataSource] = useState<AddMultipleUsersTableEntry[]>([])
    
    const [uploadButtonDisabled, setUploadButtonDisabled] = useState(true)
    const [alsoCreateSeats, setAlsoCreateSeats] = useState(false)
    const [templateSeatId, setTemplateSeatId] = useState(-1)  // set to -1 to disable template


    function commitAddUsers() {
        setConfirmLoading(true)

        request({
            url: 'group/addUsers',
            method: 'post',
            data: {
                groupId: props.groupId,
                usernames: tableDataSource.map(it => it.username)
            },
            vfOpts: {
                rejectNonOKResults: true,
                autoHandleNonOKResults: true,
                giveResDataToCaller: true
            }
        }).then(untypedRes => {
            type ResEntry = {
                userId: number, 
                username: string, 
                success: boolean, 
                msg: string
            }
            const res = untypedRes as ResEntry[]

            const resMap = new Map<string, ResEntry>()

            res.forEach(it => {
                resMap.set(it.username, it)
            })

            for (const it of tableDataSource) {
                const resEntity = resMap.get(it.username)
                if (resEntity) {
                    it.status = resEntity.success ? 'success' : 'failed'
                    it.msg = resEntity.msg
                    if (it.status === 'success') {
                        it.userId = resEntity.userId
                    }
                }
            }

            setTableDataSource([...tableDataSource])
        }).catch(err => {}).finally(() => {
            if (alsoCreateSeats) {
                createSeatsForUsers()
            } else {
                setConfirmLoading(false)
            }
        })
    }


    function createSeatsForUsers() {
        if (!confirmLoading) {
            setConfirmLoading(true)
        }

        request({
            url: 'seat/new',
            method: 'post',
            data: {
                group: props.groupId,
                skel: templateSeatId === -1 ? undefined : templateSeatId,
                users: tableDataSource
                    .filter(it => it.status === 'success')
                    .map(it => it.userId)
            },
            vfOpts: {
                rejectNonOKResults: true,
                autoHandleNonOKResults: true,
                giveResDataToCaller: true
            }
        }).then(untypedRes => {
            const res = untypedRes as CreateSeatsResponseDto
            const successMap = new Map<number, SeatEntity>()  // userId -> SeatEntity
            res.forEach(it => successMap.set(it.userId, it.seatInfo))
            for (const tableIt of tableDataSource) {
                if (tableIt.userId === null) {
                    continue
                }

                if (successMap.has(tableIt.userId)) {
                    tableIt.seatId = successMap.get(tableIt.userId)!.id
                }
            }

            setTableDataSource([...tableDataSource])

            if (props.afterAddSeats) {
                props.afterAddSeats()
            }
        }).catch(err => {}).finally(() => {
            setConfirmLoading(false)
        })
    }


    /* render */

    return <Drawer
        title="批量添加用户"
        size='large'
        destroyOnClose={true}
        open={props.open}
        onClose={() => {
            props.onClose()
        }}
        maskClosable={false}
    ><Spin spinning={confirmLoading}>

        <Image
            width='100%'
            src='https://canfish.oss-cn-shanghai.aliyuncs.com/app/vesper-front/add-users-csv-example.webp'
            style={{
                borderRadius: 8,
                boxShadow: '0 0 8px 4px #6664'
            }}
            preview={false}
        />
        
        <p>将待添加用户信息整理到表格，导出为 CSV 格式。</p>
        <p>首行为表头；待添加用户的用户名在 <b>vesper-username</b> 列，如上图所示。其他列默认忽略。</p>
        
        <Dragger
            name='file'
            multiple={false}
            accept='.csv'
            maxCount={1}
            beforeUpload={(file, fileList) => {
                file.text().then(res => {
                    let csv = new CSVSheet(res)
                    let users = csv.getCol('vesper-username')
                    let dataSource = [] as AddMultipleUsersTableEntry[]
                    if (users !== null) {
                        for (let it of users) {
                            dataSource.push({
                                userId: null,
                                username: it,
                                seatId: null,
                                status: 'pending',
                                msg: '未上传',
                            })
                        }
                    } // if (users !== null)
                    setTableDataSource(dataSource)
                    setUploadButtonDisabled(dataSource.length === 0)
                }) // file.text().then(res =>
                return false
            }} // beforeUpload={(file, fileList) => {
        >
            <p className='ant-upload-drag-icon'>
                <UploadOutlined />
            </p>
            <p className='ant-upload-text'>点击我 或 拖拽 CSV 文件到这里</p>
        </Dragger>

        <Flex vertical style={{
            marginTop: 16,
            background: '#5cb3cc20',
            padding: 16,
            borderRadius: 8,
        }}>
            <Flex style={{flexShrink: 0}}>
                <div style={{
                    flexGrow: 1
                }}>
                    同时创建桌面环境
                </div>
                <Switch
                    checked={alsoCreateSeats}
                    onChange={(checked: boolean) => { setAlsoCreateSeats(checked) }}
                />
            </Flex>

            <SeatTemplateSelector
                withTopMargin={true}
                groupId={props.groupId}
                onSelect={(value) => {
                    setTemplateSeatId(value)
                }}
                show={alsoCreateSeats}
            />


        </Flex>

        <Divider />

        <p>添加信息预览</p>

        <Table
            columns={[
                {
                    title: '用户名',
                    key: 'username',
                    dataIndex: 'username',
                    render: (_: any, record: AddMultipleUsersTableEntry) => {
                        const res = record.username
                        return res
                    }
                },
                {
                    title: '状态',
                    key: 'create-status',
                    dataIndex: 'create-status',
                    render: (_: any, record: AddMultipleUsersTableEntry) => {
                        const style = {} as React.CSSProperties

                        if (record.status === 'failed') {
                            style.color = '#ee3f4d'
                        } else if (record.status === 'success') {
                            style.color = '#41b349'
                        }

                        return <div style={style}>{record.msg}</div>
                    }
                },
                {
                    title: '主机ID',
                    dataIndex: 'seatId',
                    key: 'seatId',
                    render(it: string | null) {
                        return it === null 
                            ? 
                            <div style={{color: '#ee3f4d'}}>
                                未创建
                            </div> 
                            : 
                            <div style={{color: '#41b349'}}>
                                创建成功：{it}
                            </div>
                    }
                },
            ]}

            dataSource={tableDataSource}
        />

        <p>确认信息无误，点击“提交”即可添加用户。</p>

        <Button
            style={{
                width: '100%'
            }}
            type='primary'
            shape='round'
            disabled={uploadButtonDisabled}
            onClick={() => {
                commitAddUsers()
            }}
        >
            提交
        </Button>

        <div style={{ height: 32 }} />
    </Spin></Drawer>
}


interface PermissionViewerProps {
    onClose: () => any
    user: UserEntity | null
    groupId: number
}

function PermissionViewer(props: PermissionViewerProps) {

    const [allPermissions, setAllPermissions] = useState<GroupPermissionEntity[]>([])
    const [userPermissions, setUserPermissions] = useState<GroupPermission[]>([])
    const [grantPermissionLoading, setGrantPermissionLoading] = useState<GroupPermission[]>([])
    const [user, setUser] = useState<UserEntity | null>(null)

    if (user !== props.user) {
        setUser(props.user)
        setUserPermissions([])

        if (props.user !== null) {
            request({
                url: 'group/permissions',
                params: {
                    userId: props.user?.id,
                    groupId: props.groupId
                },
                vfOpts: {
                    rejectNonOKResults: true,
                    autoHandleNonOKResults: true,
                    giveResDataToCaller: true
                }
            }).then(untypedRes => {
                const res = untypedRes as GroupPermissionGrantEntity[]
                setUserPermissions(res.map(it => it.permissionId))
            }).catch(_ => {})
        }
    }

    if (allPermissions.length === 0) {
        request({
            url: 'group/allPermissions',
            vfOpts: {
                rejectNonOKResults: true, 
                autoHandleNonOKResults: true, 
                giveResDataToCaller: true
            }
        }).then(res => {
            setAllPermissions(res)
        }).catch(_ => {})
    }

    return <Drawer open={props.user !== null}
        size="large"
        title="组内权限"
        destroyOnClose={true}
        onClose={props.onClose}
    >
        <p>用户：{user?.username} ({user?.id})</p>
        <Divider />

        <table rules='none' cellPadding={12}>
            {
                allPermissions.map((it) => {
                    return <tr className={styles.tableRow}> 
                        <td className={styles.tableCell}>{it.id}</td>
                        <td className={styles.tableCell}>{it.enumKey}</td>
                        
                        <td className={styles.tableCell}>
                            {it.note}
                        </td>
                        <td className={styles.tableCell}>
                            <Switch
                                disabled={ 
                                    !globalData.groupPermissions.contains(props.groupId, GroupPermission.GRANT_PERMISSION)
                                }
                                checked={
                                    userPermissions.includes(it.id)
                                }
                                loading={
                                    grantPermissionLoading.includes(it.id)
                                }
                                onChange={(checked: boolean, event: any) => {
                                    if (!grantPermissionLoading.includes(it.id)) {
                                        grantPermissionLoading.push(it.id)
                                        setGrantPermissionLoading([...grantPermissionLoading])
                                    }

                                    request({
                                        url: 'group/grantPermission',
                                        data: {
                                            permission: it.id,
                                            grant: checked,
                                            targetUserId: props.user?.id,
                                            groupId: props.groupId
                                        },
                                        method: 'post',
                                        vfOpts: {
                                            rejectNonOKResults: true,
                                            autoHandleNonOKResults: true,
                                            giveResDataToCaller: true
                                        }
                                    }).then(res => {

                                        message.success('赋权编辑成功')

                                        if (checked) {
                                            userPermissions.push(it.id)
                                        } else {
                                            userPermissions.splice(
                                                userPermissions.indexOf(it.id), 1
                                            )
                                        }
                                        setUserPermissions([...userPermissions])

                                    }).catch(_ => {}).finally(() => {
                                        grantPermissionLoading.splice(
                                            grantPermissionLoading.indexOf(it.id), 1
                                        )
                                        setGrantPermissionLoading([...grantPermissionLoading])
                                    })
                                }}
                            />
                        </td>
                    </tr>
                })
            }
        </table>

    </Drawer>
}
