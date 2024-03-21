// SPDX-License-Identifier: MulanPSL-2.0

/* 上财果团团 */

/* 上财果团团 */

import React, { ForwardedRef, forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { FreeKeyObject } from '../../utils/FreeKeyObject';
import styles from './LayoutFrame.module.css'
import { globalData, resetGlobalData } from '../../common/GlobalData';
import URLNavigate from '../../utils/URLNavigate';
import { request } from '../../utils/request';
import MacroDefines from '../../common/MacroDefines';
import PageRouteManager, { PageRouteCategory, PageRouteData } from '../../common/PageRoutes';
import { useConstructor } from '../../utils/react-functional-helpers';
import { Button, Menu, Spin, message } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';


type LayoutFrameState = {
    pageTitle: string,
    menuItems: Array<any>,
    menuSelectedKey: string,

    redirecting: boolean,

    dataLoading: boolean,
    pageIcon: string
}

export type LayoutFrameHandle = {
    setDataLoading: (loading: boolean) => void
    setCurrentPageEntity: (entity: PageRouteData) => void
    setTitle: (title: string) => void
    update: () => void
}

const LayoutFrame = forwardRef<LayoutFrameHandle, any>((
    props: React.PropsWithChildren,
    ref: ForwardedRef<any>
) => {

    
    /**
     * 函数导出
     */
    useImperativeHandle(ref, () => ({
        setDataLoading,
        setCurrentPageEntity,
        setTitle,
        update,
    }))
    

    const [state, setState] = useState<LayoutFrameState>({
        pageTitle: '',
        menuItems: [],
        menuSelectedKey: '',

        redirecting: false,
        dataLoading: false,

        pageIcon: ''
    })

    useConstructor(constructor)
    function constructor() {
        loadMenu()
    }


    /**
     * 强制刷新组件。
     */
    function update() {
        loadMenu()
    }

    function setTitle(title: string) {
        state.pageTitle = title;
        setState({...state})
    }

    function setCurrentPageEntity(entity: PageRouteData) {

        state.pageTitle = entity.title!
        state.menuSelectedKey = entity.path

        let pageIcon = entity.icon
        if (pageIcon === undefined) {
            pageIcon = ''
        }

        state.pageTitle = entity.title!
        state.menuSelectedKey = entity.path
        state.dataLoading = false
        state.pageIcon = pageIcon
        setState({...state})
    }

    function setDataLoading(loading: boolean) {
        state.dataLoading = loading
        setState({...state})
    }


    function loadMenu() {
        let items = new Array<any>()
        let categoryChildren = new Map<string, Array<any> >()
        let categoryEntityMap = new Map<string, PageRouteCategory>()
        let categoryPushedSet = new Set<string>()

        // 准备子选项列表的 map。
        PageRouteManager.getCategories().forEach(category => {
            categoryChildren.set(category.key, new Array<PageRouteData>())
            categoryEntityMap.set(category.key, category)
        })

        // 遍历处理页面路由。
        PageRouteManager.getRoutes().forEach(route => {

            // 先判断是否要展示在菜单里。
            let shouldShow = route.showInSidebar

            shouldShow &&= route.permissionCheckPassed!()

            if (!shouldShow) {
                return // 跳过该路由项。
            }

            if (route.category == undefined) {
                
                // 直接添加。
                
                
                items.push({
                    key: route.path,
                    label: route.name
                })
                
            } else {
                // 希望添加到分类。
                let childrenList = categoryChildren.get(route.category)

                if (childrenList === undefined) {
                    console.error('undefined route group: ' + route.category)
                    message.error('网页内部错误。请咨询开发人员。')
                }

                childrenList!.push({
                    key: route.path,
                    label: route.name
                })

                if (!categoryPushedSet.has(route.category!)) {
                    categoryPushedSet.add(route.category!)
                    let categoryEntity = categoryEntityMap.get(route.category!)
                    
                    items.push({
                        key: categoryEntity?.key,
                        label: categoryEntity?.label,
                        type: 'group',
                        children: childrenList
                    })
                }

            }
            
        })

        state.menuItems = items
        setState({...state})
        
    }

    function navigator(path: string) {
        state.redirecting = false;
        setState({...state})

        return <Navigate to={'/' + path} />
    }

    useEffect(() => {
        if (currentRouteEntity !== undefined) {
            setCurrentPageEntity(currentRouteEntity)
        }

        if (pageTitle !== undefined) {
            setTitle(pageTitle)
        }
        
    }, [])

    const navigate = useNavigate()

    function sidebar(): React.ReactNode {

        return <div style={{
            width: 120,
            borderRight: '1px solid #0004',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative'
        }}>
            
            { /* 个人信息。 */ }
            <div style={{
                height: 48,
                width: '100%',
                fontSize: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                userSelect: 'none',
            }}>

                <img
                    src={ state.pageIcon }
                    style={{
                        width: '1.2em',
                        flexShrink: '0',
                        marginLeft: '0.4em'
                    }}
                />

                <div style={{ 
                    width: '0.4em',
                    flexShrink: '0'
                }} />

                <div style={{ 
                    flexShrink: '0',
                    flexGrow: 1,
                    width: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginRight: '0.4em'
                    }}>
                    { globalData.userEntity?.username }
                </div>
            </div>
        
            { /* 导航项。 */ }

            <div 
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    userSelect: 'none',
                    overflowX: 'hidden'
                }}

                className='overflow-y-overlay nicer-scrollbar'
            >

                <Menu 
                    items={ state.menuItems }
                    
                    onSelect={(event) => {

                        let entity = PageRouteManager.getRouteEntity(event.key)
                        
                        navigate({ pathname: entity.path })
                    }}

                    mode='inline'
                    selectedKeys={[ state.menuSelectedKey ]}
                />
   

            </div>

        </div>
    }

    function toolbar(): React.ReactNode {
        return <div style={{
            height: 42,
            display: 'flex',
            alignItems: 'center',
            color: '#000b',
            fontSize: 20,
            paddingLeft: 18,
            borderBottom: '1px solid #0004'
        }}>
            { state.pageTitle }
       
            <Spin 
                spinning={state.dataLoading}
                style={{
                    marginLeft: 10,
                }}
                size='small'
            />

            { /* 退出登录。 */ } 
            <Button 
                style={{
                    right: 8,
                    position: 'absolute'
                }}
                shape='round'
                icon={<LogoutOutlined />}
                onClick={() => {
                    request({
                        url: 'user/logout'
                    }).catch(err => {

                    }).finally(() => {
                        resetGlobalData()
                        navigate({ pathname: '/login' })
                    })
                }}
            > 退出登录 </Button>
             
        </div>
    }


    /* 渲染。 */

    return <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'row',
        overflow: 'hidden'
    }}>

        { /* 侧边栏区域。 */ }
        { sidebar() }

        { /* 右区域。 */ }

        <div style={{ 
            flex: 1,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column'
        }}>
            { /* 标题区域。 */ }
            { toolbar() }

            { /* 页面主元素区域。 */ }

            <div style={{
                flex: 1,
                position: 'relative',
            }}>
                { props.children }
            </div>
            
        </div>

        { /* 页面跳转。 */ }

        { state.redirecting &&
            navigator(state.menuSelectedKey)
        }

    </div>

})

  

let currentRouteEntity: PageRouteData | undefined = undefined
let pageTitle: string | undefined = undefined

export function loadPageToLayoutFrame(entity: PageRouteData) {
    currentRouteEntity = entity
    pageTitle = entity.title
    globalData.layoutFrameRef?.current?.setCurrentPageEntity(entity)
}

export function setLayoutFrameTitle(title: string) {
    pageTitle = title
    globalData.layoutFrameRef?.current?.setTitle(title)
}

export default LayoutFrame
