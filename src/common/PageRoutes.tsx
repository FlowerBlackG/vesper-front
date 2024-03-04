// SPDX-License-Identifier: MulanPSL-2.0
/* 上财果团团 */

import { ReactNode, useRef } from "react"
import LayoutFrame, { LayoutFrameHandle, loadPageToLayoutFrame } from "../components/LayoutFrame/LayoutFrame"
import { globalData } from "./GlobalData"
import { FreeKeyObject } from "../utils/FreeKeyObject"
import { AboutPage } from "../pages/about/About"


/**
 * 页面路由分类结构。
 */
export interface PageRouteCategory {
    key: string
    label: string
    title?: string
}

/**
 * 页面路由结构。
 */
export interface PageRouteData {

    /**
     * 页面路径，同时作为页面识别标记。需要不同。
     */
    path: string

    /**
     * 在侧边栏中展示的名称。
     */
    name: string

    icon?: string

    /**
     * 在页面标题上展示的名称。默认与 name 一致。
     */
    title?: string
    element: ReactNode

    inFrame?: boolean

    showInSidebar?: boolean

    category?: string

    permissionCheckPassed?: () => boolean
}


function isNullOrUndefined(e: any): boolean {
    return e === null || e === undefined
}

function preprocessRouteData(route: PageRouteData, pageRouteEntityMap: FreeKeyObject) {
    if (isNullOrUndefined(route.title)) {
        route.title = route.name
    }

    if (isNullOrUndefined(route.inFrame)) {
        route.inFrame = true
    }

    if (isNullOrUndefined(route.showInSidebar)) {
        route.showInSidebar = true
    }

    if (route.inFrame) {
        route.element = <LayoutFrame ref={ globalData.layoutFrameRef } >
            { route.element }
        </LayoutFrame>
    }

    if (isNullOrUndefined(route.permissionCheckPassed)) {
        route.permissionCheckPassed = () => { return true }
    }

    if (isNullOrUndefined(route.icon)) {
        route.icon = ''
    }

    pageRouteEntityMap[route.path] = route
}


function preprocess(
    pageRoutes: PageRouteData[], 
    map: FreeKeyObject,
    categories: PageRouteCategory[],
) {

    pageRoutes.forEach((route) => {
        preprocessRouteData(route, map)
    })

    categories.forEach((route) => {
        if (isNullOrUndefined(route.title)) {
            route.title = route.label
        }
    })
}

const categoryKeys = {
    user: '_vc_user',
    seat: '_vc_seat',
    vesperCenterControlPanel: '_vc_ctrlPanel',
}

export default class PageRouteManager {

    protected routeCategories: Array<PageRouteCategory> = [
        {
            key: categoryKeys.vesperCenterControlPanel,
            label: '控制台'
        }
    ]

    /**
     * 页面路由表。
     * path: 页面路由。每个页面进入后，需要根据页面路由取到指向自己信息的实体结构。
     *       因此，修改 path 后，必须前往对应页面类修改相应代码。
     */
    protected routes: Array<PageRouteData> = [
        {
            path: 'about',
            name: '关于',
            element: <AboutPage />,
            category: categoryKeys.vesperCenterControlPanel,
        }
        
    ]

    routeEntityMap: FreeKeyObject = {}

    protected constructor() {
        preprocess(this.routes, this.routeEntityMap, this.routeCategories)
    }

    protected static _instance: PageRouteManager

    public static getInstance(): PageRouteManager {
        
        if (!PageRouteManager._instance) {
            PageRouteManager._instance = new PageRouteManager()
        }

        return PageRouteManager._instance
    }

    public static instance(): PageRouteManager {
        return PageRouteManager.getInstance()
    }

    static getRouteEntity(path: string): PageRouteData {
        return this.instance().routeEntityMap[path]
    }

    static getRoutes(): PageRouteData[] {
        return this.instance().routes
    }

    static getCategories(): PageRouteCategory[] {
        return this.instance().routeCategories
    }
}
