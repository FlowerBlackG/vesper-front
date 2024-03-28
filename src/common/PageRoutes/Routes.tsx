// SPDX-License-Identifier: MulanPSL-2.0
/*
 *
 * 创建于 2024年3月28日 上海市嘉定区
 */

import { Permission } from "../../api/Permissions"
import { AboutPage } from "../../pages/about/About"
import GroupsPage from "../../pages/groups/Groups"
import { IndexPage } from "../../pages/index/Index"
import InitPage from "../../pages/init/Init"
import LoginPage from "../../pages/login/Login"
import MyPermissionsPage from "../../pages/my-permissions/MyPermissions"
import MyProfilePage from "../../pages/my-profile/MyProfile"
import SeatsPage from "../../pages/seats/Seats"
import UserManagementPage from "../../pages/user-management/UserManagement"
import FluentUIEmojiProxy from "../../utils/FluentUIEmojiProxy"
import { globalData } from "../GlobalData"
import { PageRouteCategory, PageRouteData } from "./TypeDef"


const categoryKeys = {
    user: '_vc_user',
    seat: '_vc_seat',
    group: '_vc_group',
    vesperCenterControlPanel: '_vc_ctrlPanel',
}

export default class PageRoutes {
    private constructor() {}

    static routeCategories: Array<PageRouteCategory> = [
        {
            key: categoryKeys.vesperCenterControlPanel,
            label: '控制台'
        },
        {
            key: categoryKeys.seat,
            label: '主机环境'
        },
        {
            key: categoryKeys.user,
            label: '用户'
        },
        {
            key: categoryKeys.group,
            label: '群组'
        },
    ]
    
    /**
     * 页面路由表。
     * path: 页面路由。每个页面进入后，需要根据页面路由取到指向自己信息的实体结构。
     *       因此，修改 path 后，必须前往对应页面类修改相应代码。
     */
    static routes: Array<PageRouteData> = [
     
           
        {
            path: '/login',
            name: '登录',
            element: <LoginPage />,
            inFrame: false,
            showInSidebar: false,
            showInHomePage: false,
        },
    
           
        {
            path: '/init',
            name: '首次启动',
            element: <InitPage />,
            inFrame: false,
            showInSidebar: false,
            showInHomePage: false,
        },
    
        {
            path: '/',
            name: '首页',
            element: <IndexPage />,
            icon: FluentUIEmojiProxy.colorSvg('seedling_color'),
            inFrame: true,
            showInSidebar: true,
            showInHomePage: false,
        },
    
    
        {
            path: '/my-permissions',
            name: '我的权限',
            element: <MyPermissionsPage />,
            icon: FluentUIEmojiProxy.colorSvg('zipper-mouth_face_color'),
            inFrame: true,
            showInSidebar: true
        },
    
    
        {
            path: '/user-management',
            name: '用户管理',
            element: <UserManagementPage />,
            icon: FluentUIEmojiProxy.colorSvg('school_color'),
            inFrame: true,
            showInSidebar: true,
            category: categoryKeys.user,
            permissionCheckPassed: () => {
                if (globalData.userPermissions === null) {
                    return false
                }
    
                return globalData.userPermissions.includes(Permission.CREATE_AND_DELETE_USER)
            }
        },
    
        {
            path: '/seats',
            name: '桌面环境',
            element: <SeatsPage />,
            icon: FluentUIEmojiProxy.colorSvg('national_park_color'),
            inFrame: true,
            showInSidebar: true,
            category: categoryKeys.seat
        },

        {
            path: '/groups',
            name: '群组',
            element: <GroupsPage />,
            icon: FluentUIEmojiProxy.colorSvg('bagel_color'),
            inFrame: true,
            showInSidebar: true,
            category: categoryKeys.group,

        },
    
        {
            path: '/my-profile',
            name: '我',
            element: <MyProfilePage />,
            icon: FluentUIEmojiProxy.colorSvg('hatching_chick_color'),
            inFrame: true,
            showInSidebar: true,
            category: categoryKeys.vesperCenterControlPanel
        },
    
        {
            path: '/about',
            name: '关于',
            icon: FluentUIEmojiProxy.colorSvg('sparkles_color'),
            element: <AboutPage />,
            category: categoryKeys.vesperCenterControlPanel,
        },
        
    ]
    
    
}
