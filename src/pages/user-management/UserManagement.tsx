/* SPDX-License-Identifier: MulanPSL-2.0 */

/*

    创建于2024年3月14日 上海市嘉定区
*/

import React, { useState } from 'react'
import { ensureGlobalData, globalData, globalHooks } from '../../common/GlobalData'
import PageRouteManager from '../../common/PageRoutes/PageRouteManager'
import './UserManagement.module.css'
import { useConstructor } from '../../utils/react-functional-helpers'
import { Button, Card, Descriptions, Divider, Drawer, FloatButton, Form, Image, Input, Modal, Spin, Switch, Table, TablePaginationConfig, Tooltip, message } from 'antd'
import { PermissionEntity, UserEntity } from '../../api/Entities'
import { IResponse, request } from '../../utils/request'
import { HttpStatusCode } from '../../utils/HttpStatusCode'
import DateTimeUtils from '../../utils/DateTimeUtils'
import { Permission } from '../../api/Permissions'
import { CrownOutlined, CrownTwoTone, EyeOutlined, InboxOutlined, PlusOutlined, UploadOutlined, UserAddOutlined, UsergroupAddOutlined } from '@ant-design/icons'
import XlsxUtils from '../../utils/XlsxUtils'
import * as XLSX from 'xlsx'
import Dragger from 'antd/es/upload/Dragger'
import { RcFile } from 'antd/es/upload'
import CSVSheet from '../../utils/CSVSheet'
import { PermissionStore } from '../../common/PermissionStore'
import styles from './UserManagement.module.css'


export default function UserManagementPage() {
    const pageEntity = PageRouteManager.getRouteEntity('/user-management')

    /* table columns */

    const tableColumns = [
        {
            title: '用户id',
            dataIndex: 'id',
            key: 'id'
        },
        {
            title: '用户名',
            dataIndex: 'username',
            key: 'username'
        },
        {
            title: '注册者',
            dataIndex: 'creator',
            key: 'creator',
        },
        {
            title: '注册时间',
            dataIndex: 'createTime',
            key: 'createTime',
            render: (it: string) => {
                return DateTimeUtils.iso8601toHumanFriendly(it)
            }
        },
        {
            title: '上次登录时间',
            dataIndex: 'lastLoginTime',
            key: 'lastLoginTime',
            render: (it: string | null) => {
                if (it === null) {
                    return "未曾登录"
                }

                return DateTimeUtils.iso8601toHumanFriendly(it)
            }
        },
        {
            title: '操作',
            key: 'op',
            render: tableRowOperations
        }
    ]

    /* states */

    const [loading, setLoading] = useState<boolean>(false)
    const [tablePagination, setTablePagination] = useState<TablePaginationConfig>({
        pageSize: 10,
        total: 100,
        current: 1,
    })
    const [tableDataSource, setTableDataSource] = useState<UserEntity[]>([])
    const [addUserDialogOpen, setAddUserDialogOpen] = useState(false)
    const [addUsersDialogOpen, setAddUsersDialogOpen] = useState(false)

    const [viewDetailUserId, setViewDetailUserId] = useState<number | null>(null)

    /* constructor */

    function constructor() {
        
        globalHooks.layoutFrame.setCurrentPageEntity(pageEntity)

        ensureGlobalData().then(() => {
            loadTablePage(1, 10)
        }).catch(() => {})

        
    }
    useConstructor(constructor)

    /* methods */


    function loadTablePage(pageNo?: number, pageSize?: number) {
        setLoading(true)

        request({
            url: 'user/allUsers'
        }).then(res => {
            res = res as IResponse
            if (res.code !== HttpStatusCode.OK) {
                message.error(res.msg)
                return
            }

            let data = res.data as UserEntity[]

            setTableDataSource(data)
            
        }).catch(err => {

        }).finally(() => {
            setLoading(false)
        })
    }


    /* render */

    function tableRowOperations(_: any, user: UserEntity) {
        let buttons = []

        const hasPermission = (permission: Permission) => {
            return globalData.userPermissions.contains(permission)
        }

        
        buttons.push(
            <Tooltip title='详细'>
                <Button
                    type='primary'
                    shape='circle'
                    icon={ <EyeOutlined /> }
                    onClick={() => {
                        setViewDetailUserId(user.id)
                    }}
                />
            </Tooltip>
        )
    

        return <div
            style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
            }}
        >
            {buttons}
        </div>
    }

    
    function filter(): React.ReactNode {
        return ''
    }


    return <div style={{
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        position: 'absolute'
    }} className='overflow-y-overlay'><Spin spinning={loading}>
        
        { /* 筛选器。 */ }
        { filter() }

        { /* 表格。 */ }
        <Table
            style={{
                width: '100%',
                marginTop: 12
            }}

            columns={ tableColumns }
            dataSource={ tableDataSource }
            // todo: pagination={ tablePagination }
            onChange={(newPagination) => {
                // todo
            }}

        />
        
        { /* 新建用户。 */ }
        {
            globalData.userPermissions?.includes(Permission.CREATE_AND_DELETE_USER)
            
            &&

            <FloatButton.Group shape='circle' trigger='hover' type='primary' icon={<PlusOutlined />}>
                <FloatButton icon={<UserAddOutlined />} type='default' onClick={ () => { setAddUserDialogOpen(true) } } />

                <FloatButton icon={<UsergroupAddOutlined />} type='default' onClick={ () => { setAddUsersDialogOpen(true) } } />
            </FloatButton.Group>
        }


        <UserDetailDialog
            onClose={() => {
                setViewDetailUserId(null)
            }}
            userId={viewDetailUserId}
        />
        

        <AddSingleUserDialog
            onCancel={() => {
                setAddUserDialogOpen(false)
                loadTablePage()
            }}
            open={addUserDialogOpen}
        />
          
        <AddUsersDialog 
            onClose={() => {
                setAddUsersDialogOpen(false)
                loadTablePage()
            }}
            open={addUsersDialogOpen}
        />

    </Spin></div>
}



