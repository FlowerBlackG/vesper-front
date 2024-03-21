/* SPDX-License-Identifier: MulanPSL-2.0 */

/*

    创建于2024年3月14日 上海市嘉定区
*/

import { useState } from 'react'
import { ensureGlobalData, globalData } from '../../common/GlobalData'
import PageRouteManager from '../../common/PageRoutes'
import { loadPageToLayoutFrame } from '../../components/LayoutFrame/LayoutFrame'
import './UserManagement.module.css'
import { useConstructor } from '../../utils/react-functional-helpers'
import { FloatButton, Form, Input, Modal, Spin, Table, TablePaginationConfig, message } from 'antd'
import { UserEntity } from '../../api/Entities'
import { IResponse, request } from '../../utils/request'
import { HttpStatusCode } from '../../utils/HttpStatusCode'
import DateTimeUtils from '../../utils/DateTimeUtils'
import { Permission } from '../../api/Permissions'
import { PlusOutlined, UserAddOutlined, UsergroupAddOutlined } from '@ant-design/icons'
import XlsxUtils from '../../utils/XlsxUtils'
import * as XLSX from 'xlsx'


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
]


export default function UserManagementPage() {
    const pageEntity = PageRouteManager.getRouteEntity('/user-management')

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
    const [addUserDialogConfirmLoading, setAddUserDialogConfirmLoading] = useState(false)
    const [addUsersDialogConfirmLoading, setAddUsersDialogConfirmLoading] = useState(false)

    /* constructor */

    function constructor() {
        loadPageToLayoutFrame(pageEntity)
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
    
    function filter(): React.ReactNode {
        return ''
    }



    const [addUserDialogForm] = Form.useForm()
    function addUserDialog() {

        const marginDiv = () => <div style={{height: 12}} />

        return <Modal
            title="添加新用户"
            centered={true}
            destroyOnClose={true}
            open={addUserDialogOpen}
            onCancel={() => setAddUserDialogOpen(false)}
            confirmLoading={ addUserDialogConfirmLoading }
            maskClosable={false}
            onOk={() => {
                addUserDialogForm
                    .validateFields()
                    .then(values => {

                        let username = values.username as string
                        setAddUserDialogConfirmLoading(true)
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

                            let entry = res.data[username]
                            if (entry.success) {
                                setAddUserDialogOpen(false)
                                Modal.success({
                                    title: "新用户：".concat(username),
                                    content: "初始密码：".concat(entry.passwd),
                                    centered: true,
                                })
                                loadTablePage()
                            } else {
                                Modal.error({
                                    title: '创建失败！',
                                    content: entry.msg,
                                    centered: true
                                })
                            }
                        }).catch(err => {})
                        .finally(() => setAddUserDialogConfirmLoading(false))
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



    function addUsersDialog() {
        return <Modal
            title="添加新用户（批量）"
            centered={true}
            destroyOnClose={true}
            open={addUsersDialogOpen}
            onCancel={() => setAddUsersDialogOpen(false)}
            confirmLoading={ addUsersDialogConfirmLoading }
            maskClosable={false}
        >
            敬请期待
        </Modal>
    }


    return <div style={{
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        position: 'absolute'
    }}><Spin spinning={loading}>
        
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
        { addUserDialog() }
        { addUsersDialog() }

    </Spin></div>
}
