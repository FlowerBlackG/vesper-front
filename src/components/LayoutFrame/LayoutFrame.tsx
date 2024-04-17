// SPDX-License-Identifier: MulanPSL-2.0

/* 上财果团团 */

import React, { ForwardedRef, forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { FreeKeyObject } from '../../utils/FreeKeyObject';
import styles from './LayoutFrame.module.css'
import { globalData, globalHooks, globalHooksRegistry, resetGlobalData } from '../../common/GlobalData';
import URLNavigate from '../../utils/URLNavigate';
import { request } from '../../utils/request';
import MacroDefines from '../../common/MacroDefines';
import PageRouteManager from '../../common/PageRoutes/PageRouteManager';
import { useConstructor } from '../../utils/react-functional-helpers';
import { Button, Flex, Menu, Spin, Tooltip, Typography, message } from 'antd';
import { ArrowLeftOutlined, LogoutOutlined } from '@ant-design/icons';
import { PageRouteCategory, PageRouteData } from '../../common/PageRoutes/TypeDef';
import { later } from '../../utils/later';


const { Text, Title, Paragraph } = Typography


export default function LayoutFrame(
    props: React.PropsWithChildren,
    ref: ForwardedRef<any>
) {


    /* states */

    const [showBackBtn, setShowBackBtn] = useState(false)
    const [pageTitle, setPageTitle] = useState('')
    const [pageDataLoading, setPageDataLoading] = useState(false)
    const [menuSelectedKey, setMenuSelectedKey] = useState('')
    const [pageIcon, setPageIcon] = useState('')
    const [menuItems, setMenuItems] = useState<any[]>([])

    /* constructor */

    useConstructor(constructor)
    function constructor() {

        const hooks = globalHooksRegistry.layoutFrame
        hooks.setDataLoading = setDataLoading
        hooks.setCurrentPageEntity = setCurrentPageEntity
        hooks.setTitle = setTitle
        hooks.forceUpdate = update
        

        loadMenu()
    }


    /**
     * 强制刷新组件。
     */
    function update() {
        loadMenu()
    }

    function setTitle(title: string) {
        setPageTitle(title)
    }

    function setCurrentPageEntity(entity: PageRouteData) {

        setTitle(entity.title!)
        setMenuSelectedKey(entity.path)

        let pageIcon = entity.icon
        if (pageIcon === undefined) {
            pageIcon = ''
        }
        setPageIcon(pageIcon)

        setPageDataLoading(false)

        document.title = entity.title!.concat(' - 落霞前厅')

        setShowBackBtn(entity.showBackButton!)
        
    }

    function setDataLoading(loading: boolean) {
        setPageDataLoading(loading)
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

        setMenuItems(items)
        
    }

    const navigate = useNavigate()

    function sidebar(): React.ReactNode {

        return <div style={{
            width: 120,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            flexShrink: 0,
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
                    src={ pageIcon }
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

                <Tooltip title={globalData.userEntity?.username}>
                    <div 
                        style={{ 
                            flexShrink: '0',
                            flexGrow: 1,
                            width: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            marginRight: '0.4em'
                        }}
                    >
                        { globalData.userEntity?.username }
                    </div>
                </Tooltip>
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
                    items={ menuItems }
                    style={{
                        borderRight: 'solid 0px #0000'
                    }}
                    onSelect={(event) => {

                        let entity = PageRouteManager.getRouteEntity(event.key)
                        
                        navigate({ pathname: entity.path })
                    }}

                    mode='inline'
                    selectedKeys={[ menuSelectedKey ]}
                />
   

            </div>

        </div>
    }

    function toolbar(): React.ReactNode {
        return <Flex style={{
            height: 42,
            alignItems: 'center',
            color: '#000b',
            fontSize: 20,
            paddingLeft: 18,
            flexShrink: 0,
        }}>

            { /* 返回按钮 */ }
            {
                showBackBtn &&
                <Button
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'absolute',
                    }}
                    shape='round'
                    icon={<ArrowLeftOutlined />}
                    onClick={ () => { navigate( -1 ) } }
                />
            }

            <div style={{ width: '100%', textAlign: 'center' }}>
                { pageTitle }
            </div>

            <Spin 
                spinning={ pageDataLoading }
                style={{
                    marginLeft: 10,
                }}
                size='small'
            />

            { /* 退出登录。 */ } 
            <Tooltip title='退出登录'><Button 
                style={{
                    marginRight: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
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
            /></Tooltip>
             
        </Flex>
    }


    /* 渲染。 */

    return <Flex style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
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
                marginTop: 2,
                marginLeft: 2,
                borderTopLeftRadius: 8,
                border: 'solid 1px #aaa2',
            }} className={styles.MainElementShadow}>
                { props.children }
            </div>
            
        </div>

        { /* 页面跳转。 */ }

    </Flex>

}


/**
 * 
 * @deprecated use globalHooks.layoutFrame.setCurrentPageEntity instead.
 */
export function loadPageToLayoutFrame(entity: PageRouteData) {
    globalHooks.layoutFrame.setCurrentPageEntity(entity)
}


/**
 * 
 * @deprecated use globalHooks.layoutFrame.setTitle instead
 */
export function setLayoutFrameTitle(title: string) {
    globalHooks.layoutFrame.setTitle(title)
}