/* ------------ User Detail Dialog ------------ */

interface UserDetailDialogProps {
    onClose: () => void
    userId: number | null
}

function UserDetailDialog(props: UserDetailDialogProps) {

    const [userEntity, setUserEntity] = useState<
        (UserEntity 
            & 
            {
                groupsIn: number, 
                seatsOwned: number,
                creatorEntity: UserEntity
            }
        ) 
        | null
    >(null)

    const [allPermissions, setAllPermissions] = useState<PermissionEntity[]>([])
    const [userPermissions, setUserPermissions] = useState<Permission[]>([])
    const [grantPermissionLoading, setGrantPermissionLoading] = useState<Permission[]>([])

    if (props.userId !== null && userEntity?.id !== props.userId) {
        request({
            url: 'user/userDetail',
            params: {
                targetUserId: props.userId
            },
            vfOpts: {
                giveResDataToCaller: true,
                rejectNonOKResults: true,
                autoHandleNonOKResults: true
            }
        }).then(res => {
            setUserEntity(res)
        }).catch(_ => {}).finally(() => {

        })

        request({
            url: 'user/userPermissions',
            params: {
                targetUserId: props.userId
            },
            vfOpts: {
                giveResDataToCaller: true,
                rejectNonOKResults: true,
                autoHandleNonOKResults: true
            }
        }).then(res => {
            setUserPermissions(res)
        }).catch(_ => {})
    }

    if (allPermissions.length === 0) {
        request({
            url: 'user/allPermissions',
            vfOpts: {
                giveResDataToCaller: true,
                rejectNonOKResults: true,
                autoHandleNonOKResults: true
            }
        }).then(res => {
            setAllPermissions(res)
        }).catch(_ => {})
    }


    return <Drawer
        open={props.userId !== null}
        onClose={props.onClose}
        size='large'
        title={userEntity ? `${userEntity.username} (${userEntity.id})` : '请稍候'}
    >
        {
            userEntity 
            &&

            <Descriptions bordered>
                <Descriptions.Item label='用户名'
                    children={ <b>{userEntity.username}</b> }
                />
                <Descriptions.Item label='用户ID'
                    children={ userEntity.id }
                />
                <Descriptions.Item label='创建者'
                    children={ `${userEntity.creatorEntity?.username} (${userEntity.creator})` }
                />
                <Descriptions.Item label='注册时间'
                    children={ DateTimeUtils.iso8601toHumanFriendly(userEntity.createTime) }
                />
                <Descriptions.Item label='上次登录'
                    children={ 
                        userEntity.lastLoginTime 
                        ? 
                        DateTimeUtils.iso8601toHumanFriendly(userEntity.lastLoginTime) 
                        :
                        '未曾登录' 
                    }
                />
                <Descriptions.Item label='所在群组数'
                    children={userEntity.groupsIn}
                />
                <Descriptions.Item label='桌面环境数'
                    children={userEntity.seatsOwned}
                />
            </Descriptions>
        }

        <Divider />
        <p><b>权限</b></p>

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
                                    !globalData.userPermissions.contains(Permission.GRANT_PERMISSION)
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
                                        url: 'user/grantPermission',
                                        data: {
                                            permission: it.id,
                                            grant: checked,
                                            targetUserId: props.userId
                                        },
                                        method: 'post'
                                    }).then(res => {
                                        res = res as IResponse
                                        if (res.code !== HttpStatusCode.OK) {
                                            message.error(res.msg)
                                            return
                                        }

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
        
        <div style={{ height: 16 }} />
    </Drawer>
}



/* ------------ Add Single User Dialog ------------ */

interface AddSingleUserDialogProps {
    open: boolean
    onCancel: () => void
}

function AddSingleUserDialog(props: AddSingleUserDialogProps) {

    const [confirmLoading, setConfirmLoading] = useState(false)

    const marginDiv = () => <div style={{height: 12}} />

    const [addUserDialogForm] = Form.useForm()

    return <Modal
        title="添加新用户"
        centered={true}
        destroyOnClose={true}
        open={props.open}
        onCancel={props.onCancel}
        confirmLoading={ confirmLoading }
        maskClosable={false}
        onOk={() => {
            addUserDialogForm
                .validateFields()
                .then(values => {

                    let username = values.username as string
                    setConfirmLoading(true)
                    request({
                        url: 'user/createUsers',
                        method: 'post',
                        data: {
                            newUsers: [
                                {
                                    username: username
                                }
                            ]
                        }
                    }).then(res => {
                        res = res as IResponse
                        if (res.code !== HttpStatusCode.OK) {
                            message.error(res.msg)
                            return
                        }

                        let entry = res.data[username] as AddUsersUserEntity
                        if (entry.result === 'created') {
                            props.onCancel()
                            Modal.success({
                                title: "新用户：".concat(username),
                                content: `初始密码：${entry.passwd}`,
                                centered: true,
                            })
                        } else {
                            Modal.error({
                                title: '创建失败！',
                                content: entry.resultMsg,
                                centered: true
                            })
                        }
                    }).catch(err => {})
                    .finally(() => setConfirmLoading(false))
                }) // addUserDialogForm.then
                .catch(info => {
                    message.error(info)
                })
        }}
    >

        <Form
            form={addUserDialogForm}
            preserve={false}
        >
            <Form.Item
                label="用户名"
                name="username"
            >
                <Input />
            </Form.Item>

        </Form>

    </Modal>
}


/* ------------ Add Multiple Users Dialog ------------ */

interface AddUsersDialogProps {
    open: boolean
    onClose: () => void
}

interface AddUsersUserEntity {
    id: number | null
    username: string
    result: 'pending' | 'created' | 'failed'
    resultMsg: string | null
    group: number | null
    passwd: string | null
}

function AddUsersDialog(props: AddUsersDialogProps) {

    const [addUsersDialogConfirmLoading, setAddUsersDialogConfirmLoading] = useState(false)

    const [tableDataSource, setTableDataSource] = useState<AddUsersUserEntity[]>([])

    const [uploadButtonDisabled, setUploadButtonDisabled] = useState(true)


    function downloadDataSourceTable(dataSource: AddUsersUserEntity[]) {

        const header = ['id', 'username', 'passwd', 'result', 'resultMsg', 'group']
        const headerDisplay = {
            id: '用户ID',
            username: '用户名',
            result: '注册结果',
            resultMsg: '注册结果说明',
            group: '所属群组',
            passwd: '初始密码'
        }

        const data = [headerDisplay, ...dataSource]

        const sheet = XLSX.utils.json_to_sheet(data, {header: header, skipHeader: true})
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, sheet, '用户注册信息')
        
        // 下载

        XLSX.writeFile(workbook, `用户注册信息-${(new Date()).toISOString()}.xlsx`)
    }

    return <Drawer
        title="添加新用户（批量）"
        size='large'
        destroyOnClose={true}
        open={props.open}
        onClose={() => {
            props.onClose()
        }}
        maskClosable={false}
    ><Spin spinning={addUsersDialogConfirmLoading}>

        <Image
            width='100%'
            src='https://canfish.oss-cn-shanghai.aliyuncs.com/app/vesper-front/add-users-csv-example.webp'
            style={{
                borderRadius: 8,
                boxShadow: '0 0 8px 4px #6664'
            }}
            preview={false}
        />
        
        <p>将待注册用户信息整理到表格，导出为 CSV 格式。</p>
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
                    let dataSource = [] as AddUsersUserEntity[]
                    if (users !== null) {
                        for (let it of users) {
                            dataSource.push({
                                id: null,
                                username: it,
                                result: 'pending',
                                resultMsg: '未上传',
                                passwd: null,
                                group: null
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


        <Divider />

        <p>注册信息预览</p>

        <Table
            columns={[
                {
                    title: '用户名',
                    key: 'username',
                    dataIndex: 'username',
                    render: (_: any, record: AddUsersUserEntity) => {
                        let res = record.username
                        if (record.id !== null) {
                            res += ` (${record.id})`
                        }
                        return res
                    }
                },
                {
                    title: '初始密码',
                    dataIndex: 'passwd',
                    key: 'passwd',
                    render(it: string | null) {
                        return it === null ? '无' : it
                    }
                },
                {
                    title: '状态',
                    key: 'create-status',
                    dataIndex: 'create-status',
                    render: (_: any, record: AddUsersUserEntity) => {
                        const style = {} as React.CSSProperties

                        if (record.result === 'failed') {
                            style.color = '#ee3f4d'
                        } else if (record.result === 'created') {
                            style.color = '#41b349'
                        }

                        return <div style={style}>{record.resultMsg}</div>
                    }
                },
            ]}

            dataSource={tableDataSource}
        />

        <p>确认信息无误，点击“提交”即可开始注册。</p>
        <p>注册完毕，务必下载“注册信息表”，以保存用户初始密码。用户初始密码不会再次显示！</p>
        <p style={{ color: '#ee3f4d' }}><b>关闭本页后，用户初始密码不会再次显示！</b></p>

        <Button
            style={{
                width: '100%'
            }}
            type='primary'
            shape='round'
            disabled={uploadButtonDisabled}
            onClick={() => {
                setAddUsersDialogConfirmLoading(true)
                let requestUserEntities = [] as any[]

                for (let it of tableDataSource) {
                    requestUserEntities.push({
                        username: it.username,
                        group: null
                    })
                }

                request({
                    url: 'user/createUsers',
                    method: 'post',
                    data: {
                        newUsers: requestUserEntities
                    },
                    vfOpts: {
                        rejectNonOKResults: true,
                        autoHandleNonOKResults: true,
                        giveResDataToCaller: true
                    }
                }).then(res => {
                    const dataSource = [] as AddUsersUserEntity[]
                    for (let it of tableDataSource) {
                        let resEntity = res[it.username]
                        if (resEntity === undefined || resEntity === null) {
                            dataSource.push(it)
                            continue
                        }

                        resEntity = resEntity as AddUsersUserEntity
                        dataSource.push(resEntity)
                    }

                    setTableDataSource(dataSource)
                    downloadDataSourceTable(dataSource)
                }).catch(err => {}).finally(() => {
                    setAddUsersDialogConfirmLoading(false)
                })
            }}
        >
            提交
        </Button>

        <Button
            type='primary'
            shape='round'
            style={{
                width: '100%',
                marginTop: 16
            }}
            onClick={ () => downloadDataSourceTable(tableDataSource) }
        >
            下载注册信息表
        </Button>

        <div style={{ height: 32 }} />
    </Spin></Drawer>
}
