/* SPDX-License-Identifier: MulanPSL-2.0 */

/*

    创建于2024年3月14日 上海市嘉定区
*/



import { Button, Card, Input, Modal, message } from 'antd'
import PageRouteManager from '../../common/PageRoutes/PageRouteManager'
import { useConstructor } from '../../utils/react-functional-helpers'
import styles from './Init.module.css'
import { useState } from 'react'
import { IResponse, request } from '../../utils/request'
import { HttpStatusCode } from '../../utils/HttpStatusCode'
import { UserEntity } from '../../api/Entities'
import DateTimeUtils from '../../utils/DateTimeUtils'
import { globalHooks } from '../../common/GlobalData'

interface InitPageState {
    username: string
    password: string
    passwordConfirm: string

    loading: boolean
}

export default function InitPage() {

    const pageEntity = PageRouteManager.getRouteEntity('/init')

    const [state, setState] = useState<InitPageState>({
        username: '',
        password: '',
        passwordConfirm: '',
        loading: false
    })

    useConstructor(constructor)
    function constructor() {

    }

    function createAdmin() {
        if (state.password !== state.passwordConfirm) {
            message.warning('两次输入的密码不一致！')
            return
        }

        state.loading = true
        setState({...state})

        request({
            url: 'user/createSuperUser',
            method: 'post',
            data: {
                'username': state.username,
                'password': state.password
            }
        })
            .then(res => {
                res = res as IResponse
                if (res.code !== HttpStatusCode.OK) {
                    message.error(res.msg)
                    return
                }

                let user = res.data as UserEntity
                
                Modal.success({
                    centered: true,
                    title: '注册成功',
                    content: <>
                        <p>用户名：{ user.username }</p>
                        <p>用户ID：{ user.id }</p>
                        <p>注册时间：{ DateTimeUtils.iso8601toHumanFriendly(user.createTime) }</p>
                    </>,
                    okText: '转向登录',
                    closable: false,
                    maskClosable: false,
                    onOk: () => { globalHooks.app.navigate!({ pathname: '/login' }) }
                })
            })
            .catch(() => {})
            .finally(() => {
                state.loading = false
                setState({...state})
            })

    }


    return <div style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,

        backgroundSize: 'cover',
        backgroundImage: 'url(https://canfish.oss-cn-shanghai.aliyuncs.com/app/vesper-front/20231208_123408.1.webp)',
        backgroundPosition: 'center',
    }}>

        <Card 
            hoverable
            style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',

                maxWidth: 450,
                width: '96%'
            }}
        >
            <p>这是你第一次访问落霞前厅。配置一个管理员账号吧~</p>


            <Input
                placeholder='管理员用户名'
                onChange={(event) => {
                    state.username = event.target.value
                    setState({...state})
                }}
            />
            
            <Input.Password
                placeholder='管理员密码'
                style={{ marginTop: 16 }}
                onChange={(event) => {
                    state.password = event.target.value
                    setState({...state})
                }}
            />


            <Input.Password
                placeholder='再输入一遍密码'
                style={{ marginTop: 16 }}
                onChange={(event) => {
                    state.passwordConfirm = event.target.value
                    setState({...state})
                }}
                status={ state.password === state.passwordConfirm ? '' : 'error' }
            />
            

            <Button
                type='primary'
                style={{
                    width: '100%',
                    marginTop: 16
                }}

                loading={state.loading}

                onClick={createAdmin}
            >
                立即创建
            </Button>
        </Card>
    </div>

}
